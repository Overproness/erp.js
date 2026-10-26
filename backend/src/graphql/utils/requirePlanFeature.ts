// @ts-nocheck
const { hasFeatureAccess, getPlanLimit, getMinimumPlan } = require('../../config/featureMap');

class PlanUpgradeRequiredError extends Error {
  constructor(featureKey, requiredPlan, currentPlan) {
    super(`This feature requires the ${requiredPlan} plan or higher.`);
    this.extensions = {
      code: 'PLAN_UPGRADE_REQUIRED',
      upgradeRequired: true,
      requiredPlan,
      currentPlan,
      featureKey,
    };
  }
}

class PlanLimitReachedError extends Error {
  constructor(limitKey, limit, current, currentPlan) {
    super(`You have reached the ${limitKey} limit (${limit}) for your ${currentPlan} plan.`);
    this.extensions = {
      code: 'PLAN_LIMIT_REACHED',
      limitReached: true,
      limit,
      current,
      currentPlan,
      limitKey,
    };
  }
}

function requirePlanFeature(context, featureKey) {
  const plan = context.plan ?? 'enterprise';
  if (!hasFeatureAccess(plan, featureKey, { n8nAccessEnabled: context.n8nAccessEnabled })) {
    if (featureKey === 'N8N_WORKFLOWS') {
      const err = new Error(
        'N8N Workflow Integration requires dedicated compute allocation which is currently limited. Please submit an access request.'
      );
      err.extensions = {
        code: 'N8N_COMPUTE_REQUIRED',
        computeRequired: true,
        featureKey,
      };
      throw err;
    }
    const requiredPlan = getMinimumPlan(featureKey);
    throw new PlanUpgradeRequiredError(featureKey, requiredPlan, plan);
  }
}

function requirePlanLimit(context, limitKey, currentCount) {
  const plan = context.plan ?? 'enterprise';
  const limit = getPlanLimit(plan, limitKey);
  if (limit !== Infinity && currentCount >= limit) {
    throw new PlanLimitReachedError(limitKey, limit, currentCount, plan);
  }
}

module.exports = { requirePlanFeature, requirePlanLimit };
