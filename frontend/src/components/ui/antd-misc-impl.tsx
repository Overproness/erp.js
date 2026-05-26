/**
 * antd-misc-impl.tsx
 * InputNumber, Menu, Steps, Pagination, Slider, Timeline, App, ConfigProvider
 * All built with shadcn/tweakcn primitives — no antd dependency.
 */
import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { message } from '@/components/ui/antd-overlay';
import { notification } from '@/components/ui/antd-overlay';

// ── InputNumber ───────────────────────────────────────────────────────────────
export interface InputNumberProps {
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number | string;
  precision?: number;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  formatter?: (
    value: number | string | undefined,
    info: { userTyping: boolean; input: string }
  ) => string;
  parser?: (displayValue: string | undefined) => number | string;
  addonBefore?: React.ReactNode;
  addonAfter?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  controls?: boolean;
  keyboard?: boolean;
  status?: 'error' | 'warning' | '';
  size?: 'large' | 'middle' | 'small';
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  name?: string;
  stringMode?: boolean;
  upHandler?: React.ReactNode;
  downHandler?: React.ReactNode;
  decimalSeparator?: string;
  changeOnWheel?: boolean;
}

export const InputNumber = React.forwardRef<HTMLInputElement, InputNumberProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      min = -Infinity,
      max = Infinity,
      step = 1,
      precision,
      disabled,
      readOnly,
      placeholder,
      formatter,
      parser,
      addonBefore,
      addonAfter,
      prefix,
      suffix,
      controls = true,
      status,
      size,
      style,
      className,
      id,
      name,
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<number | null>(defaultValue ?? null);
    const [inputStr, setInputStr] = React.useState(
      String((isControlled ? value : defaultValue) ?? '')
    );
    const current = isControlled ? value : internal;

    const numStep = typeof step === 'string' ? parseFloat(step) : step;

    const clamp = (n: number) => Math.min(max, Math.max(min, n));

    const getDisplayValue = (v: number | null | undefined) => {
      if (v === null || v === undefined) return '';
      const str = precision !== undefined ? v.toFixed(precision) : String(v);
      if (formatter) return formatter(v, { userTyping: false, input: str });
      return str;
    };

    React.useEffect(() => {
      setInputStr(getDisplayValue(current));
    }, [value]);

    const commit = (v: number | null) => {
      if (!isControlled) setInternal(v);
      onChange?.(v);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputStr(raw);
      const parsed = parser ? parser(raw) : raw.replace(/[^0-9.-]/g, '');
      const num = Number(parsed);
      if (raw === '' || raw === '-') {
        commit(null);
        return;
      }
      if (!Number.isNaN(num)) {
        const clamped = clamp(precision !== undefined ? parseFloat(num.toFixed(precision)) : num);
        commit(clamped);
      }
    };

    const handleBlur = () => {
      setInputStr(getDisplayValue(current));
    };

    const increment = () => {
      const base = current ?? 0;
      const next = clamp(parseFloat((base + numStep).toFixed(10)));
      setInputStr(getDisplayValue(next));
      commit(next);
    };

    const decrement = () => {
      const base = current ?? 0;
      const next = clamp(parseFloat((base - numStep).toFixed(10)));
      setInputStr(getDisplayValue(next));
      commit(next);
    };

    const h =
      size === 'large' ? 'h-10 text-base' : size === 'small' ? 'h-7 text-xs' : 'h-9 text-sm';

    const input = (
      <div className={cn('relative flex items-center', h)}>
        {prefix && (
          <span className="absolute left-3 text-muted-foreground pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          value={inputStr}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(
            'flex w-full rounded-[var(--radius)] border border-input bg-background',
            'px-3 text-sm ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-colors hover:border-ring/50',
            h,
            prefix && 'pl-8',
            (suffix || controls) && 'pr-16',
            status === 'error' && 'border-destructive',
            status === 'warning' && 'border-yellow-400'
          )}
        />
        <div className="absolute right-0 flex items-center h-full">
          {suffix && (
            <span className="px-2 text-muted-foreground text-sm border-l border-input">
              {suffix}
            </span>
          )}
          {controls && !disabled && !readOnly && (
            <div className="flex flex-col h-full border-l border-input">
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  increment();
                }}
                className="flex-1 flex items-center justify-center px-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 10 6">
                  <path
                    d="M1 5L5 1L9 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                tabIndex={-1}
                onMouseDown={(e) => {
                  e.preventDefault();
                  decrement();
                }}
                className="flex-1 flex items-center justify-center px-1.5 border-t border-input text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 10 6">
                  <path
                    d="M9 1L5 5L1 1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );

    if (!addonBefore && !addonAfter) {
      return (
        <div className={cn('w-full', className)} style={style}>
          {input}
        </div>
      );
    }

    return (
      <div className={cn('flex w-full', className)} style={style}>
        {addonBefore && (
          <span
            className={cn(
              'flex items-center px-3 border border-r-0 border-input rounded-l-[var(--radius)] bg-muted text-sm text-muted-foreground shrink-0',
              h
            )}
          >
            {addonBefore}
          </span>
        )}
        <div
          className={cn('flex-1', addonBefore && 'rounded-l-none', addonAfter && 'rounded-r-none')}
        >
          {input}
        </div>
        {addonAfter && (
          <span
            className={cn(
              'flex items-center px-3 border border-l-0 border-input rounded-r-[var(--radius)] bg-muted text-sm text-muted-foreground shrink-0',
              h
            )}
          >
            {addonAfter}
          </span>
        )}
      </div>
    );
  }
);
InputNumber.displayName = 'InputNumber';

// ── Menu ──────────────────────────────────────────────────────────────────────
export interface MenuItemType {
  key?: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  title?: string;
  type?: 'divider' | 'group' | 'item' | 'submenu';
  children?: MenuItemType[];
  onClick?: (info: { key: string; keyPath: string[]; domEvent: React.MouseEvent }) => void;
  style?: React.CSSProperties;
  className?: string;
  theme?: 'light' | 'dark';
  popupClassName?: string;
  popupOffset?: [number, number];
  expandIcon?: React.ReactNode;
  onTitleClick?: (info: { key: string; domEvent: React.MouseEvent }) => void;
}

export interface MenuProps {
  items?: MenuItemType[];
  mode?: 'inline' | 'horizontal' | 'vertical';
  theme?: 'light' | 'dark';
  selectedKeys?: string[];
  defaultSelectedKeys?: string[];
  openKeys?: string[];
  defaultOpenKeys?: string[];
  inlineCollapsed?: boolean;
  inlineIndent?: number;
  multiple?: boolean;
  selectable?: boolean;
  onClick?: (info: { key: string; keyPath: string[]; domEvent: React.MouseEvent }) => void;
  onSelect?: (info: { key: string; keyPath: string[]; selectedKeys: string[] }) => void;
  onDeselect?: (info: { key: string; keyPath: string[]; selectedKeys: string[] }) => void;
  onOpenChange?: (openKeys: string[]) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  rootClassName?: string;
  expandIcon?: React.ReactNode;
  forceSubMenuRender?: boolean;
  triggerSubMenuAction?: 'hover' | 'click';
}

function MenuItemComponent({
  item,
  selected,
  level,
  inlineIndent,
  openKeys,
  setOpenKeys,
  onItemClick,
}: {
  item: MenuItemType;
  selected: boolean;
  level: number;
  inlineIndent: number;
  openKeys: string[];
  setOpenKeys: React.Dispatch<React.SetStateAction<string[]>>;
  onItemClick: (key: string, e: React.MouseEvent) => void;
}) {
  const key = String(item.key ?? '');
  const isOpen = openKeys.includes(key);
  const hasChildren = (item.children?.length ?? 0) > 0 || item.type === 'submenu';

  if (item.type === 'divider') {
    return <Separator className="my-1" />;
  }

  if (item.type === 'group') {
    return (
      <div>
        <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {item.label}
        </div>
        {item.children?.map((child) => (
          <MenuItemComponent
            key={child.key}
            item={child}
            selected={selected}
            level={level + 1}
            inlineIndent={inlineIndent}
            openKeys={openKeys}
            setOpenKeys={setOpenKeys}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          style={{ paddingLeft: level * inlineIndent + 12 }}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors text-left',
            'hover:bg-accent hover:text-accent-foreground',
            item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          onClick={(e) => {
            setOpenKeys((prev) => (isOpen ? prev.filter((k) => k !== key) : [...prev, key]));
            item.onTitleClick?.({ key, domEvent: e });
          }}
        >
          {item.icon && <span className="shrink-0">{item.icon}</span>}
          <span className="flex-1">{item.label}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform shrink-0',
              isOpen && 'rotate-180'
            )}
          />
        </button>
        {isOpen && (
          <div>
            {item.children?.map((child) => (
              <MenuItemComponent
                key={child.key}
                item={child}
                selected={false}
                level={level + 1}
                inlineIndent={inlineIndent}
                openKeys={openKeys}
                setOpenKeys={setOpenKeys}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      style={{ paddingLeft: level * inlineIndent + 12 }}
      className={cn(
        'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-sm transition-colors text-left',
        'hover:bg-accent hover:text-accent-foreground',
        selected && 'bg-accent text-accent-foreground font-medium',
        item.danger && 'text-destructive hover:bg-destructive/10',
        item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
      )}
      onClick={(e) => {
        if (!item.disabled) {
          onItemClick(key, e);
          item.onClick?.({ key, keyPath: [key], domEvent: e });
        }
      }}
      style={{ ...(item.style ?? {}), paddingLeft: level * inlineIndent + 12 }}
    >
      {item.icon && <span className="shrink-0">{item.icon}</span>}
      <span className="flex-1">{item.label ?? item.title}</span>
    </button>
  );
}

export const Menu: React.FC<MenuProps> = ({
  items = [],
  mode = 'inline',
  selectedKeys: selectedKeysProp,
  defaultSelectedKeys = [],
  openKeys: openKeysProp,
  defaultOpenKeys = [],
  inlineIndent = 24,
  onClick,
  onSelect,
  className,
  style,
}) => {
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(defaultSelectedKeys);
  const [openKeys, setOpenKeys] = React.useState<string[]>(defaultOpenKeys);

  const currentSelected = selectedKeysProp ?? selectedKeys;
  const currentOpen = openKeysProp ?? openKeys;

  const handleItemClick = (key: string, e: React.MouseEvent) => {
    const next = [key];
    setSelectedKeys(next);
    onClick?.({ key, keyPath: [key], domEvent: e });
    onSelect?.({ key, keyPath: [key], selectedKeys: next });
  };

  return (
    <nav
      className={cn('flex flex-col gap-0.5', mode === 'horizontal' && 'flex-row', className)}
      style={style}
    >
      {items.map((item) => (
        <MenuItemComponent
          key={item.key}
          item={item}
          selected={currentSelected.includes(String(item.key ?? ''))}
          level={0}
          inlineIndent={inlineIndent}
          openKeys={currentOpen}
          setOpenKeys={setOpenKeys}
          onItemClick={handleItemClick}
        />
      ))}
    </nav>
  );
};

// ── Steps ─────────────────────────────────────────────────────────────────────
export interface StepItem {
  title?: React.ReactNode;
  description?: React.ReactNode;
  subTitle?: React.ReactNode;
  icon?: React.ReactNode;
  status?: 'wait' | 'process' | 'finish' | 'error';
  disabled?: boolean;
}

export interface StepsProps {
  items?: StepItem[];
  current?: number;
  status?: 'wait' | 'process' | 'finish' | 'error';
  direction?: 'horizontal' | 'vertical';
  size?: 'default' | 'small';
  type?: 'default' | 'navigation' | 'inline' | 'dot';
  labelPlacement?: 'horizontal' | 'vertical';
  onChange?: (current: number) => void;
  percent?: number;
  initial?: number;
  progressDot?: boolean | ((dot: React.ReactNode, info: any) => React.ReactNode);
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function getStepStatus(
  item: StepItem,
  index: number,
  current: number,
  globalStatus: string
): 'wait' | 'process' | 'finish' | 'error' {
  if (item.status) return item.status;
  if (index < current) return 'finish';
  if (index === current) return (globalStatus as any) || 'process';
  return 'wait';
}

export const Steps: React.FC<StepsProps> = ({
  items,
  current = 0,
  status = 'process',
  direction = 'horizontal',
  size,
  type,
  onChange,
  className,
  style,
  children,
}) => {
  const resolvedItems: StepItem[] =
    items ?? React.Children.map(children, (child: any) => child?.props as StepItem) ?? [];

  return (
    <div
      className={cn(
        'flex',
        direction === 'vertical' ? 'flex-col' : 'flex-row items-start',
        className
      )}
      style={style}
    >
      {resolvedItems.map((item, index) => {
        const stepStatus = getStepStatus(item, index, current, status);
        const isLast = index === resolvedItems.length - 1;
        const clickable = !!onChange && !item.disabled;

        return (
          <React.Fragment key={index}>
            <div
              className={cn(
                'flex',
                direction === 'vertical' ? 'flex-row gap-3' : 'flex-col items-center',
                clickable && 'cursor-pointer group',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => clickable && !item.disabled && onChange!(index)}
            >
              {/* Icon / number */}
              <div
                className={cn(
                  'flex items-center justify-center rounded-full shrink-0 border-2 transition-colors font-medium',
                  size === 'small' ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm',
                  stepStatus === 'finish' && 'border-primary bg-primary text-primary-foreground',
                  stepStatus === 'process' && 'border-primary bg-primary text-primary-foreground',
                  stepStatus === 'wait' && 'border-border bg-background text-muted-foreground',
                  stepStatus === 'error' &&
                    'border-destructive bg-destructive text-destructive-foreground'
                )}
              >
                {item.icon ? (
                  item.icon
                ) : stepStatus === 'finish' ? (
                  <Check className="h-4 w-4" />
                ) : stepStatus === 'error' ? (
                  '!'
                ) : (
                  index + 1
                )}
              </div>

              {/* Labels */}
              <div className={cn('min-w-0', direction === 'horizontal' && 'text-center mt-2')}>
                {item.title && (
                  <div
                    className={cn(
                      'text-sm font-medium leading-snug',
                      stepStatus === 'process' && 'text-foreground',
                      stepStatus === 'finish' && 'text-foreground',
                      stepStatus === 'wait' && 'text-muted-foreground',
                      stepStatus === 'error' && 'text-destructive'
                    )}
                  >
                    {item.title}
                  </div>
                )}
                {item.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                )}
              </div>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  direction === 'horizontal'
                    ? 'flex-1 h-0.5 mx-2 mt-4 self-start'
                    : 'w-0.5 self-stretch ml-4 my-1',
                  index < current ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
// Step sub-component consumed by Steps when using old children API
(Steps as any).Step = () => null;

// ── Pagination ────────────────────────────────────────────────────────────────
export interface PaginationProps {
  current?: number;
  defaultCurrent?: number;
  total?: number;
  pageSize?: number;
  defaultPageSize?: number;
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => React.ReactNode;
  pageSizeOptions?: (number | string)[];
  hideOnSinglePage?: boolean;
  disabled?: boolean;
  simple?: boolean;
  size?: 'default' | 'small';
  className?: string;
  style?: React.CSSProperties;
}

export const Pagination: React.FC<PaginationProps> = ({
  current: currentProp,
  defaultCurrent = 1,
  total = 0,
  pageSize: pageSizeProp = 10,
  defaultPageSize = 10,
  onChange,
  showTotal,
  hideOnSinglePage,
  disabled,
  simple,
  size,
  className,
  style,
}) => {
  const isControlled = currentProp !== undefined;
  const [internal, setInternal] = React.useState(defaultCurrent);
  const current = isControlled ? currentProp! : internal;
  const pageSize = pageSizeProp ?? defaultPageSize;
  const totalPages = Math.ceil(total / pageSize);

  if (hideOnSinglePage && totalPages <= 1) return null;

  const go = (page: number) => {
    const next = Math.max(1, Math.min(totalPages, page));
    if (!isControlled) setInternal(next);
    onChange?.(next, pageSize);
  };

  const rangeStart = (current - 1) * pageSize + 1;
  const rangeEnd = Math.min(current * pageSize, total);

  const btnClass = (active = false) =>
    cn(
      'inline-flex items-center justify-center rounded-[var(--radius)] border border-input text-sm',
      'transition-colors focus:outline-none',
      size === 'small' ? 'h-6 min-w-6 px-1.5 text-xs' : 'h-8 min-w-8 px-2',
      active
        ? 'bg-primary text-primary-foreground border-primary'
        : 'bg-background hover:bg-accent hover:text-accent-foreground',
      disabled && 'opacity-50 pointer-events-none'
    );

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      pages.push(i);
    }
    if (current < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className={cn('flex items-center flex-wrap gap-2', className)} style={style}>
      {showTotal && (
        <span className="text-sm text-muted-foreground mr-2">
          {showTotal(total, [rangeStart, rangeEnd])}
        </span>
      )}
      <div className="flex items-center gap-1">
        <button
          className={btnClass()}
          onClick={() => go(current - 1)}
          disabled={disabled || current <= 1}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="text-sm text-muted-foreground px-1">
              …
            </span>
          ) : (
            <button
              key={p}
              className={btnClass(p === current)}
              onClick={() => go(p as number)}
              disabled={disabled}
            >
              {p}
            </button>
          )
        )}
        <button
          className={btnClass()}
          onClick={() => go(current + 1)}
          disabled={disabled || current >= totalPages}
        >
          ›
        </button>
      </div>
    </div>
  );
};

// ── Slider ────────────────────────────────────────────────────────────────────
export interface SliderProps {
  value?: number | [number, number];
  defaultValue?: number | [number, number];
  onChange?: (value: number | [number, number]) => void;
  onAfterChange?: (value: number | [number, number]) => void;
  min?: number;
  max?: number;
  step?: number | null;
  marks?: Record<number, React.ReactNode | { label: React.ReactNode; style?: React.CSSProperties }>;
  disabled?: boolean;
  range?: boolean;
  reverse?: boolean;
  vertical?: boolean;
  included?: boolean;
  tooltip?:
    | {
        open?: boolean;
        placement?: string;
        formatter?: (value?: number) => React.ReactNode;
        getPopupContainer?: any;
      }
    | false;
  className?: string;
  style?: React.CSSProperties;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      onAfterChange,
      min = 0,
      max = 100,
      step = 1,
      marks,
      disabled,
      range,
      vertical,
      className,
      style,
    },
    ref
  ) => {
    const isRange = range || Array.isArray(defaultValue) || Array.isArray(value);
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<number[]>(
      Array.isArray(defaultValue)
        ? defaultValue
        : defaultValue !== undefined
          ? [defaultValue]
          : [min]
    );

    const currentArr: number[] = isControlled
      ? Array.isArray(value)
        ? (value as [number, number])
        : [value as number]
      : internal;

    const handleChange = (vals: number[]) => {
      if (!isControlled) setInternal(vals);
      const out = isRange ? (vals as [number, number]) : vals[0];
      onChange?.(out);
    };

    const markEntries = marks ? Object.entries(marks).map(([k, v]) => [Number(k), v] as const) : [];

    return (
      <div className={cn('relative', vertical && 'flex flex-col h-full', className)} style={style}>
        <SliderPrimitive.Root
          ref={ref}
          min={min}
          max={max}
          step={step ?? undefined}
          value={currentArr}
          onValueChange={handleChange}
          onValueCommit={(vals) => {
            const out = isRange ? (vals as [number, number]) : vals[0];
            onAfterChange?.(out);
          }}
          disabled={disabled}
          orientation={vertical ? 'vertical' : 'horizontal'}
          className={cn(
            'relative flex touch-none select-none items-center',
            vertical ? 'flex-col w-4 h-full' : 'flex-row w-full h-4'
          )}
        >
          <SliderPrimitive.Track
            className={cn(
              'relative grow overflow-hidden rounded-full bg-muted',
              vertical ? 'w-1.5 h-full' : 'h-1.5 w-full'
            )}
          >
            <SliderPrimitive.Range className="absolute bg-primary rounded-full h-full w-full" />
          </SliderPrimitive.Track>
          {currentArr.map((_, i) => (
            <SliderPrimitive.Thumb
              key={i}
              className={cn(
                'block h-4 w-4 rounded-full border-2 border-primary bg-background shadow',
                'ring-offset-background transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                'hover:border-primary/80'
              )}
            />
          ))}
        </SliderPrimitive.Root>

        {markEntries.length > 0 && (
          <div className="relative mt-1">
            {markEntries.map(([pos, label]) => {
              const pct = ((pos - min) / (max - min)) * 100;
              const isLabel = label && typeof label === 'object' && 'label' in (label as any);
              const text = isLabel ? (label as any).label : label;
              return (
                <div
                  key={pos}
                  className="absolute -translate-x-1/2 text-xs text-muted-foreground"
                  style={{ left: `${pct}%` }}
                >
                  {text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
Slider.displayName = 'Slider';

// ── Timeline ──────────────────────────────────────────────────────────────────
export interface TimelineItem {
  key?: string | number;
  dot?: React.ReactNode;
  color?: string;
  label?: React.ReactNode;
  children?: React.ReactNode;
  pending?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface TimelineProps {
  items?: TimelineItem[];
  mode?: 'left' | 'alternate' | 'right';
  pending?: React.ReactNode | boolean;
  pendingDot?: React.ReactNode;
  reverse?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function getDotColor(color?: string) {
  switch (color) {
    case 'green':
      return 'bg-green-500 border-green-500';
    case 'red':
      return 'bg-red-500 border-red-500';
    case 'blue':
      return 'bg-blue-500 border-blue-500';
    case 'gray':
      return 'bg-gray-400 border-gray-400';
    case 'purple':
      return 'bg-purple-500 border-purple-500';
    case 'orange':
      return 'bg-orange-500 border-orange-500';
    case 'cyan':
      return 'bg-cyan-500 border-cyan-500';
    default:
      return color ? '' : 'bg-primary border-primary';
  }
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  mode = 'left',
  pending,
  pendingDot,
  reverse,
  className,
  style,
  children,
}) => {
  let resolvedItems: TimelineItem[] =
    items ?? React.Children.map(children, (child: any) => child?.props as TimelineItem) ?? [];

  if (reverse) resolvedItems = [...resolvedItems].reverse();

  if (pending) {
    resolvedItems = [
      ...resolvedItems,
      {
        key: '__pending__',
        dot: pendingDot ?? (
          <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground animate-pulse" />
        ),
        children: typeof pending === 'boolean' ? null : pending,
      },
    ];
  }

  return (
    <div className={cn('relative', className)} style={style}>
      {resolvedItems.map((item, index) => {
        const isLast = index === resolvedItems.length - 1;
        const dotColor = getDotColor(item.color);

        return (
          <div
            key={item.key ?? index}
            className={cn('flex gap-4', mode === 'right' && 'flex-row-reverse', item.className)}
            style={item.style}
          >
            {/* Dot column */}
            <div className="flex flex-col items-center shrink-0 w-6">
              <div
                className={cn(
                  'relative z-10 flex items-center justify-center',
                  item.dot
                    ? 'w-6 h-6'
                    : cn(
                        'w-3 h-3 rounded-full border-2 mt-1',
                        dotColor,
                        item.color && !dotColor.includes('bg-') && `bg-current border-current`
                      )
                )}
                style={
                  item.color &&
                  !['green', 'red', 'blue', 'gray', 'purple', 'orange', 'cyan'].includes(item.color)
                    ? { color: item.color }
                    : undefined
                }
              >
                {item.dot}
              </div>
              {!isLast && <div className="flex-1 w-px bg-border mt-1 min-h-4" />}
            </div>

            {/* Content */}
            <div className={cn('flex-1 pb-5 min-w-0', isLast && 'pb-0')}>
              {item.label && <div className="text-xs text-muted-foreground mb-1">{item.label}</div>}
              <div className="text-sm">{item.children}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
// Support legacy <Timeline.Item> children pattern
(Timeline as any).Item = () => null;

// ── App ───────────────────────────────────────────────────────────────────────
interface AppContextValue {
  message: typeof message;
  notification: typeof notification;
  modal: {
    confirm: (config: any) => void;
    info: (config: any) => void;
    success: (config: any) => void;
    warning: (config: any) => void;
    error: (config: any) => void;
  };
}

const AppContext = React.createContext<AppContextValue>({
  message,
  notification,
  modal: {
    confirm: () => {},
    info: () => {},
    success: () => {},
    warning: () => {},
    error: () => {},
  },
});

const AppRoot: React.FC<{ children?: React.ReactNode; [key: string]: any }> = ({ children }) => (
  <AppContext.Provider
    value={{
      message,
      notification,
      modal: {
        confirm: () => {},
        info: () => {},
        success: () => {},
        warning: () => {},
        error: () => {},
      },
    }}
  >
    {children}
  </AppContext.Provider>
);

AppRoot.displayName = 'App';

export const App = Object.assign(AppRoot, {
  useApp: () => React.useContext(AppContext),
});

// ── ConfigProvider ────────────────────────────────────────────────────────────
// Thin wrapper — antd theming is now done via CSS variables; just renders children.
export const ConfigProvider: React.FC<{ children?: React.ReactNode; [key: string]: any }> = ({
  children,
}) => <>{children}</>;
ConfigProvider.displayName = 'ConfigProvider';
