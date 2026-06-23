import React from 'react';
import { Card, Row, Col, Statistic, Progress, Typography, Space, Tag, Divider } from '@/components/ui';
import { StarOutlined, RiseOutlined, MessageOutlined, LikeOutlined } from '@/components/icons';
import useLanguage from '@/locale/useLanguage';

const { Text, Title } = Typography;

// Changed to default export
const ReviewMetricsCards = ({ stats = {}, loading = false }) => {
  const translate = useLanguage();
  
  const {
    average = 0,
    total = 0,
    distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    sentiment = { positive: 0, neutral: 0, negative: 0 },
    responded = 0,
    platforms = {}
  } = stats;
  
  // Calculate percentages
  const responseRate = total > 0 ? (responded / total * 100).toFixed(1) : 0;
  
  // Calculate sentiment percentages
  const totalSentiment = sentiment.positive + sentiment.neutral + sentiment.negative || 1;
  const positivePct = (sentiment.positive / totalSentiment * 100).toFixed(1);
  const neutralPct = (sentiment.neutral / totalSentiment * 100).toFixed(1);
  const negativePct = (sentiment.negative / totalSentiment * 100).toFixed(1);
  
  // Calculate distribution percentages
  const getDistributionPct = (stars) => {
    return total > 0 ? (distribution[stars] / total * 100).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map(i => (
          <Col xs={24} md={12} lg={6} key={i}>
            <Card loading={true} />
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {/* Average Rating Card */}
      <Col xs={24} md={12} lg={6}>
        <Card hoverable style={{ height: '100%' }}>
          <Statistic
            title={
              <Space>
                <StarOutlined style={{ color: '#fadb14' }} />
                {translate('Average Rating')}
              </Space>
            }
            value={average}
            precision={1}
            suffix="/5"
            valueStyle={{ color: '#722ED1' }}
          />
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', color: '#fadb14', fontSize: '18px' }}>
              {[...Array(Math.round(average))].map((_, i) => (
                <StarOutlined key={i} />
              ))}
            </div>
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">
                {translate('From')} {total} {translate('reviews')}
              </Text>
            </div>
          </div>
        </Card>
      </Col>

      {/* Response Rate Card */}
      <Col xs={24} md={12} lg={6}>
        <Card hoverable style={{ height: '100%' }}>
          <Statistic
            title={
              <Space>
                <MessageOutlined />
                {translate('Response Rate')}
              </Space>
            }
            value={responseRate}
            suffix="%"
            precision={1}
            valueStyle={{ color: '#2F54EB' }}
          />
          <div style={{ marginTop: '16px' }}>
            <Progress 
              percent={responseRate} 
              status={responseRate > 80 ? 'success' : responseRate > 50 ? 'normal' : 'exception'} 
              showInfo={false}
            />
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <Text type="secondary">
                {responded} {translate('of')} {total} {translate('responded')}
              </Text>
              <Text 
                type={responseRate > 80 ? 'success' : responseRate > 50 ? 'warning' : 'danger'}
                strong
              >
                {responseRate > 80 ? translate('Excellent') : 
                 responseRate > 50 ? translate('Good') : 
                 translate('Needs Improvement')}
              </Text>
            </div>
          </div>
        </Card>
      </Col>

      {/* Rating Distribution Card */}
      <Col xs={24} md={12} lg={6}>
        <Card hoverable style={{ height: '100%' }}>
          <Title level={5}>
            <Space>
              <RiseOutlined />
              {translate('Rating Distribution')}
            </Space>
          </Title>
          
          <div style={{ marginTop: '8px' }}>
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} style={{ marginBottom: '4px' }}>
                <Space size="small" style={{ marginBottom: '2px' }}>
                  <Text>{star}</Text>
                  <StarOutlined style={{ color: '#fadb14' }} />
                  <Text>{distribution[star] || 0}</Text>
                </Space>
                <Progress 
                  percent={getDistributionPct(star)} 
                  showInfo={false}
                  strokeColor={
                    star >= 4 ? '#52c41a' : 
                    star === 3 ? '#faad14' : 
                    '#f5222d'
                  }
                  size="small"
                />
              </div>
            ))}
          </div>
        </Card>
      </Col>

      {/* Sentiment Card */}
      <Col xs={24} md={12} lg={6}>
        <Card hoverable style={{ height: '100%' }}>
          <Title level={5}>
            <Space>
              <LikeOutlined />
              {translate('Sentiment')}
            </Space>
          </Title>
          
          <div style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '8px' }}>
              <Space size="small" style={{ marginBottom: '2px' }}>
                <Tag color="success">{translate('Positive')}</Tag>
                <Text>{sentiment.positive}</Text>
                <Text type="secondary">({positivePct}%)</Text>
              </Space>
              <Progress 
                percent={positivePct} 
                showInfo={false}
                strokeColor="#52c41a"
                size="small"
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <Space size="small" style={{ marginBottom: '2px' }}>
                <Tag color="warning">{translate('Neutral')}</Tag>
                <Text>{sentiment.neutral}</Text>
                <Text type="secondary">({neutralPct}%)</Text>
              </Space>
              <Progress 
                percent={neutralPct} 
                showInfo={false}
                strokeColor="#faad14"
                size="small"
              />
            </div>
            
            <div>
              <Space size="small" style={{ marginBottom: '2px' }}>
                <Tag color="error">{translate('Negative')}</Tag>
                <Text>{sentiment.negative}</Text>
                <Text type="secondary">({negativePct}%)</Text>
              </Space>
              <Progress 
                percent={negativePct} 
                showInfo={false}
                strokeColor="#f5222d"
                size="small"
              />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
};

// Changed to default export
export default ReviewMetricsCards;
