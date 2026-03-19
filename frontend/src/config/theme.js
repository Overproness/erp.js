/**
 * Shared design tokens used by Ant Design ConfigProvider and Tailwind.
 * Single source of truth for colors, spacing, typography, and border radius.
 */
const theme = {
  colors: {
    primary: '#1890ff',
    primaryHover: '#40a9ff',
    primaryActive: '#096dd9',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    textPrimary: 'rgba(0, 0, 0, 0.85)',
    textSecondary: 'rgba(0, 0, 0, 0.45)',
    textDisabled: 'rgba(0, 0, 0, 0.25)',
    border: '#d9d9d9',
    borderLight: '#f0f0f0',
    background: '#f5f5f5',
    backgroundWhite: '#ffffff',
    backgroundDark: '#001529',
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  fontSize: {
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};

/**
 * Ant Design theme token configuration for ConfigProvider.
 */
export const antdTheme = {
  token: {
    colorPrimary: theme.colors.primary,
    colorSuccess: theme.colors.success,
    colorWarning: theme.colors.warning,
    colorError: theme.colors.error,
    colorInfo: theme.colors.info,
    colorTextBase: theme.colors.textPrimary,
    colorBorder: theme.colors.border,
    colorBgLayout: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.md,
  },
};

export default theme;
