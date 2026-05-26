import useLanguage from '@/locale/useLanguage';
import { selectSuggestions, selectSuggestionsLoading } from '@/redux/ai/aiSelectors';
import { fetchSuggestions } from '@/redux/ai/aiThunks';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BulbOutlined,
  DollarOutlined,
  FallOutlined,
  RiseOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Col, Empty, Row, Space, Spin, Statistic, Typography } from '@/components/ui';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const { Title, Text, Paragraph } = Typography;

const BusinessInsights = () => {
  const dispatch = useDispatch();
  const translate = useLanguage();
  const [timeframe, setTimeframe] = useState('30_days');

  const suggestions = useSelector(selectSuggestions);
  const loading = useSelector(selectSuggestionsLoading);
  const prevTimeframeRef = useRef('');

  useEffect(() => {
    if (prevTimeframeRef.current === timeframe) return;
    prevTimeframeRef.current = timeframe;
    dispatch(
      fetchSuggestions({
        module: 'business_intelligence',
        type: 'insights',
        data: { timeframe },
      })
    );
  }, [dispatch, timeframe]);

  const timeframes = [
    { key: '7_days', label: '7 Days' },
    { key: '30_days', label: '30 Days' },
    { key: '90_days', label: '90 Days' },
    { key: '1_year', label: '1 Year' },
  ];

  const getInsightIcon = (type) => {
    switch (type) {
      case 'revenue':
        return <DollarOutlined style={{ color: '#52c41a' }} />;
      case 'customers':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'efficiency':
        return <RiseOutlined style={{ color: '#722ed1' }} />;
      case 'risk':
        return <FallOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <BulbOutlined />;
    }
  };

  const getInsightColor = (sentiment) => {
    switch (sentiment) {
      case 'positive':
        return 'success';
      case 'negative':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <div>
      <Card
        title={
          <>
            <BulbOutlined /> {translate('Business Intelligence Insights')}
          </>
        }
        extra={
          <Space>
            {timeframes.map((tf) => (
              <Button
                key={tf.key}
                type={timeframe === tf.key ? 'primary' : 'default'}
                size="small"
                onClick={() => setTimeframe(tf.key)}
              >
                {translate(tf.label)}
              </Button>
            ))}
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: '16px' }}>
              {translate('Generating business insights...')}
            </Paragraph>
          </div>
        ) : suggestions?.insights ? (
          <div>
            {/* Key Metrics */}
            {suggestions.insights.metrics && (
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {suggestions.insights.metrics.map((metric, index) => (
                  <Col xs={24} sm={12} lg={6} key={index}>
                    <Card>
                      <Statistic
                        title={metric.title}
                        value={metric.value}
                        precision={metric.precision || 0}
                        valueStyle={{
                          color:
                            metric.trend === 'up'
                              ? '#3f8600'
                              : metric.trend === 'down'
                                ? '#cf1322'
                                : '#1890ff',
                        }}
                        prefix={getInsightIcon(metric.type)}
                        suffix={metric.suffix}
                      />
                      {metric.change && (
                        <div style={{ marginTop: '8px' }}>
                          <Text type="secondary">
                            {metric.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
                            {metric.change} {translate('vs previous period')}
                          </Text>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            )}

            {/* Insights */}
            {suggestions.insights.findings && (
              <Row gutter={[16, 16]}>
                {suggestions.insights.findings.map((insight, index) => (
                  <Col xs={24} lg={12} key={index}>
                    <Alert
                      message={insight.title}
                      description={
                        <div>
                          <Paragraph>{insight.description}</Paragraph>
                          {insight.recommendations && (
                            <div>
                              <Text strong>{translate('Recommendations')}:</Text>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {insight.recommendations.map((rec, recIndex) => (
                                  <li key={recIndex}>{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {insight.actionItems && (
                            <div style={{ marginTop: '12px' }}>
                              <Text strong>{translate('Action Items')}:</Text>
                              <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                {insight.actionItems.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      }
                      type={getInsightColor(insight.sentiment)}
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                  </Col>
                ))}
              </Row>
            )}

            {/* Trends */}
            {suggestions.insights.trends && (
              <Card
                title={translate('Market Trends & Opportunities')}
                style={{ marginTop: '24px' }}
              >
                <Row gutter={[16, 16]}>
                  {suggestions.insights.trends.map((trend, index) => (
                    <Col xs={24} lg={8} key={index}>
                      <Card size="small">
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                          {getInsightIcon(trend.category)}
                        </div>
                        <Title level={5} style={{ textAlign: 'center' }}>
                          {trend.title}
                        </Title>
                        <Paragraph>{trend.description}</Paragraph>
                        {trend.impact && (
                          <div>
                            <Text strong>{translate('Potential Impact')}: </Text>
                            <Text>{trend.impact}</Text>
                          </div>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            )}
          </div>
        ) : (
          <Empty
            description={translate('No business insights available for the selected timeframe')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>
    </div>
  );
};

export default BusinessInsights;
