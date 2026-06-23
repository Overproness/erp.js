import React from 'react';
import { Button, Typography, Space } from '@/components/ui';
import {
  ExclamationCircleOutlined,
  HomeOutlined,
  SearchOutlined
} from '@/components/icons';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';

const { Title, Paragraph } = Typography;

const ErrorPage = ({ error, shortCode }) => {
  const translate = useLanguage();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleCreateUrl = () => {
    navigate('/url/create');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        textAlign: 'center', 
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '48px 32px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <ExclamationCircleOutlined 
          style={{ 
            fontSize: '72px', 
            color: '#ef4444', 
            marginBottom: '24px' 
          }} 
        />
        
        <Title level={2} style={{ color: 'white', marginBottom: '16px' }}>
          {translate('URL Not Found')}
        </Title>
        
        <Paragraph style={{ 
          color: 'rgba(255,255,255,0.8)', 
          fontSize: '16px',
          marginBottom: '8px'
        }}>
          {error || translate('The short URL you are looking for does not exist or has been removed.')}
        </Paragraph>
        
        {shortCode && (
          <Paragraph style={{ 
            color: 'rgba(255,255,255,0.6)', 
            fontSize: '14px',
            marginBottom: '32px'
          }}>
            {translate('Short code')}: <code style={{ 
              background: 'rgba(255,255,255,0.1)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              color: 'white'
            }}>{shortCode}</code>
          </Paragraph>
        )}
        
        <Space size="large" direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Button
              type="primary"
              size="large"
              icon={<HomeOutlined />}
              onClick={handleGoHome}
            >
              {translate('Go Home')}
            </Button>
            
            <Button
              size="large"
              icon={<SearchOutlined />}
              onClick={handleCreateUrl}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white'
              }}
            >
              {translate('Create URL')}
            </Button>
          </Space>
        </Space>
        
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '12px'
        }}>
          {translate('If you believe this is an error, please contact support')}
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
