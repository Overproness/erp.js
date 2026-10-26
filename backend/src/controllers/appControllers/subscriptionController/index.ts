// @ts-nocheck
const mongoose = require('mongoose');

/**
 * Subscription Controller
 * Handles subscription CRUD and Stripe integration
 */

const getSubscription = async (req, res) => {
  try {
    const ownerId = req.companyOwner?._id || req.admin?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, result: null, message: 'Authentication required' });
    }

    const Subscription = mongoose.model('Subscription');
    const subscription = await Subscription.findOne({ companyOwner: ownerId }).lean();

    if (!subscription) {
      // Return default starter plan for legacy accounts
      return res.status(200).json({
        success: true,
        result: {
          plan: 'enterprise',
          status: 'active',
          isFree: true,
          billingCycle: 'monthly',
          trialEnd: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          n8nAccessEnabled: false,
          n8nRequestStatus: 'none',
        },
        message: 'Free Enterprise plan active by default',
      });
    }

    return res.status(200).json({
      success: true,
      result: {
        plan: subscription.plan || 'enterprise',
        status: subscription.status || 'active',
        isFree: true,
        billingCycle: subscription.billingCycle || 'monthly',
        n8nAccessEnabled: subscription.n8nAccessEnabled === true,
        n8nRequestStatus: subscription.n8nRequestStatus || 'none',
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
      },
      message: 'Subscription retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

const changePlan = async (req, res) => {
  try {
    const ownerId = req.companyOwner?._id || req.admin?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, result: null, message: 'Authentication required' });
    }

    const { plan } = req.body;
    const validPlans = ['starter', 'professional', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ success: false, result: null, message: 'Invalid plan' });
    }

    const Subscription = mongoose.model('Subscription');
    let subscription = await Subscription.findOne({ companyOwner: ownerId });

    if (!subscription) {
      // Create subscription for legacy account
      subscription = await Subscription.create({
        companyOwner: ownerId,
        plan,
        status: 'active',
        billingCycle: 'monthly',
      });
    } else {
      subscription.plan = plan;
      await subscription.save();
    }

    return res.status(200).json({
      success: true,
      result: {
        plan: subscription.plan || 'enterprise',
        status: subscription.status || 'active',
        isFree: true,
        billingCycle: subscription.billingCycle || 'monthly',
        n8nAccessEnabled: subscription.n8nAccessEnabled === true,
        n8nRequestStatus: subscription.n8nRequestStatus || 'none',
      },
      message: `Plan changed to ${plan} successfully`,
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    const ownerId = req.companyOwner?._id || req.admin?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, result: null, message: 'Authentication required' });
    }

    const Subscription = mongoose.model('Subscription');
    const subscription = await Subscription.findOne({ companyOwner: ownerId });

    if (!subscription) {
      return res.status(404).json({ success: false, result: null, message: 'Subscription not found' });
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    return res.status(200).json({
      success: true,
      result: { cancelAtPeriodEnd: true },
      message: 'Subscription will be canceled at period end',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

const reactivateSubscription = async (req, res) => {
  try {
    const ownerId = req.companyOwner?._id || req.admin?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, result: null, message: 'Authentication required' });
    }

    const Subscription = mongoose.model('Subscription');
    const subscription = await Subscription.findOne({ companyOwner: ownerId });

    if (!subscription) {
      return res.status(404).json({ success: false, result: null, message: 'Subscription not found' });
    }

    subscription.cancelAtPeriodEnd = false;
    if (subscription.status === 'canceled') {
      subscription.status = 'active';
      subscription.canceledAt = null;
    }
    await subscription.save();

    return res.status(200).json({
      success: true,
      result: {
        plan: subscription.plan,
        status: subscription.status,
        cancelAtPeriodEnd: false,
      },
      message: 'Subscription reactivated',
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

const createCheckoutSession = async (req, res) => {
  try {
    // Stripe integration placeholder — will be activated when Stripe keys are configured
    return res.status(200).json({
      success: true,
      result: { url: null },
      message: 'Stripe checkout not configured. Use plan change API directly for now.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

const createPortalSession = async (req, res) => {
  try {
    // Stripe integration placeholder — will be activated when Stripe keys are configured
    return res.status(200).json({
      success: true,
      result: { url: null },
      message: 'Stripe portal not configured.',
    });
  } catch (error) {
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};


const requestN8nAccess = async (req, res) => {
  try {
    const ownerId = req.companyOwner?._id || req.admin?._id;
    if (!ownerId) {
      return res.status(401).json({ success: false, result: null, message: 'Authentication required' });
    }

    const Subscription = mongoose.model('Subscription');
    let subscription = await Subscription.findOne({ companyOwner: ownerId });

    if (!subscription) {
      subscription = await Subscription.create({
        companyOwner: ownerId,
        plan: 'enterprise',
        status: 'active',
        billingCycle: 'monthly',
        isFree: true,
        n8nAccessEnabled: false,
        n8nRequestStatus: 'requested',
        n8nRequestedAt: new Date(),
      });
    } else {
      subscription.n8nRequestStatus = 'requested';
      subscription.n8nRequestedAt = new Date();
      await subscription.save();
    }

    return res.status(200).json({
      success: true,
      result: {
        plan: subscription.plan,
        n8nAccessEnabled: subscription.n8nAccessEnabled === true,
        n8nRequestStatus: subscription.n8nRequestStatus,
      },
      message: 'N8N compute allocation request received. Access is provisioned based on cluster capacity.',
    });
  } catch (error) {
    console.error('Error requesting n8n access:', error);
    return res.status(500).json({ success: false, result: null, message: error.message });
  }
};

module.exports = {
  getSubscription,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  createCheckoutSession,
  createPortalSession,
  requestN8nAccess,
};
