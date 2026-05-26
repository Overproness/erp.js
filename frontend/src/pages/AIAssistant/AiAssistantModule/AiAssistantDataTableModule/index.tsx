import { ErpLayout } from '@/layout';
import useLanguage from '@/locale/useLanguage';
import {
  selectAssistantsList,
  selectAssistantsLoading,
  selectAssistantsPagination,
} from '@/redux/ai/aiSelectors';
import { setCurrentAssistant } from '@/redux/ai/aiSlice';
import { deleteAssistant, fetchAssistants } from '@/redux/ai/aiThunks';
import { useDate } from '@/settings';
import {
  BarChartOutlined,
  BulbOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  MessageOutlined,
  MoreOutlined,
  PlusOutlined,
  RobotOutlined,
  ScanOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import { Avatar, Button, Dropdown, Space, Table, Tag, Tooltip } from '@/components/ui';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const AiAssistantDataTableModule = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const { formatDate } = useDate();

  const assistants = useSelector(selectAssistantsList);
  const isLoading = useSelector(selectAssistantsLoading);
  const rawPagination = useSelector(selectAssistantsPagination);
  const pagination = rawPagination || { current: 1, pageSize: 10, total: 0 };

  // Ensure assistants is always an array
  const safeAssistants = Array.isArray(assistants) ? assistants : [];
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    dispatch(fetchAssistants());
  }, [dispatch]);

  const handleRead = (record) => {
    dispatch(setCurrentAssistant(record));
    navigate(`/ai-assistant/read/${record._id}`);
  };

  const handleEdit = (record) => {
    dispatch(setCurrentAssistant(record));
    navigate(`/ai-assistant/update/${record._id}`);
  };

  const handleDelete = (record) => {
    dispatch(deleteAssistant(record._id));
  };

  const handleChat = (record) => {
    navigate(`/ai-assistant/chat/${record._id}`);
  };

  const getTypeIcon = (type) => {
    const icons = {
      general: <RobotOutlined />,
      document: <FileTextOutlined />,
      workflow: <SettingOutlined />,
      analytics: <BarChartOutlined />,
      customer: <UserOutlined />,
      financial: <DollarOutlined />,
    };
    return icons[type] || <RobotOutlined />;
  };

  const getTypeColor = (type) => {
    const colors = {
      general: 'blue',
      document: 'green',
      workflow: 'orange',
      analytics: 'purple',
      customer: 'cyan',
      financial: 'gold',
    };
    return colors[type] || 'blue';
  };

  const columns = [
    {
      title: translate('Assistant'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar
            icon={getTypeIcon(record.type)}
            style={{
              backgroundColor: getTypeColor(record.type) === 'blue' ? '#1890ff' : undefined,
            }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
          </div>
        </Space>
      ),
    },
    {
      title: translate('Type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={getTypeColor(type)} icon={getTypeIcon(type)}>
          {translate(type)}
        </Tag>
      ),
    },
    {
      title: translate('Model'),
      dataIndex: ['model', 'modelName'],
      key: 'model',
      render: (modelName) => <Tag color="blue">{modelName || 'gpt-3.5-turbo'}</Tag>,
    },
    {
      title: translate('Capabilities'),
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (capabilities) => (
        <Space wrap>
          {capabilities?.slice(0, 2).map((cap) => (
            <Tag key={cap} size="small">
              {translate(cap)}
            </Tag>
          ))}
          {capabilities?.length > 2 && (
            <Tooltip
              title={capabilities
                .slice(2)
                .map((cap) => translate(cap))
                .join(', ')}
            >
              <Tag size="small" key="more-capabilities">
                +{capabilities.length - 2}
              </Tag>
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'enabled',
      key: 'status',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? translate('Active') : translate('Inactive')}
        </Tag>
      ),
    },
    {
      title: translate('Created'),
      dataIndex: 'created',
      key: 'created',
      render: (date) => formatDate(date),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const items = [
          {
            key: 'read',
            label: translate('View Details'),
            icon: <EyeOutlined />,
            onClick: () => handleRead(record),
          },
          {
            key: 'chat',
            label: translate('Chat'),
            icon: <MessageOutlined />,
            onClick: () => handleChat(record),
          },
          {
            key: 'edit',
            label: translate('Edit'),
            icon: <EditOutlined />,
            onClick: () => handleEdit(record),
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: translate('Delete'),
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button type="text" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        );
      },
    },
  ];

  const handleTableChange = (paginationInfo) => {
    dispatch(
      fetchAssistants({
        page: paginationInfo.current,
        limit: paginationInfo.pageSize,
      })
    );
  };

  return (
    <ErpLayout>
      <PageHeader
        title={translate('AI Assistants')}
        subTitle={translate('Manage your AI assistants and their configurations')}
        extra={[
          <Button
            key="data-processor"
            icon={<ScanOutlined />}
            onClick={() => navigate('/ai-assistant/data-processor')}
          >
            {translate('Data Processor')}
          </Button>,
          <Button
            key="suggestions"
            icon={<BulbOutlined />}
            onClick={() => navigate('/ai-assistant/suggestions')}
          >
            {translate('Suggestions')}
          </Button>,
          <Button
            key="analytics"
            icon={<BarChartOutlined />}
            onClick={() => navigate('/ai-assistant/analytics')}
          >
            {translate('Analytics')}
          </Button>,
          <Button
            key="settings"
            icon={<SettingOutlined />}
            onClick={() => navigate('/ai-assistant/settings')}
          >
            {translate('Settings')}
          </Button>,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/ai-assistant/create')}
          >
            {translate('Create Assistant')}
          </Button>,
        ]}
      />

      <Table
        columns={columns}
        dataSource={safeAssistants}
        loading={isLoading}
        rowKey="_id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} assistants`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 'max-content' }}
        onRow={(record) => ({
          onDoubleClick: () => handleRead(record),
        })}
      />
    </ErpLayout>
  );
};

export default AiAssistantDataTableModule;
