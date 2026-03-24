import useLanguage from '@/locale/useLanguage';
import { selectSettingsLoading, selectUserPreferences } from '@/redux/ai/aiSelectors';
import { fetchUserPreferences, updateUserPreferences } from '@/redux/ai/aiThunks';
import { Button, Divider, Form, InputNumber, message, Select, Switch } from 'antd';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Option } = Select;

const AiPreferences = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [form] = Form.useForm();

  const preferences = useSelector(selectUserPreferences);
  const isLoading = useSelector(selectSettingsLoading);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    dispatch(fetchUserPreferences());
  }, [dispatch]);

  useEffect(() => {
    if (preferences) {
      form.setFieldsValue(preferences);
    }
  }, [preferences, form]);

  const handleSubmit = async (values) => {
    try {
      await dispatch(updateUserPreferences(values)).unwrap();
      message.success(translate('Preferences updated successfully'));
    } catch (error) {
      message.error(translate('Failed to update preferences'));
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        autoSuggestions: true,
        contextAware: true,
        learningEnabled: true,
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 1000,
        temperature: 0.7,
      }}
    >
      <Form.Item
        name="autoSuggestions"
        label={translate('Auto Suggestions')}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Form.Item name="contextAware" label={translate('Context Awareness')} valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item
        name="learningEnabled"
        label={translate('Learning Enabled')}
        valuePropName="checked"
      >
        <Switch />
      </Form.Item>

      <Divider />

      <Form.Item name="defaultModel" label={translate('Default Model')}>
        <Select>
          <Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Option>
          <Option value="gpt-4">GPT-4</Option>
          <Option value="gpt-4-turbo">GPT-4 Turbo</Option>
        </Select>
      </Form.Item>

      <Form.Item name="maxTokens" label={translate('Default Max Tokens')}>
        <InputNumber min={100} max={4000} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="temperature" label={translate('Default Temperature')}>
        <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {translate('Save Preferences')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default AiPreferences;
