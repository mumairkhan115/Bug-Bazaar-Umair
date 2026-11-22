import type { ThemeConfig } from 'antd';
import { colors } from './tokens';

const theme = {
  token: {
    fontFamily: 'Rubik, sans-serif',
    colorPrimary: colors.primary,
    colorInfo: colors.info,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorText: colors.text,
    colorTextSecondary: colors.textSecondary,
    colorBorder: colors.border,
    colorBgLayout: colors.bgLayout,
    colorBgContainer: colors.bg,
    borderRadius: 8,
  },
  components: {
    Button: {
      primaryShadow: 'none',
      defaultShadow: 'none',
    },
    Layout: {
      headerBg: colors.bg,
      siderBg: colors.bg,
      bodyBg: colors.bgLayout,
      triggerBg: colors.bgLayout,
      triggerColor: colors.text,
    },
    Menu: {
      itemSelectedBg: 'rgb(194 24 91 / 12%)',
      itemSelectedColor: colors.primary,
    },
    Card: {
      colorBorderSecondary: colors.border,
      borderRadiusLG: 8,
    },
  },
} satisfies ThemeConfig;

export default theme;
