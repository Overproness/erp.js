// Chat model type definitions

export interface IChatMessage {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  companyID: string;
  isRead: boolean;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatRoomMessage {
  sender: 'employee' | 'customer';
  senderName: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl: string;
  fileName: string;
  timestamp: Date;
  read: boolean;
}

export interface IChatRoom {
  _id: string;
  roomId: string;
  employee: string;
  employeeModel: 'User' | 'CompanyOwner';
  customer: string;
  customerName: string;
  employeeName: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'archived';
  messages: IChatRoomMessage[];
  employeeOnline: boolean;
  customerOnline: boolean;
  lastEmployeeActivity: Date;
  lastCustomerActivity: Date;
  createdBy: string;
  accessUrl: string;
  accessToken: string;
  totalMessages: number;
  employeeMessageCount: number;
  customerMessageCount: number;
  averageResponseTime: number;
  expiresAt: Date;
  allowFileSharing: boolean;
  tags: string[];
  closedAt: Date;
  closedBy: string;
  closeReason: string;
  enabled: boolean;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatQueue {
  _id: string;
  owner: string;
  user: string;
  message: string;
  context: { module: string; entityId: string; data: any };
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response: string;
  error: string;
  assistantId: string;
  attempts: number;
  maxAttempts: number;
  processedAt: Date;
  removed: boolean;
  enabled: boolean;
  created: Date;
  updated: Date;
}
