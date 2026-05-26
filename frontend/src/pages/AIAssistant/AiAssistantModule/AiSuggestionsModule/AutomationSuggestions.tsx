import useLanguage from '@/locale/useLanguage';
import { selectCurrentSuggestions, selectSuggestionsLoading } from '@/redux/ai/aiSelectors';
import { fetchSuggestions } from '@/redux/ai/aiThunks';
import {
  CheckCircleOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Empty, List, Space, Spin, Tag, Typography } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;

const AutomationSuggestions = () => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const suggestions = useSelector(selectCurrentSuggestions);
  const loading = useSelector(selectSuggestionsLoading);
  const [implementedSuggestions, setImplementedSuggestions] = useState([]);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    dispatch(
      fetchSuggestions({
        module: 'automation',
        data: { type: 'workflow_automation' },
        assistantId: 'default',
      })
    );
  }, [dispatch]);

  const handleImplementSuggestion = (suggestionId) => {
    setImplementedSuggestions((prev) => [...prev, suggestionId]);
    // Here you would typically call an API to implement the suggestion
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'green';
      case 'medium':
        return 'orange';
      case 'hard':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      default:
        return 'default';
    }
  };

  // Mock data if no suggestions available
  const mockSuggestions = suggestions?.length
    ? suggestions
    : [
        {
          id: 1,
          title: 'Automate Invoice Processing',
          description:
            'Set up automatic invoice processing for recurring clients with pre-defined terms.',
          category: 'Financial',
          difficulty: 'medium',
          impact: 'high',
          estimatedTimeSaving: '2 hours/day',
          steps: [
            'Configure invoice templates',
            'Set up client rules',
            'Enable automatic processing',
            'Set up notifications',
          ],
        },
        {
          id: 2,
          title: 'Customer Follow-up Automation',
          description:
            'Automatically send follow-up emails to customers based on their interaction history.',
          category: 'Sales',
          difficulty: 'easy',
          impact: 'medium',
          estimatedTimeSaving: '1 hour/day',
          steps: [
            'Create email templates',
            'Define trigger conditions',
            'Set up email sequences',
            'Monitor performance',
          ],
        },
        {
          id: 3,
          title: 'Document Approval Workflow',
          description: 'Create automated approval workflows for document reviews and sign-offs.',
          category: 'Operations',
          difficulty: 'hard',
          impact: 'high',
          estimatedTimeSaving: '3 hours/day',
          steps: [
            'Map approval process',
            'Configure workflow rules',
            'Set up notifications',
            'Test workflow',
            'Train team members',
          ],
        },
      ];

  return (
    <div>
      <Alert
        message={translate('Automation Opportunities')}
        description={translate(
          'AI has analyzed your workflows and identified these automation opportunities to save time and reduce manual work.'
        )}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16 }}>
            {translate('Analyzing your workflows for automation opportunities...')}
          </Paragraph>
        </div>
      ) : (
        <List
          dataSource={mockSuggestions}
          renderItem={(item) => (
            <List.Item>
              <Card
                style={{ width: '100%' }}
                actions={[
                  implementedSuggestions.includes(item.id) ? (
                    <Button type="text" disabled icon={<CheckCircleOutlined />}>
                      {translate('Implemented')}
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleImplementSuggestion(item.id)}
                    >
                      {translate('Implement')}
                    </Button>
                  ),
                  <Button type="text" icon={<InfoCircleOutlined />}>
                    {translate('Learn More')}
                  </Button>,
                ]}
              >
                <Card.Meta
                  avatar={<ThunderboltOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                  title={
                    <Space>
                      <span>{item.title}</span>
                      <Tag color="blue">{item.category}</Tag>
                    </Space>
                  }
                  description={
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Paragraph>{item.description}</Paragraph>

                      <Space wrap>
                        <Tag color={getDifficultyColor(item.difficulty)}>
                          {translate('Difficulty')}: {translate(item.difficulty)}
                        </Tag>
                        <Tag color={getImpactColor(item.impact)}>
                          {translate('Impact')}: {translate(item.impact)}
                        </Tag>
                        <Tag color="green">
                          {translate('Saves')}: {item.estimatedTimeSaving}
                        </Tag>
                      </Space>

                      <div>
                        <Text strong>{translate('Implementation Steps')}:</Text>
                        <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                          {item.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}

      {!loading && mockSuggestions.length === 0 && (
        <Empty
          description={translate('No automation suggestions available')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </div>
  );
};

export default AutomationSuggestions;
