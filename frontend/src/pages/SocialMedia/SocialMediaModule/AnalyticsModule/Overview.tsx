import { useAnalytics } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import {
  FacebookOutlined,
  HeartOutlined,
  InstagramOutlined,
  RiseOutlined,
  ShareAltOutlined,
  TwitterOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Card,
  Col,
  DatePicker,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from '@/components/ui';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useEffect, useRef, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Overview = () => {
  const translate = useLanguage();
  const { analytics, isLoading, loadAnalytics } = useAnalytics();
  const [period, setPeriod] = useState('7d');
  const [dateRange, setDateRange] = useState(null);
  const prevPeriodRef = useRef('');

  useEffect(() => {
    if (prevPeriodRef.current === period) return;
    prevPeriodRef.current = period;
    loadAnalytics(period);
  }, [period]);

  // Sample data - replace with real analytics data
  const [sampleData] = useState({
    totalFollowers: 12500,
    totalPosts: 156,
    totalEngagement: 8950,
    engagementRate: 7.2,
    reach: 45600,
    impressions: 125000,
    growth: {
      followers: 12.5,
      engagement: 8.3,
      reach: 15.7,
    },
    platformStats: {
      facebook: { followers: 5200, engagement: 6.8, posts: 45 },
      instagram: { followers: 4800, engagement: 9.2, posts: 67 },
      twitter: { followers: 2500, engagement: 5.5, posts: 44 },
    },
  });

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const engagementChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Engagement',
        data: [650, 590, 800, 810, 560, 550, 400],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const followerGrowthData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Facebook',
        data: [100, 150, 120, 180],
        backgroundColor: '#1877f2',
      },
      {
        label: 'Instagram',
        data: [80, 120, 160, 140],
        backgroundColor: '#E4405F',
      },
      {
        label: 'Twitter',
        data: [60, 80, 70, 90],
        backgroundColor: '#1DA1F2',
      },
    ],
  };

  const platformDistributionData = {
    labels: ['Facebook', 'Instagram', 'Twitter'],
    datasets: [
      {
        data: [41.6, 38.4, 20],
        backgroundColor: ['#1877f2', '#E4405F', '#1DA1F2'],
        borderWidth: 0,
      },
    ],
  };

  const topPostsColumns = [
    {
      title: translate('Content'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => <div style={{ maxWidth: '200px' }}>{text.substring(0, 80)}...</div>,
    },
    {
      title: translate('Platform'),
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <Tag icon={getPlatformIcon(platform)} key={platform}>
          {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </Tag>
      ),
    },
    {
      title: translate('Engagement'),
      dataIndex: 'engagement',
      key: 'engagement',
      sorter: (a, b) => a.engagement - b.engagement,
    },
    {
      title: translate('Reach'),
      dataIndex: 'reach',
      key: 'reach',
      sorter: (a, b) => a.reach - b.reach,
    },
  ];

  const topPostsData = [
    {
      key: '1',
      content: 'Check out our latest product launch! Amazing features await...',
      platform: 'instagram',
      engagement: 1250,
      reach: 8500,
    },
    {
      key: '2',
      content: 'Behind the scenes of our team working on innovative solutions...',
      platform: 'facebook',
      engagement: 980,
      reach: 6200,
    },
    {
      key: '3',
      content: 'Quick tip: How to maximize productivity with our tools...',
      platform: 'twitter',
      engagement: 750,
      reach: 4800,
    },
  ];

  return (
    <div>
      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
                <Option value="7d">{translate('Last 7 days')}</Option>
                <Option value="30d">{translate('Last 30 days')}</Option>
                <Option value="90d">{translate('Last 3 months')}</Option>
                <Option value="1y">{translate('Last year')}</Option>
              </Select>

              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder={[translate('Start Date'), translate('End Date')]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Total Followers')}
              value={sampleData.totalFollowers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#3f8600' }}>
                  +{sampleData.growth.followers}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Total Engagement')}
              value={sampleData.totalEngagement}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#cf1322' }}>
                  +{sampleData.growth.engagement}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Total Reach')}
              value={sampleData.reach}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#1890ff' }}>
                  +{sampleData.growth.reach}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={translate('Engagement Rate')}
              value={sampleData.engagementRate}
              precision={1}
              suffix="%"
              prefix={<ShareAltOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title={translate('Engagement Trends')}>
            <Line
              data={engagementChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title={translate('Platform Distribution')}>
            <Doughnut
              data={platformDistributionData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={translate('Follower Growth')}>
            <Bar
              data={followerGrowthData}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={translate('Platform Performance')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(sampleData.platformStats).map(([platform, stats]) => (
                <div key={platform} style={{ marginBottom: '16px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <Space>
                      {getPlatformIcon(platform)}
                      <Text strong>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                    </Space>
                    <Text>{stats.followers.toLocaleString()} followers</Text>
                  </div>
                  <Progress
                    percent={stats.engagement * 10}
                    strokeColor={
                      platform === 'facebook'
                        ? '#1877f2'
                        : platform === 'instagram'
                          ? '#E4405F'
                          : '#1DA1F2'
                    }
                    showInfo={false}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#6b7280',
                    }}
                  >
                    <span>{stats.engagement}% engagement</span>
                    <span>{stats.posts} posts</span>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Top Performing Posts */}
      <Card title={translate('Top Performing Posts')} style={{ marginTop: '24px' }}>
        <Table
          columns={topPostsColumns}
          dataSource={topPostsData}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Overview;
