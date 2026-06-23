import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import { selectAssistantsLoading, selectCurrentAssistant } from '@/redux/ai/aiSelectors';
import { fetchAssistant, updateAssistant } from '@/redux/ai/aiThunks';
import { ArrowLeftOutlined, SaveOutlined } from '@/components/icons';
import { PageHeader } from '@/components/ui';
import { Alert, Button, Form, message, Spin } from '@/components/ui';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import AiAssistantForm from '../Forms/AiAssistantForm';

const UpdateAiAssistantModule = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const [form] = Form.useForm();

  const assistant = useSelector(selectCurrentAssistant);
  const loading = useSelector(selectAssistantsLoading);
  const loadedRef = useRef('');

  useEffect(() => {
    if (id && loadedRef.current !== id) {
      loadedRef.current = id;
      dispatch(fetchAssistant(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (assistant) {
      form.setFieldsValue({
        name: assistant.name,
        description: assistant.description,
        type: assistant.type,
        enabled: assistant.enabled,
        capabilities: assistant.capabilities,
        model: assistant.model,
        systemPrompt: assistant.systemPrompt,
        contextModules: assistant.contextModules,
      });
    }
  }, [assistant, form]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(updateAssistant({ id, data: values })).unwrap();
      message.success(translate('AI Assistant updated successfully'));
      navigate('/ai-assistant');
    } catch (error) {
      message.error(error || translate('Failed to update AI Assistant'));
    }
  };

  if (loading) {
    return (
      <ErpLayout>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '60vh',
          }}
        >
          <Spin size="large" />
        </div>
      </ErpLayout>
    );
  }

  if (!assistant) {
    return (
      <ErpLayout>
        <Alert
          message={translate('Assistant Not Found')}
          description={translate('The requested AI assistant could not be found.')}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/ai-assistant')}>
              {translate('Back to List')}
            </Button>
          }
        />
      </ErpLayout>
    );
  }

  return (
    <ErpLayout>
      <PageHeader
        onBack={() => navigate('/ai-assistant')}
        backIcon={<ArrowLeftOutlined />}
        title={translate('Update AI Assistant')}
        subTitle={`${translate('Edit')} ${assistant.name}`}
        extra={[
          <Button key="cancel" onClick={() => navigate('/ai-assistant')}>
            {translate('Cancel')}
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            {translate('Update Assistant')}
          </Button>,
        ]}
      />

      <div
        style={{ padding: '24px', backgroundColor: '#f5f5f5', minHeight: 'calc(100vh - 112px)' }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <AiAssistantForm initialValues={assistant} isUpdate={true} />
          </Form>
        </div>
      </div>
    </ErpLayout>
  );
};

export default UpdateAiAssistantModule;
