import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlanTier, SubscriptionStatus } from '../../config/featureMap';
import type { RootState } from '../store';

interface SubscriptionState {
  plan: PlanTier;
  status: SubscriptionStatus | null;
  isFree: boolean;
  n8nAccessEnabled: boolean;
  n8nRequestStatus: 'none' | 'requested' | 'approved' | 'rejected';
  billingCycle: 'monthly' | 'yearly';
  trialEnd: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isLoading: boolean;
  hasFetched: boolean;
}

const initialState: SubscriptionState = {
  plan: 'enterprise',
  status: 'active',
  isFree: true,
  n8nAccessEnabled: false,
  n8nRequestStatus: 'none',
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
export const selectCurrentPlan = (state: RootState): PlanTier => state.subscription?.plan ?? 'enterprise';
export const selectN8nAccessEnabled = (state: RootState): boolean => state.subscription?.n8nAccessEnabled ?? false;
export const selectN8nRequestStatus = (state: RootState): string => state.subscription?.n8nRequestStatus ?? 'none';
export const selectIsFree = (state: RootState): boolean => state.subscription?.isFree ?? true;
export const selectSubscriptionStatus = (state: RootState) => state.subscription?.status;
export const selectIsTrialing = (state: RootState) => state.subscription?.status === 'trialing';
export const selectTrialEnd = (state: RootState) => state.subscription?.trialEnd;
export const selectSubscriptionLoading = (state: RootState) => state.subscription?.isLoading;
export const selectSubscriptionHasFetched = (state: RootState) => state.subscription?.hasFetched ?? false;
