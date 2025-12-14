import { request } from '@/request';
import { FallOutlined, LineChartOutlined, MinusOutlined, RiseOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Modal, Select, Spin, Statistic, Tag } from 'antd';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const { Option } = Select;

export default function PredictiveAnalytics({ visible, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [predictionPeriod, setPredictionPeriod] = useState(30);
  const [predictionData, setPredictionData] = useState(null);

  const metrics = [
    { label: 'Revenue', value: 'revenue' },
    { label: 'New Customers', value: 'customers' },
    { label: 'Invoices', value: 'invoices' },
    { label: 'Payments', value: 'payments' },
  ];

  const periods = [
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '30 Days', value: 30 },
    { label: '60 Days', value: 60 },
    { label: '90 Days', value: 90 },
  ];

  const handlePredict = async () => {
    try {
      setLoading(true);
      const response = await request.post('/global-analytics/predict', {
        metric: selectedMetric,
        period: predictionPeriod,
      });

      if (response.success) {
        setPredictionData(response.data);
      }
    } catch (error) {
      console.error('Error getting predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPredictionData(null);
    onClose();
  };

  const getTrendIcon = () => {
    if (!predictionData) return null;
    switch (predictionData.trend) {
      case 'increasing':
        return <RiseOutlined style={{ color: '#52c41a' }} />;
      case 'decreasing':
        return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <MinusOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getTrendColor = () => {
    if (!predictionData) return 'default';
    switch (predictionData.trend) {
      case 'increasing':
        return 'success';
      case 'decreasing':
        return 'error';
      default:
        return 'warning';
    }
  };

  const prepareChartData = () => {
    if (!predictionData) return [];

    const historicalData = predictionData.historical.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      actual: item.value,
      type: 'historical',
    }));

    const smoothedData = predictionData.smoothed.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      smoothed: item.value,
      type: 'smoothed',
    }));

    const predictedData = predictionData.predictions.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      predicted: item.value,
      type: 'predicted',
    }));

    // Merge data
    const allDates = [...historicalData, ...predictedData];
    const merged = {};

    allDates.forEach((item) => {
      if (!merged[item.date]) {
        merged[item.date] = { date: item.date };
      }
      if (item.actual !== undefined) merged[item.date].actual = item.actual;
      if (item.predicted !== undefined) merged[item.date].predicted = item.predicted;
    });

    // Add smoothed values
    smoothedData.forEach((item) => {
      if (merged[item.date]) {
        merged[item.date].smoothed = item.smoothed;
      }
    });

    return Object.values(merged);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LineChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <span>Predictive Analytics</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={null}
      styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
    >
      <div style={{ padding: '12px 0' }}>
        <Alert
          message="Statistical Forecasting"
          description="Using historical data and statistical methods (linear regression, moving averages) to predict future trends."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {!predictionData ? (
          <>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Select Metric to Predict:
                </label>
                <Select
                  value={selectedMetric}
                  onChange={setSelectedMetric}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {metrics.map((metric) => (
                    <Option key={metric.value} value={metric.value}>
                      {metric.label}
                    </Option>
                  ))}
                </Select>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                  Prediction Period:
                </label>
                <Select
                  value={predictionPeriod}
                  onChange={setPredictionPeriod}
                  style={{ width: '100%' }}
                  size="large"
                >
                  {periods.map((period) => (
                    <Option key={period.value} value={period.value}>
                      {period.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<LineChartOutlined />}
              onClick={handlePredict}
              loading={loading}
            >
              Generate Prediction
            </Button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '24px' }}>
              <Card>
                <Statistic
                  title={`Predicted Trend for ${selectedMetric.toUpperCase()}`}
                  value={predictionData.trend}
                  prefix={getTrendIcon()}
                  valueStyle={{
                    color:
                      getTrendColor() === 'success'
                        ? '#52c41a'
                        : getTrendColor() === 'error'
                          ? '#ff4d4f'
                          : '#faad14',
                    textTransform: 'capitalize',
                  }}
                />
                <div style={{ marginTop: '16px' }}>
                  <Tag color={getTrendColor()}>
                    Confidence: {(predictionData.accuracy * 100).toFixed(1)}%
                  </Tag>
                  {predictionData.confidence && predictionData.confidence.mean !== undefined && (
                    <Tag>Mean: {predictionData.confidence.mean.toFixed(2)}</Tag>
                  )}
                </div>
              </Card>
            </div>

            <Card title="Prediction Chart" style={{ marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#1890ff"
                    fill="#1890ff"
                    fillOpacity={0.3}
                    name="Actual (Historical)"
                  />
                  <Area
                    type="monotone"
                    dataKey="smoothed"
                    stroke="#52c41a"
                    fill="none"
                    strokeDasharray="5 5"
                    name="Smoothed Trend"
                  />
                  <Area
                    type="monotone"
                    dataKey="predicted"
                    stroke="#ff7300"
                    fill="#ff7300"
                    fillOpacity={0.2}
                    name="Predicted"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <Button onClick={() => setPredictionData(null)}>New Prediction</Button>
              <Button type="primary" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>
              Analyzing historical data and generating predictions...
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
