// Marketing model type definitions

export interface ICustomerBehavior {
  _id: string;
  customer: string;
  anonymousId: string;
  eventType: string;
  eventName: string;
  timestamp: Date;
  properties: any;
  url: string;
  urlPath: string;
  referrer: string;
  campaign: string;
  source: string;
  medium: string;
  context: {
    ip: string;
    userAgent: string;
    device: string;
    browser: string;
    os: string;
    country: string;
    region: string;
    city: string;
    language: string;
  };
  sessionId: string;
  previousEvents: any[];
  valueData: { currency: string; revenue: number; value: number; items: any[] };
  processingStatus: string;
  triggeredActions: { triggerId: string; actionType: string; executedAt: Date; success: boolean; details: any }[];
  owner: string;
  removed: boolean;
  companyID: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerFollowUp {
  _id: string;
  owner: string;
  customer: string;
  type: 'email' | 'sms' | 'call' | 'task' | 'notification';
  reason: string;
  relatedEntity: { entityType: string; entityId: string };
  scheduledDate: Date;
  executedAt: Date;
  nextFollowUpDate: Date;
  subject: string;
  message: string;
  template: string;
  status: string;
  customerResponse: { responded: boolean; responseDate: Date; responseText: string; sentiment: string };
  isAutomated: boolean;
  automationRule: string;
  sequenceId: string;
  sequenceStep: number;
  metrics: { opened: boolean; openedAt: Date; clicked: boolean; clickedAt: Date; converted: boolean; convertedAt: Date };
  attempts: number;
  maxAttempts: number;
  lastError: string;
  priority: string;
  removed: boolean;
  enabled: boolean;
  created: Date;
  updated: Date;
  createdBy: string;
}

export interface ICustomerJourneyStage {
  stage: string;
  enteredAt: Date;
  exitedAt: Date;
  duration: number;
  touchpoints: string[];
  notes: string;
  milestone: string;
  stageScore: number;
}

export interface ICustomerJourney {
  _id: string;
  client: string;
  owner: string;
  companyID: string;
  currentStage: 'awareness' | 'consideration' | 'decision' | 'purchase' | 'retention' | 'advocacy' | 'churned';
  stages: ICustomerJourneyStage[];
  milestones: { name: string; description: string; achievedAt: Date; relatedInteraction: string }[];
  metrics: {
    totalTouchpoints: number;
    totalInteractions: number;
    journeyDuration: number;
    stageTransitions: number;
    averageStageTime: number;
    conversionRate: number;
    engagementScore: number;
    dropOffStage: string;
    riskScore: number;
  };
  journeyPath: { source: string; medium: string; campaign: string; timestamp: Date; interaction: string }[];
  recommendations: { action: string; priority: string; reason: string; suggestedAt: Date; completed: boolean; completedAt: Date }[];
  journeyStartDate: Date;
  journeyEndDate: Date;
  status: 'active' | 'completed' | 'stalled' | 'churned';
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerSegmentCondition {
  field: string;
  operator: string;
  value: any;
  valueList: any[];
  minValue: any;
  maxValue: any;
  lookbackDays: number;
  frequency: { count: number; operator: string; minCount: number; maxCount: number };
}

export interface ICustomerSegment {
  _id: string;
  name: string;
  description: string;
  type: 'static' | 'dynamic' | 'behavioral' | 'ai_generated';
  conditions: ICustomerSegmentCondition[];
  conditionLogic: 'and' | 'or' | 'custom';
  customLogicExpression: string;
  tags: string[];
  isSystem: boolean;
  customerCount: number;
  lastCalculated: Date;
  calculationStatus: string;
  calculationError: string;
  refreshSchedule: { frequency: string; lastRefresh: Date; nextRefresh: Date };
  staticCustomers: string[];
  excludedCustomers: string[];
  owner: string;
  createdBy: string;
  createdByModel: string;
  removed: boolean;
  created: Date;
  updated: Date;
  companyID: string;
}
