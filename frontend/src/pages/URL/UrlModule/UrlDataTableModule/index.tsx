import apolloClient from '@/graphql/client';
import { DELETE_URL, GET_URLS, URL_SUMMARY } from '@/graphql/operations/url';
import useLanguage from '@/locale/useLanguage';
import { LinkOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useColumns from './columns';

const { Option } = Select;
const { Title, Text } = Typography;

export default function UrlDataTableModule({ config, extra }) {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const loadedRef = useRef(false);
  const [dataSource, setDataSource] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'active',
  });
  const [summary, setSummary] = useState({
    totalUrls: 0,
    activeUrls: 0,
    totalClicks: 0,
  });

  // Handle delete operation
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      console.log('Deleting URL with ID:', id);

      // Use the correct format for the delete request
      const { data: delData } = await apolloClient.mutate({
        mutation: DELETE_URL,
        variables: { id },
      });
      const response = delData.urlDelete;

      if (response.success) {
        message.success(translate('URL deleted successfully'));
        fetchData(); // Refresh the data
        fetchSummary(); // Refresh summary stats
      } else {
        message.error(response.message || translate('Failed to delete URL'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error(translate('An error occurred while deleting the URL'));
    } finally {
      setLoading(false);
    }
  };

  const columns = useColumns({ onDelete: handleDelete });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters,
      };

      const { data } = await apolloClient.query({
        query: GET_URLS,
        variables: params,
        fetchPolicy: 'cache-first',
      });
      const response = data.urlList;

      if (response.success) {
        setDataSource(response.result || []);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination?.count || 0,
        }));
      } else {
        message.error(response.message || translate('Failed to fetch URLs'));
      }
    } catch (error) {
      console.error('Fetch error:', error);
      message.error(translate('An error occurred while fetching data'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await apolloClient.query({ query: URL_SUMMARY, fetchPolicy: 'cache-first' });
      const response = data.urlSummary;
      if (response.success) {
        setSummary(response.result);
      }
    } catch (error) {
      console.error('Summary fetch error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize, filters]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchSummary();
  }, []);

  const handleTableChange = (paginationInfo, filtersInfo, sorter) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize,
    }));
  };

  const handleSearch = (value) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleRefresh = () => {
    fetchData();
    fetchSummary();
  };

  return (
    <div>
      {/* Header Section with Title and Description */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
          {translate('URL Manager')}
        </Title>
        <Text style={{ color: '#6b7280', fontSize: '16px' }}>
          {translate('Create, manage, and track your shortened URLs with comprehensive analytics')}
        </Text>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title={translate('Total URLs')}
              value={summary.totalUrls}
              precision={0}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={translate('Active URLs')}
              value={summary.activeUrls}
              precision={0}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title={translate('Total Clicks')}
              value={summary.totalClicks}
              precision={0}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Data Table */}
      <Card
        title={config.dataTableTitle || translate('URLs')}
        extra={
          <Space>
            {extra}
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
              {translate('Refresh')}
            </Button>
            {/* New button for A/B Testing */}
            <Button
              icon={<LinkOutlined />}
              onClick={() => navigate('/url/ab-testing')}
              style={{
                background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#333',
              }}
            >
              {translate('A/B Testing')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/url/create')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '6px',
              }}
            >
              {translate('Create URL')}
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder={translate('Search URLs...')}
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder={translate('Status')}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
            >
              <Option value="">{translate('All Statuses')}</Option>
              <Option value="active">{translate('Active')}</Option>
              <Option value="inactive">{translate('Inactive')}</Option>
              <Option value="expired">{translate('Expired')}</Option>
            </Select>
          </Col>
        </Row>

        {/* Data Table */}
        <Table
          columns={columns}
          dataSource={dataSource}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          rowKey="_id"
          scroll={{ x: 1200 }}
          size="middle"
        />
      </Card>
    </div>
  );
}
