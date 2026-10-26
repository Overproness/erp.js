import React, { useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  SearchOutlined,
} from '@/components/icons';

// ── 1. Standard Form Field Wrapper ──────────────────────────────────────────
export interface FormFieldWrapperProps {
  label?: React.ReactNode;
  required?: boolean;
  extra?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  success?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  label,
  required = false,
  extra,
  helperText,
  error,
  success,
  className = '',
  style,
  children,
}) => {
  return (
    <div className={`etched-form-field ${className}`} style={style}>
      {label && (
        <label className="etched-form-label">
          <span>
            {label}
            {required && <span className="etched-form-label-required">*</span>}
          </span>
          {extra && <span className="etched-form-label-extra">{extra}</span>}
        </label>
      )}

      {children}

      {error ? (
        <div className="etched-form-error" role="alert">
          <ExclamationCircleOutlined style={{ fontSize: '12px' }} />
          <span>{error}</span>
        </div>
      ) : helperText ? (
        <div className="etched-form-helper">{helperText}</div>
      ) : null}
    </div>
  );
};

// ── 2. Etched Text Input ───────────────────────────────────────────────────
export interface EtchedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size'> {
  label?: React.ReactNode;
  required?: boolean;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  allowClear?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  success?: boolean;
  wrapperClassName?: string;
}

export const EtchedInput = React.forwardRef<HTMLInputElement, EtchedInputProps>(
  (
    {
      label,
      required,
      prefixIcon,
      suffixIcon,
      allowClear = false,
      helperText,
      error,
      success,
      disabled,
      value,
      onChange,
      placeholder,
      wrapperClassName = '',
      className = '',
      ...rest
    },
    ref
  ) => {
    const [internalVal, setInternalVal] = useState(value ?? '');
    const isControlled = value !== undefined;
    const currentVal = isControlled ? value : internalVal;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalVal(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      if (!isControlled) setInternalVal('');
      const event = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(event);
    };

    const boxState = error ? 'error' : success ? 'success' : disabled ? 'disabled' : '';

    const inputContent = (
      <div className={`etched-input-box ${boxState} ${wrapperClassName}`}>
        {prefixIcon && <div className="etched-input-prefix">{prefixIcon}</div>}
        <input
          ref={ref}
          type="text"
          className={`etched-input-raw ${className}`}
          value={currentVal}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          {...rest}
        />
        {allowClear && currentVal && !disabled && (
          <button
            type="button"
            className="etched-input-clear-btn"
            onClick={handleClear}
            title="Clear"
          >
            ×
          </button>
        )}
        {suffixIcon && <div className="etched-input-suffix">{suffixIcon}</div>}
        {success && !suffixIcon && (
          <div className="etched-input-suffix" style={{ color: '#10b981' }}>
            <CheckCircleOutlined />
          </div>
        )}
      </div>
    );

    if (label || helperText || error) {
      return (
        <FormFieldWrapper
          label={label}
          required={required}
          helperText={helperText}
          error={error}
          success={success}
        >
          {inputContent}
        </FormFieldWrapper>
      );
    }

    return inputContent;
  }
);
EtchedInput.displayName = 'EtchedInput';

// ── 3. Etched Currency / Number Input ───────────────────────────────────────
export interface EtchedCurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'size' | 'onChange'> {
  label?: React.ReactNode;
  required?: boolean;
  currency?: string; // e.g. '$' or 'USD' or '€'
  value?: number | string;
  onChange?: (val: number | string) => void;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
}

export const EtchedCurrencyInput: React.FC<EtchedCurrencyInputProps> = ({
  label,
  required,
  currency = '$',
  value = '',
  onChange,
  helperText,
  error,
  disabled,
  placeholder = '0.00',
  min,
  max,
  step = 1,
  ...rest
}) => {
  const boxState = error ? 'error' : disabled ? 'disabled' : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange?.(val);
  };

  const inputContent = (
    <div className={`etched-input-box ${boxState}`}>
      <span className="etched-currency-badge">{currency}</span>
      <input
        type="number"
        className="etched-input-raw"
        style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.01em' }}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        {...rest}
      />
    </div>
  );

  if (label || helperText || error) {
    return (
      <FormFieldWrapper label={label} required={required} helperText={helperText} error={error}>
        {inputContent}
      </FormFieldWrapper>
    );
  }

  return inputContent;
};

// ── 4. Etched Select / Dropdown Pattern ─────────────────────────────────────
export interface SelectOption {
  label: string;
  value: string | number;
  badge?: string;
  icon?: React.ReactNode;
}

export interface EtchedSelectProps {
  label?: React.ReactNode;
  required?: boolean;
  options: SelectOption[];
  value?: string | number;
  onChange?: (val: string | number) => void;
  placeholder?: string;
  prefixIcon?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  disabled?: boolean;
}

export const EtchedSelect: React.FC<EtchedSelectProps> = ({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  prefixIcon,
  helperText,
  error,
  disabled = false,
}) => {
  const boxState = error ? 'error' : disabled ? 'disabled' : '';

  const inputContent = (
    <div className={`etched-input-box ${boxState}`}>
      {prefixIcon && <div className="etched-input-prefix">{prefixIcon}</div>}
      <select
        className="etched-input-raw"
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', background: 'transparent' }}
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label} {opt.badge ? `(${opt.badge})` : ''}
          </option>
        ))}
      </select>
    </div>
  );

  if (label || helperText || error) {
    return (
      <FormFieldWrapper label={label} required={required} helperText={helperText} error={error}>
        {inputContent}
      </FormFieldWrapper>
    );
  }

  return inputContent;
};

// ── 5. Etched Textarea / Multiline Pattern ──────────────────────────────────
export interface EtchedTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  required?: boolean;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  maxLength?: number;
  showCount?: boolean;
}

export const EtchedTextarea: React.FC<EtchedTextareaProps> = ({
  label,
  required,
  helperText,
  error,
  maxLength,
  showCount = false,
  value,
  onChange,
  disabled,
  placeholder = 'Write notes or description...',
  rows = 3,
  ...rest
}) => {
  const [internalVal, setInternalVal] = useState(value ?? '');
  const isControlled = value !== undefined;
  const currentVal = isControlled ? String(value) : String(internalVal);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isControlled) setInternalVal(e.target.value);
    onChange?.(e);
  };

  const inputContent = (
    <div className={`etched-textarea-box ${error ? 'error' : disabled ? 'disabled' : ''}`}>
      <textarea
        className="etched-textarea-raw"
        value={currentVal}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={maxLength}
        rows={rows}
        {...rest}
      />
      {showCount && maxLength && (
        <div className="etched-textarea-footer">
          {currentVal.length} / {maxLength}
        </div>
      )}
    </div>
  );

  if (label || helperText || error) {
    return (
      <FormFieldWrapper label={label} required={required} helperText={helperText} error={error}>
        {inputContent}
      </FormFieldWrapper>
    );
  }

  return inputContent;
};

// ── 6. Etched Toggle Switch Pattern ─────────────────────────────────────────
export interface EtchedSwitchProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const EtchedSwitch: React.FC<EtchedSwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: '#f8f9fa',
        borderRadius: '10px',
        border: '1px solid rgba(0,0,0,0.06)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
      onClick={() => !disabled && onChange(!checked)}
    >
      <div>
        {label && <div style={{ fontSize: '13px', fontWeight: 600, color: '#191c1d' }}>{label}</div>}
        {description && (
          <div style={{ fontSize: '11.5px', color: '#71767f', marginTop: '2px' }}>{description}</div>
        )}
      </div>

      <div
        style={{
          width: '40px',
          height: '22px',
          borderRadius: '12px',
          background: checked ? '#0058c3' : '#d1d5db',
          position: 'relative',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: '#ffffff',
            position: 'absolute',
            top: '2px',
            left: checked ? '20px' : '2px',
            transition: 'left 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </div>
    </div>
  );
};

// ── 7. Etched Multi-Tag / Chips Input ───────────────────────────────────────
export interface EtchedTagInputProps {
  label?: React.ReactNode;
  required?: boolean;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
}

export const EtchedTagInput: React.FC<EtchedTagInputProps> = ({
  label,
  required,
  tags,
  onChange,
  placeholder = 'Type tag & press enter...',
  helperText,
  error,
}) => {
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      e.preventDefault();
      if (!tags.includes(inputVal.trim())) {
        onChange([...tags, inputVal.trim()]);
      }
      setInputVal('');
    } else if (e.key === 'Backspace' && !inputVal && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((t) => t !== tagToRemove));
  };

  const inputContent = (
    <div
      className={`etched-input-box ${error ? 'error' : ''}`}
      style={{ height: 'auto', minHeight: '40px', flexWrap: 'wrap', padding: '6px 10px', gap: '6px' }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            background: 'rgba(0, 88, 195, 0.09)',
            color: '#0058c3',
            fontSize: '12px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          {tag}
          <span
            style={{ cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}
            onClick={() => removeTag(tag)}
          >
            ×
          </span>
        </span>
      ))}
      <input
        type="text"
        className="etched-input-raw"
        style={{ minWidth: '100px', flex: 1 }}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
      />
    </div>
  );

  if (label || helperText || error) {
    return (
      <FormFieldWrapper label={label} required={required} helperText={helperText} error={error}>
        {inputContent}
      </FormFieldWrapper>
    );
  }

  return inputContent;
};

// ── 8. Etched Drag & Drop File Zone ─────────────────────────────────────────
export interface EtchedDropzoneProps {
  label?: React.ReactNode;
  onFilesSelected?: (files: FileList) => void;
  accept?: string;
  title?: string;
  subtitle?: string;
  helperText?: React.ReactNode;
}

export const EtchedDropzone: React.FC<EtchedDropzoneProps> = ({
  label,
  onFilesSelected,
  accept = '*/*',
  title = 'Drag & drop files here, or click to browse',
  subtitle = 'Supports PDF, PNG, JPG, CSV up to 25MB',
  helperText,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected?.(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  return (
    <div style={{ width: '100%', marginBottom: '16px' }}>
      {label && <label className="etched-form-label" style={{ marginBottom: '6px' }}>{label}</label>}
      <div
        className={`etched-dropzone ${isDragActive ? 'drag-active' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(e) => e.target.files && onFilesSelected?.(e.dataTransfer?.files || e.target.files)}
        />
        <div className="etched-dropzone-icon">
          <InboxOutlined />
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#191c1d' }}>{title}</div>
        <div style={{ fontSize: '11.5px', color: '#71767f', marginTop: '4px' }}>{subtitle}</div>
      </div>
      {helperText && <div className="etched-form-helper">{helperText}</div>}
    </div>
  );
};
