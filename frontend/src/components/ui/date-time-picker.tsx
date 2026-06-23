/**
 * date-time-picker.tsx
 * DatePicker, RangePicker, TimePicker, Calendar — built with shadcn Calendar
 * (react-day-picker) + dayjs. Values in/out are dayjs objects to match
 * existing date-picker usage patterns.
 */
import { Calendar as ShadCalendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';

// ── Shared trigger button ─────────────────────────────────────────────────────
type PickerButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  status?: string;
  size?: string;
};

const PickerButton = React.forwardRef<HTMLButtonElement, PickerButtonProps>(
  ({ children, className, disabled, style, status, size, ...rest }, ref) => {
    const h = size === 'large' ? 'h-10 text-base' : size === 'small' ? 'h-7 text-xs' : 'h-9 text-sm';
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-[var(--radius)] border border-input',
          'bg-background px-3 py-1.5 text-sm ring-offset-background',
          'hover:border-ring/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
          h,
          status === 'error' && 'border-destructive focus:ring-destructive',
          status === 'warning' && 'border-yellow-400',
          className
        )}
        style={style}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
PickerButton.displayName = 'PickerButton';

// ── DatePicker ────────────────────────────────────────────────────────────────
export interface DatePickerProps {
  value?: Dayjs | null;
  defaultValue?: Dayjs | null;
  onChange?: (date: Dayjs | null, dateString: string) => void;
  format?: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  disabledDate?: (current: Dayjs) => boolean;
  showToday?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  status?: 'error' | 'warning' | '';
  size?: 'large' | 'middle' | 'small';
  style?: React.CSSProperties;
  className?: string;
  suffixIcon?: React.ReactNode;
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year';
  showTime?: boolean | object;
  id?: string;
  inputReadOnly?: boolean;
  getPopupContainer?: (trigger: HTMLElement) => HTMLElement;
  popupClassName?: string;
  renderExtraFooter?: () => React.ReactNode;
}

const DatePickerBase = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      format: fmt,
      placeholder = 'Select date',
      disabled,
      allowClear,
      disabledDate,
      open: openProp,
      onOpenChange,
      status,
      size,
      style,
      className,
      id,
      renderExtraFooter,
    },
    ref
  ) => {
    const displayFormat = fmt ?? 'YYYY-MM-DD';
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<Dayjs | null>(defaultValue ?? null);
    const [open, setOpen] = React.useState(false);
    const current = isControlled ? value ?? null : internal;

    const handleOpenChange = (next: boolean) => {
      if (openProp === undefined) setOpen(next);
      onOpenChange?.(next);
    };

    const handleSelect = (date: Date | undefined) => {
      const dj = date ? dayjs(date) : null;
      if (!isControlled) setInternal(dj);
      onChange?.(dj, dj ? dj.format(displayFormat) : '');
      handleOpenChange(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isControlled) setInternal(null);
      onChange?.(null, '');
    };

    const isOpen = openProp !== undefined ? openProp : open;

    return (
      <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>
          <PickerButton
            ref={ref}
            id={id}
            disabled={disabled}
            status={status}
            size={size}
            className={className}
            style={style}
          >
            <span className="flex items-center gap-2 flex-1 min-w-0">
              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              {current ? (
                <span className="truncate">{current.format(displayFormat)}</span>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </span>
            {allowClear && current && !disabled && (
              <span
                role="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </PickerButton>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              'z-50 rounded-[var(--radius)] border border-border bg-popover p-0 shadow-md outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
            align="start"
            sideOffset={4}
          >
            <ShadCalendar
              mode="single"
              selected={current ? current.toDate() : undefined}
              onSelect={handleSelect}
              disabled={disabledDate ? (date) => disabledDate(dayjs(date)) : undefined}
              initialFocus
            />
            {renderExtraFooter && (
              <div className="border-t border-border px-3 py-2 text-sm text-muted-foreground">
                {renderExtraFooter()}
              </div>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
DatePickerBase.displayName = 'DatePicker';

// ── RangePicker ───────────────────────────────────────────────────────────────
export interface RangePickerProps {
  value?: [Dayjs | null, Dayjs | null] | null;
  defaultValue?: [Dayjs | null, Dayjs | null];
  onChange?: (dates: [Dayjs | null, Dayjs | null] | null, dateStrings: [string, string]) => void;
  format?: string;
  placeholder?: [string, string];
  disabled?: boolean | [boolean, boolean];
  allowClear?: boolean;
  disabledDate?: (current: Dayjs) => boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  status?: 'error' | 'warning' | '';
  size?: 'large' | 'middle' | 'small';
  style?: React.CSSProperties;
  className?: string;
  showTime?: boolean | object;
  ranges?: Record<string, [Dayjs, Dayjs]>;
  presets?: { label: string; value: [Dayjs, Dayjs] }[];
  separator?: React.ReactNode;
  id?: string;
}

const RangePicker = React.forwardRef<HTMLButtonElement, RangePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      format: fmt,
      placeholder = ['Start date', 'End date'],
      disabled,
      allowClear,
      disabledDate,
      open: openProp,
      onOpenChange,
      status,
      size,
      style,
      className,
      presets,
      id,
    },
    ref
  ) => {
    const displayFormat = fmt ?? 'YYYY-MM-DD';
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<[Dayjs | null, Dayjs | null]>(
      defaultValue ?? [null, null]
    );
    const [open, setOpen] = React.useState(false);
    const current = isControlled ? value ?? [null, null] : internal;

    const handleOpenChange = (next: boolean) => {
      if (openProp === undefined) setOpen(next);
      onOpenChange?.(next);
    };

    const range: DateRange | undefined =
      current[0] || current[1]
        ? { from: current[0]?.toDate(), to: current[1]?.toDate() }
        : undefined;

    const handleSelect = (r: DateRange | undefined) => {
      const from = r?.from ? dayjs(r.from) : null;
      const to = r?.to ? dayjs(r.to) : null;
      const next: [Dayjs | null, Dayjs | null] = [from, to];
      if (!isControlled) setInternal(next);
      if (from && to) {
        onChange?.(next, [from.format(displayFormat), to.format(displayFormat)]);
        handleOpenChange(false);
      } else if (!from && !to) {
        onChange?.(null, ['', '']);
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      const next: [null, null] = [null, null];
      if (!isControlled) setInternal(next);
      onChange?.(null, ['', '']);
    };

    const isDisabled = disabled === true || (Array.isArray(disabled) && disabled[0] && disabled[1]);
    const isOpen = openProp !== undefined ? openProp : open;

    return (
      <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>
          <PickerButton
            ref={ref}
            id={id}
            disabled={isDisabled}
            status={status}
            size={size}
            className={className}
            style={style}
          >
            <span className="flex items-center gap-2 flex-1 min-w-0 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              {current[0] ? (
                <span>{current[0].format(displayFormat)}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder[0]}</span>
              )}
              <span className="text-muted-foreground">→</span>
              {current[1] ? (
                <span>{current[1].format(displayFormat)}</span>
              ) : (
                <span className="text-muted-foreground">{placeholder[1]}</span>
              )}
            </span>
            {allowClear && (current[0] || current[1]) && !isDisabled && (
              <span
                role="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </PickerButton>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              'z-50 rounded-[var(--radius)] border border-border bg-popover p-0 shadow-md outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
            align="start"
            sideOffset={4}
          >
            <div className="flex gap-4 p-2">
              {presets && presets.length > 0 && (
                <div className="flex flex-col gap-1 pr-2 border-r border-border min-w-28">
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      className="text-left text-sm px-2 py-1 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                      onClick={() =>
                        handleSelect({ from: p.value[0].toDate(), to: p.value[1].toDate() })
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
              <ShadCalendar
                mode="range"
                selected={range}
                onSelect={handleSelect}
                disabled={disabledDate ? (date) => disabledDate(dayjs(date)) : undefined}
                numberOfMonths={2}
                initialFocus
              />
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
RangePicker.displayName = 'DatePicker.RangePicker';

export const DatePicker = Object.assign(DatePickerBase, { RangePicker });

// ── TimePicker ────────────────────────────────────────────────────────────────
export interface TimePickerProps {
  value?: Dayjs | null;
  defaultValue?: Dayjs | null;
  onChange?: (time: Dayjs | null, timeString: string) => void;
  format?: string;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  use12Hours?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  hideDisabledOptions?: boolean;
  disabledTime?: (now: Dayjs) => {
    disabledHours?: () => number[];
    disabledMinutes?: (h: number) => number[];
    disabledSeconds?: (h: number, m: number) => number[];
  };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  status?: 'error' | 'warning' | '';
  size?: 'large' | 'middle' | 'small';
  style?: React.CSSProperties;
  className?: string;
  suffixIcon?: React.ReactNode;
  showNow?: boolean;
  id?: string;
}

function range(start: number, end: number, step = 1) {
  const r: number[] = [];
  for (let i = start; i < end; i += step) r.push(i);
  return r;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export const TimePicker = React.forwardRef<HTMLButtonElement, TimePickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      format: fmt,
      placeholder = 'Select time',
      disabled,
      allowClear,
      use12Hours,
      hourStep = 1,
      minuteStep = 1,
      secondStep = 1,
      open: openProp,
      onOpenChange,
      status,
      size,
      style,
      className,
      showNow,
      id,
    },
    ref
  ) => {
    const showSeconds = !fmt || fmt.includes('ss');
    const displayFormat = fmt ?? (use12Hours ? 'hh:mm A' : 'HH:mm:ss');
    const isControlled = value !== undefined;
    const [internal, setInternal] = React.useState<Dayjs | null>(defaultValue ?? null);
    const [open, setOpen] = React.useState(false);
    const current = isControlled ? value ?? null : internal;

    const [h, setH] = React.useState(current?.hour() ?? 0);
    const [m, setM] = React.useState(current?.minute() ?? 0);
    const [s, setS] = React.useState(current?.second() ?? 0);
    const [ampm, setAmpm] = React.useState<'AM' | 'PM'>(current?.hour() ?? 0 >= 12 ? 'PM' : 'AM');

    // Sync state when value changes
    React.useEffect(() => {
      if (current) {
        setH(current.hour());
        setM(current.minute());
        setS(current.second());
        setAmpm(current.hour() >= 12 ? 'PM' : 'AM');
      }
    }, [value]);

    const handleOpenChange = (next: boolean) => {
      if (openProp === undefined) setOpen(next);
      onOpenChange?.(next);
    };

    const commit = (hour: number, minute: number, second: number, ap?: 'AM' | 'PM') => {
      let resolvedHour = hour;
      if (use12Hours) {
        const period = ap ?? ampm;
        if (period === 'PM' && hour < 12) resolvedHour = hour + 12;
        if (period === 'AM' && hour === 12) resolvedHour = 0;
      }
      const dj = dayjs().hour(resolvedHour).minute(minute).second(second).millisecond(0);
      if (!isControlled) setInternal(dj);
      onChange?.(dj, dj.format(displayFormat));
    };

    const hours = range(0, use12Hours ? 12 : 24, hourStep);
    const minutes = range(0, 60, minuteStep);
    const seconds = range(0, 60, secondStep);

    const isOpen = openProp !== undefined ? openProp : open;

    return (
      <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild>
          <PickerButton
            ref={ref}
            id={id}
            disabled={disabled}
            status={status}
            size={size}
            className={className}
            style={style}
          >
            <span className="flex items-center gap-2 flex-1 min-w-0">
              <svg
                className="h-4 w-4 text-muted-foreground shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
                <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {current ? (
                <span className="truncate">{current.format(displayFormat)}</span>
              ) : (
                <span className="text-muted-foreground truncate">{placeholder}</span>
              )}
            </span>
            {allowClear && current && !disabled && (
              <span
                role="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isControlled) setInternal(null);
                  onChange?.(null, '');
                }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </PickerButton>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            className={cn(
              'z-50 rounded-[var(--radius)] border border-border bg-popover shadow-md outline-none p-0',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
            )}
            align="start"
            sideOffset={4}
          >
            <div className="flex border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground gap-4">
              <span className={cn('flex-1 text-center', !use12Hours && 'w-10')}>
                {use12Hours ? '12h' : 'Hour'}
              </span>
              <span className="flex-1 text-center">Min</span>
              {showSeconds && <span className="flex-1 text-center">Sec</span>}
              {use12Hours && <span className="w-10 text-center">AM/PM</span>}
            </div>
            <div className="flex h-48 overflow-hidden">
              {/* Hours */}
              <div className="flex-1 overflow-y-auto border-r border-border">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className={cn(
                      'flex items-center justify-center h-8 text-sm cursor-pointer transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      h === hour && 'bg-primary text-primary-foreground font-medium'
                    )}
                    onClick={() => {
                      setH(hour);
                      commit(hour, m, s);
                    }}
                  >
                    {pad(use12Hours ? (hour === 0 ? 12 : hour) : hour)}
                  </div>
                ))}
              </div>
              {/* Minutes */}
              <div className="flex-1 overflow-y-auto border-r border-border">
                {minutes.map((min) => (
                  <div
                    key={min}
                    className={cn(
                      'flex items-center justify-center h-8 text-sm cursor-pointer transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      m === min && 'bg-primary text-primary-foreground font-medium'
                    )}
                    onClick={() => {
                      setM(min);
                      commit(h, min, s);
                    }}
                  >
                    {pad(min)}
                  </div>
                ))}
              </div>
              {/* Seconds */}
              {showSeconds && (
                <div className="flex-1 overflow-y-auto border-r border-border">
                  {seconds.map((sec) => (
                    <div
                      key={sec}
                      className={cn(
                        'flex items-center justify-center h-8 text-sm cursor-pointer transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        s === sec && 'bg-primary text-primary-foreground font-medium'
                      )}
                      onClick={() => {
                        setS(sec);
                        commit(h, m, sec);
                      }}
                    >
                      {pad(sec)}
                    </div>
                  ))}
                </div>
              )}
              {/* AM/PM */}
              {use12Hours && (
                <div className="w-10 flex flex-col">
                  {(['AM', 'PM'] as const).map((period) => (
                    <div
                      key={period}
                      className={cn(
                        'flex flex-1 items-center justify-center text-sm cursor-pointer transition-colors',
                        'hover:bg-accent hover:text-accent-foreground',
                        ampm === period && 'bg-primary text-primary-foreground font-medium'
                      )}
                      onClick={() => {
                        setAmpm(period);
                        commit(h, m, s, period);
                      }}
                    >
                      {period}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {showNow && (
              <div className="border-t border-border px-3 py-2">
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => {
                    const now = dayjs();
                    setH(now.hour());
                    setM(now.minute());
                    setS(now.second());
                    commit(now.hour(), now.minute(), now.second());
                    handleOpenChange(false);
                  }}
                >
                  Now
                </button>
              </div>
            )}
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);
TimePicker.displayName = 'TimePicker';

// ── Calendar (full-page) ──────────────────────────────────────────────────────
export interface CalendarProps {
  value?: Dayjs;
  defaultValue?: Dayjs;
  onChange?: (date: Dayjs) => void;
  onPanelChange?: (date: Dayjs, mode: string) => void;
  mode?: 'month' | 'year';
  fullscreen?: boolean;
  validRange?: [Dayjs, Dayjs];
  disabledDate?: (current: Dayjs) => boolean;
  dateFullCellRender?: (date: Dayjs) => React.ReactNode;
  dateCellRender?: (date: Dayjs) => React.ReactNode;
  headerRender?: (props: {
    value: Dayjs;
    type: string;
    onChange: (v: Dayjs) => void;
    onTypeChange: (t: string) => void;
  }) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Calendar: React.FC<CalendarProps> = ({
  value,
  defaultValue,
  onChange,
  mode = 'month',
  fullscreen = true,
  disabledDate,
  dateCellRender,
  dateFullCellRender,
  headerRender,
  className,
  style,
}) => {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState<Dayjs>(defaultValue ?? dayjs());
  const current = isControlled ? value! : internal;

  const [viewMode, setViewMode] = React.useState<'month' | 'year'>(mode);
  const [viewDate, setViewDate] = React.useState<Dayjs>(current);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    const dj = dayjs(date);
    if (!isControlled) setInternal(dj);
    onChange?.(dj);
  };

  const header = headerRender ? (
    headerRender({
      value: viewDate,
      type: viewMode,
      onChange: (v) => setViewDate(v),
      onTypeChange: (t) => setViewMode(t as any),
    })
  ) : (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="p-1 rounded hover:bg-accent transition-colors"
          onClick={() => setViewDate((d) => d.subtract(1, viewMode === 'year' ? 'year' : 'month'))}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">
          {viewMode === 'year' ? viewDate.year() : viewDate.format('MMMM YYYY')}
        </span>
        <button
          type="button"
          className="p-1 rounded hover:bg-accent transition-colors"
          onClick={() => setViewDate((d) => d.add(1, viewMode === 'year' ? 'year' : 'month'))}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setViewMode('month')}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors',
            viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          Month
        </button>
        <button
          type="button"
          onClick={() => setViewMode('year')}
          className={cn(
            'px-2 py-1 text-xs rounded transition-colors',
            viewMode === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          )}
        >
          Year
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        'bg-card rounded-[var(--radius)] border border-border overflow-hidden',
        fullscreen && 'w-full',
        className
      )}
      style={style}
    >
      {header}
      <div className="p-3">
        <ShadCalendar
          mode="single"
          selected={current.toDate()}
          onSelect={handleSelect}
          month={viewDate.toDate()}
          onMonthChange={(date) => setViewDate(dayjs(date))}
          disabled={disabledDate ? (date) => disabledDate(dayjs(date)) : undefined}
          className="w-full"
          classNames={{
            months: 'flex flex-col w-full',
            month: 'w-full',
            caption: 'hidden',
            table: 'w-full border-collapse',
            head_row: 'flex',
            head_cell: 'flex-1 text-center text-xs font-medium text-muted-foreground',
            row: 'flex w-full mt-1',
            cell: cn(
              'flex-1 text-center text-sm relative p-0',
              dateCellRender || dateFullCellRender ? '[&>button]:h-auto [&>button]:min-h-16' : ''
            ),
            day: 'h-9 w-full rounded-[var(--radius)] hover:bg-accent hover:text-accent-foreground transition-colors font-normal',
            day_selected: 'bg-primary text-primary-foreground hover:bg-primary',
            day_today: 'border border-primary text-primary',
            day_outside: 'opacity-40',
            day_disabled: 'opacity-30 cursor-not-allowed',
          }}
          components={
            dateCellRender
              ? {
                  DayContent: ({ date }) => (
                    <div className="flex flex-col items-center">
                      <span>{date.getDate()}</span>
                      <div className="w-full">{dateCellRender(dayjs(date))}</div>
                    </div>
                  ),
                }
              : undefined
          }
        />
      </div>
    </div>
  );
};
