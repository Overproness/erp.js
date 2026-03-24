import useLanguage from '@/locale/useLanguage';
import { selectProcessingStats, selectProcessingStatsLoading } from '@/redux/ai/aiSelectors';
import { fetchProcessingStats } from '@/redux/ai/aiThunks';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Card,
  Col,
  DatePicker,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ProcessingAnalytics = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [timeframe, setTimeframe] = useState('30_days');
  const [selectedMetric, setSelectedMetric] = useState('documents');

  const processingStats = useSelector(selectProcessingStats);
  const loading = useSelector(selectProcessingStatsLoading);
  const prevTimeframeRef = useRef('');

  useEffect(() => {
    if (prevTimeframeRef.current === timeframe) return;
    prevTimeframeRef.current = timeframe;
    dispatch(fetchProcessingStats({ timeframe }));
  }, [dispatch, timeframe]);

  // Mock data for demonstration
  const mockStats = {
    overview: {
      totalDocuments: 2847,
      successRate: 94.8,
      avgProcessingTime: 2.3,
      totalCostSaved: 15420,
    },
    dailyProcessing: [
      { date: '2024-01-01', documents: 45, success: 42, failed: 3 },
      { date: '2024-01-02', documents: 52, success: 50, failed: 2 },
      { date: '2024-01-03', documents: 38, success: 35, failed: 3 },
      { date: '2024-01-04', documents: 61, success: 59, failed: 2 },
      { date: '2024-01-05', documents: 47, success: 46, failed: 1 },
      { date: '2024-01-06', documents: 55, success: 52, failed: 3 },
      { date: '2024-01-07', documents: 49, success: 47, failed: 2 },
    ],
    documentTypes: [
      { name: 'Invoices', value: 45, color: '#1890ff' },
      { name: 'Receipts', value: 30, color: '#52c41a' },
      { name: 'Contracts', value: 15, color: '#fa8c16' },
      { name: 'Others', value: 10, color: '#722ed1' },
    ],
    topWorkflows: [
      {
        name: 'Invoice Processing',
        executions: 234,
        successRate: 96.2,
        avgTime: 1.8,
        trend: 'up',
      },
      {
        name: 'Receipt Analysis',
        executions: 156,
        successRate: 92.3,
        avgTime: 2.1,
        trend: 'up',
      },
      {
        name: 'Contract Review',
        executions: 89,
        successRate: 94.4,
        avgTime: 3.2,
        trend: 'stable',
      },
    ],
    recentErrors: [
      {
        id: 1,
        type: 'OCR Failed',
        document: 'invoice_001.pdf',
        time: '2024-01-15 14:30',
        reason: 'Poor image quality',
      },
      {
        id: 2,
        type: 'Data Extraction',
        document: 'receipt_045.jpg',
        time: '2024-01-15 13:15',
        reason: 'Template mismatch',
      },
    ],
  };

  const currentStats = processingStats || mockStats;

  const columns = [
    {
      title: translate('Workflow'),
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<BarChartOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <div>
            <div style={{ fontWeight: 'bold' }}>{text}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.executions} {translate('executions')}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: translate('Success Rate'),
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate) => (
        <Progress
          percent={rate}
          size="small"
          status={rate > 95 ? 'success' : rate > 90 ? 'normal' : 'exception'}
        />
      ),
    },
    {
      title: translate('Avg Time'),
      dataIndex: 'avgTime',
      key: 'avgTime',
      render: (time) => `${time}s`,
    },
    {
      title: translate('Trend'),
      dataIndex: 'trend',
      key: 'trend',
      render: (trend) => (
        <Tag color={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'blue'}>
          {translate(trend)}
        </Tag>
      ),
    },
  ];

  const errorColumns = [
    {
      title: translate('Error Type'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: translate('Document'),
      dataIndex: 'document',
      key: 'document',
    },
    {
      title: translate('Time'),
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: translate('Reason'),
      dataIndex: 'reason',
      key: 'reason',
    },
  ];

  return (
    <div>
      <Alert
        message={translate('Processing Analytics')}
        description={translate(
          'Monitor and analyze your data processing performance, success rates, and workflow efficiency.'
        )}
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* Controls */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>{translate('Time Period')}:</Text>
          </Col>
          <Col>
            <Select value={timeframe} onChange={setTimeframe} style={{ width: 150 }}>
              <Select.Option value="7_days">{translate('Last 7 days')}</Select.Option>
              <Select.Option value="30_days">{translate('Last 30 days')}</Select.Option>
              <Select.Option value="90_days">{translate('Last 90 days')}</Select.Option>
            </Select>
          </Col>
          <Col>
            <RangePicker />
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>{translate('Loading analytics data...')}</div>
          </div>
        </Card>
      ) : (
        <>
          {/* Overview Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title={translate('Documents Processed')}
                  value={currentStats.overview.totalDocuments}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title={translate('Success Rate')}
                  value={currentStats.overview.successRate}
                  suffix="%"
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title={translate('Avg Processing Time')}
                  value={currentStats.overview.avgProcessingTime}
                  suffix="s"
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title={translate('Cost Saved')}
                  value={currentStats.overview.totalCostSaved}
                  suffix=""
                  prefix={<TrophyOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={16}>
              <Card
                title={
                  <>
                    <BarChartOutlined /> {translate('Daily Processing Volume')}
                  </>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={currentStats.dailyProcessing}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="documents"
                      stroke="#1890ff"
                      size={2}
                      name={translate('Total Documents')}
                    />
                    <Line
                      type="monotone"
                      dataKey="success"
                      stroke="#52c41a"
                      size={2}
                      name={translate('Successful')}
                    />
                    <Line
                      type="monotone"
                      dataKey="failed"
                      stroke="#ff4d4f"
                      size={2}
                      name={translate('Failed')}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={8}>
              <Card
                title={
                  <>
                    <DatabaseOutlined /> {translate('Document Types')}
                  </>
                }
              >
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={currentStats.documentTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {currentStats.documentTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Workflow Performance */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={14}>
              <Card
                title={
                  <>
                    <RiseOutlined /> {translate('Top Performing Workflows')}
                  </>
                }
              >
                <Table
                  dataSource={currentStats.topWorkflows}
                  columns={columns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={10}>
              <Card
                title={
                  <>
                    <ExclamationCircleOutlined /> {translate('Recent Errors')}
                  </>
                }
              >
                <Table
                  dataSource={currentStats.recentErrors}
                  columns={errorColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>

          {/* Performance Metrics */}
          <Card title={translate('Performance Metrics')}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" title={translate('OCR Accuracy')}>
                  <Progress
                    type="circle"
                    percent={96.5}
                    status="success"
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary">{translate('Optical Character Recognition')}</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title={translate('Data Extraction')}>
                  <Progress
                    type="circle"
                    percent={92.8}
                    status="success"
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary">{translate('Structured Data Extraction')}</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" title={translate('Workflow Automation')}>
                  <Progress
                    type="circle"
                    percent={88.2}
                    status="normal"
                    format={(percent) => `${percent}%`}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Text type="secondary">{translate('End-to-End Automation')}</Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProcessingAnalytics;
