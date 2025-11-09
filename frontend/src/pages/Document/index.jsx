import AdvancedSearch from '@/components/AdvancedSearch';
import AiDocumentManagerModal from '@/components/AiAssist/AiDocumentManagerModal';
import SearchResultsDisplay from '@/components/SearchResultsDisplay';
import { useDocumentStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions'; // Change from crud to erp
import {
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  FileOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FilterOutlined,
  FormOutlined,
  PlusOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Search } = Input;

export default function Document() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Use dynamic statistics from API
  const {
    data: documentStats,
    loading: statsLoading,
    error: statsError,
  } = useDocumentStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // State management
  const [activeTab, setActiveTab] = useState('all');
  const [searchValue, setSearchValue] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  // Calculate stats from API data
  const stats = {
    totalDocuments: documentStats?.totalDocuments || 0,
    recentUploads: documentStats?.newThisMonth || 0,
    totalSize: documentStats?.totalSize
      ? `${(documentStats.totalSize / (1024 * 1024)).toFixed(1)} MB`
      : '0 MB',
    categories: documentStats?.byType?.length || 0,
  };

  // Sample document types for filtering
  const documentTypes = ['PDF', 'Word', 'Excel', 'Image', 'Text', 'Other'];

  const handleCreateNew = () => {
    navigate('/document/create');
  };

  const handleSearch = (value) => {
    setSearchValue(value);
    // Implement search logic here
  };

  // Sample data - replace with actual data from Redux
  const [documentList, setDocumentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const columns = [
    {
      title: translate('Document'),
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.description}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: translate('Type'),
      dataIndex: 'documentType',
      key: 'documentType',
      render: (type) => <Tag color="blue">{type || 'Unknown'}</Tag>,
    },
    {
      title: translate('Size'),
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size) => {
        if (!size) return '-';
        const mb = (size / (1024 * 1024)).toFixed(2);
        return `${mb} MB`;
      },
    },
    {
      title: translate('Upload Date'),
      dataIndex: 'created',
      key: 'created',
      render: (date) => dayjs(date).format('MMM D, YYYY'),
      sorter: true,
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title={translate('View')}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/document/read/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title={translate('Edit')}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/document/update/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title={translate('Download')}>
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => dispatch(erp.downloadDocument({ entity: 'document', id: record._id }))}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedDocuments,
    onChange: (selectedRowKeys) => {
      setSelectedDocuments(selectedRowKeys);
    },
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c' }}>
              {translate('Documents')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Manage your documents, files, and digital assets
            </Text>
          </div>
          <Space>
            <Button
              icon={<RobotOutlined />}
              onClick={() => setAiModalVisible(true)}
              style={{
                borderRadius: '10px',
                height: '48px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              {translate('AI Assistant')}
            </Button>
          </Space>
        </div>

        {/* Stats Row */}
        {statsLoading ? (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#6b7280' }}>
                  {translate('Loading statistics...')}
                </div>
              </Card>
            </Col>
          </Row>
        ) : statsError ? (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center', padding: '20px', borderColor: '#f5222d' }}>
                <div style={{ color: '#f5222d', marginBottom: '8px' }}>
                  {translate('Error loading statistics')}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{statsError}</div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Total Documents')}
                  value={stats.totalDocuments}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<FileOutlined style={{ color: '#8b45ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Recent Uploads')}
                  value={stats.recentUploads}
                  valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                  prefix={<PlusOutlined style={{ color: '#a855f7' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Total Size')}
                  value={stats.totalSize}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<FileTextOutlined style={{ color: '#6366f1' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Categories')}
                  value={stats.categories}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<FormOutlined style={{ color: '#10b981' }} />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Search and Filter Section */}
      <Card
        style={{
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.06)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <Search
            placeholder={translate('Search documents...')}
            allowClear
            onSearch={handleSearch}
            onChange={(e) => !e.target.value && handleSearch('')}
            style={{ maxWidth: '400px' }}
            size="large"
          />

          <Space>
            <Button
              icon={<FileSearchOutlined />}
              onClick={() => setAdvancedSearchVisible(true)}
              style={{ borderRadius: '8px' }}
            >
              {translate('Advanced Search')}
            </Button>
            <Button icon={<FilterOutlined />} style={{ borderRadius: '8px' }}>
              {translate('Filter')}
            </Button>
            <Button icon={<ExportOutlined />} style={{ borderRadius: '8px' }}>
              {translate('Export')}
            </Button>
          </Space>
        </div>

        {/* Document Table */}
        {documentList.length > 0 ? (
          <Table
            columns={columns}
            dataSource={documentList}
            loading={isLoading}
            rowSelection={rowSelection}
            pagination={{
              current: pagination?.current || 1,
              pageSize: pagination?.pageSize || 10,
              total: pagination?.total || 0,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} documents`,
              onChange: (page, pageSize) => {
                // Handle pagination
              },
            }}
            rowKey="_id"
            style={{
              background: '#fff',
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Title level={4} style={{ color: '#6b7280' }}>
                  {translate('No documents found')}
                </Title>
                <Text style={{ color: '#9ca3af' }}>
                  {translate('Get started by uploading your first document')}
                </Text>
              </div>
            }
            style={{ padding: '60px 0' }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNew}>
              {translate('Upload Document')}
            </Button>
          </Empty>
        )}
      </Card>

      {/* AI Assistant Modal */}
      <AiDocumentManagerModal visible={aiModalVisible} onCancel={() => setAiModalVisible(false)} />

      {/* Advanced Search Modal */}
      <Modal
        title={translate('Advanced Document Search')}
        open={advancedSearchVisible}
        onCancel={() => setAdvancedSearchVisible(false)}
        footer={null}
        width={800}
      >
        <AdvancedSearch
          onSearch={(results) => {
            setSearchResults(results);
            setAdvancedSearchVisible(false);
          }}
        />
      </Modal>

      {/* Search Results Display */}
      {searchResults && (
        <SearchResultsDisplay results={searchResults} onClose={() => setSearchResults(null)} />
      )}
    </div>
  );
}