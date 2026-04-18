// @ts-nocheck
const express = require('express');
const router = express.Router();
const adminAuth = require('@/controllers/coreControllers/adminAuth');
const subscriptionController = require('@/controllers/appControllers/subscriptionController');
const { catchErrors } = require('@/handlers/errorHandlers');

// All routes require authentication
router.use(adminAuth.isValidAuthToken);

// GET /api/subscription — get current subscription
router.get('/', catchErrors(subscriptionController.getSubscription));

// POST /api/subscription/checkout — create Stripe checkout session
router.post('/checkout', catchErrors(subscriptionController.createCheckoutSession));

// POST /api/subscription/portal — create Stripe portal session
router.post('/portal', catchErrors(subscriptionController.createPortalSession));

// PUT /api/subscription/cancel — cancel subscription at period end
router.put('/cancel', catchErrors(subscriptionController.cancelSubscription));

// PUT /api/subscription/reactivate — reactivate canceled subscription
router.put('/reactivate', catchErrors(subscriptionController.reactivateSubscription));

// PUT /api/subscription/plan — change plan
router.put('/plan', catchErrors(subscriptionController.changePlan));

module.exports = router;
