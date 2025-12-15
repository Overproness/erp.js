import { request } from '@/request';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Button,
  Card,
  Col,
  Empty,
  Input,
  message,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useCallback, useEffect, useState } from 'react';
import GenerateCustomerUrlModal from './GenerateCustomerUrlModal';

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;
const { Search } = Input;

const urlTypeIcons = {
  portal: { icon: '🔐', color: 'blue' },
  payment: { icon: '💰', color: 'green' },
  document: { icon: '📄', color: 'orange' },
  appointment: { icon: '📅', color: 'purple' },
  survey: { icon: '📝', color: 'cyan' },
  review: { icon: '⭐', color: 'gold' },
  quote: { icon: '📋', color: 'geekblue' },
  invoice: { icon: '💳', color: 'red' },
  event: { icon: '🎫', color: 'magenta' },
  general: { icon: '🔗', color: 'default' },
};

const CustomerUrlManager = ({ customerId, customerName }) => {
  const [urls, setUrls] = useState([]);
  console.log('🚀 ~ CustomerUrlManager ~ urls:', urls);
  const [loading, setLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchUrls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await request.get({
        entity: 'client',
        id: customerId,
        subEntity: 'urls',
      });

      if (response.success) {
        // Ensure result is an array, not an object
        const urlData = Array.isArray(response.result) ? response.result : [];
        setUrls(urlData);
      } else {
        message.error('Failed to fetch URLs');
      }
    } catch (error) {
      console.error('Error fetching URLs:', error);
      message.error('Failed to fetch URLs');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchUrls();
    }
  }, [customerId, fetchUrls]);

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    message.success('URL copied to clipboard!');
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete URL',
      content: 'Are you sure you want to delete this URL? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          // Call delete API here
          message.success('URL deleted successfully');
          fetchUrls();
        } catch (error) {
          message.error('Failed to delete URL');
        }
      },
    });
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const config = urlTypeIcons[type] || urlTypeIcons.general;
        return (
          <Tooltip title={type}>
            <Tag color={config.color}>
              <Space size={4}>
                <span>{config.icon}</span>
                <span style={{ textTransform: 'capitalize' }}>{type}</span>
              </Space>
            </Tag>
          </Tooltip>
        );
      },
      filters: Object.keys(urlTypeIcons).map((type) => ({
        text: type.charAt(0).toUpperCase() + type.slice(1),
        value: type,
      })),
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Short URL',
      dataIndex: 'shortUrl',
      key: 'shortUrl',
      width: 250,
      render: (url) => (
        <Space size={4}>
          <Paragraph copyable={{ text: url }} style={{ marginBottom: 0, maxWidth: 180 }} ellipsis>
            {url}
          </Paragraph>
          <Tooltip title="Copy URL">
            <Button
              type="link"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyUrl(url)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Analytics',
      key: 'analytics',
      width: 150,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>
            <EyeOutlined /> {record.analytics?.totalClicks || 0} clicks
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.analytics?.uniqueClicks || 0} unique
          </Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (text, record) => {
        const isExpired = record.expiresAt && dayjs(record.expiresAt).isBefore(dayjs());
        const isActive = record.isActive && !isExpired;

        return (
          <Tag
            color={isActive ? 'success' : 'default'}
            icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
          >
            {isActive ? 'Active' : isExpired ? 'Expired' : 'Inactive'}
          </Tag>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMMM D, YYYY h:mm A')}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {dayjs(date).fromNow()}
          </Text>
        </Tooltip>
      ),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 120,
      render: (date) => {
        if (!date) return <Text type="secondary">Never</Text>;
        const isExpired = dayjs(date).isBefore(dayjs());
        return (
          <Tooltip title={dayjs(date).format('MMMM D, YYYY h:mm A')}>
            <Text type={isExpired ? 'danger' : 'secondary'} style={{ fontSize: 12 }}>
              {dayjs(date).fromNow()}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button type="link" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Analytics">
            <Button type="link" size="small" icon={<BarChartOutlined />} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Calculate statistics (ensure urls is array)
  const urlsArray = Array.isArray(urls) ? urls : [];
  const stats = {
    total: urlsArray.length,
    active: urlsArray.filter(
      (u) => u.isActive && (!u.expiresAt || dayjs(u.expiresAt).isAfter(dayjs()))
    ).length,
    totalClicks: urlsArray.reduce((sum, u) => sum + (u.analytics?.totalClicks || 0), 0),
    uniqueClicks: urlsArray.reduce((sum, u) => sum + (u.analytics?.uniqueClicks || 0), 0),
  };

  // Filter URLs based on search
  const filteredUrls = urlsArray.filter((url) => {
    const matchesSearch =
      !searchText ||
      url.title?.toLowerCase().includes(searchText.toLowerCase()) ||
      url.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      url.shortCode?.toLowerCase().includes(searchText.toLowerCase());

    return matchesSearch;
  });

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total URLs"
              value={stats.total}
              prefix={<LinkOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Active URLs"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Clicks"
              value={stats.totalClicks}
              prefix={<EyeOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Unique Clicks"
              value={stats.uniqueClicks}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        title={
          <Space>
            <LinkOutlined />
            <span>Customer Communication URLs</span>
            <Badge count={urlsArray.length} showZero style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="Search URLs..."
              allowClear
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchUrls} loading={loading}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowGenerateModal(true)}
            >
              Generate URL
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUrls}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} URLs`,
          }}
          locale={{
            emptyText: (
              <Empty description="No URLs generated yet" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setShowGenerateModal(true)}
                >
                  Generate Your First URL
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>

      {/* Generate URL Modal */}
      <GenerateCustomerUrlModal
        visible={showGenerateModal}
        onCancel={() => setShowGenerateModal(false)}
        customerId={customerId}
        customerName={customerName}
        onUrlGenerated={() => {
          fetchUrls();
          setShowGenerateModal(false);
        }}
      />
    </div>
  );
};

export default CustomerUrlManager;
