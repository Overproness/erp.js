// @ts-nocheck
const chatQueueService = require('./chatQueueService');
const followUpService = require('./followUpService');
const selfLearningService = require('./selfLearningService');

/**
 * Initialize all AI services for 24/7 operations
 */
async function initializeAIServices() {
  // console.log('🚀 Initializing AI Services...\n');

  const results = {
    success: true,
    services: {},
  };

  // Initialize each service independently with error handling
  try {
    await chatQueueService.initialize();
    results.services.chatQueue = 'active';
    console.log('');
  } catch (error) {
    console.error('❌ Chat queue service initialization failed (non-fatal):', error.message);
    results.services.chatQueue = 'failed';
    results.success = false;
  }

  try {
    await followUpService.initialize();
    results.services.followUp = 'active';
    console.log('');
  } catch (error) {
    console.error('❌ Follow-up service initialization failed (non-fatal):', error.message);
    results.services.followUp = 'failed';
    results.success = false;
  }

  try {
    await selfLearningService.initialize();
    results.services.selfLearning = 'active';
    console.log('');
  } catch (error) {
    console.error('❌ Self-learning service initialization failed (non-fatal):', error.message);
    results.services.selfLearning = 'failed';
    results.success = false;
  }

  // Show summary
  const activeServices = Object.values(results.services).filter((s) => s === 'active').length;
  const totalServices = Object.keys(results.services).length;

  if (activeServices === totalServices) {
    // console.log('✅ All AI Services initialized successfully!\n');
    // console.log('🤖 24/7 AI Virtual Assistant is now active');
    // console.log('📧 Automated Follow-Up System is running');
    // console.log('🧠 Self-Learning Engine is active\n');
  } else {
    console.log(`⚠️ AI Services initialized: ${activeServices}/${totalServices} active\n`);
  }

  return results;
}

/**
 * Gracefully shutdown all AI services
 */
async function shutdownAIServices() {
  console.log('\n🛑 Shutting down AI Services...\n');

  try {
    if (chatQueueService.shutdown) {
      await chatQueueService.shutdown();
    }

    console.log('✅ AI Services shut down successfully\n');
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
  }
}

process.on('SIGTERM', shutdownAIServices);
process.on('SIGINT', shutdownAIServices);

module.exports = {
  initializeAIServices,
  shutdownAIServices,
  chatQueueService,
  followUpService,
  selfLearningService,
};
