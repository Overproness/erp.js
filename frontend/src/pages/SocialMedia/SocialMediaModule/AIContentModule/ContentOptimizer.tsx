import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  Space,
  Typography,
  Row,
  Col,
  Progress,
  Tag,
  Alert,
  Divider,
  Tooltip,
  Slider,
  Switch,
  message
} from '@/components/ui';
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  SendOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
  BulbOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAIContent } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

const ContentOptimizer = () => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const { optimizeContent, isOptimizing, getHashtagSuggestions, getOptimalTimes } = useAIContent();
  
  const [optimizedContent, setOptimizedContent] = useState(null);
  const [originalContent, setOriginalContent] = useState('');
  const [selectedOptimization, setSelectedOptimization] = useState(null);

  const handleOptimize = async (values) => {
    try {
      setOriginalContent(values.content);
      const result = await optimizeContent(values);
      setOptimizedContent(result);
      message.success(translate('Content optimized successfully'));
    } catch (error) {
      message.error(translate('Failed to optimize content'));
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    message.success(translate('Content copied to clipboard'));
  };

  const handleUse = (content) => {
    form.setFieldValue('content', content);
    setOptimizedContent(null);
    setSelectedOptimization(content);
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'exception';
  };

  const OptimizationCard = ({ optimization, index }) => {
    const score = optimization.score || 75;
    
    return (
      <Card
        size="small"
        style={{ marginBottom: '16px' }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{translate('Optimization')} #{index + 1}</span>
            <Progress
              type="circle"
              percent={score}
              width={40}
              strokeColor={getScoreColor(score)}
              format={() => score}
            />
          </div>
        }
        extra={
          <Space>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(optimization.content)}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleUse(optimization.content)}
            >
              {translate('Use')}
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: '12px' }}>
          <TextArea
            value={optimization.content}
            readOnly
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ marginBottom: '8px' }}
          />
        </div>

        {optimization.hashtags && (
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ fontSize: '12px' }}>
              {translate('Suggested Hashtags')}:
            </Text>
            <div style={{ marginTop: '4px' }}>
              {optimization.hashtags.map(hashtag => (
                <Tag key={hashtag} style={{ margin: '2px' }} color="blue">
                  #{hashtag}
                </Tag>
              ))}
            </div>
          </div>
        )}

        {optimization.improvements && (
          <div style={{ marginBottom: '12px' }}>
            <Text strong style={{ fontSize: '12px' }}>
              {translate('Improvements')}:
            </Text>
            <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
              {optimization.improvements.map((improvement, i) => (
                <li key={i} style={{ fontSize: '12px', color: '#6b7280' }}>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
          <span>{translate('Character Count')}: {optimization.content.length}</span>
          <span>{translate('Engagement Score')}: {score}%</span>
        </div>
      </Card>
    );
  };

  return (
    <div>
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card title={translate('Content Optimizer')} style={{ marginBottom: '24px' }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleOptimize}
              initialValues={{
                platform: 'facebook',
                optimizationGoal: 'engagement',
                tone: 'professional',
                includeHashtags: true,
                includeEmojis: false,
                contentLength: 'optimal'
              }}
            >
              <Form.Item
                name="content"
                label={translate('Content to Optimize')}
                rules={[{ required: true, message: translate('Please enter content to optimize') }]}
              >
                <TextArea
                  rows={6}
                  placeholder={translate('Paste your content here to get AI-powered optimization suggestions...')}
                  showCount
                />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="platform"
                    label={translate('Target Platform')}
                  >
                    <Select>
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
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="optimizationGoal"
                    label={translate('Optimization Goal')}
                  >
                    <Select>
                      <Option value="engagement">{translate('Engagement')}</Option>
                      <Option value="reach">{translate('Reach')}</Option>
                      <Option value="clicks">{translate('Clicks')}</Option>
                      <Option value="conversions">{translate('Conversions')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="tone"
                    label={translate('Tone')}
                  >
                    <Select>
                      <Option value="professional">{translate('Professional')}</Option>
                      <Option value="casual">{translate('Casual')}</Option>
                      <Option value="friendly">{translate('Friendly')}</Option>
                      <Option value="humorous">{translate('Humorous')}</Option>
                      <Option value="authoritative">{translate('Authoritative')}</Option>
                      <Option value="inspirational">{translate('Inspirational')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="contentLength"
                    label={translate('Content Length')}
                  >
                    <Select>
                      <Option value="short">{translate('Short')}</Option>
                      <Option value="optimal">{translate('Optimal')}</Option>
                      <Option value="long">{translate('Long')}</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="includeHashtags"
                    valuePropName="checked"
                  >
                    <Space>
                      <Switch />
                      <span>{translate('Include Hashtags')}</span>
                    </Space>
                  </Form.Item>
                </Col>
                
                <Col span={12}>
                  <Form.Item
                    name="includeEmojis"
                    valuePropName="checked"
                  >
                    <Space>
                      <Switch />
                      <span>{translate('Include Emojis')}</span>
                    </Space>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="targetAudience"
                label={translate('Target Audience (Optional)')}
              >
                <Input placeholder={translate('e.g., Young professionals, Tech enthusiasts')} />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                icon={<ThunderboltOutlined />}
                loading={isOptimizing}
                block
              >
                {translate('Optimize Content')}
              </Button>
            </Form>
          </Card>

          {originalContent && (
            <Card title={translate('Original Content')}>
              <div style={{ 
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <Paragraph>{originalContent}</Paragraph>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {translate('Character Count')}: {originalContent.length}
                </div>
              </div>
            </Card>
          )}
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={translate('Optimization Results')}
            extra={
              optimizedContent && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => form.submit()}
                  loading={isOptimizing}
                >
                  {translate('Re-optimize')}
                </Button>
              )
            }
          >
            {isOptimizing ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <ThunderboltOutlined style={{ fontSize: '48px', color: '#8b5cf6' }} />
                </div>
                <Text>{translate('Analyzing and optimizing your content...')}</Text>
              </div>
            ) : optimizedContent ? (
              <div>
                {optimizedContent.suggestions && optimizedContent.suggestions.length > 0 ? (
                  optimizedContent.suggestions.map((optimization, index) => (
                    <OptimizationCard
                      key={index}
                      optimization={optimization}
                      index={index}
                    />
                  ))
                ) : (
                  <div>
                    <Alert
                      message={translate('No optimizations needed')}
                      description={translate('Your content is already well-optimized for the selected platform and goals.')}
                      type="success"
                      icon={<CheckCircleOutlined />}
                      style={{ marginBottom: '16px' }}
                    />
                    
                    <div style={{ 
                      padding: '16px',
                      backgroundColor: '#f0f9ff',
                      borderRadius: '8px',
                      border: '1px solid #bae6fd'
                    }}>
                      <Text strong>{translate('Current Content Score')}: </Text>
                      <Progress
                        percent={optimizedContent.score || 85}
                        strokeColor="#52c41a"
                        size="small"
                        style={{ width: '200px', marginLeft: '8px' }}
                      />
                    </div>
                  </div>
                )}

                {optimizedContent.insights && (
                  <Card size="small" style={{ marginTop: '16px' }}>
                    <Title level={5}>{translate('AI Insights')}</Title>
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {optimizedContent.insights.map((insight, index) => (
                        <li key={index} style={{ fontSize: '14px', marginBottom: '4px' }}>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {optimizedContent.optimalTimes && (
                  <Card size="small" style={{ marginTop: '16px' }}>
                    <Title level={5}>{translate('Optimal Posting Times')}</Title>
                    <Space wrap>
                      {optimizedContent.optimalTimes.map((time, index) => (
                        <Tag key={index} color="blue">
                          {time}
                        </Tag>
                      ))}
                    </Space>
                  </Card>
                )}
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px', 
                color: '#6b7280' 
              }}>
                <BulbOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>
                  <Text>{translate('Optimize your content with AI')}</Text>
                  <br />
                  <Text style={{ fontSize: '12px' }}>
                    {translate('Enter your content and click optimize to get AI-powered suggestions')}
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

export default ContentOptimizer;
