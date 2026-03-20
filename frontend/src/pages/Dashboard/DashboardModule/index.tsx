import { useEffect, useState } from 'react';

import useLanguage from '@/locale/useLanguage';
import { Col, Row, Spin } from 'antd';

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

import { N8N_URL } from '@/config/serverApiConfig';
import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function DashboardModule() {
  const translate = useLanguage();
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);
  const navigate = useNavigate();

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
    const today = new Date();
    const dateString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // KPI card component
    const KpiCard = ({ title, value, subtitle, icon, loading, color = '#0058c3' }) => (
      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s ease',
          cursor: 'default',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#71767f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color }}>{icon}</span>
          </div>
        </div>
        {loading ? (
          <Spin size="small" />
        ) : (
          <>
            <span style={{ fontSize: '28px', fontWeight: 700, color: '#191c1d', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: '12px', color: '#71767f' }}>{subtitle}</span>
          </>
        )}
      </div>
    );

    return (
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
        {/* Header */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px 0', color: '#191c1d', fontWeight: 700, fontSize: '24px', letterSpacing: '-0.02em' }}>
              System Overview
            </h1>
            <p style={{ margin: 0, color: '#71767f', fontSize: '14px' }}>
              {dateString}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                refreshDashboard();
                refreshClients();
                refreshInvoices();
                refreshQuotes();
                refreshPayments();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                borderRadius: '10px', border: '1.5px solid #e1e3e4', background: '#ffffff',
                color: '#414754', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s ease', fontFamily: "'Inter', -apple-system, sans-serif",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0058c3'; e.currentTarget.style.color = '#0058c3'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e1e3e4'; e.currentTarget.style.color = '#414754'; }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
              Refresh
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              title="Total Invoices"
              value={moneyFormatter({ amount: invoiceData.total, currency_code: money_format_settings.currency_code })}
              subtitle={`${invoiceData.totalCount} invoices this period`}
              icon="receipt_long"
              loading={isInvoicesLoading}
              color="#0058c3"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              title="Pending Quotes"
              value={moneyFormatter({ amount: quoteData.total, currency_code: money_format_settings.currency_code })}
              subtitle={`${quoteData.totalCount} quotes pending`}
              icon="request_quote"
              loading={isQuotesLoading}
              color="#f59e0b"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              title="Net Revenue"
              value={moneyFormatter({ amount: paymentData.total, currency_code: money_format_settings.currency_code })}
              subtitle={`${paymentData.totalCount} payments received`}
              icon="trending_up"
              loading={isPaymentsLoading}
              color="#10b981"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KpiCard
              title="Active Clients"
              value={clientData.total?.toLocaleString() || '0'}
              subtitle={`${clientData.new} new this month`}
              icon="group"
              loading={isClientsLoading}
              color="#8b5cf6"
            />
          </Col>
        </Row>

        {/* Growth Stats Row */}
        {dashboardStats && (
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <KpiCard
                title="Revenue Growth"
                value={`${(dashboardStats.performance?.conversionRate || 0).toFixed(1)}%`}
                subtitle="Conversion rate this month"
                icon="show_chart"
                loading={dashboardLoading}
                color="#0058c3"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <KpiCard
                title="Payment Efficiency"
                value={`${(dashboardStats.performance?.paymentEfficiency || 0).toFixed(1)}%`}
                subtitle="Collection rate"
                icon="speed"
                loading={dashboardLoading}
                color="#10b981"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <KpiCard
                title="Avg Invoice Value"
                value={moneyFormatter({ amount: dashboardStats.performance?.averageInvoiceValue || 0, currency_code: money_format_settings.currency_code })}
                subtitle="Per invoice average"
                icon="calculate"
                loading={dashboardLoading}
                color="#f59e0b"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <KpiCard
                title="Unpaid Amount"
                value={moneyFormatter({ amount: invoiceData.unpaid, currency_code: money_format_settings.currency_code })}
                subtitle="Outstanding balance"
                icon="warning"
                loading={isInvoicesLoading}
                color="#ef4444"
              />
            </Col>
          </Row>
        )}

        {/* Preview Cards + N8N CTA */}
        <Row gutter={[20, 20]} style={{ marginBottom: '24px' }}>
          {statisticCards}
        </Row>

        {/* N8N Workflow CTA Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0058c3 0%, #0070f3 50%, #38bdf8 100%)',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            color: '#ffffff',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>
              N8N Workflow Automation
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.85)', maxWidth: '500px' }}>
              Automate your business processes with powerful N8N workflows. Connect invoicing, CRM, and marketing in one seamless pipeline.
            </p>
          </div>
          <button
            onClick={() => {
              const companyId = currentAdmin?._id;
              if (companyId) {
                window.open(`http://n8n-${companyId}.${N8N_URL}`, '_blank');
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
              borderRadius: '12px', border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)',
              color: '#ffffff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              backdropFilter: 'blur(10px)', transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>bolt</span>
            Open Workflows
          </button>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', right: '80px', bottom: '-60px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        </div>

        {/* Quick Actions */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <div
              onClick={() => navigate('/invoice/create')}
              style={{
                background: '#ffffff', borderRadius: '14px', padding: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '14px', transition: 'box-shadow 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#0058c314', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#0058c3' }}>add_circle</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#191c1d' }}>New Invoice</span>
                <span style={{ fontSize: '12px', color: '#71767f' }}>Create a new invoice</span>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              onClick={() => navigate('/client/create')}
              style={{
                background: '#ffffff', borderRadius: '14px', padding: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '14px', transition: 'box-shadow 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#8b5cf614', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#8b5cf6' }}>person_add</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#191c1d' }}>Add Client</span>
                <span style={{ fontSize: '12px', color: '#71767f' }}>Register a new client</span>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div
              onClick={() => navigate('/quote/create')}
              style={{
                background: '#ffffff', borderRadius: '14px', padding: '20px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '14px', transition: 'box-shadow 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f59e0b14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#f59e0b' }}>edit_note</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#191c1d' }}>Create Quote</span>
                <span style={{ fontSize: '12px', color: '#71767f' }}>Draft a new quote</span>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  } else {
    return <></>;
  }
}
