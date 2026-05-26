import useLanguage from '@/locale/useLanguage';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
  ContactsOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Menu,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ViewTaskModule = ({
  tasks = [],
  loading = false,
  onEdit,
  onView,
  onDelete,
  onMarkComplete,
}) => {
  const translate = useLanguage();
  const navigate = useNavigate();

  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [userCache, setUserCache] = useState({});

  // Fetch user data for assignedTo IDs
  useEffect(() => {
    const fetchUserData = async () => {
      if (!Array.isArray(tasks) || tasks.length === 0) {
        return;
      }

      // Get unique team IDs from tasks
      const teamIds = [
        ...new Set(
          tasks.map((task) => task.assignedTeam).filter((id) => id && typeof id === 'string')
        ),
      ];

      if (teamIds.length === 0) {
        return;
      }

      try {
        const token = window.localStorage.getItem('auth_token');

        // Fetch team members for each team
        const teamPromises = teamIds.map(async (teamId) => {
          try {
            const apolloClient = (await import('@/graphql/client')).default;
            const { LIST_TEAM_MEMBERS } = await import('@/graphql/operations/team');
            const { data } = await apolloClient.query({
              query: LIST_TEAM_MEMBERS,
              variables: { id: teamId },
            });

            if (data.teamListMembers?.success && data.teamListMembers?.result) {
              return data.teamListMembers.result;
            }
            return [];
          } catch (error) {
            console.error(`Error fetching team ${teamId} members:`, error);
            return [];
          }
        });

        const teamResults = await Promise.all(teamPromises);

        // Build user cache from all team members
        const newCache = {};
        teamResults.flat().forEach((member) => {
          if (member.user && member.user._id) {
            newCache[member.user._id] = member.user;
          }
        });

        setUserCache(newCache);
      } catch (error) {
        console.error('Error fetching team member data:', error);
      }
    };

    fetchUserData();
  }, [tasks]);

  // Apply filters when they change
  useEffect(() => {
    if (!Array.isArray(tasks)) {
      console.error('ViewTaskModule - tasks is not an array:', tasks);
      setFilteredTasks([]);
      return;
    }

    let filtered = [...tasks];

    // Apply search
    if (searchText) {
      filtered = filtered.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchText.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Apply date filter
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((task) => {
        const taskDate = dayjs(task.deadline);
        return taskDate.isAfter(dateRange[0]) && taskDate.isBefore(dateRange[1]);
      });
    }

    setFilteredTasks(filtered);
  }, [tasks, searchText, statusFilter, priorityFilter, dateRange]);

  const handleTaskAction = (action, task) => {
    switch (action) {
      case 'view':
        if (onView) onView(task);
        break;
      case 'edit':
        if (onEdit) onEdit(task);
        else navigate(`/task/${task._id}/edit`);
        break;
      case 'delete':
        if (onDelete) onDelete(task);
        else message.warning('Delete functionality not implemented');
        break;
      case 'markComplete':
        if (onMarkComplete) onMarkComplete(task);
        else message.warning('Mark as complete functionality not implemented');
        break;
      default:
        break;
    }
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
        return translate('Pending');
      case 'assigned':
        return translate('Assigned');
      case 'in_progress':
        return translate('In Progress');
      case 'completed':
        return translate('Completed');
      case 'cancelled':
        return translate('Cancelled');
      case 'pending_approval':
        return translate('Pending Approval');
      case 'delegated':
        return translate('Delegated');
      default:
        return translate('Pending');
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
      case 'urgent':
        return '#722ed1';
      default:
        return '#52c41a';
    }
  };

  const columns = [
    {
      title: translate('Title'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</span>
          </div>
          <Text type="secondary" ellipsis={{ tooltip: record.description }}>
            {record.description && record.description.length > 60
              ? `${record.description.substring(0, 60)}...`
              : record.description}
          </Text>
        </div>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status) => (
        <Tag
          color={getStatusColor(status)}
          style={{
            borderRadius: '6px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            width: 'fit-content',
          }}
        >
          {getStatusIcon(status)}
          {getStatusText(status)}
        </Tag>
      ),
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: translate('Priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)} style={{ borderRadius: '6px', fontWeight: '500' }}>
          {translate(priority.charAt(0).toUpperCase() + priority.slice(1))}
        </Tag>
      ),
      sorter: (a, b) => {
        const priorityOrder = { low: 0, medium: 1, high: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      },
    },
    {
      title: translate('Assigned To'),
      dataIndex: ['assignedTo', 'name'],
      key: 'assignedTo',
      width: 150,
      render: (_, record) => {
        // Get user data from cache or use populated data
        let userName = '-';

        if (record.assignedTo) {
          if (typeof record.assignedTo === 'object' && record.assignedTo.name) {
            // Already populated from backend
            userName = record.assignedTo.name;
          } else if (typeof record.assignedTo === 'string' && userCache[record.assignedTo]) {
            // Get from cache
            userName = userCache[record.assignedTo].name;
          }
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserOutlined style={{ color: '#6b7280', fontSize: '12px' }} />
            <span style={{ fontSize: '13px' }}>{userName}</span>
          </div>
        );
      },
    },
    {
      title: translate('Deadline'),
      dataIndex: 'deadline',
      key: 'deadline',
      width: 150,
      render: (date) => {
        if (!date) return '-';
        const deadline = dayjs(date);
        const isOverdue = deadline.isBefore(dayjs()) && !date.status === 'completed';
        return (
          <div
            style={{
              fontSize: '13px',
              color: isOverdue ? '#ff4d4f' : 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <CalendarOutlined style={{ fontSize: '12px' }} />
            {deadline.format('YYYY-MM-DD')}
          </div>
        );
      },
      sorter: (a, b) => dayjs(a.deadline).unix() - dayjs(b.deadline).unix(),
    },
    {
      title: translate('Linked'),
      key: 'integrations',
      width: 120,
      render: (_, record) => {
        const integrations = [];
        if (record.customer) integrations.push({ icon: <ContactsOutlined />, tooltip: 'Customer', color: '#1890ff' });
        if (record.invoice) integrations.push({ icon: <DollarOutlined />, tooltip: 'Invoice', color: '#52c41a' });
        if (record.quote) integrations.push({ icon: <FileTextOutlined />, tooltip: 'Quote', color: '#faad14' });
        if (record.documents && record.documents.length > 0) {
          integrations.push({ icon: <FileTextOutlined />, tooltip: `${record.documents.length} Documents`, color: '#722ed1' });
        }
        if (record.appointment) integrations.push({ icon: <CalendarOutlined />, tooltip: 'Appointment', color: '#13c2c2' });

        if (integrations.length === 0) {
          return <Text type="secondary">-</Text>;
        }

        return (
          <Space size="small">
            {integrations.map((item, index) => (
              <Tooltip key={index} title={item.tooltip}>
                <span style={{ color: item.color, fontSize: '16px' }}>{item.icon}</span>
              </Tooltip>
            ))}
          </Space>
        );
      },
    },
    {
      title: translate('Actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleTaskAction('view', record)}
            size="small"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleTaskAction('edit', record)}
            size="small"
          />
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item key="delete" onClick={() => handleTaskAction('delete', record)}>
                  <DeleteOutlined style={{ color: '#ff4d4f' }} /> {translate('Delete')}
                </Menu.Item>
                {record.status !== 'completed' && (
                  <Menu.Item
                    key="markComplete"
                    onClick={() => handleTaskAction('markComplete', record)}
                  >
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />{' '}
                    {translate('Mark Complete')}
                  </Menu.Item>
                )}
              </Menu>
            }
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ borderRadius: '12px' }}>
      {/* Filters */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', flex: '1' }}>
          <Input
            placeholder={translate('Search tasks')}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder={translate('Status')}
            style={{ width: 140 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">{translate('All Status')}</Option>
            <Option value="pending">{translate('Pending')}</Option>
            <Option value="assigned">{translate('Assigned')}</Option>
            <Option value="in_progress">{translate('In Progress')}</Option>
            <Option value="completed">{translate('Completed')}</Option>
            <Option value="cancelled">{translate('Cancelled')}</Option>
            <Option value="pending_approval">{translate('Pending Approval')}</Option>
            <Option value="delegated">{translate('Delegated')}</Option>
          </Select>
          <Select
            placeholder={translate('Priority')}
            style={{ width: 140 }}
            value={priorityFilter}
            onChange={setPriorityFilter}
          >
            <Option value="all">{translate('All Priorities')}</Option>
            <Option value="low">{translate('Low')}</Option>
            <Option value="medium">{translate('Medium')}</Option>
            <Option value="high">{translate('High')}</Option>
          </Select>
        </div>
        <RangePicker
          placeholder={[translate('Start Date'), translate('End Date')]}
          onChange={setDateRange}
        />
      </div>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={filteredTasks}
        rowKey="_id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `${total} ${translate(total === 1 ? 'task' : 'tasks')}`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
        locale={{
          emptyText: (
            <Empty description={translate('No tasks found')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ),
        }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default ViewTaskModule;
