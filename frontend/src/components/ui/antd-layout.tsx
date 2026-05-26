import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import * as React from 'react';

// ── Space ─────────────────────────────────────────────────────────────────────
const SPACE_GAP: Record<string, number> = { small: 8, middle: 16, large: 24 };

export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
  size?: 'small' | 'middle' | 'large' | number | [number, number];
  wrap?: boolean;
  align?: 'start' | 'end' | 'center' | 'baseline';
  split?: React.ReactNode;
}

export const Space = React.forwardRef<HTMLDivElement, SpaceProps>(
  (
    {
      direction = 'horizontal',
      size = 'small',
      wrap,
      align,
      split,
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    const gap =
      typeof size === 'number' ? size : Array.isArray(size) ? size[0] : SPACE_GAP[size] ?? 8;

    const items = React.Children.toArray(children).filter(Boolean);

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          direction === 'vertical' ? 'flex-col' : 'flex-row',
          wrap && 'flex-wrap',
          align === 'start' && 'items-start',
          align === 'end' && 'items-end',
          align === 'center' && 'items-center',
          align === 'baseline' && 'items-baseline',
          !align && direction === 'horizontal' && 'items-center',
          className
        )}
        style={{ gap, ...style }}
        {...rest}
      >
        {split
          ? items.map((child, i) => (
              <React.Fragment key={i}>
                {child}
                {i < items.length - 1 && <span>{split}</span>}
              </React.Fragment>
            ))
          : children}
      </div>
    );
  }
);
Space.displayName = 'Space';
(Space as any).Compact = ({ children, className, ...props }: any) => (
  <div className={cn('inline-flex [&>*:not(:first-child)]:-ml-px', className)} {...props}>
    {children}
  </div>
);

// ── Row ───────────────────────────────────────────────────────────────────────
export interface RowProps extends React.HTMLAttributes<HTMLDivElement> {
  gutter?: number | [number, number] | Record<string, number>;
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly';
  align?: 'top' | 'middle' | 'bottom' | 'stretch';
  wrap?: boolean;
}

export const Row = React.forwardRef<HTMLDivElement, RowProps>(
  ({ gutter, justify, align, wrap = true, className, style, children, ...rest }, ref) => {
    const hGap = Array.isArray(gutter) ? gutter[0] : typeof gutter === 'number' ? gutter : 0;
    const vGap = Array.isArray(gutter) ? gutter[1] : 0;

    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          !wrap && 'flex-nowrap',
          wrap && 'flex-wrap',
          justify === 'start' && 'justify-start',
          justify === 'end' && 'justify-end',
          justify === 'center' && 'justify-center',
          justify === 'space-around' && 'justify-around',
          justify === 'space-between' && 'justify-between',
          justify === 'space-evenly' && 'justify-evenly',
          align === 'top' && 'items-start',
          align === 'middle' && 'items-center',
          align === 'bottom' && 'items-end',
          align === 'stretch' && 'items-stretch',
          className
        )}
        style={{
          ...(hGap ? { marginLeft: -hGap / 2, marginRight: -hGap / 2 } : {}),
          ...(vGap ? { rowGap: vGap } : {}),
          ...style,
        }}
        {...rest}
      >
        {hGap
          ? React.Children.map(children, (child) =>
              child
                ? React.cloneElement(child as React.ReactElement<any>, {
                    style: {
                      paddingLeft: hGap / 2,
                      paddingRight: hGap / 2,
                      ...(child as React.ReactElement<any>).props.style,
                    },
                  })
                : null
            )
          : children}
      </div>
    );
  }
);
Row.displayName = 'Row';

// ── Col ───────────────────────────────────────────────────────────────────────
export interface ColProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: number;
  offset?: number;
  push?: number;
  pull?: number;
  order?: number;
  flex?: string | number;
  xs?: number | Record<string, number>;
  sm?: number | Record<string, number>;
  md?: number | Record<string, number>;
  lg?: number | Record<string, number>;
  xl?: number | Record<string, number>;
  xxl?: number | Record<string, number>;
}

export const Col = React.forwardRef<HTMLDivElement, ColProps>(
  ({ span, offset, flex, order, className, style, children, ...rest }, ref) => {
    const colStyle: React.CSSProperties = {
      ...(span !== undefined ? { width: `${(span / 24) * 100}%` } : { flex: '1 1 0%' }),
      ...(offset ? { marginLeft: `${(offset / 24) * 100}%` } : {}),
      ...(flex ? { flex } : {}),
      ...(order !== undefined ? { order } : {}),
      ...style,
    };

    return (
      <div ref={ref} className={cn('box-border', className)} style={colStyle} {...rest}>
        {children}
      </div>
    );
  }
);
Col.displayName = 'Col';

// ── Layout ────────────────────────────────────────────────────────────────────
export interface LayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  hasSider?: boolean;
}

const LayoutRoot = React.forwardRef<HTMLDivElement, LayoutProps>(
  ({ hasSider, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn('flex min-h-0 bg-background', hasSider ? 'flex-row' : 'flex-col', className)}
      {...rest}
    >
      {children}
    </div>
  )
);
LayoutRoot.displayName = 'Layout';

const LayoutHeader = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...rest }, ref) => (
    <header
      ref={ref}
      className={cn('flex-shrink-0 bg-background border-b border-border', className)}
      {...rest}
    />
  )
);
LayoutHeader.displayName = 'Layout.Header';

export interface SiderProps extends React.HTMLAttributes<HTMLElement> {
  collapsed?: boolean;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  width?: number | string;
  collapsedWidth?: number | string;
  trigger?: React.ReactNode;
  onCollapse?: (collapsed: boolean, type: string) => void;
  theme?: 'light' | 'dark';
  breakpoint?: string;
  zeroWidthTriggerStyle?: React.CSSProperties;
  reverseArrow?: boolean;
}

const LayoutSider = React.forwardRef<HTMLElement, SiderProps>(
  (
    {
      collapsed,
      collapsible,
      defaultCollapsed = false,
      width = 200,
      collapsedWidth = 80,
      trigger,
      onCollapse,
      theme,
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    const [internalCollapsed, setInternalCollapsed] = React.useState(defaultCollapsed);
    const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed;
    const currentWidth = isCollapsed ? collapsedWidth : width;

    return (
      <aside
        ref={ref}
        className={cn(
          'relative flex-shrink-0 flex flex-col transition-all duration-200 bg-sidebar',
          theme === 'dark' && 'bg-[#001529] text-white',
          className
        )}
        style={{ width: currentWidth, ...style }}
        {...rest}
      >
        <div className="flex-1 overflow-hidden">{children}</div>
        {collapsible && (
          <div
            className="flex justify-center py-2 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => {
              const next = !isCollapsed;
              if (collapsed === undefined) setInternalCollapsed(next);
              onCollapse?.(next, 'clickTrigger');
            }}
          >
            {trigger !== undefined ? (
              trigger
            ) : (
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points={isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'} />
              </svg>
            )}
          </div>
        )}
      </aside>
    );
  }
);
LayoutSider.displayName = 'Layout.Sider';

const LayoutContent = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...rest }, ref) => (
    <main ref={ref} className={cn('flex-1 min-w-0 overflow-auto', className)} {...rest} />
  )
);
LayoutContent.displayName = 'Layout.Content';

const LayoutFooter = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...rest }, ref) => (
    <footer
      ref={ref}
      className={cn('flex-shrink-0 bg-background border-t border-border', className)}
      {...rest}
    />
  )
);
LayoutFooter.displayName = 'Layout.Footer';

export const Layout = Object.assign(LayoutRoot, {
  Header: LayoutHeader,
  Sider: LayoutSider,
  Content: LayoutContent,
  Footer: LayoutFooter,
});

// ── Divider ───────────────────────────────────────────────────────────────────
export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'horizontal' | 'vertical';
  orientation?: 'left' | 'center' | 'right';
  plain?: boolean;
  dashed?: boolean;
  orientationMargin?: string | number;
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      type = 'horizontal',
      orientation = 'center',
      plain,
      dashed,
      className,
      style,
      children,
      ...rest
    },
    ref
  ) => {
    if (type === 'vertical') {
      return (
        <span
          ref={ref}
          className={cn(
            'inline-block mx-2 h-4 w-px bg-border align-middle',
            dashed && 'border-dashed',
            className
          )}
          style={style}
          {...rest}
        />
      );
    }

    if (children) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-3 my-4', className)}
          style={style}
          {...rest}
        >
          {orientation !== 'left' && (
            <Separator className={cn('flex-1', dashed && 'border-dashed')} />
          )}
          <span
            className={cn(
              'text-sm whitespace-nowrap',
              plain ? 'text-muted-foreground' : 'font-medium'
            )}
          >
            {children}
          </span>
          {orientation !== 'right' && (
            <Separator className={cn('flex-1', dashed && 'border-dashed')} />
          )}
        </div>
      );
    }

    return (
      <Separator
        ref={ref as any}
        className={cn('my-4', dashed && 'border-dashed border-t', className)}
        style={style}
        {...(rest as any)}
      />
    );
  }
);
Divider.displayName = 'Divider';

// ── Grid (useBreakpoint hook) ─────────────────────────────────────────────────
const BREAKPOINTS = { xs: 480, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600 };
type BreakpointKey = keyof typeof BREAKPOINTS;

function useBreakpoint(): Partial<Record<BreakpointKey, boolean>> {
  const [screens, setScreens] = React.useState<Partial<Record<BreakpointKey, boolean>>>({});

  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setScreens({
        xs: w < BREAKPOINTS.sm,
        sm: w >= BREAKPOINTS.sm,
        md: w >= BREAKPOINTS.md,
        lg: w >= BREAKPOINTS.lg,
        xl: w >= BREAKPOINTS.xl,
        xxl: w >= BREAKPOINTS.xxl,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return screens;
}

export const Grid = { useBreakpoint };
