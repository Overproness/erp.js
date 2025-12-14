const express = require('express');
const router = express.Router();
const clientController = require('@/controllers/appControllers/clientController');
const { catchErrors } = require('@/handlers/errorHandlers');

/**
 * @route   POST /api/client/:id/generate-url/portal
 * @desc    Generate customer portal URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/portal',
  catchErrors(clientController.generatePortalUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/payment
 * @desc    Generate payment request URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/payment',
  catchErrors(clientController.generatePaymentUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/document
 * @desc    Generate document share URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/document',
  catchErrors(clientController.generateDocumentUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/appointment
 * @desc    Generate appointment scheduling URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/appointment',
  catchErrors(clientController.generateAppointmentUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/survey
 * @desc    Generate survey URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/survey',
  catchErrors(clientController.generateSurveyUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/review
 * @desc    Generate review request URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/review',
  catchErrors(clientController.generateReviewUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/quote
 * @desc    Generate quote acceptance URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/quote',
  catchErrors(clientController.generateQuoteUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/invoice
 * @desc    Generate invoice payment URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/invoice',
  catchErrors(clientController.generateInvoiceUrl)
);

/**
 * @route   POST /api/client/:id/generate-url/event
 * @desc    Generate event registration URL
 * @access  Private
 */
router.post(
  '/:id/generate-url/event',
  catchErrors(clientController.generateEventUrl)
);

/**
 * @route   GET /api/client/:id/urls
 * @desc    Get all URLs for a customer
 * @access  Private
 */
router.get(
  '/:id/urls',
  catchErrors(clientController.getCustomerUrls)
);

/**
 * @route   POST /api/client/generate-url/bulk
 * @desc    Generate bulk URLs for multiple customers
 * @access  Private
 */
router.post(
  '/generate-url/bulk',
  catchErrors(clientController.generateBulkUrls)
);

module.exports = router;
