// Miscellaneous model type definitions

export interface ISavedSearch {
  _id: string;
  name: string;
  description: string;
  entityType: 'Client' | 'Invoice' | 'Quote' | 'Payment' | 'Document' | 'Task' | 'User' | 'Team';
  searchCriteria: any;
  filters: any;
  sortBy: { field: string; order: 'asc' | 'desc' };
  isPublic: boolean;
  isDefault: boolean;
  tags: string[];
  owner: string;
  companyID: string;
  createdBy: string;
  updatedBy: string;
  enabled: boolean;
  removed: boolean;
  removedAt: Date;
  removedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchHistory {
  _id: string;
  userId: string;
  companyOwner: string;
  searchQuery: any;
  resultCount: number;
  executionTime: number;
  timestamp: Date;
  companyID: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISharedResourcePermission {
  view: boolean;
  edit: boolean;
  delete: boolean;
  share: boolean;
}

export interface ISharedResource {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  type: 'document' | 'tool' | 'equipment' | 'facility' | 'software' | 'other';
  status: 'available' | 'in-use' | 'maintenance' | 'unavailable';
  created: Date;
  updated: Date;
  owner: string;
  createdBy: string;
  sharedWith: { team: string; user: string; permissions: ISharedResourcePermission; sharedAt: Date; sharedBy: string }[];
  currentUser: string;
  reservations: { user: string; team: string; startTime: Date; endTime: Date; purpose: string; status: string; reservedAt: Date }[];
  usage: { totalHours: number; currentSession: { startTime: Date; user: string }; history: any[] };
  settings: { requireApproval: boolean; maxReservationDuration: number; allowConcurrentUse: boolean; notifyOnAvailable: boolean };
  tags: string[];
  metadata: {
    location: string;
    capacity: number;
    specifications: any;
    manufacturer: string;
    model: string;
    serialNumber: string;
    purchaseDate: Date;
    warrantyExpiry: Date;
  };
  companyID: string;
}

export interface IAppointmentAttendee {
  name: string;
  email: string;
  phone: string;
  status: string;
  userId: string;
  reminders: { email: boolean; sms: boolean };
}

export interface IAppointment {
  _id: string;
  removed: boolean;
  enabled: boolean;
  title: string;
  description: string;
  type: 'consultation' | 'meeting' | 'demo' | 'support' | 'training' | 'interview' | 'followup' | 'other';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
  startTime: Date;
  endTime: Date;
  duration: number;
  timezone: string;
  location: { type: string; address: string; meetingUrl: string; phone: string; instructions: string };
  organizer: string;
  attendees: IAppointmentAttendee[];
  reminders: { type: string; timing: number; sent: boolean; sentAt: Date; status: string; error: string }[];
  bookingUrl: { shortCode: string; urlId: string; expiresAt: Date; allowReschedule: boolean; allowCancel: boolean };
  businessProcess: string;
  workflow: string;
  relatedTask: string;
  relatedClient: string;
  relatedLead: string;
  notes: string;
  privateNotes: string;
  tags: string[];
}
