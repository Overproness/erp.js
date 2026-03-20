// CRM model type definitions

export interface ILeadScoreBreakdown {
  demographic: number;
  behavioral: number;
  engagement: number;
  value: number;
  interest: number;
}

export interface IClient {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  phone: string;
  country: string;
  address: string;
  email: string;
  companyID: string;
  customerType: string;
  industry: string;
  size: string;
  tags: string[];
  demographics: any;
  behavior: any;
  customerValue: any;
  touchpoints: any[];
  assignedTeam: string;
  leadScore: number;
  leadScoreBreakdown: ILeadScoreBreakdown;
  qualification: 'unqualified' | 'marketing_qualified' | 'sales_qualified' | 'opportunity' | 'customer';
  created: Date;
  updated: Date;
}

export interface IInvoiceItem {
  itemName: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IRecurringConfig {
  frequency: string;
  interval: number;
  nextDate: Date;
  pausedUntil?: Date;
}

export interface IInvoice {
  _id: string;
  removed: boolean;
  enabled: boolean;
  companyID: string;
  number: number;
  year: number;
  content: string;
  isRecurring: boolean;
  recurringConfig: IRecurringConfig;
  parentRecurringInvoice: string;
  generatedFromRecurring: boolean;
  date: Date;
  expiredDate: Date;
  client: string | IClient;
  converted: boolean;
  items: IInvoiceItem[];
  taxRate: number;
  subTotal: number;
  taxTotal: number;
  total: number;
  currency: string;
  credit: number;
  discount: number;
  payment: any[];
  paymentStatus: 'unpaid' | 'paid' | 'partially';
  isOverdue: boolean;
  approved: boolean;
  notes: string;
  status: 'draft' | 'pending' | 'sent' | 'refunded' | 'cancelled' | 'on hold';
  pdf: string;
  files: string[];
  updated: Date;
  created: Date;
}

export interface IQuoteDeliveryHistory {
  channel: string;
  result: string;
  recipient: any;
  sentAt: Date;
}

export interface IQuote {
  _id: string;
  removed: boolean;
  enabled: boolean;
  companyID: string;
  number: number;
  year: number;
  content: string;
  date: Date;
  expiredDate: Date;
  client: string | IClient;
  items: IInvoiceItem[];
  taxRate: number;
  subTotal: number;
  taxTotal: number;
  total: number;
  credit: number;
  currency: string;
  discount: number;
  notes: string;
  status: 'draft' | 'pending' | 'sent' | 'accepted' | 'declined' | 'cancelled' | 'on hold';
  approved: boolean;
  isExpired: boolean;
  pdf: string;
  files: string[];
  deliveryHistory: IQuoteDeliveryHistory[];
  updated: Date;
  created: Date;
}

export interface IPayment {
  _id: string;
  removed: boolean;
  enabled: boolean;
  number: number;
  client: string | IClient;
  invoice: string | IInvoice;
  date: Date;
  amount: number;
  currency: string;
  paymentMode: string;
  ref: string;
  description: string;
  updated: Date;
  created: Date;
  companyID: string;
}

export interface IProject {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created: Date;
  updated: Date;
  startDate: Date;
  endDate: Date;
  deadline: Date;
  owner: string;
  createdBy: string;
  projectManager: string;
  teams: any[];
  members: any[];
  budget: { amount: number; currency: string; spent: number };
  progress: number;
  tags: string[];
  attachments: any[];
  settings: any;
  companyID: string;
}

export interface ISchedule {
  _id: string;
  removed: boolean;
  enabled: boolean;
  title: string;
  description: string;
  type: 'meeting' | 'task' | 'event' | 'deadline' | 'reminder';
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created: Date;
  updated: Date;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  recurring: any;
  owner: string;
  createdBy: string;
  organizer: string;
  attendees: any[];
  teams: any[];
  location: any;
  resources: any[];
  reminders: any[];
  attachments: any[];
  visibility: string;
  settings: any;
  tags: string[];
  metadata: any;
  companyID: string;
}
