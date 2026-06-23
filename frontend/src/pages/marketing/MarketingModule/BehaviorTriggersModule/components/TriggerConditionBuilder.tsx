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
  DatePicker,
  Tooltip,
  message
} from '@/components/ui';
import { PlusOutlined, DeleteOutlined, QuestionCircleOutlined } from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;
const { Text } = Typography;

const TriggerConditionBuilder = ({ conditions, onAdd, onUpdate, onRemove, eventType }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  
  // Condition types based on event type
  const getConditionTypes = () => {
    const baseTypes = [
      { value: 'user_property', label: translate('User Property') },
      { value: 'device', label: translate('Device') },
      { value: 'time', label: translate('Time') },
      { value: 'location', label: translate('Location') }
    ];
    
    // Add specific condition types based on event type
    switch(eventType) {
      case 'page_view':
        return [
          { value: 'page_url', label: translate('Page URL') },
          { value: 'referrer', label: translate('Referrer') },
          ...baseTypes
        ];
      case 'form_submission':
        return [
          { value: 'form_id', label: translate('Form ID') },
          { value: 'form_field', label: translate('Form Field') },
          ...baseTypes
        ];
      case 'button_click':
        return [
          { value: 'button_id', label: translate('Button ID') },
          { value: 'button_text', label: translate('Button Text') },
          { value: 'page_url', label: translate('Page URL') },
          ...baseTypes
        ];
      case 'cart_abandonment':
        return [
          { value: 'cart_value', label: translate('Cart Value') },
          { value: 'product_count', label: translate('Product Count') },
          { value: 'product_category', label: translate('Product Category') },
          ...baseTypes
        ];
      case 'purchase':
        return [
          { value: 'purchase_value', label: translate('Purchase Value') },
          { value: 'product_id', label: translate('Product ID') },
          { value: 'product_category', label: translate('Product Category') },
          ...baseTypes
        ];
      case 'email_open':
      case 'email_click':
        return [
          { value: 'email_id', label: translate('Email ID') },
          { value: 'campaign_id', label: translate('Campaign ID') },
          ...baseTypes
        ];
      case 'custom_event':
        return [
          { value: 'event_name', label: translate('Event Name') },
          { value: 'event_property', label: translate('Event Property') },
          ...baseTypes
        ];
      default:
        return baseTypes;
    }
  };
  
  const conditionTypes = getConditionTypes();

  // Get operators based on condition type
  const getOperators = (conditionType) => {
    switch(conditionType) {
      case 'page_url':
      case 'referrer':
      case 'button_text':
      case 'form_id':
      case 'button_id':
      case 'email_id':
      case 'campaign_id':
      case 'event_name':
        return [
          { value: 'equals', label: translate('Equals') },
          { value: 'contains', label: translate('Contains') },
          { value: 'starts_with', label: translate('Starts with') },
          { value: 'ends_with', label: translate('Ends with') },
          { value: 'matches_regex', label: translate('Matches regex') }
        ];
      case 'cart_value':
      case 'purchase_value':
      case 'product_count':
        return [
          { value: 'equals', label: translate('Equals') },
          { value: 'greater_than', label: translate('Greater than') },
          { value: 'less_than', label: translate('Less than') },
          { value: 'between', label: translate('Between') }
        ];
      case 'time':
        return [
          { value: 'is', label: translate('Is') },
          { value: 'before', label: translate('Before') },
          { value: 'after', label: translate('After') },
          { value: 'between', label: translate('Between') }
        ];
      case 'device':
      case 'location':
        return [
          { value: 'is', label: translate('Is') },
          { value: 'is_not', label: translate('Is not') }
        ];
      default:
        return [
          { value: 'equals', label: translate('Equals') },
          { value: 'not_equals', label: translate('Does not equal') },
          { value: 'contains', label: translate('Contains') },
          { value: 'not_contains', label: translate('Does not contain') }
        ];
    }
  };

  // Get properties based on condition type
  const getProperties = (conditionType) => {
    switch(conditionType) {
      case 'user_property':
        return [
          { value: 'email', label: translate('Email') },
          { value: 'name', label: translate('Name') },
          { value: 'id', label: translate('User ID') },
          { value: 'segment', label: translate('Segment') },
          { value: 'signup_date', label: translate('Signup Date') },
          { value: 'last_login', label: translate('Last Login') }
        ];
      case 'event_property':
        return [
          { value: 'category', label: translate('Category') },
          { value: 'action', label: translate('Action') },
          { value: 'label', label: translate('Label') },
          { value: 'value', label: translate('Value') }
        ];
      case 'form_field':
        return [
          { value: 'name', label: translate('Name') },
          { value: 'email', label: translate('Email') },
          { value: 'phone', label: translate('Phone') },
          { value: 'subject', label: translate('Subject') },
          { value: 'message', label: translate('Message') }
        ];
      default:
        return [];
    }
  };

  // Get values based on condition type
  const getValues = (conditionType) => {
    switch(conditionType) {
      case 'device':
        return [
          { value: 'desktop', label: translate('Desktop') },
          { value: 'mobile', label: translate('Mobile') },
          { value: 'tablet', label: translate('Tablet') }
        ];
      case 'location':
        return [
          { value: 'us', label: translate('United States') },
          { value: 'eu', label: translate('Europe') },
          { value: 'asia', label: translate('Asia') },
          { value: 'other', label: translate('Other') }
        ];
      default:
        return [];
    }
  };

  const [selectedConditionType, setSelectedConditionType] = useState(null);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [conditionLogic, setConditionLogic] = useState('all');

  const operators = getOperators(selectedConditionType);
  const properties = getProperties(selectedConditionType);
  const values = getValues(selectedConditionType);

  const handleConditionTypeChange = (value) => {
    setSelectedConditionType(value);
    setSelectedOperator(null);
    form.setFieldsValue({
      operator: undefined,
      property: undefined,
      value: undefined
    });
  };

  const handleOperatorChange = (value) => {
    setSelectedOperator(value);
  };

  const handleAddCondition = () => {
    if (!eventType) {
      message.warning(translate('Please select an event type first'));
      return;
    }
    
    form.validateFields().then(values => {
      const newCondition = {
        id: Date.now(),
        type: values.type,
        operator: values.operator,
        property: values.property,
        value: values.value,
        ...(values.type === 'time' && values.dateRange ? { dateRange: values.dateRange } : {})
      };
      onAdd(newCondition);
      form.resetFields();
      setSelectedConditionType(null);
      setSelectedOperator(null);
      message.success(translate('Condition added successfully'));
    }).catch(errorInfo => {
      console.log('Validation failed:', errorInfo);
      message.error(translate('Please fill in all required fields'));
    });
  };

  const handleConditionLogicChange = (value) => {
    setConditionLogic(value);
    // In a real implementation, you would save this to the parent component
  };

  const needsPropertyField = ['user_property', 'event_property', 'form_field'].includes(selectedConditionType);
  const hasPresetValues = ['device', 'location'].includes(selectedConditionType);
  const needsDateRange = selectedConditionType === 'time' && selectedOperator === 'between';

  return (
    <div>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={needsPropertyField ? 8 : 12}>
            <Form.Item
              name="type"
              label={translate('Condition Type')}
              rules={[{ required: true, message: translate('Please select condition type') }]}
            >
              <Select 
                placeholder={translate('Select condition type')}
                onChange={handleConditionTypeChange}
                disabled={!eventType}
              >
                {conditionTypes.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {needsPropertyField && (
            <Col span={8}>
              <Form.Item
                name="property"
                label={translate('Property')}
                rules={[{ required: true, message: translate('Please select property') }]}
              >
                <Select placeholder={translate('Select property')}>
                  {properties.map(prop => (
                    <Option key={prop.value} value={prop.value}>{prop.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          )}
          
          <Col span={needsPropertyField ? 8 : 12}>
            <Form.Item
              name="operator"
              label={translate('Operator')}
              rules={[{ required: true, message: translate('Please select operator') }]}
            >
              <Select 
                placeholder={translate('Select operator')}
                onChange={handleOperatorChange}
                disabled={!selectedConditionType}
              >
                {operators.map(op => (
                  <Option key={op.value} value={op.value}>{op.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          {selectedConditionType && !needsDateRange && (
            <Col span={24}>
              <Form.Item
                name="value"
                label={translate('Value')}
                rules={[{ required: true, message: translate('Please enter value') }]}
              >
                {hasPresetValues ? (
                  <Select placeholder={translate('Select value')}>
                    {values.map(val => (
                      <Option key={val.value} value={val.value}>{val.label}</Option>
                    ))}
                  </Select>
                ) : (
                  <Input placeholder={translate('Enter value')} />
                )}
              </Form.Item>
            </Col>
          )}
          
          {needsDateRange && (
            <Col span={24}>
              <Form.Item
                name="dateRange"
                label={translate('Date Range')}
                rules={[{ required: true, message: translate('Please select date range') }]}
              >
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          )}
        </Row>

        <Form.Item>
          <Button 
            type="dashed" 
            icon={<PlusOutlined />} 
            onClick={handleAddCondition}
            disabled={!selectedConditionType || !eventType}
            block
          >
            {translate('Add Condition')}
          </Button>
        </Form.Item>
      </Form>

      {conditions.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>{translate('Condition Logic:')}</Text>
          <div style={{ marginTop: '8px', marginBottom: '16px' }}>
            <Select 
              value={conditionLogic} 
              onChange={handleConditionLogicChange} 
              style={{ width: 200 }}
            >
              <Option value="all">{translate('All conditions must match')}</Option>
              <Option value="any">{translate('Any condition may match')}</Option>
            </Select>
            <Tooltip title={translate('This determines how multiple conditions are evaluated')}>
              <QuestionCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default TriggerConditionBuilder;
