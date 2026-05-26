import apolloClient from '@/graphql/client';
import {
  GET_SURVEY,
  PUBLISH_SURVEY,
  CLOSE_SURVEY,
  DUPLICATE_SURVEY,
  DELETE_SURVEY,
} from '@/graphql/operations/survey';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Descriptions,
  Input,
  List,
  message,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SurveyRead() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const loadSurvey = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apolloClient.query({ query: GET_SURVEY, variables: { id } });
      if (data.surveyRead?.success) {
        setSurvey(data.surveyRead.result);
      } else {
        message.error('Failed to load survey');
        navigate('/survey');
      }
    } catch (error) {
      message.error('Failed to load survey');
      navigate('/survey');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadSurvey();
  }, [loadSurvey]);

  const handlePublish = async () => {
    try {
      await apolloClient.mutate({ mutation: PUBLISH_SURVEY, variables: { id } });
      message.success('Survey published successfully');
      loadSurvey();
    } catch (error) {
      message.error('Failed to publish survey');
    }
  };

  const handlePause = async () => {
    try {
      await apolloClient.mutate({ mutation: CLOSE_SURVEY, variables: { id } });
      message.success('Survey paused successfully');
      loadSurvey();
    } catch (error) {
      message.error('Failed to pause survey');
    }
  };

  const handleDuplicate = async () => {
    try {
      await apolloClient.mutate({ mutation: DUPLICATE_SURVEY, variables: { id } });
      message.success('Survey duplicated successfully');
      navigate('/survey');
    } catch (error) {
      message.error('Failed to duplicate survey');
    }
  };

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Are you sure you want to delete this survey?',
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apolloClient.mutate({ mutation: DELETE_SURVEY, variables: { id } });
          message.success('Survey deleted successfully');
          navigate('/survey');
        } catch (error) {
          message.error('Failed to delete survey');
        }
      },
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Link copied to clipboard');
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      active: 'success',
      paused: 'warning',
      closed: 'error',
      archived: 'default',
    };
    return colors[status] || 'default';
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      rating: 'Rating (1-5 stars)',
      nps: 'NPS (0-10 scale)',
      text: 'Text Response',
      multiple_choice: 'Multiple Choice',
      single_choice: 'Single Choice',
      scale: 'Scale (1-10)',
      boolean: 'Yes/No',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!survey) {
    return null;
  }

  const surveyUrl = survey.customUrl?.fullUrl
    ? `${window.location.origin}/public${survey.customUrl.fullUrl}`
    : 'Not generated';

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
          <Title level={2}>{survey.title}</Title>
          <Space>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/survey/${id}/edit`)}>
              Edit
            </Button>
            <Button icon={<BarChartOutlined />} onClick={() => navigate(`/survey/${id}/analytics`)}>
              Analytics
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={() => setShareModalVisible(true)}>
              Share
            </Button>
            {(survey.status === 'draft' || survey.status === 'paused') && (
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handlePublish}>
                Publish
              </Button>
            )}
            {survey.status === 'active' && (
              <Button icon={<PauseCircleOutlined />} onClick={handlePause}>
                Pause
              </Button>
            )}
            <Button icon={<CopyOutlined />} onClick={handleDuplicate}>
              Duplicate
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
              Delete
            </Button>
          </Space>
        </div>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Descriptions title="Survey Details" bordered column={2}>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(survey.status)}>{survey.status?.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag color="blue">{survey.type?.toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {survey.description || 'No description'}
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {dayjs(survey.createdAt).format('MMM DD, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Last Updated">
            {dayjs(survey.updatedAt).format('MMM DD, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Survey URL" span={2}>
            <Space>
              <Text copyable>{surveyUrl}</Text>
              <Button size="small" onClick={() => copyToClipboard(surveyUrl)}>
                Copy Link
              </Button>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Total Responses">
            {survey.analytics?.totalResponses || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Completed">
            {survey.analytics?.completedResponses || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Completion Rate">
            {survey.analytics?.completionRate || 0}%
          </Descriptions.Item>
          <Descriptions.Item label="NPS Score">
            {survey.analytics?.npsScore !== null && survey.analytics?.npsScore !== undefined
              ? survey.analytics.npsScore
              : 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Questions" style={{ marginBottom: 24 }}>
        <List
          dataSource={survey.questions || []}
          renderItem={(question, index) => (
            <List.Item key={question.questionId}>
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>Q{index + 1}.</Text>
                    <Text>{question.question}</Text>
                    {question.required && <Tag color="red">Required</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Text type="secondary">Type: {getQuestionTypeLabel(question.type)}</Text>
                    {question.options && question.options.length > 0 && (
                      <div>
                        <Text type="secondary">Options: </Text>
                        {question.options.map((opt, i) => (
                          <Tag key={i}>{opt.label}</Tag>
                        ))}
                      </div>
                    )}
                    {question.placeholder && (
                      <Text type="secondary">Placeholder: {question.placeholder}</Text>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>

      <Card title="Settings">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Allow Anonymous">
            {survey.settings?.allowAnonymous ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Require Email">
            {survey.settings?.requireEmail ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="One Response Per User">
            {survey.settings?.oneResponsePerUser ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Show Progress Bar">
            {survey.settings?.showProgressBar ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Show Question Numbers">
            {survey.settings?.showQuestionNumbers ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Randomize Questions">
            {survey.settings?.randomizeQuestions ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Thank You Message" span={2}>
            {survey.settings?.thankYouMessage || 'Thank you for your feedback!'}
          </Descriptions.Item>
          {survey.settings?.redirectUrl && (
            <Descriptions.Item label="Redirect URL" span={2}>
              <a href={survey.settings.redirectUrl} target="_blank" rel="noopener noreferrer">
                {survey.settings.redirectUrl}
              </a>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Share Modal */}
      <Modal
        title="Share Survey"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Survey URL:</Text>
            <TextArea value={surveyUrl} readOnly rows={3} style={{ marginTop: 8 }} />
            <Button
              type="primary"
              block
              style={{ marginTop: 8 }}
              onClick={() => copyToClipboard(surveyUrl)}
            >
              Copy Link
            </Button>
          </div>
          {survey.customUrl?.shortCode && (
            <div>
              <Text strong>Short Code:</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{survey.customUrl.shortCode}</Tag>
              </div>
            </div>
          )}
          <div>
            <Text type="secondary">Total Clicks: {survey.customUrl?.clicks || 0}</Text>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
