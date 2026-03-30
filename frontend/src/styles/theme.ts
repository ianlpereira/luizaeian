export const theme = {
  colors: {
    primary: '#7aab8e',         // verde salvia pastel
    primaryHover: '#5e9474',    // verde salvia escuro (hover)
    primaryLight: '#c8ddd0',    // verde salvia claro

    secondary: '#d4a0a7',       // rosa blush pastel
    secondaryLight: '#f0dce0',  // rosa blush claro

    background: '#f7f9f7',      // off-white com nuance verde
    surface: '#ffffff',
    surfaceAlt: '#eef3f0',      // superfície levemente verde

    text: {
      primary: '#2e3830',
      secondary: '#6b7d72',
      muted: '#9aab9f',
      inverse: '#ffffff',
    },

    border: '#d6e0da',
    borderLight: '#e8efe9',

    overlay: 'rgba(0, 0, 0, 0.45)',
    overlayLight: 'rgba(0, 0, 0, 0.25)',

    success: '#7cb87a',
    error: '#c97070',

    // Cores de acento (natureza)
    accent1: '#a8c5d6',         // azul céu pastel
    accent2: '#d4a0a7',         // rosa blush
    accent3: '#c9c196',         // dourado folha seca
  },

  typography: {
    fontFamily: {
      serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      xxl: '40px',
      hero: '56px',
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '48px',
    xxl: '80px',
    section: '120px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '16px',
    xl: '24px',
    round: '50%',
    pill: '999px',
  },

  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.08)',
    md: '0 4px 12px rgba(0, 0, 0, 0.08)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.10)',
    xl: '0 16px 40px rgba(0, 0, 0, 0.12)',
    golden: '0 4px 20px rgba(122, 171, 142, 0.25)',
  },

  // Mobile-first: breakpoints em min-width
  breakpoints: {
    xs: '360px',   // small phones
    sm: '390px',   // iPhone 14/15
    md: '414px',   // large phones
    lg: '768px',   // tablet portrait
    xl: '1024px',  // tablet landscape / small desktop
    xxl: '1440px', // desktop
  },

  transitions: {
    fast: '150ms ease',
    normal: '300ms ease',
    slow: '500ms ease',
  },
} as const

export type Theme = typeof theme
