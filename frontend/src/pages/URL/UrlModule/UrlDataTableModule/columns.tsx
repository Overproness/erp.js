import useLanguage from '@/locale/useLanguage';
import { copyToClipboard } from '@/utils/helpers';
import {
  BarChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  LinkOutlined,
  QrcodeOutlined,
} from '@/components/icons';
import { Badge, Button, Popconfirm, Space, Tag, Tooltip, Typography } from '@/components/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCodeGenerator from '../Components/QRCodeGenerator';

const { Text, Paragraph } = Typography;

export default function useColumns({ onDelete }) {
  const translate = useLanguage();
  const navigate = useNavigate();
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedUrl, setSelectedUrl] = useState(null);

  const getShortUrl = (record) => {
    // Use the shortUrl from the record if available, otherwise construct it
    if (record.shortUrl) {
      return record.shortUrl;
    }
    // Fallback to constructing the URL
    const baseUrl = process.env.REACT_APP_API_BASE_URL || window.location.origin;
    return `${baseUrl}/s/${record.shortCode}`;
  };

  const handleCopy = (text, message = 'Short URL copied to clipboard!') => {
    copyToClipboard(text);
    // You might want to show a notification here
  };

  const handleDelete = (record) => {
    if (onDelete) {
      console.log('Calling onDelete with record._id:', record._id);
      onDelete(record._id);
    }
  };

  const handleQRCode = (record) => {
    setSelectedUrl(getShortUrl(record));
    setShowQRModal(true);
  };

  const columns = [
    {
      title: translate('Short Code'),
      dataIndex: 'shortCode',
      key: 'shortCode',
      width: 180,
      render: (shortCode, record) => (
        <Space direction="vertical" size={2}>
          <Text code copyable={{ text: getShortUrl(record) }}>
            {shortCode}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.totalClicks || 0} clicks
          </Text>
        </Space>
      ),
    },
    {
      title: translate('Title & URL'),
      key: 'title_url',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text strong style={{ fontSize: '14px' }}>
            {record.title || 'Untitled'}
          </Text>
          <Paragraph
            style={{ margin: 0, fontSize: '12px', maxWidth: '280px' }}
            ellipsis={{ rows: 1, tooltip: record.originalUrl }}
          >
            <Text type="secondary">{record.originalUrl}</Text>
          </Paragraph>
          {record.description && (
            <Paragraph
              style={{ margin: 0, fontSize: '11px', maxWidth: '280px' }}
              ellipsis={{ rows: 1, tooltip: record.description }}
            >
              <Text type="secondary">{record.description}</Text>
            </Paragraph>
          )}
        </Space>
      ),
    },
    {
      title: translate('Short URL'),
      key: 'shortUrl',
      width: 300,
      render: (_, record) => {
        const shortUrl = getShortUrl(record);
        return (
          <Space>
            <Text code style={{ fontSize: '12px' }}>
              {shortUrl}
            </Text>
            <Tooltip title={translate('Copy Short URL')}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopy(shortUrl)}
              />
            </Tooltip>
            <Tooltip title={translate('Visit URL')}>
              <Button
                type="text"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => window.open(shortUrl, '_blank')}
              />
            </Tooltip>
          </Space>
        );
      },
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => {
        let color = 'default';
        let text = status;

        if (status === 'active') {
          color = 'green';
          text = translate('Active');
        } else if (status === 'inactive') {
          color = 'orange';
          text = translate('Inactive');
        } else if (status === 'expired') {
          color = 'red';
          text = translate('Expired');
        }

        return (
          <Space direction="vertical" size={2}>
            <Badge color={color} text={text} />
            {record.passwordProtected && (
              <Tag size="small" color="blue">
                Protected
              </Tag>
            )}
            {record.requiresAuth && (
              <Tag size="small" color="purple">
                Auth Required
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: translate('Analytics'),
      key: 'analytics',
      width: 120,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text style={{ fontSize: '12px' }}>
            <strong>{record.totalClicks || 0}</strong> total
          </Text>
          <Text style={{ fontSize: '12px' }} type="secondary">
            <strong>{record.uniqueClicks || 0}</strong> unique
          </Text>
        </Space>
      ),
    },
    {
      title: translate('Created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt) => (
        <Text style={{ fontSize: '12px' }}>{new Date(createdAt).toLocaleDateString()}</Text>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      width: 180,
      render: (_, record) => (
        <>
          <Space size="small">
            <Tooltip title={translate('View Details')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => navigate(`/url/${record._id}`)}
              />
            </Tooltip>
            <Tooltip title={translate('Edit')}>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => navigate(`/url/update/${record._id}`)}
              />
            </Tooltip>
            <Tooltip title={translate('Analytics')}>
              <Button
                type="text"
                size="small"
                icon={<BarChartOutlined />}
                onClick={() => navigate(`/url/analytics/${record._id}`)}
              />
            </Tooltip>
            <Tooltip title={translate('QR Code')}>
              <Button
                type="text"
                size="small"
                icon={<QrcodeOutlined />}
                onClick={() => handleQRCode(record)}
              />
            </Tooltip>
            <Popconfirm
              title={translate('Delete URL')}
              description={translate(
                'Are you sure you want to delete this URL? This action cannot be undone.'
              )}
              onConfirm={() => handleDelete(record)}
              okText={translate('Yes, Delete')}
              cancelText={translate('Cancel')}
              okType="danger"
            >
              <Tooltip title={translate('Delete')}>
                <Button type="text" size="small" icon={<DeleteOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          </Space>

          {/* QR Code Modal */}
          <QRCodeGenerator
            visible={showQRModal}
            url={selectedUrl || ''}
            onClose={() => {
              setShowQRModal(false);
              setSelectedUrl(null);
            }}
          />
        </>
      ),
    },
  ];

  return columns;
}
