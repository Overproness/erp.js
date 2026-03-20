import { Spin } from 'antd';
import useLanguage from '@/locale/useLanguage';

export default function CustomerPreviewCard({
  isLoading = false,
  activeCustomer = 0,
  newCustomer = 0,
}) {
  const translate = useLanguage();
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '24px',
        height: '100%',
        minHeight: '580px',
        color: '#262626',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        maxWidth: '30%',
      }}
    >
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#262626',
            marginBottom: '4px',
          }}
        >
          {translate('Customers')}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#8c8c8c',
          }}
        >
          Customer analytics
        </div>
      </div>

      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
          }}
        >
          <Spin />
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '30px',
              padding: '30px 20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#6366f1',
                marginBottom: '8px',
              }}
            >
              {activeCustomer}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#8c8c8c',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {translate('Active Customers')}
            </div>
          </div>

          <div
            style={{
              textAlign: 'center',
              padding: '30px 20px',
              background: '#f8f9fa',
              borderRadius: '12px',
              border: '1px solid #f0f0f0',
            }}
          >
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color: '#10b981',
                marginBottom: '8px',
              }}
            >
              {newCustomer}
            </div>
            <div
              style={{
                fontSize: '12px',
                color: '#8c8c8c',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {translate('New This Month')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
