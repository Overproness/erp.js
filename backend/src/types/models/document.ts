// Document model type definitions

export interface IDocumentCollaborator {
  user: string;
  permissions: ('read' | 'write' | 'edit' | 'comment' | 'delete' | 'share')[];
}

export interface IDocument {
  _id: string;
  title: string;
  documentType: string;
  description: string;
  tags: string[];
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  expiryDate: Date;
  owner: string;
  collaborators: IDocumentCollaborator[];
  version: number;
  versionHistory: any[];
  createdBy: string;
  created: Date;
  updatedBy: string;
  updated: Date;
  removed: boolean;
  removedBy: string;
  removedAt: Date;
  companyID: string;
  extractedText: string;
  textExtractionStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'not_supported';
  textExtractionError: string;
  extractionMetadata: any;
  spreadsheetData: any;
  aiSuggestedTags: string[];
  aiSummary: string;
  aiAnalyzedAt: Date;
}

export interface IDocumentAudit {
  _id: string;
  document: string | IDocument;
  action: 'created' | 'viewed' | 'downloaded' | 'updated' | 'deleted' | 'restored' | 'permission_changed' | 'version_created' | 'reverted' | 'compliance_updated' | 'signed';
  user: string;
  ipAddress: string;
  userAgent: string;
  details: any;
  created: Date;
  companyID: string;
}

export interface IDocumentCompliance {
  _id: string;
  document: string | IDocument;
  complianceStatus: 'compliant' | 'non_compliant' | 'review_required' | 'exempt';
  standard: string;
  status: string;
  checkedBy: string;
  checkedAt: Date;
  findings: any[];
  expiryDate: Date;
  regulations: any[];
  dataRetention: any;
  containsSensitiveData: boolean;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' | 'unclassified';
  lastReviewedBy: string;
  lastReviewedAt: Date;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IDocumentVersion {
  _id: string;
  document: string | IDocument;
  version: string;
  versionNumber: number;
  title: string;
  content: string;
  documentType: string;
  description: string;
  tags: string[];
  fileName: string;
  fileType: string;
  filePath: string;
  fileSize: number;
  expiryDate: Date;
  createdBy: string;
  author: string;
  changeDescription: string;
  comment: string;
  changes: any;
  isActive: boolean;
  conflictResolution: any;
  removed: boolean;
  companyID: string;
}
