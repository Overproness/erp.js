import { selectMoneyFormat } from '@/redux/settings/selectors';
import { useMoney } from '@/settings';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ExclamationCircleOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { Spin, Tooltip } from 'antd';
import { useSelector } from 'react-redux';

export default function SummaryCard({
  title,
  tagColor,
  data,
  isLoading = false,
  trend = 'stable',
  showWarning = false,
  error,
  onClick,
  isPercentage = false,
  isRawNumber = false,
}) {
  const { moneyFormatter } = useMoney();
  const money_format_settings = useSelector(selectMoneyFormat);

  const safeData = data !== undefined && data !== null ? data : 0;
  const currencyCode = money_format_settings?.currency_code || 'JPY';

  // Get value colors based on title and value
  const getValueColor = (title) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('unpaid')) return '#aa3537ff'; // Red for unpaid/negative
    if (safeData < 0) return '#aa3537ff'; // Red for negative values
    return '#4d7f37ff'; // Green for positive/neutral
  };

  // Get trend icon and color
  const getTrendIcon = () => {
    const iconStyle = { marginLeft: '8px', fontSize: '12px' };
    switch (trend) {
      case 'up':
        return (
          <span style={{ ...iconStyle, color: '#4d7f37ff' }}>
            <ArrowUpOutlined />
          </span>
        );
      case 'down':
        return (
          <span style={{ ...iconStyle, color: '#aa3537ff' }}>
            <ArrowDownOutlined />
          </span>
        );
      default:
        return (
          <span style={{ ...iconStyle, color: '#8c8c8c' }}>
            <MinusOutlined />
          </span>
        );
    }
  };

  const getWarningIcon = () => {
    if (showWarning) {
      return (
        <Tooltip title="Attention required">
          <span
            style={{
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ExclamationCircleOutlined
              style={{
                color: '#faad14',
                fontSize: '14px',
                animation: 'pulse 2s infinite',
              }}
            />
          </span>
        </Tooltip>
      );
    }
    return null;
  };

  // Handle error state
  if (error) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid #ff4d4f',
          borderRadius: '12px',
          padding: '16px',
          height: '120px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          color: '#ff4d4f',
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 600, textAlign: 'center' }}>
          {typeof error === 'string' ? error : 'Failed to load data'}
        </div>
      </div>
    );
  }

  const valueColor = getValueColor(title);

  // Subtitle logic based on title
  const getSubtitle = (title) => {
    const t = title.toLowerCase();
    if (t.includes('invoice')) return 'This month invoices';
    if (t.includes('quote')) return 'This month quotes';
    if (t.includes('paid')) return 'This month payments';
    if (t.includes('unpaid')) return 'Amount due';
    if (t.includes('revenue growth')) return 'This month';
    if (t.includes('payment efficiency')) return 'This month';
    if (t.includes('avg invoice value')) return 'Per invoice';
    if (t.includes('avg quote value')) return 'Per quote';
    return 'This month outstanding';
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        height: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0px)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
      }}
    >
      {/* Title above */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: '#2d2d2dff',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          textAlign: 'left',
        }}
      >
        {title}
      </div>
      {/* Big bold number */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {isLoading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '40px',
              width: '100%',
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <div
            className='dashboard-number'
            style={{
              fontSize: '32px',
              fontWeight: 500,
              color: valueColor,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {(() => {
              try {
                // Handle percentage formatting
                if (isPercentage) {
                  const sign = safeData > 0 ? '+' : safeData < 0 ? '' : '';
                  return `${sign}${safeData}%`;
                }

                // Handle raw number formatting
                if (isRawNumber) {
                  return safeData.toLocaleString();
                }

                // Simple fallback formatting if moneyFormatter fails
                if (!moneyFormatter || typeof moneyFormatter !== 'function') {
                  const symbol = currencyCode === 'JPY' ? '¥' : '$';
                  return `${symbol}${safeData.toLocaleString()}`;
                }

                const formattedValue = moneyFormatter({
                  amount: safeData,
                  currency_code: currencyCode,
                });

                // Ensure we return a string
                if (typeof formattedValue === 'string') {
                  return formattedValue;
                } else if (formattedValue && typeof formattedValue.format === 'function') {
                  // If it's a currency object, call format
                  return formattedValue.format();
                } else {
                  // Fallback to string conversion
                  return String(formattedValue);
                }
              } catch (error) {
                console.error('Money formatter error:', error);
                // Fallback formatting
                if (isPercentage) {
                  const sign = safeData > 0 ? '+' : safeData < 0 ? '' : '';
                  return `${sign}${safeData}%`;
                }
                if (isRawNumber) {
                  return safeData.toLocaleString();
                }
                const symbol = currencyCode === 'JPY' ? '¥' : '$';
                return `${symbol}${safeData.toLocaleString()}`;
              }
            })()}
            {getTrendIcon()}
            {getWarningIcon()}
          </div>
        )}
      </div>
      {/* Subtitle contextually relevant */}
      <div
        style={{
          fontSize: '11px',
          color: '#8c8c8c',
          marginTop: '8px',
          textAlign: 'left',
        }}
      >
        {getSubtitle(title)}
      </div>
    </div>
  );
}

SummaryCard.getUsedCurrency = (money_format_settings) => {
  return money_format_settings?.currency_code || 'JPY';
};
