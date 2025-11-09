import { useState } from 'react';
import { Form, Input, Switch, Select, Button, Card, Alert, Space, Divider, Typography } from 'antd';
import { useSelector } from 'react-redux';
import {
  RobotOutlined,
  KeyOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { selectAppSettings } from '@/redux/settings/selectors';
import useLanguage from '@/locale/useLanguage';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

export default function AiSettingForm() {
  const translate = useLanguage();
  const { result: currentSettings } = useSelector(selectAppSettings);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Extract API key for testing functionality
  const openaiApiKey = currentSettings?.openai_api_key || '';

  const handleTestOpenAI = async () => {
    const form = document.querySelector('form');
    const formData = new FormData(form);
    const currentApiKey = formData.get('openai_api_key') || openaiApiKey;
    
    if (!currentApiKey) {
      setTestResult({
        success: false,
        message: translate('Please enter an API key first'),
      });
      return;
    }

    setTestingOpenAI(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/setting/testOpenAI', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: currentApiKey }),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.message,
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error.message || translate('Connection test failed'),
      });
    } finally {
      setTestingOpenAI(false);
    }
  };

  return (
    <>
      <Card
        title={
          <>
            <RobotOutlined /> {translate('AI Assistant Configuration')}
          </>
        }
      >
        <Alert
          message={translate('Personal AI Assistant Setup')}
          description={
            <div>
              {translate(
                "Configure your personal OpenAI API key to enable AI Assistant features throughout the system."
              )}
              <br />
              {translate(
                'Your API key will be stored securely and used only for your AI interactions. You can get an API key from OpenAI.'
              )}
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <Form.Item
          label={translate('Enable AI Assistant')}
          name="ai_enabled"
          valuePropName="checked"
          tooltip={translate(
            "Enable or disable AI Assistant features. When disabled, AI features will not be available."
          )}
        >
          <Switch
            checkedChildren={<RobotOutlined />}
            unCheckedChildren={<RobotOutlined />}
          />
        </Form.Item>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>{translate('OpenAI Configuration')}</Title>

          <Form.Item
            label={translate('OpenAI API Key')}
            name="openai_api_key"
            extra={translate(
              'Get your API key from https://platform.openai.com/api-keys'
            )}
          >
            <Input.Password
              placeholder={translate('Enter your OpenAI API key (sk-...)')}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item
            label={translate('OpenAI Model')}
            name="openai_model"
            tooltip={translate(
              'Choose the AI model to use. GPT-3.5-turbo is faster and cheaper, while GPT-4 is more powerful but costs more.'
            )}
          >
            <Select>
              <Option value="gpt-3.5-turbo">
                GPT-3.5 Turbo {translate('(Fast, Cost-effective)')}
              </Option>
              <Option value="gpt-4">
                GPT-4 {translate('(More Powerful, Higher Cost)')}
              </Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="dashed" onClick={handleTestOpenAI} loading={testingOpenAI}>
                {translate('Test API Key')}
              </Button>
              {testResult && (
                <Alert
                  message={
                    testResult.success
                      ? translate('✓ API Key Valid')
                      : translate('✗ API Key Invalid')
                  }
                  description={testResult.message}
                  type={testResult.success ? 'success' : 'error'}
                  showIcon
                />
              )}
            </Space>
          </Form.Item>
        </Space>
      </Card>

      <Card
        title={
          <>
            <InfoCircleOutlined /> {translate('Important Information')}
          </>
        }
        style={{ marginTop: '24px' }}
      >
        <Paragraph>
          <Text strong>{translate('Privacy & Security:')}</Text>
          <ul>
            <li>{translate('Your API key is encrypted and stored securely')}</li>
            <li>{translate('Only you can access your API key')}</li>
            <li>{translate('AI conversations are not stored on OpenAI servers beyond their retention policy')}</li>
          </ul>
        </Paragraph>
        <Paragraph>
          <Text strong>{translate('Usage & Costs:')}</Text>
          <ul>
            <li>{translate('You will be charged by OpenAI based on your usage')}</li>
            <li>{translate('Monitor your usage at https://platform.openai.com/usage')}</li>
            <li>{translate('Set usage limits in your OpenAI account if needed')}</li>
          </ul>
        </Paragraph>
      </Card>
    </>
  );
}
