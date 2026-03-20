// @ts-nocheck
const mongoose = require('mongoose');
const Workflow = mongoose.model('Workflow');
const workflowService = require('../../../services/workflowService');

// Create a new workflow
const create = async (req, res) => {
  try {
    // Validate essential data
    if (!req.body.name || !req.body.definition) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Name and workflow definition are required',
      });
    }

    // Permissions check for users
    if (req.user) {
      if (!req.user.permissions?.canCreateWorkflows) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to create workflows',
        });
      }
    }
    // Assign companyID from creator
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const newWorkflow = new Workflow({
      ...req.body,
      createdBy: req.user ? req.user._id : req.companyOwner._id,
      updatedBy: req.user ? req.user._id : req.companyOwner._id,
      companyID,
    });

    // Save the workflow
    const result = await newWorkflow.save();

    return res.status(200).json({
      success: true,
      result,
      message: 'Workflow created successfully',
    });
  } catch (error) {
    console.error('Error creating workflow:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        message:
          'Validation Error: ' +
          Object.values(error.errors)
            .map((val) => val.message)
            .join(', '),
        error: error,
      });
    }

    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error creating workflow',
      error: error.message,
    });
  }
};

// Get a list of workflows with pagination
const list = async (req, res) => {
  try {
    let { page, limit, status, triggerType } = req.query;

    // Parse pagination parameters
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Only show workflows with same companyID as requester
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const filter = { companyID };
    if (status) filter.status = status;
    if (triggerType) filter.triggerType = triggerType;

    // Query workflows with pagination
    const result = await Workflow.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 }) // Most recently updated first
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();

    // Get total count for pagination
    const total = await Workflow.countDocuments(filter);

    return res.status(200).json({
      success: true,
      result,
      total,
      page,
      limit,
      message: 'Workflows retrieved successfully',
    });
  } catch (error) {
    console.error('Error listing workflows:', error);
    return res.status(500).json({
      success: false,
      result: [],
      message: 'Error retrieving workflows',
      error: error.message,
    });
  }
};

// Get a single workflow by ID
const read = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid workflow ID',
      });
    }

    // Find the workflow
    const result = await Workflow.findById(id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .exec();
    // CompanyID access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (!result || result.companyID !== companyID) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Workflow retrieved successfully',
    });
  } catch (error) {
    console.error('Error reading workflow:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error retrieving workflow',
      error: error.message,
    });
  }
};

// Update a workflow
const update = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid workflow ID',
      });
    }

    // Permissions check for users
    if (req.user) {
      if (!req.user.permissions?.canUpdateWorkflows) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update workflows',
        });
      }
    }
    // CompanyID access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.companyID !== companyID) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found or access denied',
      });
    }
    // Set updatedBy to current user
    req.body.updatedBy = req.user ? req.user._id : req.companyOwner._id;

    // Update workflow
    const result = await Workflow.findOneAndUpdate({ _id: id }, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    // Check if workflow exists
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Workflow updated successfully',
    });
  } catch (error) {
    console.error('Error updating workflow:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        result: null,
        message:
          'Validation Error: ' +
          Object.values(error.errors)
            .map((val) => val.message)
            .join(', '),
        error: error,
      });
    }

    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error updating workflow',
      error: error.message,
    });
  }
};

// Delete a workflow
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid workflow ID',
      });
    }

    // Permissions check for users
    if (req.user) {
      if (!req.user.permissions?.canDeleteWorkflows) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete workflows',
        });
      }
    }
    // CompanyID access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.companyID !== companyID) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found or access denied',
      });
    }

    // Find and delete the workflow
    const result = await Workflow.findByIdAndDelete(id);

    // Check if workflow exists
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error deleting workflow',
      error: error.message,
    });
  }
};

// Activate/deactivate a workflow
const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid workflow ID',
      });
    }

    // Permissions check for users
    if (req.user) {
      if (!req.user.permissions?.canUpdateWorkflows) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to update workflow status',
        });
      }
    }
    // CompanyID access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const workflow = await Workflow.findById(id);
    if (!workflow || workflow.companyID !== companyID) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found or access denied',
      });
    }

    // Validate status
    if (!['active', 'inactive', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid status value',
      });
    }

    // Update workflow status
    const result = await Workflow.findByIdAndUpdate(
      id,
      {
        status,
        updatedBy: req.admin._id,
      },
      { new: true }
    );

    // Check if workflow exists
    if (!result) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found',
      });
    }

    return res.status(200).json({
      success: true,
      result,
      message: `Workflow ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    console.error('Error updating workflow status:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error updating workflow status',
      error: error.message,
    });
  }
};

// Test a condition with provided context
const testCondition = async (req, res) => {
  // Permissions not defined in User for this method
  try {
    const { node, context } = req.body;

    if (!node || !context) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Node and context data are required',
      });
    }

    const result = workflowService.evaluateNodeConditions(node, context);

    return res.status(200).json({
      success: true,
      result,
      message: 'Condition evaluated successfully',
    });
  } catch (error) {
    console.error('Error testing condition:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error evaluating condition',
      error: error.message,
    });
  }
};

// Simulate workflow execution with provided context
const simulateWorkflow = async (req, res) => {
  // Permissions not defined in User for this method
  try {
    const { id } = req.params;
    const { context } = req.body;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid workflow ID',
      });
    }

    // Find the workflow
    const workflow = await Workflow.findById(id);

    // Check if workflow exists
    if (!workflow) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Workflow not found',
      });
    }

    // Get workflow definition
    const { definition } = workflow;

    if (!definition || !definition.nodes || !definition.edges) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Invalid workflow definition',
      });
    }

    // Find the start node
    const startNode = definition.nodes.find((node) => node.type === 'startNode');

    if (!startNode) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Workflow has no start node',
      });
    }

    // Initialize execution path and process variables
    let currentNodeId = startNode.id;
    const executionPath = [startNode.id];
    const results = [];
    const processedData = { ...context }; // Copy original context for modifications

    // Maximum number of steps to prevent infinite loops
    const maxSteps = 100;
    let steps = 0;

    // Execute the workflow until we reach an end node or max steps
    while (currentNodeId && steps < maxSteps) {
      steps++;

      // Find the current node
      const currentNode = definition.nodes.find((node) => node.id === currentNodeId);

      if (!currentNode) {
        break; // Exit if node not found
      }

      // Process the node based on type
      if (currentNode.type === 'conditionNode') {
        const evaluation = workflowService.evaluateNodeConditions(currentNode, processedData);
        results.push({
          nodeId: currentNode.id,
          type: 'condition',
          evaluation,
        });

        // Get next nodes based on condition evaluation
        const nextNodeIds = workflowService.getNextNodes(
          currentNode,
          definition.edges,
          processedData
        );
        currentNodeId = nextNodeIds.length > 0 ? nextNodeIds[0] : null;

        if (currentNodeId) {
          executionPath.push(currentNodeId);
        }
      } else if (currentNode.type === 'actionNode') {
        // For simulation, we just record the action would be executed
        results.push({
          nodeId: currentNode.id,
          type: 'action',
          action: currentNode.data?.config?.action || 'unknown',
          parameters: currentNode.data?.config?.parameters,
        });

        // Get next nodes (should be straightforward for action nodes)
        const nextNodeIds = workflowService.getNextNodes(
          currentNode,
          definition.edges,
          processedData
        );
        currentNodeId = nextNodeIds.length > 0 ? nextNodeIds[0] : null;

        if (currentNodeId) {
          executionPath.push(currentNodeId);
        }
      } else if (currentNode.type === 'endNode') {
        // Record that we reached the end node
        results.push({
          nodeId: currentNode.id,
          type: 'end',
        });
        break; // End the workflow execution
      } else {
        // Handle other node types (if any)
        results.push({
          nodeId: currentNode.id,
          type: currentNode.type,
        });

        const nextNodeIds = workflowService.getNextNodes(
          currentNode,
          definition.edges,
          processedData
        );
        currentNodeId = nextNodeIds.length > 0 ? nextNodeIds[0] : null;

        if (currentNodeId) {
          executionPath.push(currentNodeId);
        }
      }
    }

    // Return simulation results
    return res.status(200).json({
      success: true,
      result: {
        executionPath,
        steps,
        results,
        reachedEnd: Boolean(
          steps < maxSteps &&
            steps > 0 &&
            definition.nodes.find(
              (node) =>
                node.id === executionPath[executionPath.length - 1] && node.type === 'endNode'
            )
        ),
      },
      message: 'Workflow simulation completed',
    });
  } catch (error) {
    console.error('Error simulating workflow:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Error simulating workflow',
      error: error.message,
    });
  }
};

module.exports = {
  create,
  list,
  read,
  update,
  remove,
  toggleStatus,
  testCondition,
  simulateWorkflow,
};
