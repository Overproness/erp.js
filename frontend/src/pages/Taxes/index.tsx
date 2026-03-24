import { crud } from '@/redux/crud/actions';
import { selectCreatedItem } from '@/redux/crud/selectors';
import {
  CalculatorOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useTaxStats } from '@/hooks/useStatistics';
import useLanguage from '@/locale/useLanguage';

import { DataImportButton } from '@/components/DataEntry';
import TaxForm from '@/forms/TaxForm';
import CrudModule from '@/pages/CrudModule/CrudModule';
import { erp } from '@/redux/erp/actions';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { Switch } from 'antd';

const { Title, Text } = Typography;

export default function Taxes() {
  const translate = useLanguage();
  const dispatch = useDispatch();
  const { isLoading, isSuccess } = useSelector(selectCreatedItem);
  const entity = 'taxes';
  const loadedRef = useRef(false);

  // Use dynamic statistics from API
  const {
    data: taxStats,
    loading: statsLoading,
    error: statsError,
  } = useTaxStats({
    timeframe: '30',
    autoRefresh: true,
    refreshInterval: 300000, // 5 minutes
  });

  // Calculate stats from API data
  const stats = {
    totalTaxes: taxStats?.totalTaxes || 0,
    activeTaxes: taxStats?.activeTaxes || 0,
    defaultTax: taxStats?.defaultTax || 0,
    averageRate: taxStats?.averageRate || 0,
  };

  // Load taxes on component mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    dispatch(crud.list({ entity }));
  }, []);

  // Reset create action when creation is successful
  useEffect(() => {
    if (isSuccess) {
      dispatch(crud.resetAction({ actionType: 'create' }));
    }
  }, [isSuccess]);

  const searchConfig = {
    displayLabels: ['name'],
    searchFields: 'name',
    outputValue: '_id',
  };

  const deleteModalLabels = ['name'];

  const readColumns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PercentageOutlined style={{ color: '#8b45ff' }} />
          <span style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Tax Value'),
      dataIndex: 'taxValue',
      render: (value) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{value}</span>,
    },
    {
      title: translate('Tax Rate'),
      dataIndex: 'taxRate',
      render: (rate) => <span style={{ fontWeight: '600', color: '#52c41a' }}>{rate}%</span>,
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
    PANEL_TITLE: translate('taxes'),
    DATATABLE_TITLE: translate('taxes_list'),
    ADD_NEW_ENTITY: translate('add_new_tax'),
    ENTITY_NAME: translate('tax'),
  };

  const configPage = {
    entity,
    ...Labels,
  };

  const config = {
    ...configPage,
    readColumns,
    dataTableColumns,
    searchConfig,
    deleteModalLabels,
    extra: (
      <DataImportButton
        moduleName="taxes"
        onImportComplete={(result) => {
          dispatch(erp.list({ entity: 'taxes' }));
        }}
      />
    ),
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
              {translate('Tax Management')}
            </Title>
            <Text style={{ color: '#6b7280', fontSize: '16px' }}>
              Configure tax rates and settings for your business
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
                  title={translate('Total Taxes')}
                  value={stats.totalTaxes}
                  valueStyle={{ color: '#8b45ff', fontWeight: '700' }}
                  prefix={<CalculatorOutlined style={{ color: '#8b45ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Active')}
                  value={stats.activeTaxes}
                  valueStyle={{ color: '#10b981', fontWeight: '700' }}
                  prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Default')}
                  value={stats.defaultTax}
                  valueStyle={{ color: '#6366f1', fontWeight: '700' }}
                  prefix={<SettingOutlined style={{ color: '#6366f1' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6} lg={6}>
              <Card>
                <Statistic
                  title={translate('Avg Rate')}
                  value={`${stats.averageRate}%`}
                  valueStyle={{ color: '#a855f7', fontWeight: '700' }}
                  prefix={<PercentageOutlined style={{ color: '#a855f7' }} />}
                />
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Main Content */}
      <CrudModule
        createForm={<TaxForm />}
        updateForm={<TaxForm isUpdateForm={true} />}
        config={config}
      />
    </div>
  );
}
