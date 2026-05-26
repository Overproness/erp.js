import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import { selectAssistantsLoading, selectCurrentAssistant } from '@/redux/ai/aiSelectors';
import { fetchAssistant } from '@/redux/ai/aiThunks';
import { useDate } from '@/settings';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  BulbOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  MessageOutlined,
  RobotOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
} from '@/components/ui';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const ReadAiAssistantModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();
  const { formatDate } = useDate();

  const assistant = useSelector(selectCurrentAssistant);
  const loading = useSelector(selectAssistantsLoading);

  console.log(assistant);

  const loadedRef = useRef('');
  useEffect(() => {
    if (id && loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(fetchAssistant(id));
    }
  }, [dispatch, id]);

  const getTypeIcon = (type) => {
    const icons = {
      general: <RobotOutlined />,
      document: <FileTextOutlined />,
      workflow: <SettingOutlined />,
      analytics: <BarChartOutlined />,
      customer: <UserOutlined />,
      financial: <DollarOutlined />,
    };
    return icons[type] || <RobotOutlined />;
  };

  const getTypeColor = (type) => {
    const colors = {
      general: 'blue',
      document: 'green',
      workflow: 'orange',
      analytics: 'purple',
      customer: 'cyan',
      financial: 'gold',
    };
    return colors[type] || 'blue';
  };

  if (loading) {
    return (
      <ErpLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <Spin size="large" />
        </div>
      </ErpLayout>
    );
  }

  if (!assistant) {
    return (
      <ErpLayout>
        <Alert
          message={translate('Assistant Not Found')}
          description={translate('The requested AI assistant could not be found.')}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/ai-assistant')}>
              {translate('Back to List')}
            </Button>
          }
        />
      </ErpLayout>
    );
  }

  return (
    <ErpLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/ai-assistant')}
            style={{ marginBottom: '16px' }}
          >
            {translate('Back')}
          </Button>

          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Avatar
                size={64}
                icon={getTypeIcon(assistant.type)}
                style={{
                  backgroundColor: getTypeColor(assistant.type) === 'blue' ? '#1890ff' : undefined,
                }}
              />
              <div>
                <Title level={2} style={{ margin: 0 }}>
                  {assistant.name}
                </Title>
                <Space>
                  <Tag color={getTypeColor(assistant.type)} icon={getTypeIcon(assistant.type)}>
                    {translate(assistant.type)}
                  </Tag>
                  <Tag color={assistant.enabled ? 'green' : 'red'}>
                    {assistant.enabled ? translate('Active') : translate('Inactive')}
                  </Tag>
                </Space>
              </div>
            </div>

            <Space>
              <Button
                icon={<MessageOutlined />}
                onClick={() => navigate(`/ai-assistant/chat/${assistant._id}`)}
              >
                {translate('Chat')}
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/ai-assistant/update/${assistant._id}`)}
              >
                {translate('Edit')}
              </Button>
            </Space>
          </div>
        </div>

        <Row gutter={24}>
          <Col span={16}>
            {/* Basic Information */}
            <Card title={translate('Assistant Information')} style={{ marginBottom: '24px' }}>
              <Descriptions column={2} variant="bordered">
                <Descriptions.Item label={translate('Name')}>{assistant.name}</Descriptions.Item>
                <Descriptions.Item label={translate('Type')}>
                  <Tag color={getTypeColor(assistant.type)} icon={getTypeIcon(assistant.type)}>
                    {translate(assistant.type)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={translate('Status')}>
                  <Tag color={assistant.enabled ? 'green' : 'red'}>
                    {assistant.enabled ? translate('Active') : translate('Inactive')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={translate('Created')}>
                  {formatDate(assistant.created)}
                </Descriptions.Item>
                <Descriptions.Item label={translate('Last Updated')}>
                  {formatDate(assistant.updated)}
                </Descriptions.Item>
                <Descriptions.Item label={translate('Model')}>
                  <Tag color="blue">{assistant.model?.modelName || 'gpt-3.5-turbo'}</Tag>
                </Descriptions.Item>
              </Descriptions>

              {assistant.description && (
                <>
                  <Divider />
                  <div>
                    <Text strong>{translate('Description')}:</Text>
                    <Paragraph style={{ marginTop: '8px' }}>{assistant.description}</Paragraph>
                  </div>
                </>
              )}
            </Card>

            {/* System Prompt */}
            <Card title={translate('System Prompt')} style={{ marginBottom: '24px' }}>
              <Paragraph>
                <Text code style={{ whiteSpace: 'pre-wrap' }}>
                  {assistant.systemPrompt}
                </Text>
              </Paragraph>
            </Card>
          </Col>

          <Col span={8}>
            {/* Model Configuration */}
            <Card title={translate('Model Configuration')} style={{ marginBottom: '24px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={translate('Provider')}>
                  {assistant.model?.provider || 'openai'}
                </Descriptions.Item>
                <Descriptions.Item label={translate('Model')}>
                  {assistant.model?.modelName || 'gpt-3.5-turbo'}
                </Descriptions.Item>
                <Descriptions.Item label={translate('Temperature')}>
                  {assistant.model?.parameters?.temperature || 0.7}
                </Descriptions.Item>
                <Descriptions.Item label={translate('Max Tokens')}>
                  {assistant.model?.parameters?.maxTokens || 1000}
                </Descriptions.Item>
                <Descriptions.Item label={translate('Top P')}>
                  {assistant.model?.parameters?.topP || 1}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Capabilities */}
            <Card title={translate('Capabilities')} style={{ marginBottom: '24px' }}>
              <Space wrap>
                {assistant.capabilities?.map((capability) => (
                  <Tag key={capability} icon={<BulbOutlined />}>
                    {translate(capability)}
                  </Tag>
                ))}
              </Space>
            </Card>

            {/* Context Modules */}
            {assistant.contextModules && assistant.contextModules.length > 0 && (
              <Card title={translate('Context Modules')} style={{ marginBottom: '24px' }}>
                <Space wrap>
                  {assistant.contextModules.map((module) => (
                    <Tag key={module} color="processing">
                      {translate(module)}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* Quick Actions */}
            <Card title={translate('Quick Actions')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<MessageOutlined />}
                  onClick={() => navigate(`/ai-assistant/chat/${assistant._id}`)}
                >
                  {translate('Start Chat')}
                </Button>
                <Button
                  block
                  icon={<BulbOutlined />}
                  onClick={() => navigate('/ai-assistant/suggestions')}
                >
                  {translate('Get Suggestions')}
                </Button>
                <Button
                  block
                  icon={<BarChartOutlined />}
                  onClick={() => navigate('/ai-assistant/analytics')}
                >
                  {translate('View Analytics')}
                </Button>
                <Button
                  block
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/ai-assistant/update/${assistant._id}`)}
                >
                  {translate('Edit Assistant')}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </ErpLayout>
  );
};

export default ReadAiAssistantModule;
