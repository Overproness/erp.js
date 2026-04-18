import { type ReactNode } from 'react';
import { usePlan } from '../../hooks/usePlan';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
  featureKey: string;
  children: ReactNode;
  /** If true, renders nothing instead of the upgrade prompt */
  silent?: boolean;
  /** Custom fallback component */
  fallback?: ReactNode;
}

export default function FeatureGate({ featureKey, children, silent = false, fallback }: FeatureGateProps) {
  const { canAccess } = usePlan();

  if (canAccess(featureKey)) {
    return <>{children}</>;
  }

  if (silent) return null;

  if (fallback) return <>{fallback}</>;

  return <UpgradePrompt featureKey={featureKey} />;
}
