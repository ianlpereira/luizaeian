import type { ThemeConfig } from 'antd'

import { theme } from '@/styles/theme'

/**
 * Ponte entre o tema do site (styles/theme.ts) e o Ant Design.
 *
 * Fica escopado à subárvore de /admin via ConfigProvider — as páginas dos
 * convidados não veem nada do AntD.
 */
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: theme.colors.primary,
    colorSuccess: theme.colors.success,
    colorError: theme.colors.error,
    colorLink: theme.colors.primary,
    colorBgContainer: theme.colors.surface,
    colorBgLayout: theme.colors.background,
    colorText: theme.colors.text.primary,
    colorTextSecondary: theme.colors.text.secondary,
    colorTextDescription: theme.colors.text.muted,
    colorBorder: theme.colors.border,
    colorBorderSecondary: theme.colors.borderLight,
    borderRadius: 8,
    fontFamily: theme.typography.fontFamily.sans,
  },
  components: {
    Table: {
      headerBg: theme.colors.surfaceAlt,
    },
  },
}
