import useLanguage from '@/locale/useLanguage';
import {
  DisconnectOutlined,
  FacebookOutlined,
  GlobalOutlined,
  GoogleOutlined,
  StarOutlined,
  SyncOutlined,
} from '@/components/icons';
import { Badge, Button, Card, Col, Row, Space, Tooltip, Typography } from '@/components/ui';

const { Text, Title } = Typography;

// Changed to default export
const PlatformIntegrationStatus = ({ platforms = [], onConnect, onSync, onDisconnect }) => {
  const translate = useLanguage();

  // Get platform icon based on platform ID
  const getPlatformIcon = (platformId) => {
    switch (platformId.toLowerCase()) {
      case 'google':
        return <GoogleOutlined style={{ fontSize: '24px', color: '#4285F4' }} />;
      case 'facebook':
        return <FacebookOutlined style={{ fontSize: '24px', color: '#1877F2' }} />;
      default:
        return <GlobalOutlined style={{ fontSize: '24px', color: '#1890ff' }} />;
    }
  };

  // Update all platforms to be connected
  const connectedPlatforms = platforms.map((platform) => ({
    ...platform,
    status: 'connected',
    connected: true,
  }));

  return (
    <Card
      title={
        <Space>
          <StarOutlined />
          <span>{translate('Platform Integration Status')}</span>
        </Space>
      }
      bordered
      style={{ marginBottom: '24px' }}
    >
      <Row gutter={[16, 16]}>
        {connectedPlatforms.map((platform) => (
          <Col xs={24} sm={12} md={8} key={platform.id}>
            <Card size="small" hoverable styles={{ body: { padding: '16px', height: '120px' } }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ marginRight: '12px' }}>{getPlatformIcon(platform.id)}</div>
                <div>
                  <Title level={5} style={{ margin: 0 }}>
                    {platform.name}
                  </Title>
                  <Badge status="success" text={translate('Connected')} />
                </div>
              </div>

              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text type="secondary">
                  {platform.reviewCount || 0} {translate('reviews')}
                </Text>
                <Space>
                  <Tooltip title={translate('Disconnect')}>
                    <Button
                      type="default"
                      danger
                      size="small"
                      icon={<DisconnectOutlined />}
                      onClick={() => onDisconnect && onDisconnect(platform.id)}
                    >
                      {translate('Disconnect')}
                    </Button>
                  </Tooltip>
                  <Tooltip title={translate('Sync Reviews')}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<SyncOutlined />}
                      loading={platform.syncing}
                      onClick={() => onSync && onSync(platform.id)}
                    >
                      {translate('Sync')}
                    </Button>
                  </Tooltip>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

// Changed to default export
export { PlatformIntegrationStatus };
export default PlatformIntegrationStatus;
