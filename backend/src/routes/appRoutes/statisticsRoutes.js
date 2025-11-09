const express = require('express');
const { catchErrors } = require('../../handlers/errorHandlers');

const router = express.Router();

const statisticsController = require('../../controllers/appControllers/statisticsController');

// Dashboard overview statistics
router.route('/dashboard').get(catchErrors(statisticsController.getDashboardStats));

// Entity-specific statistics
router.route('/clients').get(catchErrors(statisticsController.getClientStats));
router.route('/invoices').get(catchErrors(statisticsController.getInvoiceStats));
router.route('/quotes').get(catchErrors(statisticsController.getQuoteStats));
router.route('/payments').get(catchErrors(statisticsController.getPaymentStats));
router.route('/teams').get(catchErrors(statisticsController.getTeamStats));
router.route('/tasks').get(catchErrors(statisticsController.getTaskStats));
router.route('/documents').get(catchErrors(statisticsController.getDocumentStats));
router.route('/paymentmodes').get(catchErrors(statisticsController.getPaymentModeStats));
router.route('/workflows').get(catchErrors(statisticsController.getWorkflowStats));
router.route('/taxes').get(catchErrors(statisticsController.getTaxStats));

module.exports = router;
