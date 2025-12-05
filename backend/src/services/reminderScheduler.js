const cron = require('node-cron');
const AutomatedReminder = require('@/models/appModels/AutomatedReminder');
const Appointment = require('@/models/appModels/Appointment');
const Task = require('@/models/appModels/Task');
const BusinessProcess = require('@/models/appModels/BusinessProcess');
const { sendEmail } = require('@/helpers/sendMail');

class ReminderSchedulerService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the reminder scheduler
   * Runs every minute to check for due reminders
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Reminder scheduler is already running');
      return;
    }

    console.log('🔔 Starting Reminder Scheduler Service...');

    // Check for due reminders every minute
    this.mainJob = cron.schedule('* * * * *', async () => {
      await this.processDueReminders();
    });

    // Check for expired reminders every hour
    this.cleanupJob = cron.schedule('0 * * * *', async () => {
      await this.cleanupExpiredReminders();
    });

    // Check for appointments needing reminders every 5 minutes
    this.appointmentReminderJob = cron.schedule('*/5 * * * *', async () => {
      await this.processAppointmentReminders();
    });

    this.isRunning = true;
    console.log('✅ Reminder Scheduler Service started successfully');
  }

  /**
   * Stop the reminder scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Reminder scheduler is not running');
      return;
    }

    console.log('🛑 Stopping Reminder Scheduler Service...');

    if (this.mainJob) this.mainJob.stop();
    if (this.cleanupJob) this.cleanupJob.stop();
    if (this.appointmentReminderJob) this.appointmentReminderJob.stop();

    this.isRunning = false;
    console.log('✅ Reminder Scheduler Service stopped');
  }

  /**
   * Process all due reminders
   */
  async processDueReminders() {
    try {
      const dueReminders = await AutomatedReminder.findDueReminders();

      if (dueReminders.length === 0) {
        return;
      }

      console.log(`📬 Processing ${dueReminders.length} due reminders...`);

      for (const reminder of dueReminders) {
        try {
          await this.sendReminder(reminder);
        } catch (error) {
          console.error(`❌ Error processing reminder ${reminder._id}:`, error.message);
        }
      }

      console.log(`✅ Processed ${dueReminders.length} reminders`);
    } catch (error) {
      console.error('❌ Error in processDueReminders:', error);
    }
  }

  /**
   * Send a single reminder through configured channels
   */
  async sendReminder(reminder) {
    try {
      // Populate target data
      await reminder.populate('targetId');
      await reminder.populate('recipients.userId');

      // Check conditions if enabled
      if (reminder.conditions.enabled) {
        const conditionsMet = await reminder.checkConditions(reminder.targetId || {});
        if (!conditionsMet) {
          console.log(`⏭️ Skipping reminder ${reminder._id} - conditions not met`);
          reminder.status = 'cancelled';
          await reminder.save();
          return;
        }
      }

      let anySuccess = false;

      // Send via Email
      if (reminder.channels.email.enabled) {
        const emailSuccess = await this.sendEmailReminder(reminder);
        if (emailSuccess) anySuccess = true;
      }

      // Send via SMS
      if (reminder.channels.sms.enabled) {
        const smsSuccess = await this.sendSmsReminder(reminder);
        if (smsSuccess) anySuccess = true;
      }

      // Send via Push Notification
      if (reminder.channels.push.enabled) {
        const pushSuccess = await this.sendPushReminder(reminder);
        if (pushSuccess) anySuccess = true;
      }

      // Send via Webhook
      if (reminder.channels.webhook.enabled) {
        const webhookSuccess = await this.sendWebhookReminder(reminder);
        if (webhookSuccess) anySuccess = true;
      }

      if (anySuccess) {
        reminder.status = 'sent';
        reminder.sentAt = new Date();
      } else {
        reminder.markAsFailed('all', null, 'All channels failed');
      }

      await reminder.save();
      console.log(`✅ Reminder ${reminder._id} processed successfully`);
    } catch (error) {
      console.error(`❌ Error sending reminder ${reminder._id}:`, error);
      reminder.markAsFailed('all', null, error.message);
      await reminder.save();
    }
  }

  /**
   * Send reminder via email
   */
  async sendEmailReminder(reminder) {
    try {
      const recipients = reminder.recipients.filter((r) => r.email || r.userId?.email);

      if (recipients.length === 0) {
        console.log(`⚠️ No email recipients for reminder ${reminder._id}`);
        return false;
      }

      for (const recipient of recipients) {
        const email = recipient.email || recipient.userId?.email;
        if (!email) continue;

        try {
          const emailContent = this.buildEmailContent(reminder);

          await sendEmail({
            to: email,
            subject: reminder.channels.email.subject || `Reminder: ${reminder.name}`,
            html: reminder.channels.email.customContent || emailContent,
          });

          reminder.markAsSent('email', recipient._id.toString(), {
            success: true,
          });

          console.log(`📧 Email sent to ${email} for reminder ${reminder._id}`);
        } catch (error) {
          console.error(`❌ Error sending email to ${email}:`, error.message);
          reminder.markAsFailed('email', recipient._id.toString(), error.message);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error in sendEmailReminder:', error);
      return false;
    }
  }

  /**
   * Send reminder via SMS (placeholder - requires SMS service integration)
   */
  async sendSmsReminder(reminder) {
    try {
      const recipients = reminder.recipients.filter((r) => r.phone);

      if (recipients.length === 0) {
        console.log(`⚠️ No SMS recipients for reminder ${reminder._id}`);
        return false;
      }

      // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
      console.log(`📱 SMS reminder placeholder - would send to ${recipients.length} recipients`);

      for (const recipient of recipients) {
        reminder.markAsSent('sms', recipient._id.toString(), {
          success: true,
          placeholder: true,
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error in sendSmsReminder:', error);
      return false;
    }
  }

  /**
   * Send reminder via push notification (placeholder)
   */
  async sendPushReminder(reminder) {
    try {
      // TODO: Integrate with push notification service (Firebase, OneSignal, etc.)
      console.log(`🔔 Push notification placeholder for reminder ${reminder._id}`);

      for (const recipient of reminder.recipients) {
        reminder.markAsSent('push', recipient._id.toString(), {
          success: true,
          placeholder: true,
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Error in sendPushReminder:', error);
      return false;
    }
  }

  /**
   * Send reminder via webhook
   */
  async sendWebhookReminder(reminder) {
    try {
      const webhookConfig = reminder.channels.webhook;
      if (!webhookConfig.url) {
        return false;
      }

      const payload = webhookConfig.payload || {
        reminderId: reminder._id,
        name: reminder.name,
        type: reminder.type,
        targetType: reminder.targetType,
        targetId: reminder.targetId,
        scheduledFor: reminder.scheduledFor,
        sentAt: new Date(),
      };

      const response = await fetch(webhookConfig.url, {
        method: webhookConfig.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhookConfig.headers,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        reminder.markAsSent('webhook', 'webhook', {
          success: true,
          statusCode: response.status,
        });
        console.log(`🔗 Webhook sent successfully for reminder ${reminder._id}`);
        return true;
      } else {
        throw new Error(`Webhook failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error in sendWebhookReminder:', error);
      reminder.markAsFailed('webhook', 'webhook', error.message);
      return false;
    }
  }

  /**
   * Build email content for reminder
   */
  buildEmailContent(reminder) {
    const target = reminder.targetId;
    let content = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a8a;">${reminder.name}</h2>
    `;

    if (reminder.description) {
      content += `<p>${reminder.description}</p>`;
    }

    if (reminder.type === 'appointment' && target) {
      content += `
        <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #1e3a8a; border-radius: 5px;">
          <h3 style="margin-top: 0;">${target.title}</h3>
          <p><strong>📅 Date & Time:</strong> ${new Date(target.startTime).toLocaleString()}</p>
          <p><strong>⏱️ Duration:</strong> ${
            target.durationFormatted || `${target.duration} minutes`
          }</p>
          ${
            target.location?.type
              ? `<p><strong>📍 Location:</strong> ${target.location.type}</p>`
              : ''
          }
          ${
            target.location?.meetingUrl
              ? `<p><strong>🔗 Meeting Link:</strong> <a href="${target.location.meetingUrl}" style="color: #1e3a8a;">${target.location.meetingUrl}</a></p>`
              : ''
          }
          ${
            target.location?.address
              ? `<p><strong>📍 Address:</strong> ${target.location.address}</p>`
              : ''
          }
          ${target.description ? `<p>${target.description}</p>` : ''}
        </div>
      `;
    } else if (reminder.type === 'task' && target) {
      content += `
        <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #1e3a8a; border-radius: 5px;">
          <h3 style="margin-top: 0;">${target.title}</h3>
          <p><strong>📅 Due Date:</strong> ${
            target.dueDate ? new Date(target.dueDate).toLocaleString() : 'Not set'
          }</p>
          <p><strong>⚡ Priority:</strong> ${target.priority || 'Normal'}</p>
          <p><strong>📊 Status:</strong> ${target.status || 'pending'}</p>
          ${target.description ? `<p>${target.description}</p>` : ''}
        </div>
      `;
    } else if (reminder.type === 'followup' && target) {
      content += `
        <div style="margin: 20px 0; padding: 20px; background: #f5f5f5; border-left: 4px solid #1e3a8a; border-radius: 5px;">
          <h3 style="margin-top: 0;">Follow-up Required</h3>
          <p>This is a reminder to follow up on the scheduled activity.</p>
        </div>
      `;
    }

    content += `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated reminder from your Business Process Automation system.
          </p>
          <p style="color: #666; font-size: 12px; margin: 5px 0 0 0;">
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    return content;
  }

  /**
   * Process appointment reminders
   */
  async processAppointmentReminders() {
    try {
      const appointments = await Appointment.findNeedingReminders();

      if (appointments.length === 0) {
        return;
      }

      console.log(`📅 Processing reminders for ${appointments.length} appointments...`);

      for (const appointment of appointments) {
        for (const reminder of appointment.reminders) {
          if (reminder.sent || reminder.status !== 'pending') continue;

          const now = new Date();
          const minutesUntil = Math.round((appointment.startTime - now) / (1000 * 60));

          if (minutesUntil <= reminder.timing && minutesUntil > 0) {
            try {
              // Create automated reminder
              const automatedReminder = new AutomatedReminder({
                name: `Appointment Reminder - ${appointment.title}`,
                type: 'appointment',
                targetType: 'appointment',
                targetId: appointment._id,
                recipients: appointment.attendees
                  .filter((att) => att.reminders.email)
                  .map((att) => ({
                    type: att.email ? 'email' : 'user',
                    userId: att.userId,
                    email: att.email,
                    name: att.name,
                  })),
                schedule: {
                  type: 'absolute',
                  absoluteTime: now,
                },
                channels: {
                  email: {
                    enabled: true,
                    subject: `Reminder: ${appointment.title} in ${minutesUntil} minutes`,
                  },
                },
                createdBy: appointment.organizer,
                scheduledFor: now,
              });

              await automatedReminder.save();
              await this.sendReminder(automatedReminder);

              // Mark as sent in appointment
              reminder.sent = true;
              reminder.sentAt = new Date();
              reminder.status = 'sent';
            } catch (error) {
              console.error(
                `❌ Error creating reminder for appointment ${appointment._id}:`,
                error
              );
            }
          }
        }

        await appointment.save();
      }
    } catch (error) {
      console.error('❌ Error in processAppointmentReminders:', error);
    }
  }

  /**
   * Cleanup expired reminders
   */
  async cleanupExpiredReminders() {
    try {
      const result = await AutomatedReminder.updateMany(
        {
          status: 'scheduled',
          scheduledFor: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        {
          $set: { status: 'expired' },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`🧹 Marked ${result.modifiedCount} reminders as expired`);
      }
    } catch (error) {
      console.error('❌ Error in cleanupExpiredReminders:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      mainJob: this.mainJob ? 'active' : 'inactive',
      cleanupJob: this.cleanupJob ? 'active' : 'inactive',
      appointmentReminderJob: this.appointmentReminderJob ? 'active' : 'inactive',
    };
  }
}

// Create singleton instance
const reminderScheduler = new ReminderSchedulerService();

module.exports = reminderScheduler;
