import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Row, Col, Card, Statistic, Tabs, Select, DatePicker, Space, Progress, Typography, Spin, List, Avatar } from 'antd';
import { 
  BarChartOutlined, 
  MessageOutlined, 
  DollarOutlined, 
  ClockCircleOutlined,
  RobotOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { fetchAnalytics } from '@/redux/ai/aiThunks';
import { selectAnalyticsData, selectAnalyticsLoading } from '@/redux/ai/aiSelectors';
import UsageMetrics from './UsageMetrics';
import PredictiveCharts from './PredictiveCharts';
import InsightsPanel from './InsightsPanel';
import useLanguage from '@/locale/useLanguage';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title } = Typography;

const AnalyticsDashboard = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [timeframe, setTimeframe] = useState('30_days');
  const [selectedAssistant, setSelectedAssistant] = useState(null);
  
  const analyticsData = useSelector(selectAnalyticsData);
  const loading = useSelector(selectAnalyticsLoading);
  const prevParamsRef = useRef('');

  useEffect(() => {
    const key = `${timeframe}_${selectedAssistant}`;
    if (prevParamsRef.current === key) return;
    prevParamsRef.current = key;
    dispatch(fetchAnalytics({ timeframe, assistantId: selectedAssistant }));
  }, [dispatch, timeframe, selectedAssistant]);

  const summaryStats = analyticsData?.summary || {};

  const mockUsageData = [
    { date: '2024-01-01', conversations: 45, tokens: 2340 },
    { date: '2024-01-02', conversations: 52, tokens: 2890 },
    { date: '2024-01-03', conversations: 38, tokens: 2100 },
    { date: '2024-01-04', conversations: 61, tokens: 3200 },
    { date: '2024-01-05', conversations: 47, tokens: 2650 },
    { date: '2024-01-06', conversations: 55, tokens: 2980 },
    { date: '2024-01-07', conversations: 49, tokens: 2710 },
  ];

  const topAssistants = [
    { name: 'General Assistant', usage: 89, avatar: '🤖' },
    { name: 'Document Specialist', usage: 67, avatar: '📄' },
    { name: 'Analytics Expert', usage: 45, avatar: '📊' },
    { name: 'Customer Assistant', usage: 34, avatar: '👥' },
  ];

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Select
            value={timeframe}
            onChange={setTimeframe}
            style={{ width: 150 }}
          >
            <Select.Option value="7_days">{translate('Last 7 days')}</Select.Option>
            <Select.Option value="30_days">{translate('Last 30 days')}</Select.Option>
            <Select.Option value="90_days">{translate('Last 90 days')}</Select.Option>
            <Select.Option value="1_year">{translate('Last year')}</Select.Option>
          </Select>
          <RangePicker />
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Conversations')}
              value={summaryStats.totalConversations || 0}
              prefix={<MessageOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Tokens Used')}
              value={summaryStats.totalTokens || 0}
              prefix={<BarChartOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Cost')}
              value={summaryStats.totalCost || 0}
              prefix={<DollarOutlined />}
              precision={4}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Avg Response Time')}
              value={summaryStats.avgResponseTime || 0}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* AI Usage Overview */}
      <Card title={<><RobotOutlined /> {translate('AI Usage Overview')}</>} loading={loading}>
        <Row gutter={[24, 24]}>
          {/* Conversations */}
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={translate('Total Conversations')}
                value={summaryStats.totalConversations}
                prefix={<MessageOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          {/* Messages */}
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={translate('Total Messages')}
                value={summaryStats.totalMessages}
                prefix={<MessageOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          {/* Response Time */}
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={translate('Avg Response Time')}
                value={summaryStats.avgResponseTime}
                suffix="ms"
                prefix={<ClockCircleOutlined style={{ color: '#fa8c16' }} />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>

          {/* Cost */}
          <Col xs={24} sm={12} lg={6}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Statistic
                title={translate('Total Cost')}
                value={summaryStats.totalCost}
                prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
                precision={4}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Usage Progress */}
        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col xs={24} md={8}>
            <Card size="small" title={translate('API Usage')}>
              <Progress
                type="circle"
                percent={((summaryStats.totalTokens || 0) / 100000) * 100}
                format={(percent) => `${Math.round(percent)}%`}
                strokeColor="#667eea"
              />
              <p style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
                {translate('of monthly limit')}
              </p>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title={translate('Cost Usage')}>
              <Progress
                type="circle"
                percent={((summaryStats.totalCost || 0) / 100) * 100}
                format={(percent) => `${Math.round(percent)}%`}
                strokeColor="#f093fb"
              />
              <p style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
                {translate('of budget limit')}
              </p>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card size="small" title={translate('Performance')}>
              <Progress
                type="circle"
                percent={summaryStats.avgResponseTime < 2000 ? 90 : summaryStats.avgResponseTime < 5000 ? 70 : 40}
                format={(percent) => `${Math.round(percent)}%`}
                strokeColor="#43e97b"
              />
              <p style={{ textAlign: 'center', marginTop: '8px', color: '#666' }}>
                {translate('efficiency score')}
              </p>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Detailed Analytics */}
      <Tabs defaultActiveKey="usage">
        <TabPane tab={translate('Usage Metrics')} key="usage">
          <UsageMetrics data={analyticsData} loading={loading} />
        </TabPane>
        <TabPane tab={translate('Predictive Analysis')} key="predictions">
          <PredictiveCharts data={analyticsData} loading={loading} />
        </TabPane>
        <TabPane tab={translate('Insights')} key="insights">
          <InsightsPanel data={analyticsData} loading={loading} />
        </TabPane>
      </Tabs>

      {/* Additional Analytics Dashboard */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={translate('Daily Average')}
              value={52}
              suffix={translate('conversations')}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small">
            <Statistic
              title={translate('Efficiency Score')}
              value={87}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title={translate('Usage Trends')} size="small">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={mockUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#1890ff" 
                  size={2}
                  name={translate('Conversations')}
                />
                <Line 
                  type="monotone" 
                  dataKey="tokens" 
                  stroke="#52c41a" 
                  size={2}
                  name={translate('Tokens')}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={8}>
          <Card title={translate('Top Assistants')} size="small">
            <List
              size="small"
              dataSource={topAssistants}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar>{item.avatar}</Avatar>}
                    title={item.name}
                    description={
                      <Progress 
                        percent={item.usage} 
                        size="small" 
                        showInfo={false}
                      />
                    }
                  />
                  <div>{item.usage}%</div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsDashboard;
