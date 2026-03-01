// Modern Design System for UniCloud Admin Dashboard
// Following design principles from Material Design 3 and modern SaaS applications

export interface DesignTokenFontSize {
  0: string;
  1: {
    lineHeight: string;
    letterSpacing: string;
  };
}

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export type AccentScale = {
  50: string;
  100: string;
  200: string;
  500: string;
  600: string;
  700: string;
  900: string;
};

export type NeutralScale = ColorScale & {
  0: string;
  25: string;
};

export type SurfaceColors = {
  background: string;
  paper: string;
  elevated: string;
  overlay: string;
};

export type DesignTokenColors = {
  primary: ColorScale;
  secondary: ColorScale;
  neutral: NeutralScale;
  success: AccentScale;
  warning: AccentScale;
  error: AccentScale;
  info: AccentScale;
  surface: SurfaceColors;
};

export type FontWeightScale = {
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
  extrabold: number;
};

export type BorderRadiusScale = {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  main: string;
  "2xl": string;
  "3xl": string;
  full: string;
};

export type ShadowScale = {
  xs: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
};

export type TransitionDurationScale = {
  fast: string;
  normal: string;
  slow: string;
  slower: string;
};

export type TransitionEasingScale = {
  ease: string;
  linear: string;
  in: string;
  out: string;
  inOut: string;
};

export type BreakpointScale = {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
};

export type ZIndexScale = {
  auto: string;
  0: number;
  10: number;
  20: number;
  30: number;
  40: number;
  50: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
  dropdown: number;
};

export type DesignTokens = {
  colors: DesignTokenColors;
  typography: {
    fontFamily: {
      sans: string[];
      mono: string[];
    };
    fontSize: {
      xs: [string, { lineHeight: string; letterSpacing: string }];
      sm: [string, { lineHeight: string; letterSpacing: string }];
      base: [string, { lineHeight: string; letterSpacing: string }];
      lg: [string, { lineHeight: string; letterSpacing: string }];
      xl: [string, { lineHeight: string; letterSpacing: string }];
      "2xl": [string, { lineHeight: string; letterSpacing: string }];
      "3xl": [string, { lineHeight: string; letterSpacing: string }];
      "4xl": [string, { lineHeight: string; letterSpacing: string }];
      "5xl": [string, { lineHeight: string; letterSpacing: string }];
    };
    fontWeight: FontWeightScale;
  };
  spacing: {
    [key: string | number]: string;
  };
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  transitions: {
    duration: TransitionDurationScale;
    easing: TransitionEasingScale;
  };
  breakpoints: BreakpointScale;
  zIndex: ZIndexScale;
};

type ColorLike = Record<string | number, string | ColorLike>;

export const designTokens: DesignTokens = {
  // ==================== COLORS ====================
  colors: {
    // Primary Brand Colors
    primary: {
      50: "rgb(var(--theme-color-50))",
      100: "rgb(var(--theme-color-100))",
      200: "rgb(var(--theme-color-200))",
      300: "rgb(var(--theme-color-300))",
      400: "rgb(var(--theme-color-400))",
      500: "var(--theme-color)", // Main UniCloud brand color (dynamic)
      600: "rgb(var(--theme-color-600))",
      700: "rgb(var(--theme-color-700))",
      800: "rgb(var(--theme-color-800))",
      900: "rgb(var(--theme-color-900))",
      950: "rgb(var(--theme-color-900))",
    },

    // Secondary Colors - UniCloud Teal
    secondary: {
      50: "rgba(var(--secondary-color-rgb), 0.08)",
      100: "rgba(var(--secondary-color-rgb), 0.12)",
      200: "rgba(var(--secondary-color-rgb), 0.18)",
      300: "rgba(var(--secondary-color-rgb), 0.3)",
      400: "rgba(var(--secondary-color-rgb), 0.6)",
      500: "var(--secondary-color)", // UniCloud secondary/accent color (dynamic)
      600: "var(--secondary-color)",
      700: "var(--secondary-color)",
      800: "var(--secondary-color)",
      900: "var(--secondary-color)",
      950: "var(--secondary-color)",
    },

    // Neutral Grays - Modern balanced grays
    neutral: {
      0: "var(--surface-card)",
      25: "rgb(var(--theme-neutral-50))",
      50: "rgb(var(--theme-neutral-50))",
      100: "rgb(var(--theme-neutral-100))",
      200: "rgb(var(--theme-neutral-200))",
      300: "rgb(var(--theme-neutral-300))",
      400: "rgb(var(--theme-neutral-400))",
      500: "rgb(var(--theme-neutral-500))",
      600: "rgb(var(--theme-neutral-600))",
      700: "rgb(var(--theme-neutral-700))",
      800: "rgb(var(--theme-neutral-800))",
      900: "rgb(var(--theme-neutral-900))",
      950: "rgb(var(--theme-neutral-900))",
    },

    // Semantic Colors
    success: {
      50: "rgb(var(--theme-success-50))",
      100: "rgb(var(--theme-success-100))",
      200: "rgb(var(--theme-success-200))",
      500: "rgb(var(--theme-success-500))",
      600: "rgb(var(--theme-success-600))",
      700: "rgb(var(--theme-success-700))",
      900: "rgb(var(--theme-success-900))",
    },

    warning: {
      50: "rgb(var(--theme-warning-50))",
      100: "rgb(var(--theme-warning-100))",
      200: "rgb(var(--theme-warning-200))",
      500: "rgb(var(--theme-warning-500))",
      600: "rgb(var(--theme-warning-600))",
      700: "rgb(var(--theme-warning-700))",
      900: "rgb(var(--theme-warning-900))",
    },

    error: {
      50: "rgb(var(--theme-danger-50))",
      100: "rgb(var(--theme-danger-100))",
      200: "rgb(var(--theme-danger-200))",
      500: "rgb(var(--theme-danger-500))",
      600: "rgb(var(--theme-danger-600))",
      700: "rgb(var(--theme-danger-700))",
      900: "rgb(var(--theme-danger-900))",
    },

    info: {
      50: "rgb(var(--theme-color-50))",
      100: "rgb(var(--theme-color-100))",
      200: "rgb(var(--theme-color-200))",
      500: "rgb(var(--theme-color-500))",
      600: "rgb(var(--theme-color-600))",
      700: "rgb(var(--theme-color-700))",
      900: "rgb(var(--theme-color-900))",
    },

    // Surface colors for modern depth
    surface: {
      background: "var(--surface-page)",
      paper: "var(--surface-card)",
      elevated: "var(--surface-card)",
      overlay: "rgb(var(--theme-neutral-900) / 0.6)",
    },
  },

  // ==================== TYPOGRAPHY ====================
  typography: {
    fontFamily: {
      sans: ["var(--font-sans)"],
      mono: ["var(--font-mono)"],
    },

    fontSize: {
      xs: ["12px", { lineHeight: "16px", letterSpacing: "0.025em" }],
      sm: ["14px", { lineHeight: "20px", letterSpacing: "0.016em" }],
      base: ["16px", { lineHeight: "24px", letterSpacing: "0.010em" }],
      lg: ["18px", { lineHeight: "28px", letterSpacing: "0.008em" }],
      xl: ["20px", { lineHeight: "32px", letterSpacing: "0.006em" }],
      "2xl": ["24px", { lineHeight: "36px", letterSpacing: "0.004em" }],
      "3xl": ["32px", { lineHeight: "44px", letterSpacing: "0.002em" }],
      "4xl": ["40px", { lineHeight: "52px", letterSpacing: "0.001em" }],
      "5xl": ["48px", { lineHeight: "60px", letterSpacing: "0em" }],
    },

    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // ==================== SPACING & SIZING ====================
  spacing: {
    px: "1px",
    0: "0",
    0.5: "2px",
    1: "4px",
    1.5: "6px",
    2: "8px",
    2.5: "10px",
    3: "12px",
    3.5: "14px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
    9: "36px",
    10: "40px",
    11: "44px",
    12: "48px",
    14: "56px",
    16: "64px",
    20: "80px",
    24: "96px",
    28: "112px",
    32: "128px",
    36: "144px",
    40: "160px",
    44: "176px",
    48: "192px",
    52: "208px",
    56: "224px",
    60: "240px",
    64: "256px",
    72: "288px",
    80: "320px",
    96: "384px",
  },

  // ==================== BORDER RADIUS ====================
  borderRadius: {
    none: "0",
    sm: "4px",
    default: "6px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    main: "30px",
    "2xl": "20px",
    "3xl": "24px",
    full: "9999px",
  },

  // ==================== SHADOWS ====================
  shadows: {
    xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    sm: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    default: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    md: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    lg: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    xl: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  },

  // ==================== TRANSITIONS ====================
  transitions: {
    duration: {
      fast: "150ms",
      normal: "200ms",
      slow: "300ms",
      slower: "500ms",
    },
    easing: {
      ease: "ease",
      linear: "linear",
      in: "cubic-bezier(0.4, 0, 1, 1)",
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // ==================== BREAKPOINTS ====================
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // ==================== Z-INDEX ====================
  zIndex: {
    auto: "auto",
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
    dropdown: 1040,
  },
};

// Utility functions for working with design tokens
export const getColor = (path: string, alpha = 1) => {
  const keys = path.split(".");
  let value: string | ColorLike = designTokens.colors as unknown as ColorLike;

  for (const key of keys) {
    if (typeof value === "string") return null;
    const nextValue = value[key as keyof typeof value];
    if (nextValue === undefined) return null;
    value = nextValue;
  }

  if (typeof value !== "string") return null;
  if (alpha === 1) return value;
  if (value.startsWith("rgb") || value.startsWith("var(")) return value;

  // Convert hex to rgba
  const hex = value.replace("#", "");
  if (hex.length !== 6) return value;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getSpacing = (value: string | number) => designTokens.spacing[value] || value;

export const getShadow = (level: string) =>
  designTokens.shadows[level] || designTokens.shadows["default"];

export const getTransition = (
  property = "all",
  duration: keyof DesignTokens["transitions"]["duration"] = "normal",
  easing: keyof DesignTokens["transitions"]["easing"] = "inOut"
) => {
  return `${property} ${designTokens.transitions.duration[duration]} ${designTokens.transitions.easing[easing]}`;
};

// CSS Custom Properties for global usage
export const cssVariables = {
  ":root": {
    // Colors
    "--color-primary-50": designTokens.colors["primary"]?.[50],
    "--color-primary-100": designTokens.colors["primary"]?.[100],
    "--color-primary-500": designTokens.colors["primary"]?.[500],
    "--color-primary-600": designTokens.colors["primary"]?.[600],
    "--color-primary-700": designTokens.colors["primary"]?.[700],

    "--color-neutral-0": designTokens.colors["neutral"]?.[0],
    "--color-neutral-50": designTokens.colors["neutral"]?.[50],
    "--color-neutral-100": designTokens.colors["neutral"]?.[100],
    "--color-neutral-200": designTokens.colors["neutral"]?.[200],
    "--color-neutral-300": designTokens.colors["neutral"]?.[300],
    "--color-neutral-400": designTokens.colors["neutral"]?.[400],
    "--color-neutral-500": designTokens.colors["neutral"]?.[500],
    "--color-neutral-600": designTokens.colors["neutral"]?.[600],
    "--color-neutral-700": designTokens.colors["neutral"]?.[700],
    "--color-neutral-800": designTokens.colors["neutral"]?.[800],
    "--color-neutral-900": designTokens.colors["neutral"]?.[900],

    "--color-success-500": designTokens.colors["success"]?.[500],
    "--color-warning-500": designTokens.colors["warning"]?.[500],
    "--color-error-500": designTokens.colors["error"]?.[500],
    "--color-info-500": designTokens.colors["info"]?.[500],

    // Typography
    "--font-sans": designTokens.typography.fontFamily.sans.join(", "),
    "--font-mono": designTokens.typography.fontFamily.mono.join(", "),

    // Spacing
    "--spacing-1": designTokens.spacing[1],
    "--spacing-2": designTokens.spacing[2],
    "--spacing-3": designTokens.spacing[3],
    "--spacing-4": designTokens.spacing[4],
    "--spacing-5": designTokens.spacing[5],
    "--spacing-6": designTokens.spacing[6],
    "--spacing-8": designTokens.spacing[8],
    "--spacing-10": designTokens.spacing[10],
    "--spacing-12": designTokens.spacing[12],
    "--spacing-16": designTokens.spacing[16],

    // Border Radius
    "--radius-sm": designTokens.borderRadius["sm"],
    "--radius-default": designTokens.borderRadius["default"],
    "--radius-md": designTokens.borderRadius["md"],
    "--radius-lg": designTokens.borderRadius["lg"],
    "--radius-xl": designTokens.borderRadius["xl"],
    "--radius-2xl": designTokens.borderRadius["2xl"],
    "--radius-full": designTokens.borderRadius["full"],

    // Shadows
    "--shadow-xs": designTokens.shadows["xs"],
    "--shadow-sm": designTokens.shadows["sm"],
    "--shadow-default": designTokens.shadows["default"],
    "--shadow-md": designTokens.shadows["md"],
    "--shadow-lg": designTokens.shadows["lg"],
    "--shadow-xl": designTokens.shadows["xl"],

    // Transitions
    "--transition-fast": designTokens.transitions.duration["fast"],
    "--transition-normal": designTokens.transitions.duration["normal"],
    "--transition-slow": designTokens.transitions.duration["slow"],
    "--ease-in-out": designTokens.transitions.easing["inOut"],
  },
};

export default designTokens;
