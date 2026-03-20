// AI model type definitions

export interface IAiAnalytics {
  _id: string;
  removed: boolean;
  type: 'usage' | 'performance' | 'insights' | 'predictions' | 'costs';
  module: string;
  aiAssistant: string;
  user: string;
  data: any;
  metrics: { accuracy: number; responseTime: number; userSatisfaction: number; tokensUsed: number; cost: number };
  insights: { category: string; description: string; confidence: number; actionable: boolean; priority: string }[];
  predictions: { type: string; value: any; confidence: number; timeframe: string; factors: any[] }[];
  dateRange: { start: Date; end: Date };
  owner: string;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAiAssistant {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  type: 'general' | 'document' | 'workflow' | 'analytics' | 'customer' | 'financial';
  capabilities: string[];
  model: {
    provider: string;
    modelName: string;
    version: string;
    parameters: { temperature: number; maxTokens: number; topP: number; frequencyPenalty: number; presencePenalty: number };
  };
  systemPrompt: string;
  contextModules: string[];
  knowledgeBase: string;
  owner: string;
  createdBy: string;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAiMessage {
  role: string;
  content: string;
  timestamp: Date;
  metadata: { tokens: number; model: string; processingTime: number; context: any };
}

export interface IAiConversation {
  _id: string;
  removed: boolean;
  title: string;
  aiAssistant: string | IAiAssistant;
  user: string;
  messages: IAiMessage[];
  context: { module: string; entityType: string; entityId: string; additionalData: any };
  status: 'active' | 'completed' | 'archived';
  totalTokens: number;
  totalCost: number;
  owner: string;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAiExtractionField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  validation: any;
  defaultValue: any;
  options: string[];
  description: string;
}

export interface IAiExtractionTemplate {
  _id: string;
  name: string;
  description: string;
  category: string;
  documentType: string;
  fields: IAiExtractionField[];
  validationRules: any;
  enabled: boolean;
  owner: string;
  usage_count: number;
  last_used: Date;
  version: number;
  tags: string[];
  removed: boolean;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAiKnowledgeEntry {
  title: string;
  content: string;
  category: string;
  tags: string[];
  priority: number;
  confidence: number;
  embedding: number[];
  usageCount: number;
  lastUsed: Date;
  created: Date;
  updated: Date;
}

export interface IAiKnowledgeBase {
  _id: string;
  removed: boolean;
  name: string;
  description: string;
  domain: string;
  entries: IAiKnowledgeEntry[];
  metadata: { totalEntries: number; averageConfidence: number; lastTrained: Date; version: string };
  settings: { autoUpdate: boolean; learningEnabled: boolean; confidenceThreshold: number };
  owner: string;
  createdBy: string;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAILearningData {
  _id: string;
  owner: string;
  interactionType: 'chat' | 'suggestion' | 'automation' | 'analysis' | 'recommendation';
  input: { message: string; context: any; module: string; assistantId: string };
  output: { response: string; suggestions: any[]; confidence: number; model: string };
  feedback: { rating: number; wasHelpful: boolean; wasAccurate: boolean; wasImplemented: boolean; userComment: string; feedbackDate: Date };
  outcome: { actionTaken: string; timeSaved: number; revenuImpact: number; customerSatisfactionDelta: number; conversionResult: boolean };
  patterns: { frequency: number; category: string; tags: string[]; relatedPatterns: string[] };
  mlMetadata: { features: any; embedding: any[]; cluster: string; anomalyScore: number };
  usageStats: { timeOfDay: number; dayOfWeek: number; durationMs: number; tokenCount: number; cost: number };
  successMetrics: { resolved: boolean; followUpRequired: boolean; escalated: boolean; automationCreated: boolean };
  created: Date;
  updated: Date;
}

export interface IAiProcessingStep {
  name: string;
  type: string;
  order: number;
  config: any;
  description: string;
  enabled: boolean;
}

export interface IAiProcessingWorkflow {
  _id: string;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  steps: IAiProcessingStep[];
  enabled: boolean;
  owner: string;
  execution_count: number;
  success_count: number;
  error_count: number;
  last_executed: Date;
  recent_executions: { execution_id: string; status: string; execution_time: number; steps_completed: number; total_steps: number; executed_at: Date; error_message: string }[];
  schedule: { type: string; expression: string; timezone: string; enabled: boolean };
  webhookUrl: string;
  tags: string[];
  version: number;
  removed: boolean;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAiUserPreference {
  _id: string;
  removed: boolean;
  user: string;
  preferences: {
    defaultAssistant: string;
    communicationStyle: string;
    responseLength: string;
    autoSuggestions: boolean;
    contextAwareness: boolean;
    learningFromInteractions: boolean;
  };
  moduleSettings: any;
  usage: { totalInteractions: number; lastUsed: Date; favoriteFeatures: string[]; frequentQueries: string[] };
  privacy: { dataSharing: boolean; analyticsOptIn: boolean; conversationStorage: boolean; retentionPeriod: number };
  owner: string;
  created: Date;
  updated: Date;
  companyID: string;
}

export interface IAiWorkflow {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  category: string;
  triggerType: string;
  steps: { name: string; type: string; config: any; order: number }[];
  schedule: { frequency: string; cronExpression: string; timezone: string };
  conditions: { field: string; operator: string; value: any }[];
  outputSettings: { format: string; destination: string; config: any };
  executionStats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    lastExecuted: Date;
    averageExecutionTime: number;
  };
  owner: string;
  created: Date;
  updated: Date;
  companyID: string;
}
