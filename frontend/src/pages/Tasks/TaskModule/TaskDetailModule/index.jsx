import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Descriptions,
  Timeline,
  Divider,
  Avatar,
  List,
  Input,
  Form,
  Empty,
  Tooltip,
  Modal,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PaperClipOutlined,
  CalendarOutlined,
  FlagOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FileOutlined,
  TeamOutlined,
  PlusOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const getFileIcon = (fileType) => {
  if (fileType?.includes('pdf')) return <FilePdfOutlined />;
  if (fileType?.includes('image')) return <FileImageOutlined />;
  if (fileType?.includes('text')) return <FileTextOutlined />;
  return <FileOutlined />;
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
    case 'assigned':
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
    case 'in_progress':
      return <ExclamationCircleOutlined style={{ color: '#1890ff' }} />;
    case 'completed':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    default:
      return <ClockCircleOutlined style={{ color: '#faad14' }} />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return '#faad14';
    case 'assigned':
      return '#1890ff';
    case 'in_progress':
      return '#1890ff';
    case 'completed':
      return '#52c41a';
    case 'cancelled':
      return '#ff4d4f';
    case 'pending_approval':
      return '#722ed1';
    case 'delegated':
      return '#13c2c2';
    default:
      return '#faad14';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'pending_approval':
      return 'Pending Approval';
    case 'delegated':
      return 'Delegated';
    default:
      return 'Pending';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'low':
      return '#52c41a';
    case 'medium':
      return '#faad14';
    case 'high':
      return '#ff4d4f';
    default:
      return '#52c41a';
  }
};

// Dummy comments for demonstration
const dummyComments = [
  {
    author: 'Current User',
    avatar: null,
    content: "I've started working on this task. Will update the progress soon.",
    datetime: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    author: 'Jane Smith',
    avatar: null,
    content:
      'The client requested some changes to the initial requirements. Please check the attached document.',
    datetime: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
];

// Dummy activity logs for demonstration
const dummyActivityLogs = [
  {
    action: 'created',
    user: 'Current User',
    timestamp: dayjs().subtract(5, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    action: 'updated',
    user: 'Current User',
    field: 'status',
    oldValue: 'todo',
    newValue: 'in_progress',
    timestamp: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
  {
    action: 'added_attachment',
    user: 'Jane Smith',
    attachmentName: 'requirements.pdf',
    timestamp: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
  },
];

const TaskDetailModule = ({ task, onEdit, onDelete, onBack }) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [commentForm] = Form.useForm();
  const [comments, setComments] = useState(dummyComments);
  const [activityLogs, setActivityLogs] = useState(dummyActivityLogs);
  const [loading, setLoading] = useState(false);

  // Add debugging
  console.log('TaskDetailModule - props received:', {
    taskProvided: !!task,
    taskId: task?._id,
    hasCallbacks: {
      onEdit: !!onEdit,
      onDelete: !!onDelete,
      onBack: !!onBack,
    },
  });

  useEffect(() => {
    if (task) {
      console.log('TaskDetailModule - task details:', {
        id: task._id,
        title: task.title,
        status: task.status,
        hasAssignee: !!task.assignedTo,
        hasDeadline: !!task.deadline,
      });
    } else {
      console.warn('TaskDetailModule - No task data provided!');
    }
  }, [task]);

  const handleBack = () => {
    console.log('TaskDetailModule - back button clicked');
    if (onBack) {
      onBack();
    } else {
      navigate('/tasks');
    }
  };

  const handleEdit = () => {
    console.log('TaskDetailModule - edit button clicked for task:', task?._id);
    if (onEdit) {
      onEdit(task);
    } else {
      navigate(`/task/${task._id}/edit`);
    }
  };

  const handleDelete = () => {
    console.log('TaskDetailModule - delete button clicked for task:', task?._id);
    Modal.confirm({
      title: translate('Delete Task'),
      content: translate('Are you sure you want to delete this task?'),
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      onOk() {
        if (onDelete) {
          onDelete(task);
        } else {
          // Placeholder for actual delete logic
          console.log('Delete task:', task._id);
          navigate('/tasks');
        }
      },
    });
  };

  const handleMarkComplete = () => {
    // Placeholder for actual complete logic
    console.log('TaskDetailModule - Mark as complete for task:', task?._id);
  };

  const handleAddComment = (values) => {
    console.log('TaskDetailModule - Adding comment:', values.comment);
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const newComment = {
        author: 'Current User',
        avatar: null,
        content: values.comment,
        datetime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      };

      setComments([...comments, newComment]);
      commentForm.resetFields();
      setLoading(false);
    }, 500);
  };

  if (!task) {
    return (
      <Card>
        <Alert
          message="Debug Info"
          description="No task data was provided to TaskDetailModule"
          type="warning"
          showIcon
          icon={<BugOutlined />}
        />
        <Empty description={translate('Task not found')} />
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button type="primary" onClick={() => navigate('/tasks')}>
            {translate('Back to Tasks')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ borderRadius: '12px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginBottom: '16px' }}
          >
            {translate('Back to Tasks')}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Title level={4} style={{ margin: 0 }}>
              {task.title}
            </Title>
            <Tag
              color={getStatusColor(task.status)}
              style={{
                borderRadius: '6px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {getStatusIcon(task.status)}
              {translate(getStatusText(task.status))}
            </Tag>
          </div>
        </div>

        <Space>
          {task.status !== 'completed' && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleMarkComplete}>
              {translate('Mark Complete')}
            </Button>
          )}
          <Button icon={<EditOutlined />} onClick={handleEdit}>
            {translate('Edit')}
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            {translate('Delete')}
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '0 0 24px 0' }} />

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* Description */}
            <Card title={translate('Description')} size="small" style={{ marginBottom: '24px' }}>
              {task.description ? (
                <Paragraph>{task.description}</Paragraph>
              ) : (
                <Text type="secondary">{translate('No description provided')}</Text>
              )}
            </Card>

            {/* Attachments */}
            <Card title={translate('Attachments')} size="small" style={{ marginBottom: '24px' }}>
              {task.attachments && task.attachments.length > 0 ? (
                <List
                  size="small"
                  dataSource={task.attachments}
                  renderItem={(file) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small">
                          {translate('Download')}
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getFileIcon(file.type)}
                        title={file.name}
                        description={file.size}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">{translate('No attachments')}</Text>
              )}
            </Card>

            {/* Comments */}
            <Card title={translate('Comments')} size="small">
              {comments.length > 0 ? (
                <List
                  dataSource={comments}
                  itemLayout="horizontal"
                  renderItem={(comment) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          comment.avatar ? (
                            <Avatar src={comment.avatar} />
                          ) : (
                            <Avatar icon={<UserOutlined />} />
                          )
                        }
                        title={<div style={{ fontWeight: 'bold' }}>{comment.author}</div>}
                        description={
                          <div>
                            <div>{comment.content}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {comment.datetime}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">{translate('No comments yet')}</Text>
              )}

              <Divider />

              <Form form={commentForm} onFinish={handleAddComment}>
                <Form.Item
                  name="comment"
                  rules={[{ required: true, message: translate('Please enter a comment') }]}
                >
                  <TextArea
                    rows={3}
                    placeholder={translate('Add a comment...')}
                    style={{ marginBottom: '12px' }}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    loading={loading}
                  >
                    {translate('Comment')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            {/* Task Details */}
            <Card title={translate('Task Details')} size="small" style={{ marginBottom: '24px' }}>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label={translate('Status')}>
                  <Tag color={getStatusColor(task.status)} style={{ borderRadius: '4px' }}>
                    {translate(getStatusText(task.status))}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label={translate('Priority')}>
                  <Tag color={getPriorityColor(task.priority)} style={{ borderRadius: '4px' }}>
                    {translate(task.priority.charAt(0).toUpperCase() + task.priority.slice(1))}
                  </Tag>
                </Descriptions.Item>

                <Descriptions.Item label={translate('Assigned To')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <span>{task.assignedTo?.name || '-'}</span>
                  </div>
                </Descriptions.Item>

                <Descriptions.Item label={translate('Deadline')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarOutlined />
                    <span>
                      {task.deadline ? dayjs(task.deadline).format('YYYY-MM-DD HH:mm') : '-'}
                    </span>
                  </div>
                </Descriptions.Item>

                {task.project && (
                  <Descriptions.Item label={translate('Project')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TeamOutlined />
                      <span>{task.project.name}</span>
                    </div>
                  </Descriptions.Item>
                )}

                <Descriptions.Item label={translate('Created')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CalendarOutlined />
                    <span>{task.created ? dayjs(task.created).format('YYYY-MM-DD') : '-'}</span>
                  </div>
                </Descriptions.Item>

                {task.completed && (
                  <Descriptions.Item label={translate('Completed')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <span>{dayjs(task.completed).format('YYYY-MM-DD')}</span>
                    </div>
                  </Descriptions.Item>
                )}

                {task.tags && task.tags.length > 0 && (
                  <Descriptions.Item label={translate('Tags')}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {task.tags.map((tag, index) => (
                        <Tag key={index} style={{ borderRadius: '4px' }}>
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Activity Log */}
            <Card title={translate('Activity Log')} size="small">
              <Timeline>
                {activityLogs.map((log, index) => {
                  let icon;
                  let color;
                  let content;

                  switch (log.action) {
                    case 'created':
                      icon = <PlusOutlined />;
                      color = 'green';
                      content = `${translate('Task created by')} ${log.user}`;
                      break;
                    case 'updated':
                      icon = <EditOutlined />;
                      color = 'blue';
                      content = `${log.user} ${translate('changed')} ${log.field} ${translate(
                        'from'
                      )} "${log.oldValue}" ${translate('to')} "${log.newValue}"`;
                      break;
                    case 'added_attachment':
                      icon = <PaperClipOutlined />;
                      color = 'purple';
                      content = `${log.user} ${translate('added attachment')}: ${
                        log.attachmentName
                      }`;
                      break;
                    default:
                      icon = <ClockCircleOutlined />;
                      color = 'gray';
                      content = `${log.action} ${translate('by')} ${log.user}`;
                  }

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <div>
                        <div>{content}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{log.timestamp}</div>
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>
          </Col>
        </Row>
      </div>
    </Card>
  );
};

export default TaskDetailModule;
