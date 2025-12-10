// Responsive Design Utilities and Breakpoint System
import { useState, useEffect } from "react";

export const breakpoints = {
  xs: "475px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs})`,
  sm: `(min-width: ${breakpoints.sm})`,
  md: `(min-width: ${breakpoints.md})`,
  lg: `(min-width: ${breakpoints.lg})`,
  xl: `(min-width: ${breakpoints.xl})`,
  "2xl": `(min-width: ${breakpoints["2xl"]})`,

  // Max-width queries
  "max-xs": `(max-width: ${parseInt(breakpoints.xs) - 1}px)`,
  "max-sm": `(max-width: ${parseInt(breakpoints.sm) - 1}px)`,
  "max-md": `(max-width: ${parseInt(breakpoints.md) - 1}px)`,
  "max-lg": `(max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  "max-xl": `(max-width: ${parseInt(breakpoints.xl) - 1}px)`,

  // Range queries
  "sm-md": `(min-width: ${breakpoints.sm}) and (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  "md-lg": `(min-width: ${breakpoints.md}) and (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
  "lg-xl": `(min-width: ${breakpoints.lg}) and (max-width: ${parseInt(breakpoints.xl) - 1}px)`,

  // Orientation and special queries
  landscape: "(orientation: landscape)",
  portrait: "(orientation: portrait)",
  touchDevice: "(pointer: coarse)",
  mouse: "(pointer: fine)",
  reducedMotion: "(prefers-reduced-motion: reduce)",
  darkMode: "(prefers-color-scheme: dark)",
  lightMode: "(prefers-color-scheme: light)",
};

// React hook for responsive breakpoints
export const useBreakpoint = () => {
  const [currentBreakpoint, setCurrentBreakpoint] = useState("sm");
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      setWindowSize({ width, height: window.innerHeight });

      if (width >= parseInt(breakpoints["2xl"])) {
        setCurrentBreakpoint("2xl");
      } else if (width >= parseInt(breakpoints.xl)) {
        setCurrentBreakpoint("xl");
      } else if (width >= parseInt(breakpoints.lg)) {
        setCurrentBreakpoint("lg");
      } else if (width >= parseInt(breakpoints.md)) {
        setCurrentBreakpoint("md");
      } else if (width >= parseInt(breakpoints.sm)) {
        setCurrentBreakpoint("sm");
      } else {
        setCurrentBreakpoint("xs");
      }
    };

    updateBreakpoint();
    window.addEventListener("resize", updateBreakpoint);

    return () => window.removeEventListener("resize", updateBreakpoint);
  }, []);

  const isBreakpoint = (bp) => currentBreakpoint === bp;
  const isAbove = (bp) => {
    const bpOrder = ["xs", "sm", "md", "lg", "xl", "2xl"];
    const currentIndex = bpOrder.indexOf(currentBreakpoint);
    const targetIndex = bpOrder.indexOf(bp);
    return currentIndex > targetIndex;
  };
  const isBelow = (bp) => {
    const bpOrder = ["xs", "sm", "md", "lg", "xl", "2xl"];
    const currentIndex = bpOrder.indexOf(currentBreakpoint);
    const targetIndex = bpOrder.indexOf(bp);
    return currentIndex < targetIndex;
  };

  return {
    currentBreakpoint,
    windowSize,
    isMobile: isBelow("md"),
    isTablet: currentBreakpoint === "md",
    isDesktop: isAbove("md"),
    isBreakpoint,
    isAbove,
    isBelow,
  };
};

// Responsive grid utilities
export const gridUtils = {
  // Generate responsive grid classes
  getGridClasses: (cols = {}) => {
    const classes = [];

    Object.entries(cols).forEach(([breakpoint, colCount]) => {
      if (breakpoint === "default") {
        classes.push(`grid-cols-${colCount}`);
      } else {
        classes.push(`${breakpoint}:grid-cols-${colCount}`);
      }
    });

    return classes.join(" ");
  },

  // Generate responsive gap classes
  getGapClasses: (gaps = {}) => {
    const classes = [];

    Object.entries(gaps).forEach(([breakpoint, gapSize]) => {
      if (breakpoint === "default") {
        classes.push(`gap-${gapSize}`);
      } else {
        classes.push(`${breakpoint}:gap-${gapSize}`);
      }
    });

    return classes.join(" ");
  },

  // Generate responsive padding classes
  getPaddingClasses: (padding = {}) => {
    const classes = [];

    Object.entries(padding).forEach(([breakpoint, paddingSize]) => {
      if (breakpoint === "default") {
        classes.push(`p-${paddingSize}`);
      } else {
        classes.push(`${breakpoint}:p-${paddingSize}`);
      }
    });

    return classes.join(" ");
  },
};

// Responsive typography utilities
export const typographyUtils = {
  // Generate responsive text size classes
  getTextSizeClasses: (sizes = {}) => {
    const classes = [];

    Object.entries(sizes).forEach(([breakpoint, size]) => {
      if (breakpoint === "default") {
        classes.push(`text-${size}`);
      } else {
        classes.push(`${breakpoint}:text-${size}`);
      }
    });

    return classes.join(" ");
  },

  // Generate responsive line height classes
  getLineHeightClasses: (heights = {}) => {
    const classes = [];

    Object.entries(heights).forEach(([breakpoint, height]) => {
      if (breakpoint === "default") {
        classes.push(`leading-${height}`);
      } else {
        classes.push(`${breakpoint}:leading-${height}`);
      }
    });

    return classes.join(" ");
  },
};

// Responsive layout utilities
export const layoutUtils = {
  // Generate responsive flexbox classes
  getFlexClasses: (config = {}) => {
    const classes = [];

    Object.entries(config).forEach(([property, values]) => {
      if (typeof values === "object") {
        Object.entries(values).forEach(([breakpoint, value]) => {
          if (breakpoint === "default") {
            classes.push(`${property}-${value}`);
          } else {
            classes.push(`${breakpoint}:${property}-${value}`);
          }
        });
      } else {
        classes.push(`${property}-${values}`);
      }
    });

    return classes.join(" ");
  },

  // Generate responsive display classes
  getDisplayClasses: (displays = {}) => {
    const classes = [];

    Object.entries(displays).forEach(([breakpoint, display]) => {
      if (breakpoint === "default") {
        classes.push(display);
      } else {
        classes.push(`${breakpoint}:${display}`);
      }
    });

    return classes.join(" ");
  },

  // Generate responsive width classes
  getWidthClasses: (widths = {}) => {
    const classes = [];

    Object.entries(widths).forEach(([breakpoint, width]) => {
      if (breakpoint === "default") {
        classes.push(`w-${width}`);
      } else {
        classes.push(`${breakpoint}:w-${width}`);
      }
    });

    return classes.join(" ");
  },
};

// Component-specific responsive utilities
export const componentUtils = {
  // Admin dashboard responsive classes
  getDashboardClasses: () => ({
    container: "w-full px-4 sm:px-6 lg:px-8",
    grid: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6",
    card: "w-full h-auto",
    table: "overflow-x-auto",
    sidebar: "w-full md:w-20 lg:w-64",
    header: "h-16 md:h-18 lg:h-20",
    content: "pt-16 md:pt-18 lg:pt-20 pl-0 md:pl-20 lg:pl-64",
  }),

  // Modern table responsive classes
  getTableClasses: () => ({
    container: "overflow-hidden rounded-lg border border-gray-200",
    wrapper: "overflow-x-auto",
    table: "min-w-full divide-y divide-gray-200",
    header: "bg-gray-50",
    headerCell:
      "px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
    body: "bg-white divide-y divide-gray-200",
    bodyCell: "px-3 py-4 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900",
    mobileCard: "block md:hidden border-b border-gray-200 p-4",
    desktopTable: "hidden md:table",
  }),

  // Modern form responsive classes
  getFormClasses: () => ({
    container: "max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto",
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6",
    input: "w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base",
    label: "text-sm sm:text-base font-medium text-gray-700",
    button: "w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3",
    buttonGroup: "flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end",
  }),

  // Modern modal responsive classes
  getModalClasses: () => ({
    backdrop: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4",
    container: "w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl",
    content: "bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden",
    header: "px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200",
    body: "px-4 py-3 sm:px-6 sm:py-4 max-h-[60vh] overflow-y-auto",
    footer: "px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 bg-gray-50",
  }),

  // Navigation responsive classes
  getNavigationClasses: () => ({
    sidebar:
      "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
    sidebarMobile: "lg:hidden",
    sidebarDesktop: "hidden lg:block",
    header:
      "sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8",
    mobileMenuButton: "lg:hidden",
    content: "lg:pl-64",
  }),
};

// CSS-in-JS responsive styles generator
export const createResponsiveStyles = (styles = {}) => {
  const responsiveStyles = {};

  Object.entries(styles).forEach(([selector, rules]) => {
    responsiveStyles[selector] = {};

    Object.entries(rules).forEach(([property, values]) => {
      if (typeof values === "object" && values.default) {
        // Handle responsive values
        responsiveStyles[selector][property] = values.default;

        Object.entries(values).forEach(([breakpoint, value]) => {
          if (breakpoint !== "default" && mediaQueries[breakpoint]) {
            if (!responsiveStyles[`@media ${mediaQueries[breakpoint]}`]) {
              responsiveStyles[`@media ${mediaQueries[breakpoint]}`] = {};
            }
            if (!responsiveStyles[`@media ${mediaQueries[breakpoint]}`][selector]) {
              responsiveStyles[`@media ${mediaQueries[breakpoint]}`][selector] = {};
            }
            responsiveStyles[`@media ${mediaQueries[breakpoint]}`][selector][property] = value;
          }
        });
      } else {
        // Handle non-responsive values
        responsiveStyles[selector][property] = values;
      }
    });
  });

  return responsiveStyles;
};

// Responsive image utilities
export const imageUtils = {
  // Generate responsive image sizes
  getImageSizes: () => ({
    xs: "100vw",
    sm: "(min-width: 640px) 50vw, 100vw",
    md: "(min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw",
    lg: "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw",
  }),

  // Generate srcSet for responsive images
  generateSrcSet: (baseUrl, widths = [320, 640, 768, 1024, 1280, 1536]) => {
    return widths.map((width) => `${baseUrl}?w=${width} ${width}w`).join(", ");
  },
};

export default {
  breakpoints,
  mediaQueries,
  useBreakpoint,
  gridUtils,
  typographyUtils,
  layoutUtils,
  componentUtils,
  createResponsiveStyles,
  imageUtils,
};
