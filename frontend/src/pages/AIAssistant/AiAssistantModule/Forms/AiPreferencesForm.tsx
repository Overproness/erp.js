import React from 'react';
import { Form, Input, Select, Switch, InputNumber, Card, Divider } from '@/components/ui';
import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;

export default function AiPreferencesForm({ initialValues, isUpdate = false }) {
  const translate = useLanguage();

  return (
    <>
      {/* General Preferences */}
      <Card title={<><UserOutlined /> {translate('General Preferences')}</>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="defaultAssistant"
          label={translate('Default Assistant')}
        >
          <Select placeholder={translate('Select default assistant')}>
            {/* This would be populated with available assistants */}
          </Select>
        </Form.Item>

        <Form.Item
          name="autoSuggestions"
          label={translate('Auto Suggestions')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="notificationSettings"
          label={translate('Notifications')}
          initialValue={['completion', 'errors']}
        >
          <Select
            mode="multiple"
            placeholder={translate('Select notification types')}
          >
            <Option value="completion">{translate('Task Completion')}</Option>
            <Option value="errors">{translate('Errors')}</Option>
            <Option value="suggestions">{translate('New Suggestions')}</Option>
            <Option value="insights">{translate('Business Insights')}</Option>
          </Select>
        </Form.Item>
      </Card>

      {/* Chat Preferences */}
      <Card title={<><SettingOutlined /> {translate('Chat Preferences')}</>} style={{ marginBottom: 16 }}>
        <Form.Item
          name="chatTheme"
          label={translate('Chat Theme')}
          initialValue="light"
        >
          <Select>
            <Option value="light">{translate('Light')}</Option>
            <Option value="dark">{translate('Dark')}</Option>
            <Option value="auto">{translate('Auto')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="messageHistory"
          label={translate('Message History Limit')}
          initialValue={100}
        >
          <InputNumber min={10} max={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="autoSaveConversations"
          label={translate('Auto Save Conversations')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="suggestQuickReplies"
          label={translate('Suggest Quick Replies')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Card>

      {/* Privacy & Security */}
      <Card title={translate('Privacy & Security')} style={{ marginBottom: 16 }}>
        <Form.Item
          name="dataRetention"
          label={translate('Data Retention Period')}
          initialValue="30_days"
        >
          <Select>
            <Option value="7_days">{translate('7 Days')}</Option>
            <Option value="30_days">{translate('30 Days')}</Option>
            <Option value="90_days">{translate('90 Days')}</Option>
            <Option value="1_year">{translate('1 Year')}</Option>
            <Option value="indefinite">{translate('Indefinite')}</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="allowAnalytics"
          label={translate('Allow Usage Analytics')}
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>

        <Form.Item
          name="shareImprovement"
          label={translate('Share Data for Improvement')}
          valuePropName="checked"
          initialValue={false}
        >
          <Switch />
        </Form.Item>
      </Card>
    </>
  );
}
