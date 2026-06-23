import useLanguage from '@/locale/useLanguage';
import {
  BarChartOutlined,
  DeleteOutlined,
  EditOutlined,
  ExperimentOutlined,
  EyeOutlined,
  LinkOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  StopOutlined,
  TrophyOutlined,
} from '@/components/icons';
import {
  Button,
  Card,
  Col,
  message,
  Modal,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from '@/components/ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ABTestDetails from './ABTestDetails.jsx';
import ABTestResults from './ABTestResults';
import CreateABTest from './CreateABTest';

// Redux
import {
  createABTest,
  fetchABTests,
  pauseABTest,
  selectABTestsLoading,
  selectABTestsRecent,
  selectABTestsSummary,
  startABTest,
  stopABTest,
} from '@/redux/url';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ABTestModule = () => {
  const translate = useLanguage();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const abTestsSummary = useSelector(selectABTestsSummary);
  const abTests = useSelector(selectABTestsRecent);
  const isLoading = useSelector(selectABTestsLoading);

  const [activeTab, setActiveTab] = useState('active');
  const [selectedTest, setSelectedTest] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch tests and update local state
  const refreshTests = useCallback(() => {
    dispatch(fetchABTests());
  }, [dispatch]);

  const loadedRef = useRef(false);
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    refreshTests();
  }, [refreshTests]);

  const handleCreateTest = async (formData) => {
    try {
      // Directly pass the mapped payload from CreateABTest
      await dispatch(createABTest(formData)).unwrap();
      message.success(translate('A/B test created successfully'));
      setShowCreateModal(false);
      refreshTests();
    } catch (error) {
      message.error(translate('Failed to create A/B test'));
    }
  };

  const handleStartTest = async (testId) => {
    try {
      await dispatch(startABTest(testId)).unwrap();
      message.success(translate('Test started successfully'));
      refreshTests();
    } catch (error) {
      message.error(translate('Failed to start test'));
    }
  };

  const handleStopTest = async (testId) => {
    try {
      await dispatch(stopABTest(testId)).unwrap();
      message.success(translate('Test stopped successfully'));
      refreshTests();
    } catch (error) {
      message.error(translate('Failed to stop test'));
    }
  };

  const handlePauseTest = async (testId) => {
    try {
      await dispatch(pauseABTest(testId)).unwrap();
      message.success(translate('Test paused successfully'));
      refreshTests();
    } catch (error) {
      message.error(translate('Failed to pause test'));
    }
  };

  const handleDeleteTest = async (testId) => {
    Modal.confirm({
      title: translate('Delete A/B Test'),
      content: translate(
        'Are you sure you want to delete this A/B test? This action cannot be undone.'
      ),
      okText: translate('Delete'),
      okType: 'danger',
      cancelText: translate('Cancel'),
      onOk: async () => {
        message.info(translate('Delete test not implemented in Redux yet'));
        // await dispatch(deleteABTest(testId));
        // refreshTests();
      },
    });
  };

  const handleViewResults = async (test) => {
    // If you have a thunk to fetch results, use it here
    setSelectedTest(test);
    setShowResultsModal(true);
  };

  const handleViewDetails = (test) => {
    const normVariants = normalizeVariants(test);
    const normTimeline = normalizeTimeline(test.timeline);
    setSelectedTest({
      ...test,
      variants: normVariants,
      timeline: normTimeline,
    });
    setShowDetailsModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      running: 'processing',
      paused: 'warning',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <EditOutlined />,
      running: <PlayCircleOutlined />,
      paused: <PauseCircleOutlined />,
      completed: <TrophyOutlined />,
      cancelled: <StopOutlined />,
    };
    return icons[status] || <ExperimentOutlined />;
  };

  // Normalize variants for table/details: always include control as first variant
  const normalizeVariants = (record) => {
    let variants = [];
    // Control
    if (record.controlUrl) {
      variants.push({
        ...record.controlUrl,
        name: 'Control',
        isControl: true,
        clicks: record.controlClicks ?? record.controlUrl.clicks ?? 0,
        conversions: record.controlConversions ?? record.controlUrl.conversions ?? 0,
        conversionRate: record.controlConversionRate ?? record.controlUrl.conversionRate ?? 0,
        id: record.controlUrl._id ?? record.controlUrl.id,
        url: record.controlUrl.shortenedUrl ?? record.controlUrl.url,
        description: record.controlUrl.title ?? '',
      });
    }
    // Variants (if any)
    if (Array.isArray(record.variants) && record.variants.length > 0) {
      variants = variants.concat(
        record.variants.map((v, idx) => ({
          ...v,
          isControl: false,
          name: v.name || `Variant ${idx + 1}`,
          clicks: v.clicks ?? 0,
          conversions: v.conversions ?? 0,
          conversionRate: v.conversionRate ?? 0,
          id: v._id ?? v.id,
          url: v.shortenedUrl ?? v.url,
          description: v.title ?? v.description ?? '',
        }))
      );
    }
    return variants;
  };

  const normalizeTimeline = (timeline) => {
    if (Array.isArray(timeline)) return timeline;
    if (!timeline) return [];
    if (typeof timeline === 'object') return [timeline];
    return [];
  };

  const columns = [
    {
      title: translate('Test Name'),
      dataIndex: 'testName',
      key: 'testName',
      render: (testName, record) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1890ff' }}>{testName}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{record.description}</div>
        </div>
      ),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {translate(status)}
        </Tag>
      ),
    },
    {
      title: translate('Variants'),
      key: 'variants',
      render: (_, record) => {
        const normVariants = normalizeVariants(record);
        return (
          <Space>
            <Text>
              {normVariants.length} {translate('variants')}
            </Text>
          </Space>
        );
      },
    },
    {
      title: translate('Traffic'),
      key: 'totalClicks',
      render: (_, record) => {
        const normVariants = normalizeVariants(record);
        const totalClicks = normVariants.reduce((sum, v) => sum + (v.clicks || 0), 0);
        return (
          <div>
            <div style={{ fontWeight: 600 }}>{totalClicks}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {record.targetClicks ? `/ ${record.targetClicks}` : ''}
            </div>
          </div>
        );
      },
    },
    {
      title: translate('Conversion'),
      key: 'conversionRate',
      render: (_, record) => {
        const normVariants = normalizeVariants(record);
        const bestRate = Math.max(...normVariants.map((v) => v.conversionRate || 0));
        // Winner logic: highest conversionRate
        const winner = normVariants.reduce(
          (acc, v) => (v.conversionRate > (acc?.conversionRate || 0) ? v : acc),
          null
        );
        return (
          <div>
            <Progress
              percent={bestRate}
              size="small"
              strokeColor="#52c41a"
              format={(percent) => `${percent}%`}
            />
            {winner && (
              <Tag color="gold" size="small" style={{ marginTop: '4px' }}>
                {translate('Winner')}: {winner.name}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: translate('Duration'),
      key: 'duration',
      render: (_, record) => {
        const start = dayjs(record.startDate);
        const end = record.endDate ? dayjs(record.endDate) : dayjs();
        const duration = end.diff(start, 'day');
        return (
          <div>
            <div>
              {duration} {translate('days')}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {start.format('MMM D')} - {end.format('MMM D')}
            </div>
          </div>
        );
      },
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title={translate('View Details')}>
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
          </Tooltip>

          {record.status === 'completed' && (
            <Tooltip title={translate('View Results')}>
              <Button
                type="text"
                icon={<BarChartOutlined />}
                onClick={() => handleViewResults(record)}
              />
            </Tooltip>
          )}

          {record.status === 'draft' && (
            <Tooltip title={translate('Start Test')}>
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartTest(record._id)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}

          {/* Show stop for active/running/paused */}
          {['active', 'running', 'paused'].includes(record.status) && (
            <Tooltip title={translate('Stop Test')}>
              <Button
                type="text"
                icon={<StopOutlined />}
                onClick={() => handleStopTest(record._id)}
                style={{ color: '#ff4d4f' }}
              />
            </Tooltip>
          )}

          {record.status === 'running' && (
            <Tooltip title={translate('Pause Test')}>
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                onClick={() => handlePauseTest(record._id)}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}

          {record.status === 'paused' && (
            <Tooltip title={translate('Resume Test')}>
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStartTest(record._id)}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          )}

          <Tooltip title={translate('Delete')}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteTest(record._id)}
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filterTestsByStatus = (status) => {
    if (!abTests) return [];

    switch (status) {
      case 'active':
        return abTests.filter((test) => ['running', 'paused', 'active'].includes(test.status));
      case 'completed':
        return abTests.filter((test) => test.status === 'completed');
      case 'draft':
        return abTests.filter((test) => test.status === 'draft');
      default:
        return abTests;
    }
  };

  const getTabCounts = () => {
    return {
      active: abTestsSummary.activeTests || 0,
      completed: abTestsSummary.completedTests || 0,
      draft: abTestsSummary.draftTests || 0,
      all: abTestsSummary.totalTests || 0,
    };
  };

  const tabCounts = getTabCounts();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('A/B Testing')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              {translate('Create and manage A/B tests for your URLs')}
            </Text>
          </div>
          <Space>
            {/* New Button to go to URL Manager */}
            <Button icon={<LinkOutlined />} onClick={() => navigate('/url')}>
              {translate('Go to URL Manager')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
              {translate('Create A/B Test')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Active Tests')}
              value={tabCounts.active}
              valueStyle={{ color: '#1890ff' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Completed Tests')}
              value={tabCounts.completed}
              valueStyle={{ color: '#52c41a' }}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Draft Tests')}
              value={tabCounts.draft}
              valueStyle={{ color: '#faad14' }}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Tests')}
              value={tabCounts.all}
              valueStyle={{ color: '#722ed1' }}
              prefix={<ExperimentOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tests Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
          <TabPane tab={`${translate('Active')} (${tabCounts.active})`} key="active">
            <Table
              columns={columns}
              dataSource={filterTestsByStatus('active')}
              rowKey="_id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={`${translate('Completed')} (${tabCounts.completed})`} key="completed">
            <Table
              columns={columns}
              dataSource={filterTestsByStatus('completed')}
              rowKey="_id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={`${translate('Draft')} (${tabCounts.draft})`} key="draft">
            <Table
              columns={columns}
              dataSource={filterTestsByStatus('draft')}
              rowKey="_id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>

          <TabPane tab={`${translate('All')} (${tabCounts.all})`} key="all">
            <Table
              columns={columns}
              dataSource={abTests}
              rowKey="_id"
              loading={isLoading}
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Modals */}
      <Modal
        title={translate('Create A/B Test')}
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={800}
      >
        <CreateABTest onSubmit={handleCreateTest} onCancel={() => setShowCreateModal(false)} />
      </Modal>

      <Modal
        title={translate('Test Results')}
        open={showResultsModal}
        onCancel={() => setShowResultsModal(false)}
        footer={null}
        width={1000}
      >
        {selectedTest && (
          <ABTestResults test={selectedTest} onClose={() => setResultsModalOpen(false)} />
        )}
      </Modal>

      <Modal
        title={translate('Test Details')}
        open={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={null}
        width={800}
      >
        {selectedTest && (
          <ABTestDetails
            test={{
              ...selectedTest,
              variants: selectedTest.variants,
              timeline: normalizeTimeline(selectedTest.timeline),
            }}
            onClose={() => setShowDetailsModal(false)}
            onEdit={(test) => {
              setShowDetailsModal(false);
              // Handle edit
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default ABTestModule;
