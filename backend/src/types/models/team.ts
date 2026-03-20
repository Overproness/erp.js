// Team model type definitions

export interface ITeamMember {
  user: string;
  role: 'member' | 'lead' | 'admin' | 'manager';
  joinedAt: Date;
}

export interface ITeamPermissions {
  view: string[];
  edit: string[];
  create: string[];
  delete: string[];
}

export interface ITeam {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  created: Date;
  updated: Date;
  owner: string;
  createdBy: string;
  teamLead: string;
  members: ITeamMember[];
  permissions: ITeamPermissions;
  settings: {
    allowCrossTeamCollaboration: boolean;
    requireApprovalForTasks: boolean;
    autoAssignTasks: boolean;
    requiresApproval: boolean;
  };
  companyID: string;
}

export interface IUserPermissions {
  Invoices: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Clients: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Payments: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Quotes: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Offers: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Marketing: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Reputation: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Tasks: { view: boolean; create: boolean; edit: boolean; delete: boolean; assign: boolean; approve: boolean };
  Documents: { view: boolean; create: boolean; edit: boolean; delete: boolean; share: boolean };
  Reports: { view: boolean };
  Analytics: { view: boolean };
  Settings: { view: boolean; edit: boolean };
  Notifications: { view: boolean; manage: boolean };
  'AI Assistants': { view: boolean; use: boolean; configure: boolean };
  Taxes: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Currency: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  Teams: { view: boolean; create: boolean; edit: boolean; delete: boolean; manage: boolean };
  Workflows: { view: boolean; create: boolean; edit: boolean; delete: boolean; execute: boolean };
  'Social Media': { view: boolean; create: boolean; edit: boolean; delete: boolean; publish: boolean };
  'URL Management': { view: boolean; create: boolean; edit: boolean; delete: boolean; analytics: boolean };
}

export interface IUser {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  role: 'member' | 'lead' | 'admin' | 'editor' | 'owner';
  team: string | ITeam;
  companyOwner: string;
  companyID: string;
  permissions: IUserPermissions;
  effectivePermissions: any;
  invitationToken: string;
  invitationExpires: Date;
  isInvitationAccepted: boolean;
  invitedBy: string;
  invitedAt: Date;
  joinedAt: Date;
  lastLogin: Date;
  isAnonymized: boolean;
  anonymizationDate: Date;
  anonymizationReason: string;
  consentPreferences: {
    marketing: boolean;
    analytics: boolean;
    thirdPartySharing: boolean;
  };
  created: Date;
  updated: Date;
}
