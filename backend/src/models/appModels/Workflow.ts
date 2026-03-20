import mongoose from 'mongoose';

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    definition: {
      type: String, // JSON string containing the workflow definition
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived'],
      default: 'draft',
    },
    triggerEntity: {
      type: String,
      trim: true,
    },
    triggerType: {
      type: String,
      enum: ['create', 'update', 'schedule', 'manual', 'custom'],
    },
    scheduleExpression: {
      type: String, // cron expression
      trim: true,
    },
    conditions: [
      {
        field: String,
        operator: {
          type: String,
          enum: [
            'equals',
            'notEquals',
            'greaterThan',
            'lessThan',
            'contains',
            'startsWith',
            'endsWith',
            'in',
            'notIn',
            'exists',
            'notExists',
          ],
        },
        value: mongoose.Schema.Types.Mixed,
        expression: String, // For complex conditional expressions
      },
    ],
    // New format for triggers (array of trigger definitions)
    triggers: [
      {
        event: String, // e.g., 'quote.created', 'quote.approved'
        condition: String, // e.g., '${entity.total} > 100'
      },
    ],
    // Flag for new trigger format
    isActive: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    executed: {
      type: Number,
      default: 0,
    },
    lastExecutedAt: {
      type: Date,
    },
    history: [
      {
        executedAt: Date,
        status: String,
        input: mongoose.Schema.Types.Mixed,
        output: mongoose.Schema.Types.Mixed,
        error: String,
        conditionsEvaluated: [
          {
            condition: String,
            result: Boolean,
            context: mongoose.Schema.Types.Mixed,
          },
        ],
      },
    ],
    companyID: {
      type: String,
                },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Create indexes for performance
workflowSchema.index({ name: 1 });
workflowSchema.index({ status: 1 });
workflowSchema.index({ triggerType: 1 });
workflowSchema.index({ tags: 1 });
workflowSchema.index({ companyID: 1 }, { sparse: true }); // Index for companyID

// Virtual for parsed definition
workflowSchema.virtual('parsedDefinition').get(function () {
  try {
    return JSON.parse(this.definition);
  } catch (e) {
    return { nodes: [], edges: [] };
  }
});

// Pre-save hook to extract trigger info from definition
workflowSchema.pre('save', function (next) {
  try {
    if (this.definition) {
      const def = JSON.parse(this.definition);

      // Find trigger nodes
      const triggerNodes = def.nodes.filter((node: any) => node.type === 'triggerNode');

      if (triggerNodes.length > 0 && triggerNodes[0].data.config) {
        const triggerConfig = triggerNodes[0].data.config;

        // Set trigger info based on the trigger node configuration
        if (triggerNodes[0].data.label === 'Scheduled Event') {
          this.triggerType = 'schedule';
          this.scheduleExpression = triggerConfig.cronExpression || '';
        } else if (triggerNodes[0].data.label === 'Record Created') {
          this.triggerType = 'create';
          this.triggerEntity = triggerConfig.entity || '';
        } else if (triggerNodes[0].data.label === 'Record Updated') {
          this.triggerType = 'update';
          this.triggerEntity = triggerConfig.entity || '';
        } else if (triggerNodes[0].data.label === 'Form Submission') {
          this.triggerType = 'custom';
          this.triggerEntity = triggerConfig.formId || '';
        }
      }

      // Extract complex conditions from condition nodes
      const conditionNodes = def.nodes.filter((node: any) => node.type === 'conditionNode');
      this.conditions = conditionNodes.map((node: any) => {
        const config = node.data.config || {};
        return {
          field: config.field || '',
          operator: config.operator || 'equals',
          value: config.value,
          expression: config.expression || '',
        };
      });
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

const exportedModel = mongoose.model('Workflow', workflowSchema);
export default exportedModel;
module.exports = exportedModel;
