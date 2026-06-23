import useLanguage from '@/locale/useLanguage';
import { deleteTrigger, fetchTriggers, toggleTriggerStatus } from '@/redux/marketing/behaviorSlice';
import {
  selectActiveTriggers,
  selectTriggers,
  selectTriggersLoading,
} from '@/redux/marketing/selectors';
import {
  ApiOutlined,
  BellOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  ScheduleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Input,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from '@/components/ui';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BehaviorTriggersModule from './MarketingModule/BehaviorTriggersModule';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;

// Move dummy data outside component to prevent re-creation on every render
const DUMMY_TRIGGERS = [
  {
    _id: 'trigger_1',
    name: 'Cart Abandonment Follow-up',
    description: 'Sends an email when a user abandons their cart',
    eventType: 'cart_abandonment',
    conditions: [
      { type: 'cart_value', operator: 'greater_than', value: '50' },
      { type: 'time', operator: 'after', value: '1 hour' },
    ],
    actions: [{ type: 'send_email', template: 'abandoned_cart' }],
    active: true,
    priority: 'high',
    createdAt: '2025-01-09T10:00:00.000Z',
    conditionCount: 2,
    actionCount: 1,
    settings: {
      scheduleType: 'delayed',
      delayTime: 30,
      delayUnit: 'minutes',
      executionLimit: 3,
      timeWindow: 7,
    },
  },
  {
    _id: 'trigger_2',
    name: 'New User Welcome',
    description: 'Sends welcome email to new users after signup',
    eventType: 'signup',
    conditions: [
      { type: 'user_property', property: 'signup_date', operator: 'equals', value: 'today' },
    ],
    actions: [
      { type: 'send_email', template: 'welcome' },
      { type: 'add_tag', tag: 'new_user' },
    ],
    active: true,
    priority: 'medium',
    createdAt: '2024-12-30T10:00:00.000Z',
    conditionCount: 1,
    actionCount: 2,
    settings: {
      scheduleType: 'immediate',
    },
  },
  {
    _id: 'trigger_3',
    name: 'Inactive User Re-engagement',
    description: 'Sends re-engagement email to users inactive for 30 days',
    eventType: 'custom_event',
    conditions: [
      { type: 'user_property', property: 'last_login', operator: 'greater_than', value: '30 days' },
    ],
    actions: [{ type: 'send_email', template: 'reengagement' }],
    active: false,
    priority: 'low',
    createdAt: '2024-12-10T10:00:00.000Z',
    conditionCount: 1,
    actionCount: 1,
    settings: {
      scheduleType: 'scheduled',
      scheduleTime: '2025-01-11T10:00:00.000Z',
      scheduleRecurring: true,
      recurringFrequency: 'weekly',
      userSegment: 'inactive',
    },
  },
];

export default function BehaviorTriggers() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();

  const triggers = useSelector(selectTriggers);
  const isLoading = useSelector(selectTriggersLoading);
  const activeTriggers = useSelector(selectActiveTriggers);

  const [searchText, setSearchText] = useState('');
  const [filteredTriggers, setFilteredTriggers] = useState([]);
  const [editingTrigger, setEditingTrigger] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchTriggers());
  }, [dispatch]);

  // Use memoized triggers data to prevent infinite re-renders
  const triggersData = useMemo(() => {
    return triggers && triggers.length ? triggers : DUMMY_TRIGGERS;
  }, [triggers]);

  const activeTriggersCount = useMemo(() => {
    return triggersData.filter((t) => t.active).length;
  }, [triggersData]);

  useEffect(() => {
    setFilteredTriggers(
      triggersData.filter(
        (trigger) =>
          trigger.name.toLowerCase().includes(searchText.toLowerCase()) ||
          trigger.description?.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [triggersData, searchText]);

  const handleBack = () => {
    navigate('/marketing');
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleCreateTrigger = () => {
    setEditingTrigger(null);
    setIsModalVisible(true);
  };

  const handleEditTrigger = (trigger) => {
    setEditingTrigger(trigger);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingTrigger(null);
  };

  const handleToggleStatus = (triggerId, currentStatus) => {
    dispatch(toggleTriggerStatus({ id: triggerId, active: !currentStatus }));
  };

  const showDeleteConfirm = (triggerId, triggerName) => {
    confirm({
      title: translate('Are you sure you want to delete this trigger?'),
      content: translate(`Trigger: ${triggerName}`),
      icon: <ExclamationCircleOutlined />,
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      onOk() {
        dispatch(deleteTrigger(triggerId));
      },
    });
  };

  const handleModalSave = (triggerData) => {
    console.log('Saving trigger with data:', triggerData); // Debug log

    // Here you would dispatch the save action to Redux
    // For now, we'll just close the modal and show success
    setIsModalVisible(false);
    setEditingTrigger(null);

    // In a real app, you would update the local state or refetch data
    // For demo purposes, we'll just refresh
    dispatch(fetchTriggers());

    // Show success message
    message.success(translate('Trigger saved successfully with settings!'));
  };

  // Helper to render schedule tag based on settings
  const renderScheduleInfo = (trigger) => {
    if (!trigger.settings) return null;

    const settings = trigger.settings;

    switch (settings.scheduleType) {
      case 'immediate':
        return (
          <Tag icon={<ThunderboltOutlined />} color="green">
            {translate('Immediate')}
          </Tag>
        );
      case 'delayed':
        return (
          <Tooltip
            title={`${translate('Delayed by')} ${settings.delayTime} ${translate(
              settings.delayUnit
            )}`}
          >
            <Tag icon={<ClockCircleOutlined />} color="orange">
              {`${translate('Delayed')} ${settings.delayTime} ${settings.delayUnit.charAt(0)}`}
            </Tag>
          </Tooltip>
        );
      case 'scheduled':
        const scheduleDate = new Date(settings.scheduleTime);
        return (
          <Tooltip
            title={`${scheduleDate.toLocaleDateString()} ${scheduleDate.toLocaleTimeString()} ${
              settings.scheduleRecurring
                ? `, ${translate('Recurring')}: ${translate(settings.recurringFrequency)}`
                : ''
            }`}
          >
            <Tag icon={<ScheduleOutlined />} color="blue">
              {translate('Scheduled')}
              {settings.scheduleRecurring && <ClockCircleOutlined style={{ marginLeft: 5 }} />}
            </Tag>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const columns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: translate('Event Type'),
      dataIndex: 'eventType',
      key: 'eventType',
      render: (text) => <Tag color="blue">{text.replace('_', ' ')}</Tag>,
    },
    {
      title: translate('Trigger'),
      key: 'trigger',
      render: (_, record) => (
        <Space>
          {renderScheduleInfo(record)}
          {record.settings?.executionLimit && (
            <Tooltip
              title={`${translate('Limited to')} ${record.settings.executionLimit} ${translate(
                'executions'
              )}`}
            >
              <Tag color="purple">Max: {record.settings.executionLimit}</Tag>
            </Tooltip>
          )}
          {record.settings?.userSegment && (
            <Tooltip
              title={`${translate('Segment')}: ${record.settings.userSegment.replace('_', ' ')}`}
            >
              <Tag color="cyan">{record.settings.userSegment.replace('_', ' ')}</Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: translate('Conditions'),
      dataIndex: 'conditionCount',
      key: 'conditionCount',
      render: (_, record) => (
        <Badge count={record.conditions?.length || 0} style={{ backgroundColor: '#8b5cf6' }} />
      ),
    },
    {
      title: translate('Actions'),
      dataIndex: 'actionCount',
      key: 'actionCount',
      render: (_, record) => (
        <Badge count={record.actions?.length || 0} style={{ backgroundColor: '#10b981' }} />
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'active',
      key: 'active',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={() => handleToggleStatus(record._id, active)}
          size="small"
        />
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditTrigger(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record._id, record.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <div>
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
            {translate('Behavior Triggers')}
          </Title>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {translate('Create and manage automated responses based on user behavior')}
          </Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Total Triggers')}
              value={triggersData.length}
              prefix={<ThunderboltOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Active Triggers')}
              value={activeTriggersCount}
              prefix={<BellOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Automations Run')}
              value={20} // Fixed sample value for demonstration
              prefix={<ApiOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Search and Actions */}
      <div
        style={{
          marginBottom: '16px',
          gap: '16px',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Search
          placeholder={translate('Search triggers')}
          // className="p-4"
          allowClear
          style={{ width: 300 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTrigger}>
          {translate('Create Trigger')}
        </Button>
      </div>

      {/* Triggers Table */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
        }}
      >
        <Table
          columns={columns}
          dataSource={filteredTriggers}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Trigger Editor Modal */}
      <Modal
        title={editingTrigger ? translate('Edit Trigger') : translate('Create Trigger')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        width={1200} // Increased width for better settings display
        footer={null}
        destroyOnHidden
      >
        <BehaviorTriggersModule
          trigger={editingTrigger}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />
      </Modal>
    </div>
  );
}
