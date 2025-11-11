import useLanguage from '@/locale/useLanguage';
import request from '@/request/request';
// import request from '@/request';
import {
  CheckCircleOutlined,
  CodeOutlined,
  FieldTimeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Card, Descriptions, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const VersionInfo = () => {
  const translate = useLanguage();
  const [versionData, setVersionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  const fetchVersionInfo = async () => {
    try {
      const response = await request.get({ entity: '/version' });

      // Handle the response structure
      if (response && response.success && response.result) {
        setVersionData(response.result);
      } else if (response && response.version) {
        // Fallback if response is returned directly
        setVersionData(response);
      } else {
        console.error('Unexpected response format:', response);
        // Don't show error message, just fail silently in development
      }
    } catch (error) {
      console.error('Error fetching version info:', error);
      // Silently fail - version info is not critical
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'local-dev') return 'Development Build';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const getEnvironmentColor = (env) => {
    switch (env) {
      case 'production':
        return 'green';
      case 'development':
        return 'blue';
      case 'test':
        return 'orange';
      default:
        return 'default';
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

  if (!versionData) {
    return null;
  }

  return (
    <Card
      title={
        <Space>
          <InfoCircleOutlined />
          <span>{translate('Application Version Information')}</span>
        </Space>
      }
      bordered={false}
      style={{ marginBottom: 24 }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Version Badge */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            v{versionData.version}
          </Title>
          <Tag color={getEnvironmentColor(versionData.environment)} style={{ fontSize: 14 }}>
            {versionData.environment?.toUpperCase()}
          </Tag>
        </div>

        {/* Version Details */}
        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item
            label={
              <Space>
                <CheckCircleOutlined />
                <Text strong>{translate('Version')}</Text>
              </Space>
            }
          >
            <Text code style={{ fontSize: 16 }}>
              {versionData.version}
            </Text>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <CodeOutlined />
                <Text strong>{translate('Commit Hash')}</Text>
              </Space>
            }
          >
            {versionData.commit === 'local-dev' ? (
              <Tag color="blue">{translate('Local Development')}</Tag>
            ) : (
              <Text code copyable={{ text: versionData.commit }}>
                {versionData.commit?.substring(0, 8)}
              </Text>
            )}
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <FieldTimeOutlined />
                <Text strong>{translate('Build Date')}</Text>
              </Space>
            }
          >
            <Text>{formatDate(versionData.buildDate)}</Text>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <InfoCircleOutlined />
                <Text strong>{translate('Branch')}</Text>
              </Space>
            }
          >
            <Tag color={versionData.branch === 'main' ? 'green' : 'blue'}>{versionData.branch}</Tag>
          </Descriptions.Item>

          <Descriptions.Item
            label={
              <Space>
                <CodeOutlined />
                <Text strong>{translate('Node Version')}</Text>
              </Space>
            }
          >
            <Text code>{versionData.nodeVersion}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Space>
    </Card>
  );
};

export default VersionInfo;
