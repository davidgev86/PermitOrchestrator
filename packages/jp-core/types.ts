export interface JurisdictionPack {
  id: string; // "us/md/gaithersburg"
  name: string;
  coverage: { 
    state: string; 
    county: string; 
    city?: string; 
    notes?: string 
  };
  portal: { 
    kind: "none" | "email" | "upload" | "accela_like" | "custom"; 
    baseUrl?: string; 
    auth?: "none" | "basic" | "form" 
  };
  permitTypes: Record<string, PermitTypeDef>;
  fees: FeeDef[];
  inspections: InspectionDef[];
}

export interface PermitTypeDef {
  label: string;
  forms: string[];        // templates under /forms
  attachments: string[];  // expected kinds under /attachments
  fields: Record<string, FieldRule>;
  submission: { 
    method: "portal" | "email" | "in_person"; 
    portalDriver?: string; 
    feeSchedule: string; 
    slaDays?: number 
  };
}

export interface FieldRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  options?: string[];
}

export interface FeeDef {
  id: string;
  name: string;
  amount: number;
  conditions?: Record<string, any>;
}

export interface InspectionDef {
  type: string;
  label: string;
  prerequisites?: string[];
  schedulingWindow?: {
    minDaysOut: number;
    maxDaysOut: number;
    availableDays: number[]; // 0=Sunday, 1=Monday, etc.
  };
}

export interface SubmissionPackage {
  caseId: string;
  forms: Record<string, any>;
  attachments: Record<string, string>;
}

export interface PortalStatus {
  status: string;
  lastUpdated: Date;
  raw: any;
}

export interface PortalDriver {
  submit(pkg: SubmissionPackage): Promise<{ portalCaseId: string; receiptUrl?: string }>;
  pollStatus(portalCaseId: string): Promise<PortalStatus>;
  requestInspection(
    portalCaseId: string, 
    opts: { type: string; window: { start: Date; end: Date } }
  ): Promise<{ confirmationId: string }>;
}
