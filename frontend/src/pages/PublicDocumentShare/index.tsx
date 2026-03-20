import { API_BASE_URL } from '@/config/serverApiConfig';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  FileOutlined,
  LockOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

const PublicDocumentShare = () => {
  const { shortCode } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [error, setError] = useState(null);
  const [password, setPassword] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);

  useEffect(() => {
    checkShareLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortCode]);

  const checkShareLink = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}public/document/shared/${shortCode}`);

      if (response.data.success) {
        setDocumentData(response.data.result.document);
        setShareInfo(response.data.result);
        setRequiresPassword(false);
      } else if (response.data.requiresPassword) {
        setShareInfo(response.data);
        setRequiresPassword(true);
        setIsPasswordProtected(true); // Mark that this share is password-protected
      } else if (response.data.isExpired) {
        setIsExpired(true);
        setShareInfo(response.data);
      } else if (response.data.isLimitReached) {
        setIsLimitReached(true);
        setShareInfo(response.data);
      } else {
        setError(response.data.message || 'Unable to access this document');
      }
    } catch (err) {
      console.error('Error accessing share link:', err);
      if (err.response?.data?.requiresPassword) {
        setShareInfo(err.response.data);
        setRequiresPassword(true);
        setIsPasswordProtected(true); // Mark that this share is password-protected
      } else if (err.response?.data?.isExpired) {
        setIsExpired(true);
        setShareInfo(err.response.data);
      } else if (err.response?.data?.isLimitReached) {
        setIsLimitReached(true);
        setShareInfo(err.response.data);
      } else {
        setError(err.response?.data?.message || 'This share link is invalid or has been disabled');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password) {
      message.error('Please enter a password');
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_BASE_URL}public/document/shared/${shortCode}`, {
        password,
      });

      if (response.data.success) {
        setDocumentData(response.data.result.document);
        setShareInfo(response.data.result);
        setRequiresPassword(false);
        message.success('Access granted!');
      } else {
        message.error(response.data.message || 'Incorrect password');
      }
    } catch (err) {
      console.error('Password verification error:', err);
      message.error(err.response?.data?.message || 'Incorrect password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    // If this is a password-protected share and we have the password, include it
    const downloadUrl =
      isPasswordProtected && password && password.trim()
        ? `${API_BASE_URL}public/document/shared/${shortCode}/download?password=${encodeURIComponent(
            password
          )}`
        : shareInfo?.downloadUrl || `${API_BASE_URL}public/document/shared/${shortCode}/download`;

    console.log('Download URL:', downloadUrl); // Debug log
    console.log('Password state:', password ? 'Present' : 'Not present'); // Debug log
    console.log('Is password protected:', isPasswordProtected); // Debug log

    window.open(downloadUrl, '_blank');
    message.success('Download started');
  };

  const getFileIcon = () => {
    const iconStyle = { fontSize: '48px', color: '#1890ff' };
    return <FileOutlined style={iconStyle} />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Card style={{ textAlign: 'center', minWidth: '400px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: '16px' }}>Loading shared document...</Paragraph>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
        }}
      >
        <Card style={{ maxWidth: '600px', width: '100%' }}>
          <Result
            status="error"
            title="Unable to Access Document"
            subTitle={error}
            icon={<ExclamationCircleOutlined />}
          />
        </Card>
      </div>
    );
  }

  // Expired state
  if (isExpired) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
        }}
      >
        <Card style={{ maxWidth: '600px', width: '100%' }}>
          <Result
            status="warning"
            title="Share Link Expired"
            subTitle="This share link has expired and is no longer accessible."
            icon={<ClockCircleOutlined />}
            extra={
              <Paragraph type="secondary">
                Please contact the document owner for a new share link.
              </Paragraph>
            }
          />
        </Card>
      </div>
    );
  }

  // Limit reached state
  if (isLimitReached) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
        }}
      >
        <Card style={{ maxWidth: '600px', width: '100%' }}>
          <Result
            status="warning"
            title="View Limit Reached"
            subTitle="This share link has reached its maximum view limit."
            icon={<EyeOutlined />}
            extra={
              <Paragraph type="secondary">Please contact the document owner for access.</Paragraph>
            }
          />
        </Card>
      </div>
    );
  }

  // Password required state
  if (requiresPassword) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '24px',
        }}
      >
        <Card style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <LockOutlined style={{ fontSize: '64px', color: '#1890ff' }} />
            <Title level={3} style={{ marginTop: '16px' }}>
              Password Protected Document
            </Title>
            <Paragraph type="secondary">
              {shareInfo?.title || 'This document is password protected'}
            </Paragraph>
          </div>

          <Alert
            message="Access Restricted"
            description="This document requires a password to view. Please enter the password provided by the document owner."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Form onFinish={handlePasswordSubmit}>
            <Form.Item>
              <Input.Password
                size="large"
                placeholder="Enter password"
                prefix={<LockOutlined />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPressEnter={handlePasswordSubmit}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                size="large"
                block
                htmlType="submit"
                loading={submitting}
                icon={<CheckCircleOutlined />}
              >
                Access Document
              </Button>
            </Form.Item>
          </Form>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Don&apos;t have the password? Contact the document owner.
            </Text>
          </div>
        </Card>
      </div>
    );
  }

  // Document view state (after successful access)
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Header */}
            <div style={{ textAlign: 'center' }}>
              {getFileIcon(documentData?.fileType)}
              <Title level={2} style={{ marginTop: '16px', marginBottom: '8px' }}>
                {documentData?.title}
              </Title>
              {documentData?.description && (
                <Paragraph type="secondary">{documentData.description}</Paragraph>
              )}
            </div>

            {/* Document Information */}
            <Card
              type="inner"
              title={
                <Space>
                  <FileOutlined />
                  <span>Document Information</span>
                </Space>
              }
            >
              <Descriptions column={2} bordered>
                <Descriptions.Item label="File Name">
                  {documentData?.fileName || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="File Type">
                  <Tag color="blue">{documentData?.fileType?.toUpperCase() || 'N/A'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="File Size">
                  {formatFileSize(documentData?.fileSize)}
                </Descriptions.Item>
                <Descriptions.Item label="Document Type">
                  <Tag color="green">{documentData?.documentType || 'N/A'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Uploaded">
                  {documentData?.createdAt
                    ? dayjs(documentData.createdAt).format('MMMM D, YYYY')
                    : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Views">
                  <Tag icon={<EyeOutlined />} color="purple">
                    {shareInfo?.viewCount || 0} views
                  </Tag>
                </Descriptions.Item>
              </Descriptions>

              {documentData?.tags && documentData.tags.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <Text strong>Tags: </Text>
                  <Space wrap>
                    {documentData.tags.map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </Space>
                </div>
              )}
            </Card>

            {/* Actions */}
            <Card type="inner" title="Actions">
              <Space size="large" style={{ width: '100%', justifyContent: 'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  onClick={handleDownload}
                >
                  Download Document
                </Button>
              </Space>
            </Card>

            {/* Security Info */}
            <Alert
              message="Secure Share Link"
              description={
                <Space direction="vertical" size="small">
                  <Text>• This is a secure, tracked share link</Text>
                  <Text>• Your access is being logged for security purposes</Text>
                  {shareInfo?.permissions && (
                    <Text>
                      • Permissions: {shareInfo.permissions.map((p) => p.toUpperCase()).join(', ')}
                    </Text>
                  )}
                </Space>
              }
              type="info"
              showIcon
              icon={<LockOutlined />}
            />
          </Space>
        </Card>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: '#fff' }}>
          <Text style={{ color: '#fff', opacity: 0.8 }}>
            Shared securely via Document Management System
          </Text>
        </div>
      </div>
    </div>
  );
};

export default PublicDocumentShare;
