import { useMentions } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import {
  FacebookOutlined,
  FrownOutlined,
  InstagramOutlined,
  MehOutlined,
  MessageOutlined,
  RollbackOutlined,
  SearchOutlined,
  SmileOutlined,
  TwitterOutlined,
} from '@/components/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  message,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const MentionList = ({ onViewMention }) => {
  const translate = useLanguage();
  const { mentions, isLoading, refreshMentions, trackKeywords, addNote } = useMentions();

  const [filteredMentions, setFilteredMentions] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  // Add dummy mentions data
  const [dummyMentions] = useState([
    {
      _id: '1',
      content:
        "Your product is amazing! I've been using it for a month and already seeing great results.",
      author: {
        name: 'Sarah Johnson',
        username: 'sarahjohnson',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      },
      platform: 'instagram',
      sentiment: 'positive',
      status: 'new',
      createdAt: '2024-01-14T08:45:00Z',
    },
    {
      _id: '2',
      content: "Can someone help me with setting up this tool? The instructions aren't clear.",
      author: {
        name: 'Mike Peters',
        username: 'mikepeters',
        avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      },
      platform: 'twitter',
      sentiment: 'neutral',
      status: 'responded',
      createdAt: '2024-01-13T16:30:00Z',
    },
    {
      _id: '3',
      content:
        "I've been waiting for customer service to respond for 3 days now. Terrible support!",
      author: {
        name: 'Alex Rivera',
        username: 'alexrivera',
        avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
      },
      platform: 'facebook',
      sentiment: 'negative',
      status: 'new',
      createdAt: '2024-01-12T11:20:00Z',
    },
    {
      _id: '4',
      content: "Just discovered this company and love what they're doing. Keep up the good work!",
      author: {
        name: 'Emma Wilson',
        username: 'emmawilson',
        avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
      },
      platform: 'instagram',
      sentiment: 'positive',
      status: 'new',
      createdAt: '2024-01-11T14:15:00Z',
    },
    {
      _id: '5',
      content: 'The latest update seems to have fixed most of the bugs I was experiencing before.',
      author: {
        name: 'David Chen',
        username: 'davidchen',
        avatar: 'https://randomuser.me/api/portraits/men/91.jpg',
      },
      platform: 'twitter',
      sentiment: 'positive',
      status: 'responded',
      createdAt: '2024-01-10T09:40:00Z',
    },
    {
      _id: '6',
      content: 'This tool is way too complicated for beginners. Need a simpler interface.',
      author: {
        name: 'Jessica Miller',
        username: 'jessicamiller',
        avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      },
      platform: 'facebook',
      sentiment: 'negative',
      status: 'pending',
      createdAt: '2024-01-09T13:25:00Z',
    },
    {
      _id: '7',
      content: 'Does anyone know if this works with the latest iOS update?',
      author: {
        name: 'Ryan Taylor',
        username: 'ryantaylor',
        avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
      },
      platform: 'twitter',
      sentiment: 'neutral',
      status: 'new',
      createdAt: '2024-01-08T16:55:00Z',
    },
    {
      _id: '8',
      content: 'The analytics feature in your product saved me hours of work last week!',
      author: {
        name: 'Olivia Garcia',
        username: 'oliviagarcia',
        avatar: 'https://randomuser.me/api/portraits/women/17.jpg',
      },
      platform: 'instagram',
      sentiment: 'positive',
      status: 'responded',
      createdAt: '2024-01-07T10:35:00Z',
    },
  ]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (typeof refreshMentions === 'function') {
      refreshMentions();
    } else {
      setFilteredMentions(dummyMentions);
    }
  }, []);

  useEffect(() => {
    // Ensure mentions is always an array
    let dataToFilter = Array.isArray(mentions) && mentions.length > 0 ? mentions : dummyMentions;
    let filtered = [...dataToFilter];

    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(
        (mention) =>
          mention.content?.toLowerCase().includes(searchText.toLowerCase()) ||
          mention.author?.name?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply sentiment filter
    if (sentimentFilter !== 'all') {
      filtered = filtered.filter((mention) => mention.sentiment === sentimentFilter);
    }

    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter((mention) => mention.platform === platformFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((mention) => mention.status === statusFilter);
    }

    // Apply date filter
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((mention) => {
        const mentionDate = dayjs(mention.createdAt);
        return mentionDate.isAfter(dateRange[0]) && mentionDate.isBefore(dateRange[1]);
      });
    }

    setFilteredMentions(filtered);
  }, [mentions, searchText, sentimentFilter, platformFilter, statusFilter, dateRange]);

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
    };
    return icons[platform];
  };

  const getSentimentIcon = (sentiment) => {
    const icons = {
      positive: <SmileOutlined style={{ color: '#52c41a' }} />,
      negative: <FrownOutlined style={{ color: '#ff4d4f' }} />,
      neutral: <MehOutlined style={{ color: '#faad14' }} />,
    };
    return icons[sentiment] || <MehOutlined style={{ color: '#d9d9d9' }} />;
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: 'green',
      negative: 'red',
      neutral: 'orange',
    };
    return colors[sentiment] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'blue',
      responded: 'green',
      ignored: 'red',
      pending: 'orange',
    };
    return colors[status] || 'default';
  };

  const handleRespond = async (mention) => {
    try {
      // This would open a response modal
      message.info('Response feature coming soon');
    } catch (error) {
      message.error('Failed to respond to mention');
    }
  };

  const columns = [
    {
      title: translate('Author'),
      key: 'author',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Avatar src={record.author.avatar} style={{ backgroundColor: '#8b5cf6' }}>
            {record.author.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, fontSize: '13px' }}>{record.author.name}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>@{record.author.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: translate('Content'),
      dataIndex: 'content',
      key: 'content',
      render: (content) => (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ marginBottom: '8px' }}>
            {content.substring(0, 100)}
            {content.length > 100 && '...'}
          </div>
        </div>
      ),
    },
    {
      title: translate('Platform'),
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform) => <Tooltip title={platform}>{getPlatformIcon(platform)}</Tooltip>,
    },
    {
      title: translate('Sentiment'),
      dataIndex: 'sentiment',
      key: 'sentiment',
      width: 120,
      render: (sentiment) => (
        <Tag color={getSentimentColor(sentiment)} icon={getSentimentIcon(sentiment)}>
          {translate(sentiment)}
        </Tag>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={getStatusColor(status)}>{translate(status)}</Tag>,
    },
    {
      title: translate('Date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => (
        <div style={{ fontSize: '12px' }}>
          {dayjs(date).format('MMM D, YYYY')}
          <br />
          {dayjs(date).format('h:mm A')}
        </div>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title={translate('View Details')}>
            <Button
              type="text"
              size="small"
              icon={<MessageOutlined />}
              onClick={() => onViewMention(record)}
            />
          </Tooltip>

          <Tooltip title={translate('Respond')}>
            <Button
              type="text"
              size="small"
              icon={<RollbackOutlined />}
              onClick={() => onViewMention(record)}
              disabled={record.status === 'responded'}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Calculate stats - ensure filteredMentions is always an array
  const stats = {
    total: Array.isArray(filteredMentions) ? filteredMentions.length : 0,
    positive: Array.isArray(filteredMentions)
      ? filteredMentions.filter((m) => m.sentiment === 'positive').length
      : 0,
    negative: Array.isArray(filteredMentions)
      ? filteredMentions.filter((m) => m.sentiment === 'negative').length
      : 0,
    neutral: Array.isArray(filteredMentions)
      ? filteredMentions.filter((m) => m.sentiment === 'neutral').length
      : 0,
    responded: Array.isArray(filteredMentions)
      ? filteredMentions.filter((m) => m.status === 'responded').length
      : 0,
  };

  const sentimentScore =
    stats.total > 0 ? (((stats.positive - stats.negative) / stats.total) * 100).toFixed(1) : 0;

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Mentions')}
              value={stats.total}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Sentiment Score')}
              value={sentimentScore}
              suffix="%"
              prefix={getSentimentIcon(
                sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral'
              )}
              valueStyle={{
                color: sentimentScore > 0 ? '#52c41a' : sentimentScore < 0 ? '#ff4d4f' : '#faad14',
              }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Response Rate')}
              value={stats.total > 0 ? ((stats.responded / stats.total) * 100).toFixed(1) : 0}
              suffix="%"
              prefix={<RollbackOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Positive Mentions')}
              value={stats.positive}
              prefix={<SmileOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Sentiment Distribution */}
      <Card style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '16px' }}>{translate('Sentiment Distribution')}</h4>
        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={stats.total > 0 ? (stats.positive / stats.total) * 100 : 0}
                format={() => stats.positive}
                strokeColor="#52c41a"
                size={80}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>{translate('Positive')}</div>
            </div>
          </Col>

          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={stats.total > 0 ? (stats.neutral / stats.total) * 100 : 0}
                format={() => stats.neutral}
                strokeColor="#faad14"
                size={80}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>{translate('Neutral')}</div>
            </div>
          </Col>

          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={stats.total > 0 ? (stats.negative / stats.total) * 100 : 0}
                format={() => stats.negative}
                strokeColor="#ff4d4f"
                size={80}
              />
              <div style={{ marginTop: '8px', fontSize: '12px' }}>{translate('Negative')}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={6}>
            <Search
              placeholder={translate('Search mentions...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>

          <Col xs={24} sm={4}>
            <Select
              value={sentimentFilter}
              onChange={setSentimentFilter}
              style={{ width: '100%' }}
              placeholder={translate('Sentiment')}
            >
              <Option value="all">{translate('All Sentiments')}</Option>
              <Option value="positive">{translate('Positive')}</Option>
              <Option value="neutral">{translate('Neutral')}</Option>
              <Option value="negative">{translate('Negative')}</Option>
            </Select>
          </Col>

          <Col xs={24} sm={4}>
            <Select
              value={platformFilter}
              onChange={setPlatformFilter}
              style={{ width: '100%' }}
              placeholder={translate('Platform')}
            >
              <Option value="all">{translate('All Platforms')}</Option>
              <Option value="facebook">
                <Space>
                  <FacebookOutlined />
                  Facebook
                </Space>
              </Option>
              <Option value="instagram">
                <Space>
                  <InstagramOutlined />
                  Instagram
                </Space>
              </Option>
              <Option value="twitter">
                <Space>
                  <TwitterOutlined />
                  Twitter
                </Space>
              </Option>
            </Select>
          </Col>

          <Col xs={24} sm={4}>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              placeholder={translate('Status')}
            >
              <Option value="all">{translate('All Status')}</Option>
              <Option value="new">{translate('New')}</Option>
              <Option value="responded">{translate('Responded')}</Option>
              <Option value="ignored">{translate('Ignored')}</Option>
              <Option value="pending">{translate('Pending')}</Option>
            </Select>
          </Col>

          <Col xs={24} sm={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={[translate('Start Date'), translate('End Date')]}
            />
          </Col>
        </Row>
      </Card>

      {/* Mentions Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={Array.isArray(filteredMentions) ? filteredMentions : []}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} mentions`,
          }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default MentionList;
