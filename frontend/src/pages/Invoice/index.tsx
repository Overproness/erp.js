import { DataImportButton } from '@/components/DataEntry';
import { useInvoiceStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { useDate, useMoney } from '@/settings';
import {
  CalendarOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import InvoiceDataTableModule from './InvoiceModule/InvoiceDataTableModule';

const { Title, Text } = Typography;

export default function Invoice() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const { moneyFormatter } = useMoney();
  const dispatch = useDispatch();

  // Use dynamic statistics from API
  const {
    data: invoiceStats,
    loading: statsLoading,
    error: statsError,
  } = useInvoiceStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined style={{ color: '#8b45ff' }} />
          <span style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
      render: (text) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{text}</span>,
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
      title: translate('expired Date'),
      dataIndex: 'expiredDate',
      render: (date) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarOutlined style={{ color: '#6b7280', fontSize: '12px' }} />
          <span style={{ fontSize: '13px' }}>{dayjs(date).format(dateFormat)}</span>
        </div>
      ),
    },
    {
      title: translate('Total'),
      dataIndex: 'total',
      onCell: () => ({
        style: {
          textAlign: 'right',
          whiteSpace: 'nowrap',
          direction: 'ltr',
        },
      }),
      render: (total, record) => (
        <span style={{ fontWeight: '600', color: '#2c2c2c' }}>
          {moneyFormatter({ amount: total, currency_code: record.currency })}
        </span>
      ),
    },
    {
      title: translate('paid'),
      dataIndex: 'credit',
      onCell: () => {
        return {
          style: {
            textAlign: 'right',
            whiteSpace: 'nowrap',
            direction: 'ltr',
          },
        };
      },
      render: (total, record) => moneyFormatter({ amount: total, currency_code: record.currency }),
    },
    {
      title: translate('Status'),
      dataIndex: 'status',
      render: (status) => {
        const statusConfig = {
          draft: { color: '#faad14', text: 'Draft' },
          sent: { color: '#1890ff', text: 'Sent' },
          paid: { color: '#52c41a', text: 'Paid' },
          overdue: { color: '#ff4d4f', text: 'Overdue' },
        };
        const config = statusConfig[status] || statusConfig.draft;
        return (
          <Tag color={config.color} style={{ borderRadius: '6px', fontWeight: '500' }}>
            {translate(config.text)}
          </Tag>
        );
      },
    },
    {
      title: translate('Payment'),
      dataIndex: 'paymentStatus',
      render: (paymentStatus) => {
        const statusConfig = {
          pending: { color: '#faad14', text: 'Pending' },
          partial: { color: '#1890ff', text: 'Partial' },
          paid: { color: '#52c41a', text: 'Paid' },
          overdue: { color: '#ff4d4f', text: 'Overdue' },
        };
        const config = statusConfig[paymentStatus] || statusConfig.pending;
        return (
          <Tag color={config.color} style={{ borderRadius: '6px', fontWeight: '500' }}>
            {translate(config.text)}
          </Tag>
        );
      },
    },
  ];

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };

  const deleteModalLabels = ['number', 'client.name'];

  const config = {
    entity: 'invoice',
    PANEL_TITLE: translate('Invoice'),
    DATATABLE_TITLE: translate('Invoice List'),
    ADD_NEW_ENTITY: translate('Add New Invoice'),
    ENTITY_NAME: translate('invoice'),
    RECORD_ENTITY: translate('record_payment'),
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
            {translate('Invoices')}
          </Title>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            Manage your billing and invoice records
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              {statsLoading ? (
                <Spin />
              ) : (
                <Statistic
                  title={translate('Total Invoices')}
                  value={invoiceStats?.totalInvoices || 0}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<FileTextOutlined style={{ color: '#8b45ff' }} />}
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
                  value={invoiceStats?.totalAmount || 0}
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
                  title={translate('Unpaid Amount')}
                  value={invoiceStats?.unpaidTotal || 0}
                  valueStyle={{ color: '#f59e0b', fontWeight: '700' }}
                  prefix={<DollarOutlined style={{ color: '#f59e0b' }} />}
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
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {translate('Overdue')}
                      {(invoiceStats?.overdue?.count || 0) > 0 && (
                        <ExclamationCircleOutlined style={{ fontSize: '10px' }} />
                      )}
                    </span>
                  }
                  value={invoiceStats?.overdue?.count || 0}
                  valueStyle={{ color: '#ef4444', fontWeight: '700' }}
                  prefix={<CalendarOutlined style={{ color: '#ef4444' }} />}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      <InvoiceDataTableModule
        config={config}
        extra={
          <DataImportButton
            moduleName="invoice"
            onImportComplete={(result) => {
              // console.log('🚀 ~ Invoice ~ result:', result);
              dispatch(erp.list({ entity: 'invoice' }));
            }}
          />
        }
      />
    </div>
  );
}
