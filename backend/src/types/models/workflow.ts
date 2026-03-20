// Workflow model type definitions

export interface IWorkflowCondition {
  field: string;
  operator: string;
  value: any;
  expression?: string;
}

export interface IWorkflowHistory {
  executedAt: Date;
  status: string;
  input: any;
  output: any;
  error?: string;
  conditionsEvaluated: any[];
}

export interface IWorkflow {
  _id: string;
  name: string;
  description: string;
  definition: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  triggerEntity: string;
  triggerType: 'create' | 'update' | 'schedule' | 'manual' | 'custom';
  scheduleExpression: string;
  conditions: IWorkflowCondition[];
  triggers: { event: string; condition: string }[];
  isActive: boolean;
  tags: string[];
  createdBy: string;
  updatedBy: string;
  executed: number;
  lastExecutedAt: Date;
  history: IWorkflowHistory[];
  companyID: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnhancedWorkflowNode {
  id: string;
  type: string;
  name: string;
  description: string;
  position: { x: number; y: number };
  configuration: any;
  inputs: any[];
  outputs: any[];
  isDisabled: boolean;
  retryPolicy: { maxRetries: number; retryDelay: number; backoffMultiplier: number };
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnhancedWorkflowConnection {
  id: string;
  source: { nodeId: string; outputName: string };
  target: { nodeId: string; inputName: string };
  condition: string;
  label: string;
}

export interface IEnhancedWorkflow {
  _id: string;
  name: string;
  description: string;
  version: string;
  status: 'draft' | 'active' | 'inactive' | 'archived' | 'error';
  category: 'automation' | 'integration' | 'notification' | 'data-processing' | 'custom';
  tags: string[];
  nodes: IEnhancedWorkflowNode[];
  connections: IEnhancedWorkflowConnection[];
  triggers: { type: string; configuration: any; isActive: boolean }[];
  executionSettings: {
    concurrent: boolean;
    maxConcurrency: number;
    timeout: number;
    retryPolicy: { enabled: boolean; maxRetries: number; retryDelay: number };
    errorHandling: { onError: string; notifyOnError: boolean; errorNotificationEmail: string };
  };
  statistics: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface INodeExecution {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: string;
  startedAt: Date;
  finishedAt: Date;
  executionTime: number;
  inputData: any;
  outputData: any;
  errorMessage?: string;
  errorStack?: string;
  retryCount: number;
  metadata: any;
}

export interface IWorkflowExecution {
  _id: string;
  workflowId: string | IEnhancedWorkflow;
  workflowName: string;
  workflowVersion: string;
  executionId: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'timeout';
  trigger: { type: string; source: string; data: any };
  startedAt: Date;
  finishedAt: Date;
  executionTime: number;
  initiatedBy: string;
  inputData: any;
  outputData: any;
  nodeExecutions: INodeExecution[];
  context: { variables: any; environment: string; sessionId: string; traceId: string };
  error: { message: string; stack: string; nodeId: string; code: string; type: string };
  metrics: {
    totalNodes: number;
    successfulNodes: number;
    failedNodes: number;
    skippedNodes: number;
    memoryUsage: number;
    cpuUsage: number;
    networkCalls: number;
    dataProcessed: number;
  };
  logs: { timestamp: Date; level: string; message: string; nodeId: string; data: any }[];
  retryInfo: { isRetry: boolean; originalExecutionId: string; retryCount: number; maxRetries: number; nextRetryAt: Date };
  queueInfo: { queuedAt: Date; priority: number; delayUntil: Date };
  createdAt: Date;
  updatedAt: Date;
}

export interface IProcessStep {
  id: string;
  name: string;
  description: string;
  type: string;
  order: number;
  assignedTo: string;
  assignedTeam: string;
  estimatedDuration: number;
  deadline: number;
  status: string;
  configuration: any;
  conditions: { skipIf: string; requiredFields: string[] };
  automation: { enabled: boolean; workflowId: string; triggerConditions: any };
  notifications: { onStart: boolean; onComplete: boolean; onDelay: boolean };
  dependencies: string[];
  outputs: any;
  completedAt: Date;
  completedBy: string;
  notes: string;
}

export interface IBusinessProcess {
  _id: string;
  removed: boolean;
  enabled: boolean;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'support' | 'operations' | 'hr' | 'finance' | 'project-management' | 'onboarding' | 'custom';
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: number;
  steps: IProcessStep[];
  execution: {
    startedAt: Date;
    completedAt: Date;
    status: string;
    currentStepId: string;
    completedSteps: string[];
    startedBy: string;
    data: any;
    errors: any[];
    logs: any[];
  };
  createdAt: Date;
  updatedAt: Date;
}
