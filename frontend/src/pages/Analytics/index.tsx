import PageLoader from '@/components/PageLoader';
import apolloClient from '@/graphql/client';
import { GENERATE_ANALYTICS_REPORT, GET_ANALYTICS_OVERVIEW, GET_REALTIME_ANALYTICS, GET_MODULE_ANALYTICS } from '@/graphql/operations/analytics';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  FileOutlined,
  LineChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  RobotOutlined,
  ShoppingOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, DatePicker, message, Row, Select, Statistic } from '@/components/ui';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import AISuggestionsModal from './AISuggestionsModal';
import CustomReportBuilder from './CustomReportBuilder';
import PredictiveAnalytics from './PredictiveAnalytics';

const { RangePicker } = DatePicker;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsReporting() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedModule, setSelectedModule] = useState('all');
  const [moduleData, setModuleData] = useState(null);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [reportBuilderVisible, setReportBuilderVisible] = useState(false);
  const [predictiveModalVisible, setPredictiveModalVisible] = useState(false);
  const [realTimeData, setRealTimeData] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchDashboardData();
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000);
    return () => clearInterval(interval);
  }, [dateRange]);

  useEffect(() => {
    if (selectedModule !== 'all') {
      fetchModuleData(selectedModule);
    }
  }, [selectedModule, dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const { data } = await apolloClient.query({
        query: GET_ANALYTICS_OVERVIEW,
        variables: {
          period: selectedModule,
          startDate: dateRange[0].toISOString(),
          endDate: dateRange[1].toISOString(),
        },
      });
      if (data.analyticsOverview?.success) {
        setDashboardData(data.analyticsOverview.result);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_REALTIME_ANALYTICS,
        fetchPolicy: 'cache-first',
      });
      if (data.globalAnalyticsRealtime?.success) {
        setRealTimeData(data.globalAnalyticsRealtime.result);
      }
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  const fetchModuleData = async (module) => {
    try {
      const { data } = await apolloClient.query({
        query: GET_MODULE_ANALYTICS,
        variables: { module, period: dateRange ? `${dateRange[0].toISOString()}_${dateRange[1].toISOString()}` : undefined },
        fetchPolicy: 'cache-first',
      });
      if (data.globalAnalyticsModule?.success) {
        setModuleData(data.globalAnalyticsModule.result);
      }
    } catch (error) {
      console.error('Error fetching module data:', error);
      message.error('Failed to load module data');
    }
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const handleExport = async (format = 'csv') => {
    try {
      const params = {
        format,
        modules: selectedModule === 'all' ? ['crm', 'sales', 'marketing'] : [selectedModule],
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString(),
      };
      const { data } = await apolloClient.mutate({
        mutation: GENERATE_ANALYTICS_REPORT,
        variables: { input: params },
      });
      if (data.analyticsGenerateReport?.success) {
        message.success('Export initiated successfully');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      message.error('Failed to export data');
    }
  };

  if (loading && !dashboardData) {
    return <PageLoader />;
  }

  const renderOverviewCards = () => {
    if (!dashboardData) return null;

    const cards = [
      {
        title: 'Total Revenue',
        value: dashboardData.sales.revenue,
        prefix: '$',
        icon: <DollarOutlined />,
        color: '#52c41a',
        trend: '+12.5%',
      },
      {
        title: 'Customers',
        value: dashboardData.crm.totalCustomers,
        icon: <UserOutlined />,
        color: '#1890ff',
        suffix: `+${dashboardData.crm.newCustomers} new`,
      },
      {
        title: 'Active Campaigns',
        value: dashboardData.marketing.activeCampaigns,
        icon: <ShoppingOutlined />,
        color: '#722ed1',
      },
      {
        title: 'Avg Rating',
        value: dashboardData.reputation.avgRating,
        precision: 1,
        icon: <StarOutlined />,
        color: '#faad14',
      },
      {
        title: 'Task Completion',
        value: dashboardData.tasks.completionRate,
        suffix: '%',
        icon: <CheckCircleOutlined />,
        color: '#13c2c2',
      },
      {
        title: 'Documents',
        value: dashboardData.documents.count,
        icon: <FileOutlined />,
        color: '#eb2f96',
      },
    ];

    return (
      <Row gutter={[16, 16]}>
        {cards.map((card, index) => (
          <Col xs={24} sm={12} lg={8} xl={4} key={index}>
            <Card hoverable>
              <Statistic
                title={card.title}
                value={card.value}
                precision={card.precision || 0}
                suffix={card.suffix}
                valueStyle={{ color: card.color }}
                prefix={<span style={{ fontSize: '24px', marginRight: '8px' }}>{card.icon}</span>}
              />
              {card.trend && (
                <div style={{ marginTop: '8px', color: '#52c41a', fontSize: '12px' }}>
                  <RiseOutlined /> {card.trend}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderSalesChart = () => {
    if (!dashboardData?.sales) return null;

    const data = [
      { name: 'Invoices', value: dashboardData.sales.invoices },
      { name: 'Quotes', value: dashboardData.sales.quotes },
      { name: 'Payments', value: dashboardData.sales.payments },
    ];

    return (
      <Card title="Sales Overview" extra={<LineChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderMarketingChart = () => {
    if (!dashboardData?.marketing) return null;

    const data = [
      { name: 'Campaigns', value: dashboardData.marketing.campaigns },
      { name: 'Active', value: dashboardData.marketing.activeCampaigns },
      { name: 'Social Posts', value: dashboardData.marketing.socialPosts },
    ];

    return (
      <Card title="Marketing Metrics" extra={<PieChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderTasksChart = () => {
    if (!dashboardData?.tasks) return null;

    const data = [
      { name: 'Total', value: dashboardData.tasks.total },
      { name: 'Completed', value: dashboardData.tasks.completed },
      { name: 'Pending', value: dashboardData.tasks.pending },
    ];

    return (
      <Card title="Task Status" extra={<BarChartOutlined />}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#52c41a" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderRealTimeIndicators = () => {
    if (!realTimeData) return null;

    return (
      <Card
        title="Real-Time Activity (Last Hour)"
        size="small"
        style={{ marginBottom: 16, background: '#f0f2f5' }}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="New Customers"
              value={realTimeData.lastHour.newCustomers}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="New Invoices"
              value={realTimeData.lastHour.newInvoices}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Task Updates"
              value={realTimeData.lastHour.taskUpdates}
              valueStyle={{ fontSize: '18px' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        <h1 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold', flexShrink: 0 }}>
          <BarChartOutlined style={{ marginRight: '12px' }} />
          Analytics & Reporting
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <RangePicker value={dateRange} onChange={handleDateRangeChange} format="YYYY-MM-DD" />
          <Select value={selectedModule} onChange={setSelectedModule} style={{ width: 150 }}>
            <Option value="all">All Modules</Option>
            <Option value="crm">CRM</Option>
            <Option value="sales">Sales</Option>
            <Option value="marketing">Marketing</Option>
            <Option value="reputation">Reputation</Option>
            <Option value="tasks">Tasks</Option>
          </Select>
          <Button
            type="primary"
            className="px-12 py-4"
            icon={<RobotOutlined />}
            onClick={() => setAiModalVisible(true)}
          >
            AI Suggestions
          </Button>
          <Button icon={<LineChartOutlined />} onClick={() => setPredictiveModalVisible(true)}>
            Predictive Analytics
          </Button>
          <Button icon={<FileOutlined />} onClick={() => setReportBuilderVisible(true)}>
            Custom Report
          </Button>
          {/* <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
            Export
          </Button> */}
        </div>
      </div>

      {/* Real-time Indicators */}
      {renderRealTimeIndicators()}

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          {renderSalesChart()}
        </Col>
        <Col xs={24} lg={12}>
          {renderMarketingChart()}
        </Col>
        <Col xs={24} lg={12}>
          {renderTasksChart()}
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Reputation Overview">
            <Statistic
              title="Average Rating"
              value={dashboardData?.reputation.avgRating || 0}
              precision={2}
              suffix="/ 5.0"
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
            />
            <div style={{ marginTop: '16px' }}>
              <p>Total Reviews: {dashboardData?.reputation.reviews || 0}</p>
              <p>Positive Reviews: {dashboardData?.reputation.positiveReviews || 0}</p>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Module-Specific View */}
      {selectedModule !== 'all' && moduleData && (
        <Card
          title={`${selectedModule.toUpperCase()} Detailed Analytics`}
          style={{ marginTop: '24px' }}
        >
          {moduleData.timeline && moduleData.timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={moduleData.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1890ff" name="Activity Count" />
                {moduleData.timeline[0]?.revenue !== undefined && (
                  <Bar dataKey="revenue" fill="#52c41a" name="Revenue" />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <p>No timeline data available for this period</p>
            </div>
          )}
        </Card>
      )}

      {/* Modals */}
      <AISuggestionsModal visible={aiModalVisible} onClose={() => setAiModalVisible(false)} />

      <CustomReportBuilder
        visible={reportBuilderVisible}
        onClose={() => setReportBuilderVisible(false)}
      />

      <PredictiveAnalytics
        visible={predictiveModalVisible}
        onClose={() => setPredictiveModalVisible(false)}
      />
    </div>
  );
}
