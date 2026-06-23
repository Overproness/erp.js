import React, { useEffect, useMemo, useState } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker, Table, Progress, Divider, Button, Space, Typography, Spin, Tag, Empty } from '@/components/ui';
import { ArrowUpOutlined, ArrowDownOutlined, EyeOutlined, MailOutlined, InteractionOutlined, CheckCircleOutlined, UserAddOutlined, DollarOutlined, ReloadOutlined, MessageOutlined, NotificationOutlined } from '@/components/icons';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useLanguage from '@/locale/useLanguage';
import { selectCampaigns } from '@/redux/marketing/selectors';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, ChartTooltip, Legend);

const { Title: TitleComponent, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const CampaignAnalysisModule = ({ campaignId }) => {
  const translate = useLanguage();
  const { campaignId: routeCampaignId } = useParams();
  const resolvedId = campaignId || routeCampaignId;

  const campaigns = useSelector(selectCampaigns);

  // Fallback dummy campaigns (consistent with other modules)
  const dummyCampaigns = useMemo(() => ([
    {
      id: 'cmp_1',
      name: 'Spring Sale 2025',
      description: 'Promotional email series for spring collection.',
      status: 'active',
      type: 'email',
      audience: { name: 'All Subscribers' },
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      sentCount: 12000,
      openCount: 4800,
      createdAt: '2025-02-10',
      channels: ['email', 'sms', 'push']
    },
    {
      id: 'cmp_2',
      name: 'Social Boost - April',
      description: 'Paid social media push to increase awareness.',
      status: 'paused',
      type: 'social',
      audienceCount: 8400,
      startDate: '2025-04-05',
      endDate: '2025-04-20',
      sentCount: 0,
      openCount: 0,
      createdAt: '2025-04-01',
      channels: ['email', 'sms']
    },
    {
      id: 'cmp_3',
      name: 'Re-engagement SMS',
      description: 'Win-back campaign for inactive users.',
      status: 'completed',
      type: 'sms',
      audience: { name: 'Inactive Users' },
      startDate: '2025-01-10',
      endDate: '2025-01-20',
      sentCount: 5000,
      openCount: 0,
      createdAt: '2024-12-30',
      channels: ['sms']
    },
  ]), []);

  const currentCampaign =
    (campaigns || []).find(c => String(c.id) === String(resolvedId)) ||
    dummyCampaigns.find(c => String(c.id) === String(resolvedId)) ||
    null;

  const [timeframe, setTimeframe] = useState('30d');
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    if (!currentCampaign) {
      setAnalytics(null);
      return;
    }
    // Simulate fetch delay
    setLoading(true);
    const t = setTimeout(() => {
      const sent = currentCampaign.sentCount ?? 1000;
      const opens = currentCampaign.openCount ?? Math.round(sent * 0.25);
      const clicks = Math.round(opens * 0.4);
      const conversions = Math.max(1, Math.round(clicks * 0.12));
      const revenue = conversions * 25;

      const audienceSize =
        currentCampaign.audience?.size ||
        currentCampaign.audienceCount ||
        Math.max(sent, 1000);

      const channels =
        currentCampaign.channels ||
        (currentCampaign.type === 'multi'
          ? ['email', 'sms', 'push']
          : ['email', 'sms', 'push', 'social'].includes(currentCampaign.type)
          ? [currentCampaign.type]
          : ['email']);

      const end = dayjs(currentCampaign.endDate || new Date());
      const timeline = Array.from({ length: 7 }).map((_, idx) => {
        const d = end.subtract(6 - idx, 'day');
        const factor = 0.85 + (idx / 12);
        return {
          date: d.format('YYYY-MM-DD'),
          impressions: Math.round((sent * 2 / 7) * factor),
          clicks: Math.round((clicks / 7) * factor),
          opens: Math.round((opens / 7) * factor),
          conversions: Math.max(0, Math.round((conversions / 7) * factor)),
        };
      });

      const splitEvenly = (value, keys) => {
        const count = keys.length || 1;
        const base = Math.floor(value / count);
        const remainder = value - base * count;
        return keys.reduce((acc, k, i) => {
          acc[k] = base + (i < remainder ? 1 : 0);
          return acc;
        }, {});
      };

      const byChannel = {};
      const impressionsSplit = splitEvenly(sent * 2, channels);
      const clicksSplit = splitEvenly(clicks, channels);
      const conversionsSplit = splitEvenly(conversions, channels);
      channels.forEach(ch => {
        byChannel[ch] = {
          impressions: impressionsSplit[ch] || 0,
          clicks: clicksSplit[ch] || 0,
          conversions: conversionsSplit[ch] || 0,
        };
      });

      const byAudience = [
        { segment: 'New Customers', size: Math.round(audienceSize * 0.6), engagement: 8.2, conversions: Math.round(conversions * 0.45) },
        { segment: 'Returning Customers', size: Math.round(audienceSize * 0.4), engagement: 12.4, conversions: Math.round(conversions * 0.55) },
      ];

      setAnalytics({
        impressions: sent * 2,
        clicks,
        opens,
        conversions,
        revenue,
        engagement: { rate: Math.round((opens / Math.max(sent, 1)) * 1000) / 10, growth: 12.5 },
        metrics: {
          clickRate: Math.round((clicks / Math.max(sent, 1)) * 1000) / 10,
          openRate: Math.round((opens / Math.max(sent, 1)) * 1000) / 10,
          conversionRate: Math.round((conversions / Math.max(sent, 1)) * 1000) / 10,
          bounceRate: 1.8,
          unsubscribeRate: 0.3,
        },
        byChannel,
        byAudience,
        timeline,
        campaign: {
          name: currentCampaign.name,
          status: currentCampaign.status || 'active',
          startDate: currentCampaign.startDate,
          endDate: currentCampaign.endDate,
          channels,
          audience: { name: currentCampaign.audience?.name || 'Audience', size: audienceSize },
        },
      });
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [currentCampaign, timeframe]);

  const handleTimeframeChange = (value) => {
    setTimeframe(value);
    setDateRange(null);
  };

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setDateRange(dates);
      setTimeframe('custom');
    } else {
      setDateRange(null);
    }
  };

  if (!currentCampaign) {
    return (
      <Card>
        <Empty description={translate('Campaign not found')} />
      </Card>
    );
  }

  if (loading || !analytics) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const timelineData = {
    labels: analytics.timeline.map(item => dayjs(item.date).format('MMM D')),
    datasets: [
      { label: translate('Impressions'), data: analytics.timeline.map(i => i.impressions), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 2, tension: 0.4, fill: true },
      { label: translate('Clicks'), data: analytics.timeline.map(i => i.clicks), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 2, tension: 0.4, fill: true },
      { label: translate('Conversions'), data: analytics.timeline.map(i => i.conversions), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 2, tension: 0.4, fill: true },
    ],
  };

  const channelLabels = Object.keys(analytics.byChannel).map(ch => ch.charAt(0).toUpperCase() + ch.slice(1));
  const channelValues = Object.values(analytics.byChannel);
  const channelData = {
    labels: channelLabels,
    datasets: [
      { label: translate('Impressions'), data: channelValues.map(d => d.impressions), backgroundColor: '#8b5cf6' },
      { label: translate('Clicks'), data: channelValues.map(d => d.clicks), backgroundColor: '#10b981' },
      { label: translate('Conversions'), data: channelValues.map(d => d.conversions), backgroundColor: '#f59e0b' },
    ],
  };

  const metricsData = {
    labels: [translate('Click Rate'), translate('Open Rate'), translate('Conversion Rate'), translate('Bounce Rate'), translate('Unsubscribe Rate')],
    datasets: [{ data: [analytics.metrics.clickRate, analytics.metrics.openRate, analytics.metrics.conversionRate, analytics.metrics.bounceRate, analytics.metrics.unsubscribeRate], backgroundColor: ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'], borderWidth: 0 }],
  };

  const audienceColumns = [
    { title: translate('Segment'), dataIndex: 'segment', key: 'segment' },
    { title: translate('Audience Size'), dataIndex: 'size', key: 'size', render: v => Number(v).toLocaleString() },
    { title: translate('Engagement Rate'), dataIndex: 'engagement', key: 'engagement', render: v => <Progress percent={v} size="small" format={p => `${p}%`} strokeColor="#8b5cf6" /> },
    { title: translate('Conversions'), dataIndex: 'conversions', key: 'conversions', render: v => Number(v).toLocaleString() },
  ];

  const renderMetricCards = () => {
    const metrics = [
      { title: translate('Impressions'), value: analytics.impressions, icon: <EyeOutlined style={{ fontSize: 24, color: '#8b5cf6' }} />, growth: 15.3, precision: 0 },
      { title: translate('Clicks'), value: analytics.clicks, icon: <InteractionOutlined style={{ fontSize: 24, color: '#10b981' }} />, growth: 8.7, precision: 0 },
      { title: translate('Opens'), value: analytics.opens, icon: <MailOutlined style={{ fontSize: 24, color: '#3b82f6' }} />, growth: 12.1, precision: 0 },
      { title: translate('Conversions'), value: analytics.conversions, icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#f59e0b' }} />, growth: 21.5, precision: 0 },
      { title: translate('Revenue'), value: analytics.revenue, icon: <DollarOutlined style={{ fontSize: 24, color: '#10b981' }} />, prefix: '$', growth: 18.2, precision: 2 },
      { title: translate('New Subscribers'), value: Math.round(analytics.conversions * 2.5), icon: <UserAddOutlined style={{ fontSize: 24, color: '#6366f1' }} />, growth: 9.3, precision: 0 },
    ];
    return metrics.map((m, i) => (
      <Col key={i} xs={24} sm={12} lg={8} xl={4}>
        <Card size="small" style={{ height: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <Text type="secondary">{m.title}</Text>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
                {m.prefix}{Number(m.value).toLocaleString(undefined, { maximumFractionDigits: m.precision })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              {m.icon}
              <div style={{ marginTop: 8, color: m.growth > 0 ? '#10b981' : '#ef4444', fontSize: 12, display: 'flex', alignItems: 'center' }}>
                {m.growth > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{Math.abs(m.growth)}%
              </div>
            </div>
          </div>
        </Card>
      </Col>
    ));
  };

  const renderCampaignDetails = () => {
    const { campaign } = analytics;
    const iconMap = { email: <MailOutlined />, sms: <MessageOutlined />, push: <NotificationOutlined /> };
    const colorMap = { email: 'blue', sms: 'green', push: 'purple' };

    return (
      <Card size="small" title={translate('Campaign Details')}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{translate('Campaign Name')}</Text>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{campaign.name}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{translate('Status')}</Text>
              <div>
                <Tag color={campaign.status === 'active' ? 'green' : campaign.status === 'paused' ? 'orange' : 'blue'}>
                  {campaign.status.toUpperCase()}
                </Tag>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{translate('Date Range')}</Text>
              <div style={{ fontSize: 14 }}>
                {campaign.startDate ? dayjs(campaign.startDate).format('MMM D, YYYY') : '—'} - {campaign.endDate ? dayjs(campaign.endDate).format('MMM D, YYYY') : '—'}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{translate('Audience')}</Text>
              <div style={{ fontSize: 14 }}>
                {campaign.audience.name} ({Number(campaign.audience.size).toLocaleString()})
              </div>
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>
              <Text type="secondary">{translate('Channels')}</Text>
              <div>
                <Space>
                  {campaign.channels.map(ch => (
                    <Tag key={ch} color={colorMap[ch] || 'default'} icon={iconMap[ch] || null}>
                      {ch.toUpperCase()}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div>
      {/* Header with filters */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <TitleComponent level={4} style={{ margin: 0 }}>{translate('Campaign Analysis')}</TitleComponent>
          <Text type="secondary">{translate('Track and analyze performance for this campaign')}</Text>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Select value={timeframe} onChange={handleTimeframeChange} style={{ width: 160 }}>
            <Option value="7d">{translate('Last 7 days')}</Option>
            <Option value="30d">{translate('Last 30 days')}</Option>
            <Option value="90d">{translate('Last 3 months')}</Option>
            <Option value="custom">{translate('Custom Range')}</Option>
          </Select>

          {timeframe === 'custom' && (
            <RangePicker value={dateRange} onChange={handleDateRangeChange} format="YYYY-MM-DD" />
          )}

          <Button icon={<ReloadOutlined />} onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 400);
          }}>
            {translate('Refresh')}
          </Button>
        </div>
      </div>

      {/* Campaign Details */}
      {renderCampaignDetails()}

      <Divider />

      {/* Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {renderMetricCards()}
      </Row>

      {/* Charts */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={translate('Performance Overview')}>
            <div style={{ height: 320 }}>
              <Line
                data={timelineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                  plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                }}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={translate('Channel Performance')}>
            <div style={{ height: 320 }}>
              <Bar
                data={channelData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: { y: { beginAtZero: true } },
                  plugins: { legend: { position: 'top' }, tooltip: { mode: 'index', intersect: false } },
                }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title={translate('Key Metrics')}>
            <div style={{ height: 300, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 280, height: 280 }}>
                <Pie
                  data={metricsData}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={translate('Audience Performance')}>
            <Table dataSource={analytics.byAudience} columns={audienceColumns} pagination={false} size="small" rowKey="segment" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CampaignAnalysisModule;
