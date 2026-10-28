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
  LinkedinOutlined,
  PlusOutlined,
  SyncOutlined,
  TwitterOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from '@/components/icons';
import {
  Avatar,
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

export default function RetargetingAudiences() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const translate = useLanguage();

  const audiences = useSelector(selectRetargetingLists) || [];
  const isLoading = useSelector(selectRetargetingListsLoading);
  const platforms = useSelector(selectRetargetingPlatforms);
  const isSyncing = useSelector((state: any) => state.retargeting?.platforms?.syncing);

  const [searchText, setSearchText] = useState('');
  const [filteredAudiences, setFilteredAudiences] = useState<any[]>([]);
  const [editingAudience, setEditingAudience] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('audiences');

  // Live audience data directly from Redux store with clean empty fallback
  const audiencesData = useMemo(() => {
    return Array.isArray(audiences) ? audiences : [];
  }, [audiences]);

  // Live platform connection states with sensible defaults
  const platformsData = useMemo(() => {
    const defaultConnections = {
      facebook: { name: 'Facebook', connected: false, lastSync: null },
      google: { name: 'Google Ads', connected: false, lastSync: null },
      linkedin: { name: 'LinkedIn', connected: false, lastSync: null },
      tiktok: { name: 'TikTok Ads', connected: false, lastSync: null },
    };
    return {
      lastSyncTime: platforms?.lastSyncTime || null,
      connections: platforms?.connections
        ? { ...defaultConnections, ...platforms.connections }
        : defaultConnections,
    };
  }, [platforms]);

  useEffect(() => {
    dispatch(fetchRetargetingLists());
  }, [dispatch]);

  useEffect(() => {
    setFilteredAudiences(
      audiencesData.filter(
        (audience: any) =>
          audience.name?.toLowerCase().includes(searchText.toLowerCase()) ||
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

  const handleEditAudience = (audience: any) => {
    setEditingAudience(audience);
    setIsModalVisible(true);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    setEditingAudience(null);
  };

  const showDeleteConfirm = (audienceId: string, audienceName: string) => {
    confirm({
      title: translate('Delete Audience'),
      content: `${translate('Are you sure you want to delete this audience?')} "${audienceName}"`,
      icon: <ExclamationCircleOutlined />,
      okText: translate('Yes'),
      okType: 'danger',
      cancelText: translate('No'),
      onOk() {
        dispatch(deleteRetargetingList(audienceId));
      },
    });
  };

  const handleSyncPlatform = async (platform: string) => {
    try {
      message.loading({
        content: `${translate('Syncing audience with')} ${platform}...`,
        key: `sync-${platform}`,
      });
      await (dispatch as any)(syncPlatformAudiences(platform)).unwrap();
      message.success({
        content: `${translate('Audience sync initiated for')} ${platform}`,
        key: `sync-${platform}`,
      });
    } catch (err: any) {
      message.error({
        content: err || `${translate('Failed to sync')} ${platform}`,
        key: `sync-${platform}`,
      });
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, React.ReactNode> = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      google: <GoogleOutlined style={{ color: '#ea4335' }} />,
      twitter: <TwitterOutlined style={{ color: '#1da1f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E1306C' }} />,
      linkedin: <LinkedinOutlined style={{ color: '#0a66c2' }} />,
      tiktok: <VideoCameraOutlined style={{ color: '#000000' }} />,
    };
    return icons[platform] || <UserOutlined />;
  };

  const columns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
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
      render: (size: number) => (
        <div>
          {(size || 0).toLocaleString()} {translate('users')}
        </div>
      ),
    },
    {
      title: translate('Platforms'),
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platformsList: string[]) => (
        <Space>
          {(platformsList || []).map((platform) => (
            <Avatar key={platform} icon={getPlatformIcon(platform)} size="small" />
          ))}
        </Space>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusColors: Record<string, 'success' | 'processing' | 'error' | 'default' | 'warning'> = {
          active: 'success',
          synced: 'success',
          syncing: 'processing',
          pending: 'warning',
          error: 'error',
          failed: 'error',
          draft: 'default',
        };
        return <Badge status={statusColors[status] || 'default'} text={translate(status || 'active')} />;
      },
    },
    {
      title: translate('Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span>{date ? new Date(date).toLocaleDateString() : '-'}</span>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="text"
            icon={<SyncOutlined spin={isSyncing} />}
            title={translate('Sync to Platforms')}
            onClick={() => {
              const platform = (record.platforms && record.platforms[0]) || 'facebook';
              handleSyncPlatform(platform);
            }}
          />
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
              value={audiencesData.reduce((sum: number, audience: any) => sum + (audience.size || 0), 0)}
              prefix={<UserOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card style={{ borderRadius: '10px', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)' }}>
            <Statistic
              title={translate('Connected Platforms')}
              value={
                Object.values(platformsData.connections).filter((p: any) => p.connected).length
              }
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

      {/* Audiences Table Card */}
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
          <Space>
            <Button
              icon={<SyncOutlined spin={isSyncing} />}
              loading={isSyncing}
              onClick={() => handleSyncPlatform('facebook')}
            >
              {translate('Sync All Platforms')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAudience}>
              {translate('Create Audience')}
            </Button>
          </Space>
        </div>

        {/* Audiences Table with Empty State */}
        {audiencesData.length === 0 && !isLoading ? (
          <Empty
            style={{ padding: '48px 0' }}
            description={
              <span>
                {translate('No retargeting audiences configured.')}
                <br />
                <Text type="secondary">
                  {translate('Create your first audience to begin syncing with Meta, Google, LinkedIn, and TikTok.')}
                </Text>
              </span>
            }
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateAudience}>
              {translate('Create Audience')}
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={filteredAudiences}
            rowKey="_id"
            loading={isLoading}
            pagination={{ pageSize: 10 }}
          />
        )}
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
            dispatch(fetchRetargetingLists());
          }}
          onCancel={handleModalCancel}
        />
      </Modal>
    </div>
  );
}
