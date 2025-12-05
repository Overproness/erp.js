const express = require('express');
const router = express.Router();

const {
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
} = require('@/controllers/appControllers/appointmentController');

const { catchErrors } = require('@/handlers/errorHandlers');

// Protected routes (require authentication)
router.route('/').post(catchErrors(createAppointment));

router.route('/list').get(catchErrors(getAppointments));

router.route('/upcoming').get(catchErrors(getUpcomingAppointments));

router
  .route('/:id')
  .get(catchErrors(getAppointment))
  .patch(catchErrors(updateAppointment))
  .delete(catchErrors(deleteAppointment));

router.route('/:id/confirm').post(catchErrors(confirmAppointment));

router.route('/:id/cancel').post(catchErrors(cancelAppointment));

// Public routes (no authentication required)
router
  .route('/book/:shortCode')
  .get(catchErrors(getAppointmentByBookingUrl))
  .post(catchErrors(bookAppointmentViaUrl));

module.exports = router;
