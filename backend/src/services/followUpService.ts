// @ts-nocheck

import CustomerFollowUp from '../models/appModels/CustomerFollowUp';
import Client from '../models/appModels/Client';
import Quote from '../models/appModels/Quote';
import Invoice from '../models/appModels/Invoice';
import sendMail from '../helpers/sendMail';
import cron from 'node-cron';
import mongoose from 'mongoose';
import Notification from '../models/appModels/Notification';
import Task from '../models/appModels/Task';
/**
 * Automated Customer Follow-Up Service
 * Handles scheduled follow-ups based on customer interactions and business rules
 */
class FollowUpService {
  constructor() {
    this.isProcessing = false;
  }

  /**
   * Initialize the follow-up service
   */
  async initialize() {
    // console.log('📧 Initializing Automated Follow-Up Service...');

    this.scheduleFollowUpProcessor();

    this.scheduleAutomatedFollowUpGeneration();

    // console.log('✅ Follow-Up Service initialized');
  }

  /**
   * Create a follow-up for a customer
   */
  async createFollowUp(userId, customerId, options = {}) {
    try {
      const {
        type = 'email',
        reason,
        scheduledDate,
        subject,
        message,
        relatedEntity = {},
        priority = 'normal',
        isAutomated = false,
      } = options;

      const customer = await Client.findOne({
        _id: customerId,
        owner: userId,
        removed: false,
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      const followUp = await CustomerFollowUp.create({
        owner: userId,
        customer: customerId,
        type,
        reason,
        scheduledDate: scheduledDate || new Date(),
        subject,
        message,
        relatedEntity,
        priority,
        isAutomated,
        status: 'scheduled',
      });

      console.log(`📅 Follow-up created: ${followUp._id} for ${customer.name}`);

      return {
        success: true,
        followUp,
      };
    } catch (error) {
      console.error('Create follow-up error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Schedule automatic follow-up processor
   */
  scheduleFollowUpProcessor() {
    cron.schedule('*/5 * * * *', async () => {
      try {
        if (!this.isProcessing) {
          await Promise.race([
            this.processPendingFollowUps(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 4 * 60 * 1000)
            ),
          ]);
        }
      } catch (error) {
        console.error('⚠️ Error in follow-up processing (non-blocking):', error.message);
        this.isProcessing = false;
      }
    });

    // console.log('⏰ Follow-up processor scheduled (every 5 minutes)');
  }

  /**
   * Process all pending follow-ups
   */
  async processPendingFollowUps() {
    try {
      this.isProcessing = true;

      const now = new Date();
      const pendingFollowUps = await CustomerFollowUp.find({
        status: 'scheduled',
        scheduledDate: { $lte: now },
        removed: false,
        attempts: { $lt: 3 },
      })
        .populate('customer', 'name email phone')
        .sort({ priority: -1, scheduledDate: 1 })
        .limit(50);

      if (pendingFollowUps.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`📬 Processing ${pendingFollowUps.length} pending follow-ups...`);

      for (const followUp of pendingFollowUps) {
        await this.executeFollowUp(followUp);
      }

      this.isProcessing = false;
    } catch (error) {
      console.error('Process pending follow-ups error:', error);
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single follow-up
   */
  async executeFollowUp(followUp) {
    try {
      followUp.attempts += 1;

      switch (followUp.type) {
        case 'email':
          await this.sendFollowUpEmail(followUp);
          break;
        case 'sms':
          await this.sendFollowUpSMS(followUp);
          break;
        case 'notification':
          await this.sendFollowUpNotification(followUp);
          break;
        case 'task':
          await this.createFollowUpTask(followUp);
          break;
        default:
          console.log(`⚠️  Unknown follow-up type: ${followUp.type}`);
      }

      followUp.status = 'sent';
      followUp.executedAt = new Date();
      await followUp.save();

      console.log(`✅ Follow-up executed: ${followUp._id}`);

      await this.scheduleNextFollowUpInSequence(followUp);
    } catch (error) {
      console.error(`❌ Follow-up execution error (${followUp._id}):`, error);

      if (followUp.attempts >= followUp.maxAttempts) {
        followUp.status = 'failed';
        followUp.lastError = error.message;
      }

      await followUp.save();
    }
  }

  /**
   * Send follow-up email
   */
  async sendFollowUpEmail(followUp) {
    try {
      if (!followUp.customer.email) {
        throw new Error('Customer email not found');
      }

      const emailContent = await this.generateEmailContent(followUp);

      await sendMail({
        email: followUp.customer.email,
        subject: followUp.subject || emailContent.subject,
        name: followUp.customer.name,
        html: emailContent.html,
      });

      console.log(`📧 Follow-up email sent to ${followUp.customer.email}`);
    } catch (error) {
      throw new Error(`Email send error: ${error.message}`);
    }
  }

  /**
   * Generate email content based on follow-up reason
   */
  async generateEmailContent(followUp) {
    const templates = {
      quote_follow_up: {
        subject: `Following up on your quote`,
        html: `
          <p>Hi ${followUp.customer.name},</p>
          <p>I wanted to follow up on the quote we sent you. Do you have any questions?</p>
          <p>${followUp.message || ''}</p>
          <p>Looking forward to hearing from you.</p>
        `,
      },
      invoice_reminder: {
        subject: `Payment reminder for invoice`,
        html: `
          <p>Hi ${followUp.customer.name},</p>
          <p>This is a friendly reminder about your outstanding invoice.</p>
          <p>${followUp.message || ''}</p>
          <p>Thank you for your business.</p>
        `,
      },
      payment_overdue: {
        subject: `Overdue payment notice`,
        html: `
          <p>Hi ${followUp.customer.name},</p>
          <p>We notice that your payment is overdue. Please contact us to resolve this.</p>
          <p>${followUp.message || ''}</p>
        `,
      },
      inactive_customer: {
        subject: `We miss you!`,
        html: `
          <p>Hi ${followUp.customer.name},</p>
          <p>We haven't heard from you in a while. We'd love to reconnect!</p>
          <p>${followUp.message || ''}</p>
        `,
      },
      post_purchase: {
        subject: `How was your experience?`,
        html: `
          <p>Hi ${followUp.customer.name},</p>
          <p>Thank you for your recent purchase! We'd love to hear about your experience.</p>
          <p>${followUp.message || ''}</p>
        `,
      },
      feedback_request: {
        subject: `We'd love your feedback`,
        html: `
          <p>Hi ${followUp.customer.name},</p>
          <p>Your opinion matters to us. Could you take a moment to share your feedback?</p>
          <p>${followUp.message || ''}</p>
        `,
      },
    };

    const template = templates[followUp.reason] || {
      subject: followUp.subject || 'Follow-up from our team',
      html: `
        <p>Hi ${followUp.customer.name},</p>
        <p>${followUp.message || 'We wanted to reach out to you.'}</p>
      `,
    };

    return template;
  }

  /**
   * Send follow-up SMS (placeholder)
   */
  async sendFollowUpSMS(followUp) {
    console.log(`📱 SMS follow-up to ${followUp.customer.phone}: ${followUp.message}`);
  }

  /**
   * Send follow-up notification
   */
  async sendFollowUpNotification(followUp) {
    try {

      await Notification.create({
        owner: followUp.owner,
        title: followUp.subject || 'Customer Follow-up',
        message: followUp.message,
        type: 'follow_up',
        priority: followUp.priority,
        link: `/client/read/${followUp.customer._id}`,
        data: {
          customerId: followUp.customer._id,
          customerName: followUp.customer.name,
          followUpId: followUp._id,
        },
      });

      console.log(`🔔 Notification created for follow-up ${followUp._id}`);
    } catch (error) {
      throw new Error(`Notification error: ${error.message}`);
    }
  }

  /**
   * Create follow-up task
   */
  async createFollowUpTask(followUp) {
    try {

      await Task.create({
        owner: followUp.owner,
        name: followUp.subject || `Follow up with ${followUp.customer.name}`,
        description: followUp.message,
        priority: followUp.priority,
        status: 'open',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        relatedTo: {
          model: 'Client',
          id: followUp.customer._id,
        },
      });

      console.log(`✅ Task created for follow-up ${followUp._id}`);
    } catch (error) {
      throw new Error(`Task creation error: ${error.message}`);
    }
  }

  /**
   * Schedule next follow-up in sequence
   */
  async scheduleNextFollowUpInSequence(followUp) {
    try {
      if (!followUp.sequenceId) return;

      const nextStep = followUp.sequenceStep + 1;
      const sequences = {
        quote_sequence: [
          { days: 3, reason: 'quote_follow_up', subject: 'Following up on your quote' },
          { days: 7, reason: 'quote_follow_up', subject: 'Still interested in our quote?' },
          { days: 14, reason: 'quote_follow_up', subject: 'Final follow-up on your quote' },
        ],
        invoice_sequence: [
          { days: 3, reason: 'invoice_reminder', subject: 'Upcoming payment due' },
          { days: 7, reason: 'invoice_reminder', subject: 'Payment reminder' },
          { days: 14, reason: 'payment_overdue', subject: 'Overdue payment notice' },
        ],
      };

      const sequence = sequences[followUp.sequenceId];
      if (!sequence || nextStep >= sequence.length) return;

      const nextFollowUp = sequence[nextStep];
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + nextFollowUp.days);

      await this.createFollowUp(followUp.owner, followUp.customer._id, {
        type: followUp.type,
        reason: nextFollowUp.reason,
        scheduledDate,
        subject: nextFollowUp.subject,
        sequenceId: followUp.sequenceId,
        sequenceStep: nextStep,
        isAutomated: true,
        priority: followUp.priority,
      });

      console.log(`📅 Next follow-up scheduled in sequence: Step ${nextStep + 1}`);
    } catch (error) {
      console.error('Schedule next follow-up error:', error);
    }
  }

  /**
   * Automated follow-up generation based on business events
   */
  scheduleAutomatedFollowUpGeneration() {
    cron.schedule('0 9 * * *', async () => {
      try {
        console.log('🤖 Generating automated follow-ups...');

        await Promise.race([
          Promise.all([
            this.generateQuoteFollowUps(),
            this.generateInvoiceFollowUps(),
            this.generateInactiveCustomerFollowUps(),
          ]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 10 * 60 * 1000)
          ),
        ]);
      } catch (error) {
        console.error('⚠️ Error in automated follow-up generation (non-blocking):', error.message);
      }
    });

    // console.log('📅 Automated follow-up generation scheduled (daily at 9 AM)');
  }

  /**
   * Generate follow-ups for pending quotes
   */
  async generateQuoteFollowUps() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const pendingQuotes = await Quote.find({
        status: 'sent',
        created: { $lte: threeDaysAgo },
        removed: false,
      }).populate('client');

      for (const quote of pendingQuotes) {
        const existingFollowUp = await CustomerFollowUp.findOne({
          customer: quote.client._id,
          'relatedEntity.entityId': quote._id,
          'relatedEntity.entityType': 'quote',
          status: { $in: ['scheduled', 'sent'] },
        });

        if (!existingFollowUp) {
          await this.createFollowUp(quote.owner, quote.client._id, {
            type: 'email',
            reason: 'quote_follow_up',
            scheduledDate: new Date(),
            subject: `Following up on Quote #${quote.number}`,
            message: `We wanted to check if you have any questions about the quote we sent.`,
            relatedEntity: {
              entityType: 'quote',
              entityId: quote._id,
            },
            sequenceId: 'quote_sequence',
            sequenceStep: 0,
            isAutomated: true,
          });
        }
      }

      console.log(`✅ Generated follow-ups for ${pendingQuotes.length} quotes`);
    } catch (error) {
      console.error('Generate quote follow-ups error:', error);
    }
  }

  /**
   * Generate follow-ups for unpaid invoices
   */
  async generateInvoiceFollowUps() {
    try {
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const upcomingInvoices = await Invoice.find({
        paymentStatus: { $in: ['unpaid', 'partial'] },
        expiredDate: { $lte: threeDaysFromNow, $gte: new Date() },
        removed: false,
      }).populate('client');

      for (const invoice of upcomingInvoices) {
        const existingFollowUp = await CustomerFollowUp.findOne({
          customer: invoice.client._id,
          'relatedEntity.entityId': invoice._id,
          'relatedEntity.entityType': 'invoice',
          status: { $in: ['scheduled', 'sent'] },
        });

        if (!existingFollowUp) {
          await this.createFollowUp(invoice.owner, invoice.client._id, {
            type: 'email',
            reason: 'invoice_reminder',
            scheduledDate: new Date(),
            subject: `Payment reminder for Invoice #${invoice.number}`,
            message: `Your invoice payment is due soon. Please review and process payment.`,
            relatedEntity: {
              entityType: 'invoice',
              entityId: invoice._id,
            },
            sequenceId: 'invoice_sequence',
            sequenceStep: 0,
            isAutomated: true,
          });
        }
      }

      console.log(`✅ Generated follow-ups for ${upcomingInvoices.length} invoices`);
    } catch (error) {
      console.error('Generate invoice follow-ups error:', error);
    }
  }

  /**
   * Generate follow-ups for inactive customers
   */
  async generateInactiveCustomerFollowUps() {
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const inactiveCustomers = await Client.aggregate([
        {
          $lookup: {
            from: 'invoices',
            localField: '_id',
            foreignField: 'client',
            as: 'recentInvoices',
          },
        },
        {
          $match: {
            removed: false,
            $or: [
              { 'recentInvoices.created': { $lte: ninetyDaysAgo } },
              { recentInvoices: { $size: 0 } },
            ],
          },
        },
        { $limit: 20 },
      ]);

      for (const customer of inactiveCustomers) {
        const existingFollowUp = await CustomerFollowUp.findOne({
          customer: customer._id,
          reason: 'inactive_customer',
          created: { $gte: ninetyDaysAgo },
        });

        if (!existingFollowUp) {
          await this.createFollowUp(customer.owner, customer._id, {
            type: 'email',
            reason: 'inactive_customer',
            scheduledDate: new Date(),
            subject: `We miss you!`,
            message: `It's been a while since we last connected. We'd love to hear from you!`,
            isAutomated: true,
          });
        }
      }

      console.log(`✅ Generated follow-ups for ${inactiveCustomers.length} inactive customers`);
    } catch (error) {
      console.error('Generate inactive customer follow-ups error:', error);
    }
  }

  /**
   * Track customer response to follow-up
   */
  async trackResponse(followUpId, responseData) {
    try {
      const followUp = await CustomerFollowUp.findById(followUpId);

      if (!followUp) {
        throw new Error('Follow-up not found');
      }

      followUp.customerResponse = {
        responded: true,
        responseDate: new Date(),
        responseText: responseData.text,
        sentiment: responseData.sentiment || 'neutral',
      };

      followUp.status = 'responded';
      await followUp.save();

      console.log(`✅ Response tracked for follow-up ${followUpId}`);

      return {
        success: true,
        followUp,
      };
    } catch (error) {
      console.error('Track response error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get follow-up analytics
   */
  async getAnalytics(userId, timeframe = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeframe);

      const analytics = await CustomerFollowUp.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId),
            created: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            responseRate: {
              $avg: { $cond: ['$customerResponse.responded', 1, 0] },
            },
          },
        },
      ]);

      return {
        success: true,
        analytics,
      };
    } catch (error) {
      console.error('Get analytics error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Cancel a scheduled follow-up
   */
  async cancelFollowUp(followUpId) {
    try {
      const followUp = await CustomerFollowUp.findById(followUpId);

      if (!followUp) {
        throw new Error('Follow-up not found');
      }

      followUp.status = 'cancelled';
      await followUp.save();

      console.log(`❌ Follow-up cancelled: ${followUpId}`);

      return {
        success: true,
        followUp,
      };
    } catch (error) {
      console.error('Cancel follow-up error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

const followUpService = new FollowUpService();

export = followUpService;
