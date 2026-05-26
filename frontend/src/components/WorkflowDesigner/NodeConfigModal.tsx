import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Switch,
  Typography,
} from '@/components/ui';
import { useEffect } from 'react';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const NodeConfigModal = ({ visible, nodeType, config, onSave, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && config) {
      form.setFieldsValue(config);
    }
  }, [visible, config, form]);

  const handleSave = () => {
    form.validateFields().then((values) => {
      onSave(values);
    });
  };

  const renderTriggerConfig = () => (
    <>
      <Form.Item name="triggerType" label="Trigger Type" rules={[{ required: true }]}>
        <Select placeholder="Select trigger type">
          <Option value="manual">Manual</Option>
          <Option value="webhook">Webhook</Option>
          <Option value="schedule">Schedule</Option>
          <Option value="email">Email</Option>
          <Option value="file">File</Option>
        </Select>
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={3} placeholder="Describe what triggers this workflow" />
      </Form.Item>

      <Form.Item name="enabled" label="Enabled" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  const renderHttpRequestConfig = () => (
    <>
      <Form.Item name="method" label="HTTP Method" rules={[{ required: true }]}>
        <Select placeholder="Select HTTP method">
          <Option value="GET">GET</Option>
          <Option value="POST">POST</Option>
          <Option value="PUT">PUT</Option>
          <Option value="DELETE">DELETE</Option>
          <Option value="PATCH">PATCH</Option>
        </Select>
      </Form.Item>

      <Form.Item name="url" label="URL" rules={[{ required: true, type: 'url' }]}>
        <Input placeholder="https://api.example.com/endpoint" />
      </Form.Item>

      <Form.Item name="timeout" label="Timeout (seconds)">
        <InputNumber min={1} max={300} placeholder="30" />
      </Form.Item>

      <Title level={5}>Headers</Title>
      <Form.List name="headers">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }) => (
              <Row key={key} gutter={8} align="middle">
                <Col span={10}>
                  <Form.Item
                    {...restField}
                    name={[name, 'key']}
                    rules={[{ required: true, message: 'Header name required' }]}
                  >
                    <Input placeholder="Header name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    {...restField}
                    name={[name, 'value']}
                    rules={[{ required: true, message: 'Header value required' }]}
                  >
                    <Input placeholder="Header value" />
                  </Form.Item>
                </Col>
                <Col span={2}>
                  <MinusCircleOutlined onClick={() => remove(name)} />
                </Col>
              </Row>
            ))}
            <Form.Item>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Header
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>

      <Form.Item name="body" label="Request Body">
        <TextArea rows={4} placeholder="JSON body for POST/PUT requests" />
      </Form.Item>
    </>
  );

  const renderConditionConfig = () => (
    <>
      <Form.Item name="type" label="Condition Type" rules={[{ required: true }]}>
        <Select placeholder="Select condition type">
          <Option value="field">Field Comparison</Option>
          <Option value="expression">Custom Expression</Option>
          <Option value="exists">Field Exists</Option>
        </Select>
      </Form.Item>

      <Form.Item name="field" label="Field Path" rules={[{ required: true }]}>
        <Input placeholder="e.g., data.user.age" />
      </Form.Item>

      <Form.Item name="operator" label="Operator" rules={[{ required: true }]}>
        <Select placeholder="Select operator">
          <Option value="equals">Equals</Option>
          <Option value="not_equals">Not Equals</Option>
          <Option value="greater_than">Greater Than</Option>
          <Option value="less_than">Less Than</Option>
          <Option value="contains">Contains</Option>
          <Option value="starts_with">Starts With</Option>
          <Option value="ends_with">Ends With</Option>
          <Option value="is_empty">Is Empty</Option>
          <Option value="is_not_empty">Is Not Empty</Option>
        </Select>
      </Form.Item>

      <Form.Item name="value" label="Comparison Value">
        <Input placeholder="Value to compare against" />
      </Form.Item>

      <Form.Item name="caseSensitive" label="Case Sensitive" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  const renderEmailConfig = () => (
    <>
      <Form.Item name="to" label="To" rules={[{ required: true, type: 'email' }]}>
        <Input placeholder="recipient@example.com" />
      </Form.Item>

      <Form.Item name="cc" label="CC">
        <Input placeholder="cc@example.com (optional)" />
      </Form.Item>

      <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
        <Input placeholder="Email subject" />
      </Form.Item>

      <Form.Item name="bodyType" label="Email Type">
        <Select defaultValue="html">
          <Option value="html">HTML</Option>
          <Option value="text">Plain Text</Option>
        </Select>
      </Form.Item>

      <Form.Item name="body" label="Email Body" rules={[{ required: true }]}>
        <TextArea rows={6} placeholder="Email content" />
      </Form.Item>

      <Form.Item name="attachments" label="Attachments">
        <Input placeholder="File paths (comma separated)" />
      </Form.Item>
    </>
  );

  const renderDelayConfig = () => (
    <>
      <Form.Item name="amount" label="Delay Amount" rules={[{ required: true }]}>
        <InputNumber min={1} placeholder="1" style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="unit" label="Time Unit" rules={[{ required: true }]}>
        <Select placeholder="Select time unit">
          <Option value="seconds">Seconds</Option>
          <Option value="minutes">Minutes</Option>
          <Option value="hours">Hours</Option>
          <Option value="days">Days</Option>
        </Select>
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={2} placeholder="Why is this delay needed?" />
      </Form.Item>
    </>
  );

  const renderDatabaseConfig = () => (
    <>
      <Form.Item name="operation" label="Operation" rules={[{ required: true }]}>
        <Select placeholder="Select database operation">
          <Option value="select">SELECT</Option>
          <Option value="insert">INSERT</Option>
          <Option value="update">UPDATE</Option>
          <Option value="delete">DELETE</Option>
          <Option value="custom">Custom Query</Option>
        </Select>
      </Form.Item>

      <Form.Item name="table" label="Table" rules={[{ required: true }]}>
        <Input placeholder="Table name" />
      </Form.Item>

      <Form.Item name="query" label="SQL Query">
        <TextArea rows={4} placeholder="Custom SQL query (optional)" />
      </Form.Item>

      <Form.Item name="connection" label="Database Connection">
        <Select placeholder="Select database connection">
          <Option value="default">Default Connection</Option>
          <Option value="custom">Custom Connection</Option>
        </Select>
      </Form.Item>
    </>
  );

  const renderDataTransformConfig = () => (
    <>
      <Form.Item name="mode" label="Transform Mode" rules={[{ required: true }]}>
        <Select placeholder="Select transform mode">
          <Option value="map">Map Fields</Option>
          <Option value="filter">Filter Data</Option>
          <Option value="sort">Sort Data</Option>
          <Option value="aggregate">Aggregate Data</Option>
          <Option value="custom">Custom Script</Option>
        </Select>
      </Form.Item>

      <Form.Item name="script" label="Transformation Script">
        <TextArea rows={6} placeholder="JavaScript transformation code" />
      </Form.Item>

      <Form.Item name="outputFormat" label="Output Format">
        <Select defaultValue="json">
          <Option value="json">JSON</Option>
          <Option value="xml">XML</Option>
          <Option value="csv">CSV</Option>
        </Select>
      </Form.Item>
    </>
  );

  const renderLoopConfig = () => (
    <>
      <Form.Item name="mode" label="Loop Mode" rules={[{ required: true }]}>
        <Select placeholder="Select loop mode">
          <Option value="count">Fixed Count</Option>
          <Option value="array">Iterate Array</Option>
          <Option value="condition">While Condition</Option>
        </Select>
      </Form.Item>

      <Form.Item name="count" label="Count" dependencies={['mode']}>
        <InputNumber min={1} max={1000} placeholder="Number of iterations" />
      </Form.Item>

      <Form.Item name="field" label="Array Field" dependencies={['mode']}>
        <Input placeholder="Field containing array to iterate" />
      </Form.Item>

      <Form.Item name="maxIterations" label="Max Iterations">
        <InputNumber min={1} max={10000} placeholder="Safety limit" />
      </Form.Item>
    </>
  );

  const renderDefaultConfig = () => (
    <>
      <Form.Item name="name" label="Node Name">
        <Input placeholder="Custom node name" />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={3} placeholder="Describe what this node does" />
      </Form.Item>

      <Form.Item name="enabled" label="Enabled" valuePropName="checked">
        <Switch defaultChecked />
      </Form.Item>
    </>
  );

  const renderConfigFields = () => {
    switch (nodeType) {
      case 'trigger':
        return renderTriggerConfig();
      case 'httpRequest':
        return renderHttpRequestConfig();
      case 'condition':
        return renderConditionConfig();
      case 'email':
        return renderEmailConfig();
      case 'delay':
        return renderDelayConfig();
      case 'database':
        return renderDatabaseConfig();
      case 'dataTransform':
        return renderDataTransformConfig();
      case 'loop':
        return renderLoopConfig();
      default:
        return renderDefaultConfig();
    }
  };

  return (
    <Modal
      title={`Configure ${nodeType} Node`}
      open={visible}
      onOk={handleSave}
      onCancel={onCancel}
      width={600}
      okText="Save"
      cancelText="Cancel"
    >
      <Form form={form} layout="vertical">
        {renderConfigFields()}
      </Form>
    </Modal>
  );
};

export default NodeConfigModal;
