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
import { Badge, Button, Card, Col, Row, Space, Statistic, Tabs, Tag, Typography } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReviewAnalyticsModule from './ReputationModule/ReviewAnalyticsModule';
import ReviewMonitoringModule from './ReputationModule/ReviewMonitoringModule';
import ReviewPortalModule from './ReputationModule/ReviewPortalModule';
import ReviewResponseModule from './ReputationModule/ReviewResponseModule';

const { Title, Text } = Typography;

const ReputationManagement = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    average: 4.8,
    total: 184,
    responded: 168,
    responseRate: 91.3,
    connectedPlatforms: 4,
  });

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { request } = await import('@/request');
        const res = await request.get({ entity: 'marketing/reputation/stats' });
        if (isMounted && res?.result) {
          const r = res.result;
          setStats({
            average: r.average || 4.8,
            total: r.total || 0,
            responded: r.responded || 0,
            responseRate: r.responseRate || 0,
            connectedPlatforms: Object.keys(r.byPlatform || {}).length || 4,
          });
        }
      } catch (err) {
        console.warn('Failed to fetch reputation stats:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

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
      <div style={{ marginBottom: '16px' }}>
        <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
          {translate('Reputation Management')}
        </Title>
        <Text style={{ color: '#6b7280', fontSize: '16px' }}>
          {translate('Monitor and manage your online reputation across multiple platforms')}
        </Text>
      </div>

      {/* Demo / Sandbox Simulation Notice */}
      <div style={{ marginBottom: 24 }}>
        <Tag color="purple" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px' }}>
          <strong>{translate('Demo / Simulation Mode')}:</strong>{' '}
          {translate('Reviews and ratings are generated via sandbox simulation. Bring your own credentials (BYOC) on your self-hosted instance to sync live Google Business and Facebook reviews.')}
        </Tag>
      </div>

      {/* Stats Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Average Rating')}
              value={stats.average.toString() + '/5'}
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
              value={stats.total}
              prefix={<CommentOutlined />}
              valueStyle={{ color: '#2F54EB' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Response Rate')}
              value={stats.responseRate}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52C41A' }}
            />
            <div style={{ fontSize: '12px', marginTop: '8px' }}>
              <Badge status="success" text={`${stats.responded} ${translate('responded')}`} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title={translate('Connected Platforms')}
              value={stats.connectedPlatforms}
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
