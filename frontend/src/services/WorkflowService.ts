import apolloClient from '@/graphql/client';
import {
  GET_WORKFLOWS,
  GET_WORKFLOW,
  CREATE_WORKFLOW,
  UPDATE_WORKFLOW,
  DELETE_WORKFLOW,
  EXECUTE_WORKFLOW,
  GET_WORKFLOW_EXECUTIONS,
  GET_WORKFLOW_EXECUTION,
  CANCEL_WORKFLOW_EXECUTION,
  WORKFLOW_ANALYTICS,
  DUPLICATE_WORKFLOW,
  TOGGLE_WORKFLOW_STATUS,
} from '@/graphql/operations/workflow';

export class WorkflowService {
  // Get all workflows
  static async getWorkflows(params = {}) {
    try {
      const { data } = await apolloClient.query({ query: GET_WORKFLOWS, variables: params });
      return data.workflowList?.result || [];
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch workflows');
    }
  }

  // Get a specific workflow by ID
  static async getWorkflow(id) {
    try {
      const { data } = await apolloClient.query({ query: GET_WORKFLOW, variables: { id } });
      return data.workflowRead?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch workflow');
    }
  }

  // Create a new workflow
  static async createWorkflow(workflowData) {
    try {
      const { data } = await apolloClient.mutate({ mutation: CREATE_WORKFLOW, variables: { input: workflowData } });
      return data.workflowCreate?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to create workflow');
    }
  }

  // Update a workflow
  static async updateWorkflow(id, workflowData) {
    try {
      const { data } = await apolloClient.mutate({ mutation: UPDATE_WORKFLOW, variables: { id, input: workflowData } });
      return data.workflowUpdate?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to update workflow');
    }
  }

  // Delete a workflow
  static async deleteWorkflow(id) {
    try {
      const { data } = await apolloClient.mutate({ mutation: DELETE_WORKFLOW, variables: { id } });
      return data.workflowDelete?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete workflow');
    }
  }

  // Execute a workflow
  static async executeWorkflow(id, inputData = {}) {
    try {
      const { data } = await apolloClient.mutate({ mutation: EXECUTE_WORKFLOW, variables: { id, input: inputData } });
      return data.workflowExecute?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to execute workflow');
    }
  }

  // Get workflow executions
  static async getWorkflowExecutions(id, params = {}) {
    try {
      const { data } = await apolloClient.query({ query: GET_WORKFLOW_EXECUTIONS, variables: params });
      return data.workflowExecutionList?.result || [];
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch executions');
    }
  }

  // Get a specific execution
  static async getExecution(workflowId, executionId) {
    try {
      const { data } = await apolloClient.query({ query: GET_WORKFLOW_EXECUTION, variables: { id: executionId } });
      return data.workflowExecutionRead?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch execution');
    }
  }

  // Cancel a running execution
  static async cancelExecution(workflowId, executionId) {
    try {
      const { data } = await apolloClient.mutate({ mutation: CANCEL_WORKFLOW_EXECUTION, variables: { id: executionId } });
      return data.workflowExecutionCancel?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to cancel execution');
    }
  }

  // Get workflow statistics
  static async getWorkflowStats(id) {
    try {
      const { data } = await apolloClient.query({ query: WORKFLOW_ANALYTICS, variables: { id } });
      return data.workflowAnalytics?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch workflow statistics');
    }
  }

  // Duplicate a workflow
  static async duplicateWorkflow(id) {
    try {
      const { data } = await apolloClient.mutate({ mutation: DUPLICATE_WORKFLOW, variables: { id } });
      return data.workflowDuplicate?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to duplicate workflow');
    }
  }

  // Toggle workflow active status
  static async toggleWorkflowStatus(id) {
    try {
      const { data } = await apolloClient.mutate({ mutation: TOGGLE_WORKFLOW_STATUS, variables: { id, input: { active: 'toggle' } } });
      return data.workflowUpdate?.result;
    } catch (error) {
      throw new Error(error.message || 'Failed to toggle workflow status');
    }
  }

  // Get available node types and their configurations
  static getNodeTypes() {
    return [
      {
        type: 'trigger',
        name: 'Trigger',
        description: 'Start point of the workflow',
        category: 'triggers',
        icon: 'PlayCircleOutlined',
        color: '#52c41a',
        configFields: [
          {
            name: 'triggerType',
            label: 'Trigger Type',
            type: 'select',
            options: [
              { value: 'manual', label: 'Manual' },
              { value: 'webhook', label: 'Webhook' },
              { value: 'schedule', label: 'Schedule' },
              { value: 'database', label: 'Database Event' },
              { value: 'email', label: 'Email' },
            ],
            required: true,
          },
        ],
      },
      {
        type: 'httpRequest',
        name: 'HTTP Request',
        description: 'Make HTTP requests to external APIs',
        category: 'actions',
        icon: 'ApiOutlined',
        color: '#1890ff',
        configFields: [
          {
            name: 'url',
            label: 'URL',
            type: 'text',
            required: true,
            placeholder: 'https://api.example.com/endpoint',
          },
          {
            name: 'method',
            label: 'Method',
            type: 'select',
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
            ],
            required: true,
            defaultValue: 'GET',
          },
          {
            name: 'headers',
            label: 'Headers',
            type: 'keyValue',
            description: 'HTTP headers to send with the request',
          },
          {
            name: 'body',
            label: 'Request Body',
            type: 'textarea',
            description: 'JSON body for POST/PUT requests',
          },
          {
            name: 'timeout',
            label: 'Timeout (ms)',
            type: 'number',
            defaultValue: 30000,
          },
        ],
      },
      {
        type: 'email',
        name: 'Email',
        description: 'Send email notifications',
        category: 'communication',
        icon: 'MailOutlined',
        color: '#fa541c',
        configFields: [
          {
            name: 'to',
            label: 'To',
            type: 'text',
            required: true,
            placeholder: 'recipient@example.com',
          },
          {
            name: 'from',
            label: 'From',
            type: 'text',
            placeholder: 'sender@example.com',
          },
          {
            name: 'subject',
            label: 'Subject',
            type: 'text',
            required: true,
          },
          {
            name: 'body',
            label: 'Email Body',
            type: 'textarea',
            required: true,
            description: 'HTML content for the email',
          },
          {
            name: 'attachments',
            label: 'Attachments',
            type: 'fileList',
            description: 'Files to attach to the email',
          },
        ],
      },
      {
        type: 'database',
        name: 'Database',
        description: 'Query and manipulate database',
        category: 'data',
        icon: 'DatabaseOutlined',
        color: '#722ed1',
        configFields: [
          {
            name: 'operation',
            label: 'Operation',
            type: 'select',
            options: [
              { value: 'find', label: 'Find/Query' },
              { value: 'insert', label: 'Insert' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
            ],
            required: true,
          },
          {
            name: 'collection',
            label: 'Collection/Table',
            type: 'text',
            required: true,
          },
          {
            name: 'query',
            label: 'Query/Filter',
            type: 'textarea',
            description: 'JSON query object',
          },
          {
            name: 'data',
            label: 'Data',
            type: 'textarea',
            description: 'Data to insert/update (JSON)',
          },
        ],
      },
      {
        type: 'condition',
        name: 'Condition',
        description: 'Create conditional logic branches',
        category: 'logic',
        icon: 'BranchesOutlined',
        color: '#faad14',
        configFields: [
          {
            name: 'conditions',
            label: 'Conditions',
            type: 'conditionList',
            required: true,
          },
          {
            name: 'operator',
            label: 'Operator',
            type: 'select',
            options: [
              { value: 'AND', label: 'AND (all conditions must be true)' },
              { value: 'OR', label: 'OR (any condition must be true)' },
            ],
            defaultValue: 'AND',
          },
        ],
      },
      {
        type: 'delay',
        name: 'Delay',
        description: 'Add a delay or wait period',
        category: 'utilities',
        icon: 'ClockCircleOutlined',
        color: '#eb2f96',
        configFields: [
          {
            name: 'duration',
            label: 'Duration (ms)',
            type: 'number',
            required: true,
            defaultValue: 1000,
            min: 100,
          },
        ],
      },
      {
        type: 'email',
        name: 'Send Email',
        description: 'Send email notifications',
        category: 'notifications',
        icon: 'MailOutlined',
        configFields: [
          {
            name: 'from',
            label: 'From',
            type: 'text',
            placeholder: 'sender@example.com',
          },
          {
            name: 'to',
            label: 'To',
            type: 'text',
            required: true,
            placeholder: 'recipient@example.com',
          },
          {
            name: 'subject',
            label: 'Subject',
            type: 'text',
            required: true,
          },
          {
            name: 'body',
            label: 'Email Body',
            type: 'richText',
            required: true,
          },
          {
            name: 'attachments',
            label: 'Attachments',
            type: 'fileList',
          },
        ],
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Send data to webhook endpoints',
        category: 'integrations',
        icon: 'LinkOutlined',
        configFields: [
          {
            name: 'url',
            label: 'Webhook URL',
            type: 'text',
            required: true,
            placeholder: 'https://webhook.example.com/callback',
          },
          {
            name: 'method',
            label: 'Method',
            type: 'select',
            options: [
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'PATCH', label: 'PATCH' },
            ],
            defaultValue: 'POST',
          },
          {
            name: 'headers',
            label: 'Headers',
            type: 'keyValue',
          },
        ],
      },
      {
        type: 'database',
        name: 'Database Operation',
        description: 'Perform database operations',
        category: 'data',
        icon: 'DatabaseOutlined',
        configFields: [
          {
            name: 'operation',
            label: 'Operation',
            type: 'select',
            options: [
              { value: 'find', label: 'Find Records' },
              { value: 'findOne', label: 'Find One Record' },
              { value: 'create', label: 'Create Record' },
              { value: 'update', label: 'Update Records' },
              { value: 'delete', label: 'Delete Records' },
            ],
            required: true,
          },
          {
            name: 'collection',
            label: 'Collection',
            type: 'text',
            required: true,
            placeholder: 'users, clients, invoices, etc.',
          },
          {
            name: 'query',
            label: 'Query',
            type: 'textarea',
            description: 'MongoDB query object (JSON)',
          },
          {
            name: 'data',
            label: 'Data',
            type: 'textarea',
            description: 'Data to create/update (JSON)',
          },
        ],
      },
      {
        type: 'customScript',
        name: 'Custom Script',
        description: 'Execute custom JavaScript code',
        category: 'advanced',
        icon: 'CodeOutlined',
        configFields: [
          {
            name: 'script',
            label: 'JavaScript Code',
            type: 'code',
            language: 'javascript',
            required: true,
            description: 'JavaScript code to execute. Use "data" variable to access input data.',
          },
          {
            name: 'timeout',
            label: 'Timeout (ms)',
            type: 'number',
            defaultValue: 5000,
          },
        ],
      },
      {
        type: 'notification',
        name: 'Notification',
        description: 'Send in-app notifications',
        category: 'notifications',
        icon: 'BellOutlined',
        configFields: [
          {
            name: 'type',
            label: 'Notification Type',
            type: 'select',
            options: [
              { value: 'info', label: 'Info' },
              { value: 'success', label: 'Success' },
              { value: 'warning', label: 'Warning' },
              { value: 'error', label: 'Error' },
            ],
            defaultValue: 'info',
          },
          {
            name: 'message',
            label: 'Message',
            type: 'text',
            required: true,
          },
          {
            name: 'recipients',
            label: 'Recipients',
            type: 'userList',
            description: 'Users to send notification to',
          },
        ],
      },
      {
        type: 'fileOperation',
        name: 'File Operation',
        description: 'Read, write, or manage files',
        category: 'utilities',
        icon: 'FileOutlined',
        configFields: [
          {
            name: 'operation',
            label: 'Operation',
            type: 'select',
            options: [
              { value: 'read', label: 'Read File' },
              { value: 'write', label: 'Write File' },
              { value: 'append', label: 'Append to File' },
              { value: 'delete', label: 'Delete File' },
              { value: 'exists', label: 'Check if File Exists' },
            ],
            required: true,
          },
          {
            name: 'filePath',
            label: 'File Path',
            type: 'text',
            required: true,
          },
          {
            name: 'content',
            label: 'Content',
            type: 'textarea',
            description: 'Content to write/append (for write/append operations)',
          },
          {
            name: 'encoding',
            label: 'Encoding',
            type: 'select',
            options: [
              { value: 'utf8', label: 'UTF-8' },
              { value: 'ascii', label: 'ASCII' },
              { value: 'base64', label: 'Base64' },
            ],
            defaultValue: 'utf8',
          },
        ],
      },
      {
        type: 'dataValidation',
        name: 'Data Validation',
        description: 'Validate data against rules',
        category: 'utilities',
        icon: 'CheckCircleOutlined',
        configFields: [
          {
            name: 'validations',
            label: 'Validation Rules',
            type: 'validationList',
            required: true,
          },
        ],
      },
      {
        type: 'loop',
        name: 'Loop',
        description: 'Iterate over arrays or objects',
        category: 'logic',
        icon: 'RetweetOutlined',
        configFields: [
          {
            name: 'items',
            label: 'Items to Loop Over',
            type: 'text',
            required: true,
            description: 'Field path containing array to iterate over',
          },
          {
            name: 'itemField',
            label: 'Item Variable Name',
            type: 'text',
            defaultValue: 'item',
            description: 'Variable name for current item in loop',
          },
          {
            name: 'indexField',
            label: 'Index Variable Name',
            type: 'text',
            defaultValue: 'index',
            description: 'Variable name for current index in loop',
          },
        ],
      },
      {
        type: 'merge',
        name: 'Merge Data',
        description: 'Merge multiple data sources',
        category: 'data',
        icon: 'MergeOutlined',
        configFields: [
          {
            name: 'mergeKey',
            label: 'Merge Key',
            type: 'text',
            description: 'Key to group data by (for groupBy strategy)',
          },
          {
            name: 'strategy',
            label: 'Merge Strategy',
            type: 'select',
            options: [
              { value: 'merge', label: 'Merge Objects' },
              { value: 'array', label: 'Keep as Array' },
              { value: 'groupBy', label: 'Group by Key' },
            ],
            defaultValue: 'merge',
          },
        ],
      },
      {
        type: 'split',
        name: 'Split Data',
        description: 'Split data into multiple outputs',
        category: 'data',
        icon: 'SplitCellsOutlined',
        configFields: [
          {
            name: 'splitField',
            label: 'Field to Split',
            type: 'text',
            required: true,
          },
          {
            name: 'delimiter',
            label: 'Delimiter',
            type: 'text',
            defaultValue: ',',
          },
          {
            name: 'strategy',
            label: 'Split Strategy',
            type: 'select',
            options: [
              { value: 'array', label: 'Array of Values' },
              { value: 'objects', label: 'Array of Objects' },
            ],
            defaultValue: 'array',
          },
        ],
      },
      {
        type: 'webhook',
        name: 'Webhook',
        description: 'Receive webhook data',
        category: 'triggers',
        icon: 'SendOutlined',
        color: '#1890ff',
        configFields: [
          {
            name: 'method',
            label: 'HTTP Method',
            type: 'select',
            options: [
              { value: 'POST', label: 'POST' },
              { value: 'GET', label: 'GET' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
            ],
            defaultValue: 'POST',
          },
          {
            name: 'path',
            label: 'Webhook Path',
            type: 'text',
            required: true,
            placeholder: '/webhook/my-workflow',
          },
          {
            name: 'authentication',
            label: 'Authentication',
            type: 'select',
            options: [
              { value: 'none', label: 'None' },
              { value: 'token', label: 'Token' },
              { value: 'basic', label: 'Basic Auth' },
            ],
            defaultValue: 'none',
          },
        ],
      },
      {
        type: 'dataTransform',
        name: 'Data Transform',
        description: 'Transform and manipulate data',
        category: 'data',
        icon: 'ControlOutlined',
        color: '#fa8c16',
        configFields: [
          {
            name: 'transformType',
            label: 'Transform Type',
            type: 'select',
            options: [
              { value: 'mapping', label: 'Field Mapping' },
              { value: 'script', label: 'JavaScript Transform' },
              { value: 'filter', label: 'Filter Data' },
            ],
            required: true,
          },
          {
            name: 'mapping',
            label: 'Field Mapping',
            type: 'fieldMapping',
            description: 'Map input fields to output fields',
          },
          {
            name: 'script',
            label: 'Transform Script',
            type: 'code',
            language: 'javascript',
            description: 'JavaScript code to transform data',
          },
          {
            name: 'filter',
            label: 'Filter Expression',
            type: 'text',
            description: 'JavaScript expression to filter data',
          },
        ],
      },
      {
        type: 'schedule',
        name: 'Schedule',
        description: 'Schedule workflow execution',
        category: 'triggers',
        icon: 'ClockCircleOutlined',
        color: '#722ed1',
        configFields: [
          {
            name: 'scheduleType',
            label: 'Schedule Type',
            type: 'select',
            options: [
              { value: 'cron', label: 'Cron Expression' },
              { value: 'interval', label: 'Interval' },
              { value: 'once', label: 'One Time' },
            ],
            required: true,
          },
          {
            name: 'cronExpression',
            label: 'Cron Expression',
            type: 'text',
            placeholder: '0 0 * * *',
            description: 'Cron expression for scheduling',
          },
          {
            name: 'interval',
            label: 'Interval (ms)',
            type: 'number',
            min: 1000,
            description: 'Interval in milliseconds',
          },
          {
            name: 'executeAt',
            label: 'Execute At',
            type: 'datetime',
            description: 'One-time execution date/time',
          },
        ],
      },
      {
        type: 'math',
        name: 'Math Operation',
        description: 'Perform mathematical calculations',
        category: 'utilities',
        icon: 'CalculatorOutlined',
        color: '#13c2c2',
        configFields: [
          {
            name: 'operation',
            label: 'Operation',
            type: 'select',
            options: [
              { value: 'add', label: 'Addition' },
              { value: 'subtract', label: 'Subtraction' },
              { value: 'multiply', label: 'Multiplication' },
              { value: 'divide', label: 'Division' },
              { value: 'power', label: 'Power' },
              { value: 'sqrt', label: 'Square Root' },
              { value: 'abs', label: 'Absolute Value' },
              { value: 'round', label: 'Round' },
              { value: 'floor', label: 'Floor' },
              { value: 'ceil', label: 'Ceiling' },
            ],
            required: true,
          },
          {
            name: 'operand1',
            label: 'First Number',
            type: 'text',
            required: true,
            description: 'First number or field path',
          },
          {
            name: 'operand2',
            label: 'Second Number',
            type: 'text',
            description: 'Second number or field path (for binary operations)',
          },
          {
            name: 'precision',
            label: 'Decimal Precision',
            type: 'number',
            min: 0,
            max: 10,
            defaultValue: 2,
          },
        ],
      },
      {
        type: 'end',
        name: 'End',
        description: 'End point of workflow execution',
        category: 'control',
        icon: 'StopOutlined',
        configFields: [],
      },
    ];
  }

  // Get node categories for organizing the node palette
  static getNodeCategories() {
    return [
      { id: 'triggers', name: 'Triggers', icon: 'PlayCircleOutlined' },
      { id: 'actions', name: 'Actions', icon: 'ThunderboltOutlined' },
      { id: 'logic', name: 'Logic', icon: 'BranchesOutlined' },
      { id: 'data', name: 'Data', icon: 'DatabaseOutlined' },
      { id: 'notifications', name: 'Notifications', icon: 'BellOutlined' },
      { id: 'integrations', name: 'Integrations', icon: 'LinkOutlined' },
      { id: 'utilities', name: 'Utilities', icon: 'ToolOutlined' },
      { id: 'advanced', name: 'Advanced', icon: 'CodeOutlined' },
      { id: 'control', name: 'Control', icon: 'SettingOutlined' },
    ];
  }
}

export default WorkflowService;
