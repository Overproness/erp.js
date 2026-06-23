import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Space, 
  Typography, 
  Divider,
  message,
  Spin
} from '@/components/ui';
import {
  ArrowLeftOutlined,
  EditOutlined,
  QrcodeOutlined,
  ShareAltOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined
} from '@/components/icons';
import { useParams, useNavigate } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { useUrlManagement } from '@/hooks/useUrl';
import UrlDetails from './UrlDetails';
import QRCodeGenerator from '../Components/QRCodeGenerator';
import dayjs from 'dayjs';
import { sanitizeData } from '@/utils/contentSanitizer';

const { Title } = Typography;

const ReadUrlModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { getUrl, deleteUrl } = useUrlManagement();
  
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    loadUrlData();
  }, [id]);

  const loadUrlData = async () => {
    try {
      setLoading(true);
      const response = await getUrl(id);
      
      // Check for valid response with result property
      if (!response || !response.success || !response.result) {
        message.error(translate('URL not found or data is invalid'));
        navigate('/url');
        return;
      }
      
      // Extract the URL data from the result property
      const urlData = response.result;
      
      // Sanitize URL data to remove inappropriate content
      const sanitizedUrlData = sanitizeData(urlData);
      
      // Create a safe URL object with fallbacks for all potentially used properties
      const safeUrlData = {
        shortCode: sanitizedUrlData.shortCode || '',
        shortUrl: sanitizedUrlData.shortUrl || sanitizedUrlData.shortenedUrl || '',
        originalUrl: sanitizedUrlData.originalUrl || '',
        title: sanitizedUrlData.title || sanitizedUrlData.shortCode || 'Untitled URL',
        description: sanitizedUrlData.description || '',
        status: sanitizedUrlData.status || 'inactive',
        created: sanitizedUrlData.createdAt || sanitizedUrlData.created || new Date().toISOString(),
        tags: Array.isArray(sanitizedUrlData.tags) ? sanitizedUrlData.tags : [],
        category: sanitizedUrlData.category || 'general',
        // Analytics data
        totalClicks: sanitizedUrlData.totalClicks || 0,
        uniqueClicks: sanitizedUrlData.uniqueClicks || 0,
        averageClickTime: sanitizedUrlData.averageClickTime || 0,
        lastClickedAt: sanitizedUrlData.lastClickedAt || null,
        firstClickedAt: sanitizedUrlData.firstClickedAt || null,
        ...sanitizedUrlData
      };
      
      setUrl(safeUrlData);
    } catch (error) {
      message.error(translate('Failed to load URL data'));
      navigate('/url');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/url/update/${id}`);
  };

  const handleDelete = async () => {
    try {
      await deleteUrl(id);
      message.success(translate('URL deleted successfully'));
      navigate('/url');
    } catch (error) {
      message.error(translate('Failed to delete URL'));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url.shortUrl);
    message.success(translate('URL copied to clipboard'));
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: url.title || translate('Shared URL'),
        url: url.shortUrl
      });
    } else {
      handleCopy();
    }
  };

  // Ensure URL has all required properties with default values to prevent null/undefined errors
  const safeUrl = url ? {
    shortCode: url.shortCode || '',
    title: url.title || '',
    shortUrl: url.shortUrl || '',
    originalUrl: url.originalUrl || '',
    description: url.description || '',
    category: url.category || 'general',
    status: url.status || 'inactive',
    tags: Array.isArray(url.tags) ? url.tags : [],
    created: url.created || new Date().toISOString(),
    totalClicks: url.totalClicks || 0,
    uniqueClicks: url.uniqueClicks || 0,
    averageClickTime: url.averageClickTime || 0,
    lastClickedAt: url.lastClickedAt || null,
    // Add other properties with safe defaults
    ...url
  } : null;

  // Create analytics object from URL data
  const analyticsData = safeUrl ? {
    totalClicks: safeUrl.totalClicks || 0,
    uniqueClicks: safeUrl.uniqueClicks || 0,
    averageClickTime: safeUrl.averageClickTime || 0,
    lastClicked: safeUrl.lastClickedAt,
    firstClicked: safeUrl.firstClickedAt
  } : null;

  // Ensure analytics values are always safe
  const getSafeAnalyticsValue = (value) => {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    return '0';
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!url) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={4}>{translate('URL not found')}</Title>
        <Button type="primary" onClick={() => navigate('/url')}>
          {translate('Back to URLs')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/url')}
          >
            {translate('Back to URLs')}
          </Button>
        </Space>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '16px'
        }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {url.title || url.shortCode}
            </Title>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              Created {dayjs(url.created).format('MMMM D, YYYY')}
            </div>
          </div>
          
          <Space>
            <Button 
              icon={<CopyOutlined />}
              onClick={handleCopy}
            >
              {translate('Copy')}
            </Button>
            <Button 
              icon={<ShareAltOutlined />}
              onClick={handleShare}
            >
              {translate('Share')}
            </Button>
            <Button 
              icon={<QrcodeOutlined />}
              onClick={() => setShowQRModal(true)}
            >
              {translate('QR Code')}
            </Button>
            <Button 
              icon={<EditOutlined />}
              type="primary"
              onClick={handleEdit}
            >
              {translate('Edit')}
            </Button>
            <Button 
              icon={<DeleteOutlined />}
              danger
              onClick={handleDelete}
            >
              {translate('Delete')}
            </Button>
          </Space>
        </div>
      </div>

      {/* URL Summary Card */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {getSafeAnalyticsValue(analyticsData?.totalClicks)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {translate('Total Clicks')}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                {getSafeAnalyticsValue(analyticsData?.uniqueClicks)}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {translate('Unique Clicks')}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {getSafeAnalyticsValue(analyticsData?.averageClickTime)}s
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {translate('Avg. Time')}
              </div>
            </div>
          </Col>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                {translate(safeUrl?.status || 'inactive')}
              </div>
              <div style={{ color: '#6b7280', fontSize: '12px' }}>
                {translate('Status')}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Only URL Details, no Tabs or Analytics */}
      <UrlDetails url={safeUrl} analytics={analyticsData} onUpdate={loadUrlData} />

      {/* QR Code Modal */}
      <QRCodeGenerator
        visible={showQRModal}
        url={safeUrl?.shortUrl || ''}
        onClose={() => setShowQRModal(false)}
      />
    </div>
  );
};

export default ReadUrlModule;