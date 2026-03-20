// @ts-nocheck
const Joi = require('joi');

// Node validation schema
const nodeSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string()
    .valid(
      'trigger',
      'httpRequest',
      'dataTransform',
      'condition',
      'delay',
      'email',
      'webhook',
      'database',
      'customScript',
      'notification',
      'fileOperation',
      'dataValidation',
      'loop',
      'merge',
      'split',
      'end'
    )
    .required(),
  name: Joi.string().required(),
  config: Joi.object().default({}),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
  }).required(),
  metadata: Joi.object().default({}),
});

// Connection validation schema
const connectionSchema = Joi.object({
  id: Joi.string().required(),
  sourceNodeId: Joi.string().required(),
  targetNodeId: Joi.string().required(),
  sourceHandle: Joi.string().default('output'),
  targetHandle: Joi.string().default('input'),
  condition: Joi.object({
    type: Joi.string().valid('always', 'success', 'error', 'conditional'),
    expression: Joi.string(),
  }).default({ type: 'always' }),
});

// Trigger validation schema
const triggerSchema = Joi.object({
  type: Joi.string().valid('manual', 'webhook', 'schedule', 'database', 'email').required(),
  config: Joi.object().default({}),
  isActive: Joi.boolean().default(true),
});

// Create workflow validation
const createWorkflowSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).default(''),
  nodes: Joi.array().items(nodeSchema).default([]),
  connections: Joi.array().items(connectionSchema).default([]),
  triggers: Joi.array().items(triggerSchema).default([]),
  settings: Joi.object({
    timeout: Joi.number().min(1000).max(3600000).default(300000), // 5 minutes default
    retryAttempts: Joi.number().min(0).max(5).default(0),
    retryDelay: Joi.number().min(1000).max(300000).default(5000),
    concurrency: Joi.number().min(1).max(10).default(1),
    onError: Joi.string().valid('stop', 'continue', 'retry').default('stop'),
    notifications: Joi.object({
      onSuccess: Joi.boolean().default(false),
      onError: Joi.boolean().default(true),
      email: Joi.string().email(),
    }).default({}),
  }).default({}),
  permissions: Joi.object({
    public: Joi.boolean().default(false),
    sharedWith: Joi.array().items(Joi.string()).default([]),
    allowedRoles: Joi.array().items(Joi.string()).default([]),
  }).default({}),
  tags: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(false),
});

// Update workflow validation (allows partial updates)
const updateWorkflowSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().max(500),
  nodes: Joi.array().items(nodeSchema),
  connections: Joi.array().items(connectionSchema),
  triggers: Joi.array().items(triggerSchema),
  settings: Joi.object({
    timeout: Joi.number().min(1000).max(3600000),
    retryAttempts: Joi.number().min(0).max(5),
    retryDelay: Joi.number().min(1000).max(300000),
    concurrency: Joi.number().min(1).max(10),
    onError: Joi.string().valid('stop', 'continue', 'retry'),
    notifications: Joi.object({
      onSuccess: Joi.boolean(),
      onError: Joi.boolean(),
      email: Joi.string().email(),
    }),
  }),
  permissions: Joi.object({
    public: Joi.boolean(),
    sharedWith: Joi.array().items(Joi.string()),
    allowedRoles: Joi.array().items(Joi.string()),
  }),
  tags: Joi.array().items(Joi.string()),
  isActive: Joi.boolean(),
});

// Execute workflow validation
const executeWorkflowSchema = Joi.object({
  inputData: Joi.object().default({}),
});

// Validation middleware function
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

// Custom validation functions
const validateWorkflowStructure = (req, res, next) => {
  const { nodes = [], connections = [] } = req.body;

  // Check if there's at least one trigger node
  const triggerNodes = nodes.filter((node) => node.type === 'trigger');
  if (triggerNodes.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Workflow must have at least one trigger node',
    });
  }

  // Validate node connections
  const nodeIds = new Set(nodes.map((node) => node.id));
  for (const connection of connections) {
    if (!nodeIds.has(connection.sourceNodeId)) {
      return res.status(400).json({
        success: false,
        message: `Source node ${connection.sourceNodeId} does not exist`,
      });
    }
    if (!nodeIds.has(connection.targetNodeId)) {
      return res.status(400).json({
        success: false,
        message: `Target node ${connection.targetNodeId} does not exist`,
      });
    }
  }

  // Check for circular dependencies (basic check)
  const hasCircularDependency = (nodeId, visited = new Set(), path = new Set()) => {
    if (path.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    path.add(nodeId);

    const outgoingConnections = connections.filter((conn) => conn.sourceNodeId === nodeId);
    for (const connection of outgoingConnections) {
      if (hasCircularDependency(connection.targetNodeId, visited, path)) {
        return true;
      }
    }

    path.delete(nodeId);
    return false;
  };

  for (const node of triggerNodes) {
    if (hasCircularDependency(node.id)) {
      return res.status(400).json({
        success: false,
        message: 'Workflow contains circular dependencies',
      });
    }
  }

  next();
};

// Node-specific configuration validation
const validateNodeConfigurations = (req, res, next) => {
  const { nodes = [] } = req.body;

  for (const node of nodes) {
    const { type, config } = node;

    try {
      switch (type) {
        case 'httpRequest':
          if (!config.url) {
            throw new Error('HTTP Request node requires a URL');
          }
          break;

        case 'email':
          if (!config.to || !config.subject) {
            throw new Error('Email node requires "to" and "subject" fields');
          }
          break;

        case 'database':
          if (!config.operation || !config.collection) {
            throw new Error('Database node requires "operation" and "collection" fields');
          }
          break;

        case 'condition':
          if (!config.conditions || config.conditions.length === 0) {
            throw new Error('Condition node requires at least one condition');
          }
          break;

        case 'delay':
          if (!config.duration || config.duration < 0) {
            throw new Error('Delay node requires a positive duration value');
          }
          break;

        case 'webhook':
          if (!config.url) {
            throw new Error('Webhook node requires a URL');
          }
          break;

        case 'customScript':
          if (!config.script) {
            throw new Error('Custom Script node requires script code');
          }
          break;

        case 'fileOperation':
          if (!config.operation || !config.filePath) {
            throw new Error('File Operation node requires "operation" and "filePath" fields');
          }
          break;

        case 'loop':
          if (!config.items) {
            throw new Error('Loop node requires "items" field');
          }
          break;

        default:
          // No specific validation for other node types
          break;
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: `Node "${node.name}" (${node.id}) configuration error: ${error.message}`,
      });
    }
  }

  next();
};

module.exports = {
  validate: {
    createWorkflow: [
      validateRequest(createWorkflowSchema),
      validateWorkflowStructure,
      validateNodeConfigurations,
    ],
    updateWorkflow: [
      validateRequest(updateWorkflowSchema),
      validateWorkflowStructure,
      validateNodeConfigurations,
    ],
    executeWorkflow: validateRequest(executeWorkflowSchema),
  },
  schemas: {
    createWorkflowSchema,
    updateWorkflowSchema,
    executeWorkflowSchema,
    nodeSchema,
    connectionSchema,
    triggerSchema,
  },
};
