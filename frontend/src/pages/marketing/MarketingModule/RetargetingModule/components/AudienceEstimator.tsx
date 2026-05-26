import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Button, 
  Typography, 
  Space,
  Tag,
  Divider,
  Alert,
  Spin
} from '@/components/ui';
import { 
  UserOutlined, 
  TeamOutlined, 
  AimOutlined, 
  DollarOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import useLanguage from '@/locale/useLanguage';

// Chart registration (ensures Chart.js behaves correctly with React)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

// Register the required chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const { Text, Paragraph } = Typography;

const AudienceEstimator = ({ audienceSize, rules, platforms }) => {
  const translate = useLanguage();
  const [loading, setLoading] = useState(false);
  const [estimatedReach, setEstimatedReach] = useState({});
  const [costEstimates, setCostEstimates] = useState({});
  const [performanceEstimates, setPerformanceEstimates] = useState({});
  
  // Use direct canvas drawing instead of react-chartjs-2
  const chartContainerRef = useRef({
    pie: null,
    bar: null
  });
  
  const chartInstancesRef = useRef({
    pie: null,
    bar: null
  });

  // Generate audience insights when component mounts or when audience parameters change
  useEffect(() => {
    if (audienceSize > 0) {
      generateEstimates();

      // Cleanup existing charts before redrawing
      if (chartInstancesRef.current.pie) {
        chartInstancesRef.current.pie.destroy();
        chartInstancesRef.current.pie = null;
      }
      
      if (chartInstancesRef.current.bar) {
        chartInstancesRef.current.bar.destroy();
        chartInstancesRef.current.bar = null;
      }

      // Give time for DOM to update before creating new charts
      const timer = setTimeout(() => {
        createCharts();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        
        // Cleanup on unmount
        if (chartInstancesRef.current.pie) {
          chartInstancesRef.current.pie.destroy();
          chartInstancesRef.current.pie = null;
        }
        
        if (chartInstancesRef.current.bar) {
          chartInstancesRef.current.bar.destroy();
          chartInstancesRef.current.bar = null;
        }
      };
    }
  }, [audienceSize, rules, platforms]);
  
  // Create the actual chart instances
  const createCharts = () => {
    if (!chartContainerRef.current.pie || !chartContainerRef.current.bar) return;
    
    try {
      // Create pie chart
      const pieCtx = chartContainerRef.current.pie.getContext('2d');
      if (pieCtx) {
        chartInstancesRef.current.pie = new ChartJS(pieCtx, {
          type: 'pie',
          data: audienceDistributionData,
          options: chartOptions
        });
      }
      
      // Create bar chart
      const barCtx = chartContainerRef.current.bar.getContext('2d');
      if (barCtx) {
        chartInstancesRef.current.bar = new ChartJS(barCtx, {
          type: 'bar',
          data: costComparisonData,
          options: {
            ...chartOptions,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: translate('Cost in $')
                }
              }
            }
          }
        });
      }
    } catch (error) {
      console.error('Error creating charts:', error);
    }
  };
  
  // Simulate API call to generate audience estimates
  const generateEstimates = () => {
    setLoading(true);
    
    setTimeout(() => {
      // Generate reach estimates per platform
      const reach = {};
      platforms.forEach(platform => {
        // Each platform has different reach potential
        const multipliers = {
          'facebook': 0.8,
          'instagram': 0.75,
          'google': 0.9,
          'linkedin': 0.6,
          'twitter': 0.7
        };
        
        reach[platform] = Math.floor(audienceSize * (multipliers[platform] || 0.7));
      });
      setEstimatedReach(reach);
      
      // Generate cost estimates (per 1000 impressions)
      const costs = {};
      platforms.forEach(platform => {
        const baseCosts = {
          'facebook': 7.5,
          'instagram': 7.0,
          'google': 6.2,
          'linkedin': 9.8,
          'twitter': 5.4
        };
        
        const complexityFactor = 1 + (rules.length * 0.05);
        costs[platform] = +((baseCosts[platform] || 6.0) * complexityFactor).toFixed(2);
      });
      setCostEstimates(costs);
      
      // Generate performance estimates
      const performance = {
        clickRate: +(Math.random() * 3 + 0.8).toFixed(2),
        conversionRate: +(Math.random() * 1 + 0.2).toFixed(2),
        roiEstimate: +(Math.random() * 4 + 2).toFixed(2)
      };
      setPerformanceEstimates(performance);
      
      setLoading(false);
    }, 1500);
  };
  
  const colorMap = {
    facebook: { bg: 'rgba(59, 89, 152, 0.7)', border: 'rgba(59, 89, 152, 1)' },
    instagram: { bg: 'rgba(225, 48, 108, 0.7)', border: 'rgba(225, 48, 108, 1)' },
    google: { bg: 'rgba(219, 68, 55, 0.7)', border: 'rgba(219, 68, 55, 1)' },
    linkedin: { bg: 'rgba(0, 119, 181, 0.7)', border: 'rgba(0, 119, 181, 1)' },
    twitter: { bg: 'rgba(29, 161, 242, 0.7)', border: 'rgba(29, 161, 242, 1)' },
  };
  const getBg = (p) => (colorMap[p]?.bg || 'rgba(107,114,128,0.7)');
  const getBorder = (p) => (colorMap[p]?.border || 'rgba(107,114,128,1)');
  
  // Chart data for audience by platform
  const audienceDistributionData = {
    labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [
      {
        data: platforms.map(p => estimatedReach[p] || 0),
        backgroundColor: platforms.map(getBg),
        borderColor: platforms.map(getBorder),
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for cost comparison
  const costComparisonData = {
    labels: platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)),
    datasets: [
      {
        label: translate('CPM (Cost per 1000 impressions)'),
        data: platforms.map(p => costEstimates[p] || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };
  
  // If no audience size, show placeholder
  if (audienceSize === 0) {
    return (
      <Alert
        message={translate("No Audience Data")}
        description={translate("Please define audience rules and run the estimator to view insights.")}
        type="info"
        showIcon
      />
    );
  }
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          {translate("Analyzing audience data...")}
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* Audience Overview */}
        <Col xs={24} lg={8}>
          <Card>
            <Statistic
              title={translate("Total Audience Size")}
              value={audienceSize}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            
            <Divider />
            
            <Paragraph>
              <Text strong>{translate("Applied Rules:")}</Text> {rules.length}
            </Paragraph>
            
            <Paragraph>
              <Text strong>{translate("Platforms:")}</Text>{' '}
              {platforms.map(platform => (
                <Tag key={platform}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Tag>
              ))}
            </Paragraph>
            
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={generateEstimates}
              style={{ marginTop: '16px' }}
            >
              {translate("Refresh Estimates")}
            </Button>
          </Card>
        </Col>
        
        {/* Reach Estimates */}
        <Col xs={24} lg={8}>
          <Card title={translate("Platform Reach Estimates")}>
            {platforms.map(platform => (
              <div key={platform} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Text>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                  <Text>{estimatedReach[platform]?.toLocaleString() || 0}</Text>
                </div>
                <Progress 
                  percent={Math.round((estimatedReach[platform] || 0) / audienceSize * 100)} 
                  size="small"
                  strokeColor={
                    platform === 'facebook' ? '#3b5998' :
                    platform === 'google' ? '#db4437' :
                    platform === 'linkedin' ? '#0077b5' : 
                    '#1da1f2'
                  }
                />
              </div>
            ))}
            
            <div style={{ marginTop: '20px' }}>
              <Text type="secondary">
                {translate("Reach estimates are based on platform audience network capabilities and targeting options.")}
              </Text>
            </div>
          </Card>
        </Col>
        
        {/* Performance Metrics */}
        <Col xs={24} lg={8}>
          <Card title={translate("Estimated Performance")}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title={translate("Estimated Click Rate")}
                value={performanceEstimates.clickRate}
                suffix="%"
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
              
              <Statistic
                title={translate("Estimated Conversion Rate")}
                value={performanceEstimates.conversionRate}
                suffix="%"
                precision={2}
                valueStyle={{ color: '#cf1322' }}
              />
              
              <Statistic
                title={translate("Estimated ROI")}
                value={performanceEstimates.roiEstimate}
                prefix="$"
                suffix="/dollar spent"
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Space>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        {/* Audience Distribution Chart */}
        <Col xs={24} lg={12}>
          <Card title={translate("Audience Distribution by Platform")}>
            <div style={{ height: '300px', position: 'relative' }}>
              <canvas 
                ref={el => chartContainerRef.current.pie = el}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </Card>
        </Col>
        
        {/* Cost Comparison Chart */}
        <Col xs={24} lg={12}>
          <Card title={translate("Cost Comparison by Platform")}>
            <div style={{ height: '300px', position: 'relative' }}>
              <canvas 
                ref={el => chartContainerRef.current.bar = el}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </Card>
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        {/* Budget Recommendations */}
        <Col xs={24}>
          <Card 
            title={
              <span>
                <DollarOutlined style={{ marginRight: '8px' }} />
                {translate("Budget Recommendations")}
              </span>
            }
          >
            <Paragraph>
              {translate("Based on your audience size and targeting parameters, we recommend the following daily budgets:")}
            </Paragraph>
            
            <Row gutter={16}>
              {platforms.map(platform => {
                // Calculate recommended budget based on audience size and CPM
                const cpm = costEstimates[platform] || 5;
                const reach = estimatedReach[platform] || audienceSize * 0.7;
                const impressionsPerUser = 3; // Assume 3 impressions per user
                
                // Budget formula: (reach * impressions * CPM) / 1000
                const recommendedBudget = Math.round((reach * impressionsPerUser * cpm) / 1000);
                
                // Determine budget levels
                const minBudget = Math.round(recommendedBudget * 0.5);
                const maxBudget = Math.round(recommendedBudget * 2);
                
                return (
                  <Col key={platform} xs={24} sm={12} md={6}>
                    <Card size="small" title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                      <Statistic
                        title={translate("Recommended Daily")}
                        value={recommendedBudget}
                        prefix="$"
                        valueStyle={{ color: '#1890ff' }}
                      />
                      <Text type="secondary">
                        {translate("Range")}: ${minBudget} - ${maxBudget}
                      </Text>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            
            <Alert
              message={translate("Optimization Tip")}
              description={translate("Start with the recommended budget and adjust based on performance. Monitor closely during the first week to optimize spending.")}
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AudienceEstimator;
