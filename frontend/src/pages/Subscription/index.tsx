import { PLAN_METADATA, type PlanTier } from '@/config/featureMap';
import { ACCESS_TOKEN_NAME, API_BASE_URL } from '@/config/serverApiConfig';
import { usePlan } from '@/hooks/usePlan';
import {
  CheckCircleOutlined,
  CrownOutlined,
  RocketOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
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
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

const { Title, Text, Paragraph } = Typography;

const PLAN_FEATURES: Record<PlanTier, string[]> = {
  starter: [
    'Up to 10 team members',
    'CRM & Contact Management',
    'Invoicing & Quotes',
    'Document Management',
    'Team Chat',
    'Basic Task Management',
    'Tax Management',
  ],
  professional: [
    'Up to 50 team members',
    'Everything in Starter, plus:',
    'AI Assistant & Copilot',
    'Campaign Management & A/B Testing',
    'Social Media Management',
    'URL Management & Analytics',
    'Survey Management',
    'Reputation Management',
    'Marketing Module',
    'Workflow Rules (up to 50)',
    'Lead Scoring',
    'Recurring Billing',
    'Customer Live Chat',
    'Advanced Analytics',
  ],
  enterprise: [
    'Unlimited team members',
    'Everything in Professional, plus:',
    'n8n Workflow Automation',
    'Custom Integrations',
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
    isTrialing,
    daysLeftInTrial,
    cancelAtPeriodEnd,
    fetchSubscription,
    isLoading,
  } = usePlan();
  const [changingPlan, setChangingPlan] = useState<PlanTier | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleChangePlan = useCallback(
    async (targetPlan: PlanTier) => {
      Modal.confirm({
        title: `Switch to ${PLAN_METADATA[targetPlan].name}?`,
        content: `Your plan will be changed to ${PLAN_METADATA[targetPlan].name} ($${PLAN_METADATA[targetPlan].price}/mo).`,
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

  const handleCancel = useCallback(async () => {
    Modal.confirm({
      title: 'Cancel Subscription?',
      content: 'Your subscription will remain active until the end of the current billing period.',
      okText: 'Confirm Cancellation',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const token = localStorage.getItem(ACCESS_TOKEN_NAME);
          const res = await fetch(`${API_BASE_URL}subscription/cancel`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { [ACCESS_TOKEN_NAME]: token } : {}),
            },
          });
          const data = await res.json();
          if (data.success) {
            message.success('Subscription will be canceled at period end.');
            fetchSubscription();
          } else {
            message.error(data.message);
          }
        } catch {
          message.error('Network error');
        }
      },
    });
  }, [fetchSubscription]);

  const handleReactivate = useCallback(async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_NAME);
      const res = await fetch(`${API_BASE_URL}subscription/reactivate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { [ACCESS_TOKEN_NAME]: token } : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        message.success('Subscription reactivated!');
        fetchSubscription();
      } else {
        message.error(data.message);
      }
    } catch {
      message.error('Network error');
    }
  }, [fetchSubscription]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Current plan summary */}
      <Card style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                Current Plan
              </Title>
              <Space>
                <Tag color={PLAN_METADATA[plan]?.color}>{planName}</Tag>
                {status && <Tag>{status}</Tag>}
                {isTrialing && <Tag color="orange">Trial — {daysLeftInTrial} days left</Tag>}
                {cancelAtPeriodEnd && <Tag color="red">Cancels at period end</Tag>}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              {cancelAtPeriodEnd ? (
                <Button type="primary" onClick={handleReactivate}>
                  Reactivate
                </Button>
              ) : (
                status !== 'canceled' && (
                  <Button danger onClick={handleCancel}>
                    Cancel Plan
                  </Button>
                )
              )}
            </Space>
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
                text={tier === 'professional' ? 'Most Popular' : ''}
                color={tier === 'professional' ? 'blue' : 'transparent'}
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
                    <Text style={{ fontSize: 32, fontWeight: 700 }}>${meta.price}</Text>
                    <Text type="secondary">/month</Text>
                    <br />
                    <Text type="secondary">${meta.priceAnnual}/mo billed annually</Text>
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
                        Current Plan
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        block
                        loading={changingPlan === tier}
                        onClick={() => handleChangePlan(tier)}
                        style={{ backgroundColor: meta.color, borderColor: meta.color }}
                      >
                        {tier === 'starter' ? 'Downgrade' : 'Upgrade'}
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
        All plans include a 14-day free trial. No credit card required to start.
      </Paragraph>
    </div>
  );
}
