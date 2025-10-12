// Modern Design System for UniCloud Admin Dashboard
// Following design principles from Material Design 3 and modern SaaS applications

export const designTokens = {
  // ==================== COLORS ====================
  colors: {
    // Primary Brand Colors - UniCloud Cyan/Turquoise
    primary: {
      50: '#ecfeff',
      100: '#cffafe', 
      200: '#a5f3fc',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4', // Main UniCloud brand color
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344'
    },

    // Secondary Colors - UniCloud Purple/Magenta
    secondary: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef', // UniCloud secondary/accent color
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e'
    },

    // Neutral Grays - Modern balanced grays
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712'
    },

    // Semantic Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      900: '#14532d'
    },

    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      900: '#78350f'
    },

    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      900: '#7f1d1d'
    },

    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490',
      900: '#164e63'
    },

    // Surface colors for modern depth
    surface: {
      background: '#fafbfc',
      paper: '#ffffff',
      elevated: '#ffffff',
      overlay: 'rgba(15, 23, 42, 0.6)'
    }
  },

  // ==================== TYPOGRAPHY ====================
  typography: {
    fontFamily: {
      sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Monaco', 'Menlo', 'monospace']
    },
    
    fontSize: {
      xs: ['12px', { lineHeight: '16px', letterSpacing: '0.025em' }],
      sm: ['14px', { lineHeight: '20px', letterSpacing: '0.016em' }],
      base: ['16px', { lineHeight: '24px', letterSpacing: '0.010em' }],
      lg: ['18px', { lineHeight: '28px', letterSpacing: '0.008em' }],
      xl: ['20px', { lineHeight: '32px', letterSpacing: '0.006em' }],
      '2xl': ['24px', { lineHeight: '36px', letterSpacing: '0.004em' }],
      '3xl': ['32px', { lineHeight: '44px', letterSpacing: '0.002em' }],
      '4xl': ['40px', { lineHeight: '52px', letterSpacing: '0.001em' }],
      '5xl': ['48px', { lineHeight: '60px', letterSpacing: '0em' }]
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    }
  },

  // ==================== SPACING & SIZING ====================
  spacing: {
    px: '1px',
    0: '0',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px'
  },

  // ==================== BORDER RADIUS ====================
  borderRadius: {
    none: '0',
    sm: '4px',
    default: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px'
  },

  // ==================== SHADOWS ====================
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    default: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },

  // ==================== TRANSITIONS ====================
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms'
    },
    easing: {
      ease: 'ease',
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  // ==================== BREAKPOINTS ====================
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  },

  // ==================== Z-INDEX ====================
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    modal: 1000,
    popover: 1010,
    tooltip: 1020,
    toast: 1030,
    dropdown: 1040
  }
};

// Utility functions for working with design tokens
export const getColor = (path, alpha = 1) => {
  const keys = path.split('.');
  let value = designTokens.colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return null;
  }
  
  if (alpha === 1) return value;
  
  // Convert hex to rgba
  const hex = value.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getSpacing = (value) => designTokens.spacing[value] || value;

export const getShadow = (level) => designTokens.shadows[level] || designTokens.shadows.default;

export const getTransition = (property = 'all', duration = 'normal', easing = 'inOut') => {
  return `${property} ${designTokens.transitions.duration[duration]} ${designTokens.transitions.easing[easing]}`;
};

// CSS Custom Properties for global usage
export const cssVariables = {
  ':root': {
    // Colors
    '--color-primary-50': designTokens.colors.primary[50],
    '--color-primary-100': designTokens.colors.primary[100],
    '--color-primary-500': designTokens.colors.primary[500],
    '--color-primary-600': designTokens.colors.primary[600],
    '--color-primary-700': designTokens.colors.primary[700],
    
    '--color-neutral-0': designTokens.colors.neutral[0],
    '--color-neutral-50': designTokens.colors.neutral[50],
    '--color-neutral-100': designTokens.colors.neutral[100],
    '--color-neutral-200': designTokens.colors.neutral[200],
    '--color-neutral-300': designTokens.colors.neutral[300],
    '--color-neutral-400': designTokens.colors.neutral[400],
    '--color-neutral-500': designTokens.colors.neutral[500],
    '--color-neutral-600': designTokens.colors.neutral[600],
    '--color-neutral-700': designTokens.colors.neutral[700],
    '--color-neutral-800': designTokens.colors.neutral[800],
    '--color-neutral-900': designTokens.colors.neutral[900],
    
    '--color-success-500': designTokens.colors.success[500],
    '--color-warning-500': designTokens.colors.warning[500],
    '--color-error-500': designTokens.colors.error[500],
    '--color-info-500': designTokens.colors.info[500],
    
    // Typography
    '--font-sans': designTokens.typography.fontFamily.sans.join(', '),
    '--font-mono': designTokens.typography.fontFamily.mono.join(', '),
    
    // Spacing
    '--spacing-1': designTokens.spacing[1],
    '--spacing-2': designTokens.spacing[2],
    '--spacing-3': designTokens.spacing[3],
    '--spacing-4': designTokens.spacing[4],
    '--spacing-5': designTokens.spacing[5],
    '--spacing-6': designTokens.spacing[6],
    '--spacing-8': designTokens.spacing[8],
    '--spacing-10': designTokens.spacing[10],
    '--spacing-12': designTokens.spacing[12],
    '--spacing-16': designTokens.spacing[16],
    
    // Border Radius
    '--radius-sm': designTokens.borderRadius.sm,
    '--radius-default': designTokens.borderRadius.default,
    '--radius-md': designTokens.borderRadius.md,
    '--radius-lg': designTokens.borderRadius.lg,
    '--radius-xl': designTokens.borderRadius.xl,
    '--radius-2xl': designTokens.borderRadius['2xl'],
    '--radius-full': designTokens.borderRadius.full,
    
    // Shadows
    '--shadow-xs': designTokens.shadows.xs,
    '--shadow-sm': designTokens.shadows.sm,
    '--shadow-default': designTokens.shadows.default,
    '--shadow-md': designTokens.shadows.md,
    '--shadow-lg': designTokens.shadows.lg,
    '--shadow-xl': designTokens.shadows.xl,
    
    // Transitions
    '--transition-fast': designTokens.transitions.duration.fast,
    '--transition-normal': designTokens.transitions.duration.normal,
    '--transition-slow': designTokens.transitions.duration.slow,
    '--ease-in-out': designTokens.transitions.easing.inOut
  }
};

export default designTokens;