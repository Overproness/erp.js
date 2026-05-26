import { AvatarFallback, AvatarImage, Avatar as ShadcnAvatar } from '@/components/ui/avatar';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import * as React from 'react';

// ── Typography ───────────────────────────────────────────────────────────────
const TITLE_SIZES: Record<number, string> = {
  1: 'text-4xl font-bold leading-tight',
  2: 'text-3xl font-bold leading-tight',
  3: 'text-2xl font-semibold leading-snug',
  4: 'text-xl font-semibold leading-snug',
  5: 'text-base font-semibold',
};

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5;
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  delete?: boolean;
  underline?: boolean;
  italic?: boolean;
  copyable?: boolean;
}

const Title = React.forwardRef<HTMLHeadingElement, TitleProps>(
  (
    { level = 1, type, disabled, delete: del, underline, italic, className, children, ...rest },
    ref
  ) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;
    return (
      <Tag
        ref={ref as any}
        className={cn(
          TITLE_SIZES[level],
          'text-foreground',
          type === 'secondary' && 'text-muted-foreground',
          type === 'success' && 'text-green-600',
          type === 'warning' && 'text-yellow-600',
          type === 'danger' && 'text-destructive',
          disabled && 'opacity-40 cursor-not-allowed',
          del && 'line-through',
          underline && 'underline',
          italic && 'italic',
          className
        )}
        {...rest}
      >
        {children}
      </Tag>
    );
  }
);
Title.displayName = 'Typography.Title';

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  italic?: boolean;
  underline?: boolean;
  delete?: boolean;
  code?: boolean;
  copyable?: boolean;
  disabled?: boolean;
  mark?: boolean;
  keyboard?: boolean;
  ellipsis?: boolean;
}

const Text = React.forwardRef<HTMLSpanElement, TextProps>(
  (
    {
      type,
      strong,
      italic,
      underline,
      delete: del,
      code,
      disabled,
      mark,
      keyboard,
      ellipsis,
      className,
      children,
      ...rest
    },
    ref
  ) => (
    <span
      ref={ref}
      className={cn(
        'text-foreground',
        type === 'secondary' && 'text-muted-foreground',
        type === 'success' && 'text-green-600',
        type === 'warning' && 'text-yellow-600',
        type === 'danger' && 'text-destructive',
        strong && 'font-semibold',
        italic && 'italic',
        underline && 'underline',
        del && 'line-through',
        code && 'font-mono bg-muted px-1 py-0.5 rounded text-sm',
        mark && 'bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded',
        keyboard && 'font-mono border border-border rounded px-1 text-xs',
        disabled && 'opacity-40 cursor-not-allowed',
        ellipsis && 'truncate',
        className
      )}
      {...rest}
    >
      {children}
    </span>
  )
);
Text.displayName = 'Typography.Text';

interface ParagraphProps extends React.HTMLAttributes<HTMLParagraphElement> {
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  strong?: boolean;
  disabled?: boolean;
  delete?: boolean;
  underline?: boolean;
  italic?: boolean;
  copyable?: boolean;
  ellipsis?: boolean | { rows?: number };
}

const Paragraph = React.forwardRef<HTMLParagraphElement, ParagraphProps>(
  (
    {
      type,
      strong,
      disabled,
      delete: del,
      underline,
      italic,
      ellipsis,
      className,
      children,
      ...rest
    },
    ref
  ) => (
    <p
      ref={ref}
      className={cn(
        'leading-relaxed text-foreground',
        type === 'secondary' && 'text-muted-foreground',
        type === 'success' && 'text-green-600',
        type === 'warning' && 'text-yellow-600',
        type === 'danger' && 'text-destructive',
        strong && 'font-semibold',
        italic && 'italic',
        del && 'line-through',
        underline && 'underline',
        disabled && 'opacity-40',
        typeof ellipsis === 'boolean' && ellipsis && 'truncate',
        className
      )}
      {...rest}
    >
      {children}
    </p>
  )
);
Paragraph.displayName = 'Typography.Paragraph';

interface TypographyLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  type?: 'secondary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}
const Link = React.forwardRef<HTMLAnchorElement, TypographyLinkProps>(
  ({ type, disabled, className, children, ...rest }, ref) => (
    <a
      ref={ref}
      className={cn(
        'text-primary underline-offset-4 hover:underline cursor-pointer',
        type === 'secondary' && 'text-muted-foreground',
        type === 'danger' && 'text-destructive',
        disabled && 'pointer-events-none opacity-40',
        className
      )}
      {...rest}
    >
      {children}
    </a>
  )
);
Link.displayName = 'Typography.Link';

const TypographyRoot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-foreground', className)} {...props} />
  )
);
TypographyRoot.displayName = 'Typography';

export const Typography = Object.assign(TypographyRoot, { Title, Text, Paragraph, Link });

// ── Tag ───────────────────────────────────────────────────────────────────────
const TAG_PRESET: Record<string, string> = {
  red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  orange:
    'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
  yellow:
    'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  gold: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  green: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400',
  blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  purple:
    'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  magenta: 'bg-pink-100 text-pink-700 border-pink-200',
  volcano: 'bg-red-100 text-red-700 border-red-200',
  geekblue: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  lime: 'bg-lime-100 text-lime-700 border-lime-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  processing: 'bg-blue-100 text-blue-700 border-blue-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  default: 'bg-muted text-muted-foreground border-border',
};

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: string;
  closable?: boolean;
  onClose?: (e: React.MouseEvent<HTMLElement>) => void;
  icon?: React.ReactNode;
  bordered?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  (
    { color, closable, onClose, icon, bordered = true, className, children, style, ...rest },
    ref
  ) => {
    const presetClass = color && TAG_PRESET[color];
    const inlineStyle =
      color && !TAG_PRESET[color]
        ? { backgroundColor: `${color}20`, color, borderColor: `${color}40`, ...style }
        : style;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-xs font-medium leading-none',
          presetClass || TAG_PRESET.default,
          !bordered && 'border-transparent',
          className
        )}
        style={inlineStyle}
        {...rest}
      >
        {icon && <span className="inline-flex">{icon}</span>}
        {children}
        {closable && (
          <button type="button" className="ml-0.5 inline-flex hover:opacity-70" onClick={onClose}>
            <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
              <path d="M8.5 3.5L6 6l-2.5-2.5-.7.7L5.3 6 2.8 8.5l.7.7L6 6.7l2.5 2.5.7-.7L6.7 6l2.5-2.5z" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);
Tag.displayName = 'Tag';

// CheckableTag
Tag.CheckableTag = Object.assign(
  ({ checked, onChange, children, className }: any) => (
    <span
      className={cn(
        'cursor-pointer rounded-sm px-2 py-0.5 text-xs transition-colors',
        checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
        className
      )}
      onClick={() => onChange?.(!checked)}
    >
      {children}
    </span>
  ),
  { displayName: 'Tag.CheckableTag' }
) as any;

// ── Badge ────────────────────────────────────────────────────────────────────
const STATUS_DOT: Record<string, string> = {
  success: 'bg-green-500',
  processing: 'bg-blue-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  default: 'bg-muted-foreground',
};

export interface BadgeProps {
  count?: number | React.ReactNode;
  dot?: boolean;
  color?: string;
  status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  text?: React.ReactNode;
  overflowCount?: number;
  showZero?: boolean;
  size?: 'default' | 'small';
  offset?: [number, number];
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// ── Badge.Ribbon ─────────────────────────────────────────────────────────────
interface BadgeRibbonProps {
  text?: React.ReactNode;
  color?: string;
  placement?: 'start' | 'end';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const BadgeRibbon: React.FC<BadgeRibbonProps> = ({
  text,
  color = '#1677ff',
  placement = 'end',
  children,
  className,
  style,
}) => {
  if (!text) return <>{children}</>;
  return (
    <div className={cn('relative', className)} style={style}>
      {children}
      <div
        className={cn(
          'absolute top-2 z-10 px-2 py-0.5 text-xs font-medium text-white shadow-sm',
          placement === 'end' ? '-right-1' : '-left-1'
        )}
        style={{
          backgroundColor: color,
          borderRadius: placement === 'end' ? '4px 4px 0 4px' : '4px 4px 4px 0',
          lineHeight: '20px',
        }}
      >
        {text}
        <span
          className="absolute bottom-[-6px]"
          style={{
            [placement === 'end' ? 'right' : 'left']: 0,
            borderStyle: 'solid',
            borderWidth: placement === 'end' ? '3px 0 3px 3px' : '3px 3px 3px 0',
            borderColor:
              placement === 'end'
                ? `transparent transparent transparent ${color}`
                : `transparent ${color} transparent transparent`,
            filter: 'brightness(0.7)',
          }}
        />
      </div>
    </div>
  );
};

const BadgeBase: React.FC<BadgeProps> = ({
  count,
  dot,
  color,
  status,
  text,
  overflowCount = 99,
  showZero = false,
  size,
  offset,
  className,
  style,
  children,
}) => {
  if (status && !children) {
    return (
      <span className={cn('inline-flex items-center gap-1.5', className)} style={style}>
        <span
          className={cn(
            'inline-block h-2 w-2 rounded-full',
            STATUS_DOT[status] ?? 'bg-muted-foreground',
            status === 'processing' && 'animate-pulse'
          )}
          style={color ? { backgroundColor: color } : undefined}
        />
        {text && <span className="text-sm">{text}</span>}
      </span>
    );
  }

  const displayCount =
    typeof count === 'number' && count > overflowCount ? `${overflowCount}+` : count;
  const showBadge = dot || (count !== undefined && (showZero || (count as number) > 0));

  if (!children) {
    if (!showBadge) return null;
    return (
      <ShadcnBadge
        className={cn(color && 'border-transparent', className)}
        style={color ? { backgroundColor: color, color: '#fff', ...style } : style}
        variant="default"
      >
        {dot ? null : displayCount}
      </ShadcnBadge>
    );
  }

  return (
    <span className={cn('relative inline-flex', className)} style={style}>
      {children}
      {showBadge && (
        <span
          className={cn(
            'absolute flex items-center justify-center rounded-full text-white text-xs font-medium',
            dot
              ? 'h-2 w-2 min-w-0 p-0'
              : size === 'small'
                ? 'h-4 min-w-4 px-1 text-[10px]'
                : 'h-5 min-w-5 px-1',
            'bg-destructive -top-1 -right-1',
            color && 'bg-[var(--badge-color)]'
          )}
          style={
            color
              ? ({
                  '--badge-color': color,
                  ...(offset ? { transform: `translate(${offset[0]}px, ${-offset[1]}px)` } : {}),
                } as any)
              : offset
                ? { transform: `translate(${offset[0]}px, ${-offset[1]}px)` }
                : undefined
          }
        >
          {dot ? null : displayCount}
        </span>
      )}
    </span>
  );
};

export const Badge = Object.assign(BadgeBase, { Ribbon: BadgeRibbon });

// ── Avatar ───────────────────────────────────────────────────────────────────
export interface AvatarProps {
  src?: string | React.ReactNode;
  size?: number | 'large' | 'default' | 'small';
  shape?: 'circle' | 'square';
  icon?: React.ReactNode;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onError?: () => boolean;
}

const sizeMap = { large: 40, default: 32, small: 24 };

export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, size = 'default', shape = 'circle', icon, alt, className, style, children }, ref) => {
    const px = typeof size === 'number' ? size : sizeMap[size];
    return (
      <ShadcnAvatar
        className={cn(shape === 'square' && 'rounded-md', className)}
        style={{ width: px, height: px, ...style }}
      >
        {typeof src === 'string' ? <AvatarImage src={src} alt={alt} /> : null}
        <AvatarFallback
          className={cn(shape === 'square' && 'rounded-md')}
          style={{ width: px, height: px }}
        >
          {icon || children || (alt ? alt.charAt(0).toUpperCase() : '?')}
        </AvatarFallback>
      </ShadcnAvatar>
    );
  }
);
Avatar.displayName = 'Avatar';

// ── Spin ──────────────────────────────────────────────────────────────────────
export interface SpinProps {
  spinning?: boolean;
  tip?: React.ReactNode;
  size?: 'small' | 'default' | 'large';
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  indicator?: React.ReactNode;
}

const SpinnerSVG = ({ size = 'default' }: { size?: SpinProps['size'] }) => {
  const dim = size === 'large' ? 40 : size === 'small' ? 16 : 24;
  return (
    <svg
      className="animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width={dim}
      height={dim}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Spin: React.FC<SpinProps> = ({
  spinning = true,
  tip,
  size = 'default',
  children,
  indicator,
  className,
  style,
}) => {
  const spinEl = (
    <span className="inline-flex flex-col items-center gap-1">
      {indicator ?? <SpinnerSVG size={size} />}
      {tip && <span className="text-xs text-muted-foreground">{tip}</span>}
    </span>
  );

  if (children) {
    return (
      <div className={cn('relative', className)} style={style}>
        {children}
        {spinning && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 z-10 rounded">
            {spinEl}
          </div>
        )}
      </div>
    );
  }

  if (!spinning) return null;
  return (
    <div className={cn('flex items-center justify-center', className)} style={style}>
      {spinEl}
    </div>
  );
};

// ── Empty ─────────────────────────────────────────────────────────────────────
export interface EmptyProps {
  image?: React.ReactNode;
  imageStyle?: React.CSSProperties;
  description?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const DefaultEmptyIcon = () => (
  <svg className="opacity-20" width="64" height="41" viewBox="0 0 64 41" fill="currentColor">
    <g transform="translate(0 1)" fill="none" fillRule="evenodd">
      <ellipse cx="32" cy="33" rx="32" ry="7" fill="currentColor" opacity=".05" />
      <g fillRule="nonzero" stroke="currentColor">
        <path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z" />
        <path
          d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z"
          fill="currentColor"
          opacity=".8"
        />
      </g>
    </g>
  </svg>
);

export const Empty: React.FC<EmptyProps> & {
  PRESENTED_IMAGE_DEFAULT: string;
  PRESENTED_IMAGE_SIMPLE: string;
} = ({ image, imageStyle, description = 'No Data', className, style, children }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center py-10 text-muted-foreground',
      className
    )}
    style={style}
  >
    <div style={imageStyle}>{image !== null && (image ?? <DefaultEmptyIcon />)}</div>
    {description !== false && <p className="mt-3 text-sm">{description}</p>}
    {children && <div className="mt-3">{children}</div>}
  </div>
);
Empty.PRESENTED_IMAGE_DEFAULT = 'default';
Empty.PRESENTED_IMAGE_SIMPLE = 'simple';

// ── Statistic ─────────────────────────────────────────────────────────────────
export interface StatisticProps {
  title?: React.ReactNode;
  value?: number | string;
  precision?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  formatter?: (value: number | string | undefined) => React.ReactNode;
  valueStyle?: React.CSSProperties;
  groupSeparator?: string;
  decimalSeparator?: string;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const Statistic: React.FC<StatisticProps> = ({
  title,
  value,
  precision,
  prefix,
  suffix,
  formatter,
  valueStyle,
  groupSeparator = ',',
  loading = false,
  className,
  style,
}) => {
  const displayValue = React.useMemo(() => {
    if (formatter) return formatter(value);
    if (value === undefined || value === null) return '-';
    if (typeof value === 'number' && precision !== undefined) {
      return value.toFixed(precision).replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  }, [value, precision, formatter, groupSeparator]);

  return (
    <div className={cn('', className)} style={style}>
      {title && <div className="text-sm text-muted-foreground mb-1">{title}</div>}
      {loading ? (
        <Skeleton className="h-8 w-24" />
      ) : (
        <div className="text-2xl font-semibold text-foreground" style={valueStyle}>
          {prefix && <span className="mr-1">{prefix}</span>}
          {displayValue}
          {suffix && (
            <span className="ml-1 text-base font-normal text-muted-foreground">{suffix}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ── Descriptions ──────────────────────────────────────────────────────────────
export interface DescriptionsItemProps {
  label?: React.ReactNode;
  span?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export const DescriptionsItem: React.FC<DescriptionsItemProps> = ({ children }) => <>{children}</>;
DescriptionsItem.displayName = 'Descriptions.Item';

export interface DescriptionsProps {
  title?: React.ReactNode;
  extra?: React.ReactNode;
  bordered?: boolean;
  column?: number | Record<string, number>;
  size?: 'default' | 'middle' | 'small';
  layout?: 'horizontal' | 'vertical';
  colon?: boolean;
  labelStyle?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  items?: Array<{
    key?: string;
    label?: React.ReactNode;
    children?: React.ReactNode;
    span?: number;
    labelStyle?: React.CSSProperties;
    contentStyle?: React.CSSProperties;
  }>;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Descriptions: React.FC<DescriptionsProps> & { Item: typeof DescriptionsItem } = ({
  title,
  extra,
  bordered = false,
  size = 'default',
  colon = true,
  items,
  labelStyle,
  contentStyle,
  className,
  style,
  children,
}) => {
  const paddingClass =
    size === 'small' ? 'py-1 px-2' : size === 'middle' ? 'py-2 px-3' : 'py-3 px-4';

  const renderItems = () => {
    if (items) {
      return items.map((item, i) => (
        <div
          key={item.key ?? i}
          className={cn('flex', bordered && 'border-b border-border last:border-b-0')}
        >
          <dt
            className={cn(
              paddingClass,
              'font-medium text-muted-foreground text-sm w-2/5 shrink-0',
              bordered && 'bg-muted/50 border-r border-border'
            )}
            style={{ ...labelStyle, ...item.labelStyle }}
          >
            {item.label}
            {colon && item.label ? ':' : ''}
          </dt>
          <dd
            className={cn(paddingClass, 'text-sm flex-1')}
            style={{ ...contentStyle, ...item.contentStyle }}
          >
            {item.children}
          </dd>
        </div>
      ));
    }

    return React.Children.map(children, (child: any) => {
      if (!child) return null;
      const { label, children: content, labelStyle: lStyle, contentStyle: cStyle } = child.props;
      return (
        <div className={cn('flex', bordered && 'border-b border-border last:border-b-0')}>
          <dt
            className={cn(
              paddingClass,
              'font-medium text-muted-foreground text-sm w-2/5 shrink-0',
              bordered && 'bg-muted/50 border-r border-border'
            )}
            style={{ ...labelStyle, ...lStyle }}
          >
            {label}
            {colon && label ? ':' : ''}
          </dt>
          <dd className={cn(paddingClass, 'text-sm flex-1')} style={{ ...contentStyle, ...cStyle }}>
            {content}
          </dd>
        </div>
      );
    });
  };

  return (
    <div
      className={cn(
        'text-foreground',
        bordered && 'border border-border rounded-md overflow-hidden',
        className
      )}
      style={style}
    >
      {(title || extra) && (
        <div
          className={cn(
            'flex items-center justify-between',
            paddingClass,
            bordered && 'border-b border-border'
          )}
        >
          {title && <span className="font-semibold text-base">{title}</span>}
          {extra && <span>{extra}</span>}
        </div>
      )}
      <div>{renderItems()}</div>
    </div>
  );
};
Descriptions.Item = DescriptionsItem;

// ── List ──────────────────────────────────────────────────────────────────────
export interface ListItemMetaProps {
  avatar?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

const ListItemMeta: React.FC<ListItemMetaProps> = ({ avatar, title, description, className }) => (
  <div className={cn('flex items-start gap-3', className)}>
    {avatar && <div className="shrink-0">{avatar}</div>}
    <div className="min-w-0 flex-1">
      {title && <div className="font-medium text-sm leading-none mb-0.5">{title}</div>}
      {description && (
        <div className="text-xs text-muted-foreground leading-snug">{description}</div>
      )}
    </div>
  </div>
);
ListItemMeta.displayName = 'List.Item.Meta';

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  actions?: React.ReactNode[];
  extra?: React.ReactNode;
}

const ListItem = React.forwardRef<HTMLLIElement, ListItemProps>(
  ({ actions, extra, children, className, ...rest }, ref) => (
    <li
      ref={ref}
      className={cn(
        'flex items-start justify-between py-3 border-b border-border last:border-b-0',
        className
      )}
      {...rest}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {extra && <div className="ml-4 shrink-0">{extra}</div>}
      {actions && actions.length > 0 && (
        <div className="ml-4 shrink-0 flex items-center gap-2">
          {actions.map((action, i) => (
            <span key={i}>{action}</span>
          ))}
        </div>
      )}
    </li>
  )
);
ListItem.displayName = 'List.Item';
(ListItem as any).Meta = ListItemMeta;

export interface ListProps<T = any> {
  dataSource?: T[];
  renderItem?: (item: T, index: number) => React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  bordered?: boolean;
  size?: 'default' | 'large' | 'small';
  loading?: boolean;
  grid?: object;
  split?: boolean;
  pagination?: any;
  itemLayout?: 'horizontal' | 'vertical';
  locale?: { emptyText?: React.ReactNode };
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const List = Object.assign(
  <T extends any>({
    dataSource,
    renderItem,
    header,
    footer,
    bordered,
    loading,
    split = true,
    locale,
    className,
    style,
    children,
  }: ListProps<T>) => {
    const items = dataSource?.map((item, i) => renderItem?.(item, i));

    return (
      <div
        className={cn(
          'text-foreground',
          bordered && 'border border-border rounded-md overflow-hidden',
          className
        )}
        style={style}
      >
        {header && (
          <div className={cn('px-4 py-3', bordered && 'border-b border-border', 'font-medium')}>
            {header}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-8">
            <SpinnerSVG />
          </div>
        ) : dataSource?.length === 0 || (children === undefined && !dataSource?.length) ? (
          <Empty description={locale?.emptyText ?? 'No Data'} />
        ) : (
          <ul className={cn('divide-y-0', !split && 'space-y-0', bordered && 'px-4')}>
            {items ?? children}
          </ul>
        )}
        {footer && (
          <div className={cn('px-4 py-3', bordered && 'border-t border-border')}>{footer}</div>
        )}
      </div>
    );
  },
  { Item: ListItem }
) as unknown as (<T>(props: ListProps<T>) => JSX.Element) & {
  Item: typeof ListItem & { Meta: typeof ListItemMeta };
};

// ── Result ────────────────────────────────────────────────────────────────────
const RESULT_ICON: Record<string, { icon: React.ReactNode; color: string }> = {
  success: {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#f6ffed" />
        <path
          d="M22 36l10 10 18-20"
          stroke="#52c41a"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: 'text-green-600',
  },
  error: {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#fff2f0" />
        <path d="M24 24l24 24M48 24L24 48" stroke="#ff4d4f" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-destructive',
  },
  warning: {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#fffbe6" />
        <path d="M36 22v18M36 48v2" stroke="#faad14" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-yellow-600',
  },
  info: {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#e6f4ff" />
        <path d="M36 32v16M36 24v2" stroke="#1677ff" strokeWidth="4" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-blue-600',
  },
  '404': {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#f0f2f5" />
        <text x="36" y="42" textAnchor="middle" fill="#8c8c8c" fontSize="18" fontWeight="bold">
          404
        </text>
      </svg>
    ),
    color: 'text-muted-foreground',
  },
  '403': {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#f0f2f5" />
        <text x="36" y="42" textAnchor="middle" fill="#8c8c8c" fontSize="18" fontWeight="bold">
          403
        </text>
      </svg>
    ),
    color: 'text-muted-foreground',
  },
  '500': {
    icon: (
      <svg viewBox="0 0 72 72" fill="none" className="w-16 h-16">
        <circle cx="36" cy="36" r="36" fill="#f0f2f5" />
        <text x="36" y="42" textAnchor="middle" fill="#8c8c8c" fontSize="18" fontWeight="bold">
          500
        </text>
      </svg>
    ),
    color: 'text-muted-foreground',
  },
};

export interface ResultProps {
  status?: 'success' | 'error' | 'warning' | 'info' | '404' | '403' | '500';
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Result: React.FC<ResultProps> = ({
  status = 'info',
  title,
  subTitle,
  extra,
  icon,
  className,
  style,
  children,
}) => {
  const preset = RESULT_ICON[status];
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-10 text-center', className)}
      style={style}
    >
      <div className="mb-4">{icon ?? preset?.icon}</div>
      {title && <div className="text-2xl font-bold text-foreground mb-2">{title}</div>}
      {subTitle && <div className="text-sm text-muted-foreground mb-4">{subTitle}</div>}
      {extra && <div className="mt-4 flex items-center gap-2">{extra}</div>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

// ── Rate ──────────────────────────────────────────────────────────────────────
export interface RateProps {
  value?: number;
  defaultValue?: number;
  count?: number;
  disabled?: boolean;
  allowHalf?: boolean;
  allowClear?: boolean;
  onChange?: (value: number) => void;
  onHoverChange?: (value: number) => void;
  character?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  tooltips?: string[];
}

export const Rate: React.FC<RateProps> = ({
  value,
  defaultValue = 0,
  count = 5,
  disabled,
  onChange,
  character,
  className,
  style,
}) => {
  const [hovered, setHovered] = React.useState(0);
  const [internal, setInternal] = React.useState(defaultValue);
  const controlled = value !== undefined;
  const current = controlled ? value! : internal;
  const display = hovered || current;

  const handleClick = (i: number) => {
    if (disabled) return;
    if (!controlled) setInternal(i);
    onChange?.(i);
  };

  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} style={style}>
      {Array.from({ length: count }, (_, i) => {
        const filled = i + 1 <= display;
        return (
          <span
            key={i}
            className={cn('cursor-pointer transition-colors', disabled && 'cursor-default')}
            onClick={() => handleClick(i + 1)}
            onMouseEnter={() => !disabled && setHovered(i + 1)}
            onMouseLeave={() => !disabled && setHovered(0)}
          >
            {character ?? (
              <Star
                className={cn(
                  'h-4 w-4',
                  filled ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                )}
              />
            )}
          </span>
        );
      })}
    </span>
  );
};
