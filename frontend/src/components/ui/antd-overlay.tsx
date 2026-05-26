import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { AlertCircle, CheckCircle, Info, X, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Popover as ShadcnPopover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Alert as ShadcnAlert,
  AlertDescription,
  AlertTitle as ShadcnAlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/antd-button';

// ── Alert ─────────────────────────────────────────────────────────────────────
const ALERT_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle className="h-4 w-4 text-green-600" />,
  info: <Info className="h-4 w-4 text-blue-600" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
  error: <XCircle className="h-4 w-4 text-destructive" />,
};

export interface AlertProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  message?: React.ReactNode;
  description?: React.ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  banner?: boolean;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  message,
  description,
  showIcon,
  closable,
  onClose,
  action,
  icon,
  className,
  style,
}) => {
  const [closed, setClosed] = React.useState(false);
  if (closed) return null;

  const variantMap: Record<string, 'default' | 'destructive'> = {
    error: 'destructive',
    info: 'default',
    warning: 'default',
    success: 'default',
  };

  const colorClass: Record<string, string> = {
    success: 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900',
    info: 'border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-900',
    warning: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-900',
    error: 'border-destructive/30 bg-destructive/5',
  };

  return (
    <ShadcnAlert
      variant={variantMap[type]}
      className={cn(colorClass[type], 'relative', className)}
      style={style}
    >
      {showIcon && (icon ?? ALERT_ICONS[type])}
      <div className="flex-1 min-w-0">
        {message && <ShadcnAlertTitle>{message}</ShadcnAlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
      </div>
      {action && <div className="ml-2 shrink-0">{action}</div>}
      {closable && (
        <button
          className="absolute right-2 top-2 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => {
            setClosed(true);
            onClose?.();
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </ShadcnAlert>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export interface ModalProps {
  open?: boolean;
  visible?: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode | null;
  onOk?: (e?: React.MouseEvent) => void;
  onCancel?: (e?: React.MouseEvent) => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: 'primary' | 'default' | 'danger' | 'dashed' | 'ghost' | 'link' | 'text';
  okButtonProps?: any;
  cancelButtonProps?: any;
  confirmLoading?: boolean;
  width?: number | string;
  centered?: boolean;
  closable?: boolean;
  destroyOnClose?: boolean;
  maskClosable?: boolean;
  keyboard?: boolean;
  mask?: boolean;
  className?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  wrapClassName?: string;
  afterClose?: () => void;
  afterOpenChange?: (open: boolean) => void;
  forceRender?: boolean;
  getContainer?: any;
  zIndex?: number;
}

export const Modal: React.FC<ModalProps> & {
  confirm: (props: ConfirmProps) => { destroy: () => void; update: (p: ConfirmProps) => void };
  info: (props: ConfirmProps) => { destroy: () => void; update: (p: ConfirmProps) => void };
  success: (props: ConfirmProps) => { destroy: () => void; update: (p: ConfirmProps) => void };
  warning: (props: ConfirmProps) => { destroy: () => void; update: (p: ConfirmProps) => void };
  warn: (props: ConfirmProps) => { destroy: () => void; update: (p: ConfirmProps) => void };
  error: (props: ConfirmProps) => { destroy: () => void; update: (p: ConfirmProps) => void };
  destroyAll: () => void;
  useModal: () => [any, React.ReactNode];
} = ({
  open,
  visible,
  title,
  children,
  footer,
  onOk,
  onCancel,
  okText = 'OK',
  cancelText = 'Cancel',
  okType = 'primary',
  okButtonProps,
  cancelButtonProps,
  confirmLoading,
  width,
  centered,
  closable = true,
  maskClosable = true,
  className,
  style,
  bodyStyle,
  afterClose,
  afterOpenChange,
}) => {
  const isOpen = open !== undefined ? open : visible ?? false;

  const handleOpenChange = (nextOpen: boolean) => {
    afterOpenChange?.(nextOpen);
    if (!nextOpen) {
      onCancel?.();
      afterClose?.();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(className)}
        style={{ maxWidth: width ?? 520, ...(centered ? {} : {}), ...style }}
        onPointerDownOutside={maskClosable ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          if (!closable) e.preventDefault();
        }}
      >
        {title !== undefined && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        <div style={bodyStyle}>{children}</div>
        {footer !== null && (
          <DialogFooter className="flex-row justify-end gap-2">
            {footer ?? (
              <>
                <Button type="default" onClick={(e) => onCancel?.(e as any)} {...cancelButtonProps}>
                  {cancelText}
                </Button>
                <Button
                  type={okType === 'danger' ? 'primary' : okType}
                  danger={okType === 'danger'}
                  loading={confirmLoading}
                  onClick={(e) => onOk?.(e as any)}
                  {...okButtonProps}
                >
                  {okText}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── Imperative Modal (Modal.confirm etc.) ────────────────────────────────────
interface ConfirmProps {
  title?: React.ReactNode;
  content?: React.ReactNode;
  icon?: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  onOk?: () => void | Promise<void>;
  onCancel?: () => void;
  okButtonProps?: any;
  cancelButtonProps?: any;
  centered?: boolean;
  width?: number | string;
  zIndex?: number;
}

const CONFIRM_ICONS: Record<string, React.ReactNode> = {
  info: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  success: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />,
  error: <XCircle className="h-5 w-5 text-destructive shrink-0" />,
  confirm: <AlertCircle className="h-5 w-5 text-primary shrink-0" />,
};

function openConfirmModal(props: ConfirmProps & { type?: string }) {
  const container = document.createDocumentFragment();
  const root = createRoot(container as unknown as Element);

  let resolveProps = { ...props, open: true };

  const ConfirmModal = ({ p }: { p: typeof resolveProps }) => {
    const [open, setOpen] = React.useState(p.open);
    const [loading, setLoading] = React.useState(false);

    const close = () => setOpen(false);

    const handleOk = async () => {
      if (p.onOk) {
        const result = p.onOk();
        if (result instanceof Promise) {
          setLoading(true);
          try {
            await result;
          } catch (_) {
            setLoading(false);
            return;
          }
          setLoading(false);
        }
      }
      close();
    };

    return (
      <Modal
        open={open}
        onCancel={() => {
          p.onCancel?.();
          close();
        }}
        onOk={handleOk}
        confirmLoading={loading}
        okText={p.okText ?? 'OK'}
        cancelText={p.cancelText ?? 'Cancel'}
        width={p.width ?? 416}
        centered={p.centered}
        footer={null}
      >
        <div className="flex items-start gap-3 pt-1 pb-4">
          {CONFIRM_ICONS[p.type ?? 'confirm']}
          <div className="flex-1 min-w-0">
            {p.title && <div className="font-semibold text-base mb-1">{p.title}</div>}
            {p.content && <div className="text-sm text-muted-foreground">{p.content}</div>}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="default"
            onClick={() => {
              p.onCancel?.();
              close();
            }}
            {...p.cancelButtonProps}
          >
            {p.cancelText ?? 'Cancel'}
          </Button>
          <Button
            type={p.type === 'error' ? 'primary' : 'primary'}
            danger={p.type === 'error' || p.type === 'warning'}
            loading={loading}
            onClick={handleOk}
            {...p.okButtonProps}
          >
            {p.okText ?? 'OK'}
          </Button>
        </div>
      </Modal>
    );
  };

  const render = (p: typeof resolveProps) => root.render(<ConfirmModal p={p} />);
  render(resolveProps);
  document.body.appendChild(container as unknown as Node);

  return {
    destroy: () => {
      setTimeout(() => root.unmount(), 0);
    },
    update: (newProps: ConfirmProps) => {
      resolveProps = { ...resolveProps, ...newProps };
      render(resolveProps);
    },
  };
}

Modal.confirm = (props) => openConfirmModal({ ...props, type: 'confirm' });
Modal.info = (props) => openConfirmModal({ ...props, type: 'info' });
Modal.success = (props) => openConfirmModal({ ...props, type: 'success' });
Modal.warning = (props) => openConfirmModal({ ...props, type: 'warning' });
Modal.warn = (props) => openConfirmModal({ ...props, type: 'warning' });
Modal.error = (props) => openConfirmModal({ ...props, type: 'error' });
Modal.destroyAll = () => {};
Modal.useModal = () => [
  {
    confirm: Modal.confirm,
    info: Modal.info,
    success: Modal.success,
    warning: Modal.warning,
    error: Modal.error,
  },
  null,
];

// ── Drawer ────────────────────────────────────────────────────────────────────
export interface DrawerProps {
  open?: boolean;
  visible?: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: (e?: any) => void;
  width?: number | string;
  height?: number | string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  closable?: boolean;
  maskClosable?: boolean;
  mask?: boolean;
  destroyOnClose?: boolean;
  getContainer?: any;
  className?: string;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
  headerStyle?: React.CSSProperties;
  drawerStyle?: React.CSSProperties;
  extra?: React.ReactNode;
  push?: boolean | { distance: number };
  zIndex?: number;
  afterOpenChange?: (open: boolean) => void;
  size?: 'default' | 'large';
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  visible,
  title,
  children,
  footer,
  onClose,
  width,
  height,
  placement = 'right',
  maskClosable = true,
  className,
  style,
  bodyStyle,
  extra,
  size,
}) => {
  const isOpen = open !== undefined ? open : visible ?? false;
  const sideMap: Record<string, 'left' | 'right' | 'top' | 'bottom'> = {
    left: 'left',
    right: 'right',
    top: 'top',
    bottom: 'bottom',
  };

  const defaultWidth = size === 'large' ? 736 : width ?? 378;

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose?.()}>
      <SheetContent
        side={sideMap[placement] ?? 'right'}
        className={cn('flex flex-col', className)}
        style={{
          width: placement === 'left' || placement === 'right' ? defaultWidth : undefined,
          height: placement === 'top' || placement === 'bottom' ? height ?? 256 : undefined,
          ...style,
        }}
        onPointerDownOutside={maskClosable ? undefined : (e) => e.preventDefault()}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{title}</SheetTitle>
            {extra && <div>{extra}</div>}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-auto" style={bodyStyle}>
          {children}
        </div>
        {footer && <SheetFooter className="border-t border-border pt-4 mt-4">{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────
export interface TooltipProps {
  title?: React.ReactNode;
  placement?: string;
  color?: string;
  open?: boolean;
  visible?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  destroyTooltipOnHide?: boolean;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  trigger?: string | string[];
  getPopupContainer?: any;
  zIndex?: number;
  arrow?: boolean | object;
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  children,
  color,
  overlayClassName,
  overlayStyle,
}) => {
  if (!title) return <>{children}</>;

  return (
    <TooltipProvider>
      <ShadcnTooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{children}</span>
        </TooltipTrigger>
        <TooltipContent
          className={cn(color && 'bg-[var(--tt-bg)] text-white', overlayClassName)}
          style={{ ...(color ? ({ '--tt-bg': color } as any) : {}), ...overlayStyle }}
        >
          {title}
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
};

// ── Popover ───────────────────────────────────────────────────────────────────
export interface PopoverProps {
  content?: React.ReactNode;
  title?: React.ReactNode;
  open?: boolean;
  visible?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: string | string[];
  placement?: string;
  overlayClassName?: string;
  overlayStyle?: React.CSSProperties;
  children?: React.ReactNode;
  color?: string;
  destroyTooltipOnHide?: boolean;
  getPopupContainer?: any;
  zIndex?: number;
  arrow?: boolean | object;
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  title,
  children,
  open,
  visible,
  defaultOpen,
  onOpenChange,
  overlayClassName,
  overlayStyle,
}) => {
  const isControlled = open !== undefined || visible !== undefined;
  const isOpen = open ?? visible;

  return (
    <ShadcnPopover
      open={isControlled ? isOpen : undefined}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>
        <span className="inline-flex">{children}</span>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto', overlayClassName)} style={overlayStyle}>
        {title && (
          <div className="font-semibold text-sm mb-2 pb-2 border-b border-border">{title}</div>
        )}
        <div className="text-sm">{content}</div>
      </PopoverContent>
    </ShadcnPopover>
  );
};

// ── Popconfirm ────────────────────────────────────────────────────────────────
export interface PopconfirmProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onConfirm?: (e?: React.MouseEvent) => void;
  onCancel?: (e?: React.MouseEvent) => void;
  okText?: React.ReactNode;
  cancelText?: React.ReactNode;
  okType?: string;
  okButtonProps?: any;
  cancelButtonProps?: any;
  icon?: React.ReactNode;
  disabled?: boolean;
  placement?: string;
  children?: React.ReactNode;
  overlayClassName?: string;
  open?: boolean;
  visible?: boolean;
  onOpenChange?: (open: boolean) => void;
  showCancel?: boolean;
}

export const Popconfirm: React.FC<PopconfirmProps> = ({
  title,
  description,
  onConfirm,
  onCancel,
  okText = 'Yes',
  cancelText = 'No',
  okType,
  okButtonProps,
  cancelButtonProps,
  icon,
  disabled,
  children,
  overlayClassName,
  open,
  visible,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = open !== undefined || visible !== undefined;
  const isOpen = isControlled ? open ?? visible ?? false : internalOpen;

  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <ShadcnPopover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild onClick={disabled ? (e) => e.preventDefault() : undefined}>
        <span className="inline-flex">{children}</span>
      </PopoverTrigger>
      <PopoverContent className={cn('w-auto max-w-xs', overlayClassName)}>
        <div className="flex items-start gap-2 mb-3">
          {icon ?? <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />}
          <div className="min-w-0">
            {title && <div className="text-sm font-medium">{title}</div>}
            {description && (
              <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="default"
            size="small"
            onClick={(e) => {
              onCancel?.(e as any);
              setOpen(false);
            }}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
          <Button
            type={okType === 'danger' ? 'primary' : (okType as any) ?? 'primary'}
            danger={okType === 'danger'}
            size="small"
            onClick={(e) => {
              onConfirm?.(e as any);
              setOpen(false);
            }}
            {...okButtonProps}
          >
            {okText}
          </Button>
        </div>
      </PopoverContent>
    </ShadcnPopover>
  );
};

// ── message singleton ─────────────────────────────────────────────────────────
type MessageContent = React.ReactNode | string;
type MessageOptions = { duration?: number; key?: string; onClick?: () => void };

function toastDuration(duration?: number) {
  return duration !== undefined ? duration * 1000 : undefined;
}

const messageQueue: Array<() => void> = [];

export const message = {
  success: (content: MessageContent, duration?: number, onClose?: () => void) => {
    toast.success(content as any, { autoClose: toastDuration(duration), onClose });
    return () => {};
  },
  error: (content: MessageContent, duration?: number, onClose?: () => void) => {
    toast.error(content as any, { autoClose: toastDuration(duration), onClose });
    return () => {};
  },
  warning: (content: MessageContent, duration?: number, onClose?: () => void) => {
    toast.warning(content as any, { autoClose: toastDuration(duration), onClose });
    return () => {};
  },
  warn: (content: MessageContent, duration?: number, onClose?: () => void) => {
    toast.warning(content as any, { autoClose: toastDuration(duration), onClose });
    return () => {};
  },
  info: (content: MessageContent, duration?: number, onClose?: () => void) => {
    toast.info(content as any, { autoClose: toastDuration(duration), onClose });
    return () => {};
  },
  loading: (content: MessageContent, duration?: number, onClose?: () => void) => {
    const id = toast.loading(content as any, { autoClose: toastDuration(duration), onClose });
    return () => toast.dismiss(id);
  },
  open: (config: {
    type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
    content?: MessageContent;
    duration?: number;
    key?: string;
    onClick?: () => void;
    onClose?: () => void;
  }) => {
    const fn = config.type ? message[config.type] : message.info;
    return (fn as any)(config.content, config.duration, config.onClose);
  },
  destroy: (key?: string) => {
    if (key) toast.dismiss(key as any);
    else toast.dismiss();
  },
  config: (_: any) => {},
};

// ── notification singleton ─────────────────────────────────────────────────────
interface NotificationArgs {
  message?: React.ReactNode;
  description?: React.ReactNode;
  duration?: number;
  key?: string;
  onClose?: () => void;
  onClick?: () => void;
  placement?: string;
  style?: React.CSSProperties;
  className?: string;
  icon?: React.ReactNode;
  btn?: React.ReactNode;
}

function buildNotificationContent(args: NotificationArgs): React.ReactNode {
  if (args.description) {
    return (
      <div>
        {args.message && <div className="font-semibold text-sm">{args.message}</div>}
        <div className="text-xs text-muted-foreground mt-0.5">{args.description}</div>
      </div>
    );
  }
  return args.message;
}

export const notification = {
  success: (args: NotificationArgs) =>
    toast.success(buildNotificationContent(args) as any, {
      autoClose: toastDuration(args.duration),
      toastId: args.key,
      onClose: args.onClose,
    }),
  error: (args: NotificationArgs) =>
    toast.error(buildNotificationContent(args) as any, {
      autoClose: toastDuration(args.duration),
      toastId: args.key,
      onClose: args.onClose,
    }),
  warning: (args: NotificationArgs) =>
    toast.warning(buildNotificationContent(args) as any, {
      autoClose: toastDuration(args.duration),
      toastId: args.key,
      onClose: args.onClose,
    }),
  warn: (args: NotificationArgs) =>
    toast.warning(buildNotificationContent(args) as any, {
      autoClose: toastDuration(args.duration),
      toastId: args.key,
      onClose: args.onClose,
    }),
  info: (args: NotificationArgs) =>
    toast.info(buildNotificationContent(args) as any, {
      autoClose: toastDuration(args.duration),
      toastId: args.key,
      onClose: args.onClose,
    }),
  open: (args: NotificationArgs & { type?: string }) => {
    const fn = args.type ? (notification as any)[args.type] : notification.info;
    return fn(args);
  },
  destroy: (key?: string) => {
    if (key) toast.dismiss(key as any);
    else toast.dismiss();
  },
  config: (_: any) => {},
  useNotification: () => [notification, null] as const,
};
