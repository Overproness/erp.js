import { Spin, Col, Button } from '@/components/ui';
import { FileTextOutlined, PlusOutlined } from '@/components/icons';
import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';

// Modern color palette for legend dots
const legendColors = {
  draft: 'rgba(77,127,55,0.18)',        // light green
  pending: 'rgba(77,127,55,0.32)',      // medium green
  sent: 'rgba(77,127,55,0.48)',         // medium green
  unpaid: 'rgba(170,53,55,0.62)',       // red for unpaid/negative
  overdue: 'rgba(170,53,55,0.78)',      // darker red
  partially: 'rgba(77,127,55,0.54)',    // green
  paid: 'rgba(77,127,55,0.92)',         // strong green
  declined: 'rgba(170,53,55,0.38)',     // red
  accepted: 'rgba(77,127,55,1)',        // full green
  expired: 'rgba(77,127,55,0.24)',      // faded green
  others: 'rgba(77,127,55,0.12)',       // very light green
};

const legendBgColors = {
  draft: '#F3F4F6',
  pending: '#E0F2FE',
  sent: '#DBEAFE',
  unpaid: '#FEF3C7',
  overdue: '#FEE2E2',
  partially: '#CCFBF1',
  paid: '#D1FAE5',
  declined: '#FEE2E2',
  accepted: '#D1FAE5',
  expired: '#FEF3C7',
  others: '#F3F4F6',
};

const colours = {
  draft: 'linear-gradient(135deg, #bdbdbd 0%, #757575 100%)',
  sent: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
  pending: 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
  unpaid: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
  overdue: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  partially: 'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)',
  paid: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
  declined: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
  accepted: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
  expired: 'linear-gradient(135deg, #d97706 0%, #92400e 100%)',
  others: 'linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)',
};

const solidColours = {
  draft: '#757575',
  sent: '#2563eb',
  pending: '#0ea5e9',
  unpaid: '#b45309',
  overdue: '#b91c1c',
  partially: '#0e7490',
  paid: '#065f46',
  declined: '#b91c1c',
  accepted: '#065f46',
  expired: '#92400e',
  others: '#9ca3af',
};

const statusOrder = [
  'overdue',
  'unpaid',
  'pending',
  'partially',
  'paid',
  'accepted',
  'declined',
  'expired',
  'sent',
  'draft',
];

const defaultStatistics = [
  { tag: 'draft', value: 0 },
  { tag: 'pending', value: 0 },
  { tag: 'sent', value: 0 },
  { tag: 'accepted', value: 0 },
  { tag: 'declined', value: 0 },
  { tag: 'expired', value: 0 },
];

const defaultInvoiceStatistics = [
  { tag: 'draft', value: 0 },
  { tag: 'pending', value: 0 },
  { tag: 'overdue', value: 0 },
  { tag: 'paid', value: 0 },
  { tag: 'unpaid', value: 0 },
  { tag: 'partially', value: 0 },
];

// Custom tooltip with monetary values and breakdown
const CustomTooltip = ({ active, payload, label }) => {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney(); // <-- Use useMoney here
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '12px 16px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        fontSize: '13px',
        minWidth: '160px',
        transition: 'box-shadow 0.2s',
      }}>
        <p style={{ margin: 0, fontWeight: 700, textTransform: 'capitalize', color: solidColours[data.name] }}>
          {translate(data.name)}
        </p>
        <p style={{ margin: '4px 0 0 0', color: solidColours[data.name], fontWeight: 600 }}>
          {data.count} ({data.value}%)
        </p>
        <p style={{ margin: '2px 0 0 0', color: '#595959' }}>
          {data.amount > 0 ? `${translate('Amount')}: ${moneyFormatter({ amount: data.amount })}` : ''}
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for bar chart
const CustomBarTooltip = ({ active, payload }) => {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#fff',
        padding: '12px 16px',
        border: '1px solid #d9d9d9',
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        fontSize: '13px',
        minWidth: '160px',
        transition: 'box-shadow 0.2s',
      }}>
        <p style={{ margin: 0, fontWeight: 700, textTransform: 'capitalize', color: legendColors[data.name] }}>
          {translate(data.name)}
        </p>
        <p style={{ margin: '4px 0 0 0', color: legendColors[data.name], fontWeight: 600 }}>
          {data.count} ({data.percent}%)
        </p>
        <p style={{ margin: '2px 0 0 0', color: '#595959' }}>
          {data.amount > 0 ? `${translate('Amount')}: ${moneyFormatter({ amount: data.amount })}` : ''}
        </p>
      </div>
    );
  }
  return null;
};

// Modern legend: bigger font, clear color dots, better spacing, show currency
const CustomLegend = ({ payload, hoveredIdx }) => {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney(); // <-- Use useMoney here
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '18px',
      marginLeft: '32px',
      fontSize: '15px',
      minWidth: '200px',
      animation: 'fadeIn 0.3s',
    }}>
      {payload.map((entry, index) => {
        const isHovered = hoveredIdx === index;
        return (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '8px 0',
            background: isHovered ? legendBgColors[entry.value] : 'transparent',
            borderRadius: isHovered ? '8px' : '0',
            boxShadow: isHovered ? '0 2px 8px rgba(37,99,235,0.08)' : 'none',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}>
            <div style={{
              width: '18px',
              height: '18px',
              background: legendColors[entry.value] || legendColors.others,
              borderRadius: '50%',
              border: '2px solid #fff',
              boxShadow: '0 0 2px #ccc',
              transition: 'outline 0.2s',
            }} />
            <span style={{
              color: '#262626',
              fontWeight: 700,
              textTransform: 'capitalize',
              minWidth: '90px',
              fontSize: '15px',
              transition: 'color 0.2s',
            }}>
              {translate(entry.value)}
            </span>
            <span style={{ color: '#595959', fontWeight: 500, fontSize: '15px', minWidth: '60px' }}>
              {entry.count} ({entry.percent}%)
            </span>
            {entry.amount > 0 && (
              <span style={{ color: '#2563eb', fontWeight: 600, fontSize: '15px', minWidth: '70px' }}>
                {moneyFormatter({ amount: entry.amount })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Custom label renderer for Pie chart (centered, bold, animated)
const renderCustomizedLabel = ({
  cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, name
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.65;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (value === 0 || percent < 0.03) return null;

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={14}
      fontWeight={700}
      style={{
        pointerEvents: 'none',
        textShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'fill 0.2s',
      }}
    >
      {value}
    </text>
  );
};

export default function PreviewCard({
  title = 'Preview',
  statistics = defaultStatistics,
  isLoading = false,
  entity = 'invoice',
  totalCount,
}) {
  const translate = useLanguage();
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const { moneyFormatter } = useMoney(); // <-- Use useMoney here

  // Prepare chart data for bar chart
  const chartData = useMemo(() => {
    const defaultStats = entity === 'invoice' ? defaultInvoiceStatistics : defaultStatistics;
    const mergedStats = defaultStats.map((defaultStat) => {
      const matchedStat = Array.isArray(statistics)
        ? statistics.find((stat) => stat.tag === defaultStat.tag)
        : null;
      return {
        ...defaultStat,
        name: defaultStat.tag,
        value: matchedStat?.value || matchedStat?.count || defaultStat.value,
        amount: matchedStat?.amount || 0,
        count: matchedStat?.count || 0,
      };
    });

    // Sort by importance
    let sortedStats = mergedStats.sort((a, b) => {
      return statusOrder.indexOf(a.name) - statusOrder.indexOf(b.name);
    });

    // Calculate total for percentage calculation
    const totalValue = sortedStats.reduce((sum, item) => sum + (item.count || item.value || 0), 0);

    // Group small segments as "Others"
    let major = [];
    let minor = [];
    sortedStats.forEach(item => {
      const val = item.count || item.value || 0;
      if (totalValue > 0 && (val / totalValue) < 0.03 && val > 0) {
        minor.push(item);
      } else if (val > 0) {
        major.push(item);
      }
    });
    let filteredData = major.map(item => ({
      ...item,
      percent: totalValue > 0 ? Math.round(((item.count || item.value || 0) / totalValue) * 100) : 0,
    }));
    if (minor.length > 0) {
      const othersValue = minor.reduce((sum, item) => sum + (item.count || item.value || 0), 0);
      const othersAmount = minor.reduce((sum, item) => sum + (item.amount || 0), 0);
      filteredData.push({
        name: 'others',
        value: othersValue,
        count: othersValue,
        amount: othersAmount,
        percent: totalValue > 0 ? Math.round((othersValue / totalValue) * 100) : 0,
      });
    }
    return filteredData.length > 0 ? filteredData : [{
      name: 'no_data',
      value: 0,
      count: 0,
      percent: 0,
      amount: 0,
    }];
  }, [statistics, entity]);

  const hasData = chartData.length > 0 && chartData[0].name !== 'no_data';
  const totalAmount = chartData.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Empty state: actionable suggestions, illustration, quick action
  const EmptyState = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      color: '#8c8c8c',
      padding: '32px 0',
      animation: 'fadeIn 0.2s',
    }}>
      <FileTextOutlined style={{ fontSize: '56px', marginBottom: '16px', color: '#bdbdbd' }} />
      <span style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
        {translate('No data available')}
      </span>
      <span style={{ fontSize: '13px', marginBottom: '16px', color: '#6b7280' }}>
        {translate('Start by creating your first')} {translate(entity)}
      </span>
      <Button type="primary" icon={<PlusOutlined />} size="large">
        {translate('Create')} {translate(entity)}
      </Button>
    </div>
  );

  // Modern layout: horizontal bar chart and legend side by side
  const content = (
    <div
      className="font-roboto"
      style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '32px 28px',
        minHeight: '420px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        boxShadow: '0 4px 24px rgba(37,99,235,0.08)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        border: 'none',
        fontFamily: 'Roboto, Arial, sans-serif',
      }}>
      {/* Chart Section */}
      <div
        className="font-roboto"
        style={{
          display: 'grid',
          gridTemplateRows: '10% 60% 30%',
          gridTemplateColumns: '1fr',
          minWidth: '100%',
          height: '100%',
          fontFamily: 'Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div
          className="font-roboto"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '28px',
            fontFamily: 'Roboto, Arial, sans-serif',
          }}>
          <FileTextOutlined style={{ color: '#4d7f37ff', fontSize: '26px' }} />
          <span
            className="font-roboto"
            style={{
              color: '#4d7f37ff',
              fontSize: '22px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              fontFamily: 'Roboto, Arial, sans-serif',
            }}>{title}</span>
        </div>
        {/* Chart Content */}
        <div
          className="font-roboto"
          style={{
            width: '100%',
            height: '260px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Roboto, Arial, sans-serif',
          }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {hasData ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 15, fontWeight: 600, fill: '#64748b', fontFamily: 'inherit' }}
                      width={90}
                    />
                    <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#eaf4ff' }} />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 8, 8]}
                      barSize={28}
                      onMouseOver={(_, idx) => setHoveredIdx(idx)}
                      onMouseOut={() => setHoveredIdx(null)}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-bar-${index}`}
                          fill={legendColors[entry.name] || legendColors.others}
                          opacity={hoveredIdx === null || hoveredIdx === index ? 1 : 0.5}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState />
              )}
            </>
          )}
        </div>
        {/* Center summary below chart */}
        {hasData && (
          <div
            className="font-roboto"
            style={{
              marginTop: '18px',
              textAlign: 'center',
              fontFamily: 'Roboto, Arial, sans-serif',
            }}>
            <div className="font-roboto" style={{ fontSize: '32px', fontWeight: 'bold', color: '#262626', fontFamily: 'Roboto, Arial, sans-serif' }}>
              {totalCount || 0}
            </div>
            <div className="font-roboto" style={{ fontSize: '15px', fontWeight: 600, color: '#8c8c8c', fontFamily: 'Roboto, Arial, sans-serif' }}>
              {translate(`Total ${entity === 'invoice' ? 'Invoices' : entity.charAt(0).toUpperCase() + entity.slice(1)}`)}
            </div>
            <div className="font-roboto" style={{ fontSize: '13px', fontWeight: 600, color: '#4d7f37ff', marginTop: '2px', fontFamily: 'Roboto, Arial, sans-serif' }}>
              {totalAmount > 0 ? `${translate('Amount')}: ${moneyFormatter({ amount: totalAmount })}` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Col xs={24} sm={24} lg={12} className="font-roboto" style={{ marginBottom: 0, height: '100%', fontFamily: 'Roboto, Arial, sans-serif' }}>
      {content}
    </Col>
  );
}