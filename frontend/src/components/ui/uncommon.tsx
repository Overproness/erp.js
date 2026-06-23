/**
 * uncommon.tsx
 *
 * Re-exports all complex components from their proper shadcn-based
 * implementations. No external design-system dependency here.
 */
export { Calendar, DatePicker, TimePicker } from '@/components/ui/date-time-picker';
export { Form } from '@/components/ui/form-compat';
export {
  App,
  InputNumber,
  Menu,
  Pagination,
  Slider,
  Steps,
  Timeline,
} from '@/components/ui/composite';
export { AutoComplete, Select } from '@/components/ui/select-compat';
export { Table } from '@/components/ui/data-table';
export { Upload } from '@/components/ui/upload';

// Grid — already in layout-compat, re-export here for compatibility
export { Grid } from '@/components/ui/layout-compat';

// Rate — forward from display components
export { Rate as CompatRate } from '@/components/ui/display';

// ── Stub components for rarely used components ─────────────────────
// These are not used in the codebase but are exported for API completeness.
import React from 'react';

export const TreeSelect: React.FC<any> = ({ children, ...props }) => (
  <select {...props}>{children}</select>
);

export const Transfer: React.FC<any> = () => null;

export const Cascader: React.FC<any> = ({ children }) => <>{children}</>;

export const Mentions: React.FC<any> = (props) => <textarea {...props} />;

export const ColorPicker: React.FC<any> = ({ value, onChange, ...props }) => (
  <input
    type="color"
    value={typeof value === 'string' ? value : '#000000'}
    onChange={(e) => onChange?.(e.target.value)}
    {...props}
  />
);
