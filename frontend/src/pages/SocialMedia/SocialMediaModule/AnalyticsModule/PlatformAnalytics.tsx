import { usePlatformIntegration } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import {
  FacebookOutlined,
  HeartOutlined,
  InstagramOutlined,
  MessageOutlined,
  RiseOutlined,
  ShareAltOutlined,
  TwitterOutlined,
} from '@/components/icons';
import { Card, Col, Progress, Row, Select, Statistic, Table, Tabs, Typography } from '@/components/ui';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';

const { Option } = Select;
const { TabPane } = Tabs;
const { Text } = Typography;

const PlatformAnalytics = () => {
  const translate = useLanguage();
  const { connectedPlatforms } = usePlatformIntegration();
  const [selectedPlatform, setSelectedPlatform] = useState('facebook');
  const [period, setPeriod] = useState('30d');

  // Sample platform-specific data
  const platformData = {
    facebook: {
      followers: 5200,
      posts: 45,
      engagement: 6.8,
      reach: 25000,
      impressions: 68000,
      pageViews: 1250,
      growth: {
        followers: 8.5,
        engagement: 12.3,
        reach: 15.7,
      },
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 25 },
          { range: '25-34', percentage: 35 },
          { range: '35-44', percentage: 22 },
          { range: '45-54', percentage: 12 },
          { range: '55+', percentage: 6 },
        ],
        topCountries: [
          { country: 'United States', percentage: 45 },
          { country: 'Canada', percentage: 18 },
          { country: 'United Kingdom', percentage: 12 },
          { country: 'Australia', percentage: 8 },
          { country: 'Germany', percentage: 7 },
        ],
      },
    },
    instagram: {
      followers: 4800,
      posts: 67,
      engagement: 9.2,
      reach: 32000,
      impressions: 89000,
      storyViews: 2150,
      growth: {
        followers: 15.2,
        engagement: 18.7,
        reach: 22.4,
      },
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 40 },
          { range: '25-34', percentage: 32 },
          { range: '35-44', percentage: 18 },
          { range: '45-54', percentage: 7 },
          { range: '55+', percentage: 3 },
        ],
        topCountries: [
          { country: 'United States', percentage: 38 },
          { country: 'Brazil', percentage: 15 },
          { country: 'United Kingdom', percentage: 12 },
          { country: 'Canada', percentage: 10 },
          { country: 'India', percentage: 8 },
        ],
      },
    },
    twitter: {
      followers: 2500,
      posts: 44,
      engagement: 5.5,
      reach: 18000,
      impressions: 45000,
      mentions: 89,
      growth: {
        followers: 6.8,
        engagement: 9.2,
        reach: 11.5,
      },
      demographics: {
        ageGroups: [
          { range: '18-24', percentage: 22 },
          { range: '25-34', percentage: 38 },
          { range: '35-44', percentage: 25 },
          { range: '45-54', percentage: 12 },
          { range: '55+', percentage: 3 },
        ],
        topCountries: [
          { country: 'United States', percentage: 52 },
          { country: 'United Kingdom', percentage: 16 },
          { country: 'Canada', percentage: 12 },
          { country: 'Australia', percentage: 8 },
          { country: 'Japan', percentage: 6 },
        ],
      },
    },
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const getPlatformColor = (platform) => {
    const colors = {
      facebook: '#1877f2',
      instagram: '#E4405F',
      twitter: '#1DA1F2',
    };
    return colors[platform];
  };

  const currentData = platformData[selectedPlatform];

  const engagementData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Engagement',
        data: [520, 680, 750, 890],
        borderColor: getPlatformColor(selectedPlatform),
        backgroundColor: `${getPlatformColor(selectedPlatform)}20`,
        tension: 0.4,
      },
    ],
  };

  const demographicsColumns = [
    {
      title: translate('Age Group'),
      dataIndex: 'range',
      key: 'range',
    },
    {
      title: translate('Percentage'),
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <div>
          <Progress
            percent={percentage}
            size="small"
            strokeColor={getPlatformColor(selectedPlatform)}
            showInfo={false}
          />
          <span style={{ marginLeft: '8px' }}>{percentage}%</span>
        </div>
      ),
    },
  ];

  const countriesColumns = [
    {
      title: translate('Country'),
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: translate('Percentage'),
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <div>
          <Progress
            percent={percentage}
            size="small"
            strokeColor={getPlatformColor(selectedPlatform)}
            showInfo={false}
          />
          <span style={{ marginLeft: '8px' }}>{percentage}%</span>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Platform Selector */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Select value={selectedPlatform} onChange={setSelectedPlatform} style={{ width: 200 }}>
              {Object.keys(connectedPlatforms).map((platform) => (
                <Option key={platform} value={platform}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getPlatformIcon(platform)}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </span>
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
              <Option value="7d">{translate('Last 7 days')}</Option>
              <Option value="30d">{translate('Last 30 days')}</Option>
              <Option value="90d">{translate('Last 3 months')}</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Platform Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={translate('Followers')}
              value={currentData.followers}
              prefix={getPlatformIcon(selectedPlatform)}
              valueStyle={{ color: getPlatformColor(selectedPlatform) }}
              suffix={
                <span style={{ fontSize: '12px', color: '#3f8600' }}>
                  +{currentData.growth.followers}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={translate('Engagement Rate')}
              value={currentData.engagement}
              precision={1}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#3f8600' }}>
                  +{currentData.growth.engagement}%
                </span>
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title={translate('Reach')}
              value={currentData.reach}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '12px', color: '#3f8600' }}>
                  +{currentData.growth.reach}%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Platform-specific metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={translate('Posts')}
              value={currentData.posts}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={translate('Impressions')}
              value={currentData.impressions}
              prefix={<ShareAltOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={
                selectedPlatform === 'facebook'
                  ? translate('Page Views')
                  : selectedPlatform === 'instagram'
                    ? translate('Story Views')
                    : translate('Mentions')
              }
              value={
                selectedPlatform === 'facebook'
                  ? currentData.pageViews
                  : selectedPlatform === 'instagram'
                    ? currentData.storyViews
                    : currentData.mentions
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Demographics */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title={translate('Engagement Trends')}>
            <Line
              data={engagementData}
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
          <Card title={translate('Demographics')}>
            <Tabs defaultActiveKey="age" size="small">
              <TabPane tab={translate('Age Groups')} key="age">
                <Table
                  columns={demographicsColumns}
                  dataSource={currentData.demographics.ageGroups}
                  pagination={false}
                  size="small"
                  rowKey="range"
                />
              </TabPane>

              <TabPane tab={translate('Countries')} key="countries">
                <Table
                  columns={countriesColumns}
                  dataSource={currentData.demographics.topCountries}
                  pagination={false}
                  size="small"
                  rowKey="country"
                />
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PlatformAnalytics;
