import {
  ClockCircleOutlined,
  MailOutlined,
  MessageOutlined,
  SendOutlined,
} from '@/components/icons';
import { Button, Checkbox, Form, Input, message, Modal, Radio, Space } from '@/components/ui';
import { useCallback, useEffect, useState } from 'react';

/**
 * SendQuoteModal Component
 * Modal for sending quotes to customers via email/SMS
 */
const SendQuoteModal = ({ visible, onClose, quoteId, quoteNumber, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sendType, setSendType] = useState('send'); // 'send', 'resend', 'reminder'

  const handleSend = async (values) => {
    try {
      setLoading(true);

      const endpoint =
        sendType === 'send'
          ? `/quote/send/${quoteId}`
          : sendType === 'resend'
            ? `/quote/resend/${quoteId}`
            : `/quote/reminder/${quoteId}`;

      const request = (await import('../../request')).default;
      const response = await request.post(endpoint, values);

      if (response.success) {
        message.success(response.message || 'Quote sent successfully!');
        form.resetFields();
        onSuccess?.(response.result);
        onClose();
      } else {
        message.error(response.message || 'Failed to send quote');
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      message.error(error.message || 'Failed to send quote');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <SendOutlined />
          {sendType === 'send'
            ? 'Send Quote'
            : sendType === 'resend'
              ? 'Resend Quote'
              : 'Send Reminder'}
          {quoteNumber && <span style={{ color: '#888' }}>#{quoteNumber}</span>}
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSend}
        initialValues={{
          channels: ['email'],
          attachPdf: true,
        }}
      >
        <Form.Item name="sendType" label="Action Type">
          <Radio.Group onChange={(e) => setSendType(e.target.value)} value={sendType}>
            <Radio.Button value="send">
              <SendOutlined /> Send Quote
            </Radio.Button>
            <Radio.Button value="resend">
              <SendOutlined /> Resend
            </Radio.Button>
            <Radio.Button value="reminder">
              <ClockCircleOutlined /> Send Reminder
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item
          name="channels"
          label="Delivery Channels"
          rules={[{ required: true, message: 'Please select at least one channel' }]}
        >
          <Checkbox.Group>
            <Space direction="vertical">
              <Checkbox value="email">
                <MailOutlined /> Email
              </Checkbox>
              <Checkbox value="sms">
                <MessageOutlined /> SMS (Text Message)
              </Checkbox>
            </Space>
          </Checkbox.Group>
        </Form.Item>

        {sendType !== 'reminder' && (
          <Form.Item name="attachPdf" valuePropName="checked">
            <Checkbox>Attach PDF to email</Checkbox>
          </Form.Item>
        )}

        <Form.Item
          name="quoteUrl"
          label="Quote URL (Optional)"
          help="Public link where customer can view the quote online"
        >
          <Input placeholder="https://example.com/quotes/view/..." prefix={<SendOutlined />} />
        </Form.Item>

        {sendType === 'send' && (
          <Form.Item
            name="customMessage"
            label="Custom Message (Optional)"
            help="Add a personalized message to the email"
          >
            <Input.TextArea rows={3} placeholder="Enter a custom message for the customer..." />
          </Form.Item>
        )}

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>
              {sendType === 'send'
                ? 'Send Quote'
                : sendType === 'resend'
                  ? 'Resend Quote'
                  : 'Send Reminder'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

/**
 * DeliveryHistoryModal Component
 * Shows delivery history for a quote
 */
const DeliveryHistoryModal = ({ visible, onClose, quoteId, quoteNumber }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const request = (await import('../../request')).default;
      const response = await request.get(`/quote/delivery-history/${quoteId}`);

      if (response.success) {
        setHistory(response.result.deliveryHistory || []);
      }
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      message.error('Failed to load delivery history');
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    if (visible && quoteId) {
      fetchHistory();
    }
  }, [visible, quoteId, fetchHistory]);

  const getChannelIcon = (channel) => {
    return channel === 'email' ? <MailOutlined /> : <MessageOutlined />;
  };

  const getStatusColor = (success) => {
    return success ? '#52c41a' : '#ff4d4f';
  };

  return (
    <Modal
      title={
        <Space>
          <ClockCircleOutlined />
          Delivery History
          {quoteNumber && <span style={{ color: '#888' }}>#{quoteNumber}</span>}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="refresh" onClick={fetchHistory} loading={loading}>
          Refresh
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={700}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
          No delivery history found. This quote hasn&apos;t been sent yet.
        </div>
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {history.map((entry, index) => (
            <div
              key={index}
              style={{
                border: '1px solid #e8e8e8',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <strong>
                  {entry.type === 'reminder' ? '🔔 Reminder' : '📧 Quote'} sent on{' '}
                  {new Date(entry.sentAt).toLocaleString()}
                </strong>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Channels:</strong> {entry.channels.join(', ')}
              </div>
              <div>
                {entry.results.map((result, resultIndex) => (
                  <div
                    key={resultIndex}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginTop: '8px',
                      paddingLeft: '16px',
                    }}
                  >
                    {getChannelIcon(result.channel)}
                    <span style={{ marginLeft: '8px' }}>
                      {result.channel.toUpperCase()}:{' '}
                      <span style={{ color: getStatusColor(result.success) }}>
                        {result.success ? '✓ Sent' : '✗ Failed'}
                      </span>
                      {' to '} {result.recipient}
                      {result.simulated && ' (simulated)'}
                      {result.error && ` - Error: ${result.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export { DeliveryHistoryModal, SendQuoteModal };
export default SendQuoteModal;
