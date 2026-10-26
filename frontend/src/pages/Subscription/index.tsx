import { PLAN_METADATA, type PlanTier } from '@/config/featureMap';
import { ACCESS_TOKEN_NAME, API_BASE_URL, N8N_URL } from '@/config/serverApiConfig';
import { usePlan } from '@/hooks/usePlan';
import { selectCurrentAdmin } from '@/redux/auth/selectors';
import { useSelector } from 'react-redux';
import {
  CheckCircleOutlined,
  CloudServerOutlined,
  CrownOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@/components/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  List,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from '@/components/ui';
import { useCallback, useEffect, useState } from 'react';
import N8nComputeModal from '@/components/N8nComputeModal';

const { Title, Text, Paragraph } = Typography;

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  starter: [
    'Unlimited team members',
    'CRM & Contact Management',
    'Invoicing & Quotes',
    'Document Management',
    'Team Chat',
    'Basic Task Management',
    'Tax Management',
  ],
  professional: [
    'Unlimited team members',
    'Everything in Starter, plus:',
    'AI Assistant & Copilot',
    'Campaign Management & A/B Testing',
    'Social Media Management',
    'URL Management & Analytics',
    'Survey Management',
    'Reputation Management',
    'Marketing Module',
    'Native Workflow Automation',
    'Lead Scoring',
    'Recurring Billing',
    'Customer Live Chat',
    'Advanced Analytics',
  ],
  enterprise: [
    'Unlimited team members',
    'Everything in Professional, plus:',
    'n8n Workflow Automation (On Request / Compute Limited)',
    'Custom Integrations & Webhooks',
    'Global KPI Dashboard',
    'Realtime Analytics',
    'Customer Journey Tracking',
    'Document Compliance Audit',
    'Advanced Permissions',
    'White Label Options',
    'Priority Support',
  ],
};

const PLAN_ICONS: Record<PlanTier, React.ReactNode> = {
  starter: <ThunderboltOutlined />,
  professional: <CrownOutlined />,
  enterprise: <RocketOutlined />,
};

export default function SubscriptionPage() {
  const {
    plan,
    planName,
    status,
    n8nAccessEnabled,
    n8nRequestStatus,
    fetchSubscription,
    isLoading,
  } = usePlan();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const [changingPlan, setChangingPlan] = useState<PlanTier | null>(null);
  const [n8nModalOpen, setN8nModalOpen] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleChangePlan = useCallback(
    async (targetPlan: PlanTier) => {
      Modal.confirm({
        title: `Switch to ${PLAN_METADATA[targetPlan].name}?`,
        content: `Your plan will be set to ${PLAN_METADATA[targetPlan].name} ($0 - Free Forever).`,
        okText: 'Confirm',
        onOk: async () => {
          setChangingPlan(targetPlan);
          try {
            const token = localStorage.getItem(ACCESS_TOKEN_NAME);
            const res = await fetch(`${API_BASE_URL}subscription/plan`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                ...(token ? { [ACCESS_TOKEN_NAME]: token } : {}),
              },
              body: JSON.stringify({ plan: targetPlan }),
            });
            const data = await res.json();
            if (data.success) {
              message.success(data.message);
              fetchSubscription();
            } else {
              message.error(data.message || 'Failed to change plan');
            }
          } catch {
            message.error('Network error');
          } finally {
            setChangingPlan(null);
          }
        },
      });
    },
    [fetchSubscription]
  );

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* 100% Free Notification Banner */}
      <Alert
        message="100% Free Platform"
        description="All accounts automatically receive the Enterprise plan for free. Every CRM, invoicing, AI, marketing, and native workflow feature is completely unlocked."
        type="success"
        showIcon
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      {/* Current plan summary */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                Current Plan
              </Title>
              <Space>
                <Tag color="#722ed1" style={{ fontSize: 13, padding: '2px 10px' }}>
                  {planName}
                </Tag>
                <Tag color="green">100% Free Forever</Tag>
                <Tag color="blue">{status || 'Active'}</Tag>
              </Space>
              <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
                Your organization is enrolled in the highest-tier Enterprise plan with all core & AI features unlocked at no cost.
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Dedicated n8n Compute Allocation Card */}
      <Card
        style={{
          marginBottom: 24,
          border: '1px solid #c1c6d7/30',
          background: 'linear-gradient(to right, rgba(0,88,195,0.03), rgba(0,112,243,0.03))',
        }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={4}>
              <Space align="center">
                <CloudServerOutlined style={{ color: '#0058c3', fontSize: 20 }} />
                <Title level={4} style={{ margin: 0 }}>
                  N8N Workflow Integration (Dedicated Compute)
                </Title>
                {n8nAccessEnabled ? (
                  <Tag color="green">Instance Online</Tag>
                ) : n8nRequestStatus === 'requested' ? (
                  <Tag color="orange">Pending Compute Availability</Tag>
                ) : (
                  <Tag color="default">Compute Limited</Tag>
                )}
              </Space>
              <Paragraph style={{ margin: 0, color: '#414754', fontSize: 13, maxWidth: 650 }}>
                We have limited compute resources, and n8n workflow integration is given out to people automatically based on available compute. Right now we don't have enough compute, which is why your account doesn't have it yet. When compute frees up, we'll give it to you immediately.
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            {n8nAccessEnabled ? (
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={() => {
                  const companyId = currentAdmin?._id;
                  if (companyId) {
                    window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
                  }
                }}
                style={{ background: '#0058c3' }}
              >
                Launch N8N Canvas
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CloudServerOutlined />}
                onClick={() => setN8nModalOpen(true)}
                style={{ background: '#0058c3' }}
              >
                View Compute Status
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Plan cards */}
      <Row gutter={[24, 24]}>
        {(['starter', 'professional', 'enterprise'] as PlanTier[]).map((tier) => {
          const meta = PLAN_METADATA[tier];
          const isCurrent = tier === plan;

          return (
            <Col xs={24} md={8} key={tier}>
              <Badge.Ribbon
                text={tier === 'enterprise' ? 'Included Free' : ''}
                color={tier === 'enterprise' ? 'purple' : 'transparent'}
              >
                <Card
                  hoverable={!isCurrent}
                  style={{
                    borderColor: isCurrent ? meta.color : undefined,
                    borderWidth: isCurrent ? 2 : 1,
                    height: '100%',
                  }}
                >
                  <Space align="center" style={{ marginBottom: 8 }}>
                    {PLAN_ICONS[tier]}
                    <Title level={4} style={{ margin: 0 }}>
                      {meta.name}
                    </Title>
                  </Space>

                  <div style={{ marginBottom: 16 }}>
                    <Text style={{ fontSize: 32, fontWeight: 700 }}>$0</Text>
                    <Text type="secondary"> / free forever</Text>
                    <br />
                    <Text type="secondary">No credit card or subscription needed</Text>
                  </div>

                  <Divider style={{ margin: '12px 0' }} />

                  <List
                    size="small"
                    dataSource={PLAN_FEATURES[tier]}
                    renderItem={(item) => (
                      <List.Item style={{ border: 'none', padding: '4px 0' }}>
                        <Space>
                          <CheckCircleOutlined style={{ color: meta.color }} />
                          <Text>{item}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />

                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    {isCurrent ? (
                      <Button disabled block>
                        Current Plan (Free)
                      </Button>
                    ) : (
                      <Button
                        type="default"
                        block
                        loading={changingPlan === tier}
                        onClick={() => handleChangePlan(tier)}
                      >
                        Switch Plan
                      </Button>
                    )}
                  </div>
                </Card>
              </Badge.Ribbon>
            </Col>
          );
        })}
      </Row>

      <Paragraph type="secondary" style={{ marginTop: 24, textAlign: 'center' }}>
        ERP.js is 100% free with all highest-tier enterprise features unlocked. Dedicated n8n container instances are granted on request based on available server compute.
      </Paragraph>

      <N8nComputeModal
        open={n8nModalOpen}
        onClose={() => setN8nModalOpen(false)}
        companyId={currentAdmin?._id}
      />
    </div>
  );
}
