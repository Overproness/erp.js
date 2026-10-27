import { CloudServerOutlined, LockOutlined } from '@/components/icons';
import { Button, Result } from '@/components/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import N8nComputeModal from '../N8nComputeModal';

interface UpgradePromptProps {
  featureKey: string;
  title?: string;
  description?: string;
}

export default function UpgradePrompt({ featureKey, title, description }: UpgradePromptProps) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  if (featureKey === 'N8N_WORKFLOWS') {
    return (
      <>
        <Result
          icon={<CloudServerOutlined style={{ color: '#0058c3' }} />}
          title={title ?? 'N8N Workflows: Compute Allocation Required'}
          subTitle={
            description ??
            "We have limited compute resources, and the n8n workflow integration is given out to people automatically based on available compute. Right now we don't have enough compute, which is why your account doesn't have it yet. When compute frees up, we'll give it to you immediately!"
          }
          extra={
            <Button type="primary" onClick={() => setModalOpen(true)} style={{ background: '#0058c3' }}>
              View Compute Status
            </Button>
          }
        />
        <N8nComputeModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  return (
    <Result
      icon={<LockOutlined style={{ color: '#0058c3' }} />}
      title={title ?? 'Enterprise Feature'}
      subTitle={
        description ??
        'All enterprise features in ERP.js are 100% free. Visit your subscription dashboard to view your free enterprise plan.'
      }
      extra={
        <Button type="primary" onClick={() => navigate('/subscription')}>
          Go to Subscription Settings
        </Button>
      }
    />
  );
}
