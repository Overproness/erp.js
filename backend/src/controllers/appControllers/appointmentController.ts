// @ts-nocheck

import { generateUniqueCode } from '@/helpers/urlShortener';
import Appointment from '@/models/appModels/Appointment';
import AutomatedReminder from '@/models/appModels/AutomatedReminder';
import URL from '@/models/appModels/URL';
// Create appointment
const createAppointment = async (req, res) => {
  try {
    const { body } = req;
    const userId = req.companyOwner?._id || req.user?._id;

    // Validate time
    const startTime = new Date(body.startTime);
    const endTime = new Date(body.endTime);

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    // Create appointment
    const appointment = new Appointment({
      ...body,
      organizer: userId,
      createdBy: userId,
    });

    // Check for conflicts if needed
    if (body.checkConflicts) {
      const hasConflict = await appointment.hasConflict(userId);
      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'This appointment conflicts with another scheduled appointment',
        });
      }
    }

    // Generate booking URL if requested
    if (body.generateBookingUrl) {
      const shortCode = generateUniqueCode();
      const bookingUrl = new URL({
        originalUrl: `${process.env.FRONTEND_URL}/book-appointment/${appointment._id}`,
        shortCode: shortCode,
        title: `Book: ${appointment.title}`,
        description: appointment.description,
        type: 'appointment_booking',
        owner: userId,
        expiresAt: body.bookingUrl?.expiresAt || appointment.startTime,
        analytics: {
          trackClicks: true,
          trackConversions: true,
        },
      });

      await bookingUrl.save();

      appointment.bookingUrl = {
        shortCode: shortCode,
        urlId: bookingUrl._id,
        expiresAt: bookingUrl.expiresAt,
        allowReschedule: body.bookingUrl?.allowReschedule !== false,
        allowCancel: body.bookingUrl?.allowCancel !== false,
      };
    }

    await appointment.save();

    // Create automated reminders if enabled
    if (body.automationSettings?.sendReminders !== false) {
      const reminders = await AutomatedReminder.createForAppointment(
        appointment._id,
        appointment,
        userId
      );

      for (const reminder of reminders) {
        await reminder.save();
      }

      appointment.reminders = reminders.map((r) => ({
        type: 'email',
        timing: r.schedule.relativeTiming.value,
        status: 'pending',
      }));

      await appointment.save();
    }

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('organizer', 'name email')
      .populate('attendees.userId', 'name email')
      .populate('relatedClient', 'name company email')
      .populate('relatedLead', 'name email');

    res.status(201).json({
      success: true,
      result: populatedAppointment,
      message: 'Appointment created successfully',
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating appointment',
    });
  }
};

// Get all appointments
const getAppointments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, startDate, endDate, search } = req.query;
    const userId = req.companyOwner?._id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const query = { removed: false };

    // Filter by user (organizer or attendee)
    query.$or = [{ organizer: userId }, { 'attendees.userId': userId }];

    if (status) query.status = status;
    if (type) query.type = type;

    // Date range filter
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'attendees.name': { $regex: search, $options: 'i' } },
        { 'attendees.email': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(query)
      .populate('organizer', 'name email photo')
      .populate('attendees.userId', 'name email photo')
      .populate('relatedClient', 'name company email')
      .populate('relatedLead', 'name email')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      result: appointments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointments',
    });
  }
};

// Get single appointment
const getAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOne({
      _id: id,
      removed: false,
    })
      .populate('organizer', 'name email photo')
      .populate('attendees.userId', 'name email photo')
      .populate('relatedClient', 'name company email phone')
      .populate('relatedLead', 'name email phone')
      .populate('relatedTask', 'title status priority')
      .populate('businessProcess', 'name category status');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    res.json({
      success: true,
      result: appointment,
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointment',
    });
  }
};

// Update appointment
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const userId = req.companyOwner?._id || req.user?._id;

    const appointment = await Appointment.findOne({
      _id: id,
      removed: false,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Track rescheduling
    if (body.startTime && body.startTime !== appointment.startTime.toISOString()) {
      appointment.rescheduleHistory.push({
        oldStartTime: appointment.startTime,
        oldEndTime: appointment.endTime,
        newStartTime: new Date(body.startTime),
        newEndTime: new Date(body.endTime || appointment.endTime),
        reason: body.rescheduleReason,
        rescheduledBy: userId,
      });

      // Update reminders if time changed
      await AutomatedReminder.updateMany(
        {
          targetType: 'appointment',
          targetId: id,
          status: 'scheduled',
        },
        {
          $set: { status: 'cancelled' },
        }
      );

      // Create new reminders
      if (appointment.automationSettings?.sendReminders !== false) {
        const reminders = await AutomatedReminder.createForAppointment(
          appointment._id,
          { ...appointment.toObject(), ...body },
          userId
        );

        for (const reminder of reminders) {
          await reminder.save();
        }
      }
    }

    // Update appointment
    Object.assign(appointment, body);
    appointment.updatedBy = userId;
    await appointment.save();

    const updatedAppointment = await Appointment.findById(id)
      .populate('organizer', 'name email')
      .populate('attendees.userId', 'name email')
      .populate('relatedClient', 'name company email')
      .populate('relatedLead', 'name email');

    res.json({
      success: true,
      result: updatedAppointment,
      message: 'Appointment updated successfully',
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating appointment',
    });
  }
};

// Delete appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findOneAndUpdate(
      { _id: id, removed: false },
      { removed: true, updatedBy: req.companyOwner?._id || req.user?._id },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Cancel reminders
    await AutomatedReminder.updateMany(
      {
        targetType: 'appointment',
        targetId: id,
        status: { $in: ['scheduled', 'pending'] },
      },
      {
        $set: { status: 'cancelled' },
      }
    );

    res.json({
      success: true,
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting appointment',
    });
  }
};

// Get upcoming appointments
const getUpcomingAppointments = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const userId = req.companyOwner?._id || req.user?._id;

    const appointments = await Appointment.findUpcoming(userId, parseInt(days));

    res.json({
      success: true,
      result: appointments,
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching upcoming appointments',
    });
  }
};

// Confirm appointment
const confirmAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { attendeeEmail } = req.body;

    const appointment = await Appointment.findOne({
      _id: id,
      removed: false,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    // Update attendee status
    if (attendeeEmail) {
      const attendee = appointment.attendees.find((a) => a.email === attendeeEmail);
      if (attendee) {
        attendee.status = 'confirmed';
      }
    }

    // Update appointment status if all attendees confirmed
    const allConfirmed = appointment.attendees.every((a) => a.status === 'confirmed');
    if (allConfirmed) {
      appointment.status = 'confirmed';
    }

    appointment.updatedBy = req.companyOwner?._id || req.user?._id;
    await appointment.save();

    res.json({
      success: true,
      result: appointment,
      message: 'Appointment confirmed successfully',
    });
  } catch (error) {
    console.error('Error confirming appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error confirming appointment',
    });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.companyOwner?._id || req.user?._id;

    const appointment = await Appointment.findOne({
      _id: id,
      removed: false,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason;
    appointment.updatedBy = userId;
    await appointment.save();

    // Cancel reminders
    await AutomatedReminder.updateMany(
      {
        targetType: 'appointment',
        targetId: id,
        status: { $in: ['scheduled', 'pending'] },
      },
      {
        $set: { status: 'cancelled' },
      }
    );

    res.json({
      success: true,
      result: appointment,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error cancelling appointment',
    });
  }
};

// Get appointment by booking URL
const getAppointmentByBookingUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;

    const appointment = await Appointment.findOne({
      'bookingUrl.shortCode': shortCode,
      removed: false,
      status: { $in: ['scheduled', 'confirmed'] },
    })
      .populate('organizer', 'name email photo')
      .select('-privateNotes');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or booking link expired',
      });
    }

    // Check if booking URL expired
    if (
      appointment.bookingUrl.expiresAt &&
      new Date(appointment.bookingUrl.expiresAt) < new Date()
    ) {
      return res.status(410).json({
        success: false,
        message: 'Booking link has expired',
      });
    }

    res.json({
      success: true,
      result: appointment,
    });
  } catch (error) {
    console.error('Error fetching appointment by booking URL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching appointment',
    });
  }
};

// Book appointment via URL
const bookAppointmentViaUrl = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const { name, email, phone, notes } = req.body;

    const appointment = await Appointment.findOne({
      'bookingUrl.shortCode': shortCode,
      removed: false,
      status: { $in: ['scheduled', 'confirmed'] },
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or booking link expired',
      });
    }

    // Check if booking URL expired
    if (
      appointment.bookingUrl.expiresAt &&
      new Date(appointment.bookingUrl.expiresAt) < new Date()
    ) {
      return res.status(410).json({
        success: false,
        message: 'Booking link has expired',
      });
    }

    // Add attendee
    appointment.attendees.push({
      name,
      email,
      phone,
      status: 'confirmed',
      reminders: {
        email: true,
        sms: !!phone,
      },
    });

    if (notes) {
      appointment.notes = appointment.notes
        ? `${appointment.notes}\n\nAttendee notes: ${notes}`
        : `Attendee notes: ${notes}`;
    }

    appointment.analytics.bookingSource = 'url';
    await appointment.save();

    // Track URL click
    await URL.findOneAndUpdate(
      { shortCode },
      {
        $inc: { 'analytics.totalClicks': 1, 'analytics.conversions': 1 },
        $push: {
          'analytics.clicksByDate': {
            date: new Date().toISOString().split('T')[0],
            count: 1,
          },
        },
      }
    );

    res.json({
      success: true,
      result: appointment,
      message: 'Appointment booked successfully',
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error booking appointment',
    });
  }
};

export = {
  createAppointment,
  getAppointments,
  getAppointment,
  updateAppointment,
  deleteAppointment,
  getUpcomingAppointments,
  confirmAppointment,
  cancelAppointment,
  getAppointmentByBookingUrl,
  bookAppointmentViaUrl,
};
