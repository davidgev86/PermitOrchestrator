import { 
  orgs, 
  orgUsers, 
  projects, 
  locations,
  permitCases,
  inspections,
  documents,
  events,
  authSessions,
  type Org, 
  type InsertOrg,
  type OrgUser,
  type InsertOrgUser,
  type Project,
  type InsertProject,
  type Location,
  type InsertLocation,
  type PermitCase,
  type InsertPermitCase,
  type Inspection,
  type InsertInspection,
  type Document,
  type InsertDocument,
  type Event,
  type InsertEvent,
  type AuthSession,
  type InsertAuthSession
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Auth
  createAuthSession(session: InsertAuthSession): Promise<AuthSession>;
  getAuthSession(token: string): Promise<AuthSession | undefined>;
  deleteAuthSession(token: string): Promise<void>;
  
  // Organizations
  getOrg(id: string): Promise<Org | undefined>;
  createOrg(org: InsertOrg): Promise<Org>;
  getOrgsByUserEmail(email: string): Promise<Org[]>;
  
  // Org Users
  getOrgUser(userEmail: string, orgId: string): Promise<OrgUser | undefined>;
  createOrgUser(orgUser: InsertOrgUser): Promise<OrgUser>;
  getOrgUsersByOrg(orgId: string): Promise<OrgUser[]>;
  
  // Locations
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByOrg(orgId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Permit Cases
  getPermitCase(id: string): Promise<PermitCase | undefined>;
  getPermitCasesByProject(projectId: string): Promise<PermitCase[]>;
  getPermitCasesByOrg(orgId: string): Promise<PermitCase[]>;
  createPermitCase(permitCase: InsertPermitCase): Promise<PermitCase>;
  updatePermitCase(id: string, updates: Partial<InsertPermitCase>): Promise<PermitCase>;
  
  // Inspections
  getInspection(id: string): Promise<Inspection | undefined>;
  getInspectionsByCase(caseId: string): Promise<Inspection[]>;
  createInspection(inspection: InsertInspection): Promise<Inspection>;
  updateInspection(id: string, updates: Partial<InsertInspection>): Promise<Inspection>;
  
  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  getDocumentsByOrg(orgId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Events
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByEntity(entity: string, entityId: string): Promise<Event[]>;
  getEventsByOrg(orgId: string): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
}

export class DatabaseStorage implements IStorage {
  // Auth
  async createAuthSession(session: InsertAuthSession): Promise<AuthSession> {
    const [result] = await db.insert(authSessions).values(session).returning();
    return result;
  }

  async getAuthSession(token: string): Promise<AuthSession | undefined> {
    const [session] = await db.select().from(authSessions).where(eq(authSessions.token, token));
    return session || undefined;
  }

  async deleteAuthSession(token: string): Promise<void> {
    await db.delete(authSessions).where(eq(authSessions.token, token));
  }

  // Organizations
  async getOrg(id: string): Promise<Org | undefined> {
    const [org] = await db.select().from(orgs).where(eq(orgs.id, id));
    return org || undefined;
  }

  async createOrg(org: InsertOrg): Promise<Org> {
    const [result] = await db.insert(orgs).values(org).returning();
    return result;
  }

  async getOrgsByUserEmail(email: string): Promise<Org[]> {
    const results = await db
      .select({ org: orgs })
      .from(orgs)
      .innerJoin(orgUsers, eq(orgs.id, orgUsers.orgId))
      .where(eq(orgUsers.userEmail, email));
    return results.map(r => r.org);
  }

  // Org Users
  async getOrgUser(userEmail: string, orgId: string): Promise<OrgUser | undefined> {
    const [orgUser] = await db
      .select()
      .from(orgUsers)
      .where(and(eq(orgUsers.userEmail, userEmail), eq(orgUsers.orgId, orgId)));
    return orgUser || undefined;
  }

  async createOrgUser(orgUser: InsertOrgUser): Promise<OrgUser> {
    const [result] = await db.insert(orgUsers).values(orgUser).returning();
    return result;
  }

  async getOrgUsersByOrg(orgId: string): Promise<OrgUser[]> {
    return await db.select().from(orgUsers).where(eq(orgUsers.orgId, orgId));
  }

  // Locations
  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location || undefined;
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const [result] = await db.insert(locations).values(location).returning();
    return result;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByOrg(orgId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.orgId, orgId))
      .orderBy(desc(projects.createdAt));
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [result] = await db.insert(projects).values(project).returning();
    return result;
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [result] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Permit Cases
  async getPermitCase(id: string): Promise<PermitCase | undefined> {
    const [permitCase] = await db.select().from(permitCases).where(eq(permitCases.id, id));
    return permitCase || undefined;
  }

  async getPermitCasesByProject(projectId: string): Promise<PermitCase[]> {
    return await db
      .select()
      .from(permitCases)
      .where(eq(permitCases.projectId, projectId))
      .orderBy(desc(permitCases.createdAt));
  }

  async getPermitCasesByOrg(orgId: string): Promise<PermitCase[]> {
    return await db
      .select()
      .from(permitCases)
      .where(eq(permitCases.orgId, orgId))
      .orderBy(desc(permitCases.createdAt));
  }

  async createPermitCase(permitCase: InsertPermitCase): Promise<PermitCase> {
    const [result] = await db.insert(permitCases).values(permitCase).returning();
    return result;
  }

  async updatePermitCase(id: string, updates: Partial<InsertPermitCase>): Promise<PermitCase> {
    const [result] = await db
      .update(permitCases)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(permitCases.id, id))
      .returning();
    return result;
  }

  // Inspections
  async getInspection(id: string): Promise<Inspection | undefined> {
    const [inspection] = await db.select().from(inspections).where(eq(inspections.id, id));
    return inspection || undefined;
  }

  async getInspectionsByCase(caseId: string): Promise<Inspection[]> {
    return await db
      .select()
      .from(inspections)
      .where(eq(inspections.caseId, caseId))
      .orderBy(asc(inspections.createdAt));
  }

  async createInspection(inspection: InsertInspection): Promise<Inspection> {
    const [result] = await db.insert(inspections).values(inspection).returning();
    return result;
  }

  async updateInspection(id: string, updates: Partial<InsertInspection>): Promise<Inspection> {
    const [result] = await db
      .update(inspections)
      .set(updates)
      .where(eq(inspections.id, id))
      .returning();
    return result;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocumentsByOrg(orgId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.orgId, orgId))
      .orderBy(desc(documents.createdAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [result] = await db.insert(documents).values(document).returning();
    return result;
  }

  // Events
  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByEntity(entity: string, entityId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(and(eq(events.entity, entity), eq(events.entityId, entityId)))
      .orderBy(desc(events.createdAt));
  }

  async getEventsByOrg(orgId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.orgId, orgId))
      .orderBy(desc(events.createdAt));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [result] = await db.insert(events).values(event).returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
