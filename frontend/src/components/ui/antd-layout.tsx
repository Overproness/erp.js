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

// ── Col responsive helpers ────────────────────────────────────────────────────
function getSpanNum(p: number | Record<string, number> | undefined): number | undefined {
  if (typeof p === 'number') return p;
  if (typeof p === 'object' && p !== null && 'span' in p)
    return (p as Record<string, number>).span;
  return undefined;
}

// Explicit static maps so Tailwind JIT can scan and generate the classes.
// Tailwind preflight is disabled; these handle responsive column widths.
const BASE_W: Record<number, string> = {
  1:'w-[4.1667%]', 2:'w-[8.3333%]', 3:'w-[12.5%]', 4:'w-1/6',
  5:'w-[20.8333%]', 6:'w-1/4', 7:'w-[29.1667%]', 8:'w-1/3',
  9:'w-[37.5%]', 10:'w-[41.6667%]', 11:'w-[45.8333%]', 12:'w-1/2',
  13:'w-[54.1667%]', 14:'w-[58.3333%]', 15:'w-[62.5%]', 16:'w-2/3',
  17:'w-[70.8333%]', 18:'w-3/4', 19:'w-[79.1667%]', 20:'w-[83.3333%]',
  21:'w-[87.5%]', 22:'w-[91.6667%]', 23:'w-[95.8333%]', 24:'w-full',
};
const SM_W: Record<number, string> = {
  1:'sm:w-[4.1667%]', 2:'sm:w-[8.3333%]', 3:'sm:w-[12.5%]', 4:'sm:w-1/6',
  5:'sm:w-[20.8333%]', 6:'sm:w-1/4', 7:'sm:w-[29.1667%]', 8:'sm:w-1/3',
  9:'sm:w-[37.5%]', 10:'sm:w-[41.6667%]', 11:'sm:w-[45.8333%]', 12:'sm:w-1/2',
  13:'sm:w-[54.1667%]', 14:'sm:w-[58.3333%]', 15:'sm:w-[62.5%]', 16:'sm:w-2/3',
  17:'sm:w-[70.8333%]', 18:'sm:w-3/4', 19:'sm:w-[79.1667%]', 20:'sm:w-[83.3333%]',
  21:'sm:w-[87.5%]', 22:'sm:w-[91.6667%]', 23:'sm:w-[95.8333%]', 24:'sm:w-full',
};
const MD_W: Record<number, string> = {
  1:'md:w-[4.1667%]', 2:'md:w-[8.3333%]', 3:'md:w-[12.5%]', 4:'md:w-1/6',
  5:'md:w-[20.8333%]', 6:'md:w-1/4', 7:'md:w-[29.1667%]', 8:'md:w-1/3',
  9:'md:w-[37.5%]', 10:'md:w-[41.6667%]', 11:'md:w-[45.8333%]', 12:'md:w-1/2',
  13:'md:w-[54.1667%]', 14:'md:w-[58.3333%]', 15:'md:w-[62.5%]', 16:'md:w-2/3',
  17:'md:w-[70.8333%]', 18:'md:w-3/4', 19:'md:w-[79.1667%]', 20:'md:w-[83.3333%]',
  21:'md:w-[87.5%]', 22:'md:w-[91.6667%]', 23:'md:w-[95.8333%]', 24:'md:w-full',
};
const LG_W: Record<number, string> = {
  1:'lg:w-[4.1667%]', 2:'lg:w-[8.3333%]', 3:'lg:w-[12.5%]', 4:'lg:w-1/6',
  5:'lg:w-[20.8333%]', 6:'lg:w-1/4', 7:'lg:w-[29.1667%]', 8:'lg:w-1/3',
  9:'lg:w-[37.5%]', 10:'lg:w-[41.6667%]', 11:'lg:w-[45.8333%]', 12:'lg:w-1/2',
  13:'lg:w-[54.1667%]', 14:'lg:w-[58.3333%]', 15:'lg:w-[62.5%]', 16:'lg:w-2/3',
  17:'lg:w-[70.8333%]', 18:'lg:w-3/4', 19:'lg:w-[79.1667%]', 20:'lg:w-[83.3333%]',
  21:'lg:w-[87.5%]', 22:'lg:w-[91.6667%]', 23:'lg:w-[95.8333%]', 24:'lg:w-full',
};
const XL_W: Record<number, string> = {
  1:'xl:w-[4.1667%]', 2:'xl:w-[8.3333%]', 3:'xl:w-[12.5%]', 4:'xl:w-1/6',
  5:'xl:w-[20.8333%]', 6:'xl:w-1/4', 7:'xl:w-[29.1667%]', 8:'xl:w-1/3',
  9:'xl:w-[37.5%]', 10:'xl:w-[41.6667%]', 11:'xl:w-[45.8333%]', 12:'xl:w-1/2',
  13:'xl:w-[54.1667%]', 14:'xl:w-[58.3333%]', 15:'xl:w-[62.5%]', 16:'xl:w-2/3',
  17:'xl:w-[70.8333%]', 18:'xl:w-3/4', 19:'xl:w-[79.1667%]', 20:'xl:w-[83.3333%]',
  21:'xl:w-[87.5%]', 22:'xl:w-[91.6667%]', 23:'xl:w-[95.8333%]', 24:'xl:w-full',
};

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
  (
    { span, offset, flex: flexProp, order, className, style, children, xs, sm, md, lg, xl, xxl, ...rest },
    ref
  ) => {
    const xsSpan = getSpanNum(xs);
    const smSpan = getSpanNum(sm);
    const mdSpan = getSpanNum(md);
    const lgSpan = getSpanNum(lg);
    const xlSpan = getSpanNum(xl);

    // Base span: explicit span > xs > fallback
    const baseSpan = span ?? xsSpan;
    const hasAnyBreakpoint =
      smSpan !== undefined || mdSpan !== undefined || lgSpan !== undefined || xlSpan !== undefined;

    // Base width: explicit span, or 100% mobile-first when responsive props are given
    const baseWidth =
      baseSpan !== undefined
        ? `${(baseSpan / 24) * 100}%`
        : hasAnyBreakpoint
        ? '100%'
        : undefined;

    const colStyle: React.CSSProperties = {
      ...(baseWidth !== undefined
        ? { width: baseWidth, flex: '0 0 auto' }
        : { flex: '1 1 0%' }),
      ...(offset ? { marginLeft: `${(offset / 24) * 100}%` } : {}),
      ...(flexProp ? { flex: flexProp } : {}),
      ...(order !== undefined ? { order } : {}),
      ...style,
    };

    // Responsive Tailwind width classes (all literals — JIT generates them).
    // important:true in tailwind.config.js makes these override inline style.
    const responsiveClasses = cn(
      smSpan !== undefined && SM_W[smSpan],
      mdSpan !== undefined && MD_W[mdSpan],
      lgSpan !== undefined && LG_W[lgSpan],
      xlSpan !== undefined && XL_W[xlSpan],
    );

    return (
      <div ref={ref} className={cn('box-border', responsiveClasses, className)} style={colStyle} {...rest}>
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
