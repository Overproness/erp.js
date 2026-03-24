import useLanguage from '@/locale/useLanguage';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function DataRetentionPolicy() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.auth);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const request = (await import('@/request/request')).default;
      const response = await request.get({ entity: 'compliance/retention-policy' });
      if (response && response.result) {
        setPolicies(response.result);
      }
    } catch (error) {
      message.error('Failed to load retention policies');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchPolicies();
  }, []);

  const handleOpenModal = (policy = null) => {
    setEditingPolicy(policy);
    form.resetFields();

    if (policy) {
      form.setFieldsValue({
        dataType: policy.dataType,
        retentionPeriod: policy.retentionPeriod,
        automaticDeletion: policy.automaticDeletion,
        description: policy.description,
        applicableRegions: policy.applicableRegions || [],
        status: policy.status,
      });
    }

    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingPolicy(null);
  };

  const handleSubmit = async (values) => {
    try {
      const request = (await import('@/request/request')).default;
      if (editingPolicy) {
        // Update existing policy
        await request.patch({
          entity: `compliance/retention-policy/${editingPolicy._id}`,
          jsonData: values,
        });
        message.success('Retention policy updated successfully');
      } else {
        // Create new policy
        await request.post({
          entity: 'compliance/retention-policy',
          jsonData: values,
        });
        message.success('Retention policy created successfully');
      }

      setIsModalVisible(false);
      fetchPolicies();
    } catch (error) {
      message.error('Error saving retention policy');
      console.error(error);
    }
  };

  const handleDelete = (policyId) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this retention policy?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const request = (await import('@/request/request')).default;
          await request.delete({
            entity: `compliance/retention-policy/${policyId}`,
          });
          message.success('Retention policy deleted successfully');
          fetchPolicies();
        } catch (error) {
          message.error('Error deleting retention policy');
          console.error(error);
        }
      },
    });
  };

  const columns = [
    {
      title: translate('Data Type'),
      dataIndex: 'dataType',
      key: 'dataType',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: translate('Retention Period'),
      dataIndex: 'retentionPeriod',
      key: 'retentionPeriod',
      render: (days) => `${days} ${days === 1 ? 'day' : 'days'}`,
    },
    {
      title: translate('Auto Deletion'),
      dataIndex: 'automaticDeletion',
      key: 'automaticDeletion',
      render: (autoDeletion) => (
        <Tag color={autoDeletion ? 'green' : 'orange'}>{autoDeletion ? 'Enabled' : 'Disabled'}</Tag>
      ),
    },
    {
      title: translate('Regions'),
      dataIndex: 'applicableRegions',
      key: 'applicableRegions',
      render: (regions) => (
        <>
          {regions && regions.length > 0 ? (
            regions.map((region) => (
              <Tag color="blue" key={region}>
                {region}
              </Tag>
            ))
          ) : (
            <Tag color="default">Global</Tag>
          )}
        </>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'active') color = 'green';
        if (status === 'inactive') color = 'red';
        if (status === 'draft') color = 'orange';

        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: translate('Created By'),
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (user) => user?.name || 'System',
    },
    {
      title: translate('Created'),
      dataIndex: 'created',
      key: 'created',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title={translate('Edit')}>
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleOpenModal(record)}
            />
          </Tooltip>
          <Tooltip title={translate('Delete')}>
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record._id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>
            <SafetyCertificateOutlined /> {translate('Data Retention Policies')}
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            {translate('Add New Policy')}
          </Button>
        </div>

        <Table
          dataSource={policies}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <p style={{ margin: 0 }}>
                <Text strong>Description: </Text>
                {record.description || 'No description provided'}
              </p>
            ),
          }}
        />
      </Space>

      <Modal
        title={
          editingPolicy
            ? `${translate('Edit')} ${translate('Retention Policy')}`
            : `${translate('Create New')} ${translate('Retention Policy')}`
        }
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            dataType: '',
            retentionPeriod: 365,
            automaticDeletion: false,
            description: '',
            applicableRegions: [],
            status: 'active',
          }}
        >
          <Form.Item
            name="dataType"
            label={translate('Data Type')}
            rules={[{ required: true, message: 'Please enter data type' }]}
          >
            <Input placeholder="e.g., Financial Documents, Medical Records" />
          </Form.Item>

          <Form.Item
            name="retentionPeriod"
            label={translate('Retention Period (Days)')}
            rules={[{ required: true, message: 'Please enter retention period' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="automaticDeletion"
            label={translate('Automatic Deletion')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item name="description" label={translate('Description')}>
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item name="applicableRegions" label={translate('Applicable Regions')}>
            <Select mode="multiple" placeholder="Select regions (leave empty for global)">
              <Option value="EU">European Union (EU)</Option>
              <Option value="US">United States (US)</Option>
              <Option value="UK">United Kingdom (UK)</Option>
              <Option value="CA">Canada (CA)</Option>
              <Option value="AU">Australia (AU)</Option>
              <Option value="APAC">Asia Pacific (APAC)</Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label={translate('Status')}>
            <Select>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="draft">Draft</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingPolicy ? translate('Update') : translate('Create')}
              </Button>
              <Button onClick={handleCancel}>{translate('Cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
