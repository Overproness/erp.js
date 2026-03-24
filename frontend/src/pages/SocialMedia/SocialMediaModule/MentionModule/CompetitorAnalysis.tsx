import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Table, 
  Select, 
  Space, 
  Input,
  Button,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  Typography
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  BarChartOutlined,
  RiseOutlined,
  FallOutlined,
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useCompetitorAnalysis } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend
);

const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

const CompetitorAnalysis = () => {
  const translate = useLanguage();
  const { competitors, analytics, isLoading, addCompetitor, removeCompetitor, refreshAnalytics } = useCompetitorAnalysis();
  
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [searchText, setSearchText] = useState('');
  const [newCompetitor, setNewCompetitor] = useState('');
  const prevPeriodRef = useRef('');

  useEffect(() => {
    if (prevPeriodRef.current === selectedPeriod) return;
    prevPeriodRef.current = selectedPeriod;
    refreshAnalytics(selectedPeriod);
  }, [selectedPeriod, refreshAnalytics]);

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const handleAddCompetitor = async () => {
    if (newCompetitor.trim()) {
      try {
        await addCompetitor(newCompetitor.trim());
        setNewCompetitor('');
      } catch (error) {
        console.error('Failed to add competitor');
      }
    }
  };

  const columns = [
    {
      title: translate('Competitor'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src={record.avatar || '/placeholder-avatar.png'}
            alt={text}
            style={{ width: '32px', height: '32px', borderRadius: '50%' }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              @{record.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: translate('Platforms'),
      dataIndex: 'platforms',
      key: 'platforms',
      render: (platforms) => (
        <Space>
          {platforms.map(platform => (
            <span key={platform}>
              {getPlatformIcon(platform)}
            </span>
          ))}
        </Space>
      ),
    },
    {
      title: translate('Followers'),
      dataIndex: 'followers',
      key: 'followers',
      render: (followers) => (
        <div>
          <div style={{ fontWeight: 600 }}>
            {followers.total.toLocaleString()}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: followers.growth >= 0 ? '#52c41a' : '#ff4d4f',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {followers.growth >= 0 ? <RiseOutlined /> : <FallOutlined />}
            {Math.abs(followers.growth)}%
          </div>
        </div>
      ),
    },
    {
      title: translate('Engagement Rate'),
      dataIndex: 'engagementRate',
      key: 'engagementRate',
      render: (rate) => (
        <div>
          <Progress 
            percent={rate * 10} 
            showInfo={false} 
            strokeColor={rate > 5 ? '#52c41a' : rate > 3 ? '#faad14' : '#ff4d4f'}
          />
          <Text style={{ fontSize: '12px' }}>{rate.toFixed(1)}%</Text>
        </div>
      ),
    },
    {
      title: translate('Posts (7d)'),
      dataIndex: 'postsCount',
      key: 'postsCount',
    },
    {
      title: translate('Actions'),
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeCompetitor(record._id)}
        />
      ),
    },
  ];

  // Sample data for charts with unique IDs
  const engagementTrendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Your Brand',
        data: [7.2, 6.8, 8.1, 7.5, 6.9, 8.3, 7.8],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Competitor A',
        data: [5.8, 6.1, 5.9, 6.3, 5.7, 6.0, 6.2],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Competitor B',
        data: [4.2, 4.5, 4.8, 4.1, 4.6, 4.9, 4.3],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const followerComparisonData = {
    labels: ['Your Brand', 'Competitor A', 'Competitor B', 'Competitor C'],
    datasets: [
      {
        label: 'Followers',
        data: [12500, 18200, 8900, 15600],
        backgroundColor: ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {translate('Competitor Analysis')}
            </Title>
            <Text style={{ color: '#6b7280' }}>
              {translate('Track and analyze your competitors\' social media performance')}
            </Text>
          </div>
          
          <Select
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            style={{ width: 120 }}
          >
            <Option value="7d">{translate('Last 7 days')}</Option>
            <Option value="30d">{translate('Last 30 days')}</Option>
            <Option value="90d">{translate('Last 3 months')}</Option>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('Tracked Competitors')}
              value={competitors?.length || 0}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('Avg. Engagement Rate')}
              value={6.8}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('Your Position')}
              value="#2"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={translate('Follower Gap')}
              value={-5700}
              valueStyle={{ color: '#ef4444' }}
              prefix={<FallOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title={translate('Engagement Rate Comparison')}>
            <div style={{ height: '300px' }}>
              <Line
                key="engagement-chart"
                data={engagementTrendData}
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card title={translate('Follower Comparison')}>
            <div style={{ height: '300px' }}>
              <Bar
                key="follower-chart"
                data={followerComparisonData}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Add Competitor */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Input
            placeholder={translate('Enter competitor username or URL')}
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            style={{ flex: 1 }}
            onPressEnter={handleAddCompetitor}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddCompetitor}
          >
            {translate('Add Competitor')}
          </Button>
        </div>
      </Card>

      {/* Competitors Table */}
      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          <Search
            placeholder={translate('Search competitors...')}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            allowClear
          />
        </div>
        
        <Table
          columns={columns}
          dataSource={competitors || []}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} competitors`,
          }}
        />
      </Card>
    </div>
  );
};

export default CompetitorAnalysis;
