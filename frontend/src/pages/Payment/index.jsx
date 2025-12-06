import { DataImportButton } from '@/components/DataEntry';
import FraudDetectionModal from '@/components/FraudDetectionModal';
import { usePaymentStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { request } from '@/request';
import { useDate, useMoney } from '@/settings';
import {
  ArrowUpOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  DollarOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Row, Spin, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PaymentDataTableModule from './PaymentModule/PaymentDataTableModule';

const { Title, Text } = Typography;

export default function Payment() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { moneyFormatter } = useMoney();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [fraudModalVisible, setFraudModalVisible] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Use dynamic statistics from API
  const {
    data: paymentStats,
    loading: statsLoading,
    error: statsError,
  } = usePaymentStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Fetch invoices for fraud detection
  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await request.list({
        entity: 'invoice',
        options: {
          page: 1,
          items: 100,
        },
      });
      if (response.success) {
        setInvoices(response.result || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    if (fraudModalVisible) {
      fetchInvoices();
    }
  }, [fraudModalVisible]);

  const searchConfig = {
    entity: 'client',
    displayLabels: ['number'],
    searchFields: 'number',
    outputValue: '_id',
  };

  const deleteModalLabels = ['number'];
  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCardOutlined style={{ color: '#8b45ff' }} />
          <span style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: '#6b7280', fontSize: '12px' }} />
          <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Amount'),
      dataIndex: 'amount',
      onCell: () => ({
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      }),
      render: (amount, record) => (
        <span style={{ fontWeight: '600', color: '#52c41a', fontSize: '14px' }}>
          {moneyFormatter({ amount: amount, currency_code: record.currency })}
        </span>
      ),
    },
    {
      title: translate('Date'),
      dataIndex: 'date',
      render: (date) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#6b7280', fontSize: '12px' }} />
          <span style={{ fontSize: '13px' }}>{dayjs(date).format(dateFormat)}</span>
        </div>
      ),
    },
    {
      title: translate('Invoice Number'),
      dataIndex: ['invoice', 'number'],
      render: (text) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{text}</span>,
    },
    {
      title: translate('Year'),
      dataIndex: ['invoice', 'year'],
      render: (year) => <Tag style={{ borderRadius: '6px' }}>{year}</Tag>,
    },
    {
      title: translate('Payment Mode'),
      dataIndex: ['paymentMode', 'name'],
      render: (mode) => (
        <Tag color="blue" style={{ borderRadius: '6px', fontWeight: '500' }}>
          {mode}
        </Tag>
      ),
    },
  ];

  const entity = 'payment';

  const Labels = {
    PANEL_TITLE: translate('payment'),
    DATATABLE_TITLE: translate('payment_list'),
    ADD_NEW_ENTITY: translate('add_new_payment'),
    ENTITY_NAME: translate('payment'),
  };

  const configPage = {
    entity,
    ...Labels,
  };
  const config = {
    ...configPage,
    disableAdd: true,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {translate('Payments')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Track and manage payment records
            </Text>
          </div>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Total Payments')}
                  value={paymentStats?.totalPayments || 0}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<CreditCardOutlined style={{ color: '#8b45ff' }} />}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Total Amount')}
                  value={paymentStats?.totalAmount || 0}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<DollarOutlined style={{ color: '#10b981' }} />}
                  precision={2}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('This Month')}
                  value={paymentStats?.thisMonthAmount || 0}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<ArrowUpOutlined style={{ color: '#6366f1' }} />}
                  precision={2}
                />
              )}
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Avg Payment')}
                  value={paymentStats?.averageAmount || 0}
                  valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                  prefix={<DollarOutlined style={{ color: '#a855f7' }} />}
                  precision={2}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <PaymentDataTableModule
        config={config}
        extra={
          <>
            <Button
              type="primary"
              icon={<SafetyOutlined />}
              onClick={() => setFraudModalVisible(true)}
              style={{ marginRight: 8, backgroundColor: '#8b45ff', borderColor: '#8b45ff' }}
            >
              {translate('AI Suggestions')}
            </Button>
            <DataImportButton
              moduleName="payment"
              onImportComplete={(result) => {
                dispatch(erp.list({ entity: 'payment' }));
              }}
            />
          </>
        }
      />

      {/* Fraud Detection Modal */}
      <FraudDetectionModal
        visible={fraudModalVisible}
        onCancel={() => setFraudModalVisible(false)}
        invoices={invoices}
      />
    </div>
  );
}
