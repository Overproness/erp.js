// Financial model type definitions

export interface IPaymentMode {
  _id: string;
  name: string;
  description: string;
  isDefault: boolean;
  enabled: boolean;
  owner: string;
  removed: boolean;
  created: Date;
  createdBy: string;
  updated: Date;
  updatedBy: string;
  companyID: string;
}

export interface ITaxes {
  _id: string;
  name: string;
  taxValue: number;
  taxRate: number;
  enabled: boolean;
  isDefault: boolean;
  owner: string;
  removed: boolean;
  created: Date;
  createdBy: string;
  updated: Date;
  updatedBy: string;
  companyID: string;
}

export interface IBusiness {
  _id: string;
  name: string;
  owner: string;
  createdBy: string;
  createdByModel: string;
  type: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates: { latitude: number; longitude: number };
  };
  contact: { name: string; title: string; email: string; phone: string };
  branding: { logoUrl: string; primaryColor: string; secondaryColor: string; fonts: { main: string; headings: string } };
  socialLinks: { website: string; facebook: string; twitter: string; instagram: string; linkedin: string; youtube: string };
  settings: {
    reviewSettings: {
      autoRespond: boolean;
      notifyOnReview: boolean;
      reminderSettings: { enabled: boolean; frequency: string };
    };
    notificationSettings: {
      email: { enabled: boolean; recipients: string[] };
      sms: { enabled: boolean; recipients: string[] };
    };
  };
  removed: boolean;
  companyID: string;
  createdAt: Date;
  updatedAt: Date;
}
