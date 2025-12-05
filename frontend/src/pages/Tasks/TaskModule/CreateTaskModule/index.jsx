import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  Upload,
  message,
  Space,
  Tag,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';
import axios from 'axios';
import { API_BASE_URL } from '@/config/serverApiConfig';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateTaskModule = ({ initialValues = null, isUpdateForm = false, onSave, onCancel }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Function to fetch users from API
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = window.localStorage.getItem('auth_token');
      const response = await axios.get(`${API_BASE_URL}admin/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.result) {
        setUsers(response.data.result);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error(translate('Failed to load users'));
    } finally {
      setLoadingUsers(false);
    }
  };

  // Set form values when initialValues changes or in update mode
  useEffect(() => {
    if (initialValues) {
      try {
        // Convert dates to dayjs objects for the form
        const formattedValues = {
          ...initialValues,
          deadline: initialValues.deadline ? dayjs(initialValues.deadline) : null,
          assignedTo: initialValues.assignedTo?._id || initialValues.assignedTo,
        };

        form.setFieldsValue(formattedValues);

        // Set file list if attachments exist
        if (initialValues.attachments && initialValues.attachments.length > 0) {
          setFileList(
            initialValues.attachments.map((file, index) => ({
              uid: `-${index}`,
              name: file.name,
              status: 'done',
              url: file.url,
              size: file.size,
              type: file.type,
            }))
          );
        }
      } catch (error) {
        console.error('Error setting form values:', error);
      }
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Format values before submission
      const formattedValues = {
        ...values,
        deadline: values.deadline ? values.deadline.toISOString() : null,
        attachments: fileList.map((file) => ({
          name: file.name,
          url: file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : ''),
          size: file.size,
          type: file.type,
        })),
      };

      if (onSave) {
        await onSave(formattedValues, isUpdateForm ? initialValues?._id || id : null);
      }

      // Redirect back to tasks list if not in a modal context
      if (!onCancel) {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      // Error message is handled by the parent component
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/tasks');
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false;
    },
    fileList,
  };

  return (
    <Card style={{ borderRadius: '12px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          {isUpdateForm ? translate('Update Task') : translate('Create Task')}
        </Title>

        <Space>
          <Button icon={<CloseOutlined />} onClick={handleCancel}>
            {translate('Cancel')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            {isUpdateForm ? translate('Update') : translate('Create')}
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '0 0 24px 0' }} />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'pending',
          priority: 'medium',
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Form.Item
              name="title"
              label={translate('Title')}
              rules={[{ required: true, message: translate('Please enter task title') }]}
            >
              <Input placeholder={translate('Enter task title')} />
            </Form.Item>

            <Form.Item name="description" label={translate('Description')}>
              <TextArea placeholder={translate('Enter task description')} rows={4} />
            </Form.Item>

            <Form.Item name="attachments" label={translate('Attachments')}>
              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{translate('Click or drag files to upload')}</p>
                <p className="ant-upload-hint">
                  {translate('Support for documents, images, etc.')}
                </p>
              </Upload.Dragger>
            </Form.Item>
          </Col>

          <Col xs={24} lg={8}>
            <Card size="small" title={translate('Task Details')} style={{ marginBottom: '24px' }}>
              <Form.Item
                name="status"
                label={translate('Status')}
                rules={[{ required: true, message: translate('Please select status') }]}
              >
                <Select placeholder={translate('Select status')}>
                  <Option value="pending">{translate('Pending')}</Option>
                  <Option value="assigned">{translate('Assigned')}</Option>
                  <Option value="in_progress">{translate('In Progress')}</Option>
                  <Option value="completed">{translate('Completed')}</Option>
                  <Option value="cancelled">{translate('Cancelled')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label={translate('Priority')}
                rules={[{ required: true, message: translate('Please select priority') }]}
              >
                <Select placeholder={translate('Select priority')}>
                  <Option value="low">{translate('Low')}</Option>
                  <Option value="medium">{translate('Medium')}</Option>
                  <Option value="high">{translate('High')}</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="deadline"
                label={translate('Deadline')}
                rules={[{ required: true, message: translate('Please select deadline') }]}
              >
                <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>

              <Form.Item
                name="assignedTo"
                label={translate('Assigned To')}
                rules={[{ required: true, message: translate('Please select assignee') }]}
              >
                <Select
                  placeholder={translate('Select assignee')}
                  showSearch
                  optionFilterProp="children"
                  loading={loadingUsers}
                  filterOption={(input, option) =>
                    (option?.children?.toLowerCase() ?? '').includes(input.toLowerCase())
                  }
                >
                  {users.map((user) => (
                    <Option key={user._id} value={user._id}>
                      {user.name || user.email}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            <Card
              size="small"
              title={translate('Additional Info')}
              style={{ marginBottom: '24px' }}
            >
              <Form.Item name="tags" label={translate('Tags')}>
                <Select
                  mode="tags"
                  style={{ width: '100%' }}
                  placeholder={translate('Enter tags')}
                  tokenSeparators={[',']}
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default CreateTaskModule;
