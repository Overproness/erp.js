import React from 'react';

export interface MasterGlassCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const MasterGlassCard: React.FC<MasterGlassCardProps> = ({
  title,
  subtitle,
  extra,
  children,
  className = '',
  style,
}) => {
  const hasHeader = title || extra;

  return (
    <div className={`m-glass-card ${className}`} style={style}>
      {hasHeader && (
        <div className="m-section-header">
          <div>
            {title && <h3 className="m-section-title">{title}</h3>}
            {subtitle && <p className="m-section-desc">{subtitle}</p>}
          </div>
          {extra && <div>{extra}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// ── Section Header (No-line principle) ──────────────────────────────────────
export interface MasterSectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  className?: string;
}

export const MasterSectionHeader: React.FC<MasterSectionHeaderProps> = ({
  title,
  description,
  extra,
  className = '',
}) => {
  return (
    <div className={`m-section-header ${className}`}>
      <div>
        <h4 className="m-section-title">{title}</h4>
        {description && <p className="m-section-desc">{description}</p>}
      </div>
      {extra && <div>{extra}</div>}
    </div>
  );
};

// ── Key-Value Detail Grid (For Drawers / Modals / Previews) ─────────────────
export interface MasterDetailItemProps {
  label: React.ReactNode;
  value: React.ReactNode;
  copyable?: boolean;
}

export const MasterDetailItem: React.FC<MasterDetailItemProps> = ({
  label,
  value,
  copyable = false,
}) => {
  return (
    <div className="m-detail-item">
      <span className="m-detail-label">{label}</span>
      <span className="m-detail-value">{value || '—'}</span>
    </div>
  );
};

export interface MasterDetailGridProps {
  children: React.ReactNode;
  columns?: number;
  className?: string;
}

export const MasterDetailGrid: React.FC<MasterDetailGridProps> = ({
  children,
  columns,
  className = '',
}) => {
  return (
    <div
      className={`m-detail-grid ${className}`}
      style={{
        gridTemplateColumns: columns ? `repeat(${columns}, 1fr)` : undefined,
      }}
    >
      {children}
    </div>
  );
};
