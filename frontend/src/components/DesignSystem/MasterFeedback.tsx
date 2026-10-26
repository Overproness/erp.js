import React from 'react';
import {
  AlertOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
} from '@/components/icons';
import { Modal } from '@/components/ui';
import { MasterButton } from './MasterButtons';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface MasterAlertProps {
  type?: AlertType;
  title?: React.ReactNode;
  description: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const MasterAlert: React.FC<MasterAlertProps> = ({
  type = 'info',
  title,
  description,
  icon,
  action,
  onClose,
  className = '',
}) => {
  const defaultIcons = {
    info: <AlertOutlined />,
    success: <CheckCircleOutlined />,
    warning: <ExclamationCircleOutlined />,
    error: <ExclamationCircleOutlined />,
  };

  const renderIcon = icon || defaultIcons[type];

  return (
    <div className={`m-alert m-alert-${type} ${className}`} role="alert">
      <div className="m-alert-icon">{renderIcon}</div>
      <div className="m-alert-content">
        {title && <div className="m-alert-title">{title}</div>}
        <div>{description}</div>
      </div>
      {action && <div>{action}</div>}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
          }}
          title="Dismiss"
        >
          <CloseOutlined style={{ fontSize: '14px' }} />
        </button>
      )}
    </div>
  );
};

// ── Standard Empty State ───────────────────────────────────────────────────
export interface MasterEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const MasterEmptyState: React.FC<MasterEmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div
      style={{
        padding: '56px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: '#f3f4f6',
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginBottom: '16px',
        }}
      >
        {icon || <InboxOutlined />}
      </div>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#191c1d' }}>
        {title}
      </h3>
      {description && (
        <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#71767f', maxWidth: '420px', lineHeight: 1.5 }}>
          {description}
        </p>
      )}
      <div style={{ display: 'flex', gap: '10px' }}>
        {secondaryActionLabel && onSecondaryAction && (
          <MasterButton variant="secondary" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </MasterButton>
        )}
        {actionLabel && onAction && (
          <MasterButton variant="primary" onClick={onAction}>
            {actionLabel}
          </MasterButton>
        )}
      </div>
    </div>
  );
};

// ── Confirmation Modal Pattern ──────────────────────────────────────────────
export interface MasterConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export const MasterConfirmModal: React.FC<MasterConfirmModalProps> = ({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
}) => {
  return (
    <Modal open={open} onCancel={onCancel} footer={null} width={440} centered>
      <div style={{ padding: '8px 4px' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: danger ? '#fee2e2' : '#f0f7ff',
              color: danger ? '#dc2626' : '#0058c3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            <ExclamationCircleOutlined />
          </div>
          <div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: '#191c1d' }}>
              {title}
            </h4>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#71767f', lineHeight: 1.5 }}>
              {description}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <MasterButton variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </MasterButton>
          <MasterButton
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </MasterButton>
        </div>
      </div>
    </Modal>
  );
};
