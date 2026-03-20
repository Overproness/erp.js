import useLanguage from '@/locale/useLanguage';
import { useMoney } from '@/settings';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  RobotOutlined,
  SafetyOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Card, Descriptions, List, Modal, Select, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

export default function FraudDetectionModal({ visible, onCancel, invoices = [] }) {
  const translate = useLanguage();
  const money = useMoney();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  console.log('🚀 ~ FraudDetectionModal ~ analysisResult:', analysisResult);

  const handleAnalyze = async () => {
    if (!selectedInvoiceId) {
      return;
    }

    setLoading(true);
    try {
      const { request } = await import('@/request');
      const response = await request.post('payment/fraud-detection', {
        invoiceId: selectedInvoiceId,
      });

      if (response.success) {
        setAnalysisResult(response.result);
      }
    } catch (error) {
      console.error('Fraud detection error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelConfig = (level) => {
    switch (level) {
      case 'critical':
        return {
          icon: <CloseCircleOutlined style={{ fontSize: 24 }} />,
          color: '#ff4d4f',
          bgColor: '#fff1f0',
          text: translate('Critical Risk'),
        };
      case 'high':
        return {
          icon: <ExclamationCircleOutlined style={{ fontSize: 24 }} />,
          color: '#ff7a45',
          bgColor: '#fff2e8',
          text: translate('High Risk'),
        };
      case 'medium':
        return {
          icon: <WarningOutlined style={{ fontSize: 24 }} />,
          color: '#faad14',
          bgColor: '#fffbe6',
          text: translate('Medium Risk'),
        };
      case 'low':
      default:
        return {
          icon: <CheckCircleOutlined style={{ fontSize: 24 }} />,
          color: '#52c41a',
          bgColor: '#f6ffed',
          text: translate('Low Risk'),
        };
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'gold';
      default:
        return 'default';
    }
  };

  const handleModalClose = () => {
    setAnalysisResult(null);
    setSelectedInvoiceId(null);
    onCancel();
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SafetyOutlined style={{ fontSize: 20, color: '#8b45ff' }} />
          <span>{translate('AI Fraud Detection')}</span>
        </div>
      }
      open={visible}
      onCancel={handleModalClose}
      width={900}
      footer={null}
      destroyOnClose
    >
      <div style={{ marginTop: 24 }}>
        {/* Invoice Selection */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text strong>{translate('Select Invoice to Analyze')}</Text>
          <Select
            showSearch
            placeholder={translate('Select an invoice')}
            style={{ width: '100%', marginTop: 8 }}
            onChange={(value) => {
              setSelectedInvoiceId(value);
              handleAnalyze();
            }}
            value={selectedInvoiceId}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={invoices
              .filter((inv) => inv && inv._id && inv.number && inv.year)
              .map((inv) => ({
                value: inv._id,
                label: `Invoice #${inv.number}/${inv.year} - ${
                  inv.client?.name || 'N/A'
                } - ${money.moneyFormatter({
                  amount: inv.total || 0,
                  currency_code: inv.currency || 'USD',
                })}`,
              }))}
          />
        </Card>

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>
              {translate('Analyzing payment patterns with AI...')}
            </Paragraph>
          </div>
        )}

        {/* Analysis Results */}
        {!loading && analysisResult && (
          <div>
            {/* Risk Level Card */}
            <Card
              style={{
                marginBottom: 16,
                backgroundColor: getRiskLevelConfig(analysisResult.riskLevel).bgColor,
                borderColor: getRiskLevelConfig(analysisResult.riskLevel).color,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ color: getRiskLevelConfig(analysisResult.riskLevel).color }}>
                  {getRiskLevelConfig(analysisResult.riskLevel).icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ margin: 0 }}>
                    {getRiskLevelConfig(analysisResult.riskLevel).text}
                  </Title>
                  <Text type="secondary">{analysisResult.summary}</Text>
                </div>
                <div>
                  <Badge
                    count={`${analysisResult.score || analysisResult.riskScore || 0}/${
                      analysisResult.maxRiskScore || 100
                    }`}
                    style={{
                      backgroundColor: getRiskLevelConfig(analysisResult.riskLevel).color,
                      fontSize: 16,
                      padding: '0 12px',
                      height: 28,
                    }}
                  />
                </div>
              </div>
            </Card>

            {/* Invoice & Payments Overview - Only show if invoice data exists */}
            {analysisResult.invoice && (
              <Card
                title={translate('Invoice & Payments Overview')}
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label={translate('Invoice Number')}>
                    #{analysisResult.invoice.number}
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('Total Amount')}>
                    {money.moneyFormatter({
                      amount: analysisResult.invoice.total,
                      currency_code: 'USD',
                    })}
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('Paid Amount')}>
                    {money.moneyFormatter({
                      amount: analysisResult.invoice.paid,
                      currency_code: 'USD',
                    })}
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('Payment Status')}>
                    <Tag color={analysisResult.invoice.status === 'paid' ? 'green' : 'orange'}>
                      {translate(analysisResult.invoice.status)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={translate('Payments Count')}>
                    {analysisResult.payments?.length || 0}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Fraud Indicators */}
            {analysisResult.flags && analysisResult.flags.length > 0 && (
              <Card
                title={
                  <span>
                    <WarningOutlined style={{ marginRight: 8 }} />
                    {translate('Fraud Indicators Detected')}
                  </span>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <List
                  dataSource={analysisResult.flags}
                  renderItem={(flag) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Tag color={getSeverityColor(flag.severity)}>
                            {translate(flag.severity.toUpperCase())}
                          </Tag>
                        }
                        title={<Text strong>{flag.message}</Text>}
                        description={<Text type="secondary">{flag.details}</Text>}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* AI Insights */}
            {analysisResult.aiInsights && (
              <Card
                title={
                  <span>
                    <RobotOutlined style={{ marginRight: 8, color: '#8b45ff' }} />
                    {translate('AI-Powered Insights')}
                  </span>
                }
                size="small"
                style={{ marginBottom: 16 }}
              >
                <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {analysisResult.aiInsights}
                </Paragraph>
              </Card>
            )}

            {/* Recommendations */}
            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <Card title={translate('Recommendations')} size="small" style={{ marginBottom: 16 }}>
                <List
                  size="small"
                  dataSource={analysisResult.recommendations}
                  renderItem={(item) => (
                    <List.Item>
                      <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Payment Details - Only show if payments exist */}
            {analysisResult.payments && analysisResult.payments.length > 0 && (
              <Card title={translate('Payment Transactions')} size="small">
                <List
                  dataSource={analysisResult.payments}
                  renderItem={(payment) => (
                    <List.Item>
                      <List.Item.Meta
                        title={`Payment #${payment.number}`}
                        description={
                          <div>
                            <Text>
                              {translate('Amount')}:{' '}
                              {money.moneyFormatter({
                                amount: payment.amount,
                                currency_code: 'USD',
                              })}
                            </Text>
                            <br />
                            <Text type="secondary">
                              {translate('Date')}: {new Date(payment.date).toLocaleDateString()}
                            </Text>
                            {payment.method && (
                              <>
                                <br />
                                <Text type="secondary">
                                  {translate('Method')}: {payment.method}
                                </Text>
                              </>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* No Payments Message */}
            {(!analysisResult.payments || analysisResult.payments.length === 0) &&
              (!analysisResult.flags || analysisResult.flags.length === 0) && (
                <Alert
                  message={translate('No Payment Data')}
                  description={
                    analysisResult.summary ||
                    translate('This invoice has no payment records to analyze for fraud detection.')
                  }
                  type="info"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
              )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !analysisResult && (
          <Alert
            message={translate('Select an invoice to begin fraud analysis')}
            type="info"
            showIcon
          />
        )}
      </div>
    </Modal>
  );
}
