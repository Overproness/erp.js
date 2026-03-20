// Campaign model type definitions

export interface ICampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  revenue: number;
  lastUpdated: Date;
}

export interface ICampaign {
  _id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'push' | 'social' | 'retargeting' | 'multi_channel';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed' | 'archived';
  startDate: Date;
  endDate: Date;
  isRecurring: boolean;
  recurringPattern: any;
  targetSegments: string[];
  excludeSegments: string[];
  content: { subject: string; template: string; customHtml: string; templateVariables: any; mediaAttachments: any[] };
  channels: { type: string; enabled: boolean; configuration: any; deliveryOrder: number; delayHours: number }[];
  triggers: string[];
  metrics: ICampaignMetrics;
  aiOptimization: { enabled: boolean; optimizeFor: string; testingPercent: number; variants: any[]; winningVariant: string };
  tracking: {
    utmSource: string;
    utmMedium: string;
    utmCampaign: string;
    utmTerm: string;
    utmContent: string;
    googleAnalytics: { enabled: boolean; trackingId: string };
  };
  owner: string;
  createdBy: string;
  createdByModel: 'CompanyOwner' | 'User';
  removed: boolean;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface ITriggerEventCondition {
  eventType: string;
  eventName: string;
  propertyConditions: any[];
  frequency: { count: number; timeframe: { value: number; unit: string }; operator: string; minCount: number; maxCount: number };
}

export interface ITriggerAction {
  actionType: string;
  config: any;
  executionOrder: number;
}

export interface ITriggerRule {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  triggerType: 'behavior' | 'segment_entry' | 'segment_exit' | 'time_based' | 'campaign_event' | 'api_call' | 'custom';
  eventConditions: ITriggerEventCondition[];
  segmentCondition: { segment: string; event: string };
  timeCondition: any;
  campaignCondition: { campaign: string; event: string };
  delayExecution: { enabled: boolean; delay: { value: number; unit: string } };
  actions: ITriggerAction[];
  filterConditions: { requiredSegments: string[]; excludedSegments: string[]; customerProperties: any[] };
  limits: {
    maxExecutionsPerCustomer: { count: number; timeframe: { value: number; unit: string } };
    maxTotalExecutions: number;
    coolingPeriod: { value: number; unit: string };
  };
  metrics: { timesTriggered: number; actionsExecuted: number; lastTriggered: Date; successRate: number };
  createdAt: Date;
  updatedAt: Date;
}
