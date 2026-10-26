import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  InboxOutlined,
  PlusOutlined,
} from '@/components/icons';
import { Button, Drawer, Modal, Skeleton } from '@/components/ui';
import MasterMetricCard, { MasterMetricCardProps } from './MasterMetricCard';
import MasterToolbar, { MasterToolbarProps, ViewModeType } from './MasterToolbar';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface ActionButtonConfig {
  label: string;
  icon?: React.ReactNode;
  type?: 'primary' | 'secondary' | 'danger' | 'ghost';
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

export interface BatchActionConfig {
  selectedCount: number;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
  }>;
  onClear?: () => void;
}

export interface MasterModuleLayoutProps {
  // Breadcrumbs & Navigation
  breadcrumbs?: BreadcrumbItem[];

  // Header Title & Meta
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconColor?: string; // default #0058c3
  badge?: React.ReactNode;

  // Actions in Header
  primaryAction?: ActionButtonConfig;
  secondaryActions?: ActionButtonConfig[];
  headerExtra?: React.ReactNode;

  // Statistics / KPI Deck (Optional & Configurable)
  showStats?: boolean;
  stats?: MasterMetricCardProps[];
  statsLoading?: boolean;

  // Toolbar (Search, Advanced Search, Filters, View Mode)
  toolbar?: MasterToolbarProps;
  showToolbar?: boolean;

  // Batch Action Bar
  batchActions?: BatchActionConfig;

  // Main Content
  children: React.ReactNode;
  loading?: boolean;
  empty?: {
    show: boolean;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
  };

  // Advanced Search Modal Slot
  advancedSearchContent?: React.ReactNode;
  advancedSearchTitle?: string;

  // Slide Drawer for Details / Quick Inspect (Optional)
  drawer?: {
    open: boolean;
    title?: string;
    onClose: () => void;
    width?: number | string;
    content: React.ReactNode;
  };

  className?: string;
  style?: React.CSSProperties;
}

export const MasterModuleLayout: React.FC<MasterModuleLayoutProps> = ({
  breadcrumbs,
  title,
  subtitle,
  icon,
  iconColor = '#0058c3',
  badge,
  primaryAction,
  secondaryActions = [],
  headerExtra,

  showStats = true,
  stats = [],
  statsLoading = false,

  toolbar,
  showToolbar = true,

  batchActions,

  children,
  loading = false,
  empty,

  advancedSearchContent,
  advancedSearchTitle = 'Advanced Search',

  drawer,
  className = '',
  style,
}) => {
  const [internalAdvancedSearchOpen, setInternalAdvancedSearchOpen] = useState(false);

  // If user passed a custom onAdvancedSearchClick in toolbar, use it;
  // otherwise open the built-in modal if advancedSearchContent is provided.
  const handleAdvancedSearchClick = () => {
    if (toolbar?.onAdvancedSearchClick) {
      toolbar.onAdvancedSearchClick();
    } else if (advancedSearchContent) {
      setInternalAdvancedSearchOpen(true);
    }
  };

  const hasStats = showStats && stats && stats.length > 0;
  const isBatchActive = batchActions && batchActions.selectedCount > 0;

  return (
    <div className={`master-layout-root ${className}`} style={style}>
      {/* ── 1. Page Header Block ─────────────────────────────────────── */}
      <header className="master-header">
        {/* Breadcrumb path */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="master-breadcrumb-bar" aria-label="Breadcrumb">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  {item.path && !isLast ? (
                    <Link to={item.path} className="master-breadcrumb-item">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={isLast ? 'master-breadcrumb-current' : 'master-breadcrumb-item'}>
                      {item.label}
                    </span>
                  )}
                  {!isLast && <span className="master-breadcrumb-separator">/</span>}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        {/* Title, Subtitle, and Action Buttons */}
        <div className="master-title-row">
          <div className="master-title-meta">
            {icon && (
              <div
                className="master-title-icon-wrapper"
                style={{
                  background: `${iconColor}14`,
                  color: iconColor,
                }}
              >
                {icon}
              </div>
            )}
            <div className="master-title-text">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1>{title}</h1>
                {badge}
              </div>
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="master-actions-group">
            {headerExtra}

            {secondaryActions.map((sec, idx) => (
              <Button
                key={idx}
                className="master-secondary-btn"
                onClick={sec.onClick}
                loading={sec.loading}
                disabled={sec.disabled}
                icon={sec.icon}
              >
                {sec.label}
              </Button>
            ))}

            {primaryAction && (
              <Button
                className="master-cta-btn"
                onClick={primaryAction.onClick}
                loading={primaryAction.loading}
                disabled={primaryAction.disabled}
                icon={primaryAction.icon || <PlusOutlined />}
              >
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. KPI / Metrics Deck (Optional) ─────────────────────────── */}
      {hasStats && (
        <section className="master-stats-grid" aria-label="Key Performance Indicators">
          {stats.map((stat, idx) => (
            <MasterMetricCard key={stat.id || idx} {...stat} loading={statsLoading} />
          ))}
        </section>
      )}

      {/* ── 3. Batch Action Bar (Appears when items are selected) ─────── */}
      {isBatchActive && (
        <div className="master-batch-bar" role="alert">
          <div className="master-batch-info">
            <span className="master-batch-badge">{batchActions.selectedCount}</span>
            <span>records selected</span>
            {batchActions.onClear && (
              <button
                type="button"
                onClick={batchActions.onClear}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  marginLeft: '8px',
                }}
              >
                Clear selection
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {batchActions.actions?.map((act, idx) => (
              <Button
                key={idx}
                size="small"
                style={{
                  background: act.danger ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: '12px',
                }}
                icon={act.icon}
                onClick={act.onClick}
              >
                {act.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Toolbar Deck (Search, Advanced Search, Filters, Views) ── */}
      {showToolbar && toolbar && (
        <MasterToolbar
          {...toolbar}
          onAdvancedSearchClick={handleAdvancedSearchClick}
          isAdvancedSearchActive={internalAdvancedSearchOpen}
        />
      )}

      {/* ── 5. Main Content Area ─────────────────────────────────────── */}
      <main className="master-content-card">
        {loading ? (
          <div style={{ padding: '32px' }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : empty?.show ? (
          <div
            style={{
              padding: '64px 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9ca3af',
                fontSize: '28px',
                marginBottom: '16px',
              }}
            >
              {empty.icon || <InboxOutlined />}
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 600, color: '#191c1d' }}>
              {empty.title || 'No records found'}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#71767f', maxWidth: '380px' }}>
              {empty.description || 'Get started by creating your first entry.'}
            </p>
            {empty.actionLabel && empty.onAction && (
              <Button className="master-cta-btn" onClick={empty.onAction}>
                {empty.actionLabel}
              </Button>
            )}
          </div>
        ) : (
          children
        )}
      </main>

      {/* ── 6. Advanced Search Modal (Modular) ───────────────────────── */}
      {advancedSearchContent && (
        <Modal
          title={advancedSearchTitle}
          open={internalAdvancedSearchOpen}
          onCancel={() => setInternalAdvancedSearchOpen(false)}
          footer={null}
          width={900}
          centered
          styles={{
            body: {
              maxHeight: 'calc(100vh - 200px)',
              overflowY: 'auto',
            },
          }}
        >
          {advancedSearchContent}
        </Modal>
      )}

      {/* ── 7. Slide-over Detail Drawer (Optional) ───────────────────── */}
      {drawer && (
        <Drawer
          title={drawer.title || 'Record Details'}
          open={drawer.open}
          onClose={drawer.onClose}
          width={drawer.width || 480}
        >
          {drawer.content}
        </Drawer>
      )}
    </div>
  );
};

export default MasterModuleLayout;
