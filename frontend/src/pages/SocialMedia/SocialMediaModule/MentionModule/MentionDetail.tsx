import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Tag, 
  Avatar, 
  Typography,
  Input,
  Form,
  List,
  Divider,
  Select,
  message,
  Timeline,
  Tooltip
} from '@/components/ui';
import {
  ArrowLeftOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  RollbackOutlined,
  SaveOutlined,
  UserOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  SmileOutlined,
  FrownOutlined,
  MehOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useMentions } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const MentionDetail = ({ mention, onBack }) => {
  const translate = useLanguage();
  const { respondToMention, addNote, updateStatus } = useMentions();
  const [form] = Form.useForm();
  const [responding, setResponding] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  if (!mention) {
    return (
      <Card>
        <Text>{translate('No mention selected')}</Text>
      </Card>
    );
  }

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const getSentimentIcon = (sentiment) => {
    const icons = {
      positive: <SmileOutlined style={{ color: '#52c41a' }} />,
      negative: <FrownOutlined style={{ color: '#ff4d4f' }} />,
      neutral: <MehOutlined style={{ color: '#faad14' }} />,
    };
    return icons[sentiment] || <MehOutlined style={{ color: '#d9d9d9' }} />;
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'green',
      negative: 'red',
      neutral: 'orange',
    };
    return colors[sentiment] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      responded: 'green',
      ignored: 'red',
      pending: 'orange',
    };
    return colors[status] || 'default';
  };

  const handleRespond = async (values) => {
    try {
      setResponding(true);
      await respondToMention(mention._id, values);
      form.resetFields();
      message.success(translate('Response sent successfully'));
    } catch (error) {
      message.error(translate('Failed to send response'));
    } finally {
      setResponding(false);
    }
  };

  const handleAddNote = async (values) => {
    try {
      setAddingNote(true);
      await addNote(mention._id, values.note);
      form.resetFields();
      message.success(translate('Note added successfully'));
    } catch (error) {
      message.error(translate('Failed to add note'));
    } finally {
      setAddingNote(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateStatus(mention._id, newStatus);
      message.success(translate('Status updated successfully'));
    } catch (error) {
      message.error(translate('Failed to update status'));
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ marginBottom: '16px' }}
        >
          {translate('Back')}
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {translate('Mention Details')}
            </Title>
            <Space style={{ marginTop: '8px' }}>
              <Tag 
                color={getSentimentColor(mention.sentiment)} 
                icon={getSentimentIcon(mention.sentiment)}
              >
                {translate(mention.sentiment)}
              </Tag>
              <Tag color={getStatusColor(mention.status)}>
                {translate(mention.status)}
              </Tag>
              {getPlatformIcon(mention.platform)}
            </Space>
          </div>
          
          <Space>
            <Select
              value={mention.status}
              onChange={handleStatusUpdate}
              style={{ width: 120 }}
            >
              <Option value="new">{translate('New')}</Option>
              <Option value="pending">{translate('Pending')}</Option>
              <Option value="responded">{translate('Responded')}</Option>
              <Option value="ignored">{translate('Ignored')}</Option>
            </Select>
          </Space>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ flex: 2 }}>
          {/* Original Mention */}
          <Card title={translate('Original Mention')} style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Avatar
                src={mention.author.avatar}
                style={{ backgroundColor: '#8b5cf6', marginRight: '12px' }}
              >
                {mention.author.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {mention.author.name}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  @{mention.author.username} • {dayjs(mention.createdAt).format('MMM D, YYYY h:mm A')}
                </div>
              </div>
            </div>
            
            <Paragraph style={{ marginBottom: '16px', fontSize: '15px' }}>
              {mention.content}
            </Paragraph>
            
            {mention.media && mention.media.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                {mention.media.map((media, index) => (
                  <img 
                    key={index}
                    src={media.url} 
                    alt={`Media ${index + 1}`}
                    style={{ 
                      maxWidth: '100%', 
                      height: 'auto', 
                      borderRadius: '8px',
                      marginRight: '8px'
                    }}
                  />
                ))}
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '16px', color: '#6b7280', fontSize: '14px' }}>
              <span><HeartOutlined /> {mention.metrics?.likes || 0}</span>
              <span><MessageOutlined /> {mention.metrics?.comments || 0}</span>
              <span><ShareAltOutlined /> {mention.metrics?.shares || 0}</span>
            </div>
          </Card>

          {/* Response Form */}
          {mention.status !== 'responded' && (
            <Card title={translate('Respond to Mention')} style={{ marginBottom: '24px' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleRespond}
              >
                <Form.Item
                  name="responseType"
                  label={translate('Response Type')}
                  initialValue="comment"
                >
                  <Select>
                    <Option value="comment">{translate('Comment')}</Option>
                    <Option value="directMessage">{translate('Direct Message')}</Option>
                    <Option value="publicReply">{translate('Public Reply')}</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name="content"
                  label={translate('Response')}
                  rules={[{ required: true, message: translate('Please enter a response') }]}
                >
                  <TextArea
                    rows={4}
                    placeholder={translate('Type your response...')}
                    showCount
                    maxLength={280}
                  />
                </Form.Item>
                
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<RollbackOutlined />}
                    loading={responding}
                  >
                    {translate('Send Response')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          )}

          {/* Add Note Form */}
          <Card title={translate('Add Internal Note')}>
            <Form
              layout="vertical"
              onFinish={handleAddNote}
            >
              <Form.Item
                name="note"
                label={translate('Note')}
                rules={[{ required: true, message: translate('Please enter a note') }]}
              >
                <TextArea
                  rows={3}
                  placeholder={translate('Add an internal note...')}
                />
              </Form.Item>
              
              <Form.Item>
                <Button
                  type="default"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={addingNote}
                >
                  {translate('Add Note')}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* Sidebar */}
        <div style={{ flex: 1 }}>
          {/* Mention Info */}
          <Card title={translate('Mention Information')} style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{translate('Platform')}: </Text>
              <Space>
                {getPlatformIcon(mention.platform)}
                {mention.platform.charAt(0).toUpperCase() + mention.platform.slice(1)}
              </Space>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{translate('Sentiment')}: </Text>
              <Tag 
                color={getSentimentColor(mention.sentiment)} 
                icon={getSentimentIcon(mention.sentiment)}
              >
                {translate(mention.sentiment)}
              </Tag>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{translate('Status')}: </Text>
              <Tag color={getStatusColor(mention.status)}>
                {translate(mention.status)}
              </Tag>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>{translate('Created')}: </Text>
              <Text>{dayjs(mention.createdAt).format('MMM D, YYYY h:mm A')}</Text>
            </div>
            
            {mention.location && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Location')}: </Text>
                <Text>{mention.location}</Text>
              </div>
            )}
            
            {mention.language && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>{translate('Language')}: </Text>
                <Text>{mention.language}</Text>
              </div>
            )}
          </Card>

          {/* Activity Timeline */}
          <Card title={translate('Activity Timeline')}>
            <Timeline>
              <Timeline.Item 
                dot={<ClockCircleOutlined />}
                color="blue"
              >
                <div>
                  <Text strong>{translate('Mention Created')}</Text>
                  <br />
                  <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                    {dayjs(mention.createdAt).format('MMM D, YYYY h:mm A')}
                  </Text>
                </div>
              </Timeline.Item>
              
              {mention.responses && mention.responses.map((response, index) => (
                <Timeline.Item 
                  key={index}
                  color="green"
                >
                  <div>
                    <Text strong>{translate('Response Sent')}</Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                      {dayjs(response.createdAt).format('MMM D, YYYY h:mm A')}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px' }}>
                      {response.content.substring(0, 100)}...
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
              
              {mention.notes && mention.notes.map((note, index) => (
                <Timeline.Item 
                  key={index}
                  color="gray"
                >
                  <div>
                    <Text strong>{translate('Note Added')}</Text>
                    <br />
                    <Text style={{ fontSize: '12px', color: '#6b7280' }}>
                      {dayjs(note.createdAt).format('MMM D, YYYY h:mm A')}
                    </Text>
                    <br />
                    <Text style={{ fontSize: '12px' }}>
                      {note.content}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MentionDetail;
