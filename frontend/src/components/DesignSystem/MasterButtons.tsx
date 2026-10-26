import React from 'react';
import { RedoOutlined } from '@/components/icons';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'danger-soft'
  | 'success'
  | 'success-soft'
  | 'link';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface MasterButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  loading?: boolean;
  block?: boolean;
  badge?: React.ReactNode;
  children?: React.ReactNode;
}

export const MasterButton = React.forwardRef<HTMLButtonElement, MasterButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      icon,
      suffixIcon,
      loading = false,
      block = false,
      badge,
      disabled,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const variantClass = `m-btn-${variant}`;
    const sizeClass = `m-btn-${size}`;
    const blockClass = block ? 'm-btn-block' : '';

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || loading}
        className={`m-btn ${variantClass} ${sizeClass} ${blockClass} ${className}`}
        {...rest}
      >
        {loading ? (
          <RedoOutlined spin style={{ fontSize: '13px' }} />
        ) : (
          icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
        )}

        {children && <span>{children}</span>}

        {badge && (
          <span
            style={{
              marginLeft: '4px',
              fontSize: '0.85em',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.1)',
            }}
          >
            {badge}
          </span>
        )}

        {suffixIcon && !loading && (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{suffixIcon}</span>
        )}
      </button>
    );
  }
);
MasterButton.displayName = 'MasterButton';

// ── Icon-Only Button ────────────────────────────────────────────────────────
export interface MasterIconButtonProps extends Omit<MasterButtonProps, 'children' | 'block'> {
  icon: React.ReactNode;
  title?: string;
  shape?: 'square' | 'circle';
}

export const MasterIconButton: React.FC<MasterIconButtonProps> = ({
  icon,
  title,
  variant = 'secondary',
  size = 'md',
  shape = 'square',
  className = '',
  style,
  ...rest
}) => {
  return (
    <button
      type="button"
      title={title}
      className={`m-btn m-btn-${variant} m-btn-${size} m-btn-icon ${className}`}
      style={{
        borderRadius: shape === 'circle' ? '50%' : undefined,
        ...style,
      }}
      {...rest}
    >
      {icon}
    </button>
  );
};

// ── Split Dropdown Button ───────────────────────────────────────────────────
export interface MasterSplitButtonProps {
  primaryLabel: string;
  primaryIcon?: React.ReactNode;
  onPrimaryClick: () => void;
  onDropdownClick: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
}

export const MasterSplitButton: React.FC<MasterSplitButtonProps> = ({
  primaryLabel,
  primaryIcon,
  onPrimaryClick,
  onDropdownClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
}) => {
  return (
    <div className="m-btn-group">
      <MasterButton
        variant={variant}
        size={size}
        icon={primaryIcon}
        onClick={onPrimaryClick}
        disabled={disabled}
      >
        {primaryLabel}
      </MasterButton>
      <button
        type="button"
        className={`m-btn m-btn-${variant} m-btn-${size}`}
        style={{ padding: '0 8px', borderLeft: '1px solid rgba(255,255,255,0.2)' }}
        onClick={onDropdownClick}
        disabled={disabled}
        title="More actions"
      >
        ▾
      </button>
    </div>
  );
};
