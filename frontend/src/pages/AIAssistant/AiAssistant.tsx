import useLanguage from '@/locale/useLanguage';
import {
  selectAssistantsError,
  selectAssistantsList,
  selectAssistantsLoading,
} from '@/redux/ai/aiSelectors';
import { fetchAssistants } from '@/redux/ai/aiThunks';
import { BarChartOutlined, MessageOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AiAssistantDataTableModule from './AiAssistantModule/AiAssistantDataTableModule';

const { Title, Text } = Typography;

export default function AiAssistant() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();

  const assistants = useSelector(selectAssistantsList);
  const loading = useSelector(selectAssistantsLoading);
  const error = useSelector(selectAssistantsError);
  const loadedRef = useRef(false);

  const [stats, setStats] = useState({
    totalAssistants: 0,
    activeAssistants: 0,
    totalConversations: 0,
    avgResponseTime: 0,
  });

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    dispatch(fetchAssistants());
  }, [dispatch]);

  useEffect(() => {
    if (assistants.length > 0) {
      const activeCount = assistants.filter((a) => a.enabled && !a.removed).length;
      setStats({
        totalAssistants: assistants.length,
        activeAssistants: activeCount,
        totalConversations: assistants.reduce((sum, a) => sum + (a.conversationCount || 0), 0),
        avgResponseTime: 1.2, // This would come from analytics in real implementation
      });
    }
  }, [assistants]);

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('AI Assistants')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Manage your intelligent automation assistants and AI-powered workflows
            </Text>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              onClick={() => navigate('/ai-assistant/chat')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              {translate('Start Chat')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/ai-assistant/create')}
              style={{
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                border: 'none',
                borderRadius: '8px',
              }}
            >
              {translate('Create Assistant')}
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Total Assistants')}
                value={stats.totalAssistants}
                loading={loading}
                valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                prefix={<RobotOutlined style={{ color: '#8b45ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Active')}
                value={stats.activeAssistants}
                loading={loading}
                valueStyle={{ color: '#52c41a', fontWeight: '700' }}
                prefix={<RobotOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Conversations')}
                value={stats.totalConversations}
                loading={loading}
                valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                prefix={<MessageOutlined style={{ color: '#6366f1' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Avg Response')}
                value={stats.avgResponseTime}
                loading={loading}
                valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                prefix={<BarChartOutlined style={{ color: '#a855f7' }} />}
                suffix="s"
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}

      <AiAssistantDataTableModule />
    </div>
  );
}
