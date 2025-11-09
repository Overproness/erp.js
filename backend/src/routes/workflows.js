const express = require('express');
const router = express.Router();
const EnhancedWorkflow = require('../models/appModels/EnhancedWorkflow');
const WorkflowExecution = require('../models/appModels/WorkflowExecution');
const WorkflowEngine = require('../core/WorkflowEngine');
const adminAuth = require('../controllers/coreControllers/adminAuth');
// const { validate } = require('../validators/workflow');

// Initialize workflow engine
const workflowEngine = new WorkflowEngine();

// Get all workflows for the authenticated user
router.get('/', adminAuth.isValidAuthToken, async (req, res) => {
  try {
    const workflows = await EnhancedWorkflow.find({
      createdBy: req.user.id,
      isDeleted: false,
    })
      .select('-nodes -connections') // Exclude large fields for list view
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      workflows,
      count: workflows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflows',
      error: error.message,
    });
  }
});

// Get a specific workflow by ID
router.get('/:id', adminAuth.isValidAuthToken, async (req, res) => {
  try {
    const workflow = await EnhancedWorkflow.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow',
      error: error.message,
    });
  }
});

// Create a new workflow
router.post('/', authenticate, validate.createWorkflow, async (req, res) => {
  try {
    const workflowData = {
      ...req.body,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id,
    };

    const workflow = new EnhancedWorkflow(workflowData);
    await workflow.save();

    res.status(201).json({
      success: true,
      workflow,
      message: 'Workflow created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create workflow',
      error: error.message,
    });
  }
});

// Update a workflow
router.put('/:id', authenticate, validate.updateWorkflow, async (req, res) => {
  try {
    const workflow = await EnhancedWorkflow.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
        isDeleted: false,
      },
      {
        ...req.body,
        lastModifiedBy: req.user.id,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      workflow,
      message: 'Workflow updated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update workflow',
      error: error.message,
    });
  }
});

// Delete a workflow (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const workflow = await EnhancedWorkflow.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
        isDeleted: false,
      },
      {
        isDeleted: true,
        deletedAt: new Date(),
        lastModifiedBy: req.user.id,
      },
      { new: true }
    );

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    res.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete workflow',
      error: error.message,
    });
  }
});

// Execute a workflow
router.post('/:id/execute', authenticate, async (req, res) => {
  try {
    const workflow = await EnhancedWorkflow.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
      isActive: true,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found or inactive',
      });
    }

    const inputData = req.body.inputData || {};
    const execution = await workflowEngine.executeWorkflow(workflow, inputData, req.user.id);

    res.json({
      success: true,
      execution,
      message: 'Workflow execution started',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to execute workflow',
      error: error.message,
    });
  }
});

// Get workflow executions
router.get('/:id/executions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      workflowId: req.params.id,
      userId: req.user.id,
    };

    if (status) {
      query.status = status;
    }

    const executions = await WorkflowExecution.find(query)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-nodeExecutions.result'); // Exclude large result data

    const total = await WorkflowExecution.countDocuments(query);

    res.json({
      success: true,
      executions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: executions.length,
        totalRecords: total,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch executions',
      error: error.message,
    });
  }
});

// Get a specific execution
router.get('/:workflowId/executions/:executionId', authenticate, async (req, res) => {
  try {
    const execution = await WorkflowExecution.findOne({
      _id: req.params.executionId,
      workflowId: req.params.workflowId,
      userId: req.user.id,
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Execution not found',
      });
    }

    res.json({
      success: true,
      execution,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch execution',
      error: error.message,
    });
  }
});

// Cancel a running execution
router.post('/:workflowId/executions/:executionId/cancel', authenticate, async (req, res) => {
  try {
    const execution = await WorkflowExecution.findOne({
      _id: req.params.executionId,
      workflowId: req.params.workflowId,
      userId: req.user.id,
      status: 'running',
    });

    if (!execution) {
      return res.status(404).json({
        success: false,
        message: 'Running execution not found',
      });
    }

    await execution.cancel('Cancelled by user');

    res.json({
      success: true,
      message: 'Execution cancelled successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel execution',
      error: error.message,
    });
  }
});

// Get workflow statistics
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const workflow = await EnhancedWorkflow.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    const stats = await WorkflowExecution.aggregate([
      { $match: { workflowId: workflow._id, userId: req.user.id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$metrics.executionTime' },
          totalDuration: { $sum: '$metrics.executionTime' },
        },
      },
    ]);

    const recentExecutions = await WorkflowExecution.find({
      workflowId: workflow._id,
      userId: req.user.id,
    })
      .sort({ startedAt: -1 })
      .limit(10)
      .select('status startedAt completedAt metrics');

    res.json({
      success: true,
      stats: {
        overview: stats,
        recent: recentExecutions,
        workflow: {
          nodeCount: workflow.nodes.length,
          connectionCount: workflow.connections.length,
          isActive: workflow.isActive,
          lastModified: workflow.updatedAt,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workflow statistics',
      error: error.message,
    });
  }
});

// Duplicate a workflow
router.post('/:id/duplicate', authenticate, async (req, res) => {
  try {
    const originalWorkflow = await EnhancedWorkflow.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
    });

    if (!originalWorkflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    const duplicatedWorkflow = new EnhancedWorkflow({
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      nodes: originalWorkflow.nodes,
      connections: originalWorkflow.connections,
      triggers: originalWorkflow.triggers,
      settings: originalWorkflow.settings,
      permissions: originalWorkflow.permissions,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id,
      isActive: false, // Start duplicated workflows as inactive
    });

    await duplicatedWorkflow.save();

    res.status(201).json({
      success: true,
      workflow: duplicatedWorkflow,
      message: 'Workflow duplicated successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate workflow',
      error: error.message,
    });
  }
});

// Toggle workflow active status
router.patch('/:id/toggle-status', authenticate, async (req, res) => {
  try {
    const workflow = await EnhancedWorkflow.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
      isDeleted: false,
    });

    if (!workflow) {
      return res.status(404).json({
        success: false,
        message: 'Workflow not found',
      });
    }

    workflow.isActive = !workflow.isActive;
    workflow.lastModifiedBy = req.user.id;
    workflow.updatedAt = new Date();

    await workflow.save();

    res.json({
      success: true,
      workflow,
      message: `Workflow ${workflow.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle workflow status',
      error: error.message,
    });
  }
});

module.exports = router;
