import {
  CalendarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  RiseOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Card, Col, Empty, Modal, Progress, Row, Spin, Statistic, Tabs, Tag } from 'antd';
import { useEffect, useState } from 'react';
import apolloClient from '@/graphql/client';
import { TEAM_MEMBER_PERFORMANCE } from '@/graphql/operations/team';

const { TabPane } = Tabs;

const MemberPerformanceModal = ({ visible, onClose, teamId, memberId, memberName }) => {
  const [loading, setLoading] = useState(false);
  const [performance, setPerformance] = useState(null);
  const [error, setError] = useState(null);
  const timeframe = '30';

  const fetchPerformance = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await apolloClient.query({
        query: TEAM_MEMBER_PERFORMANCE,
        variables: { id: teamId, memberId },
        fetchPolicy: 'network-only',
      });

      if (data.teamMemberPerformance.success) {
        setPerformance(data.teamMemberPerformance.result);
      } else {
        setError(data.teamMemberPerformance.message || 'Failed to fetch performance data');
      }
    } catch (err) {
      console.error('Error fetching member performance:', err);
      setError(err.response?.data?.message || 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && teamId && memberId) {
      fetchPerformance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, teamId, memberId, timeframe]);

  const renderMetricCard = (title, value, subtitle, icon, color) => {
    return (
      <Card size="small" style={{ marginBottom: '16px', borderRadius: '8px' }}>
        <Statistic
          title={title}
          value={value}
          prefix={icon}
          suffix={subtitle}
          valueStyle={{ color, fontSize: '24px', fontWeight: 'bold' }}
        />
        {subtitle && (
          <div style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>{subtitle}</div>
        )}
      </Card>
    );
  };

  const renderCustomersMetrics = () => {
    const data = performance?.metrics?.customers;
    if (!data) return <Empty description="No customer data available" />;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Customers Added',
            data.customersAdded || 0,
            null,
            <UserOutlined />,
            '#3f8600'
          )}
        </Col>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Leads Generated',
            data.leadsGenerated || 0,
            null,
            <TeamOutlined />,
            '#1890ff'
          )}
        </Col>
        <Col xs={24}>
          <Card size="small" style={{ borderRadius: '8px' }}>
            <Statistic
              title="Total Customer Activities"
              value={data.total || 0}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#8b45ff' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderQuotesMetrics = () => {
    const data = performance?.metrics?.quotes;
    if (!data) return <Empty description="No quotes data available" />;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Quotes Sent',
            data.quotesSent || 0,
            null,
            <FileTextOutlined />,
            '#1890ff'
          )}
        </Col>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Total Quote Value',
            `$${(data.totalValue || 0).toLocaleString()}`,
            null,
            <DollarOutlined />,
            '#52c41a'
          )}
        </Col>
      </Row>
    );
  };

  const renderInvoicesMetrics = () => {
    const data = performance?.metrics?.invoices;
    if (!data) return <Empty description="No invoices data available" />;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Invoices Sent',
            data.invoicesSent || 0,
            null,
            <FileTextOutlined />,
            '#1890ff'
          )}
        </Col>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Total Invoice Value',
            `$${(data.totalValue || 0).toLocaleString()}`,
            null,
            <DollarOutlined />,
            '#52c41a'
          )}
        </Col>
      </Row>
    );
  };

  const renderPaymentsMetrics = () => {
    const data = performance?.metrics?.payments;
    if (!data) return <Empty description="No payments data available" />;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Payments Recorded',
            data.paymentsMade || 0,
            null,
            <CheckCircleOutlined />,
            '#1890ff'
          )}
        </Col>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Revenue Generated',
            `$${(data.revenueGenerated || 0).toLocaleString()}`,
            null,
            <DollarOutlined />,
            '#52c41a'
          )}
        </Col>
      </Row>
    );
  };

  const renderFollowUpsMetrics = () => {
    const data = performance?.metrics?.followUps;
    if (!data) return <Empty description="No follow-ups data available" />;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          {renderMetricCard(
            'Follow-ups Completed',
            data.followUpsCompleted || 0,
            null,
            <CheckCircleOutlined />,
            '#52c41a'
          )}
        </Col>
      </Row>
    );
  };

  const renderTasksMetrics = () => {
    const data = performance?.metrics?.tasks;
    if (!data) return <Empty description="No tasks data available" />;

    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Tasks Completed',
            data.tasksCompleted || 0,
            null,
            <CheckCircleOutlined />,
            '#52c41a'
          )}
        </Col>
        <Col xs={24} sm={12}>
          {renderMetricCard(
            'Tasks Assigned',
            data.tasksAssigned || 0,
            null,
            <FileTextOutlined />,
            '#1890ff'
          )}
        </Col>
        <Col xs={24}>
          <Card size="small" style={{ borderRadius: '8px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Completion Rate</strong>
            </div>
            <Progress
              percent={parseFloat(data.completionRate || 0)}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderOverviewTab = () => {
    if (!performance) return null;

    const moduleAccess = performance.moduleAccess || {};
    const metrics = performance.metrics || {};
    const summary = performance.summary || {};

    return (
      <div>
        <Card size="small" style={{ marginBottom: '16px', borderRadius: '8px' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Total Activities"
                value={summary.totalActivities || 0}
                prefix={<RiseOutlined />}
                valueStyle={{ color: '#8b45ff', fontSize: '28px', fontWeight: 'bold' }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <div>
                <div style={{ marginBottom: '8px', color: '#8c8c8c' }}>Top Performing Module</div>
                <Tag
                  color="purple"
                  style={{ fontSize: '16px', padding: '8px 16px', borderRadius: '6px' }}
                >
                  {summary.topPerformingModule ? summary.topPerformingModule.toUpperCase() : 'N/A'}
                </Tag>
              </div>
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          title="Module Access"
          style={{ marginBottom: '16px', borderRadius: '8px' }}
        >
          <Row gutter={[8, 8]}>
            {Object.entries(moduleAccess).map(([module, hasAccess]) => (
              <Col key={module}>
                <Tag color={hasAccess ? 'green' : 'default'}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </Tag>
              </Col>
            ))}
          </Row>
        </Card>

        <Card size="small" title="Performance Summary" style={{ borderRadius: '8px' }}>
          <Row gutter={[16, 16]}>
            {metrics.customers && (
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Customer Activities"
                  value={metrics.customers.total || 0}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
            )}
            {metrics.quotes && (
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Quotes Sent"
                  value={metrics.quotes.quotesSent || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            )}
            {metrics.invoices && (
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Invoices Sent"
                  value={metrics.invoices.invoicesSent || 0}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            )}
            {metrics.payments && (
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Revenue Generated"
                  value={`$${(metrics.payments.revenueGenerated || 0).toLocaleString()}`}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            )}
            {metrics.followUps && (
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Follow-ups"
                  value={metrics.followUps.followUpsCompleted || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            )}
            {metrics.tasks && (
              <Col xs={24} sm={12} md={8}>
                <Statistic
                  title="Tasks Completed"
                  value={metrics.tasks.tasksCompleted || 0}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            )}
          </Row>
        </Card>
      </div>
    );
  };

  return (
    <Modal
      title={
        <div>
          <UserOutlined style={{ marginRight: '8px' }} />
          Performance Analytics - {memberName || 'Team Member'}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Loading performance data..." />
        </div>
      ) : error ? (
        <Alert message="Error" description={error} type="error" showIcon />
      ) : performance ? (
        <div>
          {/* Time Period Info */}
          <Card
            size="small"
            style={{
              marginBottom: '16px',
              background: '#f5f5f5',
              borderRadius: '8px',
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <CalendarOutlined style={{ marginRight: '8px' }} />
                <strong>Performance Period:</strong> Last {performance.timeframe?.days || 30} days
              </Col>
              <Col>
                <Tag color="blue">
                  {new Date(performance.timeframe?.startDate).toLocaleDateString()} -{' '}
                  {new Date(performance.timeframe?.endDate).toLocaleDateString()}
                </Tag>
              </Col>
            </Row>
          </Card>

          {/* Tabs for different metrics */}
          <Tabs defaultActiveKey="overview">
            <TabPane tab="Overview" key="overview">
              {renderOverviewTab()}
            </TabPane>

            {performance.moduleAccess?.customers && (
              <TabPane tab="Customers" key="customers">
                {renderCustomersMetrics()}
              </TabPane>
            )}

            {performance.moduleAccess?.quotes && (
              <TabPane tab="Quotes" key="quotes">
                {renderQuotesMetrics()}
              </TabPane>
            )}

            {performance.moduleAccess?.invoices && (
              <TabPane tab="Invoices" key="invoices">
                {renderInvoicesMetrics()}
              </TabPane>
            )}

            {performance.moduleAccess?.payments && (
              <TabPane tab="Payments" key="payments">
                {renderPaymentsMetrics()}
              </TabPane>
            )}

            {performance.moduleAccess?.followUps && (
              <TabPane tab="Follow-ups" key="followUps">
                {renderFollowUpsMetrics()}
              </TabPane>
            )}

            {performance.moduleAccess?.tasks && (
              <TabPane tab="Tasks" key="tasks">
                {renderTasksMetrics()}
              </TabPane>
            )}
          </Tabs>
        </div>
      ) : (
        <Empty description="No performance data available" />
      )}
    </Modal>
  );
};

export default MemberPerformanceModal;
