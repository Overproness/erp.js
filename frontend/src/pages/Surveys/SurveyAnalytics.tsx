import apolloClient from '@/graphql/client';
import { SURVEY_ANALYTICS, AI_ANALYZE_SURVEY } from '@/graphql/operations/survey';
import {
  ArrowLeftOutlined,
  BulbOutlined,
  FrownOutlined,
  MehOutlined,
  SmileOutlined,
} from '@/components/icons';
import {
  Button,
  Card,
  Col,
  List,
  Modal,
  Progress,
  Row,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from '@/components/ui';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

export default function SurveyAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [npsData, setNpsData] = useState(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apolloClient.query({
        query: SURVEY_ANALYTICS,
        variables: { id },
      });
      if (data.surveyAnalytics?.success) {
        setAnalytics(data.surveyAnalytics.result);
        setNpsData(data.surveyAnalytics.result?.nps);
      }
    } catch (error) {
      console.error('Failed to load analytics', error);
      message.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const loadAISuggestions = async () => {
    try {
      setAiLoading(true);
      const { data } = await apolloClient.mutate({
        mutation: AI_ANALYZE_SURVEY,
        variables: { id },
      });
      setAiSuggestions(data.surveyAiAnalyze?.result);
      setAiModalVisible(true);
    } catch (error) {
      console.error('Failed to load AI suggestions', error);
      message.error(error.response?.data?.message || 'Failed to load AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'blue',
    };
    return colors[priority] || 'default';
  };

  const getSuggestionTypeIcon = (type) => {
    const icons = {
      improvement: '🔧',
      success: '✅',
      engagement: '📢',
      insight: '💡',
    };
    return icons[type] || '📊';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!analytics) {
    return <div>No data available</div>;
  }

  const sentimentData = [
    {
      type: 'Positive',
      value: analytics.sentimentDistribution?.positive || 0,
      icon: <SmileOutlined style={{ color: '#52c41a' }} />,
    },
    {
      type: 'Neutral',
      value: analytics.sentimentDistribution?.neutral || 0,
      icon: <MehOutlined style={{ color: '#faad14' }} />,
    },
    {
      type: 'Negative',
      value: analytics.sentimentDistribution?.negative || 0,
      icon: <FrownOutlined style={{ color: '#f5222d' }} />,
    },
  ];

  const npsDistribution = [
    { category: 'Promoters', value: npsData?.promoters || 0, color: '#52c41a' },
    { category: 'Passives', value: npsData?.passives || 0, color: '#faad14' },
    { category: 'Detractors', value: npsData?.detractors || 0, color: '#f5222d' },
  ];

  const responseTimeline = Object.entries(analytics.responsesByDate || {}).map(([date, count]) => ({
    date,
    count,
  }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <a
          onClick={() => navigate('/survey')}
          style={{ marginBottom: 16, display: 'inline-block' }}
        >
          <ArrowLeftOutlined /> Back to Surveys
        </a>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>Survey Analytics</Title>
          <Button
            type="primary"
            icon={<BulbOutlined />}
            onClick={loadAISuggestions}
            loading={aiLoading}
            size="large"
          >
            AI Suggestions
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Total Responses" value={analytics.summary?.totalResponses || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={analytics.summary?.completionRate || 0}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="NPS Score"
              value={npsData?.currentNPS || 0}
              valueStyle={{ color: npsData?.currentNPS >= 0 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Avg Time (seconds)"
              value={analytics.summary?.averageCompletionTime || 0}
            />
          </Card>
        </Col>
      </Row>

      {/* NPS Breakdown */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="NPS Distribution">
            {npsDistribution.map((item) => (
              <div key={item.category} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{item.category}</span>
                  <span>
                    <strong>{item.value}</strong>
                  </span>
                </div>
                <Progress
                  percent={
                    (item.value / (npsDistribution.reduce((sum, d) => sum + d.value, 0) || 1)) * 100
                  }
                  strokeColor={item.color}
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Sentiment Distribution">
            {sentimentData.map((item) => (
              <div key={item.type} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>
                    {item.icon} {item.type}
                  </span>
                  <span>{item.value}</span>
                </div>
                <Progress
                  percent={
                    (item.value / (sentimentData.reduce((sum, d) => sum + d.value, 0) || 1)) * 100
                  }
                  strokeColor={
                    item.type === 'Positive'
                      ? '#52c41a'
                      : item.type === 'Neutral'
                        ? '#faad14'
                        : '#f5222d'
                  }
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* Response Timeline */}
      <Card title="Response Timeline" style={{ marginBottom: 24 }}>
        <Table
          dataSource={responseTimeline}
          columns={[
            {
              title: 'Date',
              dataIndex: 'date',
              key: 'date',
            },
            {
              title: 'Responses',
              dataIndex: 'count',
              key: 'count',
            },
          ]}
          pagination={false}
          size="small"
        />
      </Card>

      {/* Question Analytics */}
      <Card title="Question Analytics" style={{ marginBottom: 24 }}>
        <Table
          dataSource={analytics.questionAnalytics || []}
          columns={[
            {
              title: 'Question',
              dataIndex: 'question',
              key: 'question',
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type) => <Tag>{type}</Tag>,
            },
            {
              title: 'Answers',
              dataIndex: 'totalAnswers',
              key: 'totalAnswers',
            },
            {
              title: 'Skipped',
              dataIndex: 'skipped',
              key: 'skipped',
            },
            {
              title: 'Average',
              dataIndex: 'average',
              key: 'average',
              render: (avg) => (avg ? avg.toFixed(2) : 'N/A'),
            },
          ]}
          pagination={false}
          rowKey="questionId"
        />
      </Card>

      {/* Top Themes */}
      {analytics.topThemes && analytics.topThemes.length > 0 && (
        <Card title="Top Themes" style={{ marginBottom: 24 }}>
          <Table
            dataSource={analytics.topThemes.slice(0, 10)}
            columns={[
              {
                title: 'Theme',
                dataIndex: 'theme',
                key: 'theme',
              },
              {
                title: 'Count',
                dataIndex: 'count',
                key: 'count',
                sorter: (a, b) => b.count - a.count,
              },
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Actionable Items */}
      {analytics.topActionableItems && analytics.topActionableItems.length > 0 && (
        <Card title="Top Actionable Items">
          <Table
            dataSource={analytics.topActionableItems}
            columns={[
              {
                title: 'Priority',
                dataIndex: 'priority',
                key: 'priority',
                render: (priority) => {
                  const colors = {
                    critical: 'red',
                    high: 'orange',
                    medium: 'blue',
                    low: 'green',
                  };
                  return <Tag color={colors[priority]}>{priority?.toUpperCase()}</Tag>;
                },
              },
              {
                title: 'Category',
                dataIndex: 'category',
                key: 'category',
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
              },
              {
                title: 'Suggested Action',
                dataIndex: 'suggestedAction',
                key: 'suggestedAction',
              },
            ]}
            pagination={false}
          />
        </Card>
      )}

      {/* AI Suggestions Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BulbOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <span>AI-Powered Feedback Analysis</span>
          </div>
        }
        open={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setAiModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {aiSuggestions ? (
          <div>
            {/* Summary */}
            <Card
              size="small"
              style={{ marginBottom: 16, backgroundColor: '#f0f5ff', border: 'none' }}
            >
              <Paragraph style={{ margin: 0, fontSize: 16 }}>
                <strong>Summary:</strong> {aiSuggestions.summary}
              </Paragraph>
            </Card>

            {/* Sentiment Overview */}
            {aiSuggestions.sentiment && (
              <Card size="small" title="Sentiment Analysis" style={{ marginBottom: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Overall Sentiment"
                      value={aiSuggestions.sentiment.overall}
                      valueStyle={{
                        color:
                          aiSuggestions.sentiment.overall === 'positive'
                            ? '#52c41a'
                            : aiSuggestions.sentiment.overall === 'negative'
                              ? '#f5222d'
                              : '#faad14',
                      }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Sentiment Score"
                      value={aiSuggestions.sentiment.score?.toFixed(2) || 0}
                      precision={2}
                    />
                  </Col>
                </Row>
                {aiSuggestions.sentiment.distribution && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Distribution:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag color="success">
                        Positive: {aiSuggestions.sentiment.distribution.positive}
                      </Tag>
                      <Tag color="warning">
                        Neutral: {aiSuggestions.sentiment.distribution.neutral}
                      </Tag>
                      <Tag color="error">
                        Negative: {aiSuggestions.sentiment.distribution.negative}
                      </Tag>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Key Insights */}
            {aiSuggestions.insights && aiSuggestions.insights.length > 0 && (
              <Card size="small" title="Key Insights" style={{ marginBottom: 16 }}>
                <List
                  dataSource={aiSuggestions.insights}
                  renderItem={(insight) => (
                    <List.Item>
                      <Text>• {insight}</Text>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Top Keywords */}
            {aiSuggestions.topKeywords && aiSuggestions.topKeywords.length > 0 && (
              <Card size="small" title="Top Keywords" style={{ marginBottom: 16 }}>
                <div>
                  {aiSuggestions.topKeywords.map((item, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ marginBottom: 8, fontSize: 14, padding: '4px 12px' }}
                    >
                      {item.keyword} ({item.count})
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            {/* AI Suggestions */}
            {aiSuggestions.suggestions && aiSuggestions.suggestions.length > 0 && (
              <Card size="small" title="Actionable Suggestions">
                <List
                  dataSource={aiSuggestions.suggestions}
                  renderItem={(suggestion) => (
                    <List.Item>
                      <Card
                        size="small"
                        style={{
                          width: '100%',
                          borderLeft: `4px solid ${getPriorityColor(suggestion.priority)}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
                          <span style={{ fontSize: 24 }}>
                            {getSuggestionTypeIcon(suggestion.type)}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ marginBottom: 8 }}>
                              <Text strong style={{ fontSize: 16 }}>
                                {suggestion.title}
                              </Text>
                              <Tag
                                color={getPriorityColor(suggestion.priority)}
                                style={{ marginLeft: 8 }}
                              >
                                {suggestion.priority?.toUpperCase()}
                              </Tag>
                            </div>
                            <Paragraph style={{ marginBottom: 8 }}>
                              {suggestion.description}
                            </Paragraph>
                            <div
                              style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 4 }}
                            >
                              <Text strong>Recommended Action: </Text>
                              <Text>{suggestion.action}</Text>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* No suggestions message */}
            {(!aiSuggestions.suggestions || aiSuggestions.suggestions.length === 0) && (
              <Card size="small">
                <Text type="secondary">
                  No specific suggestions at this time. Keep monitoring your survey responses!
                </Text>
              </Card>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Analyzing survey responses...</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
