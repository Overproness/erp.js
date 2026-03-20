import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkflowService from '../../services/WorkflowService';

dayjs.extend(relativeTime);

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const WorkflowList = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    executions24h: 0,
  });

  // Fetch workflows
  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const response = await WorkflowService.getWorkflows({
        search: searchText,
        status: filterStatus === 'all' ? undefined : filterStatus,
      });

      if (response.success) {
        setWorkflows(response.workflows);

        // Calculate stats
        const total = response.workflows.length;
        const active = response.workflows.filter((w) => w.isActive).length;
        const inactive = total - active;

        setStats({
          total,
          active,
          inactive,
          executions24h: response.workflows.reduce(
            (sum, w) => sum + (w.statistics?.executions24h || 0),
            0
          ),
        });
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [searchText, filterStatus]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  // Execute workflow
  const handleExecuteWorkflow = async (workflow) => {
    try {
      const response = await WorkflowService.executeWorkflow(workflow._id);
      if (response.success) {
        message.success(`Workflow "${workflow.name}" executed successfully`);
        fetchWorkflows(); // Refresh to update execution stats
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  // Toggle workflow status
  const handleToggleStatus = async (workflow) => {
    try {
      const response = await WorkflowService.toggleWorkflowStatus(workflow._id);
      if (response.success) {
        message.success(response.message);
        fetchWorkflows();
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  // Duplicate workflow
  const handleDuplicateWorkflow = async (workflow) => {
    try {
      const response = await WorkflowService.duplicateWorkflow(workflow._id);
      if (response.success) {
        message.success(`Workflow duplicated as "${response.workflow.name}"`);
        fetchWorkflows();
      }
    } catch (error) {
      message.error(error.message);
    }
  };

  // Delete workflow
  const handleDeleteWorkflow = (workflow) => {
    Modal.confirm({
      title: 'Delete Workflow',
      content: `Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await WorkflowService.deleteWorkflow(workflow._id);
          if (response.success) {
            message.success('Workflow deleted successfully');
            fetchWorkflows();
          }
        } catch (error) {
          message.error(error.message);
        }
      },
    });
  };

  // Bulk operations
  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select workflows to delete');
      return;
    }

    Modal.confirm({
      title: 'Delete Selected Workflows',
      content: `Are you sure you want to delete ${selectedRowKeys.length} workflow(s)? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await Promise.all(selectedRowKeys.map((id) => WorkflowService.deleteWorkflow(id)));
          message.success(`${selectedRowKeys.length} workflow(s) deleted successfully`);
          setSelectedRowKeys([]);
          fetchWorkflows();
        } catch (error) {
          message.error('Failed to delete some workflows');
        }
      },
    });
  };

  const handleBulkToggleStatus = async (activate) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select workflows to update');
      return;
    }

    try {
      await Promise.all(
        selectedRowKeys.map((id) => {
          const workflow = workflows.find((w) => w._id === id);
          if (workflow && workflow.isActive !== activate) {
            return WorkflowService.toggleWorkflowStatus(id);
          }
          return Promise.resolve();
        })
      );
      message.success(`${selectedRowKeys.length} workflow(s) updated successfully`);
      setSelectedRowKeys([]);
      fetchWorkflows();
    } catch (error) {
      message.error('Failed to update some workflows');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Workflow',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{name}</div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description.length > 60
                ? `${record.description.substring(0, 60)}...`
                : record.description}
            </Text>
          )}
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        (record.description && record.description.toLowerCase().includes(value.toLowerCase())),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      width: '10%',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Nodes',
      dataIndex: 'nodes',
      key: 'nodeCount',
      width: '8%',
      render: (nodes) => <Text>{nodes?.length || 0}</Text>,
      sorter: (a, b) => (a.nodes?.length || 0) - (b.nodes?.length || 0),
    },
    {
      title: 'Last Execution',
      dataIndex: 'statistics',
      key: 'lastExecution',
      width: '15%',
      render: (stats) => {
        const lastExecution = stats?.lastExecution;
        if (!lastExecution) {
          return <Text type="secondary">Never</Text>;
        }

        const status = lastExecution.status;
        const time = dayjs(lastExecution.completedAt || lastExecution.startedAt).fromNow();

        const statusIcon = {
          completed: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
          failed: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
          running: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
          cancelled: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        }[status];

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {statusIcon}
              <Text style={{ fontSize: '12px' }}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </div>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {time}
            </Text>
          </div>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: '12%',
      render: (createdAt, record) => (
        <div>
          <div style={{ fontSize: '12px' }}>{dayjs(createdAt).format('MMM DD, YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            by {record.createdBy?.name || 'Unknown'}
          </Text>
        </div>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: '15%',
      render: (tags) => (
        <div>
          {tags?.slice(0, 2).map((tag) => (
            <Tag key={tag} size="small" style={{ marginBottom: 2 }}>
              {tag}
            </Tag>
          ))}
          {tags?.length > 2 && (
            <Tag size="small" style={{ marginBottom: 2 }}>
              +{tags.length - 2}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '15%',
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View Details',
            onClick: () => navigate(`/workflows/${record._id}`),
          },
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => navigate(`/workflows/${record._id}/edit`),
          },
          {
            key: 'duplicate',
            icon: <CopyOutlined />,
            label: 'Duplicate',
            onClick: () => handleDuplicateWorkflow(record),
          },
          {
            key: 'divider1',
            type: 'divider',
          },
          {
            key: 'toggle',
            icon: <SettingOutlined />,
            label: record.isActive ? 'Deactivate' : 'Activate',
            onClick: () => handleToggleStatus(record),
          },
          {
            key: 'divider2',
            type: 'divider',
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteWorkflow(record),
          },
        ];

        return (
          <Space>
            <Tooltip title="Execute Workflow">
              <Button
                icon={<PlayCircleOutlined />}
                size="small"
                disabled={!record.isActive}
                onClick={() => handleExecuteWorkflow(record)}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <Button icon={<MoreOutlined />} size="small" />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              Workflow Automation
            </Title>
            <Text type="secondary">Design, manage, and execute automated business processes</Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/workflows/create')}
              >
                Create Workflow
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Stats Cards */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Workflows" value={stats.total} prefix={<SettingOutlined />} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active"
                value={stats.active}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Inactive"
                value={stats.inactive}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Executions (24h)"
                value={stats.executions24h}
                prefix={<PlayCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Search */}
        <Row gutter={16} style={{ marginBottom: '16px' }}>
          <Col span={8}>
            <Search
              placeholder="Search workflows..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              placeholder="Filter by status"
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">All Workflows</Option>
              <Option value="active">Active Only</Option>
              <Option value="inactive">Inactive Only</Option>
            </Select>
          </Col>
          <Col span={12}>
            <Space style={{ float: 'right' }}>
              {selectedRowKeys.length > 0 && (
                <>
                  <Button
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleBulkToggleStatus(true)}
                  >
                    Activate Selected
                  </Button>
                  <Button
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleBulkToggleStatus(false)}
                  >
                    Deactivate Selected
                  </Button>
                  <Button icon={<DeleteOutlined />} danger onClick={handleBulkDelete}>
                    Delete Selected
                  </Button>
                </>
              )}
              <Button icon={<ReloadOutlined />} onClick={fetchWorkflows}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Workflows Table */}
      <Card>
        {workflows.length === 0 && !loading ? (
          <Empty description="No workflows found" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/workflows/create')}
            >
              Create Your First Workflow
            </Button>
          </Empty>
        ) : (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={workflows}
            rowKey="_id"
            loading={loading}
            pagination={{
              total: workflows.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} workflows`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default WorkflowList;
