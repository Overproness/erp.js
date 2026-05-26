/**
 * antd-passthrough.tsx
 *
 * Re-exports all complex components from their proper shadcn-based
 * implementations. No direct antd dependency here.
 */
export { Form } from '@/components/ui/antd-form-impl';
export { Table } from '@/components/ui/antd-table-impl';
export { Select, AutoComplete } from '@/components/ui/antd-select-impl';
export { DatePicker, TimePicker, Calendar } from '@/components/ui/antd-datepicker-impl';
export { Upload } from '@/components/ui/antd-upload-impl';
export {
  InputNumber,
  Menu,
  Steps,
  Slider,
  Timeline,
  Pagination,
  App,
  ConfigProvider,
} from '@/components/ui/antd-misc-impl';

// Grid — already in antd-layout, re-export here for backwards compat
export { Grid } from '@/components/ui/antd-layout';

// Rate — forward from display components
export { Rate as AntdRate } from '@/components/ui/antd-display';

// ── Stub components for rarely/never-used antd components ─────────────────────
// These are not used in the codebase but are exported for API completeness.
import React from 'react';

export const TreeSelect: React.FC<any> = ({ children, ...props }) => (
  <select {...props}>{children}</select>
);

export const Transfer: React.FC<any> = () => null;

export const Cascader: React.FC<any> = ({ children }) => <>{children}</>;

export const Mentions: React.FC<any> = (props) => (
  <textarea {...props} />
);

export const ColorPicker: React.FC<any> = ({ value, onChange, ...props }) => (
  <input
    type="color"
    value={typeof value === 'string' ? value : '#000000'}
    onChange={(e) => onChange?.(e.target.value)}
    {...props}
  />
);
