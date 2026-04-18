import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import type { PlanTier, SubscriptionStatus } from '../../config/featureMap';

interface SubscriptionState {
  plan: PlanTier;
  status: SubscriptionStatus | null;
  billingCycle: 'monthly' | 'yearly';
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
  hasFetched: boolean;
}

const initialState: SubscriptionState = {
  plan: 'starter',
  status: null,
  billingCycle: 'monthly',
  trialEnd: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  isLoading: false,
  hasFetched: false,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    resetSubscription: () => initialState,
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setSubscription(state, action: PayloadAction<Partial<SubscriptionState>>) {
      Object.assign(state, action.payload);
      state.hasFetched = true;
      state.isLoading = false;
    },
    setPlan(state, action: PayloadAction<PlanTier>) {
      state.plan = action.payload;
    },
  },
});

export const subscriptionActions = subscriptionSlice.actions;
export default subscriptionSlice.reducer;

// Selectors
export const selectSubscription = (state: RootState) => state.subscription;
export const selectCurrentPlan = (state: RootState): PlanTier => state.subscription?.plan ?? 'starter';
export const selectSubscriptionStatus = (state: RootState) => state.subscription?.status;
export const selectIsTrialing = (state: RootState) => state.subscription?.status === 'trialing';
export const selectTrialEnd = (state: RootState) => state.subscription?.trialEnd;
export const selectSubscriptionLoading = (state: RootState) => state.subscription?.isLoading;
export const selectSubscriptionHasFetched = (state: RootState) => state.subscription?.hasFetched ?? false;
