const copilotService = require('../services/copilotService');
const {
  customerModuleHandler,
  generalModuleHandler,
} = require('../services/copilotModuleHandlers');

/**
 * Initialize Copilot Module Handlers
 * Register all module-specific handlers on app startup
 */
function initializeCopilotModules() {
  try {
    // console.log('🤖 Initializing Copilot modules...');

    // Register general handler
    copilotService.registerModule('general', generalModuleHandler);

    // Register customer module handler
    copilotService.registerModule('customer', customerModuleHandler);
    copilotService.registerModule('client', customerModuleHandler); // Alias

    // TODO: Add more module handlers as they are created
    // Examples:
    // copilotService.registerModule('invoice', invoiceModuleHandler);
    // copilotService.registerModule('quote', quoteModuleHandler);
    // copilotService.registerModule('order', orderModuleHandler);
    // copilotService.registerModule('payment', paymentModuleHandler);
    // copilotService.registerModule('inventory', inventoryModuleHandler);

    const registeredModules = copilotService.getRegisteredModules();
    // console.log(
    //   `✅ Copilot initialized with ${registeredModules.length} modules:`,
    //   registeredModules
    // );
  } catch (error) {
    console.error('❌ Failed to initialize copilot modules:', error);
  }
}

module.exports = { initializeCopilotModules };
