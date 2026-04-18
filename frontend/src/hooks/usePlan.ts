import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  subscriptionActions,
  selectCurrentPlan,
  selectSubscription,
  selectSubscriptionHasFetched,
  selectIsTrialing,
  selectTrialEnd,
} from '../redux/subscription/subscriptionSlice';
import { selectAuth } from '../redux/auth/selectors';
import {
  hasFeatureAccess,
  getPlanLimit,
  getMinimumPlan,
  PLAN_METADATA,
  type PlanTier,
} from '../config/featureMap';
import axios from 'axios';

export function usePlan() {
  const dispatch = useAppDispatch();
  const plan = useAppSelector(selectCurrentPlan);
  const subscription = useAppSelector(selectSubscription);
  const hasFetched = useAppSelector(selectSubscriptionHasFetched);
  const isTrialing = useAppSelector(selectIsTrialing);
  const trialEnd = useAppSelector(selectTrialEnd);
  const auth = useAppSelector(selectAuth);

  const fetchSubscription = useCallback(async () => {
    if (subscription.isLoading) return;
    dispatch(subscriptionActions.setLoading(true));
    try {
      const res = await axios.get('subscription');
      const data = res.data;
      if (data.success && data.result) {
        dispatch(
          subscriptionActions.setSubscription({
            plan: data.result.plan ?? 'starter',
            status: data.result.status ?? null,
            billingCycle: data.result.billingCycle ?? 'monthly',
            trialEnd: data.result.trialEnd ?? null,
            currentPeriodEnd: data.result.currentPeriodEnd ?? null,
            cancelAtPeriodEnd: data.result.cancelAtPeriodEnd ?? false,
          })
        );
      } else {
        dispatch(subscriptionActions.setLoading(false));
      }
    } catch {
      dispatch(subscriptionActions.setLoading(false));
    }
  }, [dispatch, subscription.isLoading]);

  // Auto-fetch on login
  useEffect(() => {
    if (auth.isLoggedIn && !hasFetched) {
      fetchSubscription();
    }
  }, [auth.isLoggedIn, hasFetched, fetchSubscription]);

  const canAccess = useCallback(
    (featureKey: string): boolean => hasFeatureAccess(plan, featureKey),
    [plan]
  );

  const limit = useCallback(
    (limitKey: string): number => getPlanLimit(plan, limitKey),
    [plan]
  );

  const daysLeftInTrial = isTrialing && trialEnd ? Math.max(0, Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86400000)) : 0;

  return {
    plan,
    planName: PLAN_METADATA[plan]?.name ?? plan,
    status: subscription.status,
    isTrialing,
    trialEnd,
    daysLeftInTrial,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canAccess,
    limit,
    getMinimumPlan,
    fetchSubscription,
    hasFetched,
    isLoading: subscription.isLoading,
  };
}
