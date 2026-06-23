import React from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Space, 
  Button,
  Descriptions,
  Alert,
  Tooltip
} from '@/components/ui';
import {
  LinkOutlined,
  ClockCircleOutlined,
  LockOutlined,
  EyeOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  GlobalOutlined
} from '@/components/icons';
import useLanguage from '@/locale/useLanguage';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

const UrlDetails = ({ url, analytics, onUpdate }) => {
  const translate = useLanguage();

  // Add null check
  if (!url) {
    return (
      <Card>
        <Text>{translate('No URL data available')}</Text>
      </Card>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'success',
      inactive: 'default',
      expired: 'error',
      scheduled: 'processing',
    };
    return colors[status] || 'default';
  };

  const getHealthStatus = () => {
    if (url.expiresAt && dayjs().isAfter(dayjs(url.expiresAt))) {
      return { status: 'expired', color: 'error', icon: <WarningOutlined /> };
    }
    if (url.maxClicks && url.totalClicks >= url.maxClicks) {
      return { status: 'limit_reached', color: 'warning', icon: <WarningOutlined /> };
    }
    if (url.expiresAt && dayjs().add(7, 'day').isAfter(dayjs(url.expiresAt))) {
      return { status: 'expiring_soon', color: 'warning', icon: <ClockCircleOutlined /> };
    }
    return { status: 'healthy', color: 'success', icon: <CheckCircleOutlined /> };
  };

  const healthStatus = getHealthStatus();

  // Create a safe shortUrl if not present
  const shortUrl = url.shortUrl || url.shortenedUrl;

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* Basic Information */}
        <Col xs={24} lg={12}>
          <Card title={translate('Basic Information')} size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label={translate('Short URL')}>
                <Space>
                  <Text copyable code>{shortUrl}</Text>
                  <Button 
                    type="link" 
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(shortUrl, '_blank')}
                  >
                    {translate('Visit')}
                  </Button>
                </Space>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Original URL')}>
                <Tooltip title={url.originalUrl}>
                  <Paragraph 
                    copyable 
                    ellipsis={{ rows: 2 }}
                    style={{ margin: 0, maxWidth: '300px' }}
                  >
                    {url.originalUrl}
                  </Paragraph>
                </Tooltip>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Short Code')}>
                <Text code>{url.shortCode}</Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Title')}>
                {url.title || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Description')}>
                {url.description || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Category')}>
                <Tag color="blue">{translate(url.category)}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Tags')}>
                <Space wrap>
                  {url.tags?.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  )) || '-'}
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Status & Security */}
        <Col xs={24} lg={12}>
          <Card title={translate('Status & Analytics')} size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label={translate('Status')}>
                <Tag color={getStatusColor(url.status)}>
                  {translate(url.status)}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Health')}>
                <Tag color={healthStatus.color} icon={healthStatus.icon}>
                  {translate(healthStatus.status)}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Total Clicks')}>
                <Text strong style={{ color: '#8b5cf6' }}>
                  {url.totalClicks || 0}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Unique Clicks')}>
                <Text strong style={{ color: '#10b981' }}>
                  {url.uniqueClicks || 0}
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Avg. Click Time')}>
                <Text strong style={{ color: '#3b82f6' }}>
                  {url.averageClickTime || 0}s
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Password Protected')}>
                {url.passwordProtected ? (
                  <Tag color="orange" icon={<LockOutlined />}>
                    {translate('Yes')}
                  </Tag>
                ) : (
                  <Tag color="green">{translate('No')}</Tag>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Click Limit')}>
                {url.maxClicks ? (
                  <Text>
                    {url.totalClicks || 0} / {url.maxClicks}
                    {(url.totalClicks || 0) >= url.maxClicks && (
                      <Tag color="red" style={{ marginLeft: '8px' }}>
                        {translate('Limit Reached')}
                      </Tag>
                    )}
                  </Text>
                ) : (
                  <Tag color="green">{translate('Unlimited')}</Tag>
                )}
              </Descriptions.Item>
              
              <Descriptions.Item label={translate('Expiration')}>
                {url.expiresAt ? (
                  <Space>
                    <Text>
                      {dayjs(url.expiresAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                    {dayjs().isAfter(dayjs(url.expiresAt)) && (
                      <Tag color="red">{translate('Expired')}</Tag>
                    )}
                  </Space>
                ) : (
                  <Tag color="green">{translate('Never')}</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* UTM Parameters */}
        {(url.utmSource || url.utmMedium || url.utmCampaign) && (
          <Col xs={24}>
            <Card 
              title={
                <Space>
                  <GlobalOutlined />
                  {translate('UTM Parameters')}
                </Space>
              } 
              size="small"
            >
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={translate('UTM Source')}>
                      <Tag color="purple">{url.utmSource || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={translate('UTM Medium')}>
                      <Tag color="orange">{url.utmMedium || '-'}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} sm={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={translate('UTM Campaign')}>
                      <Tag color="green">{url.utmCampaign || '-'}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={translate('UTM Term')}>
                      <Tag color="blue">{url.utmTerm || '-'}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} sm={8}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={translate('UTM Content')}>
                      <Tag color="cyan">{url.utmContent || '-'}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>
          </Col>
        )}

        {/* Timestamps */}
        <Col xs={24}>
          <Card title={translate('Timeline')} size="small">
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={translate('Created')}>
                    {dayjs(url.createdAt || url.created).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('Created By')}>
                    {url.createdBy || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={translate('Last Updated')}>
                    {url.updatedAt ? dayjs(url.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('First Clicked')}>
                    {url.firstClickedAt ? dayjs(url.firstClickedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col xs={24} sm={8}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label={translate('Last Clicked')}>
                    {url.lastClickedAt ? dayjs(url.lastClickedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('Domain')}>
                    <Text code>{url.customDomain || 'default'}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Warnings */}
        {(healthStatus.status !== 'healthy') && (
          <Col xs={24}>
            <Alert
              message={translate('URL Status Warning')}
              description={translate(`This URL has a ${healthStatus.status} status. Please review the configuration.`)}
              type="warning"
              showIcon
              closable
            />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default UrlDetails;