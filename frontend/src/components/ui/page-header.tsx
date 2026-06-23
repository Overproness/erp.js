import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import * as React from 'react';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  onBack?: () => void;
  backIcon?: React.ReactNode | false;
  ghost?: boolean;
  tags?: React.ReactNode;
  footer?: React.ReactNode;
}

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  (
    {
      title,
      subTitle,
      extra,
      onBack,
      backIcon,
      ghost,
      tags,
      footer,
      children,
      className,
      ...rest
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        'mb-4 rounded-md border border-border bg-card px-4 py-3 text-card-foreground',
        ghost && 'border-transparent bg-transparent px-0',
        className
      )}
      {...rest}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {onBack && backIcon !== false && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Back"
              className="mt-0.5 h-8 w-8 p-0"
              onClick={onBack}
            >
              {backIcon ?? <ArrowLeft className="h-4 w-4" />}
            </Button>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {title && <h1 className="m-0 text-xl font-semibold leading-tight">{title}</h1>}
              {tags}
            </div>
            {subTitle && <div className="mt-1 text-sm text-muted-foreground">{subTitle}</div>}
          </div>
        </div>
        {extra && <div className="flex shrink-0 flex-wrap items-center gap-2">{extra}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
      {footer && <div className="mt-4 border-t border-border pt-3">{footer}</div>}
    </div>
  )
);
PageHeader.displayName = 'PageHeader';
