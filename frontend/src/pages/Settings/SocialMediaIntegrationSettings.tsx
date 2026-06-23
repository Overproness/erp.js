import useLanguage from '@/locale/useLanguage';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  FacebookOutlined,
  InstagramOutlined,
  PlusOutlined,
  ReloadOutlined,
  TwitterOutlined,
} from '@/components/icons';
import { Button, Card, Col, Modal, Row, Space, Tag, Typography } from '@/components/ui';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

const platforms = [
  {
    key: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook pages and profiles',
    color: '#1877f2',
    icon: <FacebookOutlined style={{ color: '#1877f2' }} />,
  },
  {
    key: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram business accounts',
    color: '#E4405F',
    icon: <InstagramOutlined style={{ color: '#E4405F' }} />,
  },
  {
    key: 'twitter',
    name: 'Twitter',
    description: 'Connect your Twitter business accounts',
    color: '#1DA1F2',
    icon: <TwitterOutlined style={{ color: '#1DA1F2' }} />,
  },
];

export default function SocialMediaIntegrationSettings() {
  const translate = useLanguage();
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);

  // Use a single state for all platforms, default to not connected
  const [connected, setConnected] = useState({
    facebook: false,
    instagram: false,
    twitter: false,
  });

  const handleConnect = (platform) => {
    setSelectedPlatform(platform);
    setConnectModalVisible(true);
  };

  const handleDisconnect = (platform) => {
    setConnected((prev) => ({ ...prev, [platform]: false }));
  };

  const handleTestConnection = (platform) => {
    // No dummy test logic
  };

  // Card height for consistency
  const cardHeight = 320;

  return (
    <div>
      <Card
        title={translate('Social Media Platform Integrations')}
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[16, 16]}>
          {platforms.map((platform) => (
            <Col span={8} key={platform.key}>
              <Card
                size="small"
                style={{
                  border: `2px solid ${connected[platform.key] ? '#52c41a' : '#d9d9d9'}`,
                  borderRadius: 12,
                  height: cardHeight,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxSizing: 'border-box',
                  padding: '0',
                }}
                styles={{
                  body: {
                    padding: '24px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  },
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>{platform.icon}</div>
                  <Title level={5} style={{ margin: 0 }}>
                    {platform.name}
                  </Title>
                  <Text style={{ fontSize: '13px', color: '#6b7280' }}>{platform.description}</Text>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  {connected[platform.key] ? (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          {translate('Connected')}
                        </Tag>
                      </div>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={() => handleTestConnection(platform.key)}
                          block
                        >
                          {translate('Test Connection')}
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDisconnect(platform.key)}
                          block
                        >
                          {translate('Disconnect')}
                        </Button>
                      </Space>
                    </div>
                  ) : (
                    <div>
                      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                        <Tag color="default">{translate('Not Connected')}</Tag>
                      </div>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => handleConnect(platform.key)}
                        block
                        style={{
                          backgroundColor: platform.color,
                          borderColor: platform.color,
                        }}
                      >
                        {translate('Connect')}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Modal
        title={
          translate('Connect') +
          ' ' +
          (selectedPlatform
            ? selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)
            : '')
        }
        open={connectModalVisible}
        onCancel={() => setConnectModalVisible(false)}
        footer={null}
        width={400}
      >
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Paragraph>
            {translate('You will be redirected to authorize our application to access your')}{' '}
            {selectedPlatform} {translate('account')}
          </Paragraph>
          <Button type="primary" onClick={() => setConnectModalVisible(false)}>
            {translate('Connect')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
