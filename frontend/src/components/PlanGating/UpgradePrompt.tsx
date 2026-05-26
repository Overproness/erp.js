import { LockOutlined } from '@ant-design/icons';
import { Button, Result } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { getMinimumPlan, PLAN_METADATA, type PlanTier } from '../../config/featureMap';

interface UpgradePromptProps {
  featureKey: string;
  title?: string;
  description?: string;
}

export default function UpgradePrompt({ featureKey, title, description }: UpgradePromptProps) {
  const navigate = useNavigate();
  const requiredPlan: PlanTier | null = getMinimumPlan(featureKey);
  const planMeta = requiredPlan ? PLAN_METADATA[requiredPlan] : null;

  return (
    <Result
      icon={<LockOutlined style={{ color: planMeta?.color ?? '#1890ff' }} />}
      title={title ?? 'Upgrade Required'}
      subTitle={
        description ??
        `This feature requires the ${planMeta?.name ?? 'a higher'} plan ($${
          planMeta?.price ?? ''
        }/mo). Upgrade to unlock it.`
      }
      extra={
        <Button type="primary" onClick={() => navigate('/subscription')}>
          View Plans & Upgrade
        </Button>
      }
    />
  );
}
