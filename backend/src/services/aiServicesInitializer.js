const chatQueueService = require('./chatQueueService');
const followUpService = require('./followUpService');
const selfLearningService = require('./selfLearningService');

/**
 * Initialize all AI services for 24/7 operations
 */
async function initializeAIServices() {
  console.log('🚀 Initializing AI Services...\n');

  try {
    await chatQueueService.initialize();
    console.log('');

    await followUpService.initialize();
    console.log('');

    await selfLearningService.initialize();
    console.log('');

    console.log('✅ All AI Services initialized successfully!\n');
    console.log('🤖 24/7 AI Virtual Assistant is now active');
    console.log('📧 Automated Follow-Up System is running');
    console.log('🧠 Self-Learning Engine is active\n');

    return {
      success: true,
      services: {
        chatQueue: 'active',
        followUp: 'active',
        selfLearning: 'active',
      },
    };
  } catch (error) {
    console.error('❌ Failed to initialize AI services:', error);
    return {
      success: false,
      error: error.message,
    };
  }
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
