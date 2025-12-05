import useLanguage from '@/locale/useLanguage';
import {
  BulbOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { Alert, Card, Divider, Empty, Modal, Spin, Typography } from 'antd';

const { Title, Paragraph, Text } = Typography;

const CustomerInsightsModal = ({ visible, onClose, loading, insights, error }) => {
  const translate = useLanguage();

  const renderInsightsList = (items, icon, color, title) => {
    if (!items || items.length === 0) return null;

    return (
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        headStyle={{ backgroundColor: `${color}15`, borderBottom: `2px solid ${color}` }}
        title={
          <span style={{ color }}>
            {icon} {title}
          </span>
        }
      >
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          {items.map((item, index) => (
            <li key={index} style={{ marginBottom: 8 }}>
              <Text>{item}</Text>
            </li>
          ))}
        </ul>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <span>
          <BulbOutlined style={{ marginRight: 8 }} />
          {translate('AI Customer Insights & Recommendations')}
        </span>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      closeIcon={<CloseOutlined />}
      styles={{
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Spin size="large" />
          <Paragraph style={{ marginTop: 16, color: '#666' }}>
            {translate('Analyzing customer data and generating insights...')}
          </Paragraph>
        </div>
      )}

      {error && !loading && (
        <Alert
          message={translate('Error')}
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {!loading && !error && insights && (
        <>
          {/* Customer Name */}
          {insights.customerName && (
            <>
              <Title level={4} style={{ marginTop: 0 }}>
                {translate('Analysis for')}: {insights.customerName}
              </Title>
              <Divider style={{ margin: '16px 0' }} />
            </>
          )}

          {/* Key Insights */}
          {renderInsightsList(
            insights.insights,
            <BulbOutlined />,
            '#1890ff',
            translate('Key Insights')
          )}

          {/* Recommendations */}
          {renderInsightsList(
            insights.recommendations,
            <CheckCircleOutlined />,
            '#52c41a',
            translate('Recommendations')
          )}

          {/* Opportunities */}
          {renderInsightsList(
            insights.opportunities,
            <RiseOutlined />,
            '#722ed1',
            translate('Growth Opportunities')
          )}

          {/* Risks */}
          {renderInsightsList(
            insights.risks,
            <ExclamationCircleOutlined />,
            '#faad14',
            translate('Risk Assessment')
          )}

          {/* Empty state */}
          {(!insights.insights || insights.insights.length === 0) &&
            (!insights.recommendations || insights.recommendations.length === 0) &&
            (!insights.opportunities || insights.opportunities.length === 0) &&
            (!insights.risks || insights.risks.length === 0) && (
              <Empty
                description={translate('No insights available')}
                style={{ padding: '40px 0' }}
              />
            )}

          {/* Usage stats (optional, for debugging) */}
          {insights.usage && (
            <div
              style={{ marginTop: 24, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 4 }}
            >
              <Text type="secondary" style={{ fontSize: 12 }}>
                {translate('AI Usage')}: {insights.usage.prompt_tokens || 0} prompt tokens,{' '}
                {insights.usage.completion_tokens || 0} completion tokens
                {insights.cost && ` • Cost: $${insights.cost.toFixed(4)}`}
              </Text>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default CustomerInsightsModal;
