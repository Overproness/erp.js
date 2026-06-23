import { Input as ShadcnInput } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Search, X } from 'lucide-react';
import * as React from 'react';

// ── shared size mapping ──────────────────────────────────────────────────────
function inputSizeClass(size?: 'large' | 'middle' | 'small') {
  if (size === 'large') return 'h-10 text-base';
  if (size === 'small') return 'h-7 text-xs';
  return 'h-9 text-sm';
}

// ── Input ────────────────────────────────────────────────────────────────────
export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  size?: 'large' | 'middle' | 'small';
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  allowClear?: boolean;
  showCount?: boolean;
  status?: 'error' | 'warning';
  bordered?: boolean;
}

const InputBase = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size,
      prefix,
      suffix,
      addonBefore,
      addonAfter,
      allowClear,
      showCount,
      status,
      bordered = true,
      className,
      style,
      value,
      onChange,
      maxLength,
      ...rest
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(value ?? '');
    const controlled = value !== undefined;
    const currentValue = controlled ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!controlled) setInternalValue(e.target.value);
      onChange?.(e);
    };

    const handleClear = () => {
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      if (!controlled) setInternalValue('');
      onChange?.(syntheticEvent);
    };

    const hasWrapper = prefix || suffix || addonBefore || addonAfter || allowClear || showCount;

    const inputEl = (
      <ShadcnInput
        ref={ref}
        value={currentValue}
        onChange={handleChange}
        maxLength={maxLength}
        className={cn(
          inputSizeClass(size),
          status === 'error' && 'border-destructive focus-visible:ring-destructive',
          status === 'warning' && 'border-yellow-400 focus-visible:ring-yellow-400',
          !bordered && 'border-0 shadow-none',
          prefix || addonBefore,
          suffix || addonAfter || allowClear,
          !hasWrapper && className
        )}
        style={!hasWrapper ? style : undefined}
        {...rest}
      />
    );

    if (!hasWrapper) return inputEl;

    return (
      <span className={cn('inline-flex w-full items-stretch', className)} style={style}>
        {addonBefore && (
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            {addonBefore}
          </span>
        )}
        <span className="relative flex flex-1 items-center">
          {prefix && (
            <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
              {prefix}
            </span>
          )}
          <ShadcnInput
            ref={ref}
            value={currentValue}
            onChange={handleChange}
            maxLength={maxLength}
            className={cn(
              inputSizeClass(size),
              'flex-1',
              prefix && 'pl-8',
              (suffix || allowClear) && 'pr-8',
              status === 'error' && 'border-destructive focus-visible:ring-destructive',
              status === 'warning' && 'border-yellow-400 focus-visible:ring-yellow-400',
              !bordered && 'border-0 shadow-none',
              addonBefore,
              addonAfter || allowClear,
              'fix-border-input'
            )}
            {...rest}
          />
          {(suffix || (allowClear && currentValue)) && (
            <span className="absolute right-3 flex items-center gap-1 text-muted-foreground">
              {allowClear && currentValue ? (
                <button type="button" onClick={handleClear} className="hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                suffix
              )}
            </span>
          )}
          {showCount && maxLength && (
            <span className="absolute right-3 bottom-full mb-0.5 text-xs text-muted-foreground">
              {String(currentValue).length}/{maxLength}
            </span>
          )}
        </span>
        {addonAfter && (
          <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
            {addonAfter}
          </span>
        )}
      </span>
    );
  }
);
InputBase.displayName = 'Input';

// ── Input.Password ───────────────────────────────────────────────────────────
interface PasswordProps extends Omit<InputProps, 'suffix' | 'type'> {
  visibilityToggle?: boolean;
  iconRender?: (visible: boolean) => React.ReactNode;
}

const Password = React.forwardRef<HTMLInputElement, PasswordProps>(
  (
    {
      visibilityToggle = true,
      iconRender,
      className,
      size,
      status,
      bordered = true,
      prefix,
      addonBefore,
      addonAfter,
      ...rest
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(false);

    const toggle = iconRender ? (
      iconRender(visible)
    ) : visible ? (
      <EyeOff className="h-4 w-4 cursor-pointer" onClick={() => setVisible(false)} />
    ) : (
      <Eye className="h-4 w-4 cursor-pointer" onClick={() => setVisible(true)} />
    );

    return (
      <InputBase
        ref={ref}
        type={visible ? 'text' : 'password'}
        suffix={visibilityToggle ? toggle : undefined}
        prefix={prefix}
        addonBefore={addonBefore}
        addonAfter={addonAfter}
        size={size}
        status={status}
        bordered={bordered}
        className={className}
        {...rest}
      />
    );
  }
);
Password.displayName = 'Input.Password';

// ── Input.Search ─────────────────────────────────────────────────────────────
interface SearchProps extends Omit<InputProps, 'suffix'> {
  onSearch?: (
    value: string,
    e?: React.ChangeEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>
  ) => void;
  enterButton?: boolean | React.ReactNode;
  loading?: boolean;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchProps>(
  ({ onSearch, enterButton, loading, onKeyDown, className, size, ...rest }, ref) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLInputElement>) || internalRef;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(resolvedRef.current?.value ?? '', e);
      }
      onKeyDown?.(e);
    };

    return (
      <InputBase
        ref={resolvedRef}
        suffix={
          <Search
            className="h-4 w-4 cursor-pointer hover:text-primary"
            onClick={() => onSearch?.(resolvedRef.current?.value ?? '')}
          />
        }
        onKeyDown={handleKeyDown}
        size={size}
        className={className}
        {...rest}
      />
    );
  }
);
SearchInput.displayName = 'Input.Search';

// ── Input.TextArea ───────────────────────────────────────────────────────────
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'large' | 'middle' | 'small';
  allowClear?: boolean;
  showCount?: boolean;
  status?: 'error' | 'warning';
  bordered?: boolean;
  autoSize?: boolean | { minRows?: number; maxRows?: number };
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      size,
      allowClear,
      showCount,
      status,
      bordered = true,
      autoSize,
      className,
      rows = 4,
      ...rest
    },
    ref
  ) => {
    return (
      <Textarea
        ref={ref}
        rows={typeof autoSize === 'object' ? autoSize.minRows ?? rows : rows}
        className={cn(
          size === 'large' && 'text-base',
          size === 'small' && 'text-xs',
          status === 'error' && 'border-destructive focus-visible:ring-destructive',
          status === 'warning' && 'border-yellow-400 focus-visible:ring-yellow-400',
          !bordered && 'border-0 shadow-none',
          typeof autoSize === 'boolean' && autoSize && 'resize-none',
          className
        )}
        {...rest}
      />
    );
  }
);
TextArea.displayName = 'Input.TextArea';

// ── Composed Input export ────────────────────────────────────────────────────
export const Input = Object.assign(InputBase, {
  Password,
  Search: SearchInput,
  TextArea,
});

export { TextArea };
