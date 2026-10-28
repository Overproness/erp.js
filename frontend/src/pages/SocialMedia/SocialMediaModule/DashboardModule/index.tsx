import { usePlatformIntegration, useSocialMedia } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import {
  BellOutlined,
  CalendarOutlined,
  FacebookOutlined,
  HeartOutlined,
  InstagramOutlined,
  MessageOutlined,
  PlusOutlined,
  RiseOutlined,
  TwitterOutlined,
  UserOutlined,
} from '@/components/icons';
import { Button, Card, Col, Progress, Row, Space, Statistic, Table, Typography } from '@/components/ui';
import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { useMemo, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Title: AntTitle, Text } = Typography;

const SocialMediaDashboard = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { accounts, posts, analytics, loading } = useSocialMedia();
  const { connectedPlatforms, getConnectedPlatforms = () => ['facebook', 'instagram', 'twitter'] } =
    usePlatformIntegration();

  const postList = useMemo(() => {
    if (Array.isArray(posts)) return posts;
    if (posts?.result && Array.isArray(posts.result)) return posts.result;
    return [];
  }, [posts]);

  const accountList = useMemo(() => {
    if (Array.isArray(accounts)) return accounts;
    if (accounts?.result && Array.isArray(accounts.result)) return accounts.result;
    return [];
  }, [accounts]);

  const dashboardData = useMemo(() => {
    const totalPosts = postList.length;
    const publishedPosts = postList.filter((post) => post.status === 'published');
    const scheduledPosts = postList.filter((post) => post.status === 'scheduled');

    const totalEngagement = publishedPosts.reduce(
      (sum, post) => sum + (post.performance?.engagement || post.engagement?.likes || 0),
      0
    );

    const totalReach = publishedPosts.reduce(
      (sum, post) => sum + (post.performance?.reach || post.engagement?.reach || 0),
      0
    );

    const impressions = publishedPosts.reduce(
      (sum, post) => sum + (post.performance?.impressions || post.engagement?.impressions || 0),
      0
    );

    const platformCounts = {
      facebook: 0,
      instagram: 0,
      twitter: 0,
      linkedin: 0,
    };

    postList.forEach((post) => {
      const plats = Array.isArray(post.platforms) ? post.platforms : [post.platform].filter(Boolean);
      plats.forEach((p) => {
        const platName = typeof p === 'string' ? p.toLowerCase() : (p?.platform || '').toLowerCase();
        if (platformCounts[platName] !== undefined) {
          platformCounts[platName]++;
        }
      });
    });

    const totalFollowers = accountList.reduce(
      (sum, acc) => sum + (acc.followerCount || acc.accountInfo?.followersCount || 0),
      0
    );

    const recentPosts = publishedPosts
      .sort((a, b) => new Date(b.publishedAt || b.createdAt || 0).getTime() - new Date(a.publishedAt || a.createdAt || 0).getTime())
      .slice(0, 3)
      .map((post) => ({
        id: post._id,
        content: post.content,
        platform: (post.platforms && post.platforms[0]) || post.platform || 'facebook',
        engagement: post.performance?.engagement || post.engagement?.likes || 0,
        reach: post.performance?.reach || post.engagement?.reach || 0,
        publishedAt: post.publishedAt || post.createdAt,
      }));

    const upcomingPosts = scheduledPosts
      .sort((a, b) => new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime())
      .slice(0, 5)
      .map((post) => ({
        id: post._id,
        content: post.content,
        platforms: post.platforms || [post.platform || 'facebook'],
        scheduledFor: post.scheduledFor,
      }));

    return {
      overview: {
        totalFollowers: totalFollowers,
        totalPosts: totalPosts,
        totalEngagement: totalEngagement,
        engagementRate: totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0',
        reach: totalReach,
        impressions: impressions,
      },
      recentPosts,
      upcomingPosts,
      platformStats: {
        facebook: { followers: 0, engagement: 0, posts: platformCounts.facebook },
        instagram: { followers: 0, engagement: 0, posts: platformCounts.instagram },
        twitter: { followers: 0, engagement: 0, posts: platformCounts.twitter },
      },
    };
  }, [postList, accountList]);

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

  const platformDistributionData = useMemo(() => {
    const fb = dashboardData.platformStats.facebook.posts;
    const ig = dashboardData.platformStats.instagram.posts;
    const tw = dashboardData.platformStats.twitter.posts;
    const total = fb + ig + tw;
    return {
      labels: ['Facebook', 'Instagram', 'Twitter'],
      datasets: [
        {
          data: total > 0 ? [fb, ig, tw] : [0, 0, 0],
          backgroundColor: ['#1877f2', '#E4405F', '#1DA1F2'],
          borderWidth: 0,
        },
      ],
    };
  }, [dashboardData]);

  const recentPostsColumns = [
    {
      title: translate('Content'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => <div style={{ maxWidth: '250px' }}>{text.substring(0, 60)}...</div>,
    },
    {
      title: translate('Platform'),
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getPlatformIcon(platform)}
          <Text>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
        </div>
      ),
    },
    {
      title: translate('Engagement'),
      dataIndex: 'engagement',
      key: 'engagement',
      render: (engagement) => (
        <div style={{ textAlign: 'center' }}>
          <Text strong>{engagement.toLocaleString()}</Text>
        </div>
      ),
    },
    {
      title: translate('Reach'),
      dataIndex: 'reach',
      key: 'reach',
      render: (reach) => (
        <div style={{ textAlign: 'center' }}>
          <Text>{reach.toLocaleString()}</Text>
        </div>
      ),
    },
  ];

  // Show all platforms as connected in the UI
  const connectedPlatformsList = getConnectedPlatforms();

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <AntTitle level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
            {translate('Social Media Dashboard')}
          </AntTitle>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {translate('Monitor your social media performance across all platforms')}
          </Text>
        </div>

        <Space>
          <Button icon={<CalendarOutlined />} onClick={() => navigate('/social-media/posts')}>
            {translate('Schedule Post')}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/social-media/posts')}
          >
            {translate('Create Post')}
          </Button>
        </Space>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Followers')}
              value={dashboardData.overview.totalFollowers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Posts')}
              value={dashboardData.overview.totalPosts}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Engagement')}
              value={dashboardData.overview.totalEngagement}
              prefix={<HeartOutlined />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Engagement Rate')}
              value={dashboardData.overview.engagementRate}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts and Platform Stats */}
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

      {/* Platform Performance, Quick Actions, Upcoming Posts */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} md={8} lg={8}>
          <Card title={translate('Platform Performance')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {Object.entries(dashboardData.platformStats).map(([platform, stats]) => (
                <div key={platform}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
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
                      marginBottom: '16px',
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

        <Col xs={24} md={8} lg={8}>
          <Card title={translate('Quick Actions')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<PlusOutlined />} onClick={() => navigate('/social-media/posts')}>
                {translate('Create New Post')}
              </Button>

              <Button
                block
                icon={<CalendarOutlined />}
                onClick={() => navigate('/social-media/posts')}
              >
                {translate('Schedule Posts')}
              </Button>

              <Button
                block
                icon={<RiseOutlined />}
                onClick={() => navigate('/social-media/analytics')}
              >
                {translate('View Analytics')}
              </Button>

              <Button
                block
                icon={<BellOutlined />}
                onClick={() => navigate('/social-media/mentions')}
              >
                {translate('Check Mentions')}
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={8} lg={8}>
          <Card title={translate('Upcoming Posts')} styles={{ body: { padding: 0 } }}>
            <div
              style={{
                height: 320,
                overflowY: 'auto',
                padding: '24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {dashboardData.upcomingPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    padding: '12px',
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    background: '#fff',
                  }}
                >
                  <div style={{ marginBottom: '8px' }}>
                    <Text>{post.content.substring(0, 80)}...</Text>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                    }}
                  >
                    <Space>
                      {post.platforms.map((platform) => (
                        <span key={platform}>{getPlatformIcon(platform)}</span>
                      ))}
                    </Space>
                    <Text style={{ color: '#6b7280' }}>
                      {new Date(post.scheduledFor).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              ))}

              {dashboardData.upcomingPosts.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                  }}
                >
                  <Text>{translate('No upcoming posts scheduled')}</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Posts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 0 }}>
        <Col xs={24} lg={24}>
          <Card
            title={translate('Recent Posts')}
            extra={
              <Button type="link" onClick={() => navigate('/social-media/posts')}>
                {translate('View All')}
              </Button>
            }
          >
            <Table
              columns={recentPostsColumns}
              dataSource={dashboardData.recentPosts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SocialMediaDashboard;
