export const theme = {
  colors: {
    primary: '#1677ff',
    primaryHover: '#4096ff',
    primaryActive: '#0958d9',

    secondary: '#722ed1',

    background: '#f5f5f5',
    surface: '#ffffff',
    surfaceHover: '#fafafa',

    text: {
      primary: '#1a1a1a',
      secondary: '#595959',
      disabled: '#bfbfbf',
      inverse: '#ffffff',
    },

    border: '#d9d9d9',
    borderLight: '#f0f0f0',

    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1677ff',

    overlay: 'rgba(0, 0, 0, 0.45)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    round: '50%',
  },

  typography: {
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '24px',
      xxl: '32px',
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },

  breakpoints: {
    xs: '480px',
    sm: '576px',
    md: '768px',
    lg: '992px',
    xl: '1200px',
    xxl: '1600px',
  },
} as const

export type Theme = typeof theme
