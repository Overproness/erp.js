import useLanguage from '@/locale/useLanguage';
import {
  ApiOutlined,
  BarChartOutlined,
  CommentOutlined,
  DashboardOutlined,
  MessageOutlined,
  RiseOutlined,
  StarOutlined,
} from '@/components/icons';
import { Badge, Button, Card, Col, Row, Space, Statistic, Tabs, Typography } from '@/components/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewAnalyticsModule from './ReputationModule/ReviewAnalyticsModule';
import ReviewMonitoringModule from './ReputationModule/ReviewMonitoringModule';
import ReviewPortalModule from './ReputationModule/ReviewPortalModule';
import ReviewResponseModule from './ReputationModule/ReviewResponseModule';
// Updated to use default import instead of named import

const { Title, Text } = Typography;

const ReputationManagement = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Placeholder stats
  const reviewStats = {
    average: 3.4,
    total: 5,
    responded: 3,
    responseRate: 75.0,
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const getModuleContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ReviewAnalyticsModule />;
      case 'reviews':
        return <ReviewMonitoringModule />;
      case 'response':
        return <ReviewResponseModule />;
      case 'integration':
        return <ReviewPortalModule />;
      default:
        return <ReviewAnalyticsModule />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
          {translate('Reputation Management')}
        </Title>
        <Text style={{ color: '#6b7280', fontSize: '16px' }}>
          {translate('Monitor and manage your online reputation across multiple platforms')}
        </Text>
      </div>

      {/* Stats Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Average Rating')}
              value={reviewStats.average.toString() + '/5'}
              precision={1}
              prefix={<StarOutlined style={{ color: '#fadb14' }} />}
              valueStyle={{ color: '#722ED1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Total Reviews')}
              value={reviewStats.total}
              prefix={<CommentOutlined />}
              valueStyle={{ color: '#2F54EB' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Response Rate')}
              value={reviewStats.responseRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52C41A' }}
            />
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              <Badge status="success" text={`${reviewStats.responded} ${translate('responded')}`} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Connected Platforms')}
              value={2}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#FA541C' }}
            />
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              <Badge status="processing" text={translate('Synced recently')} />
            </div>
          </Card>
        </Col>
      </Row>
      <Card>
        {/* Main Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          size="large"
          type="card"
          tabBarStyle={{ marginBottom: '16px', fontWeight: 'bold' }}
          items={[
            {
              key: 'dashboard',
              label: (
                <span className="text-sm">
                  <DashboardOutlined />
                  &nbsp;
                  {translate('Dashboard')}
                </span>
              ),
            },
            {
              key: 'reviews',
              label: (
                <span className="text-sm">
                  <StarOutlined />
                  &nbsp;
                  {translate('Reviews')}
                </span>
              ),
            },
            {
              key: 'response',
              label: (
                <span className="text-sm">
                  <MessageOutlined />
                  &nbsp;
                  {translate('Response')}
                </span>
              ),
            },
            {
              key: 'integration',
              label: (
                <span className="text-sm">
                  <ApiOutlined />
                  &nbsp;
                  {translate('Integration')}
                </span>
              ),
            },
          ]}
        />

        {/* Module Content */}
        <div className="tab-content">{getModuleContent()}</div>
      </Card>

      {/* Quick Actions */}
      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <BarChartOutlined />
                {translate('Quick Actions')}
              </Space>
            }
            size="small"
          >
            <Space size="middle">
              <Button
                type="primary"
                icon={<StarOutlined />}
                onClick={() => navigate('/reputation/reviews')}
              >
                {translate('View All Reviews')}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReputationManagement;
