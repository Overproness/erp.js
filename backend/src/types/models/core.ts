// Core model type definitions

export interface ICompanyOwner {
  _id: string;
  removed: boolean;
  enabled: boolean;
  email: string;
  name: string;
  surname: string;
  photo: string;
  created: Date;
  lastLogin: Date;
  role: string;
  onboardingComplete: boolean;
  companyID: string;
}

export interface ICompanyOwnerPassword {
  _id: string;
  removed: boolean;
  user: string | ICompanyOwner;
  password: string;
  salt: string;
  emailToken: string;
  resetToken: string;
  emailVerified: boolean;
  authType: string;
  loggedSessions: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICounter {
  _id: string;
  name: string;
  owner: string | ICompanyOwner;
  year: number;
  sequence: number;
  companyID: string;
}

export interface ISetting {
  _id: string;
  removed: boolean;
  enabled: boolean;
  category: string;
  data: any;
  owner: string | ICompanyOwner;
  created: Date;
  createdBy: string;
  updated: Date;
  updatedBy: string;
  companyID: string;
}

export interface IUpload {
  _id: string;
  removed: boolean;
  enabled: boolean;
  modelName: string;
  fieldId: string;
  fileName: string;
  fileType: 'jpeg' | 'jpg' | 'png' | 'gif' | 'webp' | 'doc' | 'txt' | 'csv' | 'docx' | 'xls' | 'xlsx' | 'pdf' | 'zip' | 'rar' | 'mp4' | 'mov' | 'avi' | 'mp3' | 'm4a' | 'webm';
  isPublic: boolean;
  userID: string;
  isSecure: boolean;
  path: string;
  created: Date;
  companyID: string;
}
