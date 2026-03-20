// @ts-nocheck
const BusinessProcess = require('@/models/appModels/BusinessProcess');

// Create business process
const createBusinessProcess = async (req, res) => {
  try {
    const { body } = req;
    const userId = req.companyOwner?._id || req.user?._id;

    const businessProcess = new BusinessProcess({
      ...body,
      owner: userId,
      createdBy: userId,
    });

    await businessProcess.save();

    const populated = await BusinessProcess.findById(businessProcess._id)
      .populate('owner', 'name email')
      .populate('team', 'name')
      .populate('steps.assignedTo', 'name email')
      .populate('steps.assignedTeam', 'name');

    res.status(201).json({
      success: true,
      result: populated,
      message: 'Business process created successfully',
    });
  } catch (error) {
    console.error('Error creating business process:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating business process',
    });
  }
};

// Get all business processes
const getBusinessProcesses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, search, templatesOnly } = req.query;
    const userId = req.companyOwner?._id || req.user?._id;

    const query = { removed: false };

    // Filter by ownership or permissions
    query.$or = [
      { owner: userId },
      { 'permissions.canView': userId },
      { 'permissions.canEdit': userId },
      { 'permissions.canExecute': userId },
    ];

    if (status) query.status = status;
    if (category) query.category = category;

    if (templatesOnly === 'true') {
      query['template.isTemplate'] = true;
      query['template.isPublic'] = true;
      delete query.$or; // Public templates visible to all
    }

    // Search filter
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { tags: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.$or;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const processes = await BusinessProcess.find(query)
      .populate('owner', 'name email photo')
      .populate('team', 'name')
      .populate('steps.assignedTo', 'name email')
      .sort({ created: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await BusinessProcess.countDocuments(query);

    res.json({
      success: true,
      result: processes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching business processes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching business processes',
    });
  }
};

// Get single business process
const getBusinessProcess = async (req, res) => {
  try {
    const { id } = req.params;

    const process = await BusinessProcess.findOne({
      _id: id,
      removed: false,
    })
      .populate('owner', 'name email photo')
      .populate('team', 'name description')
      .populate('steps.assignedTo', 'name email photo')
      .populate('steps.assignedTeam', 'name')
      .populate('steps.automation.workflowId', 'name description status')
      .populate('integrations.workflows.linkedWorkflows.workflowId', 'name')
      .populate('executions.startedBy', 'name email')
      .populate('executions.logs.userId', 'name email');

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found',
      });
    }

    res.json({
      success: true,
      result: process,
    });
  } catch (error) {
    console.error('Error fetching business process:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching business process',
    });
  }
};

// Update business process
const updateBusinessProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const userId = req.companyOwner?._id || req.user?._id;

    const process = await BusinessProcess.findOne({
      _id: id,
      removed: false,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found',
      });
    }

    // Check permissions
    const canEdit =
      process.owner.toString() === userId.toString() ||
      process.permissions.canEdit.some((u) => u.toString() === userId.toString());

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this process',
      });
    }

    // If updating steps in active process, increment version
    if (body.steps && process.status === 'active') {
      process.version += 1;
    }

    Object.assign(process, body);
    process.updatedBy = userId;
    await process.save();

    const updated = await BusinessProcess.findById(id)
      .populate('owner', 'name email')
      .populate('team', 'name')
      .populate('steps.assignedTo', 'name email');

    res.json({
      success: true,
      result: updated,
      message: 'Business process updated successfully',
    });
  } catch (error) {
    console.error('Error updating business process:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating business process',
    });
  }
};

// Delete business process
const deleteBusinessProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.companyOwner?._id || req.user?._id;

    const process = await BusinessProcess.findOne({
      _id: id,
      removed: false,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found',
      });
    }

    // Check if owner
    if (process.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the owner can delete this process',
      });
    }

    process.removed = true;
    process.updatedBy = userId;
    await process.save();

    res.json({
      success: true,
      message: 'Business process deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting business process:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting business process',
    });
  }
};

// Execute business process
const executeBusinessProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const { initialData = {} } = req.body;
    const userId = req.companyOwner?._id || req.user?._id;

    const process = await BusinessProcess.findOne({
      _id: id,
      removed: false,
      enabled: true,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found or disabled',
      });
    }

    // Check if active
    if (process.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Business process is not active',
      });
    }

    // Check permissions
    const canExecute =
      process.owner.toString() === userId.toString() ||
      process.permissions.canExecute.some((u) => u.toString() === userId.toString()) ||
      process.triggers.manual;

    if (!canExecute) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to execute this process',
      });
    }

    // Start execution
    const execution = process.startExecution(userId, initialData);
    await process.save();

    const updated = await BusinessProcess.findById(id).populate(
      'executions.startedBy',
      'name email'
    );

    res.json({
      success: true,
      result: updated,
      execution: execution,
      message: 'Business process execution started',
    });
  } catch (error) {
    console.error('Error executing business process:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error executing business process',
    });
  }
};

// Complete process step
const completeProcessStep = async (req, res) => {
  try {
    const { id, executionIndex, stepId } = req.params;
    const { output = {}, notes } = req.body;
    const userId = req.companyOwner?._id || req.user?._id;

    const process = await BusinessProcess.findOne({
      _id: id,
      removed: false,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found',
      });
    }

    const execution = process.completeStep(parseInt(executionIndex), stepId, userId, output);

    if (notes) {
      const stepIndex = process.steps.findIndex((s) => s.id === stepId);
      if (stepIndex !== -1) {
        process.steps[stepIndex].notes = notes;
      }
    }

    // Update analytics
    if (execution.status === 'completed') {
      const duration = (execution.completedAt - execution.startedAt) / (1000 * 60 * 60); // hours
      const currentAvg = process.analytics.averageDuration;
      const totalCompleted = process.analytics.successfulExecutions;

      process.analytics.averageDuration =
        (currentAvg * (totalCompleted - 1) + duration) / totalCompleted;
    }

    await process.save();

    const updated = await BusinessProcess.findById(id)
      .populate('executions.startedBy', 'name email')
      .populate('steps.completedBy', 'name email');

    res.json({
      success: true,
      result: updated,
      execution: execution,
      message: 'Step completed successfully',
    });
  } catch (error) {
    console.error('Error completing step:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error completing step',
    });
  }
};

// Get process analytics
const getProcessAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const process = await BusinessProcess.findOne({
      _id: id,
      removed: false,
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found',
      });
    }

    const analytics = {
      ...process.analytics.toObject(),
      completionRate: process.completionRate,
      activeExecutions: process.activeExecutions,
      recentExecutions: process.executions
        .slice(-10)
        .reverse()
        .map((ex) => ({
          id: ex._id,
          status: ex.status,
          startedAt: ex.startedAt,
          completedAt: ex.completedAt,
          duration: ex.completedAt ? (ex.completedAt - ex.startedAt) / (1000 * 60) : null,
        })),
      stepAnalytics: process.steps.map((step) => {
        const completedCount = process.executions.filter((ex) =>
          ex.completedSteps.includes(step.id)
        ).length;

        return {
          stepId: step.id,
          stepName: step.name,
          completedCount,
          averageDuration: step.estimatedDuration,
        };
      }),
    };

    res.json({
      success: true,
      result: analytics,
    });
  } catch (error) {
    console.error('Error fetching process analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching analytics',
    });
  }
};

// Duplicate process as template
const duplicateAsTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, makePublic = false } = req.body;
    const userId = req.companyOwner?._id || req.user?._id;

    const originalProcess = await BusinessProcess.findOne({
      _id: id,
      removed: false,
    });

    if (!originalProcess) {
      return res.status(404).json({
        success: false,
        message: 'Business process not found',
      });
    }

    const templateData = originalProcess.toObject();
    delete templateData._id;
    delete templateData.executions;
    delete templateData.analytics;
    delete templateData.created;
    delete templateData.updated;

    const template = new BusinessProcess({
      ...templateData,
      name: name || `${originalProcess.name} (Template)`,
      status: 'draft',
      version: 1,
      template: {
        isTemplate: true,
        templateCategory: originalProcess.category,
        isPublic: makePublic,
      },
      owner: userId,
      createdBy: userId,
    });

    await template.save();

    res.status(201).json({
      success: true,
      result: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating template',
    });
  }
};

module.exports = {
  createBusinessProcess,
  getBusinessProcesses,
  getBusinessProcess,
  updateBusinessProcess,
  deleteBusinessProcess,
  executeBusinessProcess,
  completeProcessStep,
  getProcessAnalytics,
  duplicateAsTemplate,
};
