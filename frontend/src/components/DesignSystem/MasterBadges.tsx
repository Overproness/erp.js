import React from 'react';

export type StatusVariant =
  | 'active'
  | 'pending'
  | 'overdue'
  | 'draft'
  | 'processing'
  | 'purple'
  | 'vip';

export interface MasterStatusPillProps {
  status: StatusVariant;
  label?: string;
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const MasterStatusPill: React.FC<MasterStatusPillProps> = ({
  status,
  label,
  pulse = false,
  className = '',
  style,
}) => {
  const normalizedStatus = status === 'vip' ? 'purple' : status;
  const defaultLabels: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    overdue: 'Overdue',
    draft: 'Draft',
    processing: 'Processing',
    purple: 'VIP',
  };

  const text = label || defaultLabels[normalizedStatus] || normalizedStatus;

  return (
    <span
      className={`m-status-pill m-status-${normalizedStatus} ${className}`}
      style={style}
    >
      <span className={`m-status-dot ${pulse ? 'pulse' : ''}`} />
      <span>{text}</span>
    </span>
  );
};

// ── Numerical Counter Badge ────────────────────────────────────────────────
export interface MasterCounterBadgeProps {
  count: number;
  maxCount?: number;
  variant?: 'primary' | 'gray' | 'danger';
  className?: string;
}

export const MasterCounterBadge: React.FC<MasterCounterBadgeProps> = ({
  count,
  maxCount = 99,
  variant = 'primary',
  className = '',
}) => {
  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span className={`m-counter-badge m-counter-${variant} ${className}`}>
      {displayCount}
    </span>
  );
};

// ── Priority Tag ───────────────────────────────────────────────────────────
export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

export interface MasterPriorityTagProps {
  priority: PriorityLevel;
  className?: string;
}

export const MasterPriorityTag: React.FC<MasterPriorityTagProps> = ({
  priority,
  className = '',
}) => {
  const configs: Record<PriorityLevel, { bg: string; color: string; label: string }> = {
    urgent: { bg: '#fee2e2', color: '#dc2626', label: 'Urgent' },
    high: { bg: '#ffedd5', color: '#c2410c', label: 'High' },
    medium: { bg: '#eff6ff', color: '#1d4ed8', label: 'Medium' },
    low: { bg: '#f3f4f6', color: '#4b5563', label: 'Low' },
  };

  const conf = configs[priority] || configs.medium;

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: conf.bg,
        color: conf.color,
      }}
    >
      {conf.label}
    </span>
  );
};
