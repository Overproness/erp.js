import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Select, 
  Card, 
  Row, 
  Col, 
  Tabs, 
  Typography, 
  Space, 
  Divider,
  Switch,
  Tag,
  Checkbox,
  Alert,
  Spin,
  Tooltip,
  message
} from '@/components/ui';
import { 
  PlusOutlined, 
  SaveOutlined, 
  SyncOutlined,
  InfoCircleOutlined, 
  UserAddOutlined,
  FilterOutlined,
  TeamOutlined,
  FacebookOutlined,
  GoogleOutlined,
  LinkedinOutlined,
  TwitterOutlined,
  InstagramOutlined // added
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

// Components
import AudienceRulesBuilder from './components/AudienceRulesBuilder';
import AudienceEstimator from './components/AudienceEstimator';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const RetargetingModule = ({ audience, onSave, onCancel }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [activeTab, setActiveTab] = useState('audience');
  const [audienceRules, setAudienceRules] = useState(audience?.rules || []);
  const [audienceSize, setAudienceSize] = useState(audience?.size || 0);
  const [selectedPlatforms, setSelectedPlatforms] = useState(audience?.platforms || []);

  // Dummy audience fallback (used when no audience prop is passed)
  const dummyAudience = {
    name: 'High-Intent Website Visitors',
    description: 'Users who visited pricing or checkout pages in the last 30 days.',
    type: 'custom',
    platforms: ['facebook', 'instagram', 'twitter'], // Limit to fb, instagram, twitter
    syncFrequency: 'daily',
    active: true,
    size: 8420,
    rules: [
      { type: 'behavioral', behavior: 'website_visit', timeframe: '30' },
      { type: 'behavioral', behavior: 'add_to_cart', timeframe: '30' },
      { type: 'demographic', field: 'location', operator: 'contains', value: 'United' },
      { type: 'interests', category: 'technology' }
    ]
  };

  // Initialize form with existing audience data or dummy fallback
  useEffect(() => {
    if (audience) {
      form.setFieldsValue({
        name: audience.name,
        description: audience.description,
        type: audience.type || 'custom',
        platforms: audience.platforms || [],
        syncFrequency: audience.syncFrequency || 'daily',
        active: audience.active !== undefined ? audience.active : true
      });
      setAudienceRules(audience.rules || []);
      setAudienceSize(audience.size || 0);
      setSelectedPlatforms(audience.platforms || []);
    } else {
      form.setFieldsValue({
        name: dummyAudience.name,
        description: dummyAudience.description,
        type: dummyAudience.type,
        platforms: dummyAudience.platforms,
        syncFrequency: dummyAudience.syncFrequency,
        active: dummyAudience.active
      });
      setAudienceRules(dummyAudience.rules);
      setAudienceSize(dummyAudience.size);
      setSelectedPlatforms(dummyAudience.platforms);
    }
  }, [audience, form]);

  // Handle platform selection changes
  const handlePlatformChange = (platforms) => {
    setSelectedPlatforms(platforms);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (audienceRules.length === 0 && values.type === 'custom') {
        message.error(translate('Please add at least one audience rule'));
        setLoading(false);
        return;
      }

      const audienceData = {
        ...values,
        rules: audienceRules,
        size: audienceSize,
        platforms: selectedPlatforms
      };
      
      // Here you would dispatch to your Redux actions
      // For now, just simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 800));
      
      message.success(translate(audience ? 'Audience updated successfully' : 'Audience created successfully'));
      onSave(audienceData);
    } catch (error) {
      console.error('Error saving audience:', error);
      message.error(translate('Failed to save audience'));
    } finally {
      setLoading(false);
    }
  };

  // Simulate audience size estimation
  const estimateAudienceSize = () => {
    setEstimating(true);
    setTimeout(() => {
      // Simulate calculation - in real world this would be an API call
      const estimatedSize = Math.floor(Math.random() * 10000) + 500;
      setAudienceSize(estimatedSize);
      setEstimating(false);
      message.success(translate('Audience size estimated'));
    }, 1500);
  };

  const audienceTypes = [
    { value: 'custom', label: translate('Custom Audience') },
    { value: 'lookalike', label: translate('Lookalike Audience') },
    { value: 'website', label: translate('Website Visitors') },
    { value: 'customer', label: translate('Customer List') },
    { value: 'engagement', label: translate('Engagement Audience') }
  ];

  const syncFrequencies = [
    { value: 'hourly', label: translate('Hourly') },
    { value: 'daily', label: translate('Daily') },
    { value: 'weekly', label: translate('Weekly') },
    { value: 'manual', label: translate('Manual') }
  ];

  // Only allow fb, instagram, twitter
  const allowedPlatforms = [
    { value: 'facebook', label: translate('Facebook'), icon: <FacebookOutlined style={{ color: '#1877F2' }} /> },
    { value: 'instagram', label: translate('Instagram'), icon: <InstagramOutlined style={{ color: '#E1306C' }} /> },
    { value: 'twitter', label: translate('Twitter'), icon: <TwitterOutlined style={{ color: '#1DA1F2' }} /> }
  ];

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          type: 'custom',
          platforms: [],
          syncFrequency: 'daily',
          active: true
        }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span><TeamOutlined /> {translate('Audience Definition')}</span>}
            key="audience"
          >
            <Row gutter={24}>
              <Col xs={24} md={16}>
                <Card style={{ marginBottom: '24px' }}>
                  <Form.Item
                    name="name"
                    label={translate('Audience Name')}
                    rules={[
                      {
                        required: true,
                        message: translate('Please enter an audience name'),
                      },
                    ]}
                  >
                    <Input placeholder={translate('Enter audience name')} />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label={translate('Description')}
                  >
                    <TextArea
                      placeholder={translate('Describe the audience purpose and characteristics')}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="type"
                    label={translate('Audience Type')}
                  >
                    <Select>
                      {audienceTypes.map(type => (
                        <Option key={type.value} value={type.value}>{type.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Card>

                <Card 
                  title={translate('Audience Rules')}
                  extra={
                    <Space>
                      <Tooltip title={translate('Estimate audience size based on current rules')}>
                        <Button 
                          icon={<SyncOutlined spin={estimating} />}
                          onClick={estimateAudienceSize}
                          loading={estimating}
                        >
                          {translate('Estimate Size')}
                        </Button>
                      </Tooltip>
                    </Space>
                  }
                  style={{ marginBottom: '24px' }}
                >
                  <AudienceRulesBuilder 
                    rules={audienceRules}
                    onChange={setAudienceRules}
                  />
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card 
                  title={translate('Audience Summary')}
                  style={{ marginBottom: '24px' }}
                >
                  <Paragraph>
                    <Text strong>{translate('Estimated size: ')}</Text>
                    {estimating ? (
                      <Spin size="small" style={{ marginLeft: '8px' }} />
                    ) : (
                      <Tag color="blue">{audienceSize.toLocaleString()} {translate('users')}</Tag>
                    )}
                  </Paragraph>
                  
                  <Paragraph>
                    <Text strong>{translate('Targeting platforms:')}</Text>
                    <div style={{ marginTop: '8px' }}>
                      <Space>
                        {selectedPlatforms.map(platform => {
                          const icons = {
                            'facebook': <FacebookOutlined style={{ color: '#1877F2' }} />,
                            'instagram': <InstagramOutlined style={{ color: '#E1306C' }} />,
                            'twitter': <TwitterOutlined style={{ color: '#1DA1F2' }} />,
                          };
                          return (
                            <Tag 
                              key={platform} 
                              icon={icons[platform]}
                              color={
                                platform === 'facebook' ? 'blue' : 
                                platform === 'instagram' ? 'magenta' :
                                platform === 'twitter' ? 'geekblue' :
                                'default'
                              }
                            >
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </Tag>
                          );
                        })}
                        {selectedPlatforms.length === 0 && (
                          <Text type="secondary">{translate('No platforms selected')}</Text>
                        )}
                      </Space>
                    </div>
                  </Paragraph>

                  {audienceRules.length > 0 && (
                    <>
                      <Divider style={{ margin: '12px 0' }} />
                      <Paragraph>
                        <Text strong>{translate('Rules Summary:')}</Text>
                        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                          {audienceRules.map((rule, index) => (
                            <li key={index} style={{ marginBottom: '4px' }}>
                              <Text>
                                {rule.type === 'demographic' && `${rule.field} ${rule.operator} ${rule.value}`}
                                {rule.type === 'behavioral' && `${rule.behavior} in last ${rule.timeframe} days`}
                                {rule.type === 'custom' && `${rule.name}: ${rule.value}`}
                                {rule.type === 'interests' && `Interested in: ${rule.category}`}
                              </Text>
                            </li>
                          ))}
                        </ul>
                      </Paragraph>
                    </>
                  )}
                  
                  {audienceRules.length === 0 && (
                    <Alert
                      message={translate('No audience rules defined')}
                      description={translate('Add rules to define your audience targeting criteria')}
                      type="warning"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  )}
                </Card>

                <Card title={translate('Settings')}>
                  <Form.Item
                    name="platforms"
                    label={translate('Target Platforms')}
                    rules={[
                      { 
                        required: true, 
                        message: translate('Please select at least one platform') 
                      }
                    ]}
                  >
                    <Checkbox.Group onChange={handlePlatformChange}>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {allowedPlatforms.map(p => (
                          <Checkbox value={p.value} key={p.value}>
                            <Space>
                              {p.icon}
                              {p.label}
                            </Space>
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </Form.Item>

                  <Form.Item
                    name="syncFrequency"
                    label={translate('Sync Frequency')}
                  >
                    <Select>
                      {syncFrequencies.map(option => (
                        <Option key={option.value} value={option.value}>{option.label}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="active"
                    label={translate('Status')}
                    valuePropName="checked"
                  >
                    <Switch 
                      checkedChildren={translate('Active')}
                      unCheckedChildren={translate('Inactive')}
                    />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane 
            tab={<span><UserAddOutlined /> {translate('Audience Insights')}</span>}
            key="insights"
            disabled={!audience || audienceSize === 0}
          >
            <AudienceEstimator 
              audienceSize={audienceSize}
              rules={audienceRules}
              platforms={selectedPlatforms}
            />
          </TabPane>
        </Tabs>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Button onClick={onCancel}>
              {translate('Cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {translate(audience ? 'Update Audience' : 'Create Audience')}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default RetargetingModule;
