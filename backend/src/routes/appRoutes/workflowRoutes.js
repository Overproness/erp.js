const express = require('express');
const router = express.Router();
const { catchErrors } = require('@/handlers/errorHandlers');
const workflowController = require('@/controllers/appControllers/workflowController/workflowController');

// Create a workflow
router.post('/', catchErrors(workflowController.create));

// Get all workflows with pagination
router.get('/', catchErrors(workflowController.list));

// Get a specific workflow
router.get('/:id', catchErrors(workflowController.read));

// Update a workflow
router.patch('/:id', catchErrors(workflowController.update));
    
// Delete a workflow
router.delete('/:id', catchErrors(workflowController.remove));

// Activate/deactivate a workflow
router.patch('/:id/status', catchErrors(workflowController.toggleStatus));

// Test condition evaluation
router.post('/test-condition', catchErrors(workflowController.testCondition));

// Simulate workflow execution with provided context
router.post('/:id/simulate', catchErrors(workflowController.simulateWorkflow));

module.exports = router;
