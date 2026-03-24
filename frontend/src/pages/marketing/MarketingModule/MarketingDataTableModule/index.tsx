import {
  BarChartOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  ExclamationCircleOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Dropdown,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import useLanguage from '../../../../locale/useLanguage';

// Redux actions
import {
  deleteCampaign,
  fetchCampaigns,
  pauseCampaign,
  startCampaign,
} from '../../../../redux/marketing/campaignSlice';

const { Search } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { confirm } = Modal;

const MarketingDataTableModule = () => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const { campaigns = [], loading = false } = useSelector((state) => state.campaign || {});

  // Local state for filtering and table management
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 10,
      total: 0,
    },
    sorter: {},
  });

  // Fallback dummy campaigns (used only when Redux store has no data)
  const dummyCampaigns = [
    {
      id: 'cmp_1',
      name: 'Spring Sale 2025',
      description: 'Promotional email series for spring collection.',
      status: 'active',
      type: 'email',
      audience: { name: 'All Subscribers' },
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      sentCount: 12000,
      openCount: 4800,
      createdAt: '2025-02-10',
    },
    {
      id: 'cmp_2',
      name: 'Social Boost - April',
      description: 'Paid social media push to increase awareness.',
      status: 'paused',
      type: 'social',
      audienceCount: 8400,
      startDate: '2025-04-05',
      endDate: '2025-04-20',
      sentCount: 0,
      openCount: 0,
      createdAt: '2025-04-01',
    },
    {
      id: 'cmp_3',
      name: 'Re-engagement SMS',
      description: 'Win-back campaign for inactive users.',
      status: 'completed',
      type: 'sms',
      audience: { name: 'Inactive Users' },
      startDate: '2025-01-10',
      endDate: '2025-01-20',
      sentCount: 5000,
      openCount: 0,
      createdAt: '2024-12-30',
    },
  ];

  // Filter campaigns based on local filters
  const filteredCampaigns = campaigns.filter((campaign) => {
    // Search filter
    if (
      searchText &&
      !campaign.name.toLowerCase().includes(searchText.toLowerCase()) &&
      !campaign.description?.toLowerCase().includes(searchText.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    if (statusFilter && campaign.status !== statusFilter) {
      return false;
    }

    // Type filter
    if (typeFilter && campaign.type !== typeFilter) {
      return false;
    }

    // Date range filter
    if (dateRange && dateRange.length === 2) {
      const campaignStart = dayjs(campaign.startDate);
      const campaignEnd = dayjs(campaign.endDate);
      const filterStart = dateRange[0];
      const filterEnd = dateRange[1];

      if (campaignStart.isBefore(filterStart) || campaignEnd.isAfter(filterEnd)) {
        return false;
      }
    }

    return true;
  });

  // Use fallback if no campaigns in store
  const campaignsToShow = campaigns && campaigns.length ? filteredCampaigns : dummyCampaigns;

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams((prev) => ({
      ...prev,
      pagination: {
        ...prev.pagination,
        current: pagination.current,
        pageSize: pagination.pageSize,
      },
      sorter: {
        field: sorter.field,
        order: sorter.order,
      },
    }));
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleFilterChange = (key, value) => {
    if (key === 'status') {
      setStatusFilter(value);
    } else if (key === 'type') {
      setTypeFilter(value);
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleRowSelection = (selectedKeys) => {
    setSelectedRowKeys(selectedKeys);
  };

  const handleEdit = (record) => {
    navigate(`/marketing/campaign-builder/${record.id}`);
  };

  const handleAnalytics = (id) => {
    navigate(`/marketing/analytics/${id}`);
  };

  const confirmDelete = (id) => {
    confirm({
      title: translate('Delete Campaign'),
      icon: <ExclamationCircleOutlined />,
      content: translate('Are you sure you want to delete this campaign?'),
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      onOk() {
        dispatch(deleteCampaign(id))
          .then(() => message.success(translate('Campaign deleted successfully')))
          .catch(() => message.error(translate('Failed to delete campaign')));
      },
    });
  };

  const handleStatusChange = (id, newStatus) => {
    // Use the appropriate action based on status
    let actionPromise;
    if (newStatus === 'active') {
      actionPromise = dispatch(startCampaign(id));
    } else if (newStatus === 'paused') {
      actionPromise = dispatch(pauseCampaign(id));
    } else {
      // For other status changes, we'd need to add more actions
      // For now, just show a message
      message.info(translate(`Status change to ${newStatus} not implemented yet`));
      return;
    }

    actionPromise
      .then(() => message.success(translate(`Campaign ${newStatus} successfully`)))
      .catch(() => message.error(translate(`Failed to set campaign as ${newStatus}`)));
  };

  // Get status tag color based on campaign status
  const getStatusColor = (status) => {
    const statusColors = {
      draft: 'default',
      active: 'success',
      paused: 'warning',
      completed: 'blue',
      archived: 'default',
    };
    return statusColors[status] || 'default';
  };

  // Status label formatter
  const formatStatus = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getActionMenuItems = (record) => {
    const items = [
      { key: 'edit', icon: <EditOutlined />, label: translate('Edit'), onClick: () => handleEdit(record) },
      { key: 'analytics', icon: <BarChartOutlined />, label: translate('Analytics'), onClick: () => handleAnalytics(record.id) },
      { type: 'divider' },
    ];
    if (record.status !== 'active') {
      items.push({ key: 'activate', icon: <PlayCircleOutlined />, label: translate('Activate'), onClick: () => handleStatusChange(record.id, 'active') });
    }
    if (record.status === 'active') {
      items.push({ key: 'pause', icon: <PauseCircleOutlined />, label: translate('Pause'), onClick: () => handleStatusChange(record.id, 'paused') });
    }
    if (record.status === 'active' || record.status === 'paused') {
      items.push({ key: 'complete', icon: <CheckCircleOutlined />, label: translate('Mark as Completed'), onClick: () => handleStatusChange(record.id, 'completed') });
    }
    items.push({ type: 'divider' });
    items.push({ key: 'delete', icon: <DeleteOutlined />, label: translate('Delete'), danger: true, onClick: () => confirmDelete(record.id) });
    return items;
  };

  const columns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      sortOrder:
        tableParams.sorter?.field === 'name'
          ? tableParams.sorter.order === 'ascend'
            ? 'ascend'
            : 'descend'
          : null,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              {record.description.length > 60
                ? `${record.description.substring(0, 60)}...`
                : record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: translate('Active'), value: 'active' },
        { text: translate('Draft'), value: 'draft' },
        { text: translate('Paused'), value: 'paused' },
        { text: translate('Completed'), value: 'completed' },
        { text: translate('Archived'), value: 'archived' },
      ],
      filteredValue: statusFilter ? [statusFilter] : null,
      render: (status) => (
        <Tag color={getStatusColor(status)}>{translate(formatStatus(status))}</Tag>
      ),
    },
    {
      title: translate('Type'),
      dataIndex: 'type',
      key: 'type',
      width: 140,
      filters: [
        { text: translate('Email'), value: 'email' },
        { text: translate('Social Media'), value: 'social' },
        { text: translate('SMS'), value: 'sms' },
        { text: translate('Push'), value: 'push' },
        { text: translate('Multi-channel'), value: 'multi' },
      ],
      filteredValue: typeFilter ? [typeFilter] : null,
      render: (type) => (type ? translate(type.charAt(0).toUpperCase() + type.slice(1)) : '-'),
    },
    {
      title: translate('Audience'),
      dataIndex: 'audience',
      key: 'audience',
      width: 160,
      render: (audience, record) => (
        <Space>
          <TeamOutlined />
          <span>{audience?.name || record.audienceCount || '-'}</span>
        </Space>
      ),
    },
    {
      title: translate('Date Range'),
      dataIndex: 'startDate',
      key: 'dateRange',
      width: 180,
      render: (startDate, record) => {
        if (!startDate || !record.endDate) return '-';
        return (
          <div style={{ fontSize: '13px' }}>
            <Space direction="vertical" size={0}>
              <span>{dayjs(startDate).format('MMM D, YYYY')}</span>
              <span style={{ color: '#6b7280' }}>
                {dayjs(record.endDate).format('MMM D, YYYY')}
              </span>
            </Space>
          </div>
        );
      },
    },
    {
      title: translate('Performance'),
      dataIndex: 'performance',
      key: 'performance',
      width: 150,
      render: (perf, record) => {
        const sentCount = record.sentCount || 0;
        const openCount = record.openCount || 0;
        const openRate = sentCount > 0 ? Math.round((openCount / sentCount) * 100) : 0;

        return (
          <div>
            <div style={{ fontSize: '13px', marginBottom: '2px' }}>
              {sentCount} {translate('sent')}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {openRate}% {translate('open rate')}
            </div>
          </div>
        );
      },
    },
    {
      title: translate('Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: true,
      sortOrder:
        tableParams.sorter?.field === 'createdAt'
          ? tableParams.sorter.order === 'ascend'
            ? 'ascend'
            : 'descend'
          : null,
      render: (date) => (
        <div style={{ fontSize: '13px', color: '#6b7280' }}>
          {date ? dayjs(date).format('MMM D, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']} placement="bottomRight">
          <Button type="text" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: handleRowSelection,
  };

  return (
    <div>
      {/* Filters and Actions Row */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Search
            placeholder={translate('Search campaigns')}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 250 }}
          />

          <Select
            placeholder={translate('Campaign Status')}
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={(value) => handleFilterChange('status', value)}
          >
            <Option value="active">{translate('Active')}</Option>
            <Option value="paused">{translate('Paused')}</Option>
            <Option value="draft">{translate('Draft')}</Option>
            <Option value="completed">{translate('Completed')}</Option>
            <Option value="archived">{translate('Archived')}</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            placeholder={[translate('Start Date'), translate('End Date')]}
            style={{ width: 250 }}
          />
        </div>

        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/marketing/campaign-builder')}
          >
            {translate('Create Campaign')}
          </Button>
        </Space>
      </div>

      {/* Data Table */}
      <Table
        rowKey="id"
        rowSelection={rowSelection}
        dataSource={campaignsToShow}
        columns={columns}
        loading={loading}
        pagination={{
          current: tableParams.pagination.current,
          pageSize: tableParams.pagination.pageSize,
          total: campaignsToShow.length,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => translate(`Total ${total} campaigns`, { total }),
        }}
        onChange={handleTableChange}
        size="middle"
        scroll={{ x: 1200 }}
      />
    </div>
  );
};

export default MarketingDataTableModule;
