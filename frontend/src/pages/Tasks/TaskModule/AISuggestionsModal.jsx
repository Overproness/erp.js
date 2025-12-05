import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Table,
  Tag,
  Spin,
  Alert,
  Space,
  Typography,
  Card,
  message,
  Tooltip,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  BulbOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import taskRequest from '@/request/taskRequest';

const { Title, Text, Paragraph } = Typography;

/**
 * AI Suggestions Modal Component
 * Displays AI-powered task prioritization suggestions and allows users to apply them
 */
const AISuggestionsModal = ({ visible, onClose, tasks, onApply }) => {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [applying, setApplying] = useState(false);

  // Load AI suggestions when modal opens
  useEffect(() => {
    if (visible && tasks && tasks.length > 0) {
      loadAISuggestions();
    }
  }, [visible, tasks]);

  const loadAISuggestions = async () => {
    setLoading(true);
    try {
      const response = await taskRequest.getAIPrioritySuggestions(tasks);
      
      if (response.success && response.result) {
        setAiSuggestions(response.result.suggestions || []);
      } else {
        message.error(translate('Failed to load AI suggestions'));
        setAiSuggestions([]);
      }
    } catch (error) {
      console.error('Error loading AI suggestions:', error);
      message.error(translate('Failed to load AI suggestions'));
      setAiSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestions = async () => {
    setApplying(true);
    try {
      // Prepare updates for tasks with changed priorities
      const updates = aiSuggestions
        .filter(suggestion => suggestion.currentPriority !== suggestion.suggestedPriority)
        .map(suggestion => ({
          taskId: suggestion.taskId,
          priority: suggestion.suggestedPriority,
        }));

      if (updates.length === 0) {
        message.info(translate('No priority changes to apply'));
        return;
      }

      // Call the batch update API
      const response = await taskRequest.batchUpdatePriorities(updates);

      if (response.success) {
        message.success(translate(`Successfully updated ${updates.length} task priorities`));
        // Call parent's onApply callback to refresh task list
        if (onApply) {
          await onApply();
        }
        onClose();
      } else {
        message.error(translate('Failed to apply priority suggestions'));
      }
    } catch (error) {
      console.error('Error applying suggestions:', error);
      message.error(translate('Failed to apply priority suggestions'));
    } finally {
      setApplying(false);
    }
  };

  // Get priority tag color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'default';
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return <ThunderboltOutlined />;
      case 'medium':
        return <RiseOutlined />;
      case 'low':
        return <InfoCircleOutlined />;
      default:
        return null;
    }
  };

  // Table columns configuration
  const columns = [
    {
      title: translate('Task Name'),
      dataIndex: 'taskName',
      key: 'taskName',
      width: '30%',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: translate('Current Priority'),
      dataIndex: 'currentPriority',
      key: 'currentPriority',
      align: 'center',
      width: '15%',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} icon={getPriorityIcon(priority)}>
          {translate(priority?.toUpperCase() || 'MEDIUM')}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'arrow',
      align: 'center',
      width: '5%',
      render: () => <RiseOutlined style={{ fontSize: '16px', color: '#8b5cf6' }} />,
    },
    {
      title: translate('Suggested Priority'),
      dataIndex: 'suggestedPriority',
      key: 'suggestedPriority',
      align: 'center',
      width: '15%',
      render: (priority, record) => {
        const isChanged = priority !== record.currentPriority;
        return (
          <Tag
            color={getPriorityColor(priority)}
            icon={getPriorityIcon(priority)}
            style={isChanged ? { fontWeight: 'bold', border: '2px solid #8b5cf6' } : {}}
          >
            {translate(priority?.toUpperCase() || 'MEDIUM')}
          </Tag>
        );
      },
    },
    {
      title: translate('AI Reasoning'),
      dataIndex: 'reasoning',
      key: 'reasoning',
      width: '35%',
      render: (reasoning) => (
        <Tooltip title={reasoning}>
          <Text type="secondary" ellipsis style={{ maxWidth: '300px', display: 'block' }}>
            {reasoning}
          </Text>
        </Tooltip>
      ),
    },
  ];

  // Calculate statistics
  const changedCount = aiSuggestions.filter(
    s => s.currentPriority !== s.suggestedPriority
  ).length;

  return (
    <Modal
      title={
        <Space align="center">
          <BulbOutlined style={{ fontSize: '24px', color: '#8b5cf6' }} />
          <span>{translate('AI-Powered Task Prioritization')}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <div>
        <Paragraph type="secondary" style={{ marginBottom: '16px' }}>
          {translate(
            'Our AI has analyzed your tasks based on deadlines, status, complexity, and dependencies to suggest optimal priorities.'
          )}
        </Paragraph>

        {/* Statistics Cards */}
        {!loading && aiSuggestions.length > 0 && (
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col span={12}>
              <Card size="small" style={{ background: '#f9fafb' }}>
                <Statistic
                  title={translate('Total Tasks Analyzed')}
                  value={aiSuggestions.length}
                  valueStyle={{ fontSize: '24px' }}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" style={{ background: '#f9fafb' }}>
                <Statistic
                  title={translate('Priority Changes Suggested')}
                  value={changedCount}
                  valueStyle={{ fontSize: '24px', color: '#8b5cf6' }}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">{translate('AI is analyzing your tasks...')}</Text>
          </div>
        </div>
      )}

      {/* No Tasks State */}
      {!loading && tasks.length === 0 && (
        <Alert
          message={translate('No Tasks Available')}
          description={translate('There are no tasks to analyze. Please create some tasks first.')}
          type="info"
          showIcon
        />
      )}

      {/* AI Suggestions Table */}
      {!loading && aiSuggestions.length > 0 && (
        <>
          <Card
            style={{
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
            }}
          >
            <Table
              dataSource={aiSuggestions}
              columns={columns}
              rowKey="taskId"
              pagination={false}
              scroll={{ y: 400 }}
              size="middle"
            />
          </Card>

          {/* Footer with Action Buttons */}
          <div
            style={{
              marginTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Space>
              <InfoCircleOutlined style={{ color: '#8b5cf6' }} />
              <Text type="secondary">
                {changedCount > 0
                  ? translate(
                      `${changedCount} task${changedCount > 1 ? 's' : ''} will be updated`
                    )
                  : translate('All tasks have optimal priorities')}
              </Text>
            </Space>

            <Space>
              <Button onClick={onClose}>{translate('Cancel')}</Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApplySuggestions}
                loading={applying}
                disabled={changedCount === 0}
              >
                {translate('Apply Suggestions')}
              </Button>
            </Space>
          </div>
        </>
      )}

      {/* Error State */}
      {!loading && aiSuggestions.length === 0 && tasks.length > 0 && (
        <Alert
          message={translate('No AI Suggestions Available')}
          description={translate('Unable to generate AI suggestions at this time. Please try again later.')}
          type="warning"
          showIcon
          action={
            <Button size="small" type="link" onClick={loadAISuggestions} icon={<SyncOutlined />}>
              {translate('Retry')}
            </Button>
          }
        />
      )}
    </Modal>
  );
};

export default AISuggestionsModal;
