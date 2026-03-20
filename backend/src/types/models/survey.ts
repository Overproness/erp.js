// Survey model type definitions

export interface ISurveyQuestion {
  questionId: string;
  type: string;
  question: string;
  required: boolean;
  options: string[];
  placeholder: string;
  min?: number;
  max?: number;
  scaleLabels?: { low: string; high: string };
  conditionalLogic?: { dependsOn: string; condition: string; value: any };
  order: number;
}

export interface ISurveySettings {
  allowAnonymous: boolean;
  requireEmail: boolean;
  oneResponsePerUser: boolean;
  showProgressBar: boolean;
  showQuestionNumbers: boolean;
  randomizeQuestions: boolean;
  collectIpAddress: boolean;
  customTheme: { primaryColor: string; backgroundColor: string; textColor: string; buttonColor: string };
  thankYouMessage: string;
  redirectUrl: string;
}

export interface ISurvey {
  _id: string;
  title: string;
  description: string;
  type: 'nps' | 'csat' | 'feedback' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  owner: string;
  business: string;
  questions: ISurveyQuestion[];
  settings: ISurveySettings;
  distribution: any;
  customUrl: { shortCode: string; fullUrl: string; clicks: number };
  analytics: {
    totalResponses: number;
    completedResponses: number;
    partialResponses: number;
    averageCompletionTime: number;
    completionRate: number;
    npsScore: number;
    csat: number;
    lastResponseAt: Date;
  };
  tags: string[];
  createdBy: string;
  updatedBy: string;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISurveyAnswer {
  questionId: string;
  questionText: string;
  questionType: string;
  value: any;
  skipped: boolean;
}

export interface ISurveyResponse {
  _id: string;
  survey: string | ISurvey;
  respondent: {
    name: string;
    email: string;
    phone: string;
    customerId: string;
    isAnonymous: boolean;
  };
  status: 'started' | 'in_progress' | 'completed' | 'abandoned';
  answers: ISurveyAnswer[];
  metadata: any;
  timing: { startedAt: Date; completedAt: Date; timeSpent: number; pageViews: any[] };
  sentiment: { overall: { score: number; category: string }; byQuestion: any[] };
  nps: { score: number; category: string };
  aiAnalysis: {
    processed: boolean;
    processedAt: Date;
    insights: any[];
    summary: string;
    themes: any[];
    actionableItems: any[];
  };
  flags: { isNegative: boolean; requiresFollowUp: boolean; isSpam: boolean; containsPII: boolean };
  followUp: { status: string; assignedTo: string; notes: any[]; contactedAt: Date; resolvedAt: Date };
  tags: string[];
  notes: string;
  removed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
