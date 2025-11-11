import useLanguage from '@/locale/useLanguage';
import {
  CheckCircleOutlined,
  CloudServerOutlined,
  DesktopOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Space, Spin, Statistic, Typography } from 'antd';
import { useEffect, useState } from 'react';

const { Text } = Typography;

const VersionInfo = () => {
  const translate = useLanguage();
  const [frontendVersion, setFrontendVersion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  const fetchVersionInfo = async () => {
    try {
      // Fetch frontend version from public folder
      const frontendResponse = await fetch('/version.json');
      const frontendData = await frontendResponse.json();
      setFrontendVersion(frontendData.buildNumber);
    } catch (error) {
      console.error('Error fetching version info:', error);
      // Silently fail - version info is not critical
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!frontendVersion) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          <span>{translate('Build Information')}</span>
        </Space>
      }
      bordered={false}
      style={{ marginBottom: 24 }}
    >
      <Row gutter={[24, 24]}>
        {/* Frontend Build Number */}
        <Col xs={24} sm={12}>
          <Card
            style={{
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <DesktopOutlined style={{ fontSize: 48, color: '#fff' }} />
              <Statistic
                title={
                  <Text strong style={{ color: '#fff', fontSize: 16 }}>
                    {translate('Frontend Build')}
                  </Text>
                }
                value={frontendVersion || 'N/A'}
                valueStyle={{ color: '#fff', fontSize: 36, fontWeight: 'bold' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Helper Text */}
      <div
        style={{
          background: '#f0f2f5',
          padding: '12px 16px',
          borderRadius: 4,
          marginTop: 24,
        }}
      >
        <Text type="secondary" style={{ fontSize: 13 }}>
          <CheckCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
          {translate(
            'Build numbers increment with each deployment. Use them to verify successful deployments on production.'
          )}
        </Text>
      </div>
    </Card>
  );
};

export default VersionInfo;
