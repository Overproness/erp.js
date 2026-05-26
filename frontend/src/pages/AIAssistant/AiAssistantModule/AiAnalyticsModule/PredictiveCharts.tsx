import React from 'react';
import { Card, Empty } from '@/components/ui';
import { Line } from '@ant-design/charts';
import useLanguage from '@/locale/useLanguage';

const PredictiveCharts = ({ data, loading }) => {
  const translate = useLanguage();

  const chartData = data?.performance || [];

  if (!chartData || chartData.length === 0) {
    return (
      <Card title={translate('Performance Trends')} loading={loading}>
        <Empty description={translate('No performance data available')} />
      </Card>
    );
  }

  const config = {
    data: chartData,
    xField: 'date',
    yField: 'responseTime',
    point: {
      size: 3,
      shape: 'circle',
    },
    line: {
      color: '#1890ff',
    },
    xAxis: {
      type: 'time',
      tickCount: 5,
    },
    yAxis: {
      label: {
        formatter: (value) => `${value}ms`,
      },
    },
    tooltip: {
      formatter: (datum) => ({
        name: translate('Response Time'),
        value: `${datum.responseTime}ms`,
      }),
    },
  };

  return (
    <Card title={translate('Performance Trends')} loading={loading}>
      <Line {...config} height={300} />
    </Card>
  );
};

export default PredictiveCharts;