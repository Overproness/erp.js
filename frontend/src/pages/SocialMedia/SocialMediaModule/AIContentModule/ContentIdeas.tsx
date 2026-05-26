import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space,
  List,
  Tag,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Spin
} from '@/components/ui';
import {
  BulbOutlined,
  RobotOutlined,
  CopyOutlined,
  SendOutlined,
  ReloadOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { useAIContent } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const ContentIdeas = () => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const { generateContentIdeas, isGenerating } = useAIContent();
  
  const [ideas, setIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);

  const contentTypes = [
    { value: 'promotional', label: translate('Promotional'), icon: '📢' },
    { value: 'educational', label: translate('Educational'), icon: '📚' },
    { value: 'entertainment', label: translate('Entertainment'), icon: '🎭' },
    { value: 'inspirational', label: translate('Inspirational'), icon: '✨' },
    { value: 'news', label: translate('News'), icon: '📰' },
    { value: 'behind-scenes', label: translate('Behind the Scenes'), icon: '🎬' },
    { value: 'user-generated', label: translate('User Generated'), icon: '👥' },
    { value: 'seasonal', label: translate('Seasonal'), icon: '🎃' },
  ];

  const industries = [
    { value: 'technology', label: translate('Technology') },
    { value: 'healthcare', label: translate('Healthcare') },
    { value: 'finance', label: translate('Finance') },
    { value: 'retail', label: translate('Retail') },
    { value: 'education', label: translate('Education') },
    { value: 'travel', label: translate('Travel') },
    { value: 'food', label: translate('Food & Beverage') },
    { value: 'fashion', label: translate('Fashion') },
    { value: 'fitness', label: translate('Fitness') },
    { value: 'automotive', label: translate('Automotive') },
  ];

  const tones = [
    { value: 'professional', label: translate('Professional') },
    { value: 'casual', label: translate('Casual') },
    { value: 'friendly', label: translate('Friendly') },
    { value: 'humorous', label: translate('Humorous') },
    { value: 'authoritative', label: translate('Authoritative') },
    { value: 'inspirational', label: translate('Inspirational') },
    { value: 'conversational', label: translate('Conversational') },
  ];

  const handleGenerateIdeas = async () => {
    try {
      const values = await form.validateFields();
      const result = await generateContentIdeas(values);
      
      if (result?.ideas) {
        setIdeas(result.ideas);
        message.success(translate('Content ideas generated successfully'));
      }
    } catch (error) {
      message.error(translate('Failed to generate content ideas'));
    }
  };

  const handleCopyIdea = (idea) => {
    navigator.clipboard.writeText(idea.content);
    message.success(translate('Content copied to clipboard'));
  };

  const handleUseIdea = (idea) => {
    setSelectedIdea(idea);
    // This would typically redirect to the post editor with the content pre-filled
    message.info(translate('Content ready for editing'));
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  return (
    <div>
      <Row gutter={24}>
        <Col xs={24} lg={8}>
          <Card title={translate('Generate Content Ideas')} style={{ marginBottom: '24px' }}>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                contentType: 'promotional',
                tone: 'professional',
                platforms: ['facebook', 'instagram', 'twitter'],
                count: 5
              }}
            >
              <Form.Item
                name="topic"
                label={translate('Topic or Theme')}
                rules={[{ required: true, message: translate('Please enter a topic') }]}
              >
                <Input
                  placeholder={translate('e.g., New product launch, Holiday sale')}
                />
              </Form.Item>

              <Form.Item
                name="contentType"
                label={translate('Content Type')}
                rules={[{ required: true, message: translate('Please select content type') }]}
              >
                <Select placeholder={translate('Select content type')}>
                  {contentTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Space>
                        <span>{type.icon}</span>
                        {type.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="industry"
                label={translate('Industry')}
              >
                <Select placeholder={translate('Select industry (optional)')}>
                  {industries.map(industry => (
                    <Option key={industry.value} value={industry.value}>
                      {industry.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="tone"
                label={translate('Tone')}
                rules={[{ required: true, message: translate('Please select tone') }]}
              >
                <Select placeholder={translate('Select tone')}>
                  {tones.map(tone => (
                    <Option key={tone.value} value={tone.value}>
                      {tone.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="platforms"
                label={translate('Target Platforms')}
                rules={[{ required: true, message: translate('Please select platforms') }]}
              >
                <Select
                  mode="multiple"
                  placeholder={translate('Select platforms')}
                >
                  <Option value="facebook">
                    <Space>
                      <FacebookOutlined />
                      Facebook
                    </Space>
                  </Option>
                  <Option value="instagram">
                    <Space>
                      <InstagramOutlined />
                      Instagram
                    </Space>
                  </Option>
                  <Option value="twitter">
                    <Space>
                      <TwitterOutlined />
                      Twitter
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="keywords"
                label={translate('Keywords (Optional)')}
              >
                <TextArea
                  rows={2}
                  placeholder={translate('Enter keywords separated by commas')}
                />
              </Form.Item>

              <Form.Item
                name="count"
                label={translate('Number of Ideas')}
              >
                <Select defaultValue={5}>
                  <Option value={3}>3 ideas</Option>
                  <Option value={5}>5 ideas</Option>
                  <Option value={10}>10 ideas</Option>
                </Select>
              </Form.Item>

              <Button
                type="primary"
                icon={<RobotOutlined />}
                onClick={handleGenerateIdeas}
                loading={isGenerating}
                block
              >
                {translate('Generate Ideas')}
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card 
            title={translate('Generated Ideas')}
            extra={
              ideas.length > 0 && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleGenerateIdeas}
                  loading={isGenerating}
                >
                  {translate('Regenerate')}
                </Button>
              )
            }
          >
            {isGenerating ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>{translate('Generating creative content ideas...')}</Text>
                </div>
              </div>
            ) : ideas.length > 0 ? (
              <List
                dataSource={ideas}
                renderItem={(idea, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => handleCopyIdea(idea)}
                      >
                        {translate('Copy')}
                      </Button>,
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => handleUseIdea(idea)}
                      >
                        {translate('Use')}
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '20px',
                          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </div>
                      }
                      title={
                        <div>
                          <Space wrap style={{ marginBottom: '8px' }}>
                            {idea.platforms?.map(platform => (
                              <Tag key={platform} icon={getPlatformIcon(platform)}>
                                {platform.charAt(0).toUpperCase() + platform.slice(1)}
                              </Tag>
                            ))}
                            <Tag color="blue">{idea.type}</Tag>
                          </Space>
                        </div>
                      }
                      description={
                        <div>
                          <Paragraph style={{ marginBottom: '12px' }}>
                            {idea.content}
                          </Paragraph>
                          
                          {idea.hashtags && (
                            <div style={{ marginTop: '8px' }}>
                              <Text strong style={{ fontSize: '12px' }}>
                                {translate('Suggested Hashtags')}:
                              </Text>
                              <div style={{ marginTop: '4px' }}>
                                {idea.hashtags.map(hashtag => (
                                  <Tag key={hashtag} style={{ margin: '2px' }}>
                                    #{hashtag}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {idea.tips && (
                            <div style={{ marginTop: '8px' }}>
                              <Text strong style={{ fontSize: '12px' }}>
                                {translate('Tips')}:
                              </Text>
                              <div style={{ 
                                fontSize: '12px', 
                                color: '#6b7280',
                                marginTop: '4px',
                                fontStyle: 'italic'
                              }}>
                                {idea.tips}
                              </div>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                color: '#6b7280' 
              }}>
                <BulbOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>
                  <Text>{translate('Generate AI-powered content ideas')}</Text>
                  <br />
                  <Text style={{ fontSize: '12px' }}>
                    {translate('Fill in the form and click generate to get started')}
                  </Text>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ContentIdeas;
