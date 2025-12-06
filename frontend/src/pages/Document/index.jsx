import AdvancedSearch from '@/components/AdvancedSearch';
import AiDocumentManagerModal from '@/components/AiAssist/AiDocumentManagerModal';
import AITagSuggestions from '@/components/Document/AITagSuggestions';
import BulkURLImport from '@/components/Document/BulkURLImport';
import ShareDocumentModal from '@/components/Document/ShareDocumentModal';
import { useDocumentStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions'; // Change from crud to erp
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { crud } from '../../redux/crud/actions';
import { selectListItems } from '../../redux/crud/selectors';

const { Title, Text } = Typography;
const { Search } = Input;

export default function Document() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Get documents from Redux store
  const listData = useSelector(selectListItems);

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
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedDocumentForShare, setSelectedDocumentForShare] = useState(null);

  const handleRefreshList = () => {
    dispatch(
      crud.list({
        entity: 'document',
        options: { page: 1, items: 10 },
      })
    );
  };

  // Calculate stats from API data
  const stats = {
    totalDocuments: documentStats?.totalDocuments || 0,
    recentUploads: documentStats?.newThisMonth || 0,
    totalSize: documentStats?.totalSize
      ? `${(documentStats.totalSize / (1024 * 1024)).toFixed(1)} MB`
      : '0 MB',
    categories: documentStats?.byType?.length || 0,
  };

  const handleCreateNew = () => {
    navigate('/document/create');
  };

  const handleSearch = (value) => {
    if (value) {
      // Use list endpoint with search parameter
      dispatch(
        crud.list({
          entity: 'document',
          options: { page: 1, items: 10, search: value },
        })
      );
    } else {
      // Reset to normal list
      dispatch(
        crud.list({
          entity: 'document',
          options: { page: 1, items: 10 },
        })
      );
    }
  };

  const handleShare = (document) => {
    setSelectedDocumentForShare(document);
    setShareModalVisible(true);
  };

  // Fetch documents on mount
  useEffect(() => {
    dispatch(
      crud.list({
        entity: 'document',
        options: { page: 1, items: 10 },
      })
    );
  }, [dispatch]);

  // Get document list and pagination from Redux
  // Backend returns: result.items (array) and result.pagination (object)
  const documentList = listData?.result?.items?.items || listData?.result?.items || [];
  const backendPagination = listData?.result?.items?.pagination || listData?.result?.pagination;
  const pagination = {
    current: backendPagination?.page || backendPagination?.current || 1,
    pageSize: backendPagination?.limit || backendPagination?.pageSize || 10,
    total: backendPagination?.total || 0,
  };
  const isLoading = listData?.isLoading || false;

  // console.log('=== FRONTEND DOCUMENT LIST DEBUG ===');
  // console.log('listData:', listData);
  // console.log('listData.result:', listData?.result);
  // console.log('documentList:', documentList);
  // console.log('pagination:', pagination);
  // console.log('====================================');

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
          <Tooltip title={translate('Share')}>
            <Button type="text" icon={<ShareAltOutlined />} onClick={() => handleShare(record)} />
          </Tooltip>
          <Tooltip title={translate('Delete')}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => {
                Modal.confirm({
                  title: translate('Delete Document'),
                  content: translate('Are you sure you want to delete this document?'),
                  okText: translate('Yes'),
                  okType: 'danger',
                  cancelText: translate('No'),
                  onOk: () => {
                    dispatch(
                      crud.delete({
                        entity: 'document',
                        id: record._id,
                      })
                    );
                  },
                });
              }}
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
            {/* AI Tag Suggestions */}
            <AITagSuggestions selectedDocuments={selectedDocuments} onSuccess={handleRefreshList} />

            {/* Bulk URL Import */}
            <BulkURLImport onSuccess={handleRefreshList} />

            {/* <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
              style={{
                borderRadius: '10px',
                height: '48px',
                paddingLeft: '20px',
                paddingRight: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: '600',
              }}
            >
              {translate('Upload Document')}
            </Button> */}
            {/* <Button
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
            </Button> */}
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
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
              style={{ borderRadius: '8px' }}
            >
              {translate('Upload')}
            </Button>
            <Button
              icon={<FileSearchOutlined />}
              onClick={() => setAdvancedSearchVisible(true)}
              style={{ borderRadius: '8px' }}
            >
              {translate('Advanced Search')}
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
                dispatch(
                  crud.list({
                    entity: 'document',
                    options: { page, items: pageSize },
                  })
                );
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

      {/* Share Document Modal */}
      <ShareDocumentModal
        visible={shareModalVisible}
        onCancel={() => {
          setShareModalVisible(false);
          setSelectedDocumentForShare(null);
        }}
        documentId={selectedDocumentForShare?._id}
        documentTitle={selectedDocumentForShare?.title || 'Document'}
      />

      {/* Advanced Search Modal */}
      <Modal
        title={translate('Advanced Document Search')}
        open={advancedSearchVisible}
        onCancel={() => setAdvancedSearchVisible(false)}
        footer={null}
        width={1000}
        centered
        styles={{
          body: {
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            overflowX: 'hidden',
          },
        }}
      >
        <AdvancedSearch entity="document" />
      </Modal>
    </div>
  );
}
