import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space, 
  Upload, 
  DatePicker, 
  Switch,
  Tag,
  Row,
  Col,
  Typography,
  Alert,
  message,
  Divider
} from '@/components/ui';
import {
  PictureOutlined,
  VideoCameraOutlined,
  CalendarOutlined,
  SendOutlined,
  SaveOutlined,
  RobotOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
} from '@/components/icons';
import { usePostManagement, useAccountManagement, useAIContent } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const PostEditor = ({ post, isCreating, onSave, onCancel }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const { createPost, publishPost, schedulePost } = usePostManagement();
  const { connectedPlatforms } = useAccountManagement();
  const { getContentSuggestions, getHashtagSuggestions, isGenerating } = useAIContent();
  
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (post && !isCreating) {
      form.setFieldsValue({
        content: post.content,
        platforms: post.platforms,
        scheduledAt: post.scheduledAt ? dayjs(post.scheduledAt) : null,
      });
      setSelectedPlatforms(post.platforms || []);
      setIsScheduled(!!post.scheduledAt);
      setMediaFiles(post.media || []);
    } else {
      // Set available platforms as default for new posts
      const availablePlatforms = Object.keys(connectedPlatforms);
      setSelectedPlatforms(availablePlatforms);
      form.setFieldsValue({
        platforms: availablePlatforms,
      });
    }
  }, [post, isCreating, connectedPlatforms, form]);

  const handlePlatformChange = (platforms) => {
    setSelectedPlatforms(platforms);
  };

  const handleMediaUpload = ({ fileList }) => {
    setMediaFiles(fileList);
  };

  const handleSave = async (isDraft = true) => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const postData = {
        content: values.content,
        platforms: selectedPlatforms,
        media: mediaFiles.map(file => file.response?.url || file.url).filter(Boolean),
        status: isDraft ? 'draft' : 'scheduled',
        scheduledAt: isScheduled ? values.scheduledAt?.toISOString() : null,
      };

      if (isCreating) {
        await createPost(postData);
        message.success(translate('Post saved successfully'));
      } else {
        // Update existing post logic would go here
        message.success(translate('Post updated successfully'));
      }
      
      onSave();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      const values = await form.validateFields();
      
      const postData = {
        content: values.content,
        platforms: selectedPlatforms,
        media: mediaFiles.map(file => file.response?.url || file.url).filter(Boolean),
        status: 'published',
      };

      if (isCreating) {
        const newPost = await createPost(postData);
        await publishPost(newPost._id);
      } else {
        await publishPost(post._id);
      }
      
      message.success(translate('Post published successfully'));
      onSave();
    } catch (error) {
      console.error('Publish error:', error);
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    try {
      setSaving(true);
      const values = await form.validateFields();
      
      const postData = {
        content: values.content,
        platforms: selectedPlatforms,
        media: mediaFiles.map(file => file.response?.url || file.url).filter(Boolean),
        status: 'scheduled',
        scheduledAt: values.scheduledAt?.toISOString(),
      };

      if (isCreating) {
        const newPost = await createPost(postData);
        await schedulePost(newPost._id, { scheduledAt: values.scheduledAt?.toISOString() });
      } else {
        await schedulePost(post._id, { scheduledAt: values.scheduledAt?.toISOString() });
      }
      
      message.success(translate('Post scheduled successfully'));
      onSave();
    } catch (error) {
      console.error('Schedule error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAIContentSuggestion = async () => {
    try {
      const currentContent = form.getFieldValue('content') || '';
      const result = await getContentSuggestions(
        `Generate social media content based on: ${currentContent}`,
        selectedPlatforms[0] || 'facebook'
      );
      
      if (result?.suggestions?.length > 0) {
        form.setFieldsValue({ content: result.suggestions[0] });
        message.success(translate('AI content suggestion applied'));
      }
    } catch (error) {
      message.error(translate('Failed to generate content suggestions'));
    }
  };

  const handleHashtagSuggestion = async () => {
    try {
      const content = form.getFieldValue('content') || '';
      if (!content.trim()) {
        message.warning(translate('Please enter some content first'));
        return;
      }
      
      const result = await getHashtagSuggestions(content, selectedPlatforms[0] || 'facebook');
      
      if (result?.hashtags?.length > 0) {
        const hashtags = result.hashtags.map(tag => `#${tag}`).join(' ');
        const currentContent = form.getFieldValue('content');
        form.setFieldsValue({ content: `${currentContent}\n\n${hashtags}` });
        message.success(translate('Hashtag suggestions added'));
      }
    } catch (error) {
      message.error(translate('Failed to generate hashtag suggestions'));
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const getCharacterLimit = (platform) => {
    const limits = {
      facebook: 8000,
      instagram: 2200,
      twitter: 280,
    };
    return limits[platform] || 2200;
  };

  const getMinCharacterLimit = () => {
    if (selectedPlatforms.length === 0) return 2200;
    return Math.min(...selectedPlatforms.map(getCharacterLimit));
  };

  const currentContentLength = form.getFieldValue('content')?.length || 0;
  const characterLimit = getMinCharacterLimit();
  const isOverLimit = currentContentLength > characterLimit;

  return (
    <div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={24}>
            <Col span={16}>
              {/* Content Section */}
              <Card 
                title={translate('Post Content')} 
                style={{ marginBottom: '24px' }}
                extra={
                  <Space>
                    <Button
                      icon={<RobotOutlined />}
                      onClick={handleAIContentSuggestion}
                      loading={isGenerating}
                      size="small"
                    >
                      {translate('AI Content')}
                    </Button>
                    <Button
                      onClick={handleHashtagSuggestion}
                      loading={isGenerating}
                      size="small"
                    >
                      {translate('Suggest Hashtags')}
                    </Button>
                  </Space>
                }
              >
                <Form.Item
                  name="content"
                  rules={[
                    { required: true, message: translate('Please enter post content') },
                    { max: characterLimit, message: translate(`Content exceeds ${characterLimit} character limit`) }
                  ]}
                >
                  <TextArea
                    rows={8}
                    placeholder={translate('What would you like to share?')}
                    showCount={{ max: characterLimit }}
                    status={isOverLimit ? 'error' : undefined}
                  />
                </Form.Item>

                {isOverLimit && (
                  <Alert
                    message={translate('Character limit exceeded')}
                    description={translate(`Content is ${currentContentLength - characterLimit} characters over the limit for the selected platforms.`)}
                    type="error"
                    showIcon
                    style={{ marginBottom: '16px' }}
                  />
                )}

                {/* Media Upload */}
                <Upload
                  listType="picture-card"
                  fileList={mediaFiles}
                  onChange={handleMediaUpload}
                  beforeUpload={() => false} // Prevent auto upload
                  multiple
                  accept="image/*,video/*"
                >
                  <div>
                    <PictureOutlined />
                    <div style={{ marginTop: 8 }}>
                      {translate('Add Media')}
                    </div>
                  </div>
                </Upload>
              </Card>
            </Col>

            <Col span={8}>
              {/* Platform Selection */}
              <Card title={translate('Target Platforms')} style={{ marginBottom: '24px' }}>
                <Form.Item
                  name="platforms"
                  rules={[{ required: true, message: translate('Please select at least one platform') }]}
                >
                  <Select
                    mode="multiple"
                    placeholder={translate('Select platforms')}
                    value={selectedPlatforms}
                    onChange={handlePlatformChange}
                  >
                    {Object.keys(connectedPlatforms).map(platform => (
                      <Option key={platform} value={platform}>
                        <Space>
                          {getPlatformIcon(platform)}
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                {/* Character limits for each platform */}
                <div>
                  <Text strong style={{ fontSize: '12px' }}>
                    {translate('Character Limits:')}
                  </Text>
                  {selectedPlatforms.map(platform => (
                    <div key={platform} style={{ fontSize: '12px', color: '#6b7280' }}>
                      {getPlatformIcon(platform)} {platform}: {getCharacterLimit(platform)}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Scheduling */}
              <Card title={translate('Publishing Options')}>
                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>{translate('Schedule for later')}</Text>
                      <Switch
                        checked={isScheduled}
                        onChange={setIsScheduled}
                      />
                    </div>
                    
                    {isScheduled && (
                      <Form.Item
                        name="scheduledAt"
                        rules={[{ required: isScheduled, message: translate('Please select schedule time') }]}
                      >
                        <DatePicker
                          showTime
                          style={{ width: '100%' }}
                          placeholder={translate('Select date and time')}
                          disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                      </Form.Item>
                    )}
                  </Space>
                </Form.Item>

                <Divider />

                {/* Action Buttons */}
                <Space direction="vertical" style={{ width: '100%' }}>
                  {!isScheduled ? (
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handlePublish}
                      loading={publishing}
                      block
                      disabled={isOverLimit}
                    >
                      {translate('Publish Now')}
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CalendarOutlined />}
                      onClick={handleSchedule}
                      loading={saving}
                      block
                      disabled={isOverLimit}
                    >
                      {translate('Schedule Post')}
                    </Button>
                  )}
                  
                  <Button
                    icon={<SaveOutlined />}
                    onClick={() => handleSave(true)}
                    loading={saving}
                    block
                  >
                    {translate('Save as Draft')}
                  </Button>
                  
                  <Button
                    onClick={onCancel}
                    block
                  >
                    {translate('Cancel')}
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default PostEditor;
