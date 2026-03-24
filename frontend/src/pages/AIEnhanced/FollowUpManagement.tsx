import { DataImportButton } from '@/components/DataEntry';
import apolloClient from '@/graphql/client';
import {
  getCreateMutation,
  getDeleteMutation,
  getListQuery,
} from '@/graphql/operations/crudFactory';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SendOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { TextArea } = Input;
const { Title } = Typography;

/**
 * Follow-Up Management Dashboard
 * Manage automated customer follow-ups
 */
export default function FollowUpManagement() {
  const [loading, setLoading] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    loadFollowUps();
    loadCustomers();
    loadAnalytics();
  }, []);

  const loadFollowUps = async () => {
    setLoading(true);
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('customerFollowUp'),
        fetchPolicy: 'network-only',
      });
      if (data.customerFollowUpList?.success) {
        setFollowUps(data.customerFollowUpList.result || []);
      }
    } catch (error) {
      console.error('Load follow-ups error:', error);
      // Graceful fallback - show empty state instead of error
      setFollowUps([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Analytics are derived from follow-ups data - no separate endpoint needed
      // Will be computed from the loaded follow-ups
    } catch (error) {
      console.error('Load analytics error:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await apolloClient.query({
        query: getListQuery('client'),
        fetchPolicy: 'network-only',
      });
      if (data.clientList?.success) {
        setCustomers(data.clientList.result || []);
      }
    } catch (error) {
      console.error('Load customers error:', error);
    }
  };

  const handleCreateFollowUp = async (values) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getCreateMutation('customerFollowUp'),
        variables: {
          input: {
            customerId: values.customerId,
            type: values.type,
            reason: values.reason,
            scheduledDate: values.scheduledDate.toISOString(),
            subject: values.subject,
            message: values.message,
            priority: values.priority,
          },
        },
      });

      if (data.customerFollowUpCreate?.success) {
        message.success('Follow-up created successfully');
        setCreateModalVisible(false);
        form.resetFields();
        loadFollowUps();
      } else {
        message.error(data.customerFollowUpCreate?.message || 'Failed to create follow-up');
      }
    } catch (error) {
      console.error('Create follow-up error:', error);
      message.error('Failed to create follow-up');
    }
  };

  const handleCancelFollowUp = async (followUpId) => {
    try {
      const { data } = await apolloClient.mutate({
        mutation: getDeleteMutation('customerFollowUp'),
        variables: { id: followUpId },
      });

      if (data.customerFollowUpDelete?.success) {
        message.success('Follow-up cancelled');
        loadFollowUps();
      } else {
        message.error('Failed to cancel follow-up');
      }
    } catch (error) {
      console.error('Cancel follow-up error:', error);
      message.error('Failed to cancel follow-up');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'blue',
      sent: 'cyan',
      delivered: 'green',
      opened: 'purple',
      clicked: 'orange',
      responded: 'success',
      failed: 'red',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getTypeIcon = (type) => {
    const icons = {
      email: <MailOutlined />,
      sms: <SendOutlined />,
      call: <PhoneOutlined />,
      task: <CheckCircleOutlined />,
      notification: <SyncOutlined />,
    };
    return icons[type] || <MailOutlined />;
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (text, record) => text || record.customer?.company || 'Unknown',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag icon={getTypeIcon(type)} color="blue">
          {type?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => reason?.replace(/_/g, ' ').toUpperCase(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const color = priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'default';
        return <Tag color={color}>{priority?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Scheduled',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      render: (date) => dayjs(date).format('MMM D, YYYY h:mm A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'scheduled' && (
            <Tooltip title="Cancel">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleCancelFollowUp(record._id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Title level={2}>
            <CalendarOutlined /> Follow-Up Management
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadFollowUps}>
              Refresh
            </Button>
            <DataImportButton
              moduleName="followUp"
              onImportComplete={(result) => {
                message.success(`Imported ${result.successful || 0} follow-ups successfully`);
                loadFollowUps();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              Create Follow-Up
            </Button>
          </Space>
        </Space>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Follow-Ups"
                value={analytics.total || 0}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Scheduled"
                value={analytics.scheduled || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Success Rate"
                value={analytics.successRate || 0}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Response Rate"
                value={analytics.responseRate || 0}
                suffix="%"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Follow-Ups Table */}
      <Card>
        <Table
          loading={loading}
          dataSource={followUps}
          columns={columns}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} follow-ups`,
          }}
        />
      </Card>

      {/* Create Follow-Up Modal */}
      <Modal
        title="Create Follow-Up"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateFollowUp}>
          <Form.Item
            name="customerId"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select
              showSearch
              placeholder={customers.length === 0 ? 'No customers available' : 'Select customer'}
              disabled={customers.length === 0}
              filterOption={(input, option) =>
                (option?.label?.toLowerCase() || '').includes(input.toLowerCase())
              }
              options={customers.map((customer) => ({
                label: customer.name || customer.company || customer.email,
                value: customer._id,
              }))}
              notFoundContent={
                customers.length === 0 ? 'Please create a customer first' : 'No matching customers'
              }
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select type">
                  <Select.Option value="email">Email</Select.Option>
                  <Select.Option value="sms">SMS</Select.Option>
                  <Select.Option value="call">Call</Select.Option>
                  <Select.Option value="task">Task</Select.Option>
                  <Select.Option value="notification">Notification</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reason"
                label="Reason"
                rules={[{ required: true, message: 'Please select reason' }]}
              >
                <Select placeholder="Select reason">
                  <Select.Option value="quote_follow_up">Quote Follow-up</Select.Option>
                  <Select.Option value="invoice_reminder">Invoice Reminder</Select.Option>
                  <Select.Option value="payment_overdue">Payment Overdue</Select.Option>
                  <Select.Option value="inactive_customer">Inactive Customer</Select.Option>
                  <Select.Option value="feedback_request">Feedback Request</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="scheduledDate"
                label="Scheduled Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" initialValue="normal">
                <Select>
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="normal">Normal</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="subject" label="Subject">
            <Input placeholder="Email subject (for email type)" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <TextArea rows={4} placeholder="Follow-up message" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Follow-Up
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
