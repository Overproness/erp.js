import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Accordion as ShadcnAccordion,
} from '@/components/ui/accordion';
import {
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  Card as ShadcnCard,
} from '@/components/ui/card';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { RadioGroupItem, RadioGroup as ShadcnRadioGroup } from '@/components/ui/radio-group';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import { Tabs as ShadcnTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

// ── Checkbox ──────────────────────────────────────────────────────────────────
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (e: { target: { checked: boolean } }) => void;
  value?: string | number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
}

const CheckboxBase = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  (
    { checked, defaultChecked, disabled, onChange, value, children, className, style, id, name },
    ref
  ) => {
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const controlled = checked !== undefined;
    const isChecked = controlled ? checked! : internal;
    const checkId = id ?? React.useId();

    const handleChange = (v: boolean) => {
      if (!controlled) setInternal(v);
      onChange?.({ target: { checked: v } });
    };

    return (
      <span className={cn('inline-flex items-center gap-2', className)} style={style}>
        <ShadcnCheckbox
          ref={ref}
          id={checkId}
          checked={isChecked}
          defaultChecked={!controlled ? defaultChecked : undefined}
          disabled={disabled}
          onCheckedChange={handleChange}
          value={String(value ?? '')}
          name={name}
        />
        {children && (
          <Label
            htmlFor={checkId}
            className={cn('cursor-pointer font-normal', disabled && 'opacity-50')}
          >
            {children}
          </Label>
        )}
      </span>
    );
  }
);
CheckboxBase.displayName = 'Checkbox';

// Checkbox.Group
interface CheckboxGroupProps {
  options?: Array<
    string | number | { label: React.ReactNode; value: string | number; disabled?: boolean }
  >;
  value?: Array<string | number>;
  defaultValue?: Array<string | number>;
  onChange?: (checkedValues: Array<string | number>) => void;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  value,
  defaultValue = [],
  onChange,
  disabled,
  className,
  style,
  children,
}) => {
  const [internal, setInternal] = React.useState<Array<string | number>>(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value! : internal;

  const toggle = (v: string | number, checked: boolean) => {
    const next = checked ? [...current, v] : current.filter((x) => x !== v);
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  if (options) {
    return (
      <span className={cn('inline-flex flex-wrap gap-3', className)} style={style}>
        {options.map((opt) => {
          const item = typeof opt === 'object' ? opt : { label: opt, value: opt };
          return (
            <CheckboxBase
              key={String(item.value)}
              checked={current.includes(item.value)}
              disabled={disabled || item.disabled}
              onChange={(e) => toggle(item.value, e.target.checked)}
              value={item.value}
            >
              {item.label}
            </CheckboxBase>
          );
        })}
      </span>
    );
  }

  return (
    <span className={cn('inline-flex flex-wrap gap-3', className)} style={style}>
      {children}
    </span>
  );
};
CheckboxGroup.displayName = 'Checkbox.Group';

export const Checkbox = Object.assign(CheckboxBase, { Group: CheckboxGroup });

// ── Switch ────────────────────────────────────────────────────────────────────
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean, event: React.MouseEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'default' | 'small';
  checkedChildren?: React.ReactNode;
  unCheckedChildren?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, defaultChecked, onChange, disabled, loading, size, className, style, id }, ref) => {
    const [internal, setInternal] = React.useState(defaultChecked ?? false);
    const controlled = checked !== undefined;
    const isChecked = controlled ? checked! : internal;

    const handleChange = (v: boolean) => {
      if (!controlled) setInternal(v);
      onChange?.(v, {} as any);
    };

    return (
      <ShadcnSwitch
        ref={ref}
        id={id}
        checked={isChecked}
        onCheckedChange={handleChange}
        disabled={disabled || loading}
        className={cn(size === 'small' && 'h-4 w-8', className)}
        style={style}
      />
    );
  }
);
Switch.displayName = 'Switch';

// ── Radio ─────────────────────────────────────────────────────────────────────
export interface RadioProps {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (e: { target: { checked: boolean; value: any } }) => void;
  value?: any;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const RadioBase = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ checked, defaultChecked, disabled, onChange, value, children, className, style }, ref) => {
    const radioId = React.useId();
    return (
      <span className={cn('inline-flex items-center gap-2', className)} style={style}>
        <RadioGroupItem
          ref={ref}
          id={radioId}
          value={String(value ?? '')}
          disabled={disabled}
          checked={checked}
          onClick={() => onChange?.({ target: { checked: true, value } })}
        />
        {children && (
          <Label
            htmlFor={radioId}
            className={cn('cursor-pointer font-normal', disabled && 'opacity-50')}
          >
            {children}
          </Label>
        )}
      </span>
    );
  }
);
RadioBase.displayName = 'Radio';

// Radio.Group
interface RadioGroupProps {
  value?: any;
  defaultValue?: any;
  onChange?: (e: { target: { value: any } }) => void;
  disabled?: boolean;
  options?: Array<string | number | { label: React.ReactNode; value: any; disabled?: boolean }>;
  optionType?: 'default' | 'button';
  buttonStyle?: 'outline' | 'solid';
  size?: 'large' | 'middle' | 'small';
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  name?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  defaultValue,
  onChange,
  disabled,
  options,
  optionType,
  className,
  style,
  children,
  name,
}) => {
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? String(value ?? '') : String(internal ?? '');

  const handleChange = (v: string) => {
    if (!controlled) setInternal(v);
    onChange?.({ target: { value: v } });
  };

  return (
    <ShadcnRadioGroup
      value={current}
      onValueChange={handleChange}
      disabled={disabled}
      className={cn('flex flex-wrap gap-3', className)}
      style={style}
      name={name}
    >
      {options
        ? options.map((opt) => {
            const item = typeof opt === 'object' ? opt : { label: opt, value: opt };
            const itemId = React.useId();
            return (
              <span key={String(item.value)} className="inline-flex items-center gap-1.5">
                <RadioGroupItem
                  id={itemId}
                  value={String(item.value)}
                  disabled={disabled || item.disabled}
                />
                <Label htmlFor={itemId} className="cursor-pointer font-normal">
                  {item.label}
                </Label>
              </span>
            );
          })
        : children}
    </ShadcnRadioGroup>
  );
};
RadioGroup.displayName = 'Radio.Group';

const RadioButton = React.forwardRef<HTMLButtonElement, RadioProps>(
  ({ value, disabled, children, className }, ref) => {
    const btnId = React.useId();
    return (
      <span className="inline-flex">
        <RadioGroupItem
          ref={ref}
          id={btnId}
          value={String(value ?? '')}
          disabled={disabled}
          className="sr-only"
        />
        <Label
          htmlFor={btnId}
          className={cn(
            'cursor-pointer px-3 py-1.5 text-sm border border-input rounded-md hover:bg-accent transition-colors',
            'has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
        >
          {children}
        </Label>
      </span>
    );
  }
);
RadioButton.displayName = 'Radio.Button';

export const Radio = Object.assign(RadioBase, { Group: RadioGroup, Button: RadioButton });

// ── Progress ──────────────────────────────────────────────────────────────────
export interface ProgressProps {
  percent?: number;
  status?: 'active' | 'exception' | 'success' | 'normal';
  type?: 'line' | 'circle' | 'dashboard';
  showInfo?: boolean;
  format?: (percent?: number, successPercent?: number) => React.ReactNode;
  strokeColor?: string | Record<string, string>;
  trailColor?: string;
  strokeWidth?: number;
  strokeLinecap?: 'round' | 'square';
  size?: 'default' | 'small' | number | [number, number];
  success?: { percent?: number; strokeColor?: string };
  gapDegree?: number;
  gapPosition?: 'top' | 'bottom' | 'left' | 'right';
  steps?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Progress: React.FC<ProgressProps> = ({
  percent = 0,
  status,
  type = 'line',
  showInfo = true,
  format,
  strokeColor,
  size,
  className,
  style,
}) => {
  const color =
    status === 'exception'
      ? 'hsl(var(--destructive))'
      : status === 'success'
        ? '#52c41a'
        : typeof strokeColor === 'string'
          ? strokeColor
          : undefined;

  const label = format
    ? format(percent)
    : status === 'exception'
      ? '✕'
      : status === 'success'
        ? '✓'
        : `${percent}%`;

  if (type === 'circle' || type === 'dashboard') {
    const r = 44;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const dim = typeof size === 'number' ? size : 120;

    return (
      <div
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: dim, height: dim, ...style }}
      >
        <svg width={dim} height={dim} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={color ?? 'var(--primary)'}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.3s ease' }}
          />
        </svg>
        {showInfo && <span className="absolute text-sm font-medium">{label}</span>}
      </div>
    );
  }

  const h =
    typeof size === 'number' ? size : Array.isArray(size) ? size[1] : size === 'small' ? 6 : 8;

  return (
    <div className={cn('flex items-center gap-2', className)} style={style}>
      <div className="flex-1 overflow-hidden rounded-full bg-muted" style={{ height: h }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, percent))}%`,
            backgroundColor: color ?? 'var(--primary)',
          }}
        />
      </div>
      {showInfo && <span className="text-xs text-muted-foreground shrink-0">{label}</span>}
    </div>
  );
};

// ── Collapse (→ Accordion) ────────────────────────────────────────────────────
export interface CollapseItem {
  key: string;
  label?: React.ReactNode;
  header?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  extra?: React.ReactNode;
  showArrow?: boolean;
}

export interface CollapseProps {
  items?: CollapseItem[];
  activeKey?: string | string[];
  defaultActiveKey?: string | string[];
  accordion?: boolean;
  bordered?: boolean;
  collapsible?: 'header' | 'icon' | 'disabled';
  destroyInactivePanel?: boolean;
  expandIcon?: (props: any) => React.ReactNode;
  expandIconPosition?: 'start' | 'end';
  ghost?: boolean;
  onChange?: (key: string | string[]) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Collapse: React.FC<CollapseProps> & {
  Panel: React.FC<CollapseItem & { children?: React.ReactNode }>;
} = ({
  items,
  activeKey,
  defaultActiveKey,
  accordion,
  bordered = true,
  ghost,
  onChange,
  className,
  style,
  children,
}) => {
  const controlled = activeKey !== undefined;
  const defaultVal = defaultActiveKey
    ? Array.isArray(defaultActiveKey)
      ? defaultActiveKey
      : [defaultActiveKey]
    : [];
  const [internal, setInternal] = React.useState<string[]>(defaultVal);
  const current = controlled
    ? Array.isArray(activeKey)
      ? (activeKey as string[])
      : [activeKey as string]
    : internal;

  const handleChange = (v: string | string[]) => {
    const next = Array.isArray(v) ? v : [v];
    if (!controlled) setInternal(next);
    onChange?.(accordion ? next[0] ?? '' : next);
  };

  const resolvedItems = items ?? React.Children.map(children, (child: any) => child?.props) ?? [];

  if (!resolvedItems?.length) return null;

  return (
    <ShadcnAccordion
      type={accordion ? 'single' : 'multiple'}
      value={accordion ? current[0] ?? '' : (current as any)}
      onValueChange={handleChange as any}
      className={cn(
        bordered && !ghost && 'border border-border rounded-md overflow-hidden',
        ghost && 'border-0',
        className
      )}
      style={style}
    >
      {resolvedItems.map((item: CollapseItem) => (
        <AccordionItem
          key={item.key}
          value={item.key}
          className={cn(
            bordered && !ghost && 'border-b last:border-b-0',
            item.disabled && 'opacity-50 pointer-events-none'
          )}
          disabled={item.disabled}
        >
          <AccordionTrigger className={cn('px-4', ghost && 'px-0')}>
            <div className="flex items-center justify-between w-full">
              <span>{item.label ?? item.header}</span>
              {item.extra && <span onClick={(e) => e.stopPropagation()}>{item.extra}</span>}
            </div>
          </AccordionTrigger>
          <AccordionContent className={cn('px-4', ghost && 'px-0')}>
            {item.children}
          </AccordionContent>
        </AccordionItem>
      ))}
    </ShadcnAccordion>
  );
};
Collapse.Panel = ({ key, label, header, children, extra, disabled, className }: any) => null;
Collapse.Panel.displayName = 'Collapse.Panel';

// ── Tabs ──────────────────────────────────────────────────────────────────────
export interface TabItem {
  key: string;
  label?: React.ReactNode;
  tab?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  closable?: boolean;
  forceRender?: boolean;
}

export interface TabsProps {
  items?: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  onTabClick?: (key: string, e: React.MouseEvent) => void;
  type?: 'line' | 'card' | 'editable-card';
  tabPosition?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'large' | 'default' | 'small';
  tabBarExtraContent?: React.ReactNode | { left?: React.ReactNode; right?: React.ReactNode };
  tabBarStyle?: React.CSSProperties;
  tabBarGutter?: number;
  centered?: boolean;
  destroyInactiveTabPane?: boolean;
  hideAdd?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Tabs: React.FC<TabsProps> & {
  TabPane: React.FC<TabItem & { children?: React.ReactNode; tab?: React.ReactNode }>;
} = ({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  onTabClick,
  type,
  tabPosition = 'top',
  centered,
  tabBarExtraContent,
  className,
  style,
  children,
}) => {
  const resolvedItems: TabItem[] =
    items ??
    React.Children.map(children, (child: any) => ({
      key: child?.props?.tab ?? child?.props?.key ?? child?.key,
      label: child?.props?.tab ?? child?.props?.label,
      children: child?.props?.children,
      disabled: child?.props?.disabled,
    })) ??
    [];

  const extraRight =
    tabBarExtraContent &&
    typeof tabBarExtraContent === 'object' &&
    !React.isValidElement(tabBarExtraContent)
      ? (tabBarExtraContent as any).right
      : tabBarExtraContent;
  const extraLeft =
    tabBarExtraContent &&
    typeof tabBarExtraContent === 'object' &&
    !React.isValidElement(tabBarExtraContent)
      ? (tabBarExtraContent as any).left
      : null;

  return (
    <ShadcnTabs
      defaultValue={defaultActiveKey ?? resolvedItems[0]?.key}
      value={activeKey}
      onValueChange={(v) => {
        onChange?.(v);
      }}
      className={cn(
        tabPosition === 'left' || tabPosition === 'right' ? 'flex' : 'flex flex-col',
        className
      )}
      style={style}
    >
      <div
        className={cn(
          'flex items-center',
          tabPosition === 'left' && 'flex-col mr-4',
          tabPosition === 'right' && 'flex-col ml-4 order-last'
        )}
      >
        {extraLeft && <div className="mr-2">{extraLeft}</div>}
        <TabsList className={cn(centered && 'mx-auto', type === 'card' && 'rounded-b-none')}>
          {resolvedItems.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              disabled={item.disabled}
              onClick={(e) => onTabClick?.(item.key, e)}
            >
              {item.icon && <span className="mr-1.5">{item.icon}</span>}
              {item.label ?? item.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        {extraRight && <div className="ml-auto">{extraRight}</div>}
      </div>
      {resolvedItems.map((item) => (
        <TabsContent key={item.key} value={item.key} className="flex-1">
          {item.children}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
};

Tabs.TabPane = ({ children }: any) => <>{children}</>;
Tabs.TabPane.displayName = 'Tabs.TabPane';

// ── Dropdown ──────────────────────────────────────────────────────────────────
interface MenuItemDef {
  key?: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  type?: 'divider' | 'group' | 'item' | 'submenu';
  children?: MenuItemDef[];
  onClick?: (info: { key: string; domEvent: React.MouseEvent }) => void;
  title?: string;
}

export interface DropdownProps {
  menu?: {
    items?: MenuItemDef[];
    onClick?: (info: { key: string }) => void;
    selectable?: boolean;
    selectedKeys?: string[];
  };
  trigger?: Array<'click' | 'hover' | 'contextMenu'>;
  placement?: string;
  children?: React.ReactNode;
  open?: boolean;
  visible?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  destroyPopupOnHide?: boolean;
  overlay?: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  arrow?: boolean;
  getPopupContainer?: any;
  autoFocus?: boolean;
  dropdownRender?: (menu: React.ReactNode) => React.ReactNode;
}

function renderMenuItems(
  items: MenuItemDef[],
  globalOnClick?: (info: { key: string }) => void
): React.ReactNode {
  return items.map((item, i) => {
    if (item.type === 'divider' || (!item.label && !item.key)) {
      return <DropdownMenuSeparator key={item.key ?? i} />;
    }
    if (item.type === 'group') {
      return (
        <DropdownMenuGroup key={item.key ?? i}>
          {item.label && <DropdownMenuLabel>{item.label}</DropdownMenuLabel>}
          {item.children && renderMenuItems(item.children, globalOnClick)}
        </DropdownMenuGroup>
      );
    }
    if (item.children?.length) {
      return (
        <DropdownMenuSub key={item.key ?? i}>
          <DropdownMenuSubTrigger disabled={item.disabled}>
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {renderMenuItems(item.children, globalOnClick)}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      );
    }
    return (
      <DropdownMenuItem
        key={item.key ?? i}
        disabled={item.disabled}
        className={cn(item.danger && 'text-destructive focus:text-destructive')}
        onClick={(e) => {
          item.onClick?.({ key: String(item.key ?? ''), domEvent: e as any });
          globalOnClick?.({ key: String(item.key ?? '') });
        }}
      >
        {item.icon && <span className="mr-2">{item.icon}</span>}
        {item.label}
      </DropdownMenuItem>
    );
  });
}

export const Dropdown: React.FC<DropdownProps> & {
  Button: React.FC<DropdownProps & { size?: string; type?: string }>;
} = ({
  menu,
  children,
  open,
  visible,
  onOpenChange,
  disabled,
  overlayClassName,
  overlayStyle,
  dropdownRender,
}) => {
  const isControlled = open !== undefined || visible !== undefined;
  const isOpen = open ?? visible;

  const menuContent = (
    <DropdownMenuContent className={cn(overlayClassName)} style={overlayStyle}>
      {menu?.items && renderMenuItems(menu.items, menu.onClick)}
    </DropdownMenuContent>
  );

  return (
    <DropdownMenu open={isControlled ? isOpen : undefined} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        {children}
      </DropdownMenuTrigger>
      {dropdownRender ? (dropdownRender(menuContent) as any) : menuContent}
    </DropdownMenu>
  );
};

Dropdown.Button = ({
  children,
  menu,
  disabled,
  overlayClassName,
  overlayStyle,
  dropdownRender,
  type,
  size,
  ...rest
}: any) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild disabled={disabled}>
      <span className="inline-flex">
        {children}
        <button
          className="border-l border-input px-1.5 inline-flex items-center"
          disabled={disabled}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </span>
    </DropdownMenuTrigger>
    <DropdownMenuContent className={cn(overlayClassName)} style={overlayStyle}>
      {menu?.items && renderMenuItems(menu.items, menu.onClick)}
    </DropdownMenuContent>
  </DropdownMenu>
);

// ── Card ──────────────────────────────────────────────────────────────────────
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  bordered?: boolean;
  hoverable?: boolean;
  loading?: boolean;
  cover?: React.ReactNode;
  actions?: React.ReactNode[];
  type?: 'inner';
  size?: 'default' | 'small';
  headStyle?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  tabList?: Array<{ key: string; tab: string }>;
  activeTabKey?: string;
  defaultActiveTabKey?: string;
  onTabChange?: (key: string) => void;
  tabBarExtraContent?: React.ReactNode;
  tabProps?: object;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      title,
      extra,
      bordered = true,
      hoverable,
      loading,
      cover,
      actions,
      type,
      size,
      headStyle,
      bodyStyle,
      className,
      style,
      children,
      tabList,
      activeTabKey,
      defaultActiveTabKey,
      onTabChange,
      ...rest
    },
    ref
  ) => {
    const [activeTab, setActiveTab] = React.useState(defaultActiveTabKey ?? tabList?.[0]?.key);
    const currentTab = activeTabKey ?? activeTab;

    const padding = size === 'small' ? 'p-3' : 'p-5';

    return (
      <ShadcnCard
        ref={ref}
        className={cn(
          !bordered && 'border-0 shadow-none',
          hoverable && 'cursor-pointer transition-shadow hover:shadow-md',
          type === 'inner' && 'border-border/60 bg-muted/20',
          className
        )}
        style={style}
        {...rest}
      >
        {cover && (
          <div className="overflow-hidden rounded-t-[calc(var(--radius)+1px)]">{cover}</div>
        )}
        {(title || extra || tabList) && (
          <CardHeader
            className={cn(
              'flex-row items-center justify-between pb-0',
              size === 'small' ? 'px-3 pt-3' : 'px-5 pt-5'
            )}
            style={headStyle}
          >
            {title ? <CardTitle className="text-base font-semibold">{title}</CardTitle> : <div />}
            <div className="flex items-center gap-2">
              {tabList && (
                <div className="flex gap-1">
                  {tabList.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={cn(
                        'px-3 py-1 text-sm rounded-sm transition-colors',
                        currentTab === tab.key
                          ? 'bg-background border border-border shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                      onClick={() => {
                        setActiveTab(tab.key);
                        onTabChange?.(tab.key);
                      }}
                    >
                      {tab.tab}
                    </button>
                  ))}
                </div>
              )}
              {extra}
            </div>
          </CardHeader>
        )}
        <CardContent
          className={cn(padding, (title || extra || tabList) && 'pt-3')}
          style={bodyStyle}
        >
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-4 bg-muted rounded animate-pulse"
                  style={{ width: `${80 - n * 10}%` }}
                />
              ))}
            </div>
          ) : (
            children
          )}
        </CardContent>
        {actions && actions.length > 0 && (
          <CardFooter className="border-t border-border divide-x divide-border p-0">
            {actions.map((action, i) => (
              <div
                key={i}
                className="flex-1 flex items-center justify-center py-3 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {action}
              </div>
            ))}
          </CardFooter>
        )}
      </ShadcnCard>
    );
  }
);
Card.displayName = 'Card';
(Card as any).Grid = ({ children, className, hoverable, style }: any) => (
  <div
    className={cn(
      'border-r border-b border-border p-4',
      hoverable && 'hover:shadow-sm cursor-pointer',
      className
    )}
    style={style}
  >
    {children}
  </div>
);
(Card as any).Meta = ({ title, description, avatar, className }: any) => (
  <div className={cn('flex items-start gap-3', className)}>
    {avatar && <div className="shrink-0">{avatar}</div>}
    <div>
      {title && <div className="font-medium text-sm">{title}</div>}
      {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
    </div>
  </div>
);
