import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

type AntdButtonType = 'default' | 'primary' | 'dashed' | 'link' | 'text' | 'ghost';
type AntdButtonSize = 'large' | 'middle' | 'small';
type AntdButtonShape = 'default' | 'circle' | 'round';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  type?: AntdButtonType;
  htmlType?: 'button' | 'submit' | 'reset';
  size?: AntdButtonSize;
  loading?: boolean | { delay?: number };
  icon?: React.ReactNode;
  block?: boolean;
  danger?: boolean;
  ghost?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  shape?: AntdButtonShape;
  children?: React.ReactNode;
}

function mapVariant(
  type?: AntdButtonType,
  danger?: boolean,
  ghost?: boolean
): 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' {
  if (danger) return 'destructive';
  if (type === 'primary') return 'default';
  if (type === 'link') return 'link';
  if (type === 'text') return 'ghost';
  if (type === 'ghost' || ghost) return 'outline';
  return 'outline';
}

function mapSize(size?: AntdButtonSize): 'default' | 'sm' | 'lg' {
  if (size === 'large') return 'lg';
  if (size === 'small') return 'sm';
  return 'default';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type,
      htmlType,
      size,
      loading,
      icon,
      block,
      danger,
      ghost,
      href,
      target,
      rel,
      shape,
      children,
      className,
      style,
      disabled,
      ...rest
    },
    ref
  ) => {
    const isLoading = loading === true || (typeof loading === 'object' && loading !== null);
    const variant = mapVariant(type, danger, ghost);
    const sizeVal = mapSize(size);

    const classes = cn(
      buttonVariants({ variant, size: sizeVal }),
      block && 'w-full',
      type === 'dashed' && 'border-dashed',
      shape === 'circle' && 'rounded-full p-0',
      shape === 'round' && 'rounded-full',
      className
    );

    const content = (
      <>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {icon && !isLoading && <span className="inline-flex shrink-0">{icon}</span>}
        {children}
      </>
    );

    if (href) {
      return (
        <a href={href} target={target} rel={rel} className={classes} style={style}>
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type={htmlType || 'button'}
        className={classes}
        style={style}
        disabled={isLoading || disabled}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';
