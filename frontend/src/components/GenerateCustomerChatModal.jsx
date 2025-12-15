import { request } from '@/request';
import {
  CalendarOutlined,
  CopyOutlined,
  FileOutlined,
  LinkOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const GenerateCustomerChatModal = ({
  visible,
  onCancel,
  customerId,
  customerName,
  onGenerated,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState(null);

  const handleGenerate = async (values) => {
    try {
      setLoading(true);

      const payload = {
        title: values.title || `Chat with ${customerName}`,
        description: values.description,
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : null,
        allowFileSharing: values.allowFileSharing !== false,
        tags: ['customer-support'],
        createNew: values.createNew,
      };

      const response = await request.post(`/customer-chat/${customerId}/generate`, payload);

      if (response.data.success) {
        setGeneratedUrl(response.data.result);
        message.success(
          response.data.result.isExisting
            ? 'Active chat room found!'
            : 'Chat room created successfully!'
        );

        if (onGenerated) {
          onGenerated(response.data.result);
        }
      } else {
        message.error(response.data.message || 'Failed to generate chat URL');
      }
    } catch (error) {
      console.error('Error generating chat URL:', error);
      message.error(error.response?.data?.message || 'Failed to generate chat URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (generatedUrl?.accessUrl) {
      navigator.clipboard.writeText(generatedUrl.accessUrl);
      message.success('Chat URL copied to clipboard!');
    }
  };

  const handleReset = () => {
    setGeneratedUrl(null);
    form.resetFields();
  };

  const handleClose = () => {
    handleReset();
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined style={{ color: '#1890ff' }} />
          <span>Generate Customer Chat URL</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={null}
    >
      {!generatedUrl ? (
        <div>
          <Alert
            message="Create a real-time chat room"
            description={`Generate a secure chat URL for ${customerName}. You can chat with them in real-time, and they can access it through the link.`}
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleGenerate}
            initialValues={{
              title: `Chat with ${customerName}`,
              allowFileSharing: true,
              createNew: false,
            }}
          >
            <Form.Item
              name="title"
              label="Chat Room Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input
                prefix={<MessageOutlined />}
                placeholder="e.g., Support Chat, Product Inquiry"
              />
            </Form.Item>

            <Form.Item name="description" label="Description (Optional)">
              <TextArea rows={3} placeholder="Add a description for this chat room..." />
            </Form.Item>

            <Form.Item
              name="expiresAt"
              label={
                <Space>
                  <CalendarOutlined />
                  <span>Expiration Date (Optional)</span>
                </Space>
              }
            >
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="Select expiration date"
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              name="allowFileSharing"
              label={
                <Space>
                  <FileOutlined />
                  <span>Allow File Sharing</span>
                </Space>
              }
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="createNew"
              label="Force Create New Room"
              valuePropName="checked"
              tooltip="If disabled, will reuse existing active room if available"
            >
              <Switch />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading} icon={<LinkOutlined />}>
                  Generate Chat URL
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      ) : (
        <div>
          <Alert
            message={
              generatedUrl.isExisting
                ? 'Active Chat Room Found!'
                : 'Chat Room Created Successfully!'
            }
            description={
              generatedUrl.isExisting
                ? 'An active chat room already exists for this customer. You can use the URL below.'
                : 'Your chat room has been created. Share the URL with your customer to start chatting.'
            }
            type="success"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Text strong>Chat Room Details:</Text>
              <div style={{ marginTop: 12, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">Room ID:</Text>
                    <br />
                    <Tag color="blue">{generatedUrl.roomId}</Tag>
                  </div>
                  <div>
                    <Text type="secondary">Customer:</Text>
                    <br />
                    <Text strong>{generatedUrl.customer?.name || customerName}</Text>
                  </div>
                  <div>
                    <Text type="secondary">Status:</Text>
                    <br />
                    <Tag color="green">Active</Tag>
                  </div>
                </Space>
              </div>
            </div>

            <div>
              <Text strong>Share this URL with your customer:</Text>
              <Paragraph
                copyable={{
                  text: generatedUrl.accessUrl,
                  tooltips: ['Copy URL', 'Copied!'],
                }}
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#e6f7ff',
                  border: '1px solid #91d5ff',
                  borderRadius: 4,
                  wordBreak: 'break-all',
                }}
              >
                {generatedUrl.accessUrl}
              </Paragraph>
            </div>

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleReset}>Generate Another</Button>
              <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyUrl}>
                Copy URL
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </Space>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default GenerateCustomerChatModal;
