import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space,
  Button,
  Progress,
  Table,
  Tag,
  Avatar,
  Divider
} from 'antd';
import {
  PlusOutlined,
  RiseOutlined,
  HeartOutlined,
  MessageOutlined,
  ShareAltOutlined,
  UserOutlined,
  CalendarOutlined,
  BellOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useSocialMedia, usePlatformIntegration } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import { useNavigate } from 'react-router-dom';
import dummyPosts from '@/data/dummyPostsData';

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
  const { analytics, loading } = useSocialMedia();
  // Update to show all platforms as connected
  const { connectedPlatforms, getConnectedPlatforms = () => ['facebook', 'instagram', 'twitter'] } = usePlatformIntegration();
  
  // Calculate statistics from dummy data
  const calculateStatistics = () => {
    const totalPosts = dummyPosts.length; // Should be 156
    
    // Count published posts
    const publishedPosts = dummyPosts.filter(post => post.status === 'published');
    
    // Calculate total engagement
    const totalEngagement = publishedPosts.reduce((sum, post) => 
      sum + (post.performance?.engagement || 0), 0);
    
    // Calculate total reach
    const totalReach = publishedPosts.reduce((sum, post) => 
      sum + (post.performance?.reach || 0), 0);
    
    // Calculate impressions
    const impressions = publishedPosts.reduce((sum, post) => 
      sum + (post.performance?.impressions || 0), 0);
    
    // Count posts by platform
    const platformCounts = {
      facebook: 0,
      instagram: 0,
      twitter: 0
    };
    
    dummyPosts.forEach(post => {
      post.platforms.forEach(platform => {
        if (platformCounts[platform] !== undefined) {
          platformCounts[platform]++;
        }
      });
    });
    
    // Get recent posts
    const recentPosts = publishedPosts
      .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt))
      .slice(0, 3)
      .map(post => ({
        id: post._id,
        content: post.content,
        platform: post.platforms[0],
        engagement: post.performance.engagement,
        reach: post.performance.reach,
        publishedAt: post.scheduledAt
      }));
    
    // Get upcoming posts
    const upcomingPosts = dummyPosts
      .filter(post => post.status === 'scheduled')
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
      .slice(0, 5)
      .map(post => ({
        id: post._id,
        content: post.content,
        platforms: post.platforms,
        scheduledFor: post.scheduledAt
      }));
    
    return {
      overview: {
        totalFollowers: 12500,
        totalPosts: totalPosts,
        totalEngagement: totalEngagement,
        engagementRate: ((totalEngagement / totalReach) * 100).toFixed(1),
        reach: totalReach,
        impressions: impressions
      },
      recentPosts,
      upcomingPosts,
      platformStats: {
        facebook: { followers: 5200, engagement: 6.8, posts: platformCounts.facebook },
        instagram: { followers: 4800, engagement: 9.2, posts: platformCounts.instagram },
        twitter: { followers: 2500, engagement: 5.5, posts: platformCounts.twitter }
      }
    };
  };
  
  // Sample data - now calculated from our dummy posts
  const [dashboardData] = useState(calculateStatistics());
  
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

  const recentPostsColumns = [
    {
      title: translate('Content'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <div style={{ maxWidth: '250px' }}>
          {text.substring(0, 60)}...
        </div>
      ),
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <div>
          <AntTitle level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
            {translate('Social Media Dashboard')}
          </AntTitle>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            {translate('Monitor your social media performance across all platforms')}
          </Text>
        </div>
        
        <Space>
          <Button 
            icon={<CalendarOutlined />}
            onClick={() => navigate('/social-media/posts')}
          >
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
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <Space>
                      {getPlatformIcon(platform)}
                      <Text strong>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                    </Space>
                    <Text>{stats.followers.toLocaleString()} followers</Text>
                  </div>
                  <Progress
                    percent={stats.engagement * 10}
                    strokeColor={
                      platform === 'facebook' ? '#1877f2' : 
                      platform === 'instagram' ? '#E4405F' : '#1DA1F2'
                    }
                    showInfo={false}
                  />
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '12px', 
                    color: '#6b7280',
                    marginBottom: '16px'
                  }}>
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
              <Button 
                block 
                icon={<PlusOutlined />}
                onClick={() => navigate('/social-media/posts')}
              >
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
          <Card title={translate('Upcoming Posts')} bodyStyle={{ padding: 0 }}>
            <div
              style={{
                height: 320,
                overflowY: 'auto',
                padding: '24px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {dashboardData.upcomingPosts.map(post => (
                <div key={post.id} style={{
                  padding: '12px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  background: '#fff'
                }}>
                  <div style={{ marginBottom: '8px' }}>
                    <Text>{post.content.substring(0, 80)}...</Text>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '12px'
                  }}>
                    <Space>
                      {post.platforms.map(platform => (
                        <span key={platform}>
                          {getPlatformIcon(platform)}
                        </span>
                      ))}
                    </Space>
                    <Text style={{ color: '#6b7280' }}>
                      {new Date(post.scheduledFor).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              ))}
              
              {dashboardData.upcomingPosts.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px',
                  color: '#6b7280'
                }}>
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
              <Button 
                type="link" 
                onClick={() => navigate('/social-media/posts')}
              >
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