// @ts-nocheck
const mongoose = require('mongoose');
const WorkflowExecution = mongoose.model('WorkflowExecution');
const workflowService = require('../../../services/workflowService');

exports.executeWorkflow = async (req, res) => {
  try {
    // Permissions not defined in User for workflow execution
    const { workflowId, context } = req.body;
    const userId = req.user._id;

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID is required',
      });
    }

    const result = await workflowService.executeWorkflow(workflowId, context, userId);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error executing workflow:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to execute workflow',
      error: error.message,
    });
  }
};

exports.getExecutionHistory = async (req, res) => {
  try {
    // Only show executions with same companyID as requester
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const filters = {
      ...req.query,
      companyID,
    };
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const executionHistory = await workflowService.getExecutionHistory(filters, page, limit);

    return res.status(200).json({
      success: true,
      ...executionHistory,
    });
  } catch (error) {
    console.error('Error getting execution history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve execution history',
      error: error.message,
    });
  }
};

exports.getExecutionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const execution = await WorkflowExecution.findById(id)
      .populate('workflowId', 'name description companyID')
      .populate('executedBy', 'name email companyID');
    // CompanyID access control
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    if (!execution || execution.companyID !== companyID) {
      return res.status(404).json({
        success: false,
        message: 'Workflow execution not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      execution,
    });
  } catch (error) {
    console.error('Error getting execution detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve execution detail',
      error: error.message,
    });
  }
};

exports.getExecutionStats = async (req, res) => {
  try {
    // Only show stats for workflows with same companyID as requester
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    // Pass companyID to service if needed
    const stats = await workflowService.getWorkflowExecutionStats(req.query.workflowId, req.query.days, companyID);

    return res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting execution stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve execution statistics',
      error: error.message,
    });
  }
};

exports.getBottleneckAnalysis = async (req, res) => {
  try {
    // Only show analysis for workflows with same companyID as requester
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    // Pass companyID to service if needed
    const analysis = await workflowService.getBottleneckAnalysis(req.query.workflowId, req.query.limit, companyID);

    return res.status(200).json({
      success: true,
      ...analysis,
    });
  } catch (error) {
    console.error('Error getting bottleneck analysis:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bottleneck analysis',
      error: error.message,
    });
  }
};

exports.getLiveExecutions = async (req, res) => {
  try {
    // Only show live executions with same companyID as requester
    const companyID = req.user ? req.user.companyID : req.companyOwner.companyID;
    const executions = await WorkflowExecution.find({ status: 'running', companyID })
      .sort({ startTime: -1 })
      .limit(50)
      .populate('workflowId', 'name')
      .populate('executedBy', 'name');

    return res.status(200).json({
      success: true,
      executions,
    });
  } catch (error) {
    console.error('Error getting live executions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve live executions',
      error: error.message,
    });
  }
};
