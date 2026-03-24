import {
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RobotOutlined,
  RocketOutlined,
  StarFilled,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  List,
  Progress,
  Rate,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const { Title, Text, Paragraph } = Typography;

/**
 * AI Learning Dashboard
 * Display AI learning statistics and insights
 */
export default function AILearningDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState([]);
  const [recentInteractions, setRecentInteractions] = useState([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadLearningStats();
    loadInsights();
    loadRecentInteractions();
  }, []);

  const loadLearningStats = async () => {
    setLoading(true);
    try {
      const { request } = await import('../../request');
      const response = await request.get({
        entity: 'ai-enhanced/learning',
        endpoint: 'statistics',
      });

      if (response.success) {
        setStats(response.result);
      }
    } catch {
      // AI learning endpoints may not be available yet
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const { request } = await import('../../request');
      const response = await request.get({
        entity: 'ai-enhanced/insights',
        endpoint: 'learned',
        options: { module: 'general' },
      });

      if (response.success) {
        setInsights(response.result || []);
      }
    } catch {
      // AI insights endpoint may not be available yet
    }
  };

  const loadRecentInteractions = async () => {
    try {
      const { request } = await import('../../request');
      const response = await request.get({
        entity: 'ai-enhanced/learning',
        endpoint: 'interactions',
        options: {
          limit: 20,
          sort: '-created',
        },
      });

      if (response.success) {
        setRecentInteractions(response.result || []);
      }
    } catch {
      // AI interactions endpoint may not be available yet
    }
  };

  const interactionColumns = [
    {
      title: 'Type',
      dataIndex: 'interactionType',
      key: 'type',
      render: (type) => <Tag color="blue">{type?.toUpperCase()}</Tag>,
    },
    {
      title: 'Module',
      dataIndex: ['input', 'module'],
      key: 'module',
    },
    {
      title: 'Confidence',
      dataIndex: ['output', 'confidence'],
      key: 'confidence',
      render: (confidence) => (
        <Progress percent={Math.round((confidence || 0) * 100)} size="small" status="active" />
      ),
    },
    {
      title: 'Rating',
      dataIndex: ['feedback', 'rating'],
      key: 'rating',
      render: (rating) => (rating ? <Rate disabled value={rating} /> : '-'),
    },
    {
      title: 'Helpful',
      dataIndex: ['feedback', 'wasHelpful'],
      key: 'helpful',
      render: (helpful) =>
        helpful === true ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : helpful === false ? (
          <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
        ) : (
          '-'
        ),
    },
    {
      title: 'Time',
      dataIndex: 'created',
      key: 'created',
      render: (date) => new Date(date).toLocaleString(),
    },
  ];

  const prepareLearningTrendData = () => {
    if (
      !stats?.learningTrend ||
      !Array.isArray(stats.learningTrend) ||
      stats.learningTrend.length === 0
    ) {
      return [{ date: 'No Data', interactions: 0, avgRating: 0, successRate: 0 }];
    }
    return stats.learningTrend.map((item) => {
      const interactions = Number(item.count);
      const avgRating = Number(item.avgRating);
      const successRate = Number(item.successRate);

      return {
        date: item.date || 'Unknown',
        interactions: isNaN(interactions) || !isFinite(interactions) ? 0 : interactions,
        avgRating: isNaN(avgRating) || !isFinite(avgRating) ? 0 : avgRating,
        successRate: isNaN(successRate) || !isFinite(successRate) ? 0 : successRate,
      };
    });
  };

  const prepareAccuracyData = () => {
    if (
      !stats?.accuracyByModule ||
      typeof stats.accuracyByModule !== 'object' ||
      Object.keys(stats.accuracyByModule).length === 0
    ) {
      return [{ module: 'No Data', accuracy: 0 }];
    }
    const entries = Object.entries(stats.accuracyByModule);
    if (entries.length === 0) {
      return [{ module: 'No Data', accuracy: 0 }];
    }
    return entries.map(([module, accuracy]) => {
      const numericAccuracy = Number(accuracy);
      const accuracyValue =
        isNaN(numericAccuracy) || !isFinite(numericAccuracy) ? 0 : numericAccuracy;
      const roundedAccuracy = Math.round(accuracyValue * 100);

      return {
        module: module || 'Unknown',
        accuracy: isNaN(roundedAccuracy) || !isFinite(roundedAccuracy) ? 0 : roundedAccuracy,
      };
    });
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>
            <BulbOutlined /> AI Learning Dashboard
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadLearningStats();
              loadInsights();
              loadRecentInteractions();
            }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Key Metrics */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Interactions"
                value={isNaN(Number(stats.totalInteractions)) ? 0 : stats.totalInteractions || 0}
                prefix={<RobotOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Rating"
                value={isNaN(Number(stats.averageRating)) ? 0 : stats.averageRating || 0}
                precision={1}
                suffix="/ 5"
                prefix={<StarFilled style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={isNaN(Number(stats.successRate)) ? 0 : stats.successRate || 0}
                suffix="%"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Patterns Learned"
                value={isNaN(Number(stats.patternsLearned)) ? 0 : stats.patternsLearned || 0}
                prefix={<BulbOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={16}>
          <Card title="Learning Trend (Last 30 Days)" loading={loading}>
            {!loading &&
              (() => {
                const chartData = prepareLearningTrendData();

                // Check if we have real data or just the "No Data" placeholder
                const hasRealData =
                  chartData.length > 0 &&
                  !(chartData.length === 1 && chartData[0].date === 'No Data');

                // Ensure all numeric data is valid before rendering
                const hasValidData =
                  hasRealData &&
                  chartData.every(
                    (item) =>
                      typeof item.interactions === 'number' &&
                      !isNaN(item.interactions) &&
                      isFinite(item.interactions) &&
                      typeof item.avgRating === 'number' &&
                      !isNaN(item.avgRating) &&
                      isFinite(item.avgRating) &&
                      typeof item.successRate === 'number' &&
                      !isNaN(item.successRate) &&
                      isFinite(item.successRate)
                  );

                if (!hasValidData) {
                  return (
                    <div
                      style={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text type="secondary">No learning trend data available yet</Text>
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" allowDataOverflow={false} />
                      <YAxis yAxisId="right" orientation="right" allowDataOverflow={false} />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="interactions"
                        stroke="#1890ff"
                        fill="#1890ff"
                        fillOpacity={0.6}
                        name="Interactions"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgRating"
                        stroke="#faad14"
                        strokeWidth={2}
                        name="Avg Rating"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Accuracy by Module" loading={loading}>
            {!loading &&
              (() => {
                const chartData = prepareAccuracyData();

                // Check if we have real data or just the "No Data" placeholder
                const hasRealData =
                  chartData.length > 0 &&
                  !(chartData.length === 1 && chartData[0].module === 'No Data');

                // Ensure all data is valid before rendering
                const hasValidData =
                  hasRealData &&
                  chartData.every(
                    (item) =>
                      typeof item.accuracy === 'number' &&
                      !isNaN(item.accuracy) &&
                      isFinite(item.accuracy)
                  );

                if (!hasValidData) {
                  return (
                    <div
                      style={{
                        height: 300,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text type="secondary">No accuracy data available yet</Text>
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} allowDataOverflow={false} />
                      <YAxis type="category" dataKey="module" width={100} />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#52c41a" />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
          </Card>
        </Col>
      </Row>

      {/* Tabs for Different Views */}
      <Card>
        <Tabs
          defaultActiveKey="insights"
          items={[
            {
              key: 'insights',
              label: (
                <span>
                  <LineChartOutlined />
                  Learned Insights
                </span>
              ),
              children: (
                <List
                  loading={loading}
                  dataSource={insights}
                  renderItem={(insight) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<TrophyOutlined style={{ fontSize: '24px', color: '#1890ff' }} />}
                        title={insight.pattern}
                        description={
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Paragraph>{insight.description}</Paragraph>
                            <Space>
                              <Tag color="blue">Frequency: {insight.frequency}</Tag>
                              <Tag color="green">
                                Confidence: {Math.round(insight.confidence * 100)}%
                              </Tag>
                              {insight.timeSaved && (
                                <Tag color="orange">Time Saved: {insight.timeSaved} hrs</Tag>
                              )}
                            </Space>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'interactions',
              label: (
                <span>
                  <DashboardOutlined />
                  Recent Interactions
                </span>
              ),
              children: (
                <Table
                  loading={loading}
                  dataSource={recentInteractions}
                  columns={interactionColumns}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                />
              ),
            },
            {
              key: 'improvements',
              label: (
                <span>
                  <RocketOutlined />
                  Improvement Timeline
                </span>
              ),
              children: stats?.improvements ? (
                <Timeline
                  items={stats.improvements.map((improvement) => ({
                    color: improvement.type === 'accuracy' ? 'green' : 'blue',
                    children: (
                      <Space direction="vertical">
                        <Text strong>{improvement.title}</Text>
                        <Text type="secondary">{improvement.description}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(improvement.date).toLocaleString()}
                        </Text>
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Text type="secondary">No improvements recorded yet</Text>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
