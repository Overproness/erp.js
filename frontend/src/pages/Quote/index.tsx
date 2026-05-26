import { DataImportButton } from '@/components/DataEntry';
import { useQuoteStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';
import { erp } from '@/redux/erp/actions';
import { useDate, useMoney } from '@/settings';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic, Tag, Typography } from '@/components/ui';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import QuoteDataTableModule from './QuoteModule/QuoteDataTableModule';

const { Title, Text } = Typography;

export default function Quote() {
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'quote';
  const { moneyFormatter } = useMoney();
  const dispatch = useDispatch();

  // Use dynamic statistics from API
  const {
    data: quoteStats,
    loading: statsLoading,
    error: statsError,
  } = useQuoteStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name',
  };

  const deleteModalLabels = ['number', 'client.name'];

  const dataTableColumns = [
    {
      title: translate('Number'),
      dataIndex: 'number',
      render: (text) => (
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
      title: translate('Sub Total'),
      dataIndex: 'subTotal',
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
      title: translate('Status'),
      dataIndex: 'status',
      render: (status) => {
        const statusConfig = {
          draft: { color: '#faad14', text: 'Draft' },
          sent: { color: '#1890ff', text: 'Sent' },
          approved: { color: '#52c41a', text: 'Approved' },
          rejected: { color: '#ff4d4f', text: 'Rejected' },
          expired: { color: '#8c8c8c', text: 'Expired' },
        };
        const config = statusConfig[status] || statusConfig.draft;
        return (
          <Tag color={config.color} style={{ borderRadius: '6px', fontWeight: '500' }}>
            {translate(config.text)}
          </Tag>
        );
      },
    },
  ];

  const config = {
    entity,
    PANEL_TITLE: translate('Quote'),
    DATATABLE_TITLE: translate('Quote List'),
    ADD_NEW_ENTITY: translate('Add New Quote'),
    ENTITY_NAME: translate('Quote'),
    CREATE_ENTITY: translate('Create Quote'),
    UPDATE_ENTITY: translate('Update Quote'),
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
              {translate('Quotes')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Create and manage your quotations and estimates
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
                  title={translate('Total Quotes')}
                  value={quoteStats?.totalQuotes || 0}
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
                  title={translate('Pending')}
                  value={quoteStats?.pending?.count || 0}
                  valueStyle={{ color: '#f59e0b', fontWeight: '700' }}
                  prefix={<ClockCircleOutlined style={{ color: '#f59e0b' }} />}
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
                  title={translate('Accepted')}
                  value={quoteStats?.accepted?.count || 0}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
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
                  title={translate('Total Value')}
                  value={quoteStats?.totalAmount || 0}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<DollarOutlined style={{ color: '#6366f1' }} />}
                  precision={2}
                />
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <QuoteDataTableModule
        config={config}
        extra={
          <DataImportButton
            moduleName="quote"
            onImportComplete={(result) => {
              dispatch(erp.list({ entity: 'quote' }));
            }}
          />
        }
      />
    </div>
  );
}
