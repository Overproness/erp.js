import useLanguage from '@/locale/useLanguage';
import CustomerDataTableModule from './CustomerModule/CustomerDataTableModule';
import { useDate } from '@/settings';
import { crud } from '@/redux/crud/actions';
import { CrownOutlined, StarOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export default function Customer() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const translate = useLanguage();
  const { dateFormat } = useDate();
  const entity = 'client';

  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Get data from Redux store
  const { result: customers, isLoading, pagination } = useSelector((state) => state.crud.list);

  // Ensure customerList is always an array
  const customerList = Array.isArray(customers?.items) ? customers.items : [];

  useEffect(() => {
    // Add error handling and ensure the dispatch doesn't fail
    try {
      dispatch(crud.list({ entity: 'client' }));
    } catch (error) {
      console.error('Error dispatching crud.list:', error);
    }
  }, [dispatch]);

  const state = useSelector((state) => state.crud.list);

  const handleSearch = (value) => {
    setSearchText(value);
    dispatch(
      crud.list({
        entity: 'client',
        options: {
          page: 1,
          limit: pagination?.pageSize || 10,
          search: value || undefined,
        },
      })
    );
  };

  // Statistics data - use safe array version
  const safeCustomerList = Array.isArray(customerList) ? customerList : [];
  const totalCustomers = safeCustomerList.length;
  const activeCustomers = safeCustomerList.filter(
    (customer) => customer?.status === 'active' || customer?.enabled === true
  ).length;
  const recentCustomers = safeCustomerList.filter(
    (customer) => customer?.created && dayjs().diff(dayjs(customer.created), 'days') <= 30
  ).length;

  const dataTableColumns = [
    {
      title: translate('Name'),
      dataIndex: 'name',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserOutlined style={{ color: '#8b45ff' }} />
          <span style={{ fontWeight: '600', color: '#2c2c2c' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Email'),
      dataIndex: 'email',
      render: (text) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{text}</span>,
    },
    {
      title: translate('Phone'),
      dataIndex: 'phone',
      render: (text) => <span style={{ fontSize: '13px', color: '#6b7280' }}>{text}</span>,
    },
    {
      title: translate('Company'),
      dataIndex: 'company',
      render: (text) => <span style={{ fontSize: '13px', color: '#6b7280' }}>{text || 'N/A'}</span>,
    },
    {
      title: translate('Status'),
      dataIndex: 'enabled',
      render: (enabled) => {
        const config = enabled
          ? { color: '#52c41a', text: 'Active' }
          : { color: '#ff4d4f', text: 'Inactive' };
        return (
          <Tag color={config.color} style={{ borderRadius: '6px', fontWeight: '500' }}>
            {translate(config.text)}
          </Tag>
        );
      },
    },
    {
      title: translate('Created'),
      dataIndex: 'created',
      render: (date) => (
        <span style={{ fontSize: '13px', color: '#6b7280' }}>{dayjs(date).format(dateFormat)}</span>
      ),
    },
  ];

  const searchConfig = {
    entity: 'client',
    displayLabels: ['name'],
    searchFields: 'name,email',
  };

  const deleteModalLabels = ['name', 'email'];

  const config = {
    entity,
    PANEL_TITLE: translate('Customer'),
    DATATABLE_TITLE: translate('Customer List'),
    ADD_NEW_ENTITY: translate('Add New Customer'),
    ENTITY_NAME: translate('Customer'),
    CREATE_ENTITY: translate('Create Customer'),
    UPDATE_ENTITY: translate('Update Customer'),
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
            {translate('Customers')}
          </Title>
          <Text style={{ color: '#6b7280', fontSize: '16px' }}>
            Manage your customer relationships and contact information
          </Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Total Customers')}
                value={totalCustomers}
                valueStyle={{ color: '#8b45ff' }}
                prefix={<UserOutlined  />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('Active')}
                value={activeCustomers}
                valueStyle={{ color: '#52c41a' }}
                prefix={<TeamOutlined  />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('New This Month')}
                value={recentCustomers}
                valueStyle={{ color: '#faad14' }}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6} lg={6}>
            <Card>
              <Statistic
                title={translate('VIP Customers')}
                value={8}
                valueStyle={{ color: '#d48806' }}
                prefix={<CrownOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <CustomerDataTableModule config={config} />
    </div>
  );
}
