import React, { useEffect, useState } from 'react';

import {
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
  CrownOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FacebookOutlined,
  FireOutlined,
  FlagOutlined,
  GlobalOutlined,
  HeartOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  MailOutlined,
  MessageOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  TwitterOutlined,
  UserOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@ant-design/pro-layout';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  Input,
  List,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Steps,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';

import useLanguage from '@/locale/useLanguage';
import { useDispatch, useSelector } from 'react-redux';

import CustomerChatInterface from '@/components/CustomerChatInterface';
import GenerateCustomerChatModal from '@/components/GenerateCustomerChatModal';
import { generate as uniqueId } from 'shortid';
import AISuggestionsModal from './AISuggestionsModal';
import CustomerInsightsModal from './CustomerInsightsModal';

import { selectCurrentItem } from '@/redux/erp/selectors';
import { useMoney } from '@/settings';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export default function ReadItem({ config, selectedItem, clientId: propClientId }) {
  const translate = useLanguage();
  const { entity, ENTITY_NAME } = config;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { moneyFormatter } = useMoney();

  const { result: currentResult } = useSelector(selectCurrentItem);

  const resetCustomer = {
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    customerType: 'individual',
    enabled: true,
    demographics: {},
    customerValue: {},
    behavior: {},
    interaction: {},
    leadScore: null,
    qualification: null,
  };

  const [currentCustomer, setCurrentCustomer] = useState(selectedItem ?? resetCustomer);
  const [calculatingScore, setCalculatingScore] = useState(false);
  const [customerJourney, setCustomerJourney] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loadingJourney, setLoadingJourney] = useState(false);
  const [loadingInteractions, setLoadingInteractions] = useState(false);
  const [showInteractionModal, setShowInteractionModal] = useState(false);
  const [interactionForm] = Form.useForm();

  // AI Insights state
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [customerInsights, setCustomerInsights] = useState(null);
  const [insightsError, setInsightsError] = useState(null);

  // AI Suggestions state
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

  // Chat state
  const [showChatModal, setShowChatModal] = useState(false);
  const [activeChatRoom, setActiveChatRoom] = useState(null);
  const [showResumeAlert, setShowResumeAlert] = useState(false);
  const [savedRoomData, setSavedRoomData] = useState(null);

  // Check for saved room on mount (for employee reconnection)
  useEffect(() => {
    const EMPLOYEE_ROOM_KEY = 'employee_active_chat_room';
    const savedData = localStorage.getItem(EMPLOYEE_ROOM_KEY);

    if (savedData) {
      try {
        const roomData = JSON.parse(savedData);
        const savedTime = new Date(roomData.timestamp);
        const now = new Date();
        const hoursSinceLastChat = (now - savedTime) / (1000 * 60 * 60);

        // Only show resume if session is less than 24 hours old
        if (hoursSinceLastChat < 24) {
          setSavedRoomData(roomData);
          setShowResumeAlert(true);
        } else {
          // Clear old session
          localStorage.removeItem(EMPLOYEE_ROOM_KEY);
        }
      } catch (error) {
        console.error('Error parsing saved room data:', error);
        localStorage.removeItem(EMPLOYEE_ROOM_KEY);
      }
    }
  }, []);

  const handleResumeChat = () => {
    if (savedRoomData) {
      setActiveChatRoom({
        roomId: savedRoomData.roomId,
        accessToken: savedRoomData.accessToken,
      });
      setShowResumeAlert(false);
    }
  };

  const handleDismissResumeAlert = () => {
    setShowResumeAlert(false);
    localStorage.removeItem('employee_active_chat_room');
  };

  // Helper function to safely extract ID string from potentially nested objects
  const getIdString = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object') {
      // Handle Buffer objects (MongoDB ObjectId as Buffer)
      if (id.buffer && id.buffer.data && Array.isArray(id.buffer.data)) {
        return id.buffer.data.map((byte) => byte.toString(16).padStart(2, '0')).join('');
      }
      // Handle MongoDB ObjectId objects or nested structures
      if (id.$oid) return id.$oid;
      if (id._id && typeof id._id === 'string') return id._id;
      if (id.id && typeof id.id === 'string') return id.id;
      if (typeof id.valueOf === 'function') {
        const val = id.valueOf();
        if (typeof val === 'string') return val;
      }
      // Try toString() method for ObjectId
      if (typeof id.toString === 'function' && id.toString() !== '[object Object]') {
        return id.toString();
      }
      return null;
    }
    return String(id);
  };

  useEffect(() => {
    const controller = new AbortController();
    if (currentResult) {
      setCurrentCustomer(currentResult);
      // Fetch journey and interactions when customer is loaded
      if (currentResult._id || propClientId) {
        // Use URL param as primary source since it's guaranteed to be a string
        let clientId = propClientId;

        if (!clientId && currentResult._id) {
          clientId = getIdString(currentResult._id);
        }

        if (clientId && clientId !== '[object Object]') {
          fetchCustomerJourney(clientId);
          fetchInteractions(clientId);
        }
      }
    }
    return () => controller.abort();
  }, [currentResult, propClientId]);

  const fetchCustomerJourney = async (clientId) => {
    setLoadingJourney(true);
    try {
      if (!clientId || clientId === '[object Object]') {
        return;
      }
      const response = await axios.get(`customer-journey/client/${clientId}`);

      if (response.data.success) {
        setCustomerJourney(response.data.result);
      }
    } catch (error) {
      // Journey may not exist yet, that's ok
    } finally {
      setLoadingJourney(false);
    }
  };

  const fetchInteractions = async (clientId) => {
    setLoadingInteractions(true);
    try {
      if (!clientId || clientId === '[object Object]') {
        return;
      }
      const response = await axios.get(`interaction/client/${clientId}`, {
        params: { limit: 20 },
      });

      if (response.data.success) {
        // Ensure result is an array
        setInteractions(Array.isArray(response.data.result) ? response.data.result : []);
      }
    } catch (error) {
      console.error('Error fetching interactions:', error);
      setInteractions([]);
    } finally {
      setLoadingInteractions(false);
    }
  };

  const handleCreateInteraction = async (values) => {
    try {
      const clientId = getIdString(currentCustomer._id);

      console.log('=== FRONTEND INTERACTION DEBUG ===');
      console.log('currentCustomer._id:', currentCustomer._id);
      console.log('clientId extracted:', clientId);
      console.log('values:', values);
      console.log('==================================');

      if (!clientId) {
        message.error('Customer ID is missing. Cannot log interaction.');
        return;
      }

      const response = await axios.post('interaction/create-with-journey', {
        client: clientId,
        ...values,
      });

      if (response.data.success) {
        message.success('Interaction logged successfully!');
        setShowInteractionModal(false);
        interactionForm.resetFields();
        // Refresh data
        fetchInteractions(clientId);
        fetchCustomerJourney(clientId);
        // Recalculate lead score
        calculateLeadScore();
      } else {
        message.error('Failed to log interaction');
      }
    } catch (error) {
      console.error('Error creating interaction:', error);
      message.error('Error logging interaction');
    }
  };

  const calculateLeadScore = async () => {
    const clientId = getIdString(currentCustomer._id);
    if (!clientId) return;

    setCalculatingScore(true);
    try {
      const response = await axios.post(`client/${clientId}/calculate-lead-score`, {});

      if (response.data.success) {
        setCurrentCustomer((prev) => ({
          ...prev,
          leadScore: response.data.result.leadScore,
          qualification: response.data.result.qualification,
        }));
        message.success('Lead score calculated successfully!');
      } else {
        message.error('Failed to calculate lead score');
      }
    } catch (error) {
      console.error('Error calculating lead score:', error);
      message.error('Error calculating lead score');
    } finally {
      setCalculatingScore(false);
    }
  };

  const getAICustomerInsights = async () => {
    const clientId = getIdString(currentCustomer._id);
    if (!clientId) {
      message.error('Customer ID is missing');
      return;
    }

    setLoadingInsights(true);
    setInsightsError(null);
    setShowInsightsModal(true);

    try {
      const response = await axios.post(`copilot/customer-insights/${clientId}`);

      if (response.data.success) {
        setCustomerInsights(response.data.result);
        message.success('Customer insights generated successfully!');
      } else {
        setInsightsError(response.data.message || 'Failed to generate insights');
        message.error('Failed to generate customer insights');
      }
    } catch (error) {
      console.error('Error generating customer insights:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Error generating customer insights';
      setInsightsError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoadingInsights(false);
    }
  };

  const getSegmentColor = (segment) => {
    const colorMap = {
      platinum: '#9370DB',
      gold: '#FFD700',
      silver: '#C0C0C0',
      bronze: '#CD7F32',
    };
    return colorMap[segment] || '#1890ff';
  };

  const getQualificationColor = (status) => {
    const colorMap = {
      unqualified: '#d9d9d9',
      marketing_qualified: '#52c41a',
      sales_qualified: '#1890ff',
      opportunity: '#fa8c16',
      customer: '#722ed1',
    };
    return colorMap[status] || '#d9d9d9';
  };

  const getTemperatureConfig = (temperature) => {
    const config = {
      cold: { color: '#1890ff', icon: <UserOutlined /> },
      warm: { color: '#fa8c16', icon: <FireOutlined /> },
      hot: { color: '#f5222d', icon: <ThunderboltOutlined /> },
    };
    return config[temperature] || config.cold;
  };

  const getScoreColor = (score) => {
    if (score >= 70) return '#52c41a'; // Green
    if (score >= 50) return '#faad14'; // Orange
    if (score >= 30) return '#1890ff'; // Blue
    return '#d9d9d9'; // Gray
  };

  const getJourneyStageConfig = (stage) => {
    const config = {
      awareness: { color: '#1890ff', icon: <EyeOutlined />, label: 'Awareness' },
      consideration: { color: '#52c41a', icon: <CommentOutlined />, label: 'Consideration' },
      decision: { color: '#faad14', icon: <CheckCircleOutlined />, label: 'Decision' },
      purchase: { color: '#722ed1', icon: <ShoppingCartOutlined />, label: 'Purchase' },
      retention: { color: '#13c2c2', icon: <HeartOutlined />, label: 'Retention' },
      advocacy: { color: '#eb2f96', icon: <StarOutlined />, label: 'Advocacy' },
      churned: { color: '#d9d9d9', icon: <CloseCircleOutlined />, label: 'Churned' },
    };
    return config[stage] || config.awareness;
  };

  const getChannelIcon = (channel) => {
    const icons = {
      email: <MailOutlined />,
      phone: <PhoneOutlined />,
      whatsapp: <WhatsAppOutlined />,
      facebook: <FacebookOutlined />,
      instagram: <InstagramOutlined />,
      twitter: <TwitterOutlined />,
      linkedin: <LinkedinOutlined />,
      live_chat: <MessageOutlined />,
      website: <GlobalOutlined />,
      in_person: <TeamOutlined />,
    };
    return icons[channel] || <GlobalOutlined />;
  };

  const getInteractionTypeColor = (type) => {
    const colors = {
      email: 'blue',
      phone_call: 'green',
      meeting: 'purple',
      purchase: 'gold',
      support_ticket: 'red',
      demo_request: 'cyan',
      quote_request: 'orange',
    };
    return colors[type] || 'default';
  };

  const getOutcomeColor = (outcome) => {
    const colors = {
      positive: 'success',
      interested: 'processing',
      closed_sale: 'success',
      needs_nurturing: 'warning',
      lost_opportunity: 'error',
      neutral: 'default',
    };
    return colors[outcome] || 'default';
  };

  const LeadScoreCard = () => {
    const leadScore = currentCustomer.leadScore;
    const qualification = currentCustomer.qualification;

    if (!leadScore && !qualification) {
      return (
        <Card
          title={
            <Space>
              <TrophyOutlined />
              {translate('Lead Score & Qualification')}
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={calculateLeadScore}
              loading={calculatingScore}
              size="small"
            >
              {translate('Calculate Score')}
            </Button>
          }
        >
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <TrophyOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
            <p style={{ color: '#999', fontSize: 16, marginBottom: 24 }}>
              {translate('No lead score calculated yet')}
            </p>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={calculateLeadScore}
              loading={calculatingScore}
              size="large"
            >
              {translate('Calculate Lead Score')}
            </Button>
          </div>
        </Card>
      );
    }

    const totalScore = leadScore?.totalScore || 0;
    const tempConfig = getTemperatureConfig(qualification?.temperature);

    return (
      <Card
        title={
          <Space>
            <TrophyOutlined />
            {translate('Lead Score & Qualification')}
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={calculateLeadScore}
            loading={calculatingScore}
            size="small"
          >
            {translate('Recalculate')}
          </Button>
        }
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Progress
                type="circle"
                percent={totalScore}
                strokeColor={getScoreColor(totalScore)}
                strokeWidth={8}
                width={140}
                format={(percent) => (
                  <div>
                    <div style={{ fontSize: 32, fontWeight: 'bold' }}>{percent}</div>
                    <div style={{ fontSize: 14, color: '#999', marginTop: 4 }}>Score</div>
                  </div>
                )}
              />
            </div>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <div style={{ padding: '20px 16px' }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 8, fontWeight: 500 }}>
                  {translate('Qualification Status')}
                </div>
                <Tag
                  color={getQualificationColor(qualification?.status)}
                  style={{ fontSize: 15, padding: '6px 16px', borderRadius: 4 }}
                >
                  {translate(
                    qualification?.status?.replace(/_/g, ' ').toUpperCase() || 'UNQUALIFIED'
                  )}
                </Tag>
              </div>

              <div>
                <div style={{ fontSize: 13, color: '#999', marginBottom: 8, fontWeight: 500 }}>
                  {translate('Temperature')}
                </div>
                <Tag
                  color={tempConfig.color}
                  icon={tempConfig.icon}
                  style={{ fontSize: 15, padding: '6px 16px', borderRadius: 4 }}
                >
                  {translate(qualification?.temperature?.toUpperCase() || 'COLD')}
                </Tag>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div style={{ padding: '20px 0' }}>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 12, fontWeight: 500 }}>
                {translate('Score Breakdown')}
              </div>
              {leadScore?.scoreBreakdown && (
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{translate('Demographic')}:</span>
                    <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
                      {leadScore.scoreBreakdown.demographicScore}
                    </Tag>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{translate('Behavioral')}:</span>
                    <Tag color="green" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
                      {leadScore.scoreBreakdown.behavioralScore}
                    </Tag>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{translate('Engagement')}:</span>
                    <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
                      {leadScore.scoreBreakdown.engagementScore}
                    </Tag>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{translate('Value')}:</span>
                    <Tag color="purple" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
                      {leadScore.scoreBreakdown.valueScore}
                    </Tag>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '4px 0',
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{translate('Interest')}:</span>
                    <Tag color="cyan" style={{ fontSize: 14, padding: '4px 12px', margin: 0 }}>
                      {leadScore.scoreBreakdown.interestScore}
                    </Tag>
                  </div>
                </Space>
              )}
            </div>
          </Col>
        </Row>

        {leadScore?.scoringFactors && leadScore.scoringFactors.length > 0 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <div style={{ padding: '8px 0' }}>
              <Title level={5} style={{ marginBottom: 16 }}>
                {translate('Key Scoring Factors')}:
              </Title>
              <Space wrap size="middle">
                {leadScore.scoringFactors.map((factor, index) => (
                  <Tooltip
                    key={index}
                    title={`${factor.points} points (Weight: ${factor.weight}%)`}
                  >
                    <Badge count={`+${factor.points}`} style={{ backgroundColor: '#52c41a' }}>
                      <Tag style={{ cursor: 'pointer', fontSize: 13, padding: '4px 12px' }}>
                        {factor.factor}
                      </Tag>
                    </Badge>
                  </Tooltip>
                ))}
              </Space>
            </div>
          </>
        )}

        {leadScore?.lastCalculated && (
          <div
            style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: '1px solid #f0f0f0',
              fontSize: 12,
              color: '#999',
              textAlign: 'right',
            }}
          >
            {translate('Last calculated')}:{' '}
            {dayjs(leadScore.lastCalculated).format('MMMM D, YYYY h:mm A')}
          </div>
        )}
      </Card>
    );
  };

  const CustomerJourneyCard = () => {
    if (loadingJourney) {
      return (
        <Card
          title={
            <Space>
              <RocketOutlined /> {translate('Customer Journey')}
            </Space>
          }
        >
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <ReloadOutlined spin style={{ fontSize: 32, color: '#1890ff' }} />
          </div>
        </Card>
      );
    }

    if (!customerJourney) {
      return (
        <Card
          title={
            <Space>
              <RocketOutlined /> {translate('Customer Journey')}
            </Space>
          }
        >
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <EnvironmentOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 24 }} />
            <p style={{ color: '#999', fontSize: 16, marginBottom: 8 }}>
              {translate('No journey data available yet')}
            </p>
            <p style={{ fontSize: 13, color: '#bfbfbf' }}>
              {translate('Journey will be created when first interaction is logged')}
            </p>
          </div>
        </Card>
      );
    }

    const stageConfig = getJourneyStageConfig(customerJourney.currentStage);
    const stageOrder = [
      'awareness',
      'consideration',
      'decision',
      'purchase',
      'retention',
      'advocacy',
    ];
    const currentStageIndex = stageOrder.indexOf(customerJourney.currentStage);

    return (
      <Card
        title={
          <Space>
            <RocketOutlined /> {translate('Customer Journey')}
          </Space>
        }
        extra={
          <Tag
            color={stageConfig.color}
            icon={stageConfig.icon}
            style={{ fontSize: 14, padding: '4px 12px' }}
          >
            {translate(stageConfig.label)}
          </Tag>
        }
      >
        {/* Journey Progress */}
        <div style={{ padding: '8px 0 24px' }}>
          <Steps
            current={currentStageIndex}
            size="small"
            items={stageOrder.map((stage) => {
              const config = getJourneyStageConfig(stage);
              return {
                title: translate(config.label),
                icon: config.icon,
              };
            })}
          />
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#fafafa', border: 'none' }}>
              <Statistic
                title={translate('Journey Duration')}
                value={customerJourney.metrics?.journeyDuration || 0}
                suffix={translate('days')}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#fafafa', border: 'none' }}>
              <Statistic
                title={translate('Total Interactions')}
                value={customerJourney.metrics?.totalInteractions || 0}
                prefix={<CommentOutlined />}
                valueStyle={{ fontSize: 24 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small" style={{ background: '#fafafa', border: 'none' }}>
              <Statistic
                title={translate('Engagement Score')}
                value={customerJourney.metrics?.engagementScore || 0}
                suffix="/ 100"
                prefix={<StarOutlined />}
                valueStyle={{
                  color: getScoreColor(customerJourney.metrics?.engagementScore || 0),
                  fontSize: 24,
                }}
              />
            </Card>
          </Col>
        </Row>

        {customerJourney.stages && customerJourney.stages.length > 0 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <Title level={5} style={{ marginBottom: 20 }}>
              {translate('Journey Timeline')}:
            </Title>
            <div style={{ padding: '0 8px' }}>
              <Timeline
                items={customerJourney.stages
                  .slice()
                  .reverse()
                  .map((stage) => {
                    const config = getJourneyStageConfig(stage.stage);
                    const duration = stage.duration
                      ? Math.floor(stage.duration / (1000 * 60 * 60 * 24))
                      : null;

                    return {
                      dot: React.createElement(config.icon.type, {
                        style: { fontSize: 18, color: config.color },
                      }),
                      children: (
                        <div style={{ paddingBottom: 16 }}>
                          <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
                            {translate(config.label)}
                            {stage.milestone && (
                              <Tag color="gold" style={{ marginLeft: 8, fontSize: 12 }}>
                                <FlagOutlined /> {stage.milestone}
                              </Tag>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: '#999', marginTop: 6 }}>
                            {dayjs(stage.enteredAt).format('MMMM D, YYYY')}
                            {duration && ` • ${duration} days`}
                          </div>
                          {stage.notes && (
                            <div
                              style={{
                                fontSize: 13,
                                marginTop: 8,
                                color: '#666',
                                lineHeight: 1.6,
                              }}
                            >
                              {stage.notes}
                            </div>
                          )}
                        </div>
                      ),
                    };
                  })}
              />
            </div>
          </>
        )}

        {customerJourney.recommendations && customerJourney.recommendations.length > 0 && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <Title level={5} style={{ marginBottom: 16 }}>
              {translate('Recommended Actions')}:
            </Title>
            <List
              dataSource={customerJourney.recommendations.filter((r) => !r.completed).slice(0, 3)}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 8px' }}>
                  <Space size="middle" align="start">
                    <Tag
                      color={
                        item.priority === 'urgent'
                          ? 'red'
                          : item.priority === 'high'
                            ? 'orange'
                            : 'blue'
                      }
                      style={{ fontSize: 12, padding: '4px 10px', margin: 0 }}
                    >
                      {translate(item.priority?.toUpperCase())}
                    </Tag>
                    <span style={{ fontSize: 14, lineHeight: 1.6 }}>{item.action}</span>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}
      </Card>
    );
  };

  const InteractionsCard = () => {
    const columns = [
      {
        title: translate('Date'),
        dataIndex: 'interactionDate',
        key: 'date',
        width: 130,
        render: (date) => <span style={{ fontSize: 13 }}>{dayjs(date).format('MMM D, YYYY')}</span>,
      },
      {
        title: translate('Type'),
        dataIndex: 'type',
        key: 'type',
        width: 140,
        render: (type) => (
          <Tag color={getInteractionTypeColor(type)} style={{ fontSize: 12, padding: '4px 10px' }}>
            {translate(type?.replace(/_/g, ' ').toUpperCase())}
          </Tag>
        ),
      },
      {
        title: translate('Channel'),
        dataIndex: 'channel',
        key: 'channel',
        width: 140,
        render: (channel) => (
          <Space size="small">
            <span style={{ fontSize: 16 }}>{getChannelIcon(channel)}</span>
            <span style={{ fontSize: 13 }}>{translate(channel)}</span>
          </Space>
        ),
      },
      {
        title: translate('Subject'),
        dataIndex: 'subject',
        key: 'subject',
        ellipsis: true,
        render: (text) => <span style={{ fontSize: 13 }}>{text || '-'}</span>,
      },
      {
        title: translate('Outcome'),
        dataIndex: 'outcome',
        key: 'outcome',
        width: 150,
        render: (outcome) =>
          outcome ? (
            <Tag color={getOutcomeColor(outcome)} style={{ fontSize: 12, padding: '4px 10px' }}>
              {translate(outcome?.replace(/_/g, ' '))}
            </Tag>
          ) : (
            <span style={{ color: '#999' }}>-</span>
          ),
      },
    ];

    return (
      <Card
        title={
          <Space>
            <CommentOutlined /> {translate('Interaction History')}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowInteractionModal(true)}
          >
            {translate('Log Interaction')}
          </Button>
        }
      >
        <Table
          dataSource={interactions}
          columns={columns}
          rowKey="_id"
          loading={loadingInteractions}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${translate('Total')} ${total} ${translate('interactions')}`,
          }}
          size="middle"
          style={{ marginTop: 8 }}
        />
      </Card>
    );
  };

  const InteractionModal = () => (
    <Modal
      title={translate('Log New Interaction')}
      open={showInteractionModal}
      onCancel={() => {
        setShowInteractionModal(false);
        interactionForm.resetFields();
      }}
      onOk={() => interactionForm.submit()}
      width={600}
    >
      <Form form={interactionForm} layout="vertical" onFinish={handleCreateInteraction}>
        <Form.Item
          name="type"
          label={translate('Interaction Type')}
          rules={[{ required: true, message: translate('Please select type') }]}
        >
          <Select placeholder={translate('Select type')}>
            <Select.Option value="email">{translate('Email')}</Select.Option>
            <Select.Option value="phone_call">{translate('Phone Call')}</Select.Option>
            <Select.Option value="meeting">{translate('Meeting')}</Select.Option>
            <Select.Option value="chat">{translate('Chat')}</Select.Option>
            <Select.Option value="demo_request">{translate('Demo Request')}</Select.Option>
            <Select.Option value="quote_request">{translate('Quote Request')}</Select.Option>
            <Select.Option value="purchase">{translate('Purchase')}</Select.Option>
            <Select.Option value="support_ticket">{translate('Support Ticket')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="channel"
          label={translate('Channel')}
          rules={[{ required: true, message: translate('Please select channel') }]}
        >
          <Select placeholder={translate('Select channel')}>
            <Select.Option value="email">{translate('Email')}</Select.Option>
            <Select.Option value="phone">{translate('Phone')}</Select.Option>
            <Select.Option value="live_chat">{translate('Live Chat')}</Select.Option>
            <Select.Option value="whatsapp">{translate('WhatsApp')}</Select.Option>
            <Select.Option value="website">{translate('Website')}</Select.Option>
            <Select.Option value="in_person">{translate('In Person')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="direction"
          label={translate('Direction')}
          rules={[{ required: true, message: translate('Please select direction') }]}
        >
          <Select placeholder={translate('Select direction')}>
            <Select.Option value="inbound">{translate('Inbound')}</Select.Option>
            <Select.Option value="outbound">{translate('Outbound')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="subject" label={translate('Subject')}>
          <Input placeholder={translate('Enter subject')} />
        </Form.Item>

        <Form.Item name="description" label={translate('Description')}>
          <Input.TextArea rows={3} placeholder={translate('Enter description')} />
        </Form.Item>

        <Form.Item name="outcome" label={translate('Outcome')}>
          <Select placeholder={translate('Select outcome')}>
            <Select.Option value="positive">{translate('Positive')}</Select.Option>
            <Select.Option value="interested">{translate('Interested')}</Select.Option>
            <Select.Option value="neutral">{translate('Neutral')}</Select.Option>
            <Select.Option value="needs_nurturing">{translate('Needs Nurturing')}</Select.Option>
            <Select.Option value="closed_sale">{translate('Closed Sale')}</Select.Option>
            <Select.Option value="lost_opportunity">{translate('Lost Opportunity')}</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="journeyStage" label={translate('Journey Stage')}>
          <Select placeholder={translate('Select journey stage')}>
            <Select.Option value="awareness">{translate('Awareness')}</Select.Option>
            <Select.Option value="consideration">{translate('Consideration')}</Select.Option>
            <Select.Option value="decision">{translate('Decision')}</Select.Option>
            <Select.Option value="purchase">{translate('Purchase')}</Select.Option>
            <Select.Option value="retention">{translate('Retention')}</Select.Option>
            <Select.Option value="advocacy">{translate('Advocacy')}</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );

  return (
    <>
      {/* Resume Chat Alert */}
      {showResumeAlert && savedRoomData && (
        <Alert
          message="Previous Chat Session Found"
          description={`You have an active chat session. Would you like to resume it?`}
          type="info"
          showIcon
          action={
            <Space>
              <Button size="small" type="primary" onClick={handleResumeChat}>
                Resume Chat
              </Button>
              <Button size="small" onClick={handleDismissResumeAlert}>
                Dismiss
              </Button>
            </Space>
          }
          closable
          onClose={handleDismissResumeAlert}
          style={{ marginBottom: 16 }}
        />
      )}

      <PageHeader
        onBack={() => {
          navigate(`/${entity.toLowerCase()}`);
        }}
        title={`${ENTITY_NAME}: ${currentCustomer.name}`}
        ghost={false}
        tags={
          currentCustomer.enabled ? (
            <Tag color="green">{translate('Active')}</Tag>
          ) : (
            <Tag color="red">{translate('Inactive')}</Tag>
          )
        }
        extra={[
          <Button
            key="start-chat"
            icon={<MessageOutlined />}
            onClick={() => setShowChatModal(true)}
            style={{ marginRight: 8 }}
          >
            {translate('Start Chat')}
          </Button>,
          <Button
            key="ai-insights"
            type="primary"
            icon={<BulbOutlined />}
            onClick={() => setShowSuggestionsModal(true)}
            style={{ marginRight: 8 }}
          >
            {translate('AI Suggestions')}
          </Button>,
          <Button
            key={`${uniqueId()}`}
            onClick={() => {
              navigate(`/${entity.toLowerCase()}`);
            }}
            icon={<CloseCircleOutlined />}
          >
            {translate('Close')}
          </Button>,
        ]}
        style={{
          padding: '20px 0px',
        }}
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title={translate('Customer Type')}
              value={translate(currentCustomer.customerType || 'Individual')}
            />
          </Col>
          {currentCustomer.customerValue?.segment && (
            <Col span={6}>
              <Statistic
                title={translate('Segment')}
                value={currentCustomer.customerValue.segment}
                valueStyle={{ color: getSegmentColor(currentCustomer.customerValue.segment) }}
              />
            </Col>
          )}
          {currentCustomer.customerValue?.lifetimeValue && (
            <Col span={6}>
              <Statistic
                title={translate('Lifetime Value')}
                value={moneyFormatter({
                  amount: currentCustomer.customerValue.lifetimeValue,
                  currency_code: 'USD',
                })}
                prefix={<DollarOutlined />}
              />
            </Col>
          )}
          {currentCustomer.behavior?.visitFrequency && (
            <Col span={6}>
              <Statistic
                title={translate('Monthly Visits')}
                value={currentCustomer.behavior.visitFrequency}
                prefix={<ShoppingOutlined />}
              />
            </Col>
          )}
        </Row>
      </PageHeader>

      <Divider dashed />

      {/* Main Content - Better spacing for laptops */}
      <Row gutter={[24, 24]}>
        {/* Customer Profile Card - Full width on small laptops, 1/3 on larger screens */}
        <Col xs={24} lg={24} xl={8} xxl={8}>
          <Card>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                style={{
                  backgroundColor: currentCustomer.customerValue?.segment
                    ? getSegmentColor(currentCustomer.customerValue.segment)
                    : '#1890ff',
                }}
              />
              <Title level={4} style={{ marginTop: 16, marginBottom: 0 }}>
                {currentCustomer.name}
              </Title>
              <div style={{ marginTop: 8 }}>
                {currentCustomer.customerType && (
                  <Tag color={currentCustomer.customerType === 'company' ? 'blue' : 'green'}>
                    {translate(
                      currentCustomer.customerType === 'company' ? 'Company' : 'Individual'
                    )}
                  </Tag>
                )}
                {currentCustomer.customerValue?.segment && (
                  <Tag color={getSegmentColor(currentCustomer.customerValue.segment)}>
                    <CrownOutlined style={{ marginRight: 4 }} />
                    {currentCustomer.customerValue.segment.charAt(0).toUpperCase() +
                      currentCustomer.customerValue.segment.slice(1)}
                  </Tag>
                )}
              </div>
            </div>

            <Descriptions column={1} size="middle">
              <Descriptions.Item
                label={
                  <>
                    <PhoneOutlined /> {translate('Phone')}
                  </>
                }
              >
                {currentCustomer.phone || translate('Not provided')}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined /> {translate('Email')}
                  </>
                }
              >
                {currentCustomer.email || translate('Not provided')}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <GlobalOutlined /> {translate('Company')}
                  </>
                }
              >
                {currentCustomer.company || translate('Not provided')}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Address')}>
                {currentCustomer.address || translate('Not provided')}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Customer Details - Full width on small laptops, 2/3 on larger screens */}
        <Col xs={24} lg={24} xl={16} xxl={16}>
          <Card title={translate('Customer Information')} style={{ marginBottom: 24 }}>
            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2 }} size="middle">
              <Descriptions.Item label={translate('Customer Since')} span={1}>
                {currentCustomer.customerValue?.customerSince
                  ? dayjs(currentCustomer.customerValue.customerSince).format('MMMM D, YYYY')
                  : dayjs(currentCustomer.created).format('MMMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Status')} span={1}>
                {currentCustomer.enabled ? (
                  <Tag color="green">{translate('Active')}</Tag>
                ) : (
                  <Tag color="red">{translate('Inactive')}</Tag>
                )}
              </Descriptions.Item>

              {/* Demographics */}
              {currentCustomer.demographics?.age && (
                <Descriptions.Item label={translate('Age')} span={1}>
                  {currentCustomer.demographics.age}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.gender && (
                <Descriptions.Item label={translate('Gender')} span={1}>
                  {translate(currentCustomer.demographics.gender)}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.location && (
                <Descriptions.Item label={translate('Location')} span={1}>
                  {currentCustomer.demographics.location}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.occupation && (
                <Descriptions.Item label={translate('Occupation')} span={1}>
                  {currentCustomer.demographics.occupation}
                </Descriptions.Item>
              )}
              {currentCustomer.demographics?.income && (
                <Descriptions.Item label={translate('Annual Income')} span={1}>
                  {moneyFormatter({
                    amount: currentCustomer.demographics.income,
                    currency_code: 'USD',
                  })}
                </Descriptions.Item>
              )}

              {/* Customer Value */}
              {currentCustomer.customerValue?.lifetimeValue && (
                <Descriptions.Item label={translate('Lifetime Value')} span={1}>
                  {moneyFormatter({
                    amount: currentCustomer.customerValue.lifetimeValue,
                    currency_code: 'USD',
                  })}
                </Descriptions.Item>
              )}

              {/* Behavior */}
              {currentCustomer.behavior?.lastPurchaseDate && (
                <Descriptions.Item label={translate('Last Purchase')} span={1}>
                  {dayjs(currentCustomer.behavior.lastPurchaseDate).format('MMMM D, YYYY')}
                </Descriptions.Item>
              )}
              {currentCustomer.behavior?.purchaseFrequency && (
                <Descriptions.Item label={translate('Purchase Frequency')} span={1}>
                  {translate(currentCustomer.behavior.purchaseFrequency)}
                </Descriptions.Item>
              )}
              {currentCustomer.behavior?.preferredPaymentMethod && (
                <Descriptions.Item label={translate('Preferred Payment')} span={1}>
                  {translate(currentCustomer.behavior.preferredPaymentMethod)}
                </Descriptions.Item>
              )}
              {currentCustomer.behavior?.visitFrequency && (
                <Descriptions.Item label={translate('Visit Frequency')} span={1}>
                  {currentCustomer.behavior.visitFrequency} {translate('times per month')}
                </Descriptions.Item>
              )}

              {/* Latest Interaction */}
              {currentCustomer.interaction?.channel && (
                <Descriptions.Item label={translate('Last Contact Channel')} span={1}>
                  {translate(currentCustomer.interaction.channel)}
                </Descriptions.Item>
              )}
              {currentCustomer.interaction?.type && (
                <Descriptions.Item label={translate('Last Interaction Type')} span={1}>
                  {translate(currentCustomer.interaction.type)}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Preferred Products */}
            {currentCustomer.behavior?.preferredProducts &&
              currentCustomer.behavior.preferredProducts.length > 0 && (
                <>
                  <Divider />
                  <div>
                    <Title level={5}>{translate('Preferred Products')}:</Title>
                    <div style={{ marginTop: 8 }}>
                      {currentCustomer.behavior.preferredProducts.map((product, index) => (
                        <Tag key={index} style={{ margin: '4px' }}>
                          {product}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </>
              )}

            {/* Interaction Notes */}
            {currentCustomer.interaction?.notes && (
              <>
                <Divider />
                <div>
                  <Title level={5}>{translate('Latest Notes')}:</Title>
                  <p style={{ marginTop: 8, color: '#666' }}>{currentCustomer.interaction.notes}</p>
                  {currentCustomer.interaction.outcome && (
                    <p style={{ marginTop: 8, fontWeight: 'bold' }}>
                      {translate('Outcome')}: {currentCustomer.interaction.outcome}
                    </p>
                  )}
                </div>
              </>
            )}
          </Card>
        </Col>
      </Row>

      {/* Lead Score & Qualification Section */}
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24}>
          <LeadScoreCard />
        </Col>
      </Row>
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24}>
          <CustomerJourneyCard />
        </Col>
      </Row>

      {/* Customer Journey Section */}
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        <Col xs={24}>
          <InteractionsCard />
        </Col>
      </Row>

      {/* Customer Chat Section - Show if active chat exists */}
      {activeChatRoom && (
        <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
          <Col xs={24}>
            <CustomerChatInterface
              roomId={activeChatRoom.roomId}
              accessToken={activeChatRoom.accessToken}
              userType="employee"
            />
          </Col>
        </Row>
      )}

      {/* Interaction Modal */}
      <InteractionModal />

      {/* AI Customer Insights Modal */}
      <CustomerInsightsModal
        visible={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
        loading={loadingInsights}
        insights={customerInsights}
        error={insightsError}
      />

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        visible={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        customerData={currentCustomer}
      />

      {/* Generate Customer Chat Modal */}
      <GenerateCustomerChatModal
        visible={showChatModal}
        onCancel={() => setShowChatModal(false)}
        customerId={getIdString(currentCustomer._id)}
        customerName={currentCustomer.name}
        onGenerated={(result) => {
          message.success('Chat room created!');
          setActiveChatRoom(result);
          setShowChatModal(false);
        }}
      />
    </>
  );
}
