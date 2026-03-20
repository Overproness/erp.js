import {
  CalendarOutlined,
  CopyOutlined,
  DollarOutlined,
  FileOutlined,
  FileTextOutlined,
  FormOutlined,
  LinkOutlined,
  PayCircleOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const urlTypeConfigs = {
  portal: {
    icon: <LinkOutlined />,
    title: 'Customer Portal',
    description: 'Generate a secure portal access URL for your customer',
    color: 'blue',
    fields: ['title', 'description', 'expiration', 'requiresAuth'],
  },
  payment: {
    icon: <DollarOutlined />,
    title: 'Payment Request',
    description: 'Create a payment request URL with amount details',
    color: 'green',
    fields: ['title', 'description', 'amount', 'currency', 'invoiceId', 'expiration'],
  },
  document: {
    icon: <FileOutlined />,
    title: 'Document Share',
    description: 'Share a document securely with your customer',
    color: 'orange',
    fields: [
      'title',
      'description',
      'documentId',
      'expiration',
      'requiresAuth',
      'passwordProtected',
      'maxClicks',
    ],
  },
  appointment: {
    icon: <CalendarOutlined />,
    title: 'Appointment Scheduling',
    description: 'Allow customer to schedule an appointment',
    color: 'purple',
    fields: ['title', 'description', 'timezone', 'duration', 'appointmentType', 'expiration'],
  },
  survey: {
    icon: <FormOutlined />,
    title: 'Survey/Feedback',
    description: 'Send a survey or feedback request',
    color: 'cyan',
    fields: ['title', 'description', 'surveyId', 'expiration'],
  },
  review: {
    icon: <StarOutlined />,
    title: 'Review Request',
    description: 'Request a review or testimonial from customer',
    color: 'gold',
    fields: ['title', 'description', 'platform', 'productId', 'expiration'],
  },
  quote: {
    icon: <FileTextOutlined />,
    title: 'Quote Acceptance',
    description: 'Send a quote for customer review and acceptance',
    color: 'geekblue',
    fields: ['title', 'description', 'quoteId', 'expiration'],
  },
  invoice: {
    icon: <PayCircleOutlined />,
    title: 'Invoice Payment',
    description: 'Send an invoice for customer payment',
    color: 'red',
    fields: ['title', 'description', 'invoiceId', 'expiration'],
  },
  event: {
    icon: <TeamOutlined />,
    title: 'Event Registration',
    description: 'Invite customer to register for an event',
    color: 'magenta',
    fields: ['title', 'description', 'eventId', 'expiration'],
  },
};

const GenerateCustomerUrlModal = ({
  visible,
  onCancel,
  customerId,
  customerName,
  onUrlGenerated,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [urlType, setUrlType] = useState('portal');
  const [generatedUrl, setGeneratedUrl] = useState(null);

  const handleTypeChange = (type) => {
    setUrlType(type);
    setGeneratedUrl(null);
    form.resetFields();
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Prepare request data based on URL type
      let requestData = {
        title: values.title,
        description: values.description,
        campaign: values.campaign,
        medium: values.medium || 'email',
        tags: values.tags || [],
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
      };

      // Add type-specific fields
      if (urlType === 'payment') {
        requestData.paymentData = {
          amount: values.amount,
          currency: values.currency || 'USD',
          description: values.description,
          invoiceId: values.invoiceId,
        };
      } else if (urlType === 'document') {
        requestData.documentId = values.documentId;
        requestData.requiresAuth = values.requiresAuth;
        requestData.passwordProtected = values.passwordProtected;
        requestData.maxClicks = values.maxClicks;
      } else if (urlType === 'appointment') {
        requestData.timezone = values.timezone || 'UTC';
        requestData.duration = values.duration || 30;
        requestData.appointmentType = values.appointmentType || 'general';
      } else if (urlType === 'survey') {
        requestData.surveyId = values.surveyId;
      } else if (urlType === 'review') {
        requestData.platform = values.platform || 'internal';
        requestData.productId = values.productId;
      } else if (urlType === 'quote') {
        requestData.quoteId = values.quoteId;
      } else if (urlType === 'invoice') {
        requestData.invoiceId = values.invoiceId;
      } else if (urlType === 'event') {
        requestData.eventId = values.eventId;
      } else if (urlType === 'portal') {
        requestData.requiresAuth = values.requiresAuth !== false;
      }

      // Make API request
      const { request } = await import('@/request');
      const response = await request.post({
        entity: 'client',
        id: customerId,
        subEntity: `generate-url/${urlType}`,
        jsonData: requestData,
      });

      if (response.success) {
        setGeneratedUrl(response.result);
        message.success('URL generated successfully!');
        if (onUrlGenerated) {
          onUrlGenerated(response.result);
        }
      } else {
        message.error(response.message || 'Failed to generate URL');
      }
    } catch (error) {
      console.error('Error generating URL:', error);
      message.error('Failed to generate URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (generatedUrl?.shortUrl) {
      navigator.clipboard.writeText(generatedUrl.shortUrl);
      message.success('URL copied to clipboard!');
    }
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    form.resetFields();
  };

  const config = urlTypeConfigs[urlType];

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          <span>Generate Custom URL for {customerName}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
    >
      {/* URL Type Selection */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5}>Select URL Type</Title>
        <Row gutter={[12, 12]}>
          {Object.entries(urlTypeConfigs).map(([type, typeConfig]) => (
            <Col span={8} key={type}>
              <Card
                hoverable
                size="small"
                style={{
                  borderColor: urlType === type ? typeConfig.color : undefined,
                  backgroundColor: urlType === type ? `${typeConfig.color}10` : undefined,
                }}
                onClick={() => handleTypeChange(type)}
              >
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space>
                    {typeConfig.icon}
                    <Text strong>{typeConfig.title}</Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {typeConfig.description}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      {!generatedUrl ? (
        <>
          {/* URL Configuration Form */}
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              title: `${config.title} - ${customerName}`,
              medium: 'email',
              currency: 'USD',
              duration: 30,
              timezone: 'UTC',
              requiresAuth: true,
              passwordProtected: false,
            }}
          >
            {/* Common Fields */}
            <Form.Item
              name="title"
              label="URL Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Enter URL title" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={2} placeholder="Enter description (optional)" />
            </Form.Item>

            {/* Type-specific fields */}
            {config.fields.includes('amount') && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="Amount"
                    rules={[{ required: true, message: 'Please enter amount' }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} step={0.01} placeholder="0.00" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="currency" label="Currency">
                    <Select>
                      <Option value="USD">USD</Option>
                      <Option value="EUR">EUR</Option>
                      <Option value="GBP">GBP</Option>
                      <Option value="CAD">CAD</Option>
                      <Option value="AUD">AUD</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}

            {config.fields.includes('documentId') && (
              <Form.Item
                name="documentId"
                label="Document ID"
                rules={[{ required: true, message: 'Please enter document ID' }]}
              >
                <Input placeholder="Enter document ID" />
              </Form.Item>
            )}

            {config.fields.includes('surveyId') && (
              <Form.Item
                name="surveyId"
                label="Survey ID"
                rules={[{ required: true, message: 'Please enter survey ID' }]}
              >
                <Input placeholder="Enter survey ID" />
              </Form.Item>
            )}

            {config.fields.includes('quoteId') && (
              <Form.Item
                name="quoteId"
                label="Quote ID"
                rules={[{ required: true, message: 'Please enter quote ID' }]}
              >
                <Input placeholder="Enter quote ID" />
              </Form.Item>
            )}

            {config.fields.includes('invoiceId') && (
              <Form.Item
                name="invoiceId"
                label="Invoice ID"
                rules={[{ required: true, message: 'Please enter invoice ID' }]}
              >
                <Input placeholder="Enter invoice ID" />
              </Form.Item>
            )}

            {config.fields.includes('eventId') && (
              <Form.Item
                name="eventId"
                label="Event ID"
                rules={[{ required: true, message: 'Please enter event ID' }]}
              >
                <Input placeholder="Enter event ID" />
              </Form.Item>
            )}

            {config.fields.includes('platform') && (
              <Form.Item name="platform" label="Review Platform">
                <Select>
                  <Option value="internal">Internal</Option>
                  <Option value="google">Google</Option>
                  <Option value="facebook">Facebook</Option>
                  <Option value="yelp">Yelp</Option>
                  <Option value="trustpilot">Trustpilot</Option>
                </Select>
              </Form.Item>
            )}

            {config.fields.includes('productId') && (
              <Form.Item name="productId" label="Product ID (Optional)">
                <Input placeholder="Enter product ID" />
              </Form.Item>
            )}

            {config.fields.includes('timezone') && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="timezone" label="Timezone">
                    <Select showSearch>
                      <Option value="UTC">UTC</Option>
                      <Option value="America/New_York">Eastern Time</Option>
                      <Option value="America/Chicago">Central Time</Option>
                      <Option value="America/Denver">Mountain Time</Option>
                      <Option value="America/Los_Angeles">Pacific Time</Option>
                      <Option value="Europe/London">London</Option>
                      <Option value="Europe/Paris">Paris</Option>
                      <Option value="Asia/Tokyo">Tokyo</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="duration" label="Duration (minutes)">
                    <InputNumber style={{ width: '100%' }} min={15} step={15} />
                  </Form.Item>
                </Col>
              </Row>
            )}

            {config.fields.includes('appointmentType') && (
              <Form.Item name="appointmentType" label="Appointment Type">
                <Select>
                  <Option value="general">General Meeting</Option>
                  <Option value="consultation">Consultation</Option>
                  <Option value="demo">Product Demo</Option>
                  <Option value="support">Support Call</Option>
                  <Option value="sales">Sales Call</Option>
                </Select>
              </Form.Item>
            )}

            {/* Security & Access Control */}
            {config.fields.includes('requiresAuth') && (
              <Form.Item name="requiresAuth" label="Require Authentication" valuePropName="checked">
                <Switch />
              </Form.Item>
            )}

            {config.fields.includes('passwordProtected') && (
              <Form.Item
                name="passwordProtected"
                label="Password Protected"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            )}

            {config.fields.includes('maxClicks') && (
              <Form.Item name="maxClicks" label="Maximum Clicks (Optional)">
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  placeholder="Leave empty for unlimited"
                />
              </Form.Item>
            )}

            {/* Expiration */}
            {config.fields.includes('expiration') && (
              <Form.Item name="expiresAt" label="Expiration Date (Optional)">
                <DatePicker
                  style={{ width: '100%' }}
                  showTime
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>
            )}

            {/* Campaign Tracking */}
            <Divider orientation="left">Campaign Tracking (Optional)</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="campaign" label="Campaign">
                  <Input placeholder="e.g., summer_promo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="medium" label="Medium">
                  <Select>
                    <Option value="email">Email</Option>
                    <Option value="sms">SMS</Option>
                    <Option value="social">Social Media</Option>
                    <Option value="direct">Direct</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          {/* Action Buttons */}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={onCancel}>Cancel</Button>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                loading={loading}
                onClick={handleGenerate}
              >
                Generate URL
              </Button>
            </Space>
          </div>
        </>
      ) : (
        <>
          {/* Generated URL Display */}
          <Card
            style={{ backgroundColor: '#f0f9ff', borderColor: '#1890ff' }}
            title={
              <Space>
                <Tag color={config.color} icon={config.icon}>
                  {config.title}
                </Tag>
                <Text strong>URL Generated Successfully!</Text>
              </Space>
            }
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Short URL:</Text>
                <Paragraph
                  copyable={{ text: generatedUrl.shortUrl }}
                  style={{ marginBottom: 0, fontSize: 16, fontWeight: 500 }}
                >
                  {generatedUrl.shortUrl}
                </Paragraph>
              </div>

              <div>
                <Text type="secondary">Short Code:</Text>
                <Paragraph copyable={{ text: generatedUrl.shortCode }} style={{ marginBottom: 0 }}>
                  {generatedUrl.shortCode}
                </Paragraph>
              </div>

              {generatedUrl.accessToken && (
                <div>
                  <Text type="secondary">Access Token:</Text>
                  <Paragraph
                    copyable={{ text: generatedUrl.accessToken }}
                    style={{ marginBottom: 0 }}
                  >
                    {generatedUrl.accessToken}
                  </Paragraph>
                </div>
              )}

              {generatedUrl.metadata?.validUntil && (
                <div>
                  <Text type="secondary">Valid Until:</Text>
                  <Text>
                    {' '}
                    {dayjs(generatedUrl.metadata.validUntil).format('MMMM D, YYYY h:mm A')}
                  </Text>
                </div>
              )}

              {generatedUrl.trackingData && (
                <div>
                  <Text type="secondary">UTM Parameters:</Text>
                  <Paragraph code style={{ marginBottom: 0, fontSize: 12 }}>
                    {generatedUrl.trackingData.utmParameters}
                  </Paragraph>
                </div>
              )}
            </Space>
          </Card>

          {/* Action Buttons */}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset}>Generate Another</Button>
              <Button icon={<CopyOutlined />} onClick={handleCopyUrl}>
                Copy URL
              </Button>
              <Button type="primary" onClick={onCancel}>
                Done
              </Button>
            </Space>
          </div>
        </>
      )}
    </Modal>
  );
};

export default GenerateCustomerUrlModal;
