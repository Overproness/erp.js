import dummyPosts from '@/data/dummyPostsData';
import { usePostManagement } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import {
  FacebookOutlined,
  InstagramOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
  TwitterOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Calendar,
  Card,
  List,
  Modal,
  Radio,
  Select,
  Space,
  Tag,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

const PostCalendar = ({ onEditPost, onCreatePost }) => {
  const translate = useLanguage();
  const { posts, isLoading, refreshPosts } = usePostManagement();
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDatePosts, setSelectedDatePosts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [viewMode, setViewMode] = useState('month');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const loadedRef = useRef(false);
  // Use dummy data or API data based on what's available
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (typeof refreshPosts === 'function') {
      refreshPosts();
    }
  }, []);

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: <FacebookOutlined style={{ color: '#1877f2' }} />,
      instagram: <InstagramOutlined style={{ color: '#E4405F' }} />,
      twitter: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
      linkedin: <i className="fab fa-linkedin" style={{ color: '#0A66C2' }} />,
    };
    return icons[platform];
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      scheduled: 'processing',
      published: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  // Get posts for a specific date
  const getPostsForDate = (date) => {
    // Apply filters to posts
    const postsToUse = Array.isArray(posts) && posts.length > 0 ? posts : dummyPosts;
    let filteredPosts = [...postsToUse];

    // Apply platform filter
    if (filterPlatform !== 'all') {
      filteredPosts = filteredPosts.filter(
        (post) => post.platforms && post.platforms.includes(filterPlatform)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filteredPosts = filteredPosts.filter((post) => post.status === filterStatus);
    }

    // Filter by date
    return filteredPosts.filter((post) => {
      if (!post.scheduledAt) return false;
      return dayjs(post.scheduledAt).format('YYYY-MM-DD') === date.format('YYYY-MM-DD');
    });
  };

  // Calendar cell renderer
  const dateCellRender = (value) => {
    const postsForDate = getPostsForDate(value);

    if (postsForDate.length === 0) return null;

    // Group posts by platform for better visualization
    const platforms = {};
    postsForDate.forEach((post) => {
      post.platforms.forEach((platform) => {
        platforms[platform] = (platforms[platform] || 0) + 1;
      });
    });

    return (
      <div style={{ fontSize: '12px' }}>
        {postsForDate.slice(0, 2).map((post, index) => (
          <div key={post._id} style={{ marginBottom: '2px' }}>
            <Badge
              status={getStatusColor(post.status)}
              text={<span style={{ fontSize: '11px' }}>{post.content.substring(0, 15)}...</span>}
            />
          </div>
        ))}

        {/* Show platform icons for quick overview */}
        {postsForDate.length > 0 && (
          <div style={{ display: 'flex', marginTop: '2px' }}>
            {Object.keys(platforms).map((platform) => (
              <span key={platform} style={{ marginRight: '4px' }}>
                {getPlatformIcon(platform)}
                {platforms[platform] > 1 && (
                  <sup style={{ fontSize: '9px' }}>{platforms[platform]}</sup>
                )}
              </span>
            ))}
          </div>
        )}

        {postsForDate.length > 2 && (
          <div style={{ fontSize: '10px', color: '#6b7280' }}>+{postsForDate.length - 2} more</div>
        )}
      </div>
    );
  };

  // Handle date selection
  const onSelect = (date) => {
    const postsForDate = getPostsForDate(date);
    setSelectedDate(date);
    setSelectedDatePosts(postsForDate);
    if (postsForDate.length > 0) {
      setModalVisible(true);
    } else {
      // If no posts for this date, offer to create one
      Modal.confirm({
        title: translate('No posts scheduled for this date'),
        content:
          translate('Would you like to create a new post for ') + date.format('MMMM D, YYYY') + '?',
        onOk: () => {
          onCreatePost(date);
        },
      });
    }
  };

  // Navigation functions
  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'));
  };

  const handleToday = () => {
    setCurrentMonth(dayjs());
  };

  // Handle creating post for specific date
  const handleCreateForDate = () => {
    setModalVisible(false);
    onCreatePost(selectedDate);
  };

  return (
    <div>
      <Card
        title={translate('Post Calendar')}
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onCreatePost()}>
              {translate('Create Post')}
            </Button>
          </Space>
        }
        style={{ minHeight: '600px' }}
      >
        {/* Calendar Navigation and Filters */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '16px',
            alignItems: 'center',
          }}
        >
          {/* Navigation */}
          <Space>
            <Button icon={<LeftOutlined />} onClick={handlePreviousMonth} />
            <Button>{currentMonth.format('MMMM YYYY')}</Button>
            <Button icon={<RightOutlined />} onClick={handleNextMonth} />
            <Button onClick={handleToday}>{translate('Today')}</Button>
          </Space>

          {/* View Mode and Filters */}
          <Space>
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              size="small"
            >
              <Radio.Button value="month">{translate('Month')}</Radio.Button>
              <Radio.Button value="week">{translate('Week')}</Radio.Button>
            </Radio.Group>

            <Select
              value={filterPlatform}
              onChange={setFilterPlatform}
              style={{ width: 120 }}
              placeholder={translate('Platform')}
              size="small"
            >
              <Select.Option value="all">{translate('All Platforms')}</Select.Option>
              <Select.Option value="facebook">
                <Space>
                  <FacebookOutlined />
                  Facebook
                </Space>
              </Select.Option>
              <Select.Option value="instagram">
                <Space>
                  <InstagramOutlined />
                  Instagram
                </Space>
              </Select.Option>
              <Select.Option value="twitter">
                <Space>
                  <TwitterOutlined />
                  Twitter
                </Space>
              </Select.Option>
            </Select>

            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 120 }}
              placeholder={translate('Status')}
              size="small"
            >
              <Select.Option value="all">{translate('All Status')}</Select.Option>
              <Select.Option value="draft">{translate('Draft')}</Select.Option>
              <Select.Option value="scheduled">{translate('Scheduled')}</Select.Option>
              <Select.Option value="published">{translate('Published')}</Select.Option>
              <Select.Option value="failed">{translate('Failed')}</Select.Option>
            </Select>
          </Space>
        </div>

        <Calendar
          dateCellRender={dateCellRender}
          onSelect={onSelect}
          value={currentMonth}
          mode={viewMode}
          onPanelChange={(date, mode) => {
            setCurrentMonth(date);
            setViewMode(mode);
          }}
          style={{ minHeight: '500px' }}
        />
      </Card>

      {/* Date Details Modal */}
      <Modal
        title={
          selectedDate
            ? `${translate('Posts for')} ${selectedDate.format('MMMM D, YYYY')}`
            : translate('Post Details')
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            {translate('Close')}
          </Button>,
          <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreateForDate}>
            {translate('Create New Post')}
          </Button>,
        ]}
        width={700}
      >
        <List
          dataSource={selectedDatePosts}
          renderItem={(post) => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    setModalVisible(false);
                    onEditPost(post);
                  }}
                >
                  {translate('Edit')}
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <div>
                    {post.platforms.map((platform) => (
                      <Avatar
                        key={platform}
                        size="small"
                        icon={getPlatformIcon(platform)}
                        style={{
                          backgroundColor: 'transparent',
                          marginRight: '4px',
                        }}
                      />
                    ))}
                  </div>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{post.content.substring(0, 60)}...</span>
                    <Tag color={getStatusColor(post.status)}>{translate(post.status)}</Tag>
                  </div>
                }
                description={
                  <Space direction="vertical" size="small">
                    <div>
                      {translate('Scheduled for')}: {dayjs(post.scheduledAt).format('h:mm A')}
                    </div>
                    <Space wrap>
                      {post.platforms.map((platform) => (
                        <Tag key={platform} icon={getPlatformIcon(platform)}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </Tag>
                      ))}
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default PostCalendar;
