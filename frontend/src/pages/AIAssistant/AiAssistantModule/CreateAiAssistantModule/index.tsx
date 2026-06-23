import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Form, Button, message } from '@/components/ui';
import { PageHeader } from '@/components/ui';
import { PlusOutlined, ArrowLeftOutlined } from '@/components/icons';
import { ErpLayout } from '@/layout';
import { createAssistant } from '@/redux/ai/aiThunks';
import AiAssistantForm from '../Forms/AiAssistantForm';
import useLanguage from '@/locale/useLanguage';

const CreateAiAssistantModule = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      await dispatch(createAssistant(values)).unwrap();
      message.success(translate('AI Assistant created successfully'));
      navigate('/ai-assistant');
    } catch (error) {
      message.error(error || translate('Failed to create AI Assistant'));
    }
  };

  const defaultSystemPrompts = {
    general: `You are a helpful AI assistant for an ERP/CRM system called "Tech Revisor Automation Suite". 
              You help users manage their business operations including customers, invoices, quotes, payments, documents, and workflows.
              Always provide clear, actionable advice and maintain a professional yet friendly tone.`,
    document: `You are a document analysis specialist for the Tech Revisor ERP system.
               Help users analyze, organize, and manage their business documents.
               Focus on content extraction, compliance checking, and document management best practices.`,
    workflow: `You are a workflow optimization expert for the Tech Revisor ERP system.
               Help users design, improve, and automate their business processes.
               Analyze existing workflows, suggest improvements, identify bottlenecks, and recommend automation opportunities.`,
    analytics: `You are a business intelligence analyst for the Tech Revisor ERP system.
                Help users understand their business data and make data-driven decisions.
                Analyze trends, provide insights, and suggest actionable recommendations.`,
    customer: `You are a customer relationship specialist for the Tech Revisor ERP system.
               Help users manage customer interactions, analyze customer behavior, and improve satisfaction.`,
    financial: `You are a financial advisor for the Tech Revisor ERP system.
                Help users understand their financial data, manage cash flow, and make informed decisions.`,
  };

  const handleTypeChange = (type) => {
    if (defaultSystemPrompts[type]) {
      form.setFieldsValue({
        systemPrompt: defaultSystemPrompts[type],
      });
    }
  };

  return (
    <ErpLayout>
      <PageHeader
        onBack={() => navigate('/ai-assistant')}
        backIcon={<ArrowLeftOutlined />}
        title={translate('Create AI Assistant')}
        subTitle={translate('Set up a new AI assistant for your business needs')}
        extra={[
          <Button key="cancel" onClick={() => navigate('/ai-assistant')}>
            {translate('Cancel')}
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => form.submit()}
          >
            {translate('Create Assistant')}
          </Button>,
        ]}
      />

      <div style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            onValuesChange={(changedValues) => {
              if (changedValues.type) {
                handleTypeChange(changedValues.type);
              }
            }}
            initialValues={{
              enabled: true,
              type: 'general',
              model: {
                provider: 'openai',
                modelName: 'gpt-3.5-turbo',
                parameters: {
                  temperature: 0.7,
                  maxTokens: 1000,
                  topP: 1,
                  frequencyPenalty: 0,
                  presencePenalty: 0,
                },
              },
              capabilities: ['nlp_processing', 'pattern_recognition'],
              contextSize: 4000,
              systemPrompt: defaultSystemPrompts.general,
            }}
          >
            <AiAssistantForm />
          </Form>
        </div>
      </div>
    </ErpLayout>
  );
};

export default CreateAiAssistantModule;
