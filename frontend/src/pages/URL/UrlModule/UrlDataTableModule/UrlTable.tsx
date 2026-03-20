import React, { useState } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Dropdown, 
  Tooltip, 
  Badge, 
  Avatar,
  Space,
  Typography,
  Progress,
  Popconfirm
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  QrcodeOutlined,
  BarChartOutlined,
  MoreOutlined,
  LinkOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  LockOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const UrlTable = ({ 
  data, 
  loading, 
  pagination, 
  selectedRowKeys, 
  onSelectChange,
  onEdit,
  onDelete,
  onCopy,
  onQRCode,
  onAnalytics,
  onPaginationChange,
  onSortChange
}) => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      expired: 'error',
      scheduled: 'processing',
      password_protected: 'warning'
    };
    return colors[status] || 'default';
  };

  const getActionItems = (record) => [
    {
      key: 'view',
      label: translate('View Details'),
      icon: <EyeOutlined />,
      onClick: () => navigate(`/url/${record._id}`),
    },
    {
      key: 'edit',
      label: translate('Edit'),
      icon: <EditOutlined />,
      onClick: () => onEdit(record),
    },
    {
      key: 'analytics',
      label: translate('Analytics'),
      icon: <BarChartOutlined />,
      onClick: () => onAnalytics(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'copy',
      label: translate('Copy URL'),
      icon: <CopyOutlined />,
      onClick: () => onCopy(record.shortUrl),
    },
    {
      key: 'qr',
      label: translate('QR Code'),
      icon: <QrcodeOutlined />,
      onClick: () => onQRCode(record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: translate('Delete'),
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => onDelete(record._id),
    },
  ];

  const columns = [
    {
      title: translate('Short URL'),
      key: 'shortUrl',
      width: 300,
      sorter: true,
      render: (_, record) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar 
              size="small" 
              icon={<LinkOutlined />} 
              style={{ backgroundColor: '#8b5cf6' }}
            />
            <div>
              <div style={{ fontWeight: 600, color: '#8b5cf6', fontSize: '14px' }}>
                <Text copyable={{ text: record.shortUrl }}>
                  {record.shortUrl}
                </Text>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {record.shortCode}
              </div>
            </div>
          </div>
          
          {/* Security indicators */}
          <div style={{ marginTop: '4px' }}>
            {record.isPasswordProtected && (
              <Tooltip title={translate('Password Protected')}>
                <Tag size="small" color="orange" icon={<LockOutlined />} key="password-protected">
                  {translate('Protected')}
                </Tag>
              </Tooltip>
            )}
            {record.hasClickLimit && (
              <Tooltip title={translate('Click Limit')} >
                <Tag size="small" color="blue" key="click-limit">
                  {translate('Limited')}
                </Tag>
              </Tooltip>
            )}
            {record.expirationDate && (
              <Tooltip title={translate('Expires on')} >
                <Tag size="small" color="purple" icon={<ClockCircleOutlined />} key="expires-on">
                  {dayjs(record.expirationDate).format('MMM D')}
                </Tag>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      title: translate('Original URL'),
      dataIndex: 'originalUrl',
      key: 'originalUrl',
      width: 400,
      ellipsis: true,
      render: (url, record) => (
        <div>
          <Paragraph 
            ellipsis={{ 
              rows: 1, 
              expandable: false,
              tooltip: url 
            }}
            style={{ margin: 0, fontSize: '14px' }}
          >
            <a href={url} target="_blank" rel="noopener noreferrer">
              {url}
            </a>
          </Paragraph>
          {record.title && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
              {record.title}
            </div>
          )}
        </div>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      sorter: true,
      render: (status, record) => {
        // Check for additional status conditions
        let displayStatus = status;
        let statusColor = getStatusColor(status);
        
        if (record.expirationDate && dayjs().isAfter(dayjs(record.expirationDate))) {
          displayStatus = 'expired';
          statusColor = 'error';
        } else if (record.hasClickLimit && record.clickCount >= record.clickLimit) {
          displayStatus = 'limit_reached';
          statusColor = 'error';
        }

        return (
          <Tag color={statusColor} style={{ borderRadius: '12px' }} key={displayStatus}>
            {translate(displayStatus)}
          </Tag>
        );
      },
    },
    {
      title: translate('Clicks'),
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 120,
      sorter: true,
      align: 'center',
      render: (clicks, record) => (
        <div style={{ textAlign: 'center' }}>
          <Badge 
            count={clicks} 
            showZero 
            style={{ backgroundColor: '#8b5cf6' }}
          />
          {record.hasClickLimit && (
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
              <Progress 
                percent={(clicks / record.clickLimit) * 100}
                size="small"
                showInfo={false}
                strokeColor={clicks >= record.clickLimit ? '#ef4444' : '#8b5cf6'}
              />
              {clicks}/{record.clickLimit}
            </div>
          )}
        </div>
      ),
    },
    {
      title: translate('Created'),
      dataIndex: 'created',
      key: 'created',
      width: 120,
      sorter: true,
      render: (date) => (
        <div>
          <div style={{ fontSize: '14px' }}>
            {dayjs(date).format('MMM D, YYYY')}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Tooltip title={translate('Quick Copy')}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={() => onCopy(record.shortUrl)}
            />
          </Tooltip>
          
          <Tooltip title={translate('Analytics')}>
            <Button
              type="text"
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => onAnalytics(record)}
            />
          </Tooltip>
          
          <Dropdown
            menu={{ items: getActionItems(record) }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              size="small"
              icon={<MoreOutlined />}
            />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record) => (
    <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div>
          <Text strong>{translate('Description')}:</Text>
          <div>{record.description || translate('No description')}</div>
        </div>
        
        <div>
          <Text strong>{translate('Tags')}:</Text>
          <div>
            {record.tags?.length > 0 ? (
              record.tags.map((tag, idx) => (
                <Tag key={tag ? `${tag}-${idx}` : `tag-${idx}`} size="small" style={{ margin: '2px' }}>
                  {tag}
                </Tag>
              ))
            ) : (
              translate('No tags')
            )}
          </div>
        </div>
        
        <div>
          <Text strong>{translate('Domain')}:</Text>
          <div>{record.domain || translate('Default domain')}</div>
        </div>
        
        {record.utmParams && (
          <div>
            <Text strong>{translate('UTM Parameters')}:</Text>
            <div style={{ fontSize: '12px' }}>
              {Object.entries(record.utmParams).map(([key, value], idx) => (
                <div key={key + '-' + idx}>
                  <Text code>{key}</Text>: {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    preserveSelectedRowKeys: true,
  };

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      rowSelection={rowSelection}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `${range[0]}-${range[1]} ${translate('of')} ${total} ${translate('URLs')}`,
        pageSizeOptions: ['10', '20', '50', '100'],
        onChange: onPaginationChange,
        onShowSizeChange: onPaginationChange,
      }}
      expandable={{
        expandedRowRender,
        expandedRowKeys,
        onExpand: (expanded, record) => {
          if (expanded) {
            setExpandedRowKeys([...expandedRowKeys, record._id]);
          } else {
            setExpandedRowKeys(expandedRowKeys.filter(key => key !== record._id));
          }
        },
        rowExpandable: (record) => true,
      }}
      scroll={{ x: 1200 }}
      onChange={(pagination, filters, sorter) => {
        if (sorter.field) {
          onSortChange(sorter.field, sorter.order);
        }
      }}
      size="small"
      style={{
        '.antTableThead > tr > th': {
          backgroundColor: '#fafbfc',
          borderBottom: '2px solid #e5e7eb',
        },
        '.antTableTbody > tr:hover > td': {
          backgroundColor: '#f8fafc',
        }
      }}
    />
  );
};

export default UrlTable;