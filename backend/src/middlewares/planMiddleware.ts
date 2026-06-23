// @ts-nocheck
import { NextFunction, Response } from 'express';
import { getMinimumPlan, getPlanLimit, hasFeatureAccess } from '../config/featureMap';

/**
 * requireFeature('FEATURE_KEY')
 * Returns a middleware that blocks requests from plans without access.
 */
export function requireFeature(featureKey: string) {
  return (req: any, res: Response, next: NextFunction) => {
    const plan: string = req.plan ?? 'starter';
    if (hasFeatureAccess(plan, featureKey)) return next();

    const requiredPlan = getMinimumPlan(featureKey);
    return res.status(403).json({
      success: false,
      result: null,
      message: `This feature requires the ${requiredPlan} plan or higher.`,
      upgradeRequired: true,
      requiredPlan,
      currentPlan: plan,
    });
  };
}

/**
 * requireLimit('limitKey', getCountFn)
 * Returns a middleware that blocks if the owner is at their plan's usage cap.
 * getCountFn(req) must return a Promise<number> with the current usage count.
 */
export function requireLimit(
  limitKey: string,
  getCountFn: (req: any) => Promise<number>
) {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      const plan: string = req.plan ?? 'starter';
      const limit = getPlanLimit(plan, limitKey);
      if (limit === Infinity) return next();

      const current = await getCountFn(req);
      if (current < limit) return next();

      return res.status(403).json({
        success: false,
        result: null,
        message: `You have reached the ${limitKey} limit (${limit}) for your ${plan} plan.`,
        limitReached: true,
        limit,
        current,
        currentPlan: plan,
      });
    } catch (error) {
      return next(error);
    }
  };
}
