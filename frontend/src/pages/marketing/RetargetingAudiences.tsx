import useLanguage from '@/locale/useLanguage';
import {
  deleteRetargetingList,
  fetchRetargetingLists,
  syncPlatformAudiences,
} from '@/redux/marketing/retargetingSlice';
import {
  selectRetargetingLists,
  selectRetargetingListsLoading,
  selectRetargetingPlatforms,
} from '@/redux/marketing/selectors';
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  FacebookOutlined,
  GoogleOutlined,
  InstagramOutlined,
  PlusOutlined,
  SyncOutlined,
  TwitterOutlined,
  UserOutlined,
} from '@/components/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Typography,
} from '@/components/ui';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import RetargetingModule from './MarketingModule/RetargetingModule';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { TabPane } = Tabs;

// Dummy fallbacks when store data is empty - moved outside component to prevent re-creation
const dummyAudiences = [
  {
    _id: 'aud_1',
    name: 'High-Intent Website Visitors',
    description: 'Visited pricing/checkout in last 30 days',
    size: 8420,
    platforms: ['facebook', 'instagram', 'twitter', 'google'],
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
  },
  {
    _id: 'aud_2',
    name: 'Engaged Email Subscribers',
    description: 'Opened or clicked emails in last 60 days',
    size: 5310,
    platforms: ['facebook', 'instagram', 'google'],
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(), // 45 days ago
  },
  {
    _id: 'aud_3',
    name: 'All Customers',
    description: 'All customers in our database',
    size: 15000,
    platforms: ['facebook', 'google'],
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(), // 60 days ago
  },
];

const dummyPlatforms = {
  lastSyncTime: Date.now() - 3600 * 1000 * 8, // 8 hours ago
  connections: {
    facebook: { name: 'Facebook', connected: true, lastSync: Date.now() - 3600 * 1000 * 8 },
    instagram: { name: 'Instagram', connected: true, lastSync: Date.now() - 3600 * 1000 * 12 },
    twitter: { name: 'Twitter', connected: true, lastSync: Date.now() - 3600 * 1000 * 24 },
    google: { name: 'Google', connected: true, lastSync: Date.now() - 3600 * 1000 * 4 },
  },
};

export default function RetargetingAudiences() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();

  const audiences = useSelector(selectRetargetingLists);
  const isLoading = useSelector(selectRetargetingListsLoading);
  const platforms = useSelector(selectRetargetingPlatforms);
  const isSyncing = useSelector((state) => state.retargeting?.platforms?.syncing);

  const [searchText, setSearchText] = useState('');
  const [filteredAudiences, setFilteredAudiences] = useState([]);
  const [editingAudience, setEditingAudience] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('audiences');

  // Use real data from Redux if available, otherwise use dummy data - memoized to prevent infinite re-renders
  const audiencesData = useMemo(() => {
    return audiences && audiences.length ? audiences : dummyAudiences;
  }, [audiences, dummyAudiences]);

  const platformsData = useMemo(() => {
    return platforms && Object.keys(platforms).length && platforms.connections
      ? platforms
      : dummyPlatforms;
  }, [platforms, dummyPlatforms]);

  useEffect(() => {
    dispatch(fetchRetargetingLists());
  }, [dispatch]);

  useEffect(() => {
    setFilteredAudiences(
      audiencesData.filter(
        (audience) =>
          audience.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (audience.description &&
            audience.description.toLowerCase().includes(searchText.toLowerCase()))
      )
    );
  }, [audiencesData, searchText]);

  const handleBack = () => {
    navigate('/marketing');
  };

  const handleCreateAudience = () => {
    setEditingAudience(null);
    setIsModalVisible(true);
  };

  const handleEditAudience = (audience) => {
    setEditingAudience(audience);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingAudience(null);
  };

  const showDeleteConfirm = (audienceId, audienceName) => {
    confirm({
      title: translate('Delete Audience'),
      content: translate('Are you sure you want to delete this audience?') + ` "${audienceName}"`,
      icon: <ExclamationCircleOutlined />,
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      onOk() {
        dispatch(deleteRetargetingList(audienceId));
      },
    });
  };

  const handleSyncPlatform = (platform) => {
    dispatch(syncPlatformAudiences(platform));
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      google: <GoogleOutlined style={{ color: '#ea4335' }} />,
      twitter: <TwitterOutlined style={{ color: '#1da1f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E1306C' }} />,
      // LinkedIn removed
    };
    return icons[platform] || <UserOutlined />;
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
      title: translate('Size'),
      dataIndex: 'size',
      key: 'size',
      render: (size) => (
        <div>
          {size.toLocaleString()} {translate('users')}
        </div>
      ),
    },
    {
      title: translate('Platforms'),
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms) => (
        <Space>
          {platforms.map((platform) => (
            <Avatar key={platform} icon={getPlatformIcon(platform)} size="small" />
          ))}
        </Space>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          active: 'success',
          syncing: 'processing',
          error: 'error',
          draft: 'default',
        };
        return <Badge status={statusColors[status] || 'default'} text={translate(status)} />;
      },
    },
    {
      title: translate('Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => <span>{new Date(date).toLocaleDateString()}</span>,
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEditAudience(record)} />
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
            {translate('Retargeting Audiences')}
          </Title>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {translate('Create and sync customer audiences with advertising platforms')}
          </Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[12, 12]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Total Audiences')}
              value={audiencesData.length}
              prefix={<UserOutlined style={{ color: '#8b5cf6' }} />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Total Reach')}
              value={audiencesData.reduce((sum, audience) => sum + (audience.size || 0), 0)}
              prefix={<UserOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Connected Platforms')}
              value={Object.values(platformsData.connections).filter((p) => p.connected).length}
              prefix={<UserOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Last Sync')}
              value={
                platformsData.lastSyncTime
                  ? new Date(platformsData.lastSyncTime).toLocaleDateString()
                  : 'Never'
              }
              prefix={<SyncOutlined style={{ color: '#6366f1' }} />}
              valueStyle={{ color: '#6366f1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Audiences Table Card - Only one tab */}
      <Card
        style={{
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
        }}
      >
        {/* Search and Actions */}
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            gap: '16px',
            justifyContent: 'space-between',
          }}
        >
          <Search
            placeholder={translate('Search audiences')}
            allowClear
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAudience}>
            {translate('Create Audience')}
          </Button>
        </div>

        {/* Audiences Table */}
        <Table
          columns={columns}
          dataSource={filteredAudiences}
          rowKey="_id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Audience Editor Modal */}
      <Modal
        title={editingAudience ? translate('Edit Audience') : translate('Create Audience')}
        open={isModalVisible}
        onCancel={handleModalCancel}
        width={800}
        footer={null}
      >
        <RetargetingModule
          audience={editingAudience}
          onSave={() => {
            setIsModalVisible(false);
            setEditingAudience(null);
          }}
          onCancel={handleModalCancel}
        />
      </Modal>
    </div>
  );
}
