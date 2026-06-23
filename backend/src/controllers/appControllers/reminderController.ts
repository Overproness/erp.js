// @ts-nocheck

import { sendEmail } from '@/helpers/sendMail';
import AutomatedReminder from '@/models/appModels/AutomatedReminder';
import Appointment from '@/models/appModels/Appointment';
import Task from '@/models/appModels/Task';
// Create automated reminder
const createReminder = async (req, res) => {
  try {
    const { body } = req;
    const userId = req.companyOwner?._id || req.user?._id;

    const reminder = new AutomatedReminder({
      ...body,
      createdBy: userId,
    });

    // Calculate scheduled time if relative
    if (body.targetId && body.schedule.type === 'relative') {
      let referenceDate;

      if (body.targetType === 'appointment') {
        const appointment = await Appointment.findById(body.targetId);
        if (appointment) {
          referenceDate = appointment.startTime;
        }
      } else if (body.targetType === 'task') {
        const task = await Task.findById(body.targetId);
        if (task) {
          referenceDate = task.deadline || task.dueDate;
        }
      }

      if (referenceDate) {
        await reminder.calculateScheduledTime(referenceDate);
      }
    }

    await reminder.save();

    const populated = await AutomatedReminder.findById(reminder._id)
      .populate('createdBy', 'name email')
      .populate('recipients.userId', 'name email');

    res.status(201).json({
      success: true,
      result: populated,
      message: 'Reminder created successfully',
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating reminder',
    });
  }
};

// Get all reminders
const getReminders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, targetType, search } = req.query;
    const userId = req.companyOwner?._id || req.user?._id;

    const query = { removed: false };

    // Filter by user (creator or recipient)
    query.$or = [{ createdBy: userId }, { 'recipients.userId': userId }];

    if (status) query.status = status;
    if (type) query.type = type;
    if (targetType) query.targetType = targetType;

    // Search filter
    if (search) {
      query.$and = [
        query.$or ? { $or: query.$or } : {},
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      ];
      delete query.$or;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reminders = await AutomatedReminder.find(query)
      .populate('createdBy', 'name email photo')
      .populate('recipients.userId', 'name email')
      .populate('targetId')
      .sort({ scheduledFor: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AutomatedReminder.countDocuments(query);

    res.json({
      success: true,
      result: reminders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reminders',
    });
  }
};

// Get single reminder
const getReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await AutomatedReminder.findOne({
      _id: id,
      removed: false,
    })
      .populate('createdBy', 'name email photo')
      .populate('recipients.userId', 'name email photo')
      .populate('targetId');

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    res.json({
      success: true,
      result: reminder,
    });
  } catch (error) {
    console.error('Error fetching reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching reminder',
    });
  }
};

// Update reminder
const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;

    const reminder = await AutomatedReminder.findOne({
      _id: id,
      removed: false,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    // Cannot update sent reminders
    if (reminder.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a reminder that has already been sent',
      });
    }

    Object.assign(reminder, body);

    // Recalculate scheduled time if schedule changed
    if (body.schedule && reminder.targetId) {
      let referenceDate;

      if (reminder.targetType === 'appointment') {
        const appointment = await Appointment.findById(reminder.targetId);
        if (appointment) {
          referenceDate = appointment.startTime;
        }
      } else if (reminder.targetType === 'task') {
        const task = await Task.findById(reminder.targetId);
        if (task) {
          referenceDate = task.deadline || task.dueDate;
        }
      }

      if (referenceDate) {
        await reminder.calculateScheduledTime(referenceDate);
      }
    }

    await reminder.save();

    const updated = await AutomatedReminder.findById(id)
      .populate('createdBy', 'name email')
      .populate('recipients.userId', 'name email');

    res.json({
      success: true,
      result: updated,
      message: 'Reminder updated successfully',
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating reminder',
    });
  }
};

// Delete reminder
const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await AutomatedReminder.findOneAndUpdate(
      { _id: id, removed: false },
      { removed: true },
      { new: true }
    );

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    res.json({
      success: true,
      message: 'Reminder deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting reminder',
    });
  }
};

// Cancel reminder
const cancelReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await AutomatedReminder.findOne({
      _id: id,
      removed: false,
    });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    if (reminder.status === 'sent') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a reminder that has already been sent',
      });
    }

    reminder.status = 'cancelled';
    await reminder.save();

    res.json({
      success: true,
      result: reminder,
      message: 'Reminder cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling reminder',
    });
  }
};

// Get due reminders
const getDueReminders = async (req, res) => {
  try {
    const reminders = await AutomatedReminder.findDueReminders();

    res.json({
      success: true,
      result: reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error('Error fetching due reminders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching due reminders',
    });
  }
};

// Send reminder manually
const sendReminderManually = async (req, res) => {
  try {
    const { id } = req.params;

    const reminder = await AutomatedReminder.findOne({
      _id: id,
      removed: false,
    })
      .populate('targetId')
      .populate('recipients.userId', 'name email');

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found',
      });
    }

    // Send email reminders
    if (reminder.channels.email.enabled) {
      for (const recipient of reminder.recipients) {
        try {
          const email = recipient.email || recipient.userId?.email;
          if (!email) continue;

          const emailData = {
            to: email,
            subject: reminder.channels.email.subject || `Reminder: ${reminder.name}`,
            html: reminder.channels.email.customContent || buildReminderEmail(reminder),
          };

          await sendEmail(emailData);

          reminder.markAsSent('email', recipient._id.toString(), {
            success: true,
          });
        } catch (error) {
          console.error('Error sending email reminder:', error);
          reminder.markAsFailed('email', recipient._id.toString(), error.message);
        }
      }
    }

    // TODO: Implement SMS, Push, Webhook sending

    await reminder.save();

    res.json({
      success: true,
      result: reminder,
      message: 'Reminder sent successfully',
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error sending reminder',
    });
  }
};

// Helper function to build reminder email
function buildReminderEmail(reminder) {
  const target = reminder.targetId;
  let content = `<h2>${reminder.name}</h2>`;

  if (reminder.description) {
    content += `<p>${reminder.description}</p>`;
  }

  if (reminder.type === 'appointment' && target) {
    content += `
      <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;">
        <h3>${target.title}</h3>
        <p><strong>Time:</strong> ${new Date(target.startTime).toLocaleString()}</p>
        ${
          target.location?.meetingUrl
            ? `<p><strong>Meeting URL:</strong> <a href="${target.location.meetingUrl}">${target.location.meetingUrl}</a></p>`
            : ''
        }
        ${target.description ? `<p>${target.description}</p>` : ''}
      </div>
    `;
  } else if (reminder.type === 'task' && target) {
    content += `
      <div style="margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;">
        <h3>${target.title}</h3>
        <p><strong>Due Date:</strong> ${
          target.dueDate ? new Date(target.dueDate).toLocaleString() : 'Not set'
        }</p>
        <p><strong>Priority:</strong> ${target.priority || 'Normal'}</p>
        ${target.description ? `<p>${target.description}</p>` : ''}
      </div>
    `;
  }

  content += `
    <p style="margin-top: 20px; color: #666; font-size: 12px;">
      This is an automated reminder. Please do not reply to this email.
    </p>
  `;

  return content;
}

// Get reminder statistics
const getReminderStats = async (req, res) => {
  try {
    const userId = req.companyOwner?._id || req.user?._id;

    const stats = await AutomatedReminder.aggregate([
      {
        $match: {
          removed: false,
          $or: [{ createdBy: userId }, { 'recipients.userId': userId }],
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const typeStats = await AutomatedReminder.aggregate([
      {
        $match: {
          removed: false,
          createdBy: userId,
        },
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
        },
      },
    ]);

    const recentSent = await AutomatedReminder.find({
      removed: false,
      createdBy: userId,
      status: 'sent',
    })
      .sort({ sentAt: -1 })
      .limit(10)
      .populate('targetId');

    res.json({
      success: true,
      result: {
        byStatus: stats,
        byType: typeStats,
        recentSent,
      },
    });
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching statistics',
    });
  }
};

export = {
  createReminder,
  getReminders,
  getReminder,
  updateReminder,
  deleteReminder,
  cancelReminder,
  getDueReminders,
  sendReminderManually,
  getReminderStats,
};
