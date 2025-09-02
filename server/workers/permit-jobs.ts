import { storage } from "../storage";
import { loadJurisdictionPack } from "../services/jp-loader";

export interface SubmissionPackage {
  caseId: string;
  forms: Record<string, any>;
  attachments: Record<string, string>; // filename -> S3 URI
}

export interface PortalStatus {
  status: string;
  lastUpdated: Date;
  raw: any;
}

// Job: Submit permit to portal
export async function submitPermitJob(caseId: string): Promise<void> {
  try {
    const permitCase = await storage.getPermitCase(caseId);
    if (!permitCase) {
      throw new Error(`Permit case not found: ${caseId}`);
    }

    // Load jurisdiction pack
    const jp = await loadJurisdictionPack(permitCase.ahjKey);
    
    // TODO: In real implementation, this would use the JP driver to submit
    // For now, simulate submission
    const portalCaseId = `${permitCase.ahjKey.replace(/\//g, '-').toUpperCase()}-${Date.now()}`;
    
    // Update case with portal ID
    const updatedCase = await storage.updatePermitCase(caseId, {
      status: "submitted",
      portalCaseId
    });

    // Create audit event
    await storage.createEvent({
      orgId: permitCase.orgId,
      entity: "PermitCase",
      entityId: caseId,
      actor: "system",
      action: "PERMIT_SUBMITTED",
      before: permitCase,
      after: updatedCase,
      evidence: `screenshots/submit-${caseId}.png` // S3 URI
    });

    console.log(`Permit case ${caseId} submitted successfully with portal ID: ${portalCaseId}`);
  } catch (error) {
    console.error(`Failed to submit permit case ${caseId}:`, error);
    
    // Create error event
    if (permitCase) {
      await storage.createEvent({
        orgId: permitCase.orgId,
        entity: "PermitCase",
        entityId: caseId,
        actor: "system",
        action: "SUBMIT_FAILED",
        after: { error: error instanceof Error ? error.message : "Unknown error" }
      });
    }
  }
}

// Job: Poll permit status
export async function pollStatusJob(caseId: string): Promise<void> {
  try {
    const permitCase = await storage.getPermitCase(caseId);
    if (!permitCase || !permitCase.portalCaseId) {
      throw new Error(`Invalid permit case for polling: ${caseId}`);
    }

    // Load jurisdiction pack
    const jp = await loadJurisdictionPack(permitCase.ahjKey);
    
    // TODO: In real implementation, this would use the JP driver to poll status
    // For now, simulate status polling
    const statuses = ["submitted", "pending", "rfi", "approved"];
    const currentIndex = statuses.indexOf(permitCase.status);
    const nextStatus = currentIndex < statuses.length - 1 ? statuses[currentIndex + 1] : permitCase.status;

    if (nextStatus !== permitCase.status) {
      const updatedCase = await storage.updatePermitCase(caseId, {
        status: nextStatus as any
      });

      // Create audit event
      await storage.createEvent({
        orgId: permitCase.orgId,
        entity: "PermitCase",
        entityId: caseId,
        actor: "system",
        action: "STATUS_UPDATED",
        before: permitCase,
        after: updatedCase,
        evidence: `screenshots/status-${caseId}-${Date.now()}.png`
      });
    }

    console.log(`Polled status for case ${caseId}: ${nextStatus}`);
  } catch (error) {
    console.error(`Failed to poll status for case ${caseId}:`, error);
  }
}

// Job: Schedule inspection
export async function scheduleInspectionJob(
  caseId: string, 
  inspectionType: string, 
  window: { start: Date; end: Date }
): Promise<void> {
  try {
    const permitCase = await storage.getPermitCase(caseId);
    if (!permitCase) {
      throw new Error(`Permit case not found: ${caseId}`);
    }

    // Create inspection record
    const inspection = await storage.createInspection({
      caseId,
      type: inspectionType,
      requestedAt: new Date(),
      scheduledFor: window.start
    });

    // TODO: In real implementation, this would use the JP driver to schedule
    const confirmationId = `CONF-${Date.now()}`;

    // Create audit event
    await storage.createEvent({
      orgId: permitCase.orgId,
      entity: "Inspection",
      entityId: inspection.id,
      actor: "system",
      action: "INSPECTION_SCHEDULED",
      after: { 
        ...inspection, 
        confirmationId,
        window
      }
    });

    console.log(`Inspection scheduled for case ${caseId}: ${confirmationId}`);
  } catch (error) {
    console.error(`Failed to schedule inspection for case ${caseId}:`, error);
  }
}
