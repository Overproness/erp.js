import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Bar,
  BarChart,
  ComposedChart
} from 'recharts';
import { Box, ToggleButtonGroup, ToggleButton, Typography, Alert, Button } from '@mui/material';
import { 
  Timeline as TimelineIcon, 
  BarChart as BarChartIcon,
  RefreshOutlined as RefreshIcon 
} from '@mui/icons-material';

// Default dummy data to use when no real data is provided
const defaultData = [
  { period: '2023-01', count: 18, averageRating: 3.9, responseRate: 75 },
  { period: '2023-02', count: 22, averageRating: 3.8, responseRate: 77 },
  { period: '2023-03', count: 25, averageRating: 4.0, responseRate: 80 },
  { period: '2023-04', count: 31, averageRating: 4.1, responseRate: 82 },
  { period: '2023-05', count: 35, averageRating: 4.0, responseRate: 85 },
  { period: '2023-06', count: 42, averageRating: 4.2, responseRate: 86 }
];

const formatMonth = (period) => {
  // Expected format: 2023-01, 2023-02, etc.
  if (!period || typeof period !== 'string') return '';
  
  try {
    const [year, month] = period.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'short' });
  } catch (e) {
    return period;
  }
};

const ReviewTimeline = ({ trends = [] }) => {
  const [chartType, setChartType] = useState('line');
  
  // Use provided trends data or fallback to default dummy data
  const chartData = trends && trends.length > 0 ? trends : defaultData;
  
  // For demo purposes, add a way to show empty state
  const [showEmpty, setShowEmpty] = useState(false);
  
  const handleChartTypeChange = (event, newType) => {
    if (newType !== null) {
      setChartType(newType);
    }
  };

  // For demo purposes only - toggle empty state
  const toggleEmptyState = () => {
    setShowEmpty(!showEmpty);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            p: 2,
            borderRadius: 1,
            boxShadow: 2,
            border: '1px solid #ddd',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            {formatMonth(label)} {label.split('-')[0]}
          </Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
              Reviews: {payload[0].value}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
              Avg Rating: {payload[1].value.toFixed(1)}
            </Typography>
            {payload[2] && (
              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                Response Rate: {payload[2].value}%
              </Typography>
            )}
          </Box>
        </Box>
      );
    }
    return null;
  };

  // Render empty state if no data or if showEmpty is true (for demo)
  if (showEmpty || (!chartData || chartData.length === 0)) {
    return (
      <Box 
        sx={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center',
          py: 4
        }}
      >
        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
          No reviews match your filters
        </Typography>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }}
          onClick={() => setShowEmpty(false)}
        >
          CLEAR FILTERS
        </Button>
        
        {/* This button is only for demo purposes */}
        <Button 
          variant="text" 
          size="small" 
          sx={{ mt: 4, color: 'text.disabled' }}
          onClick={toggleEmptyState}
        >
          Toggle Demo Data
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          size="small"
          aria-label="chart type"
        >
          <ToggleButton value="line" aria-label="line chart">
            <TimelineIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="bar" aria-label="bar chart">
            <BarChartIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        
        {/* Toggle button for demo purposes only */}
        <Button 
          size="small" 
          sx={{ ml: 2, color: 'text.secondary' }}
          onClick={toggleEmptyState}
          startIcon={<RefreshIcon fontSize="small" />}
        >
          Toggle Empty State
        </Button>
      </Box>
      
      <ResponsiveContainer width="100%" height="90%">
        {chartType === 'line' ? (
          <ComposedChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="period" 
              axisLine={false}
              tickLine={false}
              tickFormatter={formatMonth} 
            />
            <YAxis 
              yAxisId="left"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              domain={[0, 5]}
              axisLine={false}
              tickLine={false} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="count"
              name="Reviews"
              fill="#2196f3"
              barSize={30}
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="averageRating"
              name="Avg Rating"
              stroke="#ff9800"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="responseRate"
              name="Response Rate"
              stroke="#4caf50"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        ) : (
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="period" 
              axisLine={false}
              tickLine={false}
              tickFormatter={formatMonth} 
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="count"
              name="Reviews"
              fill="#2196f3"
              barSize={40}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Box>
  );
};

export default ReviewTimeline;
