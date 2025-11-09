const express = require('express');
const router = express.Router();
const workflowExecutionController = require('../../controllers/appControllers/workflowController/workflowExecutionController');
const { checkAuth } = require('../../middlewares/auth'); // Using existing auth middleware

// All routes are protected by authentication
router.use(checkAuth);

// Execute a workflow
router.post('/execute', workflowExecutionController.executeWorkflow);

// Get workflow execution history with pagination
router.get('/history', workflowExecutionController.getExecutionHistory);

// Get details of a specific execution
router.get('/detail/:id', workflowExecutionController.getExecutionDetail);

// Get workflow execution statistics
router.get('/stats', workflowExecutionController.getExecutionStats);

// Get bottleneck analysis
router.get('/bottlenecks', workflowExecutionController.getBottleneckAnalysis);

// Get live executions
router.get('/live', workflowExecutionController.getLiveExecutions);

module.exports = router;
