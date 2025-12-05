const express = require('express');
const router = express.Router();

const {
  createReminder,
  getReminders,
  getReminder,
  updateReminder,
  deleteReminder,
  cancelReminder,
  getDueReminders,
  sendReminderManually,
  getReminderStats,
} = require('@/controllers/appControllers/reminderController');

const { catchErrors } = require('@/handlers/errorHandlers');

router.route('/').post(catchErrors(createReminder)).get(catchErrors(getReminders));

router.route('/due').get(catchErrors(getDueReminders));

router.route('/stats').get(catchErrors(getReminderStats));

router
  .route('/:id')
  .get(catchErrors(getReminder))
  .patch(catchErrors(updateReminder))
  .delete(catchErrors(deleteReminder));

router.route('/:id/cancel').post(catchErrors(cancelReminder));

router.route('/:id/send').post(catchErrors(sendReminderManually));

module.exports = router;
