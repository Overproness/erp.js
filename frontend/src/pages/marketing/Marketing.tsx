import { useMarketing } from '@/context/useMarketing';
import useLanguage from '@/locale/useLanguage';
import { fetchCampaigns, fetchSegments } from '@/redux/marketing/marketingSlice';
import {
  selectActiveCampaigns,
  selectCampaigns,
  selectCampaignsLoading,
  selectCompletedCampaigns,
  selectDraftCampaigns,
} from '@/redux/marketing/selectors';
import {
  AimOutlined,
  BarChartOutlined,
  BellOutlined,
  FundOutlined,
  PlusOutlined,
  RiseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic, Typography } from '@/components/ui';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import MarketingDataTableModule from './MarketingModule/MarketingDataTableModule';

const { Title, Text } = Typography;

export default function Marketing() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const { openModal, updateFilters } = useMarketing();

  // Campaign data from Redux store
  const campaigns = useSelector(selectCampaigns);
  const isLoading = useSelector(selectCampaignsLoading);
  const activeCampaigns = useSelector(selectActiveCampaigns);
  const draftCampaigns = useSelector(selectDraftCampaigns);
  const completedCampaigns = useSelector(selectCompletedCampaigns);

  // Local state
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fallback dummy campaigns (used only when Redux store has no data)
  const dummyCampaigns = [
    {
      id: 'cmp_1',
      name: 'Spring Sale 2025',
      description: 'Promotional email series for spring collection.',
      status: 'active',
      type: 'email',
      audience: { name: 'High-Intent Website Visitors', _id: 'aud_1' },
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
      status: 'draft',
      type: 'social',
      audience: { name: 'Engaged Email Subscribers', _id: 'aud_2' },
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
      audience: { name: 'All Customers', _id: 'aud_3' },
      startDate: '2025-01-10',
      endDate: '2025-01-20',
      sentCount: 5000,
      openCount: 0,
      createdAt: '2024-12-30',
    },
  ];

  // Dummy audience segments for consistency
  const dummyAudiences = [
    { _id: 'aud_1', name: 'High-Intent Website Visitors', size: 8420 },
    { _id: 'aud_2', name: 'Engaged Email Subscribers', size: 5310 },
    { _id: 'aud_3', name: 'All Customers', size: 15000 },
  ];

  // Prefer store data; fallback to dummy data for metrics and table section
  const campaignsSource = campaigns && campaigns.length ? campaigns : dummyCampaigns;
  const derivedActiveCampaigns = campaignsSource.filter((c) => c.status === 'active');
  const derivedCompletedCampaigns = campaignsSource.filter((c) => c.status === 'completed');
  const derivedDraftCampaigns = campaignsSource.filter((c) => c.status === 'draft');

  useEffect(() => {
    dispatch(fetchCampaigns());
    dispatch(fetchSegments());
  }, [dispatch]);

  const handleSearch = (value) => {
    setSearchText(value);
    updateFilters({ search: value });
  };

  const handleCreateCampaign = () => {
    navigate('/marketing/campaign-builder');
  };

  const handleViewAnalytics = () => {
    navigate('/marketing/analytics');
  };

  const handleManageTriggers = () => {
    navigate('/marketing/behavior-triggers');
  };

  // Updated stats for display with realistic numbers
  const totalCampaigns = campaignsSource.length;
  const totalContacts = 23450; // Sample total contacts
  const totalAudiences = dummyAudiences.length;
  const conversionRate = 24; // Sample conversion rate

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('Marketing Campaigns')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              {translate('Create and manage your marketing campaigns across multiple channels')}
            </Text>
          </div>
          <Space>
            <Button icon={<BarChartOutlined />} onClick={handleViewAnalytics}>
              {translate('Analytics')}
            </Button>
            <Button icon={<BellOutlined />} onClick={handleManageTriggers}>
              {translate('Behavior Triggers')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCampaign}>
              {translate('Create Campaign')}
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Total Campaigns')}
                value={totalCampaigns}
                valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                prefix={<FundOutlined style={{ color: '#8b45ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Active Campaigns')}
                value={derivedActiveCampaigns.length}
                valueStyle={{ color: '#52c41a', fontWeight: '700' }}
                prefix={<RiseOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Audience Segments')}
                value={totalAudiences}
                valueStyle={{ color: '#faad14', fontWeight: '700' }}
                prefix={<UserOutlined style={{ color: '#faad14' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Conversion Rate')}
                value={conversionRate}
                suffix="%"
                valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                prefix={<AimOutlined style={{ color: '#6366f1' }} />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
        }}
      >
        <MarketingDataTableModule />
      </Card>
    </div>
  );
}
