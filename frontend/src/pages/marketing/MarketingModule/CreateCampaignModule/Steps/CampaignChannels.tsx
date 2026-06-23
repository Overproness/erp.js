import React, { useState } from 'react';
import { 
  Form, 
  Card, 
  Typography, 
  Checkbox, 
  Row, 
  Col, 
  Select,
  Input,
  TimePicker,
  Switch,
  Divider,
  Space,
  Tag,
  Radio,
  Alert
} from '@/components/ui';
import { 
  MailOutlined, 
  MobileOutlined, 
  BellOutlined, 
  FacebookOutlined, 
  TwitterOutlined,
  LinkedinOutlined,
  InstagramOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  SettingOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CampaignChannels = ({ form, formData, onChange }) => {
  const translate = useLanguage();
  const [selectedChannels, setSelectedChannels] = useState(formData?.channels || ['email']);
  
  // Handle channel selection changes
  const handleChannelChange = (checkedValues) => {
    setSelectedChannels(checkedValues);
    form.setFieldsValue({ channels: checkedValues });
    
    // If no channels selected, revert to email
    if (checkedValues.length === 0) {
      const defaultChannels = ['email'];
      setSelectedChannels(defaultChannels);
      form.setFieldsValue({ channels: defaultChannels });
    }
    
    onChange({ channels: checkedValues }, form.getFieldsValue());
  };

  // Get channel icon
  const getChannelIcon = (channel) => {
    const icons = {
      email: <MailOutlined style={{ color: '#4f46e5' }} />,
      sms: <MobileOutlined style={{ color: '#10b981' }} />,
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      twitter: <TwitterOutlined style={{ color: '#1da1f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#e4405f' }} />
    };
    return icons[channel] || <GlobalOutlined />;
  };

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Title level={4}>{translate('Delivery Channels')}</Title>
      <Text type="secondary" style={{ marginBottom: '24px', display: 'block' }}>
        {translate('Configure how and when your campaign will be delivered')}
      </Text>

      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ display: 'block', marginBottom: '12px' }}>
          {translate('Select Channels')}
        </Text>
        <Form.Item 
          name="channels"
          rules={[
            { 
              required: true, 
              message: translate('Please select at least one channel') 
            }
          ]}
        >
          <Checkbox.Group value={selectedChannels} onChange={handleChannelChange}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small" hoverable style={{ borderRadius: '8px' }}>
                  <Checkbox value="email" style={{ width: '100%' }}>
                    <Space align="center">
                      <MailOutlined style={{ color: '#4f46e5' }} />
                      <span>{translate('Email')}</span>
                    </Space>
                  </Checkbox>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small" hoverable style={{ borderRadius: '8px' }}>
                  <Checkbox value="sms" style={{ width: '100%' }}>
                    <Space align="center">
                      <MobileOutlined style={{ color: '#10b981' }} />
                      <span>{translate('SMS')}</span>
                    </Space>
                  </Checkbox>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small" hoverable style={{ borderRadius: '8px' }}>
                  <Checkbox value="facebook" style={{ width: '100%' }}>
                    <Space align="center">
                      <FacebookOutlined style={{ color: '#1877f2' }} />
                      <span>{translate('Facebook')}</span>
                    </Space>
                  </Checkbox>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small" hoverable style={{ borderRadius: '8px' }}>
                  <Checkbox value="twitter" style={{ width: '100%' }}>
                    <Space align="center">
                      <TwitterOutlined style={{ color: '#1da1f2' }} />
                      <span>{translate('Twitter')}</span>
                    </Space>
                  </Checkbox>
                </Card>
              </Col>
              
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card size="small" hoverable style={{ borderRadius: '8px' }}>
                  <Checkbox value="instagram" style={{ width: '100%' }}>
                    <Space align="center">
                      <InstagramOutlined style={{ color: '#e4405f' }} />
                      <span>{translate('Instagram')}</span>
                    </Space>
                  </Checkbox>
                </Card>
              </Col>
            </Row>
          </Checkbox.Group>
        </Form.Item>
      </div>
      <Divider />
      {/* Channel-specific settings */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={5} style={{ marginBottom: '16px' }}>
          {translate('Channel Configuration')}
        </Title>
        {selectedChannels.map(channel => (
          <Card 
            key={channel} 
            size="small" 
            title={
              <Space>
                {getChannelIcon(channel)}
                {translate(channel.charAt(0).toUpperCase() + channel.slice(1))}
              </Space>
            }
            style={{ marginBottom: '16px' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name={['channelSettings', channel, 'schedule']}
                  label={translate('Delivery Schedule')}
                  initialValue="immediate"
                >
                  <Select>
                    <Option value="immediate">{translate('Send immediately')}</Option>
                    <Option value="scheduled">{translate('Schedule for later')}</Option>
                    <Option value="optimal">{translate('Send at optimal time')}</Option>
                  </Select>
                </Form.Item>
                {form.getFieldValue(['channelSettings', channel, 'schedule']) === 'scheduled' && (
                  <Form.Item
                    name={['channelSettings', channel, 'scheduledTime']}
                    label={translate('Scheduled Time')}
                  >
                    <TimePicker 
                      format="HH:mm" 
                      style={{ width: '100%' }} 
                      placeholder={translate('Select time')}
                    />
                  </Form.Item>
                )}
                {channel === 'email' && (
                  <Form.Item
                    name={['channelSettings', channel, 'fromName']}
                    label={translate('From Name')}
                  >
                    <Input placeholder={translate('Sender name')} />
                  </Form.Item>
                )}
                {channel === 'sms' && (
                  <Form.Item
                    name={['channelSettings', channel, 'senderId']}
                    label={translate('Sender ID')}
                  >
                    <Input placeholder={translate('SMS Sender ID')} maxLength={11} />
                  </Form.Item>
                )}
              </Col>
              <Col xs={24} md={12}>
                {(channel === 'email' || channel === 'sms') && (
                  <Form.Item
                    name={['channelSettings', channel, 'testRecipients']}
                    label={translate('Test Recipients')}
                  >
                    <Select
                      mode="tags"
                      style={{ width: '100%' }}
                      placeholder={channel === 'email' 
                        ? translate('Enter email addresses') 
                        : translate('Enter phone numbers')}
                      tokenSeparators={[',']}
                    />
                  </Form.Item>
                )}
                {(channel === 'facebook' || channel === 'twitter' || channel === 'instagram') && (
                  <Form.Item
                    name={['channelSettings', channel, 'account']}
                    label={translate('Connected Account')}
                  >
                    <Select
                      placeholder={translate('Select account')}
                    >
                      <Option value="main">{`${channel.charAt(0).toUpperCase() + channel.slice(1)} Main`}</Option>
                      <Option value="business">{`${channel.charAt(0).toUpperCase() + channel.slice(1)} Business`}</Option>
                    </Select>
                  </Form.Item>
                )}
                <Form.Item
                  name={['channelSettings', channel, 'trackingEnabled']}
                  valuePropName="checked"
                  initialValue={true}
                >
                  <Checkbox>{translate('Enable tracking for this channel')}</Checkbox>
                </Form.Item>
              </Col>
            </Row>
            {channel === 'email' && (
              <Alert
                message={translate('Email Deliverability Tip')}
                description={translate('Send to a small test group first to check delivery rates before launching to your full audience.')}
                type="info"
                showIcon
              />
            )}
          </Card>
        ))}
      </div>
      <Divider />
      {/* Advanced delivery settings */}
      <div>
        <Title level={5} style={{ marginBottom: '16px' }}>
          <SettingOutlined /> {translate('Advanced Delivery Settings')}
        </Title>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="deliverySpeedLimit"
              label={translate('Delivery Speed Limit')}
              initialValue={0}
              tooltip={translate('Limit sending rate to avoid triggering spam filters (0 = no limit)')}
            >
              <Input 
                type="number" 
                min={0}
                addonAfter={translate('messages per hour')}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="retryFailedDeliveries"
              valuePropName="checked"
              initialValue={true}
            >
              <Checkbox>{translate('Retry failed deliveries (up to 3 attempts)')}</Checkbox>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="timeZoneSettings"
          label={translate('Time Zone Handling')}
          initialValue="recipient"
        >
          <Radio.Group>
            <Space direction="vertical">
              <Radio value="recipient">
                {translate('Deliver based on each recipient\'s local time zone')}
              </Radio>
              <Radio value="campaign">
                {translate('Deliver based on campaign time zone')}
              </Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
        <Form.Item
          name="abTesting"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch /> {translate('Enable A/B testing')}
        </Form.Item>
        {form.getFieldValue('abTesting') && (
          <Alert
            message={translate('A/B Testing Enabled')}
            description={translate('Please configure A/B testing parameters on the next screen after completing this step.')}
            type="success"
            showIcon
          />
        )}
      </div>
    </Card>
  );
};

export default CampaignChannels;