// Task model type definitions

export interface ITaskComment {
  user: string;
  text: string;
  createdAt: Date;
}

export interface ITaskDocument {
  document: string;
  purpose: 'reference' | 'approval' | 'signing' | 'review' | 'attachment';
  status: string;
  rejectionReason?: string;
}

export interface ITask {
  _id: string;
  removed: boolean;
  enabled: boolean;
  title: string;
  description: string;
  assignedTo: string;
  assignedTeam: string;
  collaborators: any[];
  deadline: Date;
  dueDate: Date;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'pending_approval' | 'delegated';
  requiresApproval: boolean;
  delegatedBy: string;
  delegatedAt: Date;
  priority: 'low' | 'medium' | 'high';
  owner: string;
  createdBy: string;
  created: Date;
  updated: Date;
  isLocked: boolean;
  progress: number;
  startDate: Date;
  completedDate: Date;
  timeSpent: number;
  watchers: string[];
  delegationHistory: any[];
  comments: ITaskComment[];
  activityLog: any[];
  customer: string;
  invoice: string;
  quote: string;
  documents: ITaskDocument[];
  appointment: any;
  payment: any;
  relatedTo: any;
  tags: string[];
  attachments: any[];
  companyID: string;
}

export interface IReminderChannel {
  email?: { enabled: boolean; template?: string };
  sms?: { enabled: boolean; template?: string };
  push?: { enabled: boolean; template?: string };
  webhook?: { enabled: boolean; url?: string };
}

export interface IAutomatedReminder {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  type: 'appointment' | 'task' | 'deadline' | 'followup' | 'custom';
  targetType: string;
  targetId: string;
  recipients: any[];
  schedule: any;
  channels: IReminderChannel;
  conditions: any;
  status: string;
  scheduledFor: Date;
  sentAt: Date;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  retryPolicy: { maxRetries: number; delay: number };
  priority: string;
  tags: string[];
  customData: any;
  analytics: any;
  createdBy: string;
  created: Date;
  updated: Date;
}
