import React, { useState } from 'react';
import { 
  Form, 
  Select, 
  Input, 
  Button, 
  Space, 
  Divider, 
  InputNumber,
  Card,
  Tag,
  Typography
} from '@/components/ui';
import { PlusOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

const { Option } = Select;
const { Text } = Typography;

const AudienceRulesBuilder = ({ rules, onChange }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [ruleType, setRuleType] = useState('demographic');
  
  // Rule type options
  const ruleTypes = [
    { value: 'demographic', label: translate('Demographic') },
    { value: 'behavioral', label: translate('Behavioral') },
    { value: 'interests', label: translate('Interests') },
    { value: 'custom', label: translate('Custom Attribute') }
  ];

  // Demographic field options
  const demographicFields = [
    { value: 'age', label: translate('Age') },
    { value: 'gender', label: translate('Gender') },
    { value: 'location', label: translate('Location') },
    { value: 'language', label: translate('Language') },
    { value: 'education', label: translate('Education') },
    { value: 'income', label: translate('Income Level') }
  ];

  // Behavioral field options
  const behavioralFields = [
    { value: 'website_visit', label: translate('Visited Website') },
    { value: 'product_view', label: translate('Viewed Product') },
    { value: 'add_to_cart', label: translate('Added to Cart') },
    { value: 'purchase', label: translate('Made Purchase') },
    { value: 'email_open', label: translate('Opened Email') },
    { value: 'email_click', label: translate('Clicked Email Link') },
    { value: 'app_install', label: translate('Installed App') }
  ];

  // Interest categories
  const interestCategories = [
    { value: 'technology', label: translate('Technology') },
    { value: 'fashion', label: translate('Fashion') },
    { value: 'travel', label: translate('Travel') },
    { value: 'food', label: translate('Food & Dining') },
    { value: 'fitness', label: translate('Fitness') },
    { value: 'finance', label: translate('Finance') },
    { value: 'entertainment', label: translate('Entertainment') }
  ];

  // Operators based on field type
  const getOperators = (fieldType) => {
    switch (fieldType) {
      case 'age':
      case 'income':
        return [
          { value: 'equals', label: translate('Equals') },
          { value: 'greater_than', label: translate('Greater than') },
          { value: 'less_than', label: translate('Less than') },
          { value: 'between', label: translate('Between') }
        ];
      case 'gender':
        return [
          { value: 'equals', label: translate('Equals') }
        ];
      case 'location':
      case 'language':
      case 'education':
        return [
          { value: 'equals', label: translate('Equals') },
          { value: 'contains', label: translate('Contains') },
          { value: 'not_equals', label: translate('Does not equal') }
        ];
      default:
        return [
          { value: 'equals', label: translate('Equals') },
          { value: 'not_equals', label: translate('Does not equal') }
        ];
    }
  };

  // Timeframe options for behavioral rules
  const timeframes = [
    { value: '7', label: translate('7 days') },
    { value: '14', label: translate('14 days') },
    { value: '30', label: translate('30 days') },
    { value: '60', label: translate('60 days') },
    { value: '90', label: translate('90 days') }
  ];

  // Handle rule type change
  const handleRuleTypeChange = (value) => {
    setRuleType(value);
    form.resetFields(['field', 'operator', 'value', 'behavior', 'timeframe', 'category', 'name']);
  };

  // Add a new rule
  const handleAddRule = () => {
    form.validateFields().then(values => {
      let newRule;

      switch (ruleType) {
        case 'demographic':
          newRule = {
            type: 'demographic',
            field: values.field,
            operator: values.operator,
            value: values.value
          };
          break;
        case 'behavioral':
          newRule = {
            type: 'behavioral',
            behavior: values.behavior,
            timeframe: values.timeframe
          };
          break;
        case 'interests':
          newRule = {
            type: 'interests',
            category: values.category
          };
          break;
        case 'custom':
          newRule = {
            type: 'custom',
            name: values.name,
            value: values.customValue
          };
          break;
        default:
          return;
      }

      onChange([...rules, newRule]);
      form.resetFields();
    });
  };

  // Remove a rule
  const handleRemoveRule = (index) => {
    const newRules = [...rules];
    newRules.splice(index, 1);
    onChange(newRules);
  };

  // Render form fields based on selected rule type
  const renderRuleFields = () => {
    switch (ruleType) {
      case 'demographic':
        const selectedField = form.getFieldValue('field');
        const operators = getOperators(selectedField);
        
        return (
          <>
            <Form.Item
              name="field"
              label={translate('Field')}
              rules={[{ required: true, message: translate('Please select a field') }]}
            >
              <Select placeholder={translate('Select field')} onChange={() => form.setFieldsValue({ operator: undefined, value: undefined })}>
                {demographicFields.map(field => (
                  <Option key={field.value} value={field.value}>{field.label}</Option>
                ))}
              </Select>
            </Form.Item>
            
            {selectedField && (
              <Form.Item
                name="operator"
                label={translate('Operator')}
                rules={[{ required: true, message: translate('Please select an operator') }]}
              >
                <Select placeholder={translate('Select operator')}>
                  {operators.map(op => (
                    <Option key={op.value} value={op.value}>{op.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            
            {selectedField && (
              <Form.Item
                name="value"
                label={translate('Value')}
                rules={[{ required: true, message: translate('Please enter a value') }]}
              >
                {selectedField === 'age' || selectedField === 'income' ? (
                  <InputNumber placeholder={translate('Enter value')} style={{ width: '100%' }} />
                ) : selectedField === 'gender' ? (
                  <Select placeholder={translate('Select gender')}>
                    <Option value="male">{translate('Male')}</Option>
                    <Option value="female">{translate('Female')}</Option>
                    <Option value="other">{translate('Other')}</Option>
                  </Select>
                ) : (
                  <Input placeholder={translate('Enter value')} />
                )}
              </Form.Item>
            )}
          </>
        );
        
      case 'behavioral':
        return (
          <>
            <Form.Item
              name="behavior"
              label={translate('Behavior')}
              rules={[{ required: true, message: translate('Please select a behavior') }]}
            >
              <Select placeholder={translate('Select behavior')}>
                {behavioralFields.map(field => (
                  <Option key={field.value} value={field.value}>{field.label}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="timeframe"
              label={translate('Timeframe')}
              rules={[{ required: true, message: translate('Please select a timeframe') }]}
            >
              <Select placeholder={translate('Select timeframe')}>
                {timeframes.map(time => (
                  <Option key={time.value} value={time.value}>{time.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </>
        );
        
      case 'interests':
        return (
          <Form.Item
            name="category"
            label={translate('Interest Category')}
            rules={[{ required: true, message: translate('Please select an interest category') }]}
          >
            <Select placeholder={translate('Select interest category')}>
              {interestCategories.map(category => (
                <Option key={category.value} value={category.value}>{category.label}</Option>
              ))}
            </Select>
          </Form.Item>
        );
        
      case 'custom':
        return (
          <>
            <Form.Item
              name="name"
              label={translate('Attribute Name')}
              rules={[{ required: true, message: translate('Please enter attribute name') }]}
            >
              <Input placeholder={translate('Enter attribute name')} />
            </Form.Item>
            
            <Form.Item
              name="customValue"
              label={translate('Attribute Value')}
              rules={[{ required: true, message: translate('Please enter attribute value') }]}
            >
              <Input placeholder={translate('Enter attribute value')} />
            </Form.Item>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical">
        <Form.Item
          label={translate('Rule Type')}
          style={{ marginBottom: '16px' }}
        >
          <Select value={ruleType} onChange={handleRuleTypeChange} style={{ width: '100%' }}>
            {ruleTypes.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
        </Form.Item>

        {renderRuleFields()}

        <Form.Item>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddRule}
            block
          >
            {translate('Add Rule')}
          </Button>
        </Form.Item>
      </Form>

      <Divider />

      {/* Display existing rules */}
      <div style={{ marginBottom: '16px' }}>
        <Text strong>{translate('Current Rules:')}</Text>
      </div>

      {rules.length > 0 ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          {rules.map((rule, index) => {
            let ruleDisplay = '';

            switch(rule.type) {
              case 'demographic':
                ruleDisplay = `${demographicFields.find(f => f.value === rule.field)?.label || rule.field} ${rule.operator} ${rule.value}`;
                break;
              case 'behavioral':
                ruleDisplay = `${behavioralFields.find(f => f.value === rule.behavior)?.label || rule.behavior} in last ${rule.timeframe} days`;
                break;
              case 'interests':
                ruleDisplay = `Interested in: ${interestCategories.find(c => c.value === rule.category)?.label || rule.category}`;
                break;
              case 'custom':
                ruleDisplay = `${rule.name}: ${rule.value}`;
                break;
              default:
                ruleDisplay = JSON.stringify(rule);
            }

            return (
              <Card 
                key={index} 
                size="small" 
                style={{ marginBottom: '8px' }}
                extra={
                  <Button 
                    type="text" 
                    danger 
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveRule(index)}
                  />
                }
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Tag color={
                    rule.type === 'demographic' ? 'blue' :
                    rule.type === 'behavioral' ? 'green' :
                    rule.type === 'interests' ? 'purple' : 'orange'
                  }>
                    {translate(rule.type)}
                  </Tag>
                  <span style={{ marginLeft: '8px' }}>{ruleDisplay}</span>
                </div>
              </Card>
            );
          })}
        </Space>
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: '16px' }}>
          {translate('No rules defined yet. Add rules above to target specific audiences.')}
        </div>
      )}

      {rules.length > 1 && (
        <div style={{ marginTop: '16px' }}>
          <Form.Item label={translate('Rule Logic')}>
            <Select defaultValue="all" style={{ width: '100%' }}>
              <Option value="all">{translate('Match ALL rules (AND)')}</Option>
              <Option value="any">{translate('Match ANY rule (OR)')}</Option>
            </Select>
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default AudienceRulesBuilder;
