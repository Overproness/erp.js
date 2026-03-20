import { useEffect, useState } from 'react';

import useLanguage from '@/locale/useLanguage';
import { ExperimentOutlined } from '@ant-design/icons';
import { Button, Col, Row, Space, Typography } from 'antd';

import { useMoney } from '@/settings';

import useFetch from '@/hooks/useFetch';
import useOnFetch from '@/hooks/useOnFetch';
import {
  useClientStats,
  useDashboardStats,
  useInvoiceStats,
  usePaymentStats,
  useQuoteStats,
} from '@/hooks/useStatistics';
import { request } from '@/request';

import { selectCurrentAdmin } from '@/redux/auth/selectors';

import PreviewCard from './components/PreviewCard';
import SummaryCard from './components/SummaryCard';

import { N8N_URL } from '@/config/serverApiConfig';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
const { Title, Text } = Typography;

export default function DashboardModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);

  const currentAdmin = useSelector(selectCurrentAdmin);

  // Use the statistics hooks for real-time data
  const {
    data: dashboardStats,
    loading: dashboardLoading,
    refresh: refreshDashboard,
  } = useDashboardStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 60000, // refresh every minute
  });

  const {
    data: clientStats,
    loading: clientLoading,
    refresh: refreshClients,
  } = useClientStats({
    timeframe: '30',
  });

  const {
    data: invoiceStats,
    loading: invoiceLoading,
    refresh: refreshInvoices,
  } = useInvoiceStats({
    timeframe: '30',
  });

  const {
    data: quoteStats,
    loading: quoteLoading,
    refresh: refreshQuotes,
  } = useQuoteStats({
    timeframe: '30',
  });

  const {
    data: paymentStats,
    loading: paymentLoading,
    refresh: refreshPayments,
  } = usePaymentStats({
    timeframe: '30',
  });

  // Legacy API calls (keeping for backward compatibility during transition)
  const getStatsData = async ({ entity, currency }) => {
    return await request.summary({
      entity,
      options: { currency },
    });
  };

  const {
    result: invoiceResult,
    isLoading: invoiceResultLoading,
    onFetch: fetchInvoicesStats,
  } = useOnFetch();

  const {
    result: quoteResult,
    isLoading: quoteResultLoading,
    onFetch: fetchQuotesStats,
  } = useOnFetch();

  const {
    result: paymentResult,
    isLoading: paymentResultLoading,
    onFetch: fetchPayemntsStats,
  } = useOnFetch();

  const { result: clientResult, isLoading: clientResultLoading } = useFetch(() =>
    request.summary({ entity: 'client' })
  );

  useEffect(() => {
    const currency = money_format_settings?.currency_code || 'JPY';

    if (currency) {
      // Keep legacy calls for backward compatibility during transition
      fetchInvoicesStats(getStatsData({ entity: 'invoice', currency }));
      fetchQuotesStats(getStatsData({ entity: 'quote', currency }));
      fetchPayemntsStats(getStatsData({ entity: 'payment', currency }));

      // Refresh new statistics
      refreshDashboard();
      refreshClients();
      refreshInvoices();
      refreshQuotes();
      refreshPayments();
    }
  }, [money_format_settings.currency_code]);

  // Determine loading states (combine legacy and new)
  const isInvoicesLoading = invoiceLoading || invoiceResultLoading;
  const isQuotesLoading = quoteLoading || quoteResultLoading;
  const isPaymentsLoading = paymentLoading || paymentResultLoading;
  const isClientsLoading = clientLoading || clientResultLoading;

  // Get statistical data (prioritize new API, fallback to legacy)
  const getInvoiceData = () => {
    if (invoiceStats?.invoices) {
      return {
        total: invoiceStats.invoices.totalAmount || 0,
        totalCount: invoiceStats.invoices.total || 0,
        thisMonth: invoiceStats.invoices.thisMonth || 0,
        unpaid: invoiceStats.invoices.unpaid?.total || 0,
      };
    }
    return {
      total: invoiceResult?.total || 0,
      totalCount: invoiceResult?.total || 0,
      thisMonth: invoiceResult?.total || 0,
      unpaid: invoiceResult?.total_undue || 0,
    };
  };

  const getQuoteData = () => {
    if (quoteStats?.quotes) {
      return {
        total: quoteStats.quotes.totalAmount || 0,
        totalCount: quoteStats.quotes.total || 0,
        thisMonth: quoteStats.quotes.thisMonth || 0,
      };
    }
    return {
      total: quoteResult?.total || 0,
      totalCount: quoteResult?.total || 0,
      thisMonth: quoteResult?.total || 0,
    };
  };

  const getPaymentData = () => {
    if (paymentStats?.payments) {
      return {
        total: paymentStats.payments.totalAmount || 0,
        totalCount: paymentStats.payments.total || 0,
        thisMonth: paymentStats.payments.thisMonth?.total || 0,
      };
    }
    return {
      total: paymentResult?.total || 0,
      totalCount: paymentResult?.total || 0,
      thisMonth: paymentResult?.total || 0,
    };
  };

  const getClientData = () => {
    if (clientStats?.clients) {
      return {
        active: clientStats.clients.active || 0,
        new: clientStats.clients.newThisMonth || 0,
        total: clientStats.clients.total || 0,
      };
    }
    return {
      active: clientResult?.active || 0,
      new: clientResult?.new || 0,
      total: clientResult?.total || 0,
    };
  };

  const invoiceData = getInvoiceData();
  const quoteData = getQuoteData();
  const paymentData = getPaymentData();
  const clientData = getClientData();

  const dataTableColumns = [
    {
      title: translate('number'),
      dataIndex: 'number',
    },
    {
      title: translate('Client'),
      dataIndex: ['client', 'name'],
    },
    {
      title: translate('Total'),
      dataIndex: 'total',
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
    },
  ];

  const entityData = [
    {
      result: invoiceStats?.invoices || invoiceResult,
      isLoading: isInvoicesLoading,
      entity: 'invoice',
      title: translate('Invoices'),
      stats: invoiceStats?.invoices,
    },
    {
      result: quoteStats?.quotes || quoteResult,
      isLoading: isQuotesLoading,
      entity: 'quote',
      title: translate('quote'),
      stats: quoteStats?.quotes,
    },
  ];

  // Helper function to get status colors
  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending: 'warning',
      paid: 'success',
      unpaid: 'error',
      partially: 'processing',
      overdue: 'error',
      sent: 'processing',
      accepted: 'success',
      declined: 'error',
      expired: 'default',
    };
    return colors[status] || 'blue';
  };

  // Track filter per entity
  const [activeFilters, setActiveFilters] = useState({ invoice: null, quote: null });

  // Improved filter handler
  const handleFilter = (entity, status) => {
    setActiveFilters((prev) => ({
      ...prev,
      [entity]: prev[entity] === status ? null : status,
    }));
  };

  const statisticCards = entityData.map((data, index) => {
    const { result, entity, isLoading, title, stats } = data;
    // Enhanced statistics for new API data

    const enhancedStats =
      result?.performance?.map((item, idx) => ({
        tag: item?.status,
        color: getStatusColor(item?.status),
        value: item?.count,
        amount: item?.total,
      })) || [];

    console.log(enhancedStats);

    return (
      <PreviewCard
        key={index}
        title={title}
        isLoading={isLoading}
        entity={entity}
        statistics={enhancedStats}
        totalCount={result?.count}
        onFilter={handleFilter}
        activeFilter={activeFilters[entity]}
      />
    );
  });

  if (money_format_settings) {
    return (
      <div style={{ backgroundColor: '#fafbfc', minHeight: '100vh' }}>
        {/* Header */}
        <div
          style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#2c2c2c', fontWeight: '700' }}>
              {`Welcome Back, ${currentAdmin?.name} ${currentAdmin?.surname}`}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Here's what's happening with your business today.
            </Text>
          </div>

          <Space>
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              onClick={() => {
                const companyId = currentAdmin?._id;
                if (companyId) {
                  window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
                }
              }}
              style={{
                backgroundColor: '#7ED957',
                borderColor: '#7ED957',
                color: '#fff',
              }}
            >
              WorkFlow Module
            </Button>
          </Space>
        </div>

        {/* Statistics Cards Row */}
        {/* <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title="Total Revenue"
              prefix={translate('This month')}
              isLoading={dashboardLoading}
              data={
                dashboardStats?.invoices?.thisMonthAmount ||
                dashboardStats?.invoices?.totalAmount ||
                0
              }
              trend="up"
              showError={!dashboardLoading && !dashboardStats}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title="Total Profit"
              prefix={translate('This month')}
              isLoading={dashboardLoading}
              data={
                dashboardStats?.payments?.thisMonth?.total ||
                dashboardStats?.payments?.totalAmount ||
                0
              }
              trend="up"
              showError={!dashboardLoading && !dashboardStats}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title="Total Invoices"
              prefix={translate('This month')}
              isLoading={dashboardLoading}
              data={dashboardStats?.invoices?.thisMonth || dashboardStats?.invoices?.total || 0}
              isRawNumber={true}
              trend="up"
              showError={!dashboardLoading && !dashboardStats}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title="Total Clients"
              prefix={translate('This month')}
              isLoading={dashboardLoading}
              data={dashboardStats?.clients?.newThisMonth || dashboardStats?.clients?.total || 0}
              isRawNumber={true}
              trend="up"
              showError={!dashboardLoading && !dashboardStats}
            />
          </Col>
        </Row> */}

        {/* Original Statistics Cards Row */}
        <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title={translate('Invoices')}
              prefix={translate('This month')}
              isLoading={isInvoicesLoading}
              data={invoiceData.total}
              subtitle={`${invoiceData.totalCount} ${translate('invoices')}`}
              trend={invoiceData.thisMonth > 0 ? 'up' : 'stable'}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title={translate('Quote')}
              prefix={translate('This month')}
              isLoading={isQuotesLoading}
              data={quoteData.total}
              subtitle={`${quoteData.totalCount} ${translate('quotes')}`}
              trend={quoteData.thisMonth > 0 ? 'up' : 'stable'}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title={translate('paid')}
              prefix={translate('This month')}
              isLoading={isPaymentsLoading}
              data={paymentData.total}
              subtitle={`${paymentData.totalCount} ${translate('payments')}`}
              trend={paymentData.thisMonth > 0 ? 'up' : 'stable'}
            />
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <SummaryCard
              title={translate('Unpaid')}
              prefix={translate('Outstanding')}
              isLoading={isInvoicesLoading}
              data={invoiceData.unpaid}
              subtitle={`${translate('amount due')}`}
              trend={'down'} // We want unpaid to go down
              showWarning={invoiceData.unpaid > 0}
            />
          </Col>
        </Row>

        {/* Growth Statistics Row */}
        {dashboardStats && (
          <Row gutter={[12, 12]} style={{ marginBottom: '20px' }}>
            <Col xs={24} sm={6} lg={6}>
              <SummaryCard
                title="Revenue Growth"
                prefix="This month"
                isLoading={dashboardLoading}
                data={dashboardStats.performance?.conversionRate || 0}
                isPercentage={true}
                trend={dashboardStats.performance?.conversionRate > 0 ? 'up' : 'stable'}
              />
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <SummaryCard
                title="Payment Efficiency"
                prefix="This month"
                isLoading={dashboardLoading}
                data={dashboardStats.performance?.paymentEfficiency || 0}
                isPercentage={true}
                trend={
                  dashboardStats.performance?.paymentEfficiency > 50
                    ? 'up'
                    : dashboardStats.performance?.paymentEfficiency > 25
                      ? 'stable'
                      : 'down'
                }
              />
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <SummaryCard
                title="Avg Invoice Value"
                prefix="Per invoice"
                isLoading={dashboardLoading}
                data={dashboardStats.performance?.averageInvoiceValue || 0}
                trend="stable"
              />
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <SummaryCard
                title="Avg Quote Value"
                prefix="Per quote"
                isLoading={dashboardLoading}
                data={dashboardStats.performance?.averageQuoteValue || 0}
                trend="stable"
              />
            </Col>
          </Row>
        )}

        {/* Performance Overview and Preview Cards - Full Width */}
        <Row gutter={[20, 20]} style={{ marginBottom: '24px', height: '440px' }}>
          {statisticCards}
        </Row>
        {/* Customer Preview Card moved below */}
        {/* <Row gutter={[20, 20]} style={{ marginBottom: '24px' }}>
          <Col xs={24} lg={24}>
            <CustomerPreviewCard
              isLoading={isClientsLoading}
              activeCustomer={clientData.active}
              newCustomer={clientData.new}
              totalCustomers={clientData.total}
              stats={clientStats?.clients}
            />
          </Col>
        </Row> */}
        {/* Recent Tables - filtered by status if set */}
        {/* <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <div
              style={{
                background: '#fff',
                border: '1px solid #7ED957',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  borderBottom: '2px solid #f0f0f0',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#262626',
                    marginBottom: '4px',
                  }}
                >
                  {translate('Recent Invoices')}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#8c8c8c',
                  }}
                >
                  Latest invoice activity
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                <RecentTable
                  entity={'invoice'}
                  dataTableColumns={dataTableColumns}
                  statusFilter={activeFilters.invoice}
                />
              </div>
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div
              style={{
                background: '#fff',
                border: '1px solid #7ED957',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                minHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  borderBottom: '2px solid #f0f0f0',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#262626',
                    marginBottom: '4px',
                  }}
                >
                  {translate('Recent Quotes')}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#8c8c8c',
                  }}
                >
                  Latest quote activity
                </div>
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: 'hidden',
                }}
              >
                <RecentTable
                  entity={'quote'}
                  dataTableColumns={dataTableColumns}
                  statusFilter={activeFilters.quote}
                />
              </div>
            </div>
          </Col>
        </Row> */}
      </div>
    );
  } else {
    return <></>;
  }
}
