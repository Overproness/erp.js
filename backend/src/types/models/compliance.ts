// Compliance model type definitions

export interface IConsentRecord {
  _id: string;
  user: string;
  purpose: string;
  consentGiven: boolean;
  dataCategories: string[];
  expiration: Date | null;
  recordedBy: string;
  ipAddress: string;
  created: Date;
  updated: Date;
  additionalInformation: any;
  companyID: string;
}

export interface IDataRetentionPolicy {
  _id: string;
  dataType: string;
  retentionPeriod: number;
  automaticDeletion: boolean;
  description: string;
  applicableRegions: string[];
  createdBy: string;
  created: Date;
  updated: Date;
  status: 'active' | 'inactive' | 'draft';
  companyID: string;
}

export interface IAuditTrail {
  _id: string;
  documentId: string;
  action: string;
  user: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: any;
  companyID: string;
}
