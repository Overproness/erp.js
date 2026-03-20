import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Box, Typography } from '@mui/material';

// Default dummy data to use when no data is provided
const defaultData = [
  { name: 'Positive', value: 65, color: '#4caf50' },
  { name: 'Neutral', value: 22, color: '#ff9800' },
  { name: 'Negative', value: 13, color: '#f44336' }
];

const COLORS = ['#4caf50', '#ff9800', '#f44336'];
const RADIAN = Math.PI / 180;

const SentimentChart = ({ data = null }) => {
  // Use provided data or fallback to default dummy data
  const chartData = data ? 
    [
      { name: 'Positive', value: data.positive || 0, color: '#4caf50' },
      { name: 'Neutral', value: data.neutral || 0, color: '#ff9800' },
      { name: 'Negative', value: data.negative || 0, color: '#f44336' }
    ] : defaultData;
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, value }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return value > 0 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Percentage']}
            contentStyle={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          />
          <Legend verticalAlign="bottom" align="center" layout="horizontal" />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SentimentChart;
