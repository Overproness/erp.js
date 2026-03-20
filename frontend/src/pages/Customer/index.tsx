import { DataImportButton } from '@/components/DataEntry';
import useLanguage from '@/locale/useLanguage';
import { crud } from '@/redux/crud/actions';
import { useDate } from '@/settings';
import { Col, Row, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CustomerDataTableModule from './CustomerModule/CustomerDataTableModule';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#0058c314',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#0058c3' }}
            >
              person
            </span>
          </div>
          <span style={{ fontWeight: 600, color: '#191c1d', fontSize: '13px' }}>{text}</span>
        </div>
      ),
    },
    {
      title: translate('Email'),
      dataIndex: 'email',
      render: (text) => (
        <span style={{ fontWeight: 500, color: '#414754', fontSize: '13px' }}>{text}</span>
      ),
    },
    {
      title: translate('Phone'),
      dataIndex: 'phone',
      render: (text) => <span style={{ fontSize: '13px', color: '#71767f' }}>{text}</span>,
    },
    {
      title: translate('Company'),
      dataIndex: 'company',
      render: (text) => <span style={{ fontSize: '13px', color: '#71767f' }}>{text || 'N/A'}</span>,
    },
    {
      title: translate('Status'),
      dataIndex: 'enabled',
      render: (enabled) => {
        return enabled ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#10b98114',
              color: '#10b981',
            }}
          >
            <span
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}
            />
            Active
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#ef444414',
              color: '#ef4444',
            }}
          >
            <span
              style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}
            />
            Inactive
          </span>
        );
      },
    },
    {
      title: translate('Created'),
      dataIndex: 'created',
      render: (date) => (
        <span style={{ fontSize: '13px', color: '#71767f' }}>{dayjs(date).format(dateFormat)}</span>
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
    <div style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header Section */}
      <div style={{ marginBottom: '24px' }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#71767f',
          }}
        >
          <span>CRM</span>
          <span style={{ color: '#c4c7cc' }}>/</span>
          <span style={{ color: '#191c1d', fontWeight: 600 }}>{translate('Customers')}</span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 4px 0',
                color: '#191c1d',
                fontWeight: 700,
                fontSize: '24px',
                letterSpacing: '-0.02em',
              }}
            >
              {translate('Customers')}
            </h1>
            <p style={{ margin: 0, color: '#71767f', fontSize: '14px' }}>
              Manage your customer relationships and contact information
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#71767f',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Total Customers
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#0058c314',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: '#0058c3' }}
                  >
                    group
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#191c1d' }}>
                {totalCustomers}
              </span>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#71767f',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Active
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#10b98114',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: '#10b981' }}
                  >
                    check_circle
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#191c1d' }}>
                {activeCustomers}
              </span>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#71767f',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  New This Month
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#f59e0b14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: '#f59e0b' }}
                  >
                    person_add
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#191c1d' }}>
                {recentCustomers}
              </span>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <div
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#71767f',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  VIP Customers
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: '#8b5cf614',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: '18px', color: '#8b5cf6' }}
                  >
                    star
                  </span>
                </div>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#191c1d' }}>8</span>
            </div>
          </Col>
        </Row>
      </div>

      {/* Main Content */}
      <CustomerDataTableModule
        config={config}
        extra={
          <DataImportButton
            moduleName="client"
            onImportComplete={(result) => {
              dispatch(crud.list({ entity: 'client' }));
            }}
          />
        }
      />
    </div>
  );
}
