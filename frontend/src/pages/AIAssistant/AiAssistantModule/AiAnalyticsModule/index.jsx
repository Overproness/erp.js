import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, Typography, Space, Button } from 'antd';
import { ArrowLeftOutlined, RobotOutlined, MessageOutlined, DollarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ErpLayout } from '@/layout';
import AnalyticsDashboard from './AnalyticsDashboard';
import UsageMetrics from './UsageMetrics';
import PredictiveCharts from './PredictiveCharts';
import InsightsPanel from './InsightsPanel';
import { fetchAnalytics } from '@/redux/ai/aiThunks';
import { selectAnalyticsData, selectAnalyticsLoading } from '@/redux/ai/aiSelectors';
import useLanguage from '@/locale/useLanguage';

const { Title } = Typography;

const AiAnalyticsModule = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();
  
  const analyticsData = useSelector(selectAnalyticsData);
  const loading = useSelector(selectAnalyticsLoading);

useEffect(() => {
  console.log("Dispatching fetchAnalytics...");
  dispatch(fetchAnalytics());
}, [dispatch]);

  const mockStats = {
    totalConversations: 1247,
    totalTokens: 89632,
    totalCost: 12.47,
    avgResponseTime: 1.2,
  };

  return (
    <ErpLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/ai-assistant')}
            >
              {translate('Back')}
            </Button>
            <Title level={2} style={{ margin: 0 }}>
              {translate('AI Analytics')}
            </Title>
          </Space>
        </div>

        {/* Overview Stats */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Total Conversations')}
                value={analyticsData?.totalConversations || mockStats.totalConversations}
                prefix={<MessageOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Tokens Used')}
                value={analyticsData?.totalTokens || mockStats.totalTokens}
                prefix={<RobotOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Total Cost')}
                value={analyticsData?.totalCost || mockStats.totalCost}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title={translate('Avg Response Time')}
                value={analyticsData?.avgResponseTime || mockStats.avgResponseTime}
                prefix={<ClockCircleOutlined />}
                suffix="s"
                precision={1}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Dashboard */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={translate('Analytics Dashboard')} style={{ marginBottom: '16px' }}>
              <AnalyticsDashboard data={analyticsData} loading={loading} />
            </Card>
            
            <Card title={translate('Predictive Analysis')}>
              <PredictiveCharts data={analyticsData} loading={loading} />
            </Card>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card title={translate('Usage Metrics')} style={{ marginBottom: '16px' }}>
              <UsageMetrics data={analyticsData} loading={loading} />
            </Card>
            
            <Card title={translate('AI Insights')}>
              <InsightsPanel data={analyticsData} loading={loading} />
            </Card>
          </Col>
        </Row>
      </div>
    </ErpLayout>
  );
};

export default AiAnalyticsModule;