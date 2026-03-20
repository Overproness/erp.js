// Interaction model type definition

export interface IInteraction {
  _id: string;
  client: string;
  owner: string;
  companyID: string;
  type: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  subject: string;
  description: string;
  notes: string;
  outcome: string;
  sentiment: string;
  sentimentScore: number;
  duration: number;
  responseTime: number;
  engaged: boolean;
  relatedQuote: string;
  relatedInvoice: string;
  relatedCampaign: string;
  relatedProduct: string;
  assignedTo: string;
  participants: string[];
  interactionDate: Date;
  source: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term: string;
    utm_content: string;
    referrer: string;
    landing_page: string;
  };
  attachments: { filename: string; url: string; type: string; size: number }[];
  followUpRequired: boolean;
  followUpDate: Date;
  followUpCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
