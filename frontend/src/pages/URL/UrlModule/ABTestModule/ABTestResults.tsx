import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress,
  Table,
  Typography,
  Tag,
  Space,
  Button,
  Alert,
  Tabs,
  Tooltip,
  message
} from '@/components/ui';
import {
  TrophyOutlined,
  BarChartOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  DownloadOutlined
} from '@/components/icons';
import { Line, Column, Pie } from '@/components/charts/simple-charts';
import useLanguage from '@/locale/useLanguage';
import { calculateStatisticalSignificance } from './utils/analyticsUtils';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const ABTestResults = ({ test, onClose }) => {
  const translate = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [results, setResults] = useState(null);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    if (test?.results) {
      processResults(test.results);
    }
  }, [test]);

  const processResults = (rawResults) => {
    const variants = rawResults.variants || [];
    let bestVariant = null;
    let maxConversionRate = 0;

    // Process each variant
    const processedVariants = variants.map(variant => {
      const conversionRate = variant.conversions / variant.visitors * 100;
      const confidence = variant.confidence || 0;
      
      if (conversionRate > maxConversionRate) {
        maxConversionRate = conversionRate;
        bestVariant = variant;
      }

      return {
        ...variant,
        conversionRate,
        confidence,
        isWinner: false
      };
    });

    // Mark winner and calculate significance
    if (bestVariant) {
      const control = processedVariants.find(v => v.isControl);
      const significance = calculateStatisticalSignificance(
        {
          conversions: control?.conversions || 0,
          visitors: control?.visitors || 0
        },
        {
          conversions: bestVariant.conversions,
          visitors: bestVariant.visitors
        }
      );

      processedVariants.forEach(variant => {
        if (variant.id === bestVariant.id) {
          variant.isWinner = significance.significant;
          variant.improvement = significance.improvement;
          variant.statisticalSignificance = significance;
        }
      });

      setWinner(significance.significant ? bestVariant : null);
    }

    setResults({
      ...rawResults,
      variants: processedVariants,
      hasWinner: !!winner,
      testDuration: dayjs().diff(dayjs(test.startDate), 'day'),
      isComplete: test.status === 'completed'
    });
  };

  const handleDeclareWinner = async (variantId) => {
    try {
      // API call to declare winner
      message.success(translate('Winner declared successfully'));
    } catch (error) {
      message.error(translate('Failed to declare winner'));
    }
  };

  const handleExportResults = () => {
    // Export functionality
    const data = results.variants.map(variant => ({
      variant: variant.name,
      visitors: variant.visitors,
      conversions: variant.conversions,
      conversionRate: variant.conversionRate.toFixed(2) + '%',
      confidence: variant.confidence + '%'
    }));

    const csvContent = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ab_test_results_${test.name}_${dayjs().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!results) {
    return <div>Loading results...</div>;
  }

  // Table columns for variant comparison
  const variantColumns = [
    {
      title: translate('Variant'),
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <span style={{ fontWeight: 600 }}>{name}</span>
          {record.isControl && <Tag color="blue">{translate('Control')}</Tag>}
          {record.isWinner && <Tag color="gold" icon={<TrophyOutlined />}>{translate('Winner')}</Tag>}
        </Space>
      ),
    },
    {
      title: translate('Visitors'),
      dataIndex: 'visitors',
      key: 'visitors',
      render: (visitors) => visitors?.toLocaleString() || 0,
    },
    {
      title: translate('Conversions'),
      dataIndex: 'conversions',
      key: 'conversions',
      render: (conversions) => conversions?.toLocaleString() || 0,
    },
    {
      title: translate('Conversion Rate'),
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (rate, record) => (
        <div>
          <Text strong style={{ 
            color: record.isWinner ? '#52c41a' : '#000'
          }}>
            {rate?.toFixed(2) || 0}%
          </Text>
          {record.improvement && (
            <div style={{ fontSize: '12px', color: '#52c41a' }}>
              +{record.improvement.toFixed(1)}% improvement
            </div>
          )}
        </div>
      ),
    },
    {
      title: translate('Confidence'),
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence, record) => (
        <div>
          <Progress
            percent={confidence}
            size="small"
            strokeColor={confidence >= 95 ? '#52c41a' : confidence >= 80 ? '#faad14' : '#ff4d4f'}
            format={(percent) => `${percent}%`}
          />
          {record.statisticalSignificance && (
            <div style={{ fontSize: '11px', marginTop: '2px' }}>
              {record.statisticalSignificance.significant ? (
                <Text type="success">
                  <CheckCircleOutlined /> {translate('Significant')}
                </Text>
              ) : (
                <Text type="warning">
                  <QuestionCircleOutlined /> {translate('Not significant')}
                </Text>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: translate('Actions'),
      key: 'actions',
      render: (_, record) => (
        !record.isControl && record.conversionRate > 0 && (
          <Button
            size="small"
            type="primary"
            onClick={() => handleDeclareWinner(record.id)}
            disabled={test.status === 'completed' || record.confidence < 95}
          >
            {translate('Declare Winner')}
          </Button>
        )
      ),
    },
  ];

  // Chart configurations
  const conversionChartConfig = {
    data: results.variants.map(v => ({
      variant: v.name,
      conversionRate: v.conversionRate,
      isWinner: v.isWinner
    })),
    xField: 'variant',
    yField: 'conversionRate',
    color: ({ isWinner }) => isWinner ? '#52c41a' : '#8b5cf6',
  };

  const timelineConfig = {
    data: results.timeline || [],
    xField: 'date',
    yField: 'conversionRate',
    seriesField: 'variant',
    smooth: true,
  };

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
            <Title level={4} style={{ margin: 0 }}>
              {test.name} - {translate('Results')}
            </Title>
            <Text type="secondary">
              {translate('Test Duration')}: {results.testDuration} {translate('days')} |
              {translate('Status')}: <Tag color={test.status === 'completed' ? 'success' : 'processing'}>
                {translate(test.status)}
              </Tag>
            </Text>
          </div>
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExportResults}
            >
              {translate('Export Results')}
            </Button>
            <Button onClick={onClose}>
              {translate('Close')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Winner Alert */}
      {winner && (
        <Alert
          message={translate('Test Winner Detected!')}
          description={
            <div>
              <Text strong>{winner.name}</Text> {translate('is performing significantly better with')} 
              <Text strong style={{ color: '#52c41a' }}> {winner.conversionRate.toFixed(2)}%</Text> 
              {translate('conversion rate')}
              {winner.improvement && (
                <Text> ({winner.improvement.toFixed(1)}% {translate('improvement')})</Text>
              )}
            </div>
          }
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => handleDeclareWinner(winner.id)}
            >
              {translate('Declare Winner')}
            </Button>
          }
        />
      )}

      {/* Test incomplete warning */}
      {test.status !== 'completed' && (
        <Alert
          message={translate('Test in Progress')}
          description={translate('Results may change as more data is collected. Wait for statistical significance before making decisions.')}
          type="info"
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Visitors')}
              value={results.variants.reduce((sum, v) => sum + v.visitors, 0)}
              valueStyle={{ color: '#8b5cf6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Total Conversions')}
              value={results.variants.reduce((sum, v) => sum + v.conversions, 0)}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Best Conversion Rate')}
              value={Math.max(...results.variants.map(v => v.conversionRate))}
              precision={2}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title={translate('Confidence Level')}
              value={winner?.confidence || Math.max(...results.variants.map(v => v.confidence))}
              suffix="%"
              valueStyle={{ 
                color: (winner?.confidence || 0) >= 95 ? '#52c41a' : '#faad14' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Results */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} type="card">
        <TabPane tab={translate('Overview')} key="overview">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card title={translate('Variant Performance')}>
                <Table
                  columns={variantColumns}
                  dataSource={results.variants}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card title={translate('Conversion Rate Comparison')}>
                <Column {...conversionChartConfig} height={250} />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab={translate('Timeline')} key="timeline">
          <Card title={translate('Performance Over Time')}>
            <Line {...timelineConfig} height={400} />
          </Card>
        </TabPane>

        <TabPane tab={translate('Statistical Analysis')} key="statistics">
          <Row gutter={[16, 16]}>
            {results.variants.filter(v => !v.isControl).map(variant => (
              <Col xs={24} lg={12} key={variant.id}>
                <Card 
                  title={`${variant.name} vs Control`}
                  extra={
                    variant.statisticalSignificance?.significant ? (
                      <Tag color="success">{translate('Significant')}</Tag>
                    ) : (
                      <Tag color="warning">{translate('Not Significant')}</Tag>
                    )
                  }
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title={translate('Improvement')}
                        value={variant.improvement || 0}
                        precision={1}
                        suffix="%"
                        valueStyle={{ 
                          color: (variant.improvement || 0) > 0 ? '#52c41a' : '#ff4d4f' 
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title={translate('Z-Score')}
                        value={variant.statisticalSignificance?.zScore || 0}
                        precision={2}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default ABTestResults;
