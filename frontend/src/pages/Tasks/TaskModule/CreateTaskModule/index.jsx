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
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  BugOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateTaskModule = ({ 
  initialValues = null, 
  isUpdateForm = false,
  onSave,
  onCancel
}) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [debugInfo, setDebugInfo] = useState({});
  
  // Add debug logging
  console.log('CreateTaskModule - props received:', { 
    initialValues, 
    isUpdateForm, 
    hasOnSave: !!onSave,
    hasOnCancel: !!onCancel
  });
  
  // Sample team members for the dropdown - replace with actual data in a real implementation
  const teamMembers = [
    { _id: 'current-user-id', name: 'Current User', email: 'user@example.com' },
    { _id: 'user-002', name: 'Jane Smith', email: 'jane@example.com' },
    { _id: 'user-003', name: 'Robert Johnson', email: 'robert@example.com' }
  ];
  
  // Sample projects for the dropdown - replace with actual data in a real implementation
  const projects = [
    { _id: 'project-001', name: 'Website Revamp' },
    { _id: 'project-002', name: 'Payment System Upgrade' },
    { _id: 'project-003', name: 'Marketing Analytics' }
  ];

  // Set form values when initialValues changes or in update mode
  useEffect(() => {
    if (initialValues) {
      console.log('CreateTaskModule - setting form values from initialValues:', initialValues);
      
      try {
        // Convert dates to dayjs objects for the form
        const formattedValues = {
          ...initialValues,
          deadline: initialValues.deadline ? dayjs(initialValues.deadline) : null,
        };
        
        form.setFieldsValue(formattedValues);
        
        // Set file list if attachments exist
        if (initialValues.attachments && initialValues.attachments.length > 0) {
          setFileList(initialValues.attachments.map((file, index) => ({
            uid: `-${index}`,
            name: file.name,
            status: 'done',
            url: file.url,
            size: file.size,
            type: file.type
          })));
        }
        
        setDebugInfo(prev => ({
          ...prev,
          formValuesSet: true,
          valuesSet: JSON.stringify(formattedValues)
        }));
      } catch (error) {
        console.error('Error setting form values:', error);
        setDebugInfo(prev => ({
          ...prev,
          formValuesError: error.message
        }));
      }
    } else {
      console.log('CreateTaskModule - no initialValues provided');
      setDebugInfo(prev => ({
        ...prev,
        formValuesSet: false
      }));
    }
  }, [initialValues, form]);

  const handleSubmit = async (values) => {
    try {
      console.log('CreateTaskModule - form submitted with values:', values);
      setLoading(true);
      
      // Format values before submission
      const formattedValues = {
        ...values,
        attachments: fileList.map(file => ({
          name: file.name,
          url: file.url || URL.createObjectURL(file.originFileObj),
          size: file.size,
          type: file.type
        })),
      };
      
      setDebugInfo(prev => ({
        ...prev, 
        submittedValues: JSON.stringify(formattedValues)
      }));
      
      if (onSave) {
        await onSave(formattedValues, isUpdateForm ? id : null);
        message.success(isUpdateForm ? translate('Task updated successfully') : translate('Task created successfully'));
      } else {
        console.log('CreateTaskModule - No onSave handler provided, logging values:', formattedValues);
        message.success(isUpdateForm ? translate('Task updated successfully') : translate('Task created successfully'));
      }
      
      // Redirect back to tasks list if not in a modal context
      if (!onCancel) {
        navigate('/tasks');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      message.error(translate('Failed to save task'));
      setDebugInfo(prev => ({
        ...prev,
        saveError: error.message
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    console.log('CreateTaskModule - cancel button clicked');
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
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          {isUpdateForm ? translate('Update Task') : translate('Create Task')}
        </Title>
        
        <Space>
          <Button 
            icon={<CloseOutlined />} 
            onClick={handleCancel}
          >
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
      
      {/* Debug info */}
      {process.env.NODE_ENV !== 'production' && (
        <Alert
          type="info"
          message="Debug Information"
          description={
            <div style={{ maxHeight: '100px', overflow: 'auto' }}>
              <p><strong>isUpdateForm:</strong> {isUpdateForm ? 'Yes' : 'No'}</p>
              <p><strong>initialValues:</strong> {initialValues ? 'Provided' : 'Not provided'}</p>
              {Object.entries(debugInfo).map(([key, value]) => (
                <p key={key}><strong>{key}:</strong> {value ? (typeof value === 'string' ? value.substring(0, 100) + '...' : String(value)) : 'null'}</p>
              ))}
            </div>
          }
          icon={<BugOutlined />}
          closable
          style={{ marginBottom: '16px' }}
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'todo',
          priority: 'medium',
          assignedTo: 'current-user-id'
        }}
      >
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Form.Item
              name="title"
              label={translate('Title')}
              rules={[
                { required: true, message: translate('Please enter task title') }
              ]}
            >
              <Input placeholder={translate('Enter task title')} />
            </Form.Item>
            
            <Form.Item
              name="description"
              label={translate('Description')}
            >
              <TextArea 
                placeholder={translate('Enter task description')} 
                rows={4}
              />
            </Form.Item>
            
            <Form.Item
              name="attachments"
              label={translate('Attachments')}
            >
              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">{translate('Click or drag files to upload')}</p>
                <p className="ant-upload-hint">{translate('Support for documents, images, etc.')}</p>
              </Upload.Dragger>
            </Form.Item>
          </Col>
          
          <Col xs={24} lg={8}>
            <Card size="small" title={translate('Task Details')} style={{ marginBottom: '24px' }}>
              <Form.Item
                name="status"
                label={translate('Status')}
                rules={[
                  { required: true, message: translate('Please select status') }
                ]}
              >
                <Select placeholder={translate('Select status')}>
                  <Option value="todo">{translate('To Do')}</Option>
                  <Option value="in_progress">{translate('In Progress')}</Option>
                  <Option value="completed">{translate('Completed')}</Option>
                  <Option value="cancelled">{translate('Cancelled')}</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="priority"
                label={translate('Priority')}
                rules={[
                  { required: true, message: translate('Please select priority') }
                ]}
              >
                <Select placeholder={translate('Select priority')}>
                  <Option value="low">{translate('Low')}</Option>
                  <Option value="medium">{translate('Medium')}</Option>
                  <Option value="high">{translate('High')}</Option>
                  <Option value="urgent">{translate('Urgent')}</Option>
                </Select>
              </Form.Item>
              
              <Form.Item
                name="deadline"
                label={translate('Deadline')}
                rules={[
                  { required: true, message: translate('Please select deadline') }
                ]}
              >
                <DatePicker style={{ width: '100%' }} showTime format="YYYY-MM-DD HH:mm" />
              </Form.Item>
              
              <Form.Item
                name="assignedTo"
                label={translate('Assigned To')}
                rules={[
                  { required: true, message: translate('Please select assignee') }
                ]}
              >
                <Select 
                  placeholder={translate('Select assignee')}
                  showSearch
                  optionFilterProp="children"
                >
                  {teamMembers.map(member => (
                    <Option key={member._id} value={member._id}>
                      {member.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>
            
            <Card size="small" title={translate('Additional Info')} style={{ marginBottom: '24px' }}>
              <Form.Item
                name="project"
                label={translate('Project')}
              >
                <Select 
                  placeholder={translate('Select project')}
                  showSearch
                  optionFilterProp="children"
                  allowClear
                >
                  {projects.map(project => (
                    <Option key={project._id} value={project._id}>
                      {project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="tags"
                label={translate('Tags')}
              >
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
