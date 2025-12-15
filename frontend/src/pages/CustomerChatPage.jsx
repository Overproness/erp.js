import CustomerChatInterface from '@/components/CustomerChatInterface';
import request from '@/request';
import { MessageOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Result, Space, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

const { Title, Text } = Typography;

const CustomerChatPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const accessToken = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  useEffect(() => {
    verifyAccess();
  }, [roomId, accessToken]);

  const verifyAccess = async () => {
    if (!accessToken) {
      setError('Access token is required');
      setLoading(false);
      return;
    }

    try {
      const response = await request.get(`/customer-chat/room?accessToken=${accessToken}`);

      if (response.data.success) {
        setRoomInfo(response.data.result);
      } else {
        setError(response.data.message || 'Invalid access');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to access chat room');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f0f2f5',
        }}
      >
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Connecting to chat...</Text>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !roomInfo) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: '#f0f2f5',
        }}
      >
        <Card style={{ width: 500 }}>
          <Result
            status="error"
            icon={<WarningOutlined />}
            title="Unable to Access Chat"
            subTitle={error || 'This chat room is not available or has expired.'}
          />
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f0f2f5',
        padding: '24px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Card style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
          <Space direction="vertical" size={4}>
            <Title level={4} style={{ margin: 0 }}>
              <MessageOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              {roomInfo.title || 'Customer Support Chat'}
            </Title>
            {roomInfo.description && <Text type="secondary">{roomInfo.description}</Text>}
            <Text type="secondary" style={{ fontSize: 12 }}>
              Chat with {roomInfo.employeeName}
            </Text>
          </Space>
        </Card>

        <CustomerChatInterface roomId={roomId} accessToken={accessToken} userType="customer" />
      </div>
    </div>
  );
};

export default CustomerChatPage;
