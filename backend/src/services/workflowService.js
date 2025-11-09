// This file has been refactored into smaller, more manageable services
// The original functionality is now distributed across multiple service classes

const WorkflowService = require('./workflow/WorkflowService');

// Export a singleton instance of the main workflow service
module.exports = new WorkflowService();
