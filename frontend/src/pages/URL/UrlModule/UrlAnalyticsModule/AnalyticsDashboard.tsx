import React, { useState, useMemo } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Tabs,
  Table,
  Typography,
  Tag,
  Space,
  Tooltip,
  Empty
} from '@/components/ui';
import {
  UserOutlined,
  LinkOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { Line, Bar } from '@ant-design/charts';
import dayjs from 'dayjs';

const { Text } = Typography;

const AnalyticsDashboard = ({ data, loading, dateRange, timeframe }) => {
  const translate = useLanguage();
  const [activeChart, setActiveChart] = useState('time');

  // Map backend analytics structure to dashboard structure
  const mappedData = useMemo(() => {
    if (!data) return null;
    return {
      overview: {
        totalClicks: data.overview?.totalClicks ?? 0,
        uniqueClicks: data.overview?.uniqueClicks ?? 0,
        firstClick: data.overview?.firstClick ?? null,
        lastClick: data.overview?.lastClick ?? null,
      },
      timeSeries: data.timeSeries || [],
      browsers: data.browsers || [],
      operatingSystems: data.operatingSystems || [],
      referrers: data.referrers || [],
      hourlyDistribution: data.hourlyDistribution || [],
      dailyDistribution: data.dailyDistribution || [],
    };
  }, [data]);

  if (!mappedData) return null;

  // --- Time Series Chart ---
  const timeSeriesData = mappedData.timeSeries.map(item => ({
    ...item,
    x: item.label || item.date,
    y: item.clicks,
  }));
  const hasTimeSeries = timeSeriesData.some(d => d.y > 0);

  const timeSeriesConfig = {
    data: timeSeriesData,
    xField: 'x',
    yField: 'y',
    smooth: true,
    color: '#3b82f6',
    point: { size: 4, shape: 'circle', style: { fill: '#fff', stroke: '#3b82f6', lineWidth: 2 } },
    xAxis: {
      title: { text: 'Date', style: { fontWeight: 500 } },
      label: { autoHide: true, autoRotate: true },
      grid: { line: { style: { stroke: '#f0f0f0', lineDash: [2, 2] } } },
    },
    yAxis: {
      title: { text: 'Clicks', style: { fontWeight: 500 } },
      min: 0,
      grid: { line: { style: { stroke: '#f0f0f0', lineDash: [2, 2] } } },
    },
    tooltip: { showMarkers: true },
    padding: [24, 24, 48, 48],
    height: 300,
  };

  // --- Hourly Distribution Chart ---
  const hourlyData = mappedData.hourlyDistribution
    .filter(item => item.clicks > 0)
    .map(item => ({
      ...item,
      x: item.displayLabel || item.label || `${String(item.hour).padStart(2, '0')}:00`,
      y: item.clicks,
    }));
  const hasHourly = hourlyData.length > 0;

  const hourlyConfig = {
    data: hourlyData,
    xField: 'x',
    yField: 'y',
    color: '#3b82f6',
    xAxis: {
      title: { text: 'Hour', style: { fontWeight: 500 } },
      label: { autoHide: true, autoRotate: false },
      grid: { line: { style: { stroke: '#f0f0f0', lineDash: [2, 2] } } },
    },
    yAxis: {
      title: { text: 'Clicks', style: { fontWeight: 500 } },
      min: 0,
      grid: { line: { style: { stroke: '#f0f0f0', lineDash: [2, 2] } } },
    },
    tooltip: {
      customContent: (title, items) =>
        `<div style="padding:4px 8px"><b>${title}</b><br/>Clicks: ${items[0]?.data?.y ?? 0}</div>`,
    },
    padding: [24, 24, 48, 48],
    height: 250,
  };

  // --- Daily Distribution Chart ---
  const dailyData = mappedData.dailyDistribution
    .filter(item => item.clicks > 0)
    .map(item => ({
      ...item,
      x: item.label || String(item.day),
      y: item.clicks,
      fullLabel: item.fullLabel,
    }));
  const hasDaily = dailyData.length > 0;

  const dailyConfig = {
    data: dailyData,
    xField: 'x',
    yField: 'y',
    color: '#10b981',
    xAxis: {
      title: { text: 'Day', style: { fontWeight: 500 } },
      label: {
        autoHide: false,
        autoRotate: false,
        formatter: (val, item, idx) => val,
      },
      grid: { line: { style: { stroke: '#f0f0f0', lineDash: [2, 2] } } },
    },
    yAxis: {
      title: { text: 'Clicks', style: { fontWeight: 500 } },
      min: 0,
      grid: { line: { style: { stroke: '#f0f0f0', lineDash: [2, 2] } } },
    },
    tooltip: {
      customContent: (title, items) => {
        const fullLabel = dailyData.find(d => d.x === title)?.fullLabel || title;
        return `<div style="padding:4px 8px"><b>${fullLabel}</b><br/>Clicks: ${items[0]?.data?.y ?? 0}</div>`;
      },
    },
    padding: [24, 24, 48, 48],
    height: 250,
  };

  // Group and sum browser data by browser name
  function groupAndSumByField(arr, field) {
    if (!Array.isArray(arr)) return [];
    const map = {};
    arr.forEach(item => {
      const name = (item[field] || 'Unknown').toString();
      if (!map[name]) {
        map[name] = {
          key: name,
          name,
          clicks: item.clicks ?? 0,
          uniqueClicks: item.uniqueClicks ?? 0,
        };
      } else {
        map[name].clicks += item.clicks ?? 0;
        map[name].uniqueClicks += item.uniqueClicks ?? 0;
      }
    });
    return Object.values(map);
  }

  const browsersGrouped = groupAndSumByField(mappedData.browsers, 'browser');
  const osGrouped = groupAndSumByField(mappedData.operatingSystems, 'os');

  const browserColumns = [
    {
      title: translate('Browser'),
      dataIndex: 'name',
      key: 'name',
      render: (name) =>
        name === 'Unknown' ? (
          <Tooltip title={translate('Browser could not be detected')}>
            <Text type="secondary">{translate('Unknown')}</Text>
          </Tooltip>
        ) : (
          <Text>{name}</Text>
        ),
    },
    {
      title: translate('Clicks'),
      dataIndex: 'clicks',
      key: 'clicks',
      render: (clicks) => <Tag color="blue">{clicks ?? 0}</Tag>,
    },
    {
      title: translate('Unique Clicks'),
      dataIndex: 'uniqueClicks',
      key: 'uniqueClicks',
      render: (uniqueClicks) => <Tag color="purple">{uniqueClicks ?? 0}</Tag>,
    },
  ];

  const osColumns = [
    {
      title: translate('Operating System'),
      dataIndex: 'name',
      key: 'name',
      render: (name) =>
        name === 'Unknown' ? (
          <Tooltip title={translate('Operating system could not be detected')}>
            <Text type="secondary">{translate('Unknown')}</Text>
          </Tooltip>
        ) : (
          <Text>{name}</Text>
        ),
    },
    {
      title: translate('Clicks'),
      dataIndex: 'clicks',
      key: 'clicks',
      render: (clicks) => <Tag color="blue">{clicks ?? 0}</Tag>,
    },
    {
      title: translate('Unique Clicks'),
      dataIndex: 'uniqueClicks',
      key: 'uniqueClicks',
      render: (uniqueClicks) => <Tag color="purple">{uniqueClicks ?? 0}</Tag>,
    },
  ];

  const referrerColumns = [
    {
      title: translate('Referrer'),
      dataIndex: 'referrer',
      key: 'referrer',
      render: (referrer) => <Text>{referrer || translate('Direct Traffic')}</Text>,
    },
    {
      title: translate('Clicks'),
      dataIndex: 'clicks',
      key: 'clicks',
      render: (clicks) => <Tag color="blue">{clicks ?? 0}</Tag>,
    },
    {
      title: translate('Unique Clicks'),
      dataIndex: 'uniqueClicks',
      key: 'uniqueClicks',
      render: (uniqueClicks) => <Tag color="purple">{uniqueClicks ?? 0}</Tag>,
    },
  ];

  // Tabs items array (AntD v5+)
  const tabItems = [
    {
      label: translate('Time'),
      key: 'time',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title={translate('Clicks Over Time')} loading={loading}>
              {hasTimeSeries ? (
                <Line {...timeSeriesConfig} />
              ) : (
                <Empty description={translate('No click data for this period')} style={{ margin: '48px 0' }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={translate('Hourly Distribution')} loading={loading}>
              {hasHourly ? (
                <Bar {...hourlyConfig} />
              ) : (
                <Empty description={translate('No hourly click data')} style={{ margin: '48px 0' }} />
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={translate('Daily Distribution')} loading={loading}>
              {hasDaily ? (
                <Bar {...dailyConfig} />
              ) : (
                <Empty description={translate('No daily click data')} style={{ margin: '48px 0' }} />
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      label: translate('Browsers'),
      key: 'browsers',
      children: (
        <Card title={translate('Browser Usage')} loading={loading}>
          {browsersGrouped.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bdbdbd', padding: '32px' }}>
              {translate('No browser data available')}
            </div>
          ) : (
            <Table
              columns={browserColumns}
              dataSource={browsersGrouped.map((row, idx) => ({ ...row, key: row.name + '-' + idx }))}
              pagination={false}
              size="small"
            />
          )}
        </Card>
      ),
    },
    {
      label: translate('Operating Systems'),
      key: 'os',
      children: (
        <Card title={translate('Operating System Usage')} loading={loading}>
          {osGrouped.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#bdbdbd', padding: '32px' }}>
              {translate('No operating system data available')}
            </div>
          ) : (
            <Table
              columns={osColumns}
              dataSource={osGrouped.map((row, idx) => ({ ...row, key: row.name + '-' + idx }))}
              pagination={false}
              size="small"
            />
          )}
        </Card>
      ),
    },
    {
      label: translate('Referrers'),
      key: 'referrers',
      children: (
        <Card title={translate('Referrer Stats')} loading={loading}>
          <Table
            columns={referrerColumns}
            dataSource={mappedData.referrers.map((row, idx) => ({ ...row, key: (row.referrer || 'direct') + '-' + idx }))}
            pagination={false}
            size="small"
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={5}>
          <Card>
            <Statistic
              title={translate('Total Clicks')}
              value={mappedData.overview.totalClicks}
              valueStyle={{ color: '#8b5cf6' }}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={5}>
          <Card>
            <Statistic
              title={translate('Unique Clicks')}
              value={mappedData.overview.uniqueClicks}
              valueStyle={{ color: '#10b981' }}
              prefix={<LinkOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={7}>
          <Card>
            <Statistic
              title={translate('First Click')}
              value={mappedData.overview.firstClick ? dayjs(mappedData.overview.firstClick).format('YYYY-MM-DD HH:mm') : '-'}
              valueStyle={{ color: '#3b82f6' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={7}>
          <Card>
            <Statistic
              title={translate('Last Click')}
              value={mappedData.overview.lastClick ? dayjs(mappedData.overview.lastClick).format('YYYY-MM-DD HH:mm') : '-'}
              valueStyle={{ color: '#f59e0b' }}
              prefix={<ClockCircleOutlined />}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Tabs
        activeKey={activeChart}
        onChange={setActiveChart}
        type="card"
        items={tabItems}
      />
    </div>
  );
};

export default AnalyticsDashboard;