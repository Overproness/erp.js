import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  Space, 
  Typography, 
  Alert,
  Form,
  Divider
} from '@/components/ui';
import {
  LockOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  LinkOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Password } = Input;

const RedirectPage = ({ 
  url, 
  requiresPassword, 
  isExpired, 
  isLimitReached,
  onPasswordSubmit,
  onBack 
}) => {
  const translate = useLanguage();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      return;
    }

    setLoading(true);
    const success = await onPasswordSubmit(password);
    setLoading(false);
    
    if (!success) {
      form.setFields([{
        name: 'password',
        errors: [translate('Incorrect password')]
      }]);
    }
  };

  const renderPasswordForm = () => (
    <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <LockOutlined style={{ fontSize: '48px', color: '#8b5cf6', marginBottom: '16px' }} />
        <Title level={3} style={{ color: 'white', marginBottom: '8px' }}>
          {translate('Password Required')}
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          {translate('This URL is password protected. Please enter the password to continue.')}
        </Paragraph>
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <Form form={form} onFinish={handlePasswordSubmit}>
          <Form.Item 
            name="password"
            rules={[{ required: true, message: translate('Please enter the password') }]}
          >
            <Password
              size="large"
              placeholder={translate('Enter password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handlePasswordSubmit}
              autoFocus
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%' }} direction="vertical">
              <Button
                type="primary"
                size="large"
                loading={loading}
                htmlType="submit"
                style={{ width: '100%' }}
              >
                {translate('Continue')}
              </Button>
              
              <Button
                size="large"
                onClick={onBack}
                style={{ width: '100%' }}
                icon={<ArrowLeftOutlined />}
              >
                {translate('Go Back')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <div style={{ marginTop: '24px', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
        {translate('Destination')}: {url.originalUrl}
      </div>
    </div>
  );

  const renderExpiredMessage = () => (
    <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <ClockCircleOutlined style={{ fontSize: '48px', color: '#f59e0b', marginBottom: '16px' }} />
        <Title level={3} style={{ color: 'white', marginBottom: '8px' }}>
          {translate('URL Expired')}
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          {translate('This short URL has expired and is no longer accessible.')}
        </Paragraph>
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          <Alert
            message={translate('Expired on')}
            description={
              url.expirationDate
                ? dayjs(url.expirationDate).format('MMMM D, YYYY [at] HH:mm')
                : translate('Expired')
            }
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>{translate('Original URL:')}</Text>
            <br />
            <Text copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {url.originalUrl || url.finalUrl || url.shortCode}
            </Text>
          </div>

          <Button
            size="large"
            onClick={onBack}
            style={{ width: '100%' }}
            icon={<ArrowLeftOutlined />}
          >
            {translate('Go Back')}
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderLimitReachedMessage = () => (
    <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#ef4444', marginBottom: '16px' }} />
        <Title level={3} style={{ color: 'white', marginBottom: '8px' }}>
          {translate('Click Limit Reached')}
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.8)' }}>
          {translate('This short URL has reached its maximum number of clicks and is no longer accessible.')}
        </Paragraph>
      </div>

      <Card style={{ borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center' }}>
          <Alert
            message={translate('Click limit reached')}
            description={
              url.clickCount && url.clickLimit
                ? `${url.clickCount}/${url.clickLimit} ${translate('clicks used')}`
                : translate('Limit reached')
            }
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>{translate('Original URL:')}</Text>
            <br />
            <Text copyable style={{ fontSize: '12px', wordBreak: 'break-all' }}>
              {url.originalUrl || url.finalUrl || url.shortCode}
            </Text>
          </div>

          <Button
            size="large"
            onClick={onBack}
            style={{ width: '100%' }}
            icon={<ArrowLeftOutlined />}
          >
            {translate('Go Back')}
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {requiresPassword && renderPasswordForm()}
      {isExpired && renderExpiredMessage()}
      {isLimitReached && renderLimitReachedMessage()}
    </div>
  );
};

export default RedirectPage;
