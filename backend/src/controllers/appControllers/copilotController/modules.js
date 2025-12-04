const copilotService = require('../../../services/copilotService');
const { catchErrors } = require('../../../handlers/errorHandlers');

/**
 * Get list of registered copilot modules
 */
const modules = async (req, res) => {
  try {
    const registeredModules = copilotService.getRegisteredModules();

    return res.status(200).json({
      success: true,
      result: {
        modules: registeredModules,
        count: registeredModules.length,
      },
      message: 'Registered modules retrieved successfully',
    });
  } catch (error) {
    console.error('Copilot modules controller error:', error);
    return res.status(500).json({
      success: false,
      result: null,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

module.exports = catchErrors(modules);
