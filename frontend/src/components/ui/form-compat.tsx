/**
 * form-compat.tsx
 * Form built on rc-field-form.
 * API follows the existing form usage so current form files do not need changes.
 */
import RcForm, { Field, FieldContext, List, useForm, useWatch } from 'rc-field-form';
import type { FieldData, FormInstance, NamePath, Rule, Store } from 'rc-field-form/lib/interface';
import * as React from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** useFormInstance – returns the nearest parent Form's instance (rc-field-form v2 compat) */
function useFormInstance<Values = unknown>(): FormInstance<Values> {
  const formInstance = React.useContext(FieldContext);
  return formInstance as unknown as FormInstance<Values>;
}

// ── Form layout context ───────────────────────────────────────────────────────
interface FormCtxValue {
  layout: 'vertical' | 'horizontal' | 'inline';
  labelCol?: { span?: number };
  wrapperCol?: { span?: number };
  labelAlign?: 'left' | 'right';
  colon?: boolean;
  disabled?: boolean;
}
const FormCtx = React.createContext<FormCtxValue>({ layout: 'vertical' });

// ── Form.Item ─────────────────────────────────────────────────────────────────
export interface FormItemProps {
  // rc-field-form Field props
  name?: NamePath;
  rules?: Rule[];
  initialValue?: any;
  valuePropName?: string;
  getValueFromEvent?: (...args: any[]) => any;
  dependencies?: NamePath[];
  shouldUpdate?: boolean | ((prev: any, next: any) => boolean);
  trigger?: string;
  validateTrigger?: string | string[];
  preserve?: boolean;
  messageVariables?: Record<string, string>;
  normalize?: (value: any, prevValue: any, prevValues: any) => any;
  // Visual layer props
  label?: React.ReactNode;
  required?: boolean;
  colon?: boolean;
  extra?: React.ReactNode;
  help?: React.ReactNode;
  noStyle?: boolean;
  hidden?: boolean;
  validateStatus?: 'success' | 'warning' | 'error' | 'validating' | '';
  hasFeedback?: boolean;
  labelCol?: { span?: number; offset?: number };
  wrapperCol?: { span?: number; offset?: number };
  tooltip?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode | ((control: any, meta: any, form: FormInstance) => React.ReactNode);
  // Allow arbitrary rest props (spread from Form.List restField)
  [key: string]: any;
}

const FormItem: React.FC<FormItemProps> = ({
  name,
  rules,
  initialValue,
  valuePropName,
  getValueFromEvent,
  dependencies,
  shouldUpdate,
  trigger,
  validateTrigger,
  preserve,
  messageVariables,
  normalize,
  label,
  required,
  colon,
  extra,
  help,
  noStyle,
  hidden,
  validateStatus: validateStatusProp,
  hasFeedback,
  labelCol: itemLabelCol,
  wrapperCol: itemWrapperCol,
  tooltip,
  className,
  style,
  children,
}) => {
  const {
    layout,
    labelAlign,
    colon: ctxColon,
    disabled: ctxDisabled,
  } = React.useContext(FormCtx);
  const showColon = colon ?? ctxColon ?? true;

  const isRequired =
    required ??
    rules?.some(
      (r) => typeof r === 'object' && r !== null && 'required' in r && (r as any).required
    );

  // Build Field props (only include defined ones)
  const fieldProps: Record<string, any> = {};
  if (name !== undefined) fieldProps.name = name;
  if (rules) fieldProps.rules = rules;
  if (initialValue !== undefined) fieldProps.initialValue = initialValue;
  if (valuePropName) fieldProps.valuePropName = valuePropName;
  if (getValueFromEvent) fieldProps.getValueFromEvent = getValueFromEvent;
  if (dependencies) fieldProps.dependencies = dependencies;
  if (shouldUpdate !== undefined) fieldProps.shouldUpdate = shouldUpdate;
  if (trigger) fieldProps.trigger = trigger;
  if (validateTrigger) fieldProps.validateTrigger = validateTrigger;
  if (preserve !== undefined) fieldProps.preserve = preserve;
  if (messageVariables) fieldProps.messageVariables = messageVariables;
  if (normalize) fieldProps.normalize = normalize;

  const renderWrapper = (childNode: React.ReactNode, errors: string[]) => {
    const hasError = errors.length > 0 || validateStatusProp === 'error';
    if (noStyle) return childNode;

    return (
      <div
        className={cn(
          layout === 'inline' ? 'inline-flex flex-col mr-4 mb-2' : 'mb-4',
          hidden && 'hidden',
          className
        )}
        style={style}
      >
        {label != null && (
          <Label
            className={cn(
              'block mb-1.5 text-sm font-medium leading-none',
              layout === 'horizontal' && 'inline-block pt-2',
              labelAlign === 'right' ? 'text-right' : 'text-left',
              hasError && 'text-destructive'
            )}
          >
            {isRequired && <span className="text-destructive mr-1">*</span>}
            {label}
            {showColon && label && ':'}
            {tooltip && (
              <span
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-xs cursor-help text-muted-foreground"
                title={typeof tooltip === 'string' ? tooltip : undefined}
              >
                ?
              </span>
            )}
          </Label>
        )}
        <div className="flex-1 min-w-0">
          {childNode}
          {(hasError || help) && (
            <p
              className={cn(
                'text-xs mt-1',
                hasError ? 'text-destructive' : 'text-muted-foreground'
              )}
            >
              {hasError ? errors[0] : help}
            </p>
          )}
          {extra && <p className="text-xs mt-1 text-muted-foreground">{extra}</p>}
        </div>
      </div>
    );
  };

  // No name + no shouldUpdate + no dependencies → pure layout item (no Field)
  if (name === undefined && !shouldUpdate && !dependencies) {
    return renderWrapper(children as React.ReactNode, []);
  }

  return (
    <Field {...fieldProps}>
      {(control: any, meta: any, form: any) => {
        const errors = meta?.errors ?? [];
        const rawChild = typeof children === 'function' ? children(control, meta, form) : children;

        let cloned: React.ReactNode = rawChild;
        if (React.isValidElement(rawChild)) {
          const childOnChange = (rawChild.props as any)?.onChange;
          const childOnBlur = (rawChild.props as any)?.onBlur;
          const extraProps: any = { ...control };
          if (childOnChange && control?.onChange) {
            extraProps.onChange = (...args: any[]) => {
              try {
                childOnChange(...args);
              } catch (e) {
                console.error(e);
              }
              control.onChange(...args);
            };
          }
          if (childOnBlur && control?.onBlur) {
            extraProps.onBlur = (...args: any[]) => {
              try {
                childOnBlur(...args);
              } catch (e) {
                console.error(e);
              }
              control.onBlur(...args);
            };
          }
          if (errors.length > 0) extraProps.status = 'error';
          if (ctxDisabled) extraProps.disabled = true;
          cloned = React.cloneElement(rawChild as React.ReactElement<any>, extraProps);
        }

        return renderWrapper(cloned, errors);
      }}
    </Field>
  );
};

// ── Form.ErrorList ────────────────────────────────────────────────────────────
const FormErrorList: React.FC<{ errors: string[] }> = ({ errors }) => (
  <ul className="list-none p-0 m-0">
    {errors.map((e, i) => (
      <li key={i} className="text-destructive text-xs">
        {e}
      </li>
    ))}
  </ul>
);

// ── Form component ────────────────────────────────────────────────────────────
export interface FormProps {
  form?: FormInstance;
  initialValues?: Store;
  onFinish?: (values: Store) => void;
  onFinishFailed?: (errorInfo: {
    values: Store;
    errorFields: FieldData[];
    outOfDate: boolean;
  }) => void;
  onFieldsChange?: (changedFields: FieldData[], allFields: FieldData[]) => void;
  onValuesChange?: (changedValues: Store, allValues: Store) => void;
  layout?: 'vertical' | 'horizontal' | 'inline';
  labelCol?: { span?: number; offset?: number };
  wrapperCol?: { span?: number; offset?: number };
  labelAlign?: 'left' | 'right';
  colon?: boolean;
  disabled?: boolean;
  size?: 'large' | 'middle' | 'small';
  scrollToFirstError?: boolean;
  validateTrigger?: string | string[];
  preserve?: boolean;
  name?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  component?: false | keyof JSX.IntrinsicElements;
}

const FormComponent = React.forwardRef<FormInstance, FormProps>(
  (
    {
      layout = 'vertical',
      labelCol,
      wrapperCol,
      labelAlign,
      colon,
      disabled,
      className,
      style,
      children,
      component,
      ...rcProps
    },
    ref
  ) => (
    <FormCtx.Provider value={{ layout, labelCol, wrapperCol, labelAlign, colon, disabled }}>
      <RcForm
        ref={ref}
        component={component}
        className={cn(layout === 'inline' && 'flex flex-wrap items-end gap-x-2', className)}
        style={style}
        {...rcProps}
      >
        {children}
      </RcForm>
    </FormCtx.Provider>
  )
);
FormComponent.displayName = 'Form';

// ── Compose ───────────────────────────────────────────────────────────────────
export const Form = Object.assign(FormComponent, {
  Item: FormItem,
  List,
  useForm,
  useWatch,
  useFormInstance,
  ErrorList: FormErrorList,
  Provider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
});

export { useForm, useFormInstance, useWatch };
export type { FieldData, FormInstance, NamePath, Rule, Store };
