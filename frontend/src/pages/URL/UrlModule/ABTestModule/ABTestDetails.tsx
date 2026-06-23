import useLanguage from '@/locale/useLanguage';
import {
  AimOutlined,
  BarChartOutlined,
  CalendarOutlined,
  EditOutlined,
  ExperimentOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@/components/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Progress,
  Row,
  Space,
  Statistic,
  Tag,
  Timeline,
  Typography,
} from '@/components/ui';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ABTestDetails = ({ test, onClose, onEdit }) => {
  const translate = useLanguage();

  // Use normalized variants (always array, always includes control)
  const variants = Array.isArray(test.variants) ? test.variants : (test.variants ? [test.variants] : []);
  // Compute stats from all variants
  const totalClicks = variants.reduce((sum, v) => sum + (v.clicks || 0), 0);
  const totalConversions = variants.reduce((sum, v) => sum + (v.conversions || 0), 0);
  const overallConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0;

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      running: 'processing',
      paused: 'warning',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <EditOutlined />,
      running: <PlayCircleOutlined />,
      paused: <PauseCircleOutlined />,
      completed: <TrophyOutlined />,
      cancelled: <StopOutlined />,
    };
    return icons[status] || <ExperimentOutlined />;
  };

  const calculateDuration = () => {
    if (!test.startDate) return translate('Not started');

    const start = dayjs(test.startDate);
    const end = test.endDate ? dayjs(test.endDate) : dayjs();
    const duration = end.diff(start, 'day');

    return `${duration} ${translate('days')}`;
  };

  const getVariantMetrics = (variant) => {
    // Use normalized variant fields
    const variantClicks = variant.clicks || 0;
    const variantConversions = variant.conversions || 0;
    const conversionRate =
      variantClicks > 0 ? ((variantConversions / variantClicks) * 100).toFixed(2) : 0;
    // Traffic percentage relative to all variants
    const trafficPercentage =
      totalClicks > 0 ? ((variantClicks / totalClicks) * 100).toFixed(1) : 0;

    return {
      trafficPercentage,
      conversionRate,
      clicks: variantClicks,
      conversions: variantConversions,
    };
  };

  const renderVariantCard = (variant, index) => {
    const metrics = getVariantMetrics(variant);
    // Winner logic: highest conversionRate
    const isWinner =
      variants.length > 0 &&
      variant.conversionRate === Math.max(...variants.map(v => v.conversionRate || 0));
    return (
      <Card
        key={variant.id || index}
        title={
          <Space>
            <Avatar style={{ backgroundColor: variant.isControl ? '#1890ff' : '#52c41a' }}>
              {variant.name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <div>{variant.name}</div>
              {isWinner && (
                <Tag color="gold" size="small">
                  <TrophyOutlined /> {translate('Winner')}
                </Tag>
              )}
              {variant.isControl && (
                <Tag color="blue" size="small">
                  {translate('Control')}
                </Tag>
              )}
            </div>
          </Space>
        }
        extra={
          <Tag color={isWinner ? 'gold' : 'default'}>
            {metrics.trafficPercentage}% {translate('Traffic')}
          </Tag>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Statistic
              title={translate('Clicks')}
              value={metrics.clicks}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title={translate('Conversions')}
              value={metrics.conversions}
              prefix={<AimOutlined />}
            />
          </Col>
          <Col span={24}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>{translate('Conversion Rate')}</Text>
            </div>
            <Progress
              percent={parseFloat(metrics.conversionRate)}
              format={(percent) => `${percent}%`}
              strokeColor={isWinner ? '#faad14' : '#1890ff'}
            />
          </Col>
          <Col span={24}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label={translate('URL')}>
                <Text code copyable>
                  {variant.url}
                </Text>
              </Descriptions.Item>
              {variant.description && (
                <Descriptions.Item label={translate('Description')}>
                  {variant.description}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Col>
        </Row>
      </Card>
    );
  };

  const timeline = Array.isArray(test.timeline) ? test.timeline : (test.timeline ? [test.timeline] : []);

  const renderTestTimeline = () => {
    const events = [];

    if (test.createdAt) {
      events.push({
        color: 'blue',
        dot: <EditOutlined />,
        children: (
          <div>
            <Text strong>{translate('Test Created')}</Text>
            <br />
            <Text type="secondary">{dayjs(test.createdAt).format('MMM D, YYYY HH:mm')}</Text>
          </div>
        ),
      });
    }

    if (test.startDate) {
      events.push({
        color: 'green',
        dot: <PlayCircleOutlined />,
        children: (
          <div>
            <Text strong>{translate('Test Started')}</Text>
            <br />
            <Text type="secondary">{dayjs(test.startDate).format('MMM D, YYYY HH:mm')}</Text>
          </div>
        ),
      });
    }

    // Only show stopped if status is cancelled/stopped (not active/running/paused/completed)
    if (test.endDate && ['cancelled', 'stopped'].includes(test.status)) {
      events.push({
        color: 'red',
        dot: <StopOutlined />,
        children: (
          <div>
            <Text strong>{translate('Test Stopped')}</Text>
            <br />
            <Text type="secondary">{dayjs(test.endDate).format('MMM D, YYYY HH:mm')}</Text>
          </div>
        ),
      });
    }

    if (test.endDate && test.status === 'completed') {
      events.push({
        color: 'gold',
        dot: <TrophyOutlined />,
        children: (
          <div>
            <Text strong>{translate('Test Completed')}</Text>
            <br />
            <Text type="secondary">{dayjs(test.endDate).format('MMM D, YYYY HH:mm')}</Text>
            {test.winner && (
              <div style={{ marginTop: '4px' }}>
                <Tag color="gold">
                  {translate('Winner')}: {test.winner}
                </Tag>
              </div>
            )}
          </div>
        ),
      });
    }

    // If backend provides timeline array, append those events as well
    if (Array.isArray(timeline)) {
      timeline.forEach((event, idx) => {
        events.push({
          color: event.color || 'gray',
          dot: event.icon || <ExperimentOutlined />,
          children: (
            <div>
              <Text strong>{event.label || translate('Event')}</Text>
              <br />
              <Text type="secondary">{event.date ? dayjs(event.date).format('MMM D, YYYY HH:mm') : ''}</Text>
              {event.extra && <div>{event.extra}</div>}
            </div>
          ),
        });
      });
    }

    return <Timeline items={events} />;
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        {/* Test Overview */}
        <Col span={24}>
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px',
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {test.name}
                </Title>
                <Text type="secondary">{test.description}</Text>
              </div>
              <Tag
                color={getStatusColor(test.status)}
                icon={getStatusIcon(test.status)}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {translate(test.status)}
              </Tag>
            </div>

            <Descriptions column={2} bordered>
              <Descriptions.Item label={translate('Test Type')}>
                <Space>
                  <ExperimentOutlined />
                  {translate('URL A/B Test')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={translate('Duration')}>
                <Space>
                  <CalendarOutlined />
                  {calculateDuration()}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={translate('Total Traffic')}>
                <Space>
                  <UserOutlined />
                  {test.totalClicks || 0} {translate('clicks')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={translate('Target Traffic')}>
                <Space>
                  <AimOutlined />
                  {test.targetClicks || translate('No limit')}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label={translate('Conversion Goal')}>
                {test.conversionGoal || translate('Page views')}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Confidence Level')}>
                {test.confidenceLevel || 95}%
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Test Performance */}
        <Col span={24}>
          <Card title={translate('Performance Summary')}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={6}>
                <Statistic
                  title={translate('Total Clicks')}
                  value={totalClicks}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title={translate('Total Conversions')}
                  value={totalConversions}
                  prefix={<AimOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title={translate('Overall Conversion Rate')}
                  value={overallConversionRate}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title={translate('Statistical Significance')}
                  value={test.significance || 0}
                  suffix="%"
                  prefix={<TrophyOutlined />}
                  valueStyle={{
                    color: (test.significance || 0) >= 95 ? '#52c41a' : '#faad14',
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Variants */}
        <Col span={14}>
          <Card title={translate('Test Variants')}>
            {(variants.length > 0) ? (
              variants.map((variant, index) => renderVariantCard(variant, index))
            ) : (
              <Text type="secondary">{translate('No variants configured')}</Text>
            )}
          </Card>
        </Col>

        {/* Timeline */}
        <Col span={10}>
          <Card title={translate('Test Timeline')}>{renderTestTimeline()}</Card>
        </Col>

        {/* Test Settings */}
        <Col span={24}>
          <Card title={translate('Test Configuration')}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label={translate('Traffic Split')}>
                {test.trafficSplit ? (
                  <Space>
                    {Object.entries(test.trafficSplit).map(([variant, percentage]) => (
                      <Tag key={variant}>
                        {variant}: {percentage}%
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  translate('Equal split')
                )}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Target Audience')}>
                {test.targetAudience || translate('All visitors')}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Device Targeting')}>
                {test.deviceTargeting ? (
                  <Space>
                    {test.deviceTargeting.map((device) => (
                      <Tag key={device}>{translate(device)}</Tag>
                    ))}
                  </Space>
                ) : (
                  translate('All devices')
                )}
              </Descriptions.Item>
              <Descriptions.Item label={translate('Geographic Targeting')}>
                {test.geoTargeting ? (
                  <Space>
                    {test.geoTargeting.map((location) => (
                      <Tag key={location}>{location}</Tag>
                    ))}
                  </Space>
                ) : (
                  translate('All locations')
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={onClose}>{translate('Close')}</Button>
          {(test.status === 'draft' || test.status === 'paused') && (
            <Button type="primary" icon={<EditOutlined />} onClick={() => onEdit(test)}>
              {translate('Edit Test')}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ABTestDetails;
