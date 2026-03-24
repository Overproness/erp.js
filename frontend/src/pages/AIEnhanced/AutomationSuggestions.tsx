import {
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  ReloadOutlined,
  RocketOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Empty,
  List,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Steps,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';

const { Title, Paragraph } = Typography;
const { Step } = Steps;

/**
 * Automation Suggestions Dashboard
 * Display AI-powered automation suggestions
 */
export default function AutomationSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [implementing, setImplementing] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadSuggestions();
    loadAnalytics();
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const { request } = await import('../../request');
      const response = await request.get({
        entity: 'ai-enhanced/automation',
        endpoint: 'suggestions',
      });

      if (response.success) {
        setSuggestions(response.result?.suggestions || []);
      }
    } catch (error) {
      console.error('Load suggestions error:', error);
      message.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { request } = await import('../../request');
      const response = await request.get({
        entity: 'ai-enhanced/automation',
        endpoint: 'analytics',
      });

      if (response.success) {
        setAnalytics(response.result);
      }
    } catch (error) {
      console.error('Load analytics error:', error);
    }
  };

  const handleImplementSuggestion = async (suggestionId) => {
    setImplementing(true);
    try {
      const { request } = await import('../../request');
      const response = await request.post({
        entity: `ai-enhanced/automation/suggestions/${suggestionId}/implement`,
      });

      if (response.success) {
        message.success('Automation implemented successfully!');
        setSelectedSuggestion(null);
        loadSuggestions();
        loadAnalytics();
      } else {
        message.error(response.message || 'Failed to implement automation');
      }
    } catch (error) {
      console.error('Implement suggestion error:', error);
      message.error('Failed to implement automation');
    } finally {
      setImplementing(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      email_automation: 'blue',
      task_automation: 'green',
      workflow_optimization: 'purple',
      payment_reminder: 'orange',
      follow_up_automation: 'cyan',
      document_generation: 'magenta',
      notification_automation: 'gold',
    };
    return colors[category] || 'default';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      email_automation: <BulbOutlined />,
      task_automation: <CheckCircleOutlined />,
      workflow_optimization: <RocketOutlined />,
      payment_reminder: <ClockCircleOutlined />,
      follow_up_automation: <ThunderboltOutlined />,
      document_generation: <StarOutlined />,
      notification_automation: <StarOutlined />,
    };
    return icons[category] || <BulbOutlined />;
  };

  const renderSuggestionCard = (suggestion) => {
    const impact = suggestion.estimatedImpact || {};

    return (
      <Card
        key={suggestion.id}
        hoverable
        onClick={() => setSelectedSuggestion(suggestion)}
        style={{ marginBottom: '16px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <Tag
              icon={getCategoryIcon(suggestion.category)}
              color={getCategoryColor(suggestion.category)}
            >
              {suggestion.category?.replace(/_/g, ' ').toUpperCase()}
            </Tag>
            <Tag color={suggestion.priority === 'high' ? 'red' : 'orange'}>
              {suggestion.priority?.toUpperCase()} PRIORITY
            </Tag>
          </Space>

          <Title level={4} style={{ margin: 0 }}>
            {suggestion.title}
          </Title>

          <Paragraph ellipsis={{ rows: 2 }}>{suggestion.description}</Paragraph>

          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Time Saved"
                value={impact.timeSaved || 0}
                suffix="hrs/week"
                valueStyle={{ fontSize: '16px', color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Confidence"
                value={suggestion.confidence || 0}
                suffix="%"
                valueStyle={{ fontSize: '16px', color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Complexity"
                value={impact.complexity || 'Low'}
                valueStyle={{ fontSize: '16px' }}
              />
            </Col>
          </Row>
        </Space>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>
            <RocketOutlined /> Automation Suggestions
          </Title>
          <Button icon={<ReloadOutlined />} onClick={loadSuggestions}>
            Refresh
          </Button>
        </Space>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Suggestions"
                value={analytics.totalSuggestions || 0}
                prefix={<BulbOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Implemented"
                value={analytics.implemented || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Time Saved"
                value={analytics.totalTimeSaved || 0}
                suffix="hrs"
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={analytics.successRate || 0}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
                prefix={<LineChartOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Suggestions List */}
      <Card title="AI-Powered Automation Recommendations">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading suggestions...</div>
        ) : suggestions.length === 0 ? (
          <Empty description="No suggestions available yet. The AI is learning your business patterns." />
        ) : (
          <List
            dataSource={suggestions}
            renderItem={(suggestion) => renderSuggestionCard(suggestion)}
          />
        )}
      </Card>

      {/* Suggestion Detail Modal */}
      <Modal
        title={selectedSuggestion?.title}
        open={!!selectedSuggestion}
        onCancel={() => setSelectedSuggestion(null)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setSelectedSuggestion(null)}>
            Close
          </Button>,
          <Button
            key="implement"
            type="primary"
            icon={<RocketOutlined />}
            loading={implementing}
            onClick={() => handleImplementSuggestion(selectedSuggestion?.id)}
          >
            Implement Automation
          </Button>,
        ]}
      >
        {selectedSuggestion && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Description */}
            <div>
              <Title level={5}>Description</Title>
              <Paragraph>{selectedSuggestion.description}</Paragraph>
            </div>

            <Divider />

            {/* Benefits */}
            {selectedSuggestion.benefits && selectedSuggestion.benefits.length > 0 && (
              <div>
                <Title level={5}>Benefits</Title>
                <List
                  size="small"
                  dataSource={selectedSuggestion.benefits}
                  renderItem={(benefit) => (
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                      {benefit}
                    </List.Item>
                  )}
                />
              </div>
            )}

            <Divider />

            {/* Implementation Steps */}
            {selectedSuggestion.implementationSteps &&
              selectedSuggestion.implementationSteps.length > 0 && (
                <div>
                  <Title level={5}>Implementation Steps</Title>
                  <Steps direction="vertical" size="small" current={-1}>
                    {selectedSuggestion.implementationSteps.map((step, index) => (
                      <Step key={index} title={step.title} description={step.description} />
                    ))}
                  </Steps>
                </div>
              )}

            <Divider />

            {/* Impact Metrics */}
            <div>
              <Title level={5}>Estimated Impact</Title>
              <Descriptions bordered size="small" column={2}>
                <Descriptions.Item label="Time Saved">
                  {selectedSuggestion.estimatedImpact?.timeSaved || 0} hours/week
                </Descriptions.Item>
                <Descriptions.Item label="Cost Savings">
                  ${selectedSuggestion.estimatedImpact?.costSavings || 0}/month
                </Descriptions.Item>
                <Descriptions.Item label="Complexity">
                  {selectedSuggestion.estimatedImpact?.complexity || 'Low'}
                </Descriptions.Item>
                <Descriptions.Item label="Confidence">
                  <Progress
                    percent={selectedSuggestion.confidence || 0}
                    size="small"
                    status="active"
                  />
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* Prerequisites */}
            {selectedSuggestion.prerequisites && selectedSuggestion.prerequisites.length > 0 && (
              <>
                <Divider />
                <div>
                  <Title level={5}>Prerequisites</Title>
                  <List
                    size="small"
                    dataSource={selectedSuggestion.prerequisites}
                    renderItem={(prereq) => (
                      <List.Item>
                        <Tooltip title={prereq.description}>
                          <Tag color={prereq.met ? 'success' : 'warning'}>
                            {prereq.met ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                            {prereq.name}
                          </Tag>
                        </Tooltip>
                      </List.Item>
                    )}
                  />
                </div>
              </>
            )}
          </Space>
        )}
      </Modal>
    </div>
  );
}
