const ChatQueue = require('../models/appModels/ChatQueue');
const copilotService = require('./copilotService');
const cron = require('node-cron');
const mongoose = require('mongoose');

/**
 * 24/7 Chat Queue Service
 * Handles offline messages and ensures 24/7 availability
 */
class ChatQueueService {
  constructor() {
    this.isProcessing = false;
    this.processingInterval = null;
    this.maxConcurrent = 5;
  }

  /**
   * Initialize the 24/7 service
   */
  async initialize() {
    console.log('🤖 Initializing 24/7 Chat Queue Service...');

    this.startQueueProcessor();

    this.scheduleMaintenance();

    console.log('✅ Chat Queue Service initialized');
  }

  /**
   * Add message to queue for offline/async processing
   */
  async queueMessage(userId, message, context = {}, priority = 'normal') {
    try {
      const queueItem = await ChatQueue.create({
        owner: userId,
        user: context.userId,
        message,
        context,
        priority,
        status: 'pending',
        assistantId: context.assistantId || 'default',
      });

      console.log(`📨 Message queued: ${queueItem._id} (Priority: ${priority})`);

      if (priority === 'urgent' || priority === 'high') {
        setImmediate(() => this.processNextInQueue());
      }

      return {
        success: true,
        queueId: queueItem._id,
        estimatedWaitTime: await this.estimateWaitTime(priority),
      };
    } catch (error) {
      console.error('Queue message error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process messages in queue
   */
  startQueueProcessor() {
    this.processingInterval = setInterval(async () => {
      if (!this.isProcessing) {
        await this.processBatch();
      }
    }, 5000);

    console.log('⚙️  Queue processor started (every 5 seconds)');
  }

  /**
   * Process a batch of pending messages
   */
  async processBatch() {
    try {
      this.isProcessing = true;

      const pendingMessages = await ChatQueue.find({
        status: 'pending',
        removed: false,
        attempts: { $lt: mongoose.model('ChatQueue').schema.path('maxAttempts').default() },
      })
        .sort({ priority: -1, created: 1 })
        .limit(this.maxConcurrent);

      if (pendingMessages.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`🔄 Processing ${pendingMessages.length} queued messages...`);

      const promises = pendingMessages.map((queueItem) => this.processQueueItem(queueItem));

      await Promise.allSettled(promises);

      this.isProcessing = false;
    } catch (error) {
      console.error('Process batch error:', error);
      this.isProcessing = false;
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(queueItem) {
    try {
      queueItem.status = 'processing';
      queueItem.attempts += 1;
      await queueItem.save();

      const result = await copilotService.processChat(
        queueItem.assistantId,
        queueItem.message,
        queueItem.owner,
        queueItem.context
      );

      if (result.success) {
        queueItem.status = 'completed';
        queueItem.response = result.message;
        queueItem.processedAt = new Date();
        await queueItem.save();

        console.log(`✅ Processed queue item: ${queueItem._id}`);

        await this.notifyUser(queueItem);
      } else {
        throw new Error(result.error || 'Processing failed');
      }
    } catch (error) {
      console.error(`❌ Queue item processing error (${queueItem._id}):`, error);

      if (queueItem.attempts >= queueItem.maxAttempts) {
        queueItem.status = 'failed';
        queueItem.error = error.message;
      } else {
        queueItem.status = 'pending';
      }

      await queueItem.save();
    }
  }

  /**
   * Notify user when their queued message is processed
   */
  async notifyUser(queueItem) {
    try {
      const Notification = require('../models/appModels/Notification');

      await Notification.create({
        owner: queueItem.owner,
        title: 'AI Assistant Response Ready',
        message: `Your question has been answered: "${queueItem.message.substring(0, 50)}..."`,
        type: 'ai_response',
        priority: 'normal',
        link: `/ai-assistant/conversation/${queueItem._id}`,
        data: {
          queueId: queueItem._id,
          response: queueItem.response,
        },
      });
    } catch (error) {
      console.error('Notify user error:', error);
    }
  }

  /**
   * Estimate wait time based on queue depth and priority
   */
  async estimateWaitTime(priority) {
    try {
      const priorityWeights = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3,
      };

      const queueCount = await ChatQueue.countDocuments({
        status: 'pending',
        priority: { $lte: priorityWeights[priority] },
      });

      const avgProcessingTime = 10;
      const estimatedSeconds = (queueCount / this.maxConcurrent) * avgProcessingTime;

      return Math.ceil(estimatedSeconds);
    } catch (error) {
      console.error('Estimate wait time error:', error);
      return 30;
    }
  }

  /**
   * Get queue status for a specific message
   */
  async getQueueStatus(queueId) {
    try {
      const queueItem = await ChatQueue.findById(queueId);

      if (!queueItem) {
        return {
          success: false,
          error: 'Queue item not found',
        };
      }

      return {
        success: true,
        status: queueItem.status,
        response: queueItem.response,
        error: queueItem.error,
        attempts: queueItem.attempts,
        processedAt: queueItem.processedAt,
        estimatedWaitTime: await this.estimateWaitTime(queueItem.priority),
      };
    } catch (error) {
      console.error('Get queue status error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process next message in queue immediately (for urgent requests)
   */
  async processNextInQueue() {
    const nextMessage = await ChatQueue.findOne({
      status: 'pending',
      removed: false,
    }).sort({ priority: -1, created: 1 });

    if (nextMessage) {
      await this.processQueueItem(nextMessage);
    }
  }

  /**
   * Schedule maintenance tasks
   */
  scheduleMaintenance() {
    cron.schedule('0 */6 * * *', async () => {
      console.log('🧹 Running queue maintenance...');

      await this.cleanOldQueueItems();
      await this.retryFailedItems();
    });

    console.log('📅 Maintenance scheduled (every 6 hours)');
  }

  /**
   * Clean old completed/failed queue items
   */
  async cleanOldQueueItems() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await ChatQueue.updateMany(
        {
          status: { $in: ['completed', 'failed'] },
          created: { $lt: sevenDaysAgo },
          removed: false,
        },
        { $set: { removed: true } }
      );

      console.log(`🗑️  Cleaned ${result.modifiedCount} old queue items`);
    } catch (error) {
      console.error('Clean old queue items error:', error);
    }
  }

  /**
   * Retry failed items with attempts remaining
   */
  async retryFailedItems() {
    try {
      const failedItems = await ChatQueue.find({
        status: 'failed',
        attempts: { $lt: mongoose.model('ChatQueue').schema.path('maxAttempts').default() },
        removed: false,
      }).limit(10);

      for (const item of failedItems) {
        item.status = 'pending';
        await item.save();
      }

      console.log(`🔄 Reset ${failedItems.length} failed items for retry`);
    } catch (error) {
      console.error('Retry failed items error:', error);
    }
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown() {
    console.log('🛑 Shutting down Chat Queue Service...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    await this.processBatch();

    console.log('✅ Chat Queue Service shutdown complete');
  }

  /**
   * Get queue statistics
   */
  async getStatistics(userId) {
    try {
      const stats = await ChatQueue.aggregate([
        { $match: { owner: mongoose.Types.ObjectId(userId), removed: false } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgAttempts: { $avg: '$attempts' },
          },
        },
      ]);

      return {
        success: true,
        stats: stats.reduce((acc, stat) => {
          acc[stat._id] = {
            count: stat.count,
            avgAttempts: stat.avgAttempts,
          };
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const chatQueueService = new ChatQueueService();

module.exports = chatQueueService;
