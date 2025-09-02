import { PortalDriver, SubmissionPackage, PortalStatus } from "../../types";

export const driver: PortalDriver = {
  async submit(pkg: SubmissionPackage): Promise<{ portalCaseId: string; receiptUrl?: string }> {
    console.log(`Submitting permit package for case ${pkg.caseId} to Rockville portal`);
    
    const portalCaseId = `ROC-${Date.now()}-${pkg.caseId.slice(-6)}`;
    
    return { 
      portalCaseId, 
      receiptUrl: `screenshots/submit-${pkg.caseId}.png` 
    };
  },

  async pollStatus(portalCaseId: string): Promise<PortalStatus> {
    console.log(`Polling status for portal case ${portalCaseId}`);
    
    const statuses = ["Submitted", "Plan Review", "Approved for Construction", "Ready for Inspection"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      lastUpdated: new Date(),
      raw: { portalResponse: `Status: ${randomStatus}` }
    };
  },

  async requestInspection(
    portalCaseId: string, 
    opts: { type: string; window: { start: Date; end: Date } }
  ): Promise<{ confirmationId: string }> {
    console.log(`Requesting ${opts.type} inspection for portal case ${portalCaseId}`);
    
    const confirmationId = `ROCK-INSP-${Date.now()}`;
    
    return { confirmationId };
  }
};

export default driver;
