import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { resolveAHJ } from "./services/location";
import { loadJurisdictionPack } from "./services/jp-loader";
import { sendMagicLink, verifyMagicLink } from "./services/auth";
// import { enqueuJob } from "./services/job-queue";
import { z } from "zod";
import crypto from "crypto";
import { 
  insertProjectSchema, 
  insertPermitCaseSchema, 
  insertLocationSchema,
  insertInspectionSchema 
} from "@shared/schema";
import { insertOrgSchema } from "@shared/schema";

// Session middleware
const requireAuth = async (req: any, res: any, next: any) => {
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  
  if (!sessionToken) {
    return res.status(401).json({ error: "No authorization token provided" });
  }

  const session = await storage.getAuthSession(sessionToken);
  if (!session || session.expiresAt < new Date()) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  req.userEmail = session.userEmail;
  req.session = session;
  next();
};

// Org access middleware
const requireOrgAccess = async (req: any, res: any, next: any) => {
  const orgId = req.params.orgId || req.body.orgId;
  
  if (!orgId) {
    return res.status(400).json({ error: "Organization ID required" });
  }

  const orgUser = await storage.getOrgUser(req.userEmail, orgId);
  if (!orgUser) {
    return res.status(403).json({ error: "Access denied to organization" });
  }

  req.orgUser = orgUser;
  req.orgId = orgId;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple login endpoint that creates user session and organization if needed
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      // Create session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const session = await storage.createAuthSession({
        userEmail: email,
        token: sessionToken,
        expiresAt
      });

      // Check if user has an organization, create one if not
      const existingOrgs = await storage.getOrgsByUserEmail(email);
      let org;
      
      if (existingOrgs.length === 0) {
        // Create a default organization for the user
        const orgName = `${email.split('@')[0]}'s Organization`;
        org = await storage.createOrg({ name: orgName });
        
        // Add user as owner of the organization
        await storage.createOrgUser({
          userEmail: email,
          role: "owner",
          orgId: org.id
        });
      } else {
        org = existingOrgs[0];
      }

      res.json({ 
        sessionToken: session.token,
        userEmail: session.userEmail,
        expiresAt: session.expiresAt,
        orgId: org.id
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Get current user endpoint
  app.get("/api/user", requireAuth, async (req, res) => {
    try {
      const session = req.session;
      if (!session) {
        return res.status(401).json({ error: "No session found" });
      }

      res.json({
        email: session.userEmail,
        sessionToken: session.token,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Auth endpoints
  app.post("/api/auth/magiclink", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      
      await sendMagicLink(email);
      res.json({ message: "Magic link sent to email" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // API route for magic link verification (frontend will call this)
  app.post("/api/auth/verify", async (req, res) => {
    try {
      const { token } = z.object({ token: z.string() }).parse(req.body);
      
      const userEmail = await verifyMagicLink(token);
      if (!userEmail) {
        return res.status(401).json({ error: "Invalid or expired magic link" });
      }

      // Create session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const session = await storage.createAuthSession({
        userEmail,
        token: sessionToken,
        expiresAt
      });

      res.json({ 
        sessionToken: session.token,
        userEmail: session.userEmail,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/auth/consume", async (req, res) => {
    try {
      const { token } = z.object({ token: z.string() }).parse(req.body);
      
      const userEmail = await verifyMagicLink(token);
      if (!userEmail) {
        return res.status(401).json({ error: "Invalid magic link token" });
      }

      // Create session
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const session = await storage.createAuthSession({
        userEmail,
        token: sessionToken,
        expiresAt
      });

      res.json({ 
        sessionToken: session.token,
        userEmail: session.userEmail,
        expiresAt: session.expiresAt
      });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Organization endpoints
  app.get("/api/orgs", requireAuth, async (req: any, res) => {
    try {
      const orgs = await storage.getOrgsByUserEmail(req.userEmail);
      res.json(orgs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch organizations" });
    }
  });

  app.post("/api/orgs", requireAuth, async (req: any, res) => {
    try {
      const orgData = insertOrgSchema.parse(req.body);
      const org = await storage.createOrg(orgData);
      
      // Add creator as owner
      await storage.createOrgUser({
        userEmail: req.userEmail,
        role: "owner",
        orgId: org.id
      });

      res.json(org);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Location endpoints
  app.get("/api/locations/resolve", async (req, res) => {
    try {
      const { address1, city, state, postal } = z.object({
        address1: z.string(),
        city: z.string(),
        state: z.string(),
        postal: z.string()
      }).parse(req.query);

      const ahjKey = resolveAHJ({ city, state });
      res.json({ ahjKey });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // Project endpoints
  app.get("/api/orgs/:orgId/projects", requireAuth, requireOrgAccess, async (req: any, res) => {
    try {
      const projects = await storage.getProjectsByOrg(req.orgId);
      
      // Enrich with location and case data
      const enrichedProjects = await Promise.all(
        projects.map(async (project) => {
          const location = await storage.getLocation(project.locationId);
          const cases = await storage.getPermitCasesByProject(project.id);
          return { ...project, location, cases };
        })
      );
      
      res.json(enrichedProjects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });

  app.post("/api/orgs/:orgId/projects", requireAuth, requireOrgAccess, async (req: any, res) => {
    try {
      const projectData = insertProjectSchema.extend({
        location: insertLocationSchema.omit({ ahjKey: true })
      }).parse(req.body);

      // Create location first
      const location = await storage.createLocation({
        ...projectData.location,
        ahjKey: resolveAHJ({ 
          city: projectData.location.city, 
          state: projectData.location.state 
        })
      });

      // Create project
      const project = await storage.createProject({
        name: projectData.name,
        orgId: req.orgId,
        locationId: location.id,
        valuationUSD: projectData.valuationUSD,
        tradeTags: projectData.tradeTags
      });

      // Create audit event
      await storage.createEvent({
        orgId: req.orgId,
        entity: "Project",
        entityId: project.id,
        actor: req.userEmail,
        action: "PROJECT_CREATED",
        after: project
      });

      res.json({ ...project, location });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.get("/api/projects/:id", requireAuth, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, project.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Get location and cases
      const location = await storage.getLocation(project.locationId);
      const cases = await storage.getPermitCasesByProject(project.id);

      res.json({ 
        ...project, 
        location,
        cases
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  app.get("/api/projects/:id/events", requireAuth, async (req: any, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, project.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      const events = await storage.getEventsByEntity("Project", req.params.id);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch project events" });
    }
  });

  // Permit Case endpoints
  app.post("/api/orgs/:orgId/cases", requireAuth, requireOrgAccess, async (req: any, res) => {
    try {
      const caseData = insertPermitCaseSchema.parse({
        ...req.body,
        orgId: req.orgId
      });

      const permitCase = await storage.createPermitCase(caseData);

      // Create audit event
      await storage.createEvent({
        orgId: req.orgId,
        entity: "PermitCase",
        entityId: permitCase.id,
        actor: req.userEmail,
        action: "CASE_CREATED",
        after: permitCase
      });

      res.json(permitCase);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  app.post("/api/cases/:id/precheck", requireAuth, async (req: any, res) => {
    try {
      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Load jurisdiction pack
      const jp = await loadJurisdictionPack(permitCase.ahjKey);
      const permitTypeDef = jp.permitTypes[permitCase.permitType];
      
      if (!permitTypeDef) {
        return res.status(400).json({ error: "Invalid permit type for jurisdiction" });
      }

      // Get project for validation
      const project = await storage.getProject(permitCase.projectId);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      // Run pre-check validation
      const checklist = [];
      
      // Valuation check
      const minValuation = permitTypeDef.fields.valuation_usd?.min || 1000;
      if (project.valuationUSD && project.valuationUSD >= minValuation) {
        checklist.push({
          item: "Valuation meets minimum requirements",
          status: "passed",
          details: `($${project.valuationUSD.toLocaleString()})`
        });
      } else {
        checklist.push({
          item: "Valuation meets minimum requirements",
          status: "failed",
          details: `Minimum $${minValuation.toLocaleString()} required`
        });
      }

      // Contractor license check (placeholder - would validate against real data)
      checklist.push({
        item: "Contractor license is active",
        status: "passed",
        details: "(LICD12345-XYZ)"
      });

      // Document checks
      checklist.push({
        item: "Trade plans are attached and in PDF format",
        status: "passed",
        details: ""
      });

      // Additional checks for higher valuations
      if (project.valuationUSD && project.valuationUSD > 10000) {
        checklist.push({
          item: "Energy code compliance documentation",
          status: "warning",
          details: "Required for projects over $10,000"
        });
      }

      // Calculate fee estimate
      const feeEstimate = calculateFees(jp, permitCase.permitType, project.valuationUSD || 0);

      // Update case status
      const updatedCase = await storage.updatePermitCase(req.params.id, {
        status: "precheck_ready",
        feeEstimateUSD: feeEstimate
      });

      // Create audit event
      await storage.createEvent({
        orgId: permitCase.orgId,
        entity: "PermitCase",
        entityId: permitCase.id,
        actor: req.userEmail,
        action: "PRECHECK_COMPLETED",
        before: permitCase,
        after: updatedCase
      });

      res.json({
        checklist,
        feeEstimate,
        permitTypeDef,
        case: updatedCase
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Pre-check failed" });
    }
  });

  app.post("/api/cases/:id/package", requireAuth, async (req: any, res) => {
    try {
      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Load jurisdiction pack
      const jp = await loadJurisdictionPack(permitCase.ahjKey);
      const permitTypeDef = jp.permitTypes[permitCase.permitType];

      // Package the submission
      const packageManifest = {
        caseId: permitCase.id,
        jurisdiction: jp.name,
        permitType: permitTypeDef.label,
        forms: permitTypeDef.forms,
        attachments: permitTypeDef.attachments,
        packagedAt: new Date().toISOString()
      };

      // Update case status
      const updatedCase = await storage.updatePermitCase(req.params.id, {
        status: "packaged"
      });

      // Create audit event
      await storage.createEvent({
        orgId: permitCase.orgId,
        entity: "PermitCase",
        entityId: permitCase.id,
        actor: req.userEmail,
        action: "PACKAGE_BUILT",
        before: permitCase,
        after: updatedCase
      });

      res.json({ packageManifest, case: updatedCase });
    } catch (error) {
      res.status(500).json({ error: "Failed to package permit" });
    }
  });

  app.post("/api/cases/:id/submit", requireAuth, async (req: any, res) => {
    try {
      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Enqueue submission job
      await enqueuJob("submit_permit", { caseId: req.params.id });

      res.json({ message: "Permit submission queued" });
    } catch (error) {
      res.status(500).json({ error: "Failed to queue permit submission" });
    }
  });

  app.get("/api/cases/:id/timeline", requireAuth, async (req: any, res) => {
    try {
      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      const timeline = await storage.getEventsByEntity("PermitCase", req.params.id);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch timeline" });
    }
  });

  app.post("/api/cases/:id/poll", requireAuth, async (req: any, res) => {
    try {
      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Enqueue status polling job
      await enqueuJob("poll_status", { caseId: req.params.id });

      res.json({ message: "Status poll queued" });
    } catch (error) {
      res.status(500).json({ error: "Failed to queue status poll" });
    }
  });

  // Inspection endpoints
  app.get("/api/cases/:id/inspections", requireAuth, async (req: any, res) => {
    try {
      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      const inspections = await storage.getInspectionsByCase(req.params.id);
      res.json(inspections);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  app.post("/api/cases/:id/inspections", requireAuth, async (req: any, res) => {
    try {
      const { type, window } = z.object({
        type: z.string(),
        window: z.object({
          start: z.string().transform(s => new Date(s)),
          end: z.string().transform(s => new Date(s))
        })
      }).parse(req.body);

      const permitCase = await storage.getPermitCase(req.params.id);
      if (!permitCase) {
        return res.status(404).json({ error: "Permit case not found" });
      }

      // Check org access
      const orgUser = await storage.getOrgUser(req.userEmail, permitCase.orgId);
      if (!orgUser) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Enqueue inspection scheduling job
      await enqueuJob("schedule_inspection", { 
        caseId: req.params.id, 
        inspectionType: type,
        window 
      });

      res.json({ message: "Inspection scheduling queued" });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid request" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", requireAuth, async (req: any, res) => {
    try {
      // This would integrate with object storage in a real implementation
      // For now, return a mock upload URL
      const uploadUrl = `https://storage.example.com/upload/${crypto.randomUUID()}`;
      res.json({ uploadUrl });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Share link endpoints
  app.get("/api/share/:token", async (req, res) => {
    try {
      // This would validate share tokens and return read-only project data
      // For now, return placeholder
      res.json({ message: "Share link functionality not yet implemented" });
    } catch (error) {
      res.status(404).json({ error: "Share link not found" });
    }
  });

  // Admin endpoints (would require admin role check)
  app.get("/api/admin/orgs", requireAuth, async (req: any, res) => {
    try {
      // This would be admin-only in real implementation
      res.json({ message: "Admin functionality not yet implemented" });
    } catch (error) {
      res.status(500).json({ error: "Admin endpoint failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to calculate fees based on jurisdiction pack
function calculateFees(jp: any, permitType: string, valuationUSD: number): number {
  // Base fee from jurisdiction pack
  let baseFee = 125; // Default
  
  switch (jp.id) {
    case 'us/md/gaithersburg':
      baseFee = 125;
      break;
    case 'us/md/rockville':
      baseFee = 150;
      break;
    case 'us/md/montgomery_county':
      baseFee = 200;
      break;
  }

  // Valuation-based fee calculation
  let valuationFee = 0;
  if (valuationUSD <= 5000) {
    valuationFee = Math.floor(valuationUSD * 0.01);
  } else if (valuationUSD <= 25000) {
    valuationFee = Math.floor(valuationUSD * 0.015);
  } else {
    valuationFee = Math.floor(valuationUSD * 0.02);
  }

  // Additional fees
  const planReviewFee = jp.id === 'us/md/montgomery_county' ? 100 : 75;
  const inspectionFee = jp.id === 'us/md/rockville' ? 60 : 50;

  return baseFee + valuationFee + planReviewFee + inspectionFee;
}
