import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileSearchOutlined,
  InfoCircleOutlined,
  LockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Card, Empty, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text } = Typography;

export default function AuditTrail({ documentId }) {
  const translate = useLanguage();
  const dispatch = useDispatch();

  const {
    result: auditTrail,
    isLoading,
    pagination,
  } = useSelector(
    (state) =>
      state.erp.auditTrail || {
        result: [],
        isLoading: false,
        pagination: { current: 1, pageSize: 20, total: 0 },
      }
  );

  const loadedRef = useRef('');
  useEffect(() => {
    if (loadedRef.current === documentId) return;
    loadedRef.current = documentId;
    loadAuditTrail(1, 20);
  }, [documentId]);

  const loadAuditTrail = (page = 1, limit = 20) => {
    const options = { page, limit };
    dispatch(erp.getDocumentAuditTrail({ id: documentId, options }));
  };

  // Get action color based on action type
  const getActionColor = (action) => {
    switch (action) {
      case 'created':
        return 'green';
      case 'updated':
        return 'blue';
      case 'viewed':
        return 'geekblue';
      case 'downloaded':
        return 'purple';
      case 'deleted':
        return 'red';
      case 'permission_changed':
        return 'orange';
      case 'version_created':
        return 'cyan';
      case 'reverted':
        return 'magenta';
      case 'compliance_updated':
        return 'gold';
      case 'signed':
        return 'lime';
      default:
        return 'default';
    }
  };

  // Get action icon based on action type
  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <FileSearchOutlined />;
      case 'updated':
        return <EditOutlined />;
      case 'viewed':
        return <EyeOutlined />;
      case 'downloaded':
        return <DownloadOutlined />;
      case 'deleted':
        return <DeleteOutlined />;
      case 'permission_changed':
        return <LockOutlined />;
      case 'version_created':
        return <FileSearchOutlined />;
      case 'reverted':
        return <InfoCircleOutlined />;
      case 'compliance_updated':
        return <InfoCircleOutlined />;
      case 'signed':
        return <InfoCircleOutlined />;
      default:
        return <InfoCircleOutlined />;
    }
  };

  // Format action text for display
  const formatAction = (action) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format details for display
  const formatDetails = (details) => {
    if (!details) return null;

    return (
      <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
        {Object.entries(details).map(([key, value]) => (
          <li key={key}>
            <Text strong>{key}: </Text>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </li>
        ))}
      </ul>
    );
  };

  const columns = [
    {
      title: translate('Action'),
      dataIndex: 'action',
      key: 'action',
      render: (action) => (
        <Tag color={getActionColor(action)} icon={getActionIcon(action)}>
          {formatAction(action)}
        </Tag>
      ),
    },
    {
      title: translate('User'),
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <Space>
          <UserOutlined />
          {user?.name || user?.email || 'Unknown User'}
        </Space>
      ),
    },
    {
      title: translate('Date & Time'),
      dataIndex: 'created',
      key: 'created',
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: translate('IP Address'),
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      render: (ip) => ip || 'N/A',
    },
    {
      title: translate('Details'),
      dataIndex: 'details',
      key: 'details',
      render: (details) => formatDetails(details),
    },
  ];

  return (
    <Card className="audit-trail">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={4}>
            <FileSearchOutlined /> {translate('Document Audit Trail')}
          </Title>
          <Alert
            message={translate('Complete Activity Log')}
            description={translate(
              'This audit trail shows all actions performed on this document, including views, downloads, edits, and compliance changes.'
            )}
            type="info"
            showIcon
          />
        </div>

        <Table
          dataSource={auditTrail}
          columns={columns}
          loading={isLoading}
          rowKey={(record) => record._id}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={translate('No audit records found for this document')}
              />
            ),
          }}
          pagination={{
            current: pagination?.page || 1,
            pageSize: pagination?.pageSize || 20,
            total: pagination?.total || 0,
            onChange: (page, pageSize) => {
              loadAuditTrail(page, pageSize);
            },
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <Badge
            status="processing"
            text={translate('Audit trail logs are immutable and cannot be modified')}
          />
        </div>
      </Space>
    </Card>
  );
}
