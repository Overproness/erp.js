import React, { useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  DatePicker,
  Typography,
  Dropdown,
  message
} from 'antd';
import {
  BarChartOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectUrlAnalyticsById,
  selectAnalyticsLoading,
  selectAnalyticsDateRange,
  selectExportLoading,
  selectLastExport,
} from '@/redux/url/urlSelectors';
import {
  fetchUrlAnalytics,
  setAnalyticsDateRange,
  exportUrlAnalytics,
} from '@/redux/url/urlSlice';
import AnalyticsDashboard from './AnalyticsDashboard';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const UrlAnalyticsModule = () => {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const { id: urlId } = useParams();

  const analyticsData = useSelector(state => selectUrlAnalyticsById(state, urlId));
  const analyticsLoading = useSelector(selectAnalyticsLoading);
  const dateRange = useSelector(selectAnalyticsDateRange);
  const exportLoading = useSelector(selectExportLoading);
  const lastExport = useSelector(selectLastExport);

  useEffect(() => {
    if (!urlId) return;
    if (!dateRange?.start || !dateRange?.end) {
      dispatch(setAnalyticsDateRange({
        start: dayjs().subtract(30, 'day').toISOString(),
        end: dayjs().toISOString()
      }));
      // Do NOT dispatch fetchUrlAnalytics until dateRange is set
      return;
    }
    // Log the date range being sent
    console.log('Fetching analytics for urlId:', urlId, 'with dateRange:', dateRange);
    dispatch(fetchUrlAnalytics({
      urlId,
      dateRange: { start: dateRange.start, end: dateRange.end }
    }));
  }, [urlId, dateRange?.start, dateRange?.end, dispatch]);

  // Debug log
  console.log('Analytics data:', analyticsData);

  const handleExport = (format = 'csv') => {
    if (!urlId) return;
    dispatch(exportUrlAnalytics({
      urlId,
      format,
      includeRawClicks: true
    }));
  };

  // Download file when export is ready
  React.useEffect(() => {
    if (lastExport && lastExport.blob && lastExport.filename) {
      const url = window.URL.createObjectURL(lastExport.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lastExport.filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    }
  }, [lastExport]);

  const handleRefresh = useCallback(() => {
    if (urlId && dateRange?.start && dateRange?.end) {
      console.log('Manual refresh: Fetching analytics for urlId:', urlId, 'with dateRange:', dateRange);
      dispatch(fetchUrlAnalytics({
        urlId,
        dateRange: { start: dateRange.start, end: dateRange.end }
      }));
    }
  }, [dispatch, urlId, dateRange]);

  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      const newRange = {
        start: dates[0].toISOString(),
        end: dates[1].toISOString()
      };
      console.log('Date range changed:', newRange);
      dispatch(setAnalyticsDateRange(newRange));
    }
  };

  const exportMenuItems = [
    {
      key: 'csv',
      label: translate('Export as CSV'),
      onClick: () => handleExport('csv')
    },
    {
      key: 'xlsx',
      label: translate('Export as Excel'),
      onClick: () => handleExport('xlsx')
    },
    {
      key: 'pdf',
      label: translate('Export as PDF'),
      onClick: () => handleExport('pdf')
    },
    {
      key: 'json',
      label: translate('Export as JSON'),
      onClick: () => handleExport('json')
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {translate('URL Analytics')}
            </Title>
            <div style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              {translate('Comprehensive analytics and insights for your URL')}
            </div>
          </div>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={analyticsLoading}
            >
              {translate('Refresh')}
            </Button>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button icon={<DownloadOutlined />} loading={exportLoading}>
                {translate('Export')}
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* Controls */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500 }}>
                {translate('Date Range')}
              </label>
            </div>
            <RangePicker
              value={
                dateRange?.start && dateRange?.end
                  ? [dayjs(dateRange.start), dayjs(dateRange.end)]
                  : [dayjs().subtract(30, 'day'), dayjs()]
              }
              onChange={handleDateRangeChange}
              style={{ width: '100%' }}
              presets={[
                { label: translate('Last 7 days'), value: [dayjs().subtract(7, 'day'), dayjs()] },
                { label: translate('Last 30 days'), value: [dayjs().subtract(30, 'day'), dayjs()] },
                { label: translate('Last 90 days'), value: [dayjs().subtract(90, 'day'), dayjs()] },
                { label: translate('This year'), value: [dayjs().startOf('year'), dayjs()] }
              ]}
            />
          </Col>
        </Row>
      </Card>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        data={analyticsData}
        loading={analyticsLoading}
        dateRange={dateRange}
        timeframe="day"
      />

      {/* No data state */}
      {!analyticsData && !analyticsLoading && (
        <Card style={{ textAlign: 'center', padding: '48px' }}>
          <BarChartOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
          <Title level={4} style={{ color: '#6b7280' }}>
            {translate('No Analytics Data')}
          </Title>
          <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
            {translate('No analytics data available for this URL')}
          </p>
        </Card>
      )}
    </div>
  );
};

export default UrlAnalyticsModule;