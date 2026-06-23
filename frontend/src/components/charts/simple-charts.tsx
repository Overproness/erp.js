import * as React from 'react';
import {
  Bar as RechartsBar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line as RechartsLine,
  LineChart,
  Pie as RechartsPie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type ChartConfig = {
  data?: any[];
  xField?: string;
  yField?: string;
  seriesField?: string;
  color?: string | string[] | ((datum: any) => string);
  height?: number;
  smooth?: boolean;
  point?: unknown;
  xAxis?: unknown;
  yAxis?: unknown;
  tooltip?: unknown;
  padding?: unknown;
};

function colorAt(color: ChartConfig['color'], index: number, datum?: any) {
  if (typeof color === 'function') return color(datum);
  if (Array.isArray(color)) return color[index % color.length];
  return color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

function pivotSeries(data: any[], xField: string, yField: string, seriesField?: string) {
  if (!seriesField) return { data, keys: [yField] };

  const rows = new Map<string, any>();
  const keys: string[] = [];

  data.forEach((item) => {
    const x = item[xField];
    const series = String(item[seriesField] ?? 'Series');
    if (!keys.includes(series)) keys.push(series);
    if (!rows.has(x)) rows.set(x, { [xField]: x });
    rows.get(x)[series] = item[yField];
  });

  return { data: Array.from(rows.values()), keys };
}

export const Line: React.FC<ChartConfig> = ({
  data = [],
  xField = 'x',
  yField = 'y',
  seriesField,
  color,
  height = 300,
}) => {
  const chart = pivotSeries(data, xField, yField, seriesField);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chart.data} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey={xField} tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip />
        {seriesField && <Legend />}
        {chart.keys.map((key, index) => (
          <RechartsLine
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colorAt(color, index)}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

const Bars: React.FC<ChartConfig> = ({
  data = [],
  xField = 'x',
  yField = 'y',
  color,
  height = 300,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 16, right: 24, bottom: 16, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
      <XAxis dataKey={xField} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
      <Tooltip />
      <RechartsBar dataKey={yField} radius={[4, 4, 0, 0]} fill={colorAt(color, 0)}>
        {data.map((item, index) => (
          <Cell key={index} fill={colorAt(color, index, item)} />
        ))}
      </RechartsBar>
    </BarChart>
  </ResponsiveContainer>
);

export const Bar = Bars;
export const Column = Bars;

export const Pie: React.FC<ChartConfig> = ({
  data = [],
  xField = 'type',
  yField = 'value',
  color,
  height = 300,
}) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart>
      <Tooltip />
      <Legend />
      <RechartsPie data={data} dataKey={yField} nameKey={xField} outerRadius="75%">
        {data.map((item, index) => (
          <Cell key={index} fill={colorAt(color, index, item)} />
        ))}
      </RechartsPie>
    </PieChart>
  </ResponsiveContainer>
);
