const express = require('express');
const router = express.Router();

const {
  createBusinessProcess,
  getBusinessProcesses,
  getBusinessProcess,
  updateBusinessProcess,
  deleteBusinessProcess,
  executeBusinessProcess,
  completeProcessStep,
  getProcessAnalytics,
  duplicateAsTemplate,
} = require('@/controllers/appControllers/businessProcessController');

const { catchErrors } = require('@/handlers/errorHandlers');

router.route('/').post(catchErrors(createBusinessProcess));

router.route('/list').get(catchErrors(getBusinessProcesses));

router
  .route('/:id')
  .get(catchErrors(getBusinessProcess))
  .patch(catchErrors(updateBusinessProcess))
  .delete(catchErrors(deleteBusinessProcess));

router.route('/:id/execute').post(catchErrors(executeBusinessProcess));

router
  .route('/:id/execution/:executionIndex/step/:stepId/complete')
  .post(catchErrors(completeProcessStep));

router.route('/:id/analytics').get(catchErrors(getProcessAnalytics));

router.route('/:id/duplicate-template').post(catchErrors(duplicateAsTemplate));

module.exports = router;
