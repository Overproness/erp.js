import {
  BankOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from '@/components/icons';
import { Card, Col, Row, Spin, Statistic, Typography } from '@/components/ui';
import { useDispatch } from 'react-redux';

import { usePaymentModeStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';

import { DataImportButton } from '@/components/DataEntry';
import { erp } from '@/redux/erp/actions';
import { CheckOutlined, CloseOutlined } from '@/components/icons';
import { Switch } from '@/components/ui';
import PaymentModeDataTableModule from './PaymentModeDataTableModule';

const { Title, Text } = Typography;

export default function PaymentMode() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const entity = 'paymentMode';

  // Use dynamic statistics from API
  const {
    data: paymentModeStats,
    loading: statsLoading,
    error: statsError,
  } = usePaymentModeStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Calculate stats from API data
  const stats = {
    totalModes: paymentModeStats?.totalPaymentModes || 0,
    activeModes: paymentModeStats?.activePaymentModes || 0,
    defaultModes: paymentModeStats?.defaultPaymentModes || 0,
    recentlyAdded: paymentModeStats?.newThisMonth || 0,
  };

  const searchConfig = {
    entity,
    displayLabels: ['name'],
    searchFields: 'name',
    outputValue: '_id',
  };

  const deleteModalLabels = ['name'];

  const readColumns = [
    {
      title: translate('Payment Mode'),
      dataIndex: 'name',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCardOutlined style={{ color: '#8b45ff' }} />
          <span style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Description'),
      dataIndex: 'description',
      render: (text) => <span style={{ color: '#6b7280', fontSize: '13px' }}>{text}</span>,
    },
    {
      title: translate('Default'),
      dataIndex: 'isDefault',
      render: (isDefault) => (
        <Switch
          checked={isDefault}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          disabled
        />
      ),
    },
    {
      title: translate('Enabled'),
      dataIndex: 'enabled',
      render: (enabled) => (
        <Switch
          checked={enabled}
          checkedChildren={<CheckOutlined />}
          unCheckedChildren={<CloseOutlined />}
          disabled
        />
      ),
    },
  ];
  const dataTableColumns = readColumns;

  const Labels = {
    PANEL_TITLE: translate('payment_mode'),
    DATATABLE_TITLE: translate('payment_mode_list'),
    ADD_NEW_ENTITY: translate('add_new_payment_mode'),
    ENTITY_NAME: translate('payment_mode'),
  };

  const configPage = {
    entity,
    routePath: '/payment/mode',
    ...Labels,
  };
  const config = {
    ...configPage,
    disableDownload: true,
    readColumns,
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
              {translate('Payment Methods')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Configure and manage payment methods for your business
            </Text>
          </div>
        </div>

        {/* Statistics Cards */}
        {statsLoading ? (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center', padding: '20px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px', color: '#6b7280' }}>
                  {translate('Loading statistics...')}
                </div>
              </Card>
            </Col>
          </Row>
        ) : statsError ? (
          <Row gutter={[12, 12]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center', padding: '20px', borderColor: '#f5222d' }}>
                <div style={{ color: '#f5222d', marginBottom: '8px' }}>
                  {translate('Error loading statistics')}
                </div>
                <div style={{ color: '#6b7280', fontSize: '14px' }}>{statsError}</div>
              </Card>
            </Col>
          </Row>
        ) : (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Total Methods')}
                  value={stats.totalModes}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<BankOutlined style={{ color: '#8b45ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Active')}
                  value={stats.activeModes}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Default')}
                  value={stats.defaultModes}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<SettingOutlined style={{ color: '#6366f1' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Recent')}
                  value={stats.recentlyAdded}
                  valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                  prefix={<CreditCardOutlined style={{ color: '#a855f7' }} />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Main Content */}

      <PaymentModeDataTableModule
        config={config}
        extra={
          <DataImportButton
            moduleName="paymentMode"
            onImportComplete={(result) => {
              dispatch(erp.list({ entity: 'paymentMode' }));
            }}
          />
        }
      />
    </div>
  );
}
