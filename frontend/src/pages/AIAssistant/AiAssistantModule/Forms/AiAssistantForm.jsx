import React, { useEffect } from 'react';
import { Form, Input, Select, Switch, InputNumber, Divider, Card, Space, Alert } from 'antd';
import { RobotOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { TextArea } = Input;
const { Option } = Select;

const AiAssistantForm = ({ initialValues, isUpdate = false }) => {
  const translate = useLanguage();

  const assistantTypes = [
    { value: 'general', label: translate('General Assistant'), description: translate('Multi-purpose AI assistant') },
    { value: 'document', label: translate('Document Specialist'), description: translate('Document analysis and management') },
    { value: 'workflow', label: translate('Workflow Expert'), description: translate('Process optimization and automation') },
    { value: 'analytics', label: translate('Analytics Specialist'), description: translate('Business intelligence and insights') },
    { value: 'customer', label: translate('Customer Relations'), description: translate('Customer service and relationship management') },
    { value: 'financial', label: translate('Financial Advisor'), description: translate('Financial analysis and advice') },
  ];

  const modelOptions = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { value: 'gpt-4', label: 'GPT-4', description: 'More powerful, higher cost' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Balanced performance and cost' },
  ];

  const capabilityOptions = [
    { value: 'nlp_processing', label: translate('Natural Language Processing') },
    { value: 'pattern_recognition', label: translate('Pattern Recognition') },
    { value: 'predictive_analysis', label: translate('Predictive Analysis') },
    { value: 'document_analysis', label: translate('Document Analysis') },
    { value: 'workflow_optimization', label: translate('Workflow Optimization') },
    { value: 'data_insights', label: translate('Data Insights') },
    { value: 'automation_suggestions', label: translate('Automation Suggestions') },
  ];

  return (
    <>
      {/* Basic Information */}
      <Card title={<><RobotOutlined /> {translate('Basic Information')}</>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="name"
          label={translate('Assistant Name')}
          rules={[{ required: true, message: translate('Please enter assistant name') }]}
        >
          <Input placeholder={translate('Enter assistant name')} />
        </Form.Item>

        <Form.Item
          name="description"
          label={translate('Description')}
        >
          <TextArea 
            rows={3} 
            placeholder={translate('Describe what this assistant will help with')} 
          />
        </Form.Item>

        <Form.Item
          name="type"
          label={translate('Assistant Type')}
          rules={[{ required: true, message: translate('Please select assistant type') }]}
        >
          <Select placeholder={translate('Select assistant type')}>
            {assistantTypes.map(type => (
              <Option key={type.value} value={type.value}>
                <div>
                  <div>{type.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{type.description}</div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="enabled"
          label={translate('Active')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

      {/* Model Configuration */}
      <Card title={<><SettingOutlined /> {translate('Model Configuration')}</>} style={{ marginBottom: 16 }}>
        <Alert
          message={translate('Model Selection')}
          description={translate('Choose the AI model that best fits your needs. GPT-4 provides better results but costs more.')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name={['model', 'provider']}
          label={translate('AI Provider')}
          initialValue="openai"
        >
          <Select disabled>
            <Option value="openai">OpenAI</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name={['model', 'modelName']}
          label={translate('Model')}
          initialValue="gpt-3.5-turbo"
          rules={[{ required: true, message: translate('Please select a model') }]}
        >
          <Select placeholder={translate('Select AI model')}>
            {modelOptions.map(model => (
              <Option key={model.value} value={model.value}>
                <div>
                  <div>{model.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{model.description}</div>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider orientation="left">{translate('Model Parameters')}</Divider>

        <Form.Item
          name={['model', 'parameters', 'temperature']}
          label={translate('Temperature')}
          initialValue={0.7}
          tooltip={translate('Controls randomness. Higher values make output more random.')}
        >
          <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name={['model', 'parameters', 'maxTokens']}
          label={translate('Max Tokens')}
          initialValue={1000}
          tooltip={translate('Maximum length of the response')}
        >
          <InputNumber min={100} max={4000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name={['model', 'parameters', 'topP']}
          label={translate('Top P')}
          initialValue={1}
          tooltip={translate('Controls diversity via nucleus sampling')}
        >
          <InputNumber min={0} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
      </Card>

      {/* Capabilities */}
      <Card title={<><InfoCircleOutlined /> {translate('Capabilities')}</>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="capabilities"
          label={translate('Capabilities')}
          initialValue={['nlp_processing', 'pattern_recognition']}
        >
          <Select
            mode="multiple"
            placeholder={translate('Select capabilities')}
            options={capabilityOptions}
          />
        </Form.Item>

        <Form.Item
          name="contextSize"
          label={translate('Context Window Size')}
          initialValue={4000}
          tooltip={translate('Amount of context the assistant can remember')}
        >
          <InputNumber min={1000} max={8000} style={{ width: '100%' }} />
        </Form.Item>
      </Card>

      {/* System Prompt */}
      <Card title={translate('System Prompt')} style={{ marginBottom: 16 }}>
        <Alert
          message={translate('System Prompt Configuration')}
          description={translate('The system prompt defines how the AI assistant behaves and responds. You can customize it or use the default for the selected type.')}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item
          name="systemPrompt"
          label={translate('System Prompt')}
          rules={[{ required: true, message: translate('Please enter system prompt') }]}
        >
          <TextArea 
            rows={6} 
            placeholder={translate('Enter the system prompt that defines the assistant behavior')}
          />
        </Form.Item>
      </Card>
    </>
  );
};

export default AiAssistantForm;
