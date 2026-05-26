import useLanguage from '@/locale/useLanguage';
import { FileSearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  DatePicker,
  Form,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Typography,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function AuditTrailViewer({ documentId, visible, onClose, title = 'Audit Trail' }) {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [auditData, setAuditData] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filterForm] = Form.useForm();
  const [filterVisible, setFilterVisible] = useState(false);

  // Action type to color mapping
  const actionColors = {
    created: 'green',
    updated: 'blue',
    deleted: 'red',
    viewed: 'cyan',
    downloaded: 'purple',
    edited: 'orange',
    signed: 'magenta',
    reverted: 'gold',
    annotated: 'geekblue',
    compliance_checked: 'lime',
    version_created: 'volcano',
  };

  // Load audit trail data
  const loadAuditTrail = async (page = 1, filters = {}) => {
    if (!documentId) return;
    setLoading(true);

    try {
      const request = (await import('@/request/request')).default;
      const response = await request.getAuditTrail({
        entity: 'document',
        id: documentId,
        page,
        limit: pagination.pageSize,
        filter: filters,
      });

      if (response && response.success) {
        setAuditData(response.result);
        setPagination({
          ...pagination,
          current: page,
          total: response.pagination?.total || 0,
        });
      }
    } catch (error) {
      console.error('Error loading audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts or document ID changes
  useEffect(() => {
    if (visible && documentId) {
      loadAuditTrail(1);
    }
  }, [visible, documentId]);

  // Handle table pagination
  const handleTableChange = (paginationParams) => {
    loadAuditTrail(paginationParams.current, getFilterValues());
  };

  // Get current filter values from form
  const getFilterValues = () => {
    const values = filterForm.getFieldsValue();
    const filters = {};

    if (values.actions && values.actions.length > 0) {
      filters.actions = values.actions;
    }

    if (values.dateRange && values.dateRange.length === 2) {
      filters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      filters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }

    return filters;
  };

  // Apply filters
  const handleApplyFilters = () => {
    const filters = getFilterValues();
    loadAuditTrail(1, filters);
    setFilterVisible(false);
  };

  // Reset filters
  const handleResetFilters = () => {
    filterForm.resetFields();
    loadAuditTrail(1, {});
    setFilterVisible(false);
  };

  // Format object details for display
  const formatDetails = (details) => {
    if (!details) return 'No details available';

    try {
      return JSON.stringify(details, null, 2);
    } catch (e) {
      return String(details);
    }
  };

  // Table columns
  const columns = [
    {
      title: translate('Action'),
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={actionColors[action] || 'default'}>
          {action.replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Created', value: 'created' },
        { text: 'Updated', value: 'updated' },
        { text: 'Viewed', value: 'viewed' },
        { text: 'Downloaded', value: 'downloaded' },
        { text: 'Edited', value: 'edited' },
        { text: 'Signed', value: 'signed' },
        { text: 'Reverted', value: 'reverted' },
      ],
    },
    {
      title: translate('User'),
      dataIndex: 'user',
      key: 'user',
      render: (user) => {
        if (!user) return 'System';
        return user.name || user.email || 'Unknown User';
      },
    },
    {
      title: translate('Timestamp'),
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true,
      defaultSortOrder: 'descend',
    },
    {
      title: translate('IP Address'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      responsive: ['lg'],
    },
    {
      title: translate('Details'),
      dataIndex: 'details',
      key: 'details',
      render: (details) => {
        if (!details || Object.keys(details).length === 0) return '-';

        return (
          <Button
            type="link"
            onClick={() => {
              Modal.info({
                title: translate('Action Details'),
                content: (
                  <pre
                    style={{
                      maxHeight: '400px',
                      overflow: 'auto',
                      marginTop: '10px',
                      padding: '10px',
                      background: '#f5f5f5',
                      borderRadius: '4px',
                    }}
                  >
                    {formatDetails(details)}
                  </pre>
                ),
                width: 600,
              });
            }}
          >
            {translate('View')}
          </Button>
        );
      },
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <FileSearchOutlined />
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          {translate('Close')}
        </Button>,
      ]}
      width={800}
      styles={{
        body: { padding: '10px 24px' },
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
          <Title level={5}>{translate('Document Activity History')}</Title>
          <Space>
            <Tooltip title={translate('Refresh')}>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadAuditTrail(pagination.current)}
              />
            </Tooltip>
            <Tooltip title={translate('Filter')}>
              <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)} />
            </Tooltip>
          </Space>
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <p style={{ marginTop: '15px' }}>{translate('Loading audit trail...')}</p>
          </div>
        ) : auditData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FileSearchOutlined style={{ fontSize: '32px', color: '#bfbfbf' }} />
            <p style={{ marginTop: '15px' }}>{translate('No audit records found')}</p>
          </div>
        ) : (
          <Table
            dataSource={auditData}
            columns={columns}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total) => `${translate('Total')} ${total} ${translate('items')}`,
            }}
            onChange={handleTableChange}
            size="middle"
            scroll={{ x: 'max-content' }}
          />
        )}
      </Space>

      {/* Filter Modal */}
      <Modal
        title={translate('Filter Audit Trail')}
        open={filterVisible}
        onCancel={() => setFilterVisible(false)}
        footer={[
          <Button key="reset" onClick={handleResetFilters}>
            {translate('Reset')}
          </Button>,
          <Button key="cancel" onClick={() => setFilterVisible(false)}>
            {translate('Cancel')}
          </Button>,
          <Button key="apply" type="primary" onClick={handleApplyFilters}>
            {translate('Apply')}
          </Button>,
        ]}
      >
        <Form form={filterForm} layout="vertical">
          <Form.Item name="actions" label={translate('Filter by Actions')}>
            <Select
              mode="multiple"
              placeholder={translate('Select actions to filter')}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="created">{translate('Created')}</Option>
              <Option value="updated">{translate('Updated')}</Option>
              <Option value="viewed">{translate('Viewed')}</Option>
              <Option value="downloaded">{translate('Downloaded')}</Option>
              <Option value="edited">{translate('Edited')}</Option>
              <Option value="signed">{translate('Signed')}</Option>
              <Option value="reverted">{translate('Reverted')}</Option>
              <Option value="annotated">{translate('Annotated')}</Option>
              <Option value="compliance_checked">{translate('Compliance Checked')}</Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" label={translate('Filter by Date')}>
            <RangePicker style={{ width: '100%' }} allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </Modal>
  );
}
