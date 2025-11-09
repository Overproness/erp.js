const express = require('express');
const router = express.Router();
const { catchErrors } = require('../../handlers/errorHandlers');
const behaviorController = require('../../controllers/appControllers/BehaviorController');

/**
 * Behavioral trigger routes
 */

// Event tracking
router.post('/events', catchErrors(behaviorController.trackEvent));
router.get('/events', catchErrors(behaviorController.getAllEvents));
router.get('/events/customer/:customerId', catchErrors(behaviorController.getCustomerEvents));
router.get('/events/summary/:customerId', catchErrors(behaviorController.getCustomerSummary));

// Trigger evaluation
router.post('/evaluate/:customerId', catchErrors(behaviorController.evaluateTriggers));

// Analytics
router.get('/trends', catchErrors(behaviorController.getEventTrends));
router.post('/patterns', catchErrors(behaviorController.identifyPatterns));

module.exports = router;
