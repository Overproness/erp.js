// @ts-nocheck
const express = require('express');
const router = express.Router();
const statisticsController = require('../../controllers/appControllers/statisticsController');

router.route('/dashboard').get(statisticsController.getDashboardStats);
router.route('/clients').get(statisticsController.getClientStats);
router.route('/invoices').get(statisticsController.getInvoiceStats);
router.route('/quotes').get(statisticsController.getQuoteStats);
router.route('/payments').get(statisticsController.getPaymentStats);
router.route('/teams').get(statisticsController.getTeamStats);
router.route('/tasks').get(statisticsController.getTaskStats);
router.route('/documents').get(statisticsController.getDocumentStats);
router.route('/paymentmodes').get(statisticsController.getPaymentModeStats);
router.route('/taxes').get(statisticsController.getTaxStats);
router.route('/workflows').get(statisticsController.getWorkflowStats);

module.exports = router;
