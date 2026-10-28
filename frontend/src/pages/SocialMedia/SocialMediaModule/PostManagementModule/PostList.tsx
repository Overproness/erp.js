import { usePostManagement } from '@/hooks/useSocialMedia';
import useLanguage from '@/locale/useLanguage';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FacebookOutlined,
  InstagramOutlined,
  SearchOutlined,
  TwitterOutlined,
} from '@/components/icons';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PostList = ({ onEditPost, onPreviewPost }) => {
  const translate = useLanguage();
  const { posts, isLoading, refreshPosts, deletePost } = usePostManagement();

  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    if (typeof refreshPosts === 'function') {
      refreshPosts();
    }
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const postsToFilter = Array.isArray(posts) ? posts : [];
    let filtered = [...postsToFilter];

    // Apply search
    if (searchText) {
      filtered = filtered.filter((post) =>
        post.content.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(
        (post) => post.platforms && post.platforms.includes(platformFilter)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((post) => post.status === statusFilter);
    }

    // Apply date filter
    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((post) => {
        const postDate = dayjs(post.scheduledAt);
        return postDate.isAfter(dateRange[0]) && postDate.isBefore(dateRange[1]);
      });
    }

    setFilteredPosts(filtered);
  }, [posts, searchText, platformFilter, statusFilter, dateRange]);

  const handleDelete = (postId) => {
    // Implementation for delete functionality
    console.log('Delete post:', postId);
  };

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

  const columns = [
    {
      title: translate('Content'),
      dataIndex: 'content',
      key: 'content',
      render: (text) => (
        <div style={{ maxWidth: '300px' }}>
          {text.substring(0, 100)}
          {text.length > 100 && '...'}
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
            <Tooltip title={platform} key={platform}>
              {getPlatformIcon(platform)}
            </Tooltip>
          ))}
        </Space>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{translate(status)}</Tag>,
    },
    {
      title: translate('Scheduled Date'),
      dataIndex: 'scheduledAt',
      key: 'scheduledAt',
      render: (date) => (date ? dayjs(date).format('MMM D, YYYY h:mm A') : '-'),
      sorter: (a, b) => dayjs(a.scheduledAt).unix() - dayjs(b.scheduledAt).unix(),
    },
    {
      title: translate('Performance'),
      key: 'performance',
      render: (_, record) =>
        record.status === 'published' ? (
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Tooltip title={`${record.performance.engagement} engagements`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '80px', fontSize: '12px' }}>Engagement:</span>
                <Progress
                  percent={Math.min(100, (record.performance.engagement / 2000) * 100)}
                  size="small"
                  showInfo={false}
                  strokeColor="#1890ff"
                />
              </div>
            </Tooltip>
            <Tooltip title={`${record.performance.reach} reach`}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '80px', fontSize: '12px' }}>Reach:</span>
                <Progress
                  percent={Math.min(100, (record.performance.reach / 10000) * 100)}
                  size="small"
                  showInfo={false}
                  strokeColor="#52c41a"
                />
              </div>
            </Tooltip>
          </Space>
        ) : (
          <span>-</span>
        ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEditPost(record)}
            size="small"
          />
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onPreviewPost(record)}
            size="small"
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
            size="small"
            danger
          />
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input
            placeholder={translate('Search posts')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder={translate('Platform')}
            style={{ width: 120 }}
            value={platformFilter}
            onChange={setPlatformFilter}
          >
            <Option value="all">{translate('All Platforms')}</Option>
            <Option value="facebook">Facebook</Option>
            <Option value="instagram">Instagram</Option>
            <Option value="twitter">Twitter</Option>
            <Option value="linkedin">LinkedIn</Option>
          </Select>
          <Select
            placeholder={translate('Status')}
            style={{ width: 120 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">{translate('All Status')}</Option>
            <Option value="draft">{translate('Draft')}</Option>
            <Option value="scheduled">{translate('Scheduled')}</Option>
            <Option value="published">{translate('Published')}</Option>
            <Option value="failed">{translate('Failed')}</Option>
          </Select>
        </Space>

        <RangePicker
          value={dateRange}
          onChange={setDateRange}
          placeholder={[translate('Start Date'), translate('End Date')]}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredPosts}
        rowKey="_id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default PostList;
