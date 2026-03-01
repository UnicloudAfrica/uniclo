import { useState, useEffect } from "react";
import { designTokens } from "../styles/designTokens";

export interface ResponsiveValues<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

// Hook for detecting screen size and managing responsive behavior
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? globalThis.window.innerWidth : 1024,
    height: typeof window !== "undefined" ? globalThis.window.innerHeight : 768,
  });

  const [device, setDevice] = useState("desktop");

  useEffect(() => {
    const handleResize = () => {
      const width = globalThis.window.innerWidth;
      const height = globalThis.window.innerHeight;

      setScreenSize({ width, height });

      // Determine device type based on width
      if (width < parseInt(designTokens.breakpoints.md)) {
        setDevice("mobile");
      } else if (width < parseInt(designTokens.breakpoints.lg)) {
        setDevice("tablet");
      } else {
        setDevice("desktop");
      }
    };

    // Initial check
    handleResize();

    globalThis.window.addEventListener("resize", handleResize);
    return () => globalThis.window.removeEventListener("resize", handleResize);
  }, []);

  // Media query utilities
  const isMobile = screenSize.width < parseInt(designTokens.breakpoints.md);
  const isTablet =
    screenSize.width >= parseInt(designTokens.breakpoints.md) &&
    screenSize.width < parseInt(designTokens.breakpoints.lg);
  const isDesktop = screenSize.width >= parseInt(designTokens.breakpoints.lg);

  // Specific breakpoint checks
  const isSmScreen = screenSize.width < parseInt(designTokens.breakpoints.sm);
  const isMdScreen =
    screenSize.width >= parseInt(designTokens.breakpoints.md) &&
    screenSize.width < parseInt(designTokens.breakpoints.lg);
  const isLgScreen =
    screenSize.width >= parseInt(designTokens.breakpoints.lg) &&
    screenSize.width < parseInt(designTokens.breakpoints.xl);
  const isXlScreen = screenSize.width >= parseInt(designTokens.breakpoints.xl);

  // Utility functions for responsive values
  const getResponsiveValue = <T>(values: T | T[] | ResponsiveValues<T>): T => {
    if (typeof values !== "object" || values === null) {
      return values as T;
    }

    // Handle array format [mobile, tablet, desktop]
    if (Array.isArray(values)) {
      if (isMobile && values[0] !== undefined) return values[0];
      if (isTablet && values[1] !== undefined) return values[1];
      if (isDesktop && values[2] !== undefined) return values[2];
      return values[values.length - 1]; // fallback to last value
    }

    const responsiveValues = values as ResponsiveValues<T>;

    // Handle object format { mobile: X, tablet: Y, desktop: Z }
    if (isMobile && responsiveValues.mobile !== undefined) return responsiveValues.mobile;
    if (isTablet && responsiveValues.tablet !== undefined) return responsiveValues.tablet;
    if (isDesktop && responsiveValues.desktop !== undefined) return responsiveValues.desktop;

    // Handle object format with breakpoint names { sm: X, md: Y, lg: Z, xl: W }
    if (isSmScreen && responsiveValues.sm !== undefined) return responsiveValues.sm;
    if (isMdScreen && responsiveValues.md !== undefined) return responsiveValues.md;
    if (isLgScreen && responsiveValues.lg !== undefined) return responsiveValues.lg;
    if (isXlScreen && responsiveValues.xl !== undefined) return responsiveValues.xl;

    // Fallback: return first available value or the value itself
    return (responsiveValues.desktop ||
      responsiveValues.lg ||
      responsiveValues.md ||
      responsiveValues.sm ||
      values) as T;
  };

  const getColumnsCount = (config: ResponsiveValues<number>): number => {
    const defaultConfig = { mobile: 1, tablet: 2, desktop: 4 };
    const mergedConfig = { ...defaultConfig, ...config };
    return getResponsiveValue(mergedConfig);
  };

  const getFontSize = <T>(sizes: ResponsiveValues<T>): T => {
    return getResponsiveValue(sizes);
  };

  const getSpacing = <T>(spacing: ResponsiveValues<T>): T => {
    return getResponsiveValue(spacing);
  };

  // Component visibility utilities
  const showOnMobile = isMobile;
  const showOnTablet = isTablet;
  const showOnDesktop = isDesktop;
  const hideOnMobile = !isMobile;
  const hideOnTablet = !isTablet;
  const hideOnDesktop = !isDesktop;

  return {
    screenSize,
    device,
    isMobile,
    isTablet,
    isDesktop,
    isSmScreen,
    isMdScreen,
    isLgScreen,
    isXlScreen,
    getResponsiveValue,
    getColumnsCount,
    getFontSize,
    getSpacing,
    showOnMobile,
    showOnTablet,
    showOnDesktop,
    hideOnMobile,
    hideOnTablet,
    hideOnDesktop,
  };
};

// Hook for managing responsive grid layouts
export const useResponsiveGrid = (baseColumns = 4) => {
  const { device, getColumnsCount } = useResponsive();

  const getGridColumns = (customConfig?: ResponsiveValues<number>): number => {
    const defaultConfig = {
      mobile: 1,
      tablet: Math.min(2, baseColumns),
      desktop: baseColumns,
    };

    const config = customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig;
    return getColumnsCount(config);
  };

  const getGridClass = (customConfig?: ResponsiveValues<number>): string => {
    const columns = getGridColumns(customConfig);
    return `grid grid-cols-${columns}`;
  };

  return {
    device,
    getGridColumns,
    getGridClass,
  };
};

// Hook for responsive container management
export const useResponsiveContainer = () => {
  const { device, isMobile, isTablet } = useResponsive();

  const getContainerPadding = (): string => {
    if (isMobile) return designTokens.spacing[4]; // 16px
    if (isTablet) return designTokens.spacing[6]; // 24px
    return designTokens.spacing[8]; // 32px
  };

  const getContainerMaxWidth = (): string => {
    if (isMobile) return "100%";
    if (isTablet) return designTokens.breakpoints.md;
    return designTokens.breakpoints.xl;
  };

  const getContainerClass = (): string => {
    return `w-full max-w-screen-${device === "mobile" ? "sm" : device === "tablet" ? "md" : "xl"} mx-auto px-${device === "mobile" ? "4" : device === "tablet" ? "6" : "8"}`;
  };

  return {
    device,
    getContainerPadding,
    getContainerMaxWidth,
    getContainerClass,
  };
};

export default useResponsive;
