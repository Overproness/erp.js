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
  Typography,
  Tag,
  Badge,
  Avatar,
  Spin,
  Empty,
  Statistic,
  Descriptions,
  DescriptionsItem,
  List,
  Result,
  Rate,
} from '@/components/ui/antd-display';
export type {
  TagProps,
  BadgeProps,
  AvatarProps,
  SpinProps,
  EmptyProps,
  StatisticProps,
  DescriptionsProps,
  DescriptionsItemProps,
  ListProps,
  ListItemProps,
  ResultProps,
  RateProps,
} from '@/components/ui/antd-display';

// ── Layout ────────────────────────────────────────────────────────────────────
export { Space, Row, Col, Layout, Divider, Grid } from '@/components/ui/antd-layout';
export type { SpaceProps, RowProps, ColProps, DividerProps } from '@/components/ui/antd-layout';

// ── Overlay / feedback ────────────────────────────────────────────────────────
export {
  Alert,
  Modal,
  Drawer,
  Tooltip,
  Popover,
  Popconfirm,
  message,
  notification,
} from '@/components/ui/antd-overlay';
export type {
  AlertProps,
  ModalProps,
  DrawerProps,
  TooltipProps,
  PopoverProps,
  PopconfirmProps,
} from '@/components/ui/antd-overlay';

// ── Form controls / navigation ────────────────────────────────────────────────
export {
  Checkbox,
  Switch,
  Radio,
  Progress,
  Collapse,
  Tabs,
  Dropdown,
  Card,
} from '@/components/ui/antd-form';
export type {
  CheckboxProps,
  SwitchProps,
  RadioProps,
  ProgressProps,
  CollapseProps,
  TabsProps,
  DropdownProps,
  CardProps,
} from '@/components/ui/antd-form';

// ── Form (rc-field-form based) ────────────────────────────────────────────────
export { Form } from '@/components/ui/antd-form-impl';

// ── Table (@tanstack/react-table based) ───────────────────────────────────────
export { Table } from '@/components/ui/antd-table-impl';

// ── Select / AutoComplete (radix popover based) ───────────────────────────────
export { Select, AutoComplete } from '@/components/ui/antd-select-impl';

// ── Date / Time pickers (shadcn calendar based) ───────────────────────────────
export { DatePicker, TimePicker, Calendar } from '@/components/ui/antd-datepicker-impl';

// ── Upload (react-dropzone based) ─────────────────────────────────────────────
export { Upload } from '@/components/ui/antd-upload-impl';

// ── Misc (InputNumber, Menu, Steps, Slider, Timeline, Pagination, App, Config) ─
export {
  InputNumber,
  Menu,
  Steps,
  Pagination,
  Slider,
  Timeline,
  App,
  ConfigProvider,
} from '@/components/ui/antd-misc-impl';

// ── Rarely-used stubs (TreeSelect, Transfer, Cascader, Mentions, ColorPicker) ─
export {
  TreeSelect,
  Transfer,
  Cascader,
  Mentions,
  ColorPicker,
} from '@/components/ui/antd-passthrough';

// ── Convenience re-exports used across the codebase ───────────────────────────
// `App as AntdApp` pattern
export { App as AntdApp } from '@/components/ui/antd-misc-impl';

// Separator exposed as its own named export (some files import it directly)
export { Separator } from '@/components/ui/separator';

// Label, Skeleton — used directly in some pages
export { Label } from '@/components/ui/label';
export { Skeleton } from '@/components/ui/skeleton';
