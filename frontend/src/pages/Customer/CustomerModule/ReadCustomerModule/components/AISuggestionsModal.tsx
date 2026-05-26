import {
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FireOutlined,
  HeartOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  RocketOutlined,
  SendOutlined,
  StarOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Card,
  Col,
  Divider,
  List,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Spin,
  Tag,
  Timeline,
  Typography,
} from '@/components/ui';
import { useEffect, useState } from 'react';

const { Title, Text, Paragraph } = Typography;

/**
 * AI Suggestions Modal
 * Displays intelligent conversation routing and AI-powered recommendations for customer interactions
 */
export default function AISuggestionsModal({ visible, onClose, customerData }) {
  // console.log('🚀 ~ AISuggestionsModal ~ customerData:', customerData);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);

  // Helper function to safely extract ID string from potentially nested objects
  const getIdString = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object') {
      // Handle Buffer objects (MongoDB ObjectId as Buffer)
      if (id.buffer && id.buffer.data && Array.isArray(id.buffer.data)) {
        return id.buffer.data.map((byte) => byte.toString(16).padStart(2, '0')).join('');
      }
      // Handle MongoDB ObjectId objects or nested structures
      if (id.$oid) return id.$oid;
      if (id._id && typeof id._id === 'string') return id._id;
      if (id.id && typeof id.id === 'string') return id.id;
      if (typeof id.valueOf === 'function') {
        const val = id.valueOf();
        if (typeof val === 'string') return val;
      }
      // Try toString() method for ObjectId
      if (typeof id.toString === 'function' && id.toString() !== '[object Object]') {
        return id.toString();
      }
      return null;
    }
    return String(id);
  };

  const fetchAISuggestions = async () => {
    setLoading(true);
    setError(null);

    try {
      const clientId = getIdString(customerData._id);

      if (!clientId || clientId === '[object Object]') {
        setError('Invalid customer ID');
        setLoading(false);
        return;
      }

      const axios = (await import('axios')).default;
      const response = await axios.post('ai-enhanced/context/enhanced', {
        module: 'customer',
        data: {
          clientId: clientId,
          customerType: customerData.customerType,
          segment: customerData.customerValue?.segment,
          lifetimeValue: customerData.customerValue?.lifetimeValue,
          leadScore: customerData.leadScore,
          qualification: customerData.qualification,
          lastPurchaseDate: customerData.behavior?.lastPurchaseDate,
          visitFrequency: customerData.behavior?.visitFrequency,
        },
      });

      if (response.data.success) {
        setSuggestions(response.data.result);
      } else {
        setError(response.data.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      console.error('Error fetching AI suggestions:', err);
      setError(err.response?.data?.message || 'Error generating AI suggestions');
      message.error('Failed to generate AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && customerData) {
      fetchAISuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, customerData]);

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'red',
      high: 'orange',
      medium: 'blue',
      low: 'default',
    };
    return colors[priority] || 'default';
  };

  const getPriorityIcon = (priority) => {
    const icons = {
      urgent: <FireOutlined />,
      high: <ThunderboltOutlined />,
      medium: <ClockCircleOutlined />,
      low: <CheckCircleOutlined />,
    };
    return icons[priority] || <BulbOutlined />;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      email: <MailOutlined />,
      sms: <SendOutlined />,
      call: <PhoneOutlined />,
      meeting: <UserOutlined />,
      follow_up: <ClockCircleOutlined />,
      engagement: <HeartOutlined />,
      upsell: <RocketOutlined />,
      retention: <TrophyOutlined />,
      feedback: <MessageOutlined />,
      support: <CheckCircleOutlined />,
    };
    return icons[category] || <BulbOutlined />;
  };

  const renderRecommendations = () => {
    if (!suggestions?.recommendations || suggestions.recommendations.length === 0) {
      return (
        <Alert
          message="No Recommendations Available"
          description="The AI system couldn't generate specific recommendations at this time. Additional customer data may help improve suggestions."
          type="info"
          showIcon
        />
      );
    }

    return (
      <List
        dataSource={suggestions.recommendations}
        renderItem={(item) => (
          <List.Item>
            <Card
              size="small"
              style={{ width: '100%' }}
              styles={{ body: { padding: '12px' } }}
              hoverable
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Space>
                    {getCategoryIcon(item.category)}
                    <Text strong>{String(item.title || '')}</Text>
                  </Space>
                  <Tag
                    color={getPriorityColor(item.priority)}
                    icon={getPriorityIcon(item.priority)}
                  >
                    {String(item.priority || '').toUpperCase()}
                  </Tag>
                </Space>
                <Text type="secondary">{String(item.description || '')}</Text>
                {item.action && (
                  <Text
                    style={{
                      fontSize: '12px',
                      color: '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <ThunderboltOutlined style={{ marginRight: '4px' }} />
                    Suggested Action: {String(item.action)}
                  </Text>
                )}
                {item.reason && (
                  <Text style={{ fontSize: '11px', color: '#8c8c8c', fontStyle: 'italic' }}>
                    💡 {String(item.reason)}
                  </Text>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  const renderInsights = () => {
    if (!suggestions?.insights || suggestions.insights.length === 0) {
      return null;
    }

    return (
      <Card
        title={
          <>
            <BulbOutlined /> Business Insights
          </>
        }
        size="small"
        style={{ marginTop: 16 }}
      >
        <List
          dataSource={suggestions.insights}
          renderItem={(insight) => {
            // Extract primitive values from potentially nested objects
            const insightType =
              typeof insight.type === 'object' ? insight.type?.status || 'success' : insight.type;
            console.log('🚀 ~ renderInsights ~ insightType:', insightType);
            const title =
              typeof insight.title === 'object'
                ? JSON.stringify(insight.title)
                : String(insight.title || '');
            console.log('🚀 ~ renderInsights ~ title:', title);
            const description =
              typeof insight.description === 'object'
                ? JSON.stringify(insight.description)
                : String(insight.description || '');
            console.log('🚀 ~ renderInsights ~ description:', description);
            const metric = typeof insight.metric === 'number' ? insight.metric : null;
            console.log('🚀 ~ renderInsights ~ metric:', metric);

            return (
              <List.Item>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Space>
                    <Badge status={insightType === 'warning' ? 'warning' : 'success'} />
                    <Text strong>{title}</Text>
                  </Space>
                  <Text type="secondary">{description}</Text>
                  {metric !== null && (
                    <Progress
                      percent={Math.round(metric * 100)}
                      size="small"
                      status={metric > 0.7 ? 'success' : metric > 0.4 ? 'normal' : 'exception'}
                    />
                  )}
                </Space>
              </List.Item>
            );
          }}
        />
      </Card>
    );
  };

  const renderNextActions = () => {
    if (!suggestions?.nextActions || suggestions.nextActions.length === 0) {
      return null;
    }

    return (
      <Card
        title={
          <>
            <RocketOutlined /> Suggested Next Actions
          </>
        }
        size="small"
        style={{ marginTop: 16 }}
      >
        <Timeline
          items={suggestions.nextActions.map((action) => ({
            dot: action.urgent ? <FireOutlined style={{ color: '#ff4d4f' }} /> : undefined,
            color: action.urgent ? 'red' : 'blue',
            children: (
              <Space direction="vertical" size="small">
                <Space>
                  <Text strong>{String(action.title || '')}</Text>
                  {action.urgent && <Tag color="red">URGENT</Tag>}
                </Space>
                <Text type="secondary">{String(action.description || '')}</Text>
                {action.expectedOutcome && (
                  <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                    <StarOutlined /> Expected: {String(action.expectedOutcome)}
                  </Text>
                )}
              </Space>
            ),
          }))}
        />
      </Card>
    );
  };

  const renderAIInsights = () => {
    if (!suggestions?.aiInsights || suggestions.aiInsights.length === 0) {
      return null;
    }

    return (
      <Card
        title={
          <Space>
            <BulbOutlined style={{ color: '#faad14' }} />
            <Text strong>AI-Assisted Customer Insights and Recommendations</Text>
          </Space>
        }
        size="small"
        style={{ marginTop: 16, borderColor: '#faad14' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {suggestions.aiInsights.map((insight, index) => (
            <Card
              key={index}
              size="small"
              style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space>
                  <Badge status="processing" color="#faad14" />
                  <Text strong style={{ color: '#ad8b00' }}>
                    {String(insight.category || 'General Insight')}
                  </Text>
                </Space>
                <Paragraph style={{ margin: 0 }}>
                  {String(insight.insight || insight.description || '')}
                </Paragraph>
                {insight.confidence && (
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Confidence Level:
                    </Text>
                    <Progress
                      percent={Math.round(insight.confidence * 100)}
                      size="small"
                      strokeColor="#faad14"
                      style={{ marginTop: 4 }}
                    />
                  </div>
                )}
                {insight.actionable && (
                  <Alert
                    message={String(insight.actionable)}
                    type="warning"
                    showIcon
                    icon={<ThunderboltOutlined />}
                    style={{ fontSize: '12px' }}
                  />
                )}
              </Space>
            </Card>
          ))}
        </Space>
      </Card>
    );
  };

  const renderConversationRouting = () => {
    if (!suggestions?.conversationRouting) {
      return null;
    }

    const routing = suggestions.conversationRouting;

    return (
      <Card
        title={
          <Space>
            <MessageOutlined />
            <Text strong>Intelligent Conversation Routing</Text>
          </Space>
        }
        size="small"
        style={{ marginTop: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Recommended Channel */}
          <div>
            <Text type="secondary">Recommended Communication Channel:</Text>
            <div style={{ marginTop: 8 }}>
              <Tag
                color="blue"
                icon={getCategoryIcon(routing.recommendedChannel)}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {String(routing.recommendedChannel || '').toUpperCase()}
              </Tag>
            </div>
            {routing.channelReason && (
              <Text style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 4, display: 'block' }}>
                💡 {String(routing.channelReason)}
              </Text>
            )}
          </div>{' '}
          <Divider style={{ margin: '8px 0' }} />
          {/* Best Time to Contact */}
          {routing.bestTimeToContact && (
            <div>
              <Text type="secondary">Best Time to Contact:</Text>
              <div style={{ marginTop: 8 }}>
                <Tag icon={<ClockCircleOutlined />} color="green">
                  {String(routing.bestTimeToContact)}
                </Tag>
              </div>
            </div>
          )}
          {/* Conversation Tone */}
          {routing.tone && (
            <div>
              <Text type="secondary">Recommended Tone:</Text>
              <div style={{ marginTop: 8 }}>
                <Tag icon={<HeartOutlined />} color="purple">
                  {String(routing.tone)}
                </Tag>
              </div>
            </div>
          )}
          {/* Key Topics */}
          {routing.keyTopics && routing.keyTopics.length > 0 && (
            <div>
              <Text type="secondary">Key Topics to Cover:</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {routing.keyTopics.map((topic, index) => (
                    <Tag key={index} icon={<StarOutlined />}>
                      {topic}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          )}
          {/* Talking Points */}
          {routing.talkingPoints && routing.talkingPoints.length > 0 && (
            <div>
              <Text type="secondary">Suggested Talking Points:</Text>
              <List
                size="small"
                style={{ marginTop: 8 }}
                dataSource={routing.talkingPoints}
                renderItem={(point) => (
                  <List.Item style={{ padding: '4px 0' }}>
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text>{String(point)}</Text>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          )}
          {/* Analysis Summary (if available) */}
          {routing.analysis && (
            <div
              style={{
                marginTop: 8,
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
              }}
            >
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Based on: {routing.analysis.segment || 'Standard'} segment
                {routing.analysis.lifetimeValue > 0 &&
                  ` • $${routing.analysis.lifetimeValue.toFixed(2)} LTV`}
                {routing.analysis.leadScore > 0 && ` • ${routing.analysis.leadScore}/100 score`}
              </Text>
            </div>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <BulbOutlined style={{ color: '#1890ff' }} />
          <span>AI-Powered Customer Suggestions</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="Generating AI suggestions..." />
          <Paragraph style={{ marginTop: 16, color: '#8c8c8c' }}>
            Analyzing customer data and generating personalized recommendations...
          </Paragraph>
        </div>
      ) : error ? (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />
      ) : suggestions ? (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Customer Overview */}
          {customerData && (
            <Card size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Customer</Text>
                    <Text strong>{customerData.name || 'Unknown'}</Text>
                  </Space>
                </Col>
                {customerData.customerValue?.segment && (
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Segment</Text>
                      <Tag color="blue">{customerData.customerValue.segment}</Tag>
                    </Space>
                  </Col>
                )}
                {customerData.leadScore !== null && customerData.leadScore !== undefined && (
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Lead Score</Text>
                      <Text
                        strong
                        style={{
                          color:
                            (typeof customerData.leadScore === 'object'
                              ? customerData.leadScore?.totalScore
                              : customerData.leadScore) > 70
                              ? '#52c41a'
                              : '#faad14',
                        }}
                      >
                        {typeof customerData.leadScore === 'object'
                          ? customerData.leadScore?.totalScore || 0
                          : customerData.leadScore}
                        /100
                      </Text>
                    </Space>
                  </Col>
                )}
                {customerData.qualification && (
                  <Col span={6}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">Status</Text>
                      <Tag color="green">
                        {typeof customerData.qualification === 'object'
                          ? customerData.qualification?.status || 'Unknown'
                          : customerData.qualification}
                      </Tag>
                    </Space>
                  </Col>
                )}
              </Row>
            </Card>
          )}

          {/* Recommendations */}
          <div>
            <Title level={5}>
              <ThunderboltOutlined /> AI Recommendations
            </Title>
            {renderRecommendations()}
          </div>

          {/* AI-Assisted Insights */}
          {renderAIInsights()}

          {/* Conversation Routing */}
          {renderConversationRouting()}

          {/* Next Actions */}
          {renderNextActions()}

          {/* Business Insights */}
          {renderInsights()}
        </Space>
      ) : null}
    </Modal>
  );
}
