import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  AlertOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  DeleteOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FilterOutlined,
  InboxOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  RedoOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingOutlined,
  ControlOutlined,
  TeamOutlined,
  UploadOutlined,
  UserOutlined,
} from '@/components/icons';
import { Card, Col, Row, Table, Tag } from '@/components/ui';
import { MasterModuleLayout } from '@/components/MasterLayout';
import {
  EtchedCurrencyInput,
  EtchedDropzone,
  EtchedInput,
  EtchedSelect,
  EtchedSwitch,
  EtchedTagInput,
  EtchedTextarea,
  FormFieldWrapper,
  MasterAlert,
  MasterButton,
  MasterConfirmModal,
  MasterCounterBadge,
  MasterDetailGrid,
  MasterDetailItem,
  MasterGlassCard,
  MasterIconButton,
  MasterPillTabs,
  MasterPriorityTag,
  MasterSectionHeader,
  MasterSplitButton,
  MasterStatusPill,
  MasterUnderlineTabs,
} from '@/components/DesignSystem';

export default function MasterLayoutShowcase() {
  // ── Showcase State Controls ────────────────────────────────────────────────
  const [activePreset, setActivePreset] = useState<'customer' | 'document' | 'invoice'>('customer');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [simulateSelection, setSimulateSelection] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'kanban'>('table');
  const [searchText, setSearchText] = useState('');

  // ── Button Playground State ────────────────────────────────────────────────
  const [btnLoading, setBtnLoading] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ── Tabs Playground State ──────────────────────────────────────────────────
  const [activeUnderlineTab, setActiveUnderlineTab] = useState('all');
  const [activePillTab, setActivePillTab] = useState('month');

  // ── Alerts Playground State ────────────────────────────────────────────────
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, boolean>>({});

  // ── Input Fields Playground State ──────────────────────────────────────────
  const [demoText, setDemoText] = useState('Acme Corporation');
  const [demoEmail, setDemoEmail] = useState('billing@acme.corp');
  const [demoAmount, setDemoAmount] = useState('12500');
  const [demoCurrency, setDemoCurrency] = useState('$');
  const [demoCategory, setDemoCategory] = useState('enterprise');
  const [demoTags, setDemoTags] = useState(['VIP Client', 'Tech Sector', 'Q3 Priority']);
  const [demoNotes, setDemoNotes] = useState('Primary billing contact is Sarah Jenkins. Net 30 payment terms.');
  const [demoSwitch1, setDemoSwitch1] = useState(true);
  const [demoSwitch2, setDemoSwitch2] = useState(false);
  const [showErrorState, setShowErrorState] = useState(false);

  // ── Module Presets ─────────────────────────────────────────────────────────
  const presets = {
    customer: {
      title: 'Customer Directory',
      subtitle: 'Manage client relationships, accounts, credit limits, and contact information',
      icon: <TeamOutlined style={{ fontSize: '22px' }} />,
      iconColor: '#0058c3',
      badge: <Tag color="blue" style={{ borderRadius: '6px' }}>1,248 Total</Tag>,
      stats: [
        { label: 'Total Clients', value: '1,248', change: '+12.4%', trend: 'up' as const, icon: <UserOutlined />, color: '#0058c3' },
        { label: 'Active Accounts', value: '1,180', change: '+5.1%', trend: 'up' as const, icon: <CheckCircleOutlined />, color: '#10b981' },
        { label: 'Overdue Balances', value: '24', change: '-8.2%', trend: 'down' as const, icon: <CreditCardOutlined />, color: '#f59e0b' },
        { label: 'Monthly Revenue', value: '$184,200', change: '+18.9%', trend: 'up' as const, icon: <DollarOutlined />, color: '#8b5cf6' },
      ],
      breadcrumbs: [{ label: 'CRM', path: '/client' }, { label: 'Customers' }],
      primaryLabel: 'Add Customer',
      defaultAdvancedSearch: false,
    },
    document: {
      title: 'Document Center',
      subtitle: 'Archive, tag, inspect, and analyze contracts, invoices, and legal agreements',
      icon: <FilePdfOutlined style={{ fontSize: '22px' }} />,
      iconColor: '#8b5cf6',
      badge: <Tag color="purple" style={{ borderRadius: '6px' }}>Encrypted</Tag>,
      stats: [
        { label: 'Total Documents', value: '3,842', change: '+34 this week', trend: 'up' as const, icon: <FileTextOutlined />, color: '#8b5cf6' },
        { label: 'Signed Contracts', value: '942', change: '+99%', trend: 'up' as const, icon: <CheckCircleOutlined />, color: '#10b981' },
        { label: 'Pending Signature', value: '18', change: 'Action required', trend: 'down' as const, icon: <CreditCardOutlined />, color: '#ef4444' },
        { label: 'Storage Used', value: '42.8 GB', change: 'of 100 GB', trend: 'neutral' as const, icon: <InboxOutlined />, color: '#0058c3' },
      ],
      breadcrumbs: [{ label: 'Workspace' }, { label: 'Documents' }],
      primaryLabel: 'Upload Document',
      defaultAdvancedSearch: true,
    },
    invoice: {
      title: 'Invoices & Billing',
      subtitle: 'Track payment statuses, create quotes, record payments, and audit financial flows',
      icon: <DollarOutlined style={{ fontSize: '22px' }} />,
      iconColor: '#10b981',
      badge: <Tag color="green" style={{ borderRadius: '6px' }}>Q4 Active</Tag>,
      stats: [
        { label: 'Total Invoiced', value: '$642,800', change: '+22.1%', trend: 'up' as const, icon: <DollarOutlined />, color: '#10b981' },
        { label: 'Paid & Settled', value: '$580,100', change: '+15.4%', trend: 'up' as const, icon: <CheckCircleOutlined />, color: '#0058c3' },
        { label: 'Pending Payment', value: '$62,700', change: '14 invoices', trend: 'neutral' as const, icon: <CreditCardOutlined />, color: '#f59e0b' },
        { label: 'Overdue Aging', value: '$8,400', change: '3 invoices', trend: 'down' as const, icon: <CreditCardOutlined />, color: '#ef4444' },
      ],
      breadcrumbs: [{ label: 'Finance' }, { label: 'Invoices' }],
      primaryLabel: 'Create Invoice',
      defaultAdvancedSearch: false,
    },
  };

  const currentPreset = presets[activePreset];

  const sampleRecords = [
    { key: '1', code: 'CUST-1001', name: 'Acme Corporation', email: 'billing@acme.corp', status: 'Active', balance: '$4,250.00', date: '2026-10-24' },
    { key: '2', code: 'CUST-1002', name: 'Global Logistics Ltd', email: 'accounts@globallog.com', status: 'Active', balance: '$12,800.00', date: '2026-10-22' },
    { key: '3', code: 'CUST-1003', name: 'Nexus Innovations', email: 'hello@nexusinn.tech', status: 'Pending', balance: '$0.00', date: '2026-10-18' },
    { key: '4', code: 'CUST-1004', name: 'Starlight Retailers', email: 'finance@starlight.store', status: 'Overdue', balance: '$1,920.00', date: '2026-10-09' },
  ];

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <span style={{ fontWeight: 600, color: '#0058c3' }}>{text}</span>,
    },
    {
      title: 'Name / Account',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#191c1d' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#71767f' }}>{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = status.toLowerCase() as any;
        return <MasterStatusPill status={s} pulse={s === 'active'} />;
      },
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (val: string) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => <span style={{ color: '#71767f', fontSize: '13px' }}>{date}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      render: () => (
        <MasterButton size="xs" variant="secondary" icon={<EyeOutlined />}>
          View
        </MasterButton>
      ),
    },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Master Layout & Design System Components | ERP System</title>
      </Helmet>

      <div style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
        {/* Showcase Banner Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #191c1d 0%, #2b303b 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  background: 'rgba(0, 88, 195, 0.4)',
                  color: '#60a5fa',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                The Crystalline Engine
              </span>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Comprehensive Design System Specification</span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: '#fff' }}>
              Master Dashboard Layout & Complete Component Catalog
            </h1>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px', maxWidth: '780px' }}>
              A modular master layout design plus complete design patterns: Buttons, Badges, Status Indicators,
              Glassmorphic Cards, Detail Grids, Tabs, Alerts, and Form Inputs.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <MasterButton variant="primary" size="sm" onClick={() => scrollTo('buttons-section')}>
              Buttons
            </MasterButton>
            <MasterButton variant="secondary" size="sm" onClick={() => scrollTo('badges-section')}>
              Badges
            </MasterButton>
            <MasterButton variant="secondary" size="sm" onClick={() => scrollTo('cards-section')}>
              Glass Cards
            </MasterButton>
            <MasterButton variant="secondary" size="sm" onClick={() => scrollTo('input-patterns-section')}>
              Inputs
            </MasterButton>
          </div>
        </div>

        {/* ── SECTION 1: MASTER LAYOUT INTERACTIVE DEMO ────────────────────── */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Part 1: Master Module Layout Playground</span>
              <Tag color="blue">Live Modular Layout</Tag>
            </div>
          }
          style={{
            borderRadius: '16px',
            marginBottom: '32px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          {/* Controls Bar */}
          <div
            style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              border: '1px solid rgba(0,0,0,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Preset Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Module Preset:</span>
              <div className="etched-segmented">
                <button
                  type="button"
                  className={`etched-segmented-item ${activePreset === 'customer' ? 'active' : ''}`}
                  onClick={() => {
                    setActivePreset('customer');
                    setShowAdvancedSearch(presets.customer.defaultAdvancedSearch);
                  }}
                >
                  <UserOutlined /> Customers
                </button>
                <button
                  type="button"
                  className={`etched-segmented-item ${activePreset === 'document' ? 'active' : ''}`}
                  onClick={() => {
                    setActivePreset('document');
                    setShowAdvancedSearch(presets.document.defaultAdvancedSearch);
                  }}
                >
                  <FileTextOutlined /> Documents
                </button>
                <button
                  type="button"
                  className={`etched-segmented-item ${activePreset === 'invoice' ? 'active' : ''}`}
                  onClick={() => {
                    setActivePreset('invoice');
                    setShowAdvancedSearch(presets.invoice.defaultAdvancedSearch);
                  }}
                >
                  <DollarOutlined /> Invoices
                </button>
              </div>
            </div>

            {/* Feature Toggles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
              {/* ADVANCED SEARCH BUTTON TOGGLE */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={showAdvancedSearch}
                  onChange={(e) => setShowAdvancedSearch(e.target.checked)}
                  style={{ accentColor: '#0058c3', width: '16px', height: '16px' }}
                />
                <span>Advanced Search Button ({showAdvancedSearch ? 'Visible' : 'Hidden'})</span>
              </label>

              {/* KPI STATS DECK TOGGLE */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={showStats}
                  onChange={(e) => setShowStats(e.target.checked)}
                  style={{ accentColor: '#0058c3', width: '16px', height: '16px' }}
                />
                <span>KPI Metrics Cards ({showStats ? 'Visible' : 'Hidden'})</span>
              </label>

              {/* BATCH SELECTION TOGGLE */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={simulateSelection}
                  onChange={(e) => setSimulateSelection(e.target.checked)}
                  style={{ accentColor: '#0058c3', width: '16px', height: '16px' }}
                />
                <span>Simulate 3 Selected Rows</span>
              </label>
            </div>
          </div>

          {/* THE MASTER LAYOUT COMPONENT IN ACTION */}
          <div
            style={{
              padding: '24px',
              background: '#f8f9fa',
              borderRadius: '16px',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            <MasterModuleLayout
              breadcrumbs={currentPreset.breadcrumbs}
              title={currentPreset.title}
              subtitle={currentPreset.subtitle}
              icon={currentPreset.icon}
              iconColor={currentPreset.iconColor}
              badge={currentPreset.badge}
              showStats={showStats}
              stats={currentPreset.stats}
              primaryAction={{
                label: currentPreset.primaryLabel,
                icon: <PlusOutlined />,
                onClick: () => alert(`Primary action "${currentPreset.primaryLabel}" clicked!`),
              }}
              secondaryActions={[
                { label: 'Import', icon: <UploadOutlined />, onClick: () => alert('Import clicked') },
                { label: 'Export', icon: <DownloadOutlined />, onClick: () => alert('Export clicked') },
              ]}
              toolbar={{
                showSearch: true,
                searchPlaceholder: `Search in ${currentPreset.title.toLowerCase()}...`,
                searchValue: searchText,
                onSearchChange: setSearchText,

                // Explicitly controlled by toggle or module need:
                showAdvancedSearch: showAdvancedSearch,
                advancedSearchLabel: 'Advanced Search',
                onAdvancedSearchClick: () => alert('Advanced Search modal triggered!'),

                viewMode: {
                  current: viewMode,
                  options: ['table', 'grid', 'kanban'],
                  onChange: setViewMode,
                },
                onRefresh: () => alert('Refreshed data!'),
              }}
              batchActions={
                simulateSelection
                  ? {
                      selectedCount: 3,
                      actions: [
                        { label: 'Export Selected', icon: <DownloadOutlined />, onClick: () => alert('Exported 3 items') },
                        { label: 'Delete Selected', icon: <DeleteOutlined />, danger: true, onClick: () => alert('Delete confirmed') },
                      ],
                      onClear: () => setSimulateSelection(false),
                    }
                  : undefined
              }
            >
              <Table
                dataSource={sampleRecords}
                columns={columns}
                pagination={false}
                rowSelection={
                  simulateSelection
                    ? {
                        selectedRowKeys: ['1', '2', '3'],
                        onChange: () => {},
                      }
                    : undefined
                }
              />
            </MasterModuleLayout>
          </div>
        </Card>

        {/* ── SECTION 2: BUTTONS & ACTION TRIGGERS MATRIX ─────────────────── */}
        <div id="buttons-section">
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>Part 2: Buttons & Action Triggers Matrix</span>
                  <Tag color="blue">Actions System</Tag>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={btnLoading}
                      onChange={(e) => setBtnLoading(e.target.checked)}
                      style={{ accentColor: '#0058c3' }}
                    />
                    <span>Loading State</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={btnDisabled}
                      onChange={(e) => setBtnDisabled(e.target.checked)}
                      style={{ accentColor: '#0058c3' }}
                    />
                    <span>Disabled State</span>
                  </label>
                </div>
              </div>
            }
            style={{
              borderRadius: '16px',
              marginBottom: '32px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            {/* Variants Grid */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
                1. Button Variants & Semantic Roles
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                <MasterButton variant="primary" loading={btnLoading} disabled={btnDisabled} icon={<PlusOutlined />}>
                  Primary Action
                </MasterButton>
                <MasterButton variant="secondary" loading={btnLoading} disabled={btnDisabled} icon={<DownloadOutlined />}>
                  Secondary Action
                </MasterButton>
                <MasterButton variant="outline" loading={btnLoading} disabled={btnDisabled} icon={<EditOutlined />}>
                  Outline Action
                </MasterButton>
                <MasterButton variant="ghost" loading={btnLoading} disabled={btnDisabled} icon={<SettingOutlined />}>
                  Ghost Action
                </MasterButton>
                <MasterButton variant="danger" loading={btnLoading} disabled={btnDisabled} icon={<DeleteOutlined />}>
                  Solid Danger
                </MasterButton>
                <MasterButton variant="danger-soft" loading={btnLoading} disabled={btnDisabled} icon={<DeleteOutlined />}>
                  Soft Danger
                </MasterButton>
                <MasterButton variant="success" loading={btnLoading} disabled={btnDisabled} icon={<CheckCircleOutlined />}>
                  Solid Success
                </MasterButton>
                <MasterButton variant="success-soft" loading={btnLoading} disabled={btnDisabled} icon={<CheckCircleOutlined />}>
                  Soft Success
                </MasterButton>
                <MasterButton variant="link" disabled={btnDisabled}>
                  Text Link ↗
                </MasterButton>
              </div>
            </div>

            {/* Sizes & Shapes */}
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
                  2. Button Sizes (xs, sm, md, lg)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <MasterButton size="xs" variant="primary">Extra Small (26px)</MasterButton>
                  <MasterButton size="sm" variant="primary">Small (32px)</MasterButton>
                  <MasterButton size="md" variant="primary">Medium Default (38px)</MasterButton>
                  <MasterButton size="lg" variant="primary">Large Hero (44px)</MasterButton>
                </div>
              </Col>

              <Col xs={24} md={12}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
                  3. Icon Buttons, Split Actions & Badges
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <MasterIconButton icon={<SearchOutlined />} title="Search" size="md" variant="secondary" />
                  <MasterIconButton icon={<FilterOutlined />} title="Filter" size="md" variant="secondary" />
                  <MasterIconButton icon={<SettingOutlined />} title="Settings" size="md" variant="secondary" shape="circle" />
                  <MasterIconButton icon={<DeleteOutlined />} title="Delete" size="md" variant="danger-soft" />

                  {/* Split Button */}
                  <MasterSplitButton
                    primaryLabel="Save & Publish"
                    primaryIcon={<CheckCircleOutlined />}
                    onPrimaryClick={() => alert('Saved and published!')}
                    onDropdownClick={() => alert('Dropdown options: Save as Draft, Duplicate')}
                  />

                  {/* Button with Badge */}
                  <MasterButton variant="secondary" badge="4">
                    Notifications
                  </MasterButton>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* ── SECTION 3: BADGES, STATUS PILLS & INDICATORS ────────────────── */}
        <div id="badges-section">
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Part 3: Badges, Status Pills & Live Dot Indicators</span>
                <Tag color="green">Status System</Tag>
              </div>
            }
            style={{
              borderRadius: '16px',
              marginBottom: '32px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Live Status Pills (with Pulsing Indicators)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <MasterStatusPill status="active" label="Live / Active" pulse />
                  <MasterStatusPill status="pending" label="Pending Review" pulse />
                  <MasterStatusPill status="overdue" label="Payment Overdue" pulse />
                  <MasterStatusPill status="processing" label="Syncing Cloud" pulse />
                  <MasterStatusPill status="draft" label="Draft Document" />
                  <MasterStatusPill status="vip" label="Enterprise VIP" />
                </div>
              </Col>

              <Col xs={24} md={6}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Priority Tags
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <MasterPriorityTag priority="urgent" />
                  <MasterPriorityTag priority="high" />
                  <MasterPriorityTag priority="medium" />
                  <MasterPriorityTag priority="low" />
                </div>
              </Col>

              <Col xs={24} md={6}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Counter Badges
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MasterCounterBadge count={3} variant="primary" />
                  <MasterCounterBadge count={18} variant="gray" />
                  <MasterCounterBadge count={142} maxCount={99} variant="danger" />
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* ── SECTION 4: GLASSMORPHIIC CARDS & DETAIL GRIDS ───────────────── */}
        <div id="cards-section">
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Part 4: Glassmorphic Cards & Detail Key-Value Inspector</span>
                <Tag color="purple">Structural Depth</Tag>
              </div>
            }
            style={{
              borderRadius: '16px',
              marginBottom: '32px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <MasterGlassCard
                  title="Account Financial Profile"
                  subtitle="Synchronized live from Stripe & banking ledger"
                  extra={<MasterButton size="xs" variant="secondary" icon={<EditOutlined />}>Edit Profile</MasterButton>}
                >
                  <MasterDetailGrid columns={2}>
                    <MasterDetailItem label="Account ID" value="ACC-849204-X" />
                    <MasterDetailItem label="Billing Cycle" value="Quarterly Net 30" />
                    <MasterDetailItem label="Primary Currency" value="USD ($) United States Dollar" />
                    <MasterDetailItem label="Credit Ceiling" value="$75,000.00 Authorized" />
                    <MasterDetailItem label="Tax ID / VAT" value="US-942-019284-B" />
                    <MasterDetailItem label="Status" value={<MasterStatusPill status="active" pulse />} />
                  </MasterDetailGrid>
                </MasterGlassCard>
              </Col>

              <Col xs={24} lg={12}>
                <MasterGlassCard
                  title="Compliance & Audit Trail"
                  subtitle="Cryptographic verification and document signatures"
                  extra={<MasterStatusPill status="processing" label="Verifying" pulse />}
                >
                  <MasterDetailGrid columns={2}>
                    <MasterDetailItem label="Security Tier" value="SOC-2 Type II Certified" />
                    <MasterDetailItem label="Encryption" value="AES-256 at rest / TLS 1.3" />
                    <MasterDetailItem label="Last Audit" value="2026-10-14 by Ernst & Young" />
                    <MasterDetailItem label="Signatory" value="Sarah Jenkins (VP Finance)" />
                  </MasterDetailGrid>

                  <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <MasterButton size="sm" variant="outline" icon={<DownloadOutlined />}>
                      Download Certificate
                    </MasterButton>
                    <MasterButton size="sm" variant="primary">
                      Re-verify Ledger
                    </MasterButton>
                  </div>
                </MasterGlassCard>
              </Col>
            </Row>
          </Card>
        </div>

        {/* ── SECTION 5: FEEDBACK ALERTS & CONFIRMATION DIALOGS ───────────── */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 700, fontSize: '16px' }}>Part 5: Feedback Banners, Alerts & Confirm Dialogs</span>
                <Tag color="orange">Alerts & Dialogs</Tag>
              </div>
              <MasterButton
                size="sm"
                variant="danger-soft"
                onClick={() => setShowConfirmModal(true)}
                icon={<DeleteOutlined />}
              >
                Trigger Confirm Modal
              </MasterButton>
            </div>
          }
          style={{
            borderRadius: '16px',
            marginBottom: '32px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          {!dismissedAlerts.info && (
            <MasterAlert
              type="info"
              title="System Upgrade Scheduled"
              description="ERP system maintenance scheduled tonight at 02:00 AM UTC. Automated invoicing jobs will be queued safely."
              onClose={() => setDismissedAlerts({ ...dismissedAlerts, info: true })}
            />
          )}

          {!dismissedAlerts.success && (
            <MasterAlert
              type="success"
              title="Batch Reconciliation Succeeded"
              description="148 invoices reconciled with bank statement. Total credited amount: $194,240.00."
              onClose={() => setDismissedAlerts({ ...dismissedAlerts, success: true })}
            />
          )}

          {!dismissedAlerts.warning && (
            <MasterAlert
              type="warning"
              title="Tax Exemption Approaching Expiry"
              description="Acme Corporation VAT exemption certificate expires in 12 days. Please upload renewed documentation."
              action={
                <MasterButton size="xs" variant="secondary" onClick={() => alert('Upload form triggered')}>
                  Upload Document
                </MasterButton>
              }
              onClose={() => setDismissedAlerts({ ...dismissedAlerts, warning: true })}
            />
          )}

          {!dismissedAlerts.error && (
            <MasterAlert
              type="error"
              title="Webhook Transmission Failure"
              description="Stripe webhook endpoint returned HTTP 504 Gateway Timeout. 3 event payloads are in retry queue."
              action={
                <MasterButton size="xs" variant="danger" onClick={() => alert('Retrying payloads')}>
                  Retry Now
                </MasterButton>
              }
              onClose={() => setDismissedAlerts({ ...dismissedAlerts, error: true })}
            />
          )}

          {/* Confirm Modal */}
          <MasterConfirmModal
            open={showConfirmModal}
            title="Delete Customer Account"
            description="Are you sure you want to permanently delete Acme Corporation? This will archive all associated contracts, quotes, and audit trails."
            confirmLabel="Delete Account"
            danger
            onCancel={() => setShowConfirmModal(false)}
            onConfirm={() => {
              alert('Account deleted!');
              setShowConfirmModal(false);
            }}
          />
        </Card>

        {/* ── SECTION 6: NAVIGATION TABS ───────────────────────────────────── */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0' }}>
              <span style={{ fontWeight: 700, fontSize: '16px' }}>Part 6: Navigation Tabs (Underline & Segmented Pills)</span>
              <Tag color="cyan">Navigation Patterns</Tag>
            </div>
          }
          style={{
            borderRadius: '16px',
            marginBottom: '32px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
              1. Underline Indicator Tabs with Badge Counters
            </div>
            <MasterUnderlineTabs
              items={[
                { key: 'all', label: 'All Accounts', count: 1248 },
                { key: 'active', label: 'Active', count: 1180 },
                { key: 'overdue', label: 'Overdue / Alerts', count: 24 },
                { key: 'archived', label: 'Archived', count: 44 },
              ]}
              activeKey={activeUnderlineTab}
              onChange={setActiveUnderlineTab}
            />
          </div>

          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '14px' }}>
              2. Segmented Pill Tabs (Timeframes / Filter Views)
            </div>
            <MasterPillTabs
              items={[
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'Last 7 Days' },
                { key: 'month', label: 'This Month' },
                { key: 'quarter', label: 'Q4 2026' },
                { key: 'year', label: 'Full Year' },
              ]}
              activeKey={activePillTab}
              onChange={setActivePillTab}
            />
          </div>
        </Card>

        {/* ── SECTION 7: INPUT FIELD DESIGN PATTERNS ──────────────────────── */}
        <div id="input-patterns-section">
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>
                    Part 7: Input Field Design Patterns Library ("The Crystalline Engine")
                  </span>
                  <Tag color="cyan">Form Controls</Tag>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showErrorState}
                    onChange={(e) => setShowErrorState(e.target.checked)}
                    style={{ accentColor: '#ef4444' }}
                  />
                  <span>Simulate Form Error States</span>
                </label>
              </div>
            }
            style={{
              borderRadius: '16px',
              marginBottom: '32px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <p style={{ color: '#71767f', fontSize: '14px', margin: '0 0 24px 0' }}>
              Standardized, etched form controls designed according to <code>DESIGN.md</code>. Featuring inset elevation,
              conductive electric blue focus rings, clear buttons, prefix badges, micro-typography, and seamless validation states.
            </p>

            <Row gutter={[24, 24]}>
              {/* Pattern 1: Standard Text Input */}
              <Col xs={24} md={12} lg={8}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 1: Etched Text Input
                  </div>
                  <EtchedInput
                    label="Company or Client Name"
                    required
                    placeholder="e.g. Acme Corp"
                    value={demoText}
                    onChange={(e) => setDemoText(e.target.value)}
                    prefixIcon={<UserOutlined />}
                    allowClear
                    helperText={!showErrorState ? 'Legal registered corporate entity' : undefined}
                    error={showErrorState ? 'Company name is required and cannot be empty' : undefined}
                  />
                </div>
              </Col>

              {/* Pattern 2: Email & Prefix Input */}
              <Col xs={24} md={12} lg={8}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 2: Email with Prefix & Validation
                  </div>
                  <EtchedInput
                    label="Primary Billing Email"
                    required
                    placeholder="billing@domain.com"
                    value={demoEmail}
                    onChange={(e) => setDemoEmail(e.target.value)}
                    prefixIcon={<MailOutlined />}
                    allowClear
                    success={!showErrorState}
                    helperText={!showErrorState ? 'Verification link will be dispatched here' : undefined}
                    error={showErrorState ? 'Please provide a valid corporate email' : undefined}
                  />
                </div>
              </Col>

              {/* Pattern 3: Currency & Number Input */}
              <Col xs={24} md={12} lg={8}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 3: Currency & Stepper Input
                  </div>
                  <EtchedCurrencyInput
                    label="Approved Credit Limit"
                    currency={demoCurrency}
                    value={demoAmount}
                    onChange={(val) => setDemoAmount(String(val))}
                    placeholder="5,000.00"
                    step={500}
                    helperText={!showErrorState ? 'Subject to finance manager authorization' : undefined}
                    error={showErrorState ? 'Credit limit exceeds maximum authorized ceiling' : undefined}
                  />
                </div>
              </Col>

              {/* Pattern 4: Etched Select Dropdown */}
              <Col xs={24} md={12} lg={8}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 4: Etched Select / Dropdown
                  </div>
                  <EtchedSelect
                    label="Client Tier Category"
                    required
                    value={demoCategory}
                    onChange={(val) => setDemoCategory(String(val))}
                    options={[
                      { label: 'Enterprise Tier', value: 'enterprise', badge: 'High Volume' },
                      { label: 'Mid-Market Tier', value: 'midmarket', badge: 'Standard' },
                      { label: 'Startup / Growth', value: 'startup' },
                      { label: 'Government / Public Sector', value: 'gov' },
                    ]}
                    helperText="Governs automated discount schedules"
                  />
                </div>
              </Col>

              {/* Pattern 5: Multi-Tag / Chips Input */}
              <Col xs={24} md={12} lg={8}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 5: Multi-Value Tag Chips
                  </div>
                  <EtchedTagInput
                    label="Classification Tags"
                    tags={demoTags}
                    onChange={setDemoTags}
                    placeholder="Add tag & press Enter..."
                    helperText="Press Enter to create a new filter tag"
                  />
                </div>
              </Col>

              {/* Pattern 6: Toggle Switches */}
              <Col xs={24} md={12} lg={8}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 6: Boolean Switch Settings
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <EtchedSwitch
                      label="Automated Invoicing"
                      description="Generate PDF upon invoice generation"
                      checked={demoSwitch1}
                      onChange={setDemoSwitch1}
                    />
                    <EtchedSwitch
                      label="Enforce Tax Compliance"
                      description="Require VAT/Tax registration certificate"
                      checked={demoSwitch2}
                      onChange={setDemoSwitch2}
                    />
                  </div>
                </div>
              </Col>

              {/* Pattern 7: Multiline Textarea */}
              <Col xs={24} md={12}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 7: Etched Textarea with Character Counter
                  </div>
                  <EtchedTextarea
                    label="Internal Account Notes & Terms"
                    value={demoNotes}
                    onChange={(e) => setDemoNotes(e.target.value)}
                    maxLength={200}
                    showCount
                    rows={3}
                    placeholder="Enter confidential notes, special discounts or stipulations..."
                    helperText="Visible only to authenticated team managers"
                  />
                </div>
              </Col>

              {/* Pattern 8: File Upload Dropzone */}
              <Col xs={24} md={12}>
                <div style={{ padding: '18px', background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0058c3', textTransform: 'uppercase', marginBottom: '12px' }}>
                    Pattern 8: Glassmorphic Dropzone
                  </div>
                  <EtchedDropzone
                    label="Contract & Verification Attachments"
                    title="Drop contracts or scan documents here"
                    subtitle="PDF, PNG, CSV supported up to 25MB"
                    onFilesSelected={(files) => alert(`Selected ${files.length} file(s)!`)}
                    helperText="Files are encrypted at rest with AES-256"
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </>
  );
}
