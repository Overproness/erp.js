// Notification model type definition

export interface INotificationDeliveryStatus {
  app: { delivered: boolean; deliveredAt: Date; error: string };
  email: { delivered: boolean; deliveredAt: Date; messageId: string; error: string };
  sms: { delivered: boolean; deliveredAt: Date; messageId: string; error: string };
  push: { delivered: boolean; deliveredAt: Date; messageId: string; error: string };
}

export interface INotification {
  _id: string;
  recipientId: string;
  recipientModel: 'CompanyOwner' | 'User' | 'Team';
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  data: any;
  actionUrl: string;
  actionText: string;
  read: boolean;
  readAt: Date;
  channels: string[];
  deliveryStatus: INotificationDeliveryStatus;
  source: { module: string; entityId: string; entityType: string };
  owner: string;
  expiresAt: Date;
  deleted: boolean;
  deletedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
