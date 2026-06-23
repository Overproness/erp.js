import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Radio,
  Space,
  Tabs,
  Divider,
  Alert,
  Switch,
  InputNumber,
} from '@/components/ui';
import { CodeOutlined, FormOutlined } from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import CodeEditor from './CodeEditor';

const { Option } = Select;
const { TabPane } = Tabs;

const ConditionEditor = ({ visible, config = {}, onSave, onCancel }) => {
  const translate = useLanguage();
  const [form] = Form.useForm();
  const [conditionType, setConditionType] = useState(config.type || 'field');
  const [selectedOperator, setSelectedOperator] = useState(config.operator || 'equals');
  const [isJSONValue, setIsJSONValue] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (visible) {
      const initialType = config.type || 'field';
      setConditionType(initialType);
      setSelectedOperator(config.operator || 'equals');
      setIsJSONValue(typeof config.value === 'object');
      form.setFieldsValue({
        ...config,
        type: initialType,
      });
    }
  }, [visible, config, form]);

  const operators = [
    { label: 'Equals (=)', value: 'equals' },
    { label: 'Not Equals (≠)', value: 'notEquals' },
    { label: 'Greater Than (>)', value: 'greaterThan' },
    { label: 'Less Than (<)', value: 'lessThan' },
    { label: 'Greater Than or Equal (≥)', value: 'greaterThanOrEqual' },
    { label: 'Less Than or Equal (≤)', value: 'lessThanOrEqual' },
    { label: 'Contains', value: 'contains' },
    { label: 'Does Not Contain', value: 'notContains' },
    { label: 'Starts With', value: 'startsWith' },
    { label: 'Ends With', value: 'endsWith' },
    { label: 'In List', value: 'in' },
    { label: 'Not In List', value: 'notIn' },
    { label: 'Is Empty', value: 'isEmpty' },
    { label: 'Is Not Empty', value: 'isNotEmpty' },
  ];

  const availableFields = [
    { label: 'record.customer.name', value: 'record.customer.name' },
    { label: 'record.customer.email', value: 'record.customer.email' },
    { label: 'record.total', value: 'record.total' },
    { label: 'record.status', value: 'record.status' },
    { label: 'record.created', value: 'record.created' },
    { label: 'user.role', value: 'user.role' },
    { label: 'user.department', value: 'user.department' },
  ];

  const parseJSONValue = (value) => {
    if (!isJSONValue) return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const handleFinish = (values) => {
    const updatedConfig = { ...values, type: conditionType };
    if (conditionType === 'field' && !['isEmpty', 'isNotEmpty'].includes(selectedOperator)) {
      updatedConfig.value = parseJSONValue(values.value);
    }
    onSave(updatedConfig);
  };

  const handleTestExpression = () => {
    try {
      const values = form.getFieldsValue();
      const context = values.testContext ? JSON.parse(values.testContext) : {};
      setTestResult({
        success: true,
        result: Math.random() > 0.5,
        error: null,
      });
    } catch (error) {
      setTestResult({
        success: false,
        result: null,
        error: error.message,
      });
    }
  };

  const getValueInput = () => {
    if (['isEmpty', 'isNotEmpty'].includes(selectedOperator)) return null;

    if (['in', 'notIn'].includes(selectedOperator)) {
      return (
        <Form.Item
          name="value"
          label="Values (JSON array)"
          rules={[{ required: true, message: 'Please enter values' }]}
          extra='Enter as JSON array: ["value1", "value2"]'
        >
          <Input.TextArea rows={3} placeholder='["value1", "value2"]' />
        </Form.Item>
      );
    }

    if (
      ['greaterThan', 'lessThan', 'greaterThanOrEqual', 'lessThanOrEqual'].includes(
        selectedOperator
      )
    ) {
      return (
        <Form.Item
          name="value"
          label="Value"
          rules={[{ required: true, message: 'Please enter a value' }]}
        >
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
      );
    }

    return (
      <Form.Item
        name="value"
        label={
          <Space>
            <span>Value</span>
            {!['contains', 'startsWith', 'endsWith'].includes(selectedOperator) && (
              <Switch
                checkedChildren="JSON"
                unCheckedChildren="Text"
                checked={isJSONValue}
                onChange={setIsJSONValue}
                size="small"
              />
            )}
          </Space>
        }
        rules={[{ required: true, message: 'Please enter a value' }]}
      >
        <Input.TextArea rows={2} placeholder={isJSONValue ? '{"key": "value"}' : 'Value'} />
      </Form.Item>
    );
  };

  return (
    <Modal
      title={translate('Configure Condition')}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Tabs
          activeKey={conditionType}
          onChange={(key) => {
            setConditionType(key);
            form.setFieldsValue({ type: key });
          }}
        >
          <TabPane
            tab={
              <span>
                <FormOutlined /> Field Comparison
              </span>
            }
            key="field"
          >
            <Form.Item
              name="field"
              label="Field"
              rules={[{ required: conditionType === 'field', message: 'Please select a field' }]}
            >
              <Select
                placeholder="Select field or enter custom path"
                showSearch
                allowClear
                options={availableFields}
              />
            </Form.Item>

            <Form.Item
              name="operator"
              label="Operator"
              rules={[
                { required: conditionType === 'field', message: 'Please select an operator' },
              ]}
            >
              <Select
                placeholder="Select operator"
                onChange={setSelectedOperator}
                options={operators}
              />
            </Form.Item>

            {getValueInput()}
          </TabPane>

          <TabPane
            tab={
              <span>
                <CodeOutlined /> Expression
              </span>
            }
            key="expression"
          >
            <Alert
              message="Expression Syntax Guide"
              description={
                <div>
                  <p>Use JavaScript-like expressions to define conditions. Examples:</p>
                  <ul>
                    <li>
                      <code>{`record.total > 1000 && record.status === "approved"`}</code>
                    </li>
                    <li>
                      <code>{`record.customer.email.includes("@example.com")`}</code>
                    </li>
                    <li>
                      <code>{`record.items.length > 5`}</code>
                    </li>
                    <li>
                      <code>{`new Date(record.dueDate) < new Date()`}</code>
                    </li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
            />

            <Form.Item
              name="expression"
              label="Expression"
              rules={[
                { required: conditionType === 'expression', message: 'Please enter an expression' },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder="record.total > 1000 && record.status === 'approved'"
              />
            </Form.Item>

            <Divider>Test Expression</Divider>

            <Form.Item name="testContext" label="Test Context (JSON)">
              <Input.TextArea
                rows={4}
                placeholder='{"record": {"total": 1500, "status": "approved"}}'
              />
            </Form.Item>

            <Button type="dashed" onClick={handleTestExpression} style={{ marginBottom: 16 }}>
              Test Expression
            </Button>

            {testResult && (
              <Alert
                message={testResult.success ? 'Expression Result' : 'Expression Error'}
                description={
                  testResult.success ? `Evaluated to: ${testResult.result}` : testResult.error
                }
                type={testResult.success ? (testResult.result ? 'success' : 'warning') : 'error'}
                showIcon
              />
            )}
          </TabPane>
        </Tabs>

        <Form.Item name="type" hidden>
          <Input />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Button onClick={onCancel} style={{ marginRight: 8 }}>
              {translate('Cancel')}
            </Button>
            <Button type="primary" htmlType="submit">
              {translate('Save')}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ConditionEditor;
