import useLanguage from '@/locale/useLanguage';
import request from '@/request/request';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
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
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function ConsentManagement() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    try {
      const response = await request.list({ entity: 'user' });
      if (response && response.result) {
        setUsers(response.result);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchConsents = async (userId) => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await request.get({ entity: `compliance/consent/user/${userId}` });
      if (response && response.result) {
        setConsents(response.result);
      } else {
        setConsents([]);
      }
    } catch (error) {
      console.error('Error fetching consent records:', error);
      setConsents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchConsents(selectedUser);
    }
  }, [selectedUser]);

  const handleUserChange = (userId) => {
    setSelectedUser(userId);
  };

  const handleOpenModal = () => {
    form.resetFields();
    if (selectedUser) {
      form.setFieldsValue({
        userId: selectedUser,
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      await request.post({
        entity: 'compliance/consent',
        jsonData: values,
      });

      setIsModalVisible(false);
      fetchConsents(values.userId);
    } catch (error) {
      console.error('Error recording consent:', error);
    }
  };

  const handleUpdateConsent = async (id, consentGiven) => {
    Modal.confirm({
      title: translate('Update Consent Record'),
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to update this consent to "${
        consentGiven ? 'Granted' : 'Denied'
      }"?`,
      okText: translate('Yes'),
      okType: consentGiven ? 'primary' : 'danger',
      cancelText: translate('Cancel'),
      onOk: async () => {
        try {
          await request.patch({
            entity: `compliance/consent/${id}`,
            jsonData: { consentGiven },
          });

          fetchConsents(selectedUser);
        } catch (error) {
          console.error('Error updating consent:', error);
        }
      },
    });
  };

  const columns = [
    {
      title: translate('Purpose'),
      dataIndex: 'purpose',
      key: 'purpose',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: translate('Consent Status'),
      dataIndex: 'consentGiven',
      key: 'consentGiven',
      render: (consentGiven) => (
        <Tag
          icon={consentGiven ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          color={consentGiven ? 'success' : 'error'}
        >
          {consentGiven ? translate('Granted') : translate('Denied')}
        </Tag>
      ),
    },
    {
      title: translate('Data Categories'),
      dataIndex: 'dataCategories',
      key: 'dataCategories',
      render: (categories) => (
        <>
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <Tag color="blue" key={category}>
                {category}
              </Tag>
            ))
          ) : (
            <Text type="secondary">{translate('Not specified')}</Text>
          )}
        </>
      ),
    },
    {
      title: translate('Recorded Date'),
      dataIndex: 'created',
      key: 'created',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: translate('Expiration'),
      dataIndex: 'expiration',
      key: 'expiration',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : translate('Never')),
    },
    {
      title: translate('IP Address'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title={translate('Update to Granted')}>
            <Button
              type="primary"
              ghost
              icon={<CheckCircleOutlined />}
              size="small"
              disabled={record.consentGiven === true}
              onClick={() => handleUpdateConsent(record._id, true)}
            />
          </Tooltip>
          <Tooltip title={translate('Update to Denied')}>
            <Button
              danger
              ghost
              icon={<CloseCircleOutlined />}
              size="small"
              disabled={record.consentGiven === false}
              onClick={() => handleUpdateConsent(record._id, false)}
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
            <FileSearchOutlined /> {translate('Consent Records')}
          </Title>
          <Space>
            <Select
              showSearch
              style={{ width: 300 }}
              placeholder={translate('Select a user')}
              optionFilterProp="children"
              onChange={handleUserChange}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleOpenModal}
              disabled={!selectedUser}
            >
              {translate('Record Consent')}
            </Button>
          </Space>
        </div>

        {selectedUser ? (
          <Table
            dataSource={consents}
            columns={columns}
            rowKey="_id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <UserOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <p>{translate('Please select a user to view consent records')}</p>
          </div>
        )}
      </Space>

      <Modal
        title={translate('Record User Consent')}
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
            consentGiven: true,
          }}
        >
          <Form.Item
            name="userId"
            label={translate('User')}
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select
              showSearch
              placeholder={translate('Select a user')}
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map((user) => (
                <Option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="purpose"
            label={translate('Purpose of Data Processing')}
            rules={[{ required: true, message: 'Please enter the purpose' }]}
          >
            <Select>
              <Option value="Marketing">Marketing Communications</Option>
              <Option value="Analytics">Analytics and Usage Data</Option>
              <Option value="Product Updates">Product Updates and Notifications</Option>
              <Option value="Account Processing">Account Processing</Option>
              <Option value="Third Party Sharing">Third Party Data Sharing</Option>
              <Option value="Research">Research and Development</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="consentGiven"
            label={translate('Consent Status')}
            valuePropName="checked"
          >
            <Switch
              checkedChildren={translate('Granted')}
              unCheckedChildren={translate('Denied')}
            />
          </Form.Item>

          <Form.Item name="dataCategories" label={translate('Data Categories')}>
            <Select mode="multiple" placeholder={translate('Select data categories')}>
              <Option value="Personal Information">Personal Information</Option>
              <Option value="Contact Details">Contact Details</Option>
              <Option value="Device Information">Device Information</Option>
              <Option value="Usage Statistics">Usage Statistics</Option>
              <Option value="Financial Information">Financial Information</Option>
              <Option value="Health Information">Health Information</Option>
              <Option value="Professional Information">Professional Information</Option>
            </Select>
          </Form.Item>

          <Form.Item name="expiration" label={translate('Expiration Date (Optional)')}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="additionalInformation" label={translate('Additional Information')}>
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {translate('Record Consent')}
              </Button>
              <Button onClick={handleCancel}>{translate('Cancel')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
