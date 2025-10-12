import { useState, useEffect } from 'react';
import { designTokens } from '../styles/designTokens';

// Hook for detecting screen size and managing responsive behavior
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  });

  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      
      // Determine device type based on width
      if (width < parseInt(designTokens.breakpoints.md)) {
        setDevice('mobile');
      } else if (width < parseInt(designTokens.breakpoints.lg)) {
        setDevice('tablet');
      } else {
        setDevice('desktop');
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Media query utilities
  const isMobile = screenSize.width < parseInt(designTokens.breakpoints.md);
  const isTablet = screenSize.width >= parseInt(designTokens.breakpoints.md) && 
                   screenSize.width < parseInt(designTokens.breakpoints.lg);
  const isDesktop = screenSize.width >= parseInt(designTokens.breakpoints.lg);

  // Specific breakpoint checks
  const isSmScreen = screenSize.width < parseInt(designTokens.breakpoints.sm);
  const isMdScreen = screenSize.width >= parseInt(designTokens.breakpoints.md) && 
                     screenSize.width < parseInt(designTokens.breakpoints.lg);
  const isLgScreen = screenSize.width >= parseInt(designTokens.breakpoints.lg) && 
                     screenSize.width < parseInt(designTokens.breakpoints.xl);
  const isXlScreen = screenSize.width >= parseInt(designTokens.breakpoints.xl);

  // Utility functions for responsive values
  const getResponsiveValue = (values) => {
    if (typeof values !== 'object' || values === null) {
      return values;
    }

    // Handle array format [mobile, tablet, desktop]
    if (Array.isArray(values)) {
      if (isMobile && values[0] !== undefined) return values[0];
      if (isTablet && values[1] !== undefined) return values[1];
      if (isDesktop && values[2] !== undefined) return values[2];
      return values[values.length - 1]; // fallback to last value
    }

    // Handle object format { mobile: X, tablet: Y, desktop: Z }
    if (isMobile && values.mobile !== undefined) return values.mobile;
    if (isTablet && values.tablet !== undefined) return values.tablet;
    if (isDesktop && values.desktop !== undefined) return values.desktop;

    // Handle object format with breakpoint names { sm: X, md: Y, lg: Z, xl: W }
    if (isSmScreen && values.sm !== undefined) return values.sm;
    if (isMdScreen && values.md !== undefined) return values.md;
    if (isLgScreen && values.lg !== undefined) return values.lg;
    if (isXlScreen && values.xl !== undefined) return values.xl;

    // Fallback: return first available value or the value itself
    return values.desktop || values.lg || values.md || values.sm || values;
  };

  const getColumnsCount = (config) => {
    const defaultConfig = { mobile: 1, tablet: 2, desktop: 4 };
    const mergedConfig = { ...defaultConfig, ...config };
    return getResponsiveValue(mergedConfig);
  };

  const getFontSize = (sizes) => {
    return getResponsiveValue(sizes);
  };

  const getSpacing = (spacing) => {
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
    hideOnDesktop
  };
};

// Hook for managing responsive grid layouts
export const useResponsiveGrid = (baseColumns = 4) => {
  const { device, getColumnsCount } = useResponsive();
  
  const getGridColumns = (customConfig) => {
    const defaultConfig = {
      mobile: 1,
      tablet: Math.min(2, baseColumns),
      desktop: baseColumns
    };
    
    const config = customConfig ? { ...defaultConfig, ...customConfig } : defaultConfig;
    return getColumnsCount(config);
  };

  const getGridClass = (customConfig) => {
    const columns = getGridColumns(customConfig);
    return `grid grid-cols-${columns}`;
  };

  return {
    device,
    getGridColumns,
    getGridClass
  };
};

// Hook for responsive container management
export const useResponsiveContainer = () => {
  const { device, isMobile, isTablet, isDesktop } = useResponsive();
  
  const getContainerPadding = () => {
    if (isMobile) return designTokens.spacing[4]; // 16px
    if (isTablet) return designTokens.spacing[6]; // 24px
    return designTokens.spacing[8]; // 32px
  };

  const getContainerMaxWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return designTokens.breakpoints.md;
    return designTokens.breakpoints.xl;
  };

  const getContainerClass = () => {
    return `w-full max-w-screen-${device === 'mobile' ? 'sm' : device === 'tablet' ? 'md' : 'xl'} mx-auto px-${device === 'mobile' ? '4' : device === 'tablet' ? '6' : '8'}`;
  };

  return {
    device,
    getContainerPadding,
    getContainerMaxWidth,
    getContainerClass
  };
};

export default useResponsive;