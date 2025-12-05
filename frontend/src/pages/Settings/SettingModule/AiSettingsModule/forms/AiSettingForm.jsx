import useLanguage from '@/locale/useLanguage';
import { selectAppSettings } from '@/redux/settings/selectors';
import { InfoCircleOutlined, KeyOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, Input, Select, Space, Switch, Typography } from 'antd';
import axios from 'axios';
import { useState } from 'react';
import { useSelector } from 'react-redux';

const { Text, Title, Paragraph } = Typography;
const { Option } = Select;

export default function AiSettingForm() {
  const translate = useLanguage();
  const { result: currentSettings } = useSelector(selectAppSettings);
  const form = Form.useFormInstance(); // Get form instance from parent
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingClaude, setTestingClaude] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [geminiTestResult, setGeminiTestResult] = useState(null);
  const [claudeTestResult, setClaudeTestResult] = useState(null);

  // Extract API keys for testing functionality
  const openaiApiKey = currentSettings?.openai_api_key || '';
  const geminiApiKey = currentSettings?.gemini_api_key || '';
  const claudeApiKey = currentSettings?.claude_api_key || '';

  const handleTestOpenAI = async () => {
    // Get the current value from the form field
    const currentApiKey = form.getFieldValue('openai_api_key') || openaiApiKey;

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
      const response = await axios.post('/setting/testOpenAI', {
        apiKey: currentApiKey,
      });

      setTestResult({
        success: response.data.success,
        message: response.data.message,
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

  const handleTestGemini = async () => {
    // Get the current value from the form field
    const currentApiKey = form.getFieldValue('gemini_api_key') || geminiApiKey;

    if (!currentApiKey) {
      setGeminiTestResult({
        success: false,
        message: translate('Please enter an API key first'),
      });
      return;
    }

    setTestingGemini(true);
    setGeminiTestResult(null);

    try {
      const response = await axios.post('/setting/testGemini', {
        apiKey: currentApiKey,
      });

      setGeminiTestResult({
        success: response.data.success,
        message: response.data.message,
      });
    } catch (error) {
      setGeminiTestResult({
        success: false,
        message: error.message || translate('Connection test failed'),
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestClaude = async () => {
    // Get the current value from the form field
    const currentApiKey = form.getFieldValue('claude_api_key') || claudeApiKey;

    if (!currentApiKey) {
      setClaudeTestResult({
        success: false,
        message: translate('Please enter an API key first'),
      });
      return;
    }

    setTestingClaude(true);
    setClaudeTestResult(null);

    try {
      const response = await axios.post('/setting/testClaude', {
        apiKey: currentApiKey,
      });

      setClaudeTestResult({
        success: response.data.success,
        message: response.data.message,
      });
    } catch (error) {
      setClaudeTestResult({
        success: false,
        message: error.message || translate('Connection test failed'),
      });
    } finally {
      setTestingClaude(false);
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
                'Configure your AI API keys to enable AI Assistant features throughout the system. You need at least one API key (OpenAI, Gemini, or Claude) to use AI features.'
              )}
              <br />
              {translate(
                'Your API keys are stored securely and used only for your AI interactions.'
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
            'Enable or disable AI Assistant features. When disabled, AI features will not be available.'
          )}
        >
          <Switch checkedChildren={<RobotOutlined />} unCheckedChildren={<RobotOutlined />} />
        </Form.Item>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>{translate('OpenAI Configuration')}</Title>

          <Form.Item
            label={translate('OpenAI API Key')}
            name="openai_api_key"
            extra={translate('Get your API key from https://platform.openai.com/api-keys')}
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
              <Option value="gpt-4">GPT-4 {translate('(More Powerful, Higher Cost)')}</Option>
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

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>{translate('Google Gemini Configuration')}</Title>

          <Form.Item
            label={translate('Gemini API Key')}
            name="gemini_api_key"
            extra={translate('Get your API key from https://aistudio.google.com/app/apikey')}
          >
            <Input.Password
              placeholder={translate('Enter your Gemini API key (AIza...)')}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="dashed" onClick={handleTestGemini} loading={testingGemini}>
                {translate('Test API Key')}
              </Button>
              {geminiTestResult && (
                <Alert
                  message={
                    geminiTestResult.success
                      ? translate('✓ API Key Valid')
                      : translate('✗ API Key Invalid')
                  }
                  description={geminiTestResult.message}
                  type={geminiTestResult.success ? 'success' : 'error'}
                  showIcon
                />
              )}
            </Space>
          </Form.Item>
        </Space>

        <Divider />

        <Space direction="vertical" style={{ width: '100%' }}>
          <Title level={5}>{translate('Anthropic Claude Configuration')}</Title>

          <Form.Item
            label={translate('Claude API Key')}
            name="claude_api_key"
            extra={translate('Get your API key from https://console.anthropic.com/settings/keys')}
          >
            <Input.Password
              placeholder={translate('Enter your Claude API key (sk-ant-...)')}
              prefix={<KeyOutlined />}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="dashed" onClick={handleTestClaude} loading={testingClaude}>
                {translate('Test API Key')}
              </Button>
              {claudeTestResult && (
                <Alert
                  message={
                    claudeTestResult.success
                      ? translate('✓ API Key Valid')
                      : translate('✗ API Key Invalid')
                  }
                  description={claudeTestResult.message}
                  type={claudeTestResult.success ? 'success' : 'error'}
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
            <li>
              {translate(
                'AI conversations are not stored on OpenAI servers beyond their retention policy'
              )}
            </li>
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
