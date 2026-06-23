import apolloClient from '@/graphql/client';
import { DOCUMENT_SHARE } from '@/graphql/operations/document';
import useLanguage from '@/locale/useLanguage';
import {
  ClockCircleOutlined,
  CopyOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  LockOutlined,
  ShareAltOutlined,
} from '@/components/icons';
import {
  Alert,
  Button,
  Card,
  Collapse,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Switch,
  Typography,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Text, Paragraph } = Typography;
const { Panel } = Collapse;

const ShareDocumentModal = ({ visible, onCancel, documentId }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [shareDetails, setShareDetails] = useState(null);

  // Security settings state
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [hasClickLimit, setHasClickLimit] = useState(false);

  const handleGenerateShareUrl = async (values) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || window.localStorage.getItem('token');

      // Build request payload
      const payload = {
        permissions: ['read'],
        analytics: true,
      };

      // Add password if enabled
      if (passwordProtected && values.password) {
        payload.password = values.password;
      }

      // Add expiration if enabled
      if (hasExpiration && values.expirationDate) {
        payload.expiresAt = values.expirationDate.toISOString();
      }

      // Add click limit if enabled
      if (hasClickLimit && values.maxViews) {
        payload.maxViews = values.maxViews;
      }

      const { data } = await apolloClient.mutate({
        mutation: DOCUMENT_SHARE,
        variables: {
          id: documentId,
          input: payload,
        },
      });
      const response = data.documentShare;

      if (response.success) {
        setShareUrl(response.result.shortUrl);
        setShareDetails(response.result);
        message.success('Share URL generated successfully');
      } else {
        message.error(response.message || 'Failed to generate share URL');
      }
    } catch (error) {
      console.error('Share URL error:', error);
      message.error('Failed to generate share URL');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      message.success('Share URL copied to clipboard');
    }
  };

  const handleReset = () => {
    setShareUrl(null);
    setShareDetails(null);
    setPasswordProtected(false);
    setHasExpiration(false);
    setHasClickLimit(false);
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
          <ShareAltOutlined />
          <span>{translate('Share Document')}</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      width={700}
      footer={null}
    >
      {!shareUrl ? (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateShareUrl}
          initialValues={{
            maxViews: 100,
          }}
        >
          <Alert
            message={translate('Security Controls')}
            description={translate(
              'Configure security options for your share link. These settings ensure only authorized users can access your document.'
            )}
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: '24px' }}
          />

          {/* Password Protection */}
          <Card
            size="small"
            style={{ marginBottom: '16px' }}
            title={
              <Space>
                <LockOutlined />
                <Text strong>{translate('Password Protection')}</Text>
              </Space>
            }
            extra={
              <Switch
                checked={passwordProtected}
                onChange={setPasswordProtected}
                checkedChildren={translate('ON')}
                unCheckedChildren={translate('OFF')}
              />
            }
          >
            {passwordProtected && (
              <Form.Item
                name="password"
                label={translate('Password')}
                rules={[
                  {
                    required: passwordProtected,
                    message: translate('Please enter a password'),
                  },
                  {
                    min: 4,
                    message: translate('Password must be at least 4 characters'),
                  },
                ]}
                extra={translate('Users will need this password to access the document')}
              >
                <Input.Password
                  placeholder={translate('Enter password')}
                  prefix={<LockOutlined />}
                />
              </Form.Item>
            )}
            {!passwordProtected && (
              <Text type="secondary">
                {translate('Anyone with the link can access this document')}
              </Text>
            )}
          </Card>

          {/* Expiration Date */}
          <Card
            size="small"
            style={{ marginBottom: '16px' }}
            title={
              <Space>
                <ClockCircleOutlined />
                <Text strong>{translate('Link Expiration')}</Text>
              </Space>
            }
            extra={
              <Switch
                checked={hasExpiration}
                onChange={setHasExpiration}
                checkedChildren={translate('ON')}
                unCheckedChildren={translate('OFF')}
              />
            }
          >
            {hasExpiration && (
              <Form.Item
                name="expirationDate"
                label={translate('Expiration Date')}
                rules={[
                  {
                    required: hasExpiration,
                    message: translate('Please select an expiration date'),
                  },
                ]}
                extra={translate('The link will become invalid after this date')}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  format="YYYY-MM-DD HH:mm"
                  placeholder={translate('Select expiration date and time')}
                />
              </Form.Item>
            )}
            {!hasExpiration && (
              <Text type="secondary">{translate('This link will never expire')}</Text>
            )}
          </Card>

          {/* Click Limit */}
          <Card
            size="small"
            style={{ marginBottom: '24px' }}
            title={
              <Space>
                <EyeOutlined />
                <Text strong>{translate('View Limit')}</Text>
              </Space>
            }
            extra={
              <Switch
                checked={hasClickLimit}
                onChange={setHasClickLimit}
                checkedChildren={translate('ON')}
                unCheckedChildren={translate('OFF')}
              />
            }
          >
            {hasClickLimit && (
              <Form.Item
                name="maxViews"
                label={translate('Maximum Views')}
                rules={[
                  {
                    required: hasClickLimit,
                    message: translate('Please enter maximum views'),
                  },
                  {
                    type: 'number',
                    min: 1,
                    message: translate('Must be at least 1'),
                  },
                ]}
                extra={translate('The link will stop working after this many views')}
              >
                <InputNumber
                  min={1}
                  max={10000}
                  style={{ width: '100%' }}
                  placeholder={translate('Enter maximum views')}
                />
              </Form.Item>
            )}
            {!hasClickLimit && (
              <Text type="secondary">{translate('No limit on the number of views')}</Text>
            )}
          </Card>

          <Divider />

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>{translate('Cancel')}</Button>
            <Button type="primary" htmlType="submit" loading={loading} icon={<ShareAltOutlined />}>
              {translate('Generate Share Link')}
            </Button>
          </Space>
        </Form>
      ) : (
        <div>
          <Alert
            message={translate('Share Link Generated Successfully')}
            description={translate('Your secure share link is ready to use')}
            type="success"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          {/* Share URL Display */}
          <Card style={{ marginBottom: '16px' }}>
            <Paragraph strong>{translate('Share URL')}</Paragraph>
            <Input.Search
              value={shareUrl}
              readOnly
              enterButton={
                <Button icon={<CopyOutlined />} type="primary">
                  {translate('Copy')}
                </Button>
              }
              onSearch={handleCopyShareUrl}
              size="large"
            />
          </Card>

          {/* Security Summary */}
          <Collapse defaultActiveKey={['security']} style={{ marginBottom: '16px' }}>
            <Panel header={translate('Security Settings')} key="security">
              <Space direction="vertical" style={{ width: '100%' }}>
                {shareDetails?.hasPassword && (
                  <div>
                    <LockOutlined style={{ marginRight: '8px', color: '#ff9800' }} />
                    <Text strong>{translate('Password Protected')}: </Text>
                    <Text type="success">{translate('Enabled')}</Text>
                  </div>
                )}
                {shareDetails?.expiresAt && (
                  <div>
                    <ClockCircleOutlined style={{ marginRight: '8px', color: '#2196f3' }} />
                    <Text strong>{translate('Expires')}: </Text>
                    <Text>{dayjs(shareDetails.expiresAt).format('YYYY-MM-DD HH:mm')}</Text>
                  </div>
                )}
                {shareDetails?.maxViews && (
                  <div>
                    <EyeOutlined style={{ marginRight: '8px', color: '#4caf50' }} />
                    <Text strong>{translate('Maximum Views')}: </Text>
                    <Text>{shareDetails.maxViews}</Text>
                  </div>
                )}
                {!shareDetails?.hasPassword &&
                  !shareDetails?.expiresAt &&
                  !shareDetails?.maxViews && (
                    <Text type="secondary">{translate('No security restrictions applied')}</Text>
                  )}
              </Space>
            </Panel>
          </Collapse>

          {/* Information */}
          <Alert
            message={translate('Important Information')}
            description={
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>{translate('Anyone with this link can view and download the document')}</li>
                <li>{translate('The link includes tracking and analytics')}</li>
                <li>{translate('You can manage all share links from the document list')}</li>
                {shareDetails?.hasPassword && (
                  <li>
                    {translate('Recipients will need the password you set to access the document')}
                  </li>
                )}
              </ul>
            }
            type="info"
            showIcon
          />

          <Divider />

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={handleReset}>{translate('Generate Another Link')}</Button>
            <Space>
              <Button onClick={handleClose}>{translate('Close')}</Button>
              <Button type="primary" icon={<CopyOutlined />} onClick={handleCopyShareUrl}>
                {translate('Copy URL')}
              </Button>
            </Space>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default ShareDocumentModal;
