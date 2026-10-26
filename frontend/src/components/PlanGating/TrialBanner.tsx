import { Alert, Button, Space } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../../hooks/usePlan';

export default function TrialBanner() {
  const { isTrialing, daysLeftInTrial, planName, isFree } = usePlan();
  const navigate = useNavigate();

  if (isFree || !isTrialing || daysLeftInTrial > 7) return null;

  const urgent = daysLeftInTrial <= 3;

  return (
    <Alert
      type={urgent ? 'error' : 'warning'}
      banner
      showIcon
      message={
        <Space>
          <span>
            Your <strong>{planName}</strong> trial ends in{' '}
            <strong>
              {daysLeftInTrial} day{daysLeftInTrial !== 1 ? 's' : ''}
            </strong>
            .
          </span>
          <Button size="small" type="primary" onClick={() => navigate('/subscription')}>
            Subscribe Now
          </Button>
        </Space>
      }
    />
  );
}
