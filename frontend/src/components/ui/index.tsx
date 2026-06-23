/**
 * @/components/ui/index.tsx
 *
 * Shared application UI exports built on shadcn, Radix, TanStack, and small
 * local compatibility components.
 */

// ── Button ────────────────────────────────────────────────────────────────────
export { Button } from '@/components/ui/button-compat';
export type { ButtonProps } from '@/components/ui/button-compat';

// ── Input family ──────────────────────────────────────────────────────────────
export { Input, TextArea } from '@/components/ui/input-compat';
export type { InputProps } from '@/components/ui/input-compat';

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
} from '@/components/ui/display';
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
} from '@/components/ui/display';

// ── Layout ────────────────────────────────────────────────────────────────────
export { Col, Divider, Grid, Layout, Row, Space } from '@/components/ui/layout-compat';
export type { ColProps, DividerProps, RowProps, SpaceProps } from '@/components/ui/layout-compat';

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
} from '@/components/ui/feedback';
export type {
  AlertProps,
  DrawerProps,
  ModalProps,
  PopconfirmProps,
  PopoverProps,
  TooltipProps,
} from '@/components/ui/feedback';

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
} from '@/components/ui/controls';
export type {
  CardProps,
  CheckboxProps,
  CollapseProps,
  DropdownProps,
  ProgressProps,
  RadioProps,
  SwitchProps,
  TabsProps,
} from '@/components/ui/controls';

// ── Form (rc-field-form based) ────────────────────────────────────────────────
export { Form } from '@/components/ui/form-compat';

// ── Table (@tanstack/react-table based) ───────────────────────────────────────
export { Table } from '@/components/ui/data-table';

// ── Select / AutoComplete (radix popover based) ───────────────────────────────
export { AutoComplete, Select } from '@/components/ui/select-compat';

// ── Date / Time pickers (shadcn calendar based) ───────────────────────────────
export { Calendar, DatePicker, TimePicker } from '@/components/ui/date-time-picker';

// ── Upload (react-dropzone based) ─────────────────────────────────────────────
export { Upload } from '@/components/ui/upload';

// ── Misc (InputNumber, Menu, Steps, Slider, Timeline, Pagination, App, Config) ─
export {
  App,
  InputNumber,
  Menu,
  Pagination,
  Slider,
  Steps,
  Timeline,
} from '@/components/ui/composite';

// ── Rarely-used stubs (TreeSelect, Transfer, Cascader, Mentions, ColorPicker) ─
export {
  Cascader,
  ColorPicker,
  Mentions,
  Transfer,
  TreeSelect,
} from '@/components/ui/uncommon';

// ── Page structure ────────────────────────────────────────────────────────────
export { PageHeader } from '@/components/ui/page-header';

// ── Convenience re-exports used across the codebase ───────────────────────────

// Separator exposed as its own named export (some files import it directly)
export { Separator } from '@/components/ui/separator';

// Label, Skeleton — used directly in some pages
export { Label } from '@/components/ui/label';
export { Skeleton } from '@/components/ui/skeleton';
