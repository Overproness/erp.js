import React, { useEffect } from 'react';
import { Modal, Button, Typography, Tag, Space, Alert } from '@/components/ui';
import { CloudServerOutlined, RocketOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@/components/icons';
import { usePlan } from '@/hooks/usePlan';
import { N8N_URL } from '@/config/serverApiConfig';

const { Paragraph } = Typography;

interface N8nComputeModalProps {
  open: boolean;
  onClose: () => void;
  companyId?: string;
}

export default function N8nComputeModal({ open, onClose, companyId }: N8nComputeModalProps) {
  const { n8nAccessEnabled, n8nRequestStatus, requestN8nAccess } = usePlan();

  // Automatically queue the user if they clicked and aren't queued yet
  useEffect(() => {
    if (open && !n8nAccessEnabled && n8nRequestStatus === 'none') {
      requestN8nAccess();
    }
  }, [open, n8nAccessEnabled, n8nRequestStatus, requestN8nAccess]);

  const handleLaunchN8n = () => {
    if (companyId) {
      window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      centered
      title={
        <Space align="center" size="small">
          <CloudServerOutlined style={{ color: '#0058c3', fontSize: '20px' }} />
          <span>N8N Workflow Integration</span>
          <Tag color="orange">Limited Compute</Tag>
        </Space>
      }
    >
      <div style={{ marginTop: 16 }}>
        {n8nAccessEnabled ? (
          <>
            <Paragraph style={{ color: '#414754', fontSize: '14px', lineHeight: 1.6 }}>
              Your dedicated n8n workspace is online and ready for pipeline automation!
            </Paragraph>
            <div style={{ margin: '20px 0' }}>
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                message="Compute Instance Active"
                description="Your organization has dedicated container resources allocated."
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button onClick={onClose}>Close</Button>
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleLaunchN8n}
                style={{ background: '#0058c3' }}
              >
                Open N8N Workspace
              </Button>
            </div>
          </>
        ) : (
          <>
            <Paragraph style={{ color: '#191c1d', fontSize: '15px', fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>
              We have limited compute resources, and the n8n workflow integration is given out to people automatically based on available compute.
            </Paragraph>

            <Paragraph style={{ color: '#414754', fontSize: '14px', lineHeight: 1.6 }}>
              Right now we don't have enough compute available, which is why your account doesn't have it yet.
            </Paragraph>

            <div style={{ margin: '20px 0' }}>
              <Alert
                type="info"
                showIcon
                icon={<ClockCircleOutlined style={{ color: '#0058c3' }} />}
                message="Automatic Queue Active"
                description="You are on the priority list. When compute frees up, we'll give it to you immediately!"
              />
            </div>

            <Paragraph style={{ color: '#71767f', fontSize: '13px', lineHeight: 1.5, marginBottom: 0 }}>
              Note: All other enterprise features (CRM, invoicing, AI Copilot, marketing campaigns, and our native visual workflow builder) are 100% free and fully unlocked for your account.
            </Paragraph>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
              <Button type="primary" onClick={onClose} style={{ background: '#0058c3' }}>
                Understood
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
