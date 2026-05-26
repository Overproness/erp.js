/**
 * @/components/ui/index.tsx
 *
 * Single drop-in replacement for `import { ... } from 'antd'`.
 * Change every antd import to `from '@/components/ui'` and everything
 * continues working with the tweakcn/shadcn design system.
 */

// ── Button ────────────────────────────────────────────────────────────────────
export { Button } from '@/components/ui/antd-button';
export type { ButtonProps } from '@/components/ui/antd-button';

// ── Input family ──────────────────────────────────────────────────────────────
export { Input, TextArea } from '@/components/ui/antd-input';
export type { InputProps } from '@/components/ui/antd-input';

// ── Display / data-display components ────────────────────────────────────────
export {
  Avatar,
  Badge,
  Descriptions,
  DescriptionsItem,
  Empty,
  List,
  Rate,
  Result,
  Spin,
  Statistic,
  Tag,
  Typography,
} from '@/components/ui/antd-display';
export type {
  AvatarProps,
  BadgeProps,
  DescriptionsItemProps,
  DescriptionsProps,
  EmptyProps,
  ListItemProps,
  ListProps,
  RateProps,
  ResultProps,
  SpinProps,
  StatisticProps,
  TagProps,
} from '@/components/ui/antd-display';

// ── Layout ────────────────────────────────────────────────────────────────────
export { Col, Divider, Grid, Layout, Row, Space } from '@/components/ui/antd-layout';
export type { ColProps, DividerProps, RowProps, SpaceProps } from '@/components/ui/antd-layout';

// ── Overlay / feedback ────────────────────────────────────────────────────────
export {
  Alert,
  Drawer,
  message,
  Modal,
  notification,
  Popconfirm,
  Popover,
  Tooltip,
} from '@/components/ui/antd-overlay';
export type {
  AlertProps,
  DrawerProps,
  ModalProps,
  PopconfirmProps,
  PopoverProps,
  TooltipProps,
} from '@/components/ui/antd-overlay';

// ── Form controls / navigation ────────────────────────────────────────────────
export {
  Card,
  Checkbox,
  Collapse,
  Dropdown,
  Progress,
  Radio,
  Switch,
  Tabs,
} from '@/components/ui/antd-form';
export type {
  CardProps,
  CheckboxProps,
  CollapseProps,
  DropdownProps,
  ProgressProps,
  RadioProps,
  SwitchProps,
  TabsProps,
} from '@/components/ui/antd-form';

// ── Form (rc-field-form based) ────────────────────────────────────────────────
export { Form } from '@/components/ui/antd-form-impl';

// ── Table (@tanstack/react-table based) ───────────────────────────────────────
export { Table } from '@/components/ui/antd-table-impl';

// ── Select / AutoComplete (radix popover based) ───────────────────────────────
export { AutoComplete, Select } from '@/components/ui/antd-select-impl';

// ── Date / Time pickers (shadcn calendar based) ───────────────────────────────
export { Calendar, DatePicker, TimePicker } from '@/components/ui/antd-datepicker-impl';

// ── Upload (react-dropzone based) ─────────────────────────────────────────────
export { Upload } from '@/components/ui/antd-upload-impl';

// ── Misc (InputNumber, Menu, Steps, Slider, Timeline, Pagination, App, Config) ─
export {
  App,
  ConfigProvider,
  InputNumber,
  Menu,
  Pagination,
  Slider,
  Steps,
  Timeline,
} from '@/components/ui/antd-misc-impl';

// ── Rarely-used stubs (TreeSelect, Transfer, Cascader, Mentions, ColorPicker) ─
export {
  Cascader,
  ColorPicker,
  Mentions,
  Transfer,
  TreeSelect,
} from '@/components/ui/antd-passthrough';

// ── Convenience re-exports used across the codebase ───────────────────────────
// `App as AntdApp` pattern
export { App as AntdApp } from '@/components/ui/antd-misc-impl';

// Separator exposed as its own named export (some files import it directly)
export { Separator } from '@/components/ui/separator';

// Label, Skeleton — used directly in some pages
export { Label } from '@/components/ui/label';
export { Skeleton } from '@/components/ui/skeleton';
