import React, { useState } from 'react';
import { 
  Form, 
  Select, 
  Input, 
  Button, 
  Space, 
  Card, 
  Divider, 
  Row, 
  Col,
  Typography,
  InputNumber,
  Switch,
  Tooltip,
  message
} from '@/components/ui';
import { 
  PlusOutlined, 
  MailOutlined, 
  BellOutlined, 
  TagOutlined, 
  ApiOutlined,
  UserOutlined,
  QuestionCircleOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const TriggerActionBuilder = ({ actions, onAdd, onUpdate, onRemove }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [selectedActionType, setSelectedActionType] = useState(null);
  
  const actionTypes = [
    { value: 'send_email', label: translate('Send Email'), icon: <MailOutlined /> },
    { value: 'send_notification', label: translate('Send Notification'), icon: <BellOutlined /> },
    { value: 'update_property', label: translate('Update Property'), icon: <UserOutlined /> },
    { value: 'add_tag', label: translate('Add Tag'), icon: <TagOutlined /> },
    { value: 'remove_tag', label: translate('Remove Tag'), icon: <TagOutlined /> },
    { value: 'webhook', label: translate('Call Webhook'), icon: <ApiOutlined /> },
    { value: 'add_to_segment', label: translate('Add to Segment'), icon: <UserOutlined /> },
  ];

  // Sample email templates
  const emailTemplates = [
    { value: 'welcome', label: translate('Welcome Email') },
    { value: 'abandoned_cart', label: translate('Abandoned Cart') },
    { value: 'order_confirmation', label: translate('Order Confirmation') },
    { value: 'product_recommendation', label: translate('Product Recommendation') },
    { value: 'feedback_request', label: translate('Feedback Request') },
  ];

  // Sample segments
  const segments = [
    { value: 'new_customers', label: translate('New Customers') },
    { value: 'regular_customers', label: translate('Regular Customers') },
    { value: 'vip_customers', label: translate('VIP Customers') },
    { value: 'inactive', label: translate('Inactive Users') },
  ];

  const handleActionTypeChange = (value) => {
    setSelectedActionType(value);
    form.resetFields(['params']);
  };

  const handleAddAction = () => {
    form.validateFields().then(values => {
      const newAction = {
        id: Date.now(),
        type: values.type,
        ...values.params,
        metadata: {
          addedAt: new Date().toISOString()
        }
      };
      onAdd(newAction);
      form.resetFields();
      setSelectedActionType(null);
      message.success(translate('Action added successfully'));
    }).catch(errorInfo => {
      console.log('Validation failed:', errorInfo);
      message.error(translate('Please fill in all required fields'));
    });
  };

  // Render different parameter fields based on action type
  const renderActionParams = () => {
    switch(selectedActionType) {
      case 'send_email':
        return (
          <>
            <Form.Item
              name={['params', 'template']}
              label={translate('Email Template')}
              rules={[{ required: true, message: translate('Please select an email template') }]}
            >
              <Select placeholder={translate('Select template')}>
                {emailTemplates.map(template => (
                  <Option key={template.value} value={template.value}>{template.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name={['params', 'delay']}
              label={translate('Delay (minutes)')}
              tooltip={translate('Delay before sending the email')}
            >
              <InputNumber min={0} defaultValue={0} />
            </Form.Item>
          </>
        );
        
      case 'send_notification':
        return (
          <>
            <Form.Item
              name={['params', 'message']}
              label={translate('Notification Message')}
              rules={[{ required: true, message: translate('Please enter notification message') }]}
            >
              <TextArea rows={3} placeholder={translate('Enter notification message')} />
            </Form.Item>
            <Form.Item
              name={['params', 'channel']}
              label={translate('Channel')}
            >
              <Select defaultValue="app">
                <Option value="app">{translate('In-app')}</Option>
                <Option value="browser">{translate('Browser')}</Option>
                <Option value="sms">{translate('SMS')}</Option>
              </Select>
            </Form.Item>
          </>
        );
        
      case 'update_property':
        return (
          <>
            <Form.Item
              name={['params', 'property']}
              label={translate('Property')}
              rules={[{ required: true, message: translate('Please enter property name') }]}
            >
              <Input placeholder={translate('Enter property name')} />
            </Form.Item>
            <Form.Item
              name={['params', 'value']}
              label={translate('Value')}
              rules={[{ required: true, message: translate('Please enter value') }]}
            >
              <Input placeholder={translate('Enter value')} />
            </Form.Item>
          </>
        );
        
      case 'add_tag':
      case 'remove_tag':
        return (
          <Form.Item
            name={['params', 'tag']}
            label={translate('Tag')}
            rules={[{ required: true, message: translate('Please enter tag name') }]}
          >
            <Input placeholder={translate('Enter tag name')} />
          </Form.Item>
        );
        
      case 'webhook':
        return (
          <>
            <Form.Item
              name={['params', 'url']}
              label={translate('Webhook URL')}
              rules={[{ required: true, message: translate('Please enter webhook URL') }]}
            >
              <Input placeholder="https://" />
            </Form.Item>
            <Form.Item
              name={['params', 'method']}
              label={translate('HTTP Method')}
              initialValue="POST"
            >
              <Select>
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name={['params', 'includeUserData']}
              label={translate('Include User Data')}
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </>
        );
        
      case 'add_to_segment':
        return (
          <Form.Item
            name={['params', 'segmentId']}
            label={translate('Segment')}
            rules={[{ required: true, message: translate('Please select segment') }]}
          >
            <Select placeholder={translate('Select segment')}>
              {segments.map(segment => (
                <Option key={segment.value} value={segment.value}>{segment.label}</Option>
              ))}
            </Select>
          </Form.Item>
        );
        
      default:
        return null;
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label={
            <span>
              {translate('Action Type')}
              <Tooltip title={translate('Choose what happens when trigger conditions are met')}>
                <QuestionCircleOutlined style={{ marginLeft: 8 }} />
              </Tooltip>
            </span>
          }
          rules={[{ required: true, message: translate('Please select action type') }]}
        >
          <Select 
            placeholder={translate('Select action type')}
            onChange={handleActionTypeChange}
          >
            {actionTypes.map(type => (
              <Option key={type.value} value={type.value}>
                <Space>
                  {type.icon}
                  {type.label}
                </Space>
              </Option>
            ))}
          </Select>
        </Form.Item>
        
        {selectedActionType && renderActionParams()}
        
        <Form.Item>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={handleAddAction}
            disabled={!selectedActionType}
            block
          >
            {translate('Add Action')}
          </Button>
        </Form.Item>
      </Form>

      {actions.length > 0 && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <Text type="secondary">{translate('Note: Actions will execute in the order listed above.')}</Text>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">{translate('Use advanced settings to control execution timing.')}</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriggerActionBuilder;
