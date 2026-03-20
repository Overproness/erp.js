import apolloClient from '@/graphql/client';
import { getCreateMutation, getUpdateMutation } from '@/graphql/operations/crudFactory';
import {
  BellOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Divider, Form, Input, Row, Select, Switch, message } from 'antd';
import { useEffect, useState } from 'react';

const { TextArea } = Input;
const { Option } = Select;

export default function BusinessProcessForm({ current = null, onSuccess }) {
  const [form] = Form.useForm();
  const [triggerType, setTriggerType] = useState('manual');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (current) {
      form.setFieldsValue(current);
      if (current.triggers?.scheduled?.enabled) {
        setTriggerType('scheduled');
      } else if (current.triggers?.eventBased?.enabled) {
        setTriggerType('eventBased');
      }
    }
  }, [current, form]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Generate unique IDs for steps that don't have them
      if (values.steps && values.steps.length > 0) {
        values.steps = values.steps.map((step, index) => ({
          ...step,
          id: step.id || `step-${Date.now()}-${index}`,
        }));
      }

      let response;
      if (current) {
        const { data } = await apolloClient.mutate({
          mutation: getUpdateMutation('businessProcess'),
          variables: { id: current._id, input: values },
        });
        response = data.businessProcessUpdate;
      } else {
        const { data } = await apolloClient.mutate({
          mutation: getCreateMutation('businessProcess'),
          variables: { input: values },
        });
        response = data.businessProcessCreate;
      }

      if (response.success) {
        message.success(current ? 'Process updated successfully' : 'Process created successfully');
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      message.error(error.message || 'Failed to save process');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        category: 'custom',
        status: 'draft',
        version: 1,
        triggers: {
          manual: true,
        },
        steps: [],
        sla: {
          enabled: false,
          urgency: 'medium',
        },
        integrations: {
          appointments: { enabled: false },
          tasks: { enabled: false },
          workflows: { enabled: false },
        },
      }}
    >
      <Row gutter={16}>
        {/* Basic Information */}
        <Col span={24}>
          <h3>
            <SettingOutlined /> Basic Information
          </h3>
        </Col>

        <Col span={16}>
          <Form.Item
            label="Process Name"
            name="name"
            rules={[{ required: true, message: 'Please enter process name' }]}
          >
            <Input placeholder="e.g., Client Onboarding, Quote Approval" />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Category" name="category" rules={[{ required: true }]}>
            <Select>
              <Option value="sales">Sales</Option>
              <Option value="marketing">Marketing</Option>
              <Option value="support">Support</Option>
              <Option value="operations">Operations</Option>
              <Option value="hr">HR</Option>
              <Option value="finance">Finance</Option>
              <Option value="project-management">Project Management</Option>
              <Option value="onboarding">Onboarding</Option>
              <Option value="custom">Custom</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Describe the purpose and workflow of this process" />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Status" name="status">
            <Select>
              <Option value="draft">Draft</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="archived">Archived</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item label="Version" name="version">
            <Input disabled placeholder="1" />
          </Form.Item>
        </Col>

        {/* Process Steps */}
        <Col span={24}>
          <Divider />
          <h3>Process Steps</h3>
        </Col>

        <Col span={24}>
          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card
                    key={key}
                    size="small"
                    style={{ marginBottom: 16 }}
                    extra={
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                    }
                  >
                    <Row gutter={8}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="Step Name"
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <Input placeholder="e.g., Review Documents" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'type']}
                          label="Type"
                          rules={[{ required: true }]}
                        >
                          <Select>
                            <Option value="manual">Manual</Option>
                            <Option value="automated">Automated</Option>
                            <Option value="approval">Approval</Option>
                            <Option value="notification">Notification</Option>
                            <Option value="condition">Condition</Option>
                            <Option value="delay">Delay</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'order']}
                          label="Order"
                          rules={[{ required: true }]}
                        >
                          <Input type="number" placeholder="1, 2, 3..." />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item {...restField} name={[name, 'description']} label="Description">
                          <TextArea rows={2} placeholder="Step details" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Process Step
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Col>

        {/* Triggers */}
        <Col span={24}>
          <Divider />
          <h3>Triggers</h3>
        </Col>

        <Col span={24}>
          <Form.Item label="Trigger Type">
            <Select value={triggerType} onChange={setTriggerType}>
              <Option value="manual">Manual Execution</Option>
              <Option value="scheduled">Scheduled (Cron)</Option>
              <Option value="eventBased">Event-Based</Option>
            </Select>
          </Form.Item>
        </Col>

        {triggerType === 'scheduled' && (
          <Col span={24}>
            <Form.Item
              label="Cron Expression"
              name={['triggers', 'scheduled', 'cron']}
              extra="Examples: '0 9 * * 1-5' (Weekdays at 9 AM), '0 0 * * *' (Daily at midnight)"
            >
              <Input placeholder="0 9 * * 1-5" />
            </Form.Item>
          </Col>
        )}

        {triggerType === 'eventBased' && (
          <Col span={24}>
            <Form.Item label="Trigger Events" name={['triggers', 'eventBased', 'events']}>
              <Select mode="multiple">
                <Option value="appointment_created">Appointment Created</Option>
                <Option value="appointment_completed">Appointment Completed</Option>
                <Option value="task_completed">Task Completed</Option>
                <Option value="lead_created">Lead Created</Option>
                <Option value="client_created">Client Created</Option>
                <Option value="quote_sent">Quote Sent</Option>
                <Option value="invoice_paid">Invoice Paid</Option>
              </Select>
            </Form.Item>
          </Col>
        )}

        {/* SLA Settings */}
        <Col span={24}>
          <Divider />
          <h3>SLA & Priority</h3>
        </Col>

        <Col span={8}>
          <Form.Item label="Enable SLA" name={['sla', 'enabled']} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Target Duration (hours)" name={['sla', 'targetDuration']}>
            <Input type="number" placeholder="24" />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Urgency" name={['sla', 'urgency']}>
            <Select>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="critical">Critical</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Integrations */}
        <Col span={24}>
          <Divider />
          <h3>Integrations</h3>
        </Col>

        <Col span={8}>
          <Form.Item
            label="Create Appointments"
            name={['integrations', 'appointments', 'enabled']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label="Create Tasks"
            name={['integrations', 'tasks', 'enabled']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label="Trigger Workflows"
            name={['integrations', 'workflows', 'enabled']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        {/* Notifications */}
        <Col span={24}>
          <Divider />
          <h3>
            <BellOutlined /> Notifications
          </h3>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Notify on Start"
            name={['notifications', 'onStart', 'enabled']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        <Col span={12}>
          <Form.Item
            label="Notify on Complete"
            name={['notifications', 'onComplete', 'enabled']}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>

        {/* Tags */}
        <Col span={24}>
          <Divider />
        </Col>

        <Col span={24}>
          <Form.Item label="Tags" name="tags">
            <Select mode="tags" placeholder="Add tags (press enter)" style={{ width: '100%' }} />
          </Form.Item>
        </Col>

        {/* Submit Button */}
        <Col span={24}>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
              block
            >
              {current ? 'Update Process' : 'Create Process'}
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
}
