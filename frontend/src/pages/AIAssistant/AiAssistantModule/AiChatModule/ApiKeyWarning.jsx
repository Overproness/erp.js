import React, { useState, useEffect } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { SettingOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { useSelector } from 'react-redux';
import { selectAppSettings } from '@/redux/settings/selectors';

const { Text } = Typography;

const ApiKeyWarning = ({ onApiKeyCheck }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { result: currentSettings } = useSelector(selectAppSettings);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkApiKey = () => {
      setIsChecking(true);
      const apiKey = currentSettings?.openai_api_key;
      const hasKey = !!(apiKey && apiKey.trim().length > 0);
      setHasApiKey(hasKey);
      setIsChecking(false);
      
      // Notify parent component
      if (onApiKeyCheck) {
        onApiKeyCheck(hasKey);
      }
    };

    checkApiKey();
  }, [currentSettings, onApiKeyCheck]);

  const handleGoToSettings = () => {
    navigate('/settings/ai_settings');
  };

  if (isChecking) {
    return null; // Don't show anything while checking
  }

  if (hasApiKey) {
    return null; // Don't show warning if API key exists
  }

  return (
    <Alert
      message={translate('OpenAI API Key Required')}
      description={
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text>
            {translate(
              'To use the AI Assistant, you need to configure your personal OpenAI API key. This ensures your conversations are private and you have full control over usage costs.'
            )}
          </Text>
          <Space>
            <Button
              type="primary"
              icon={<SettingOutlined />}
              onClick={handleGoToSettings}
            >
              {translate('Configure API Key')}
            </Button>
            <Button
              type="link"
              icon={<KeyOutlined />}
              href="https://platform.openai.com/api-keys"
              target="_blank"
            >
              {translate('Get API Key from OpenAI')}
            </Button>
          </Space>
        </Space>
      }
      type="warning"
      showIcon
      style={{ margin: '16px 24px' }}
    />
  );
};

export default ApiKeyWarning;