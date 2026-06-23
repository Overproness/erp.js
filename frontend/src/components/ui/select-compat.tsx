/**
 * select-compat.tsx
 * Select & AutoComplete built with @radix-ui/react-popover + custom searchable list.
 * Supports: options prop, Select.Option children, showSearch, mode="multiple", allowClear, loading.
 */
import { cn } from '@/lib/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown, Loader2, X } from 'lucide-react';
import * as React from 'react';

// ── Option type ───────────────────────────────────────────────────────────────
export interface SelectOptionType {
  value: string | number;
  label?: React.ReactNode;
  disabled?: boolean;
  children?: React.ReactNode; // for <Select.Option>value</Select.Option>
  title?: string;
  className?: string;
  // OptGroup support
  options?: SelectOptionType[];
}

// ── Collect options from children (Select.Option / Select.OptGroup) ───────────
function collectOptions(children: React.ReactNode): SelectOptionType[] {
  const opts: SelectOptionType[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const props = child.props as any;
    // OptGroup
    if (props.options) {
      opts.push(...(props.options as SelectOptionType[]));
    } else if (props.children && !props.value) {
      // OptGroup via children
      opts.push(...collectOptions(props.children));
    } else {
      opts.push({
        value: props.value,
        label: props.children ?? props.label ?? props.value,
        disabled: props.disabled,
      });
    }
  });
  return opts;
}

// ── Select props ──────────────────────────────────────────────────────────────
export interface SelectProps {
  value?: any;
  defaultValue?: any;
  onChange?: (value: any, option: SelectOptionType | SelectOptionType[] | undefined) => void;
  onSelect?: (value: any, option: SelectOptionType) => void;
  onDeselect?: (value: any) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  onDropdownVisibleChange?: (open: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  options?: SelectOptionType[];
  children?: React.ReactNode;
  mode?: 'multiple' | 'tags' | 'combobox';
  showSearch?: boolean;
  filterOption?: boolean | ((inputValue: string, option: SelectOptionType) => boolean);
  loading?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  placeholder?: React.ReactNode;
  notFoundContent?: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  status?: 'error' | 'warning' | '';
  size?: 'large' | 'middle' | 'small';
  style?: React.CSSProperties;
  className?: string;
  dropdownClassName?: string;
  dropdownStyle?: React.CSSProperties;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement;
  labelInValue?: boolean;
  maxTagCount?: number | 'responsive';
  maxTagTextLength?: number;
  tagRender?: (props: any) => React.ReactElement;
  tokenSeparators?: string[];
  autoClearSearchValue?: boolean;
  showAction?: string[];
  id?: string;
  popupMatchSelectWidth?: boolean | number;
  listHeight?: number;
  virtual?: boolean;
  // form compat
  name?: string;
}

// ── Select ────────────────────────────────────────────────────────────────────
const SelectComponent = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onSelect,
      onDeselect,
      onSearch,
      onClear,
      onDropdownVisibleChange,
      onFocus,
      onBlur,
      options: optionsProp,
      children,
      mode,
      showSearch,
      filterOption,
      loading,
      disabled,
      allowClear,
      placeholder = 'Select...',
      notFoundContent,
      open: openProp,
      defaultOpen,
      status,
      size,
      style,
      className,
      dropdownClassName,
      dropdownStyle,
      id,
    },
    ref
  ) => {
    const isMultiple = mode === 'multiple' || mode === 'tags';
    const isControlled = value !== undefined;

    const [internalValue, setInternalValue] = React.useState<any>(
      defaultValue ?? (isMultiple ? [] : undefined)
    );
    const [open, setOpen] = React.useState(defaultOpen ?? false);
    const [search, setSearch] = React.useState('');
    const searchRef = React.useRef<HTMLInputElement>(null);

    const currentValue = isControlled ? value : internalValue;

    // Collect options
    const resolvedOptions: SelectOptionType[] = React.useMemo(() => {
      if (optionsProp) return optionsProp.flatMap((o) => (o.options ? o.options : [o]));
      if (children) return collectOptions(children);
      return [];
    }, [optionsProp, children]);

    // Filter
    const filteredOptions = React.useMemo(() => {
      if (!search) return resolvedOptions;
      if (filterOption === false) return resolvedOptions;
      if (typeof filterOption === 'function') {
        return resolvedOptions.filter((o) => filterOption(search, o));
      }
      const q = search.toLowerCase();
      return resolvedOptions.filter((o) =>
        String(o.label ?? o.value ?? '')
          .toLowerCase()
          .includes(q)
      );
    }, [resolvedOptions, search, filterOption]);

    const handleOpenChange = (next: boolean) => {
      if (openProp !== undefined) return; // controlled
      setOpen(next);
      onDropdownVisibleChange?.(next);
      if (next) {
        setSearch('');
        setTimeout(() => searchRef.current?.focus(), 50);
      }
    };

    const handleSelect = (optValue: any) => {
      const opt = resolvedOptions.find((o) => o.value === optValue);
      if (isMultiple) {
        const current: any[] = Array.isArray(currentValue) ? currentValue : [];
        const alreadySelected = current.includes(optValue);
        const next = alreadySelected
          ? current.filter((v) => v !== optValue)
          : [...current, optValue];
        if (!isControlled) setInternalValue(next);
        const selectedOpts = resolvedOptions.filter((o) => next.includes(o.value));
        onChange?.(next, selectedOpts);
        if (!alreadySelected) onSelect?.(optValue, opt!);
        else onDeselect?.(optValue);
      } else {
        if (!isControlled) setInternalValue(optValue);
        onChange?.(optValue, opt);
        onSelect?.(optValue, opt!);
        setOpen(false);
        onDropdownVisibleChange?.(false);
      }
      setSearch('');
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      const next = isMultiple ? [] : undefined;
      if (!isControlled) setInternalValue(next);
      onChange?.(next, isMultiple ? [] : undefined);
      onClear?.();
    };

    const removeTag = (e: React.MouseEvent, tagValue: any) => {
      e.stopPropagation();
      handleSelect(tagValue);
    };

    const isSelected = (optValue: any) =>
      isMultiple
        ? Array.isArray(currentValue) && currentValue.includes(optValue)
        : currentValue === optValue;

    const selectedOpt = !isMultiple ? resolvedOptions.find((o) => o.value === currentValue) : null;

    const hasValue = isMultiple
      ? Array.isArray(currentValue) && currentValue.length > 0
      : currentValue !== undefined && currentValue !== null && currentValue !== '';

    const heightClass =
      size === 'large' ? 'h-10 text-base' : size === 'small' ? 'h-7 text-xs' : 'h-9 text-sm';

    return (
      <PopoverPrimitive.Root
        open={openProp !== undefined ? openProp : open}
        onOpenChange={handleOpenChange}
      >
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={ref}
            id={id}
            type="button"
            disabled={disabled}
            onFocus={onFocus}
            onBlur={onBlur}
            aria-haspopup="listbox"
            aria-expanded={open}
            className={cn(
              'flex w-full items-center justify-between rounded-[var(--radius)] border border-input',
              'bg-background px-3 py-1.5 ring-offset-background cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'hover:border-ring/50 transition-colors',
              heightClass,
              status === 'error' && 'border-destructive focus:ring-destructive',
              status === 'warning' && 'border-yellow-400',
              className
            )}
            style={style}
          >
            <span className="flex-1 flex flex-wrap gap-1 min-w-0 text-left">
              {isMultiple && Array.isArray(currentValue) && currentValue.length > 0 ? (
                currentValue.map((v) => {
                  const opt = resolvedOptions.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-muted rounded-sm"
                    >
                      {opt?.label ?? v}
                      <span
                        role="button"
                        tabIndex={-1}
                        className="ml-0.5 hover:text-destructive cursor-pointer"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => removeTag(e, v)}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </span>
                  );
                })
              ) : !isMultiple && selectedOpt ? (
                <span className="truncate">{selectedOpt.label ?? selectedOpt.value}</span>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </span>
            <span className="flex items-center gap-1 shrink-0 ml-2">
              {allowClear && hasValue && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClear}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground opacity-60" />
              )}
            </span>
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              'z-50 w-[var(--radix-popover-trigger-width)] min-w-32 rounded-[var(--radius)] border border-border',
              'bg-popover text-popover-foreground shadow-md outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              dropdownClassName
            )}
            style={dropdownStyle}
            align="start"
            sideOffset={4}
          >
            {(showSearch || isMultiple) && (
              <div className="border-b border-border flex items-center px-3 py-1.5 gap-2">
                <input
                  ref={searchRef}
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    onSearch?.(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1">
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  {notFoundContent ?? 'No options'}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const selected = isSelected(opt.value);
                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={selected}
                      className={cn(
                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none',
                        'hover:bg-accent hover:text-accent-foreground transition-colors',
                        selected && 'bg-accent/50 font-medium',
                        opt.disabled && 'opacity-50 pointer-events-none'
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                    >
                      {isMultiple && (
                        <span
                          className={cn(
                            'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-primary',
                            selected ? 'bg-primary' : 'bg-background'
                          )}
                        >
                          {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                      )}
                      {!isMultiple && (
                        <Check
                          className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')}
                        />
                      )}
                      <span className="flex-1 truncate">{opt.label ?? opt.value}</span>
                    </div>
                  );
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
SelectComponent.displayName = 'Select';

// Select.Option — consumed by parent Select; renders nothing
const SelectOption: React.FC<{
  value: any;
  children?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}> = () => null;
SelectOption.displayName = 'Select.Option';

// Select.OptGroup — consumed by parent Select; renders nothing
const SelectOptGroup: React.FC<{
  label?: React.ReactNode;
  children?: React.ReactNode;
  options?: SelectOptionType[];
}> = () => null;
SelectOptGroup.displayName = 'Select.OptGroup';

export const Select = Object.assign(SelectComponent, {
  Option: SelectOption,
  OptGroup: SelectOptGroup,
});

// ── AutoComplete ──────────────────────────────────────────────────────────────
export interface AutoCompleteProps {
  value?: string;
  defaultValue?: string;
  options?: { value: string; label?: React.ReactNode }[];
  onSelect?: (value: string, option: any) => void;
  onSearch?: (value: string) => void;
  onChange?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  notFoundContent?: React.ReactNode;
  filterOption?: boolean | ((inputValue: string, option: any) => boolean);
  style?: React.CSSProperties;
  className?: string;
  dropdownClassName?: string;
  children?: React.ReactNode; // can render a custom Input
  status?: 'error' | 'warning' | '';
  id?: string;
}

export const AutoComplete = React.forwardRef<HTMLInputElement, AutoCompleteProps>(
  (
    {
      value,
      defaultValue,
      options = [],
      onSelect,
      onSearch,
      onChange,
      placeholder,
      allowClear,
      disabled,
      notFoundContent,
      filterOption,
      style,
      className,
      dropdownClassName,
      children,
      status,
      id,
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState(defaultValue ?? '');
    const [open, setOpen] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const current = isControlled ? value! : internal;

    const filteredOpts = React.useMemo(() => {
      if (!current) return options;
      if (filterOption === false) return options;
      if (typeof filterOption === 'function') {
        return options.filter((o) => filterOption(current, o));
      }
      return options.filter((o) =>
        String(o.value ?? '')
          .toLowerCase()
          .includes(current.toLowerCase())
      );
    }, [options, current, filterOption]);

    const handleChange = (v: string) => {
      if (!isControlled) setInternal(v);
      onChange?.(v);
      onSearch?.(v);
      setOpen(v.length > 0);
    };

    const handleSelect = (v: string) => {
      if (!isControlled) setInternal(v);
      onChange?.(v);
      onSelect?.(
        v,
        options.find((o) => o.value === v)
      );
      setOpen(false);
    };

    return (
      <div className={cn('relative', className)} style={style}>
        <input
          ref={(el) => {
            if (typeof ref === 'function') ref(el);
            else if (ref) (ref as any).current = el;
            (inputRef as any).current = el;
          }}
          id={id}
          type="text"
          value={current}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => current && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className={cn(
            'flex h-9 w-full rounded-[var(--radius)] border border-input bg-background px-3 py-1 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            status === 'error' && 'border-destructive'
          )}
        />
        {allowClear && current && !disabled && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleChange('')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {open && filteredOpts.length > 0 && (
          <div
            className={cn(
              'absolute z-50 mt-1 w-full rounded-[var(--radius)] border border-border bg-popover shadow-md',
              'max-h-56 overflow-y-auto p-1',
              dropdownClassName
            )}
          >
            {filteredOpts.map((opt) => (
              <div
                key={opt.value}
                className="flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label ?? opt.value}
              </div>
            ))}
          </div>
        )}
        {open && filteredOpts.length === 0 && notFoundContent && (
          <div className="absolute z-50 mt-1 w-full rounded-[var(--radius)] border border-border bg-popover shadow-md p-3 text-sm text-muted-foreground text-center">
            {notFoundContent}
          </div>
        )}
      </div>
    );
  }
);
AutoComplete.displayName = 'AutoComplete';
