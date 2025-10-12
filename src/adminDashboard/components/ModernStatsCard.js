import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { designTokens } from '../../styles/designTokens';
import { useAnimations, animationUtils, useReducedMotion } from '../../hooks/useAnimations';
import { useResponsive } from '../../hooks/useResponsive';

const ModernStatsCard = ({
  title = '',
  value = '',
  previousValue = null,
  change = null,
  changeType = 'percentage', // 'percentage', 'absolute', 'custom'
  trend = 'neutral', // 'up', 'down', 'neutral'
  icon = null,
  color = 'primary', // 'primary', 'success', 'warning', 'error', 'info'
  size = 'md', // 'sm', 'md', 'lg'
  loading = false,
  onClick = null,
  className = '',
  prefix = '',
  suffix = '',
  description = '',
  animateOnMount = true,
  staggerDelay = 0,
  responsive = true
}) => {
  // Animation hooks
  const { useInView, useLoadingAnimation, useFlashAnimation, useHoverAnimation } = useAnimations();
  const [inViewRef, isInView] = useInView(0.1);
  const showLoadingAnimation = useLoadingAnimation(loading);
  const { flashState, triggerSuccess, triggerError } = useFlashAnimation();
  const { isHovered, hoverProps } = useHoverAnimation();
  const prefersReducedMotion = useReducedMotion();
  
  // Responsive hooks
  const { isMobile, isTablet, isDesktop, getResponsiveValue, getFontSize, getSpacing } = useResponsive();
  
  // State for mount animations
  const [isMounted, setIsMounted] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  
  // Effect for mount animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, staggerDelay);
    
    return () => clearTimeout(timer);
  }, [staggerDelay]);
  
  // Effect for value change animation
  useEffect(() => {
    if (prevValue !== value && prevValue !== '' && !loading) {
      // Trigger success flash when value increases, error when decreases
      const prevNum = parseFloat(prevValue.toString().replace(/[^0-9.-]/g, ''));
      const currentNum = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
      
      if (!isNaN(prevNum) && !isNaN(currentNum)) {
        if (currentNum > prevNum) {
          triggerSuccess();
        } else if (currentNum < prevNum) {
          triggerError();
        }
      }
    }
    setPrevValue(value);
  }, [value, prevValue, loading, triggerSuccess, triggerError]);
  const colors = {
    primary: {
      bg: designTokens.colors.primary[50],
      border: designTokens.colors.primary[200],
      icon: designTokens.colors.primary[500],
      text: designTokens.colors.primary[700]
    },
    success: {
      bg: designTokens.colors.success[50],
      border: designTokens.colors.success[200],
      icon: designTokens.colors.success[500],
      text: designTokens.colors.success[700]
    },
    warning: {
      bg: designTokens.colors.warning[50],
      border: designTokens.colors.warning[200],
      icon: designTokens.colors.warning[500],
      text: designTokens.colors.warning[700]
    },
    error: {
      bg: designTokens.colors.error[50],
      border: designTokens.colors.error[200],
      icon: designTokens.colors.error[500],
      text: designTokens.colors.error[700]
    },
    info: {
      bg: designTokens.colors.neutral[50],
      border: designTokens.colors.neutral[200],
      icon: designTokens.colors.neutral[500],
      text: designTokens.colors.neutral[700]
    }
  };

  // Responsive sizes with mobile-first approach
  const getResponsiveSizes = () => {
    if (!responsive) {
      // Use original sizes object for non-responsive cards
      return {
        sm: {
          padding: '16px',
          titleSize: designTokens.typography.fontSize.xs[0],
          valueSize: designTokens.typography.fontSize.lg[0],
          iconSize: 20,
          changeSize: designTokens.typography.fontSize.xs[0]
        },
        md: {
          padding: '20px',
          titleSize: designTokens.typography.fontSize.sm[0],
          valueSize: designTokens.typography.fontSize['2xl'][0],
          iconSize: 24,
          changeSize: designTokens.typography.fontSize.sm[0]
        },
        lg: {
          padding: '24px',
          titleSize: designTokens.typography.fontSize.base[0],
          valueSize: designTokens.typography.fontSize['3xl'][0],
          iconSize: 28,
          changeSize: designTokens.typography.fontSize.base[0]
        }
      };
    }
    
    // Responsive sizes that adapt to screen size
    const responsivePadding = getResponsiveValue({
      mobile: '16px',
      tablet: '20px', 
      desktop: '24px'
    });
    
    const responsiveTitleSize = getResponsiveValue({
      mobile: designTokens.typography.fontSize.xs[0],
      tablet: designTokens.typography.fontSize.sm[0],
      desktop: designTokens.typography.fontSize.sm[0]
    });
    
    const responsiveValueSize = getResponsiveValue({
      mobile: designTokens.typography.fontSize.lg[0],
      tablet: designTokens.typography.fontSize.xl[0],
      desktop: designTokens.typography.fontSize['2xl'][0]
    });
    
    const responsiveIconSize = getResponsiveValue({
      mobile: 20,
      tablet: 22,
      desktop: 24
    });
    
    const responsiveChangeSize = getResponsiveValue({
      mobile: designTokens.typography.fontSize.xs[0],
      tablet: designTokens.typography.fontSize.sm[0],
      desktop: designTokens.typography.fontSize.sm[0]
    });
    
    return {
      sm: {
        padding: responsivePadding,
        titleSize: responsiveTitleSize,
        valueSize: responsiveValueSize,
        iconSize: responsiveIconSize,
        changeSize: responsiveChangeSize
      },
      md: {
        padding: responsivePadding,
        titleSize: responsiveTitleSize, 
        valueSize: responsiveValueSize,
        iconSize: responsiveIconSize,
        changeSize: responsiveChangeSize
      },
      lg: {
        padding: responsivePadding,
        titleSize: responsiveTitleSize,
        valueSize: responsiveValueSize,
        iconSize: responsiveIconSize,
        changeSize: responsiveChangeSize
      }
    };
  };
  
  const sizes = getResponsiveSizes();

  const calculateChange = () => {
    if (change !== null) return change;
    if (previousValue === null || previousValue === 0) return null;
    
    const numericValue = parseFloat(value.toString().replace(/[^0-9.-]/g, ''));
    const numericPrevious = parseFloat(previousValue.toString().replace(/[^0-9.-]/g, ''));
    
    if (isNaN(numericValue) || isNaN(numericPrevious)) return null;
    
    const changeValue = ((numericValue - numericPrevious) / numericPrevious) * 100;
    return Math.round(changeValue * 100) / 100;
  };

  const changeValue = calculateChange();
  const isPositive = changeValue > 0;
  const isNegative = changeValue < 0;

  const getTrendColor = () => {
    if (trend === 'up' || (isPositive && trend !== 'neutral')) {
      return designTokens.colors.success[600];
    }
    if (trend === 'down' || (isNegative && trend !== 'neutral')) {
      return designTokens.colors.error[600];
    }
    return designTokens.colors.neutral[500];
  };

  const getTrendIcon = () => {
    const iconSize = 16;
    const trendColor = getTrendColor();
    
    if (trend === 'up' || (isPositive && trend !== 'neutral')) {
      return <ArrowUp size={iconSize} color={trendColor} />;
    }
    if (trend === 'down' || (isNegative && trend !== 'neutral')) {
      return <ArrowDown size={iconSize} color={trendColor} />;
    }
    return null;
  };

  const formatChangeValue = () => {
    if (changeValue === null) return null;
    
    switch (changeType) {
      case 'percentage':
        return `${Math.abs(changeValue)}%`;
      case 'absolute':
        return Math.abs(changeValue).toString();
      case 'custom':
        return changeValue.toString();
      default:
        return `${Math.abs(changeValue)}%`;
    }
  };

  // Generate animation classes
  const getAnimationClasses = () => {
    const classes = [];
    
    if (animateOnMount && isMounted && !prefersReducedMotion) {
      classes.push('stats-card-entrance');
    }
    
    if (isInView && !prefersReducedMotion) {
      classes.push('fade-in-up');
    }
    
    if (onClick) {
      classes.push('stats-card-interactive');
    }
    
    if (isHovered && onClick && !loading) {
      classes.push('stats-card-hover');
    }
    
    if (flashState === 'success') {
      classes.push('success-flash');
    } else if (flashState === 'error') {
      classes.push('error-flash');
    }
    
    if (showLoadingAnimation) {
      classes.push('stats-card-loading');
    }
    
    return classes.join(' ');
  };

  const cardStyles = {
    backgroundColor: designTokens.colors.neutral[0],
    border: `1px solid ${designTokens.colors.neutral[200]}`,
    borderRadius: designTokens.borderRadius.xl,
    padding: sizes[size].padding,
    boxShadow: isHovered && onClick ? designTokens.shadows.lg : designTokens.shadows.sm,
    transition: prefersReducedMotion ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: designTokens.typography.fontFamily.sans.join(', '),
    transform: isHovered && onClick && !loading ? 'translateY(-2px)' : 'translateY(0)',
    opacity: !animateOnMount || isMounted ? 1 : 0,
    // Add subtle border glow on hover
    ...(isHovered && onClick && {
      borderColor: designTokens.colors.primary[300]
    })
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '12px'
  };

  const titleStyles = {
    fontSize: sizes[size].titleSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.neutral[600],
    margin: 0,
    lineHeight: '1.4'
  };

  const iconContainerStyles = {
    padding: '8px',
    borderRadius: designTokens.borderRadius.lg,
    backgroundColor: colors[color].bg,
    border: `1px solid ${colors[color].border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  };

  const valueContainerStyles = {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px',
    marginBottom: description || changeValue !== null ? '8px' : '0'
  };

  const valueStyles = {
    fontSize: sizes[size].valueSize,
    fontWeight: designTokens.typography.fontWeight.bold,
    color: designTokens.colors.neutral[900],
    margin: 0,
    lineHeight: '1',
    transition: prefersReducedMotion ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative'
  };
  
  const loadingSkeletonStyles = {
    width: '80%',
    height: sizes[size].valueSize,
    backgroundColor: designTokens.colors.neutral[200],
    borderRadius: designTokens.borderRadius.md,
    position: 'relative',
    overflow: 'hidden'
  };

  const prefixSuffixStyles = {
    fontSize: sizes[size].titleSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: designTokens.colors.neutral[500]
  };

  const changeContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px'
  };

  const changeTextStyles = {
    fontSize: sizes[size].changeSize,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: getTrendColor()
  };

  const descriptionStyles = {
    fontSize: designTokens.typography.fontSize.xs[0],
    color: designTokens.colors.neutral[500],
    marginTop: '4px',
    lineHeight: '1.4'
  };

  const loadingOverlayStyles = {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: designTokens.borderRadius.xl
  };

  const handleClick = () => {
    if (onClick && !loading) {
      onClick();
    }
  };

  // Get responsive class names
  const getResponsiveClasses = () => {
    const classes = [];
    
    if (responsive) {
      classes.push('stats-card-responsive');
      
      // Add device-specific classes if needed
      if (isMobile) classes.push('mobile-stats-card');
      if (isTablet) classes.push('tablet-stats-card'); 
      if (isDesktop) classes.push('desktop-stats-card');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      ref={inViewRef}
      data-stats-card
      style={cardStyles}
      className={`${className} ${getAnimationClasses()} ${getResponsiveClasses()}`}
      onClick={handleClick}
      {...hoverProps}
    >
      {showLoadingAnimation && (
        <div style={loadingOverlayStyles}>
          <div 
            className={`spinner-ring ${prefersReducedMotion ? '' : 'animate-spin'}`}
            style={{ 
              width: '24px',
              height: '24px',
              border: '2px solid transparent',
              borderTop: `2px solid ${designTokens.colors.primary[500]}`,
              borderRadius: '50%'
            }}
          />
        </div>
      )}

      {/* Header */}
      <div style={headerStyles}>
        <h3 style={titleStyles}>{title}</h3>
        {icon && (
          <div 
            style={{
              ...iconContainerStyles,
              transform: isHovered && onClick ? 'scale(1.05)' : 'scale(1)',
              transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease'
            }}
            className={loading ? 'pulse' : ''}
          >
            {React.cloneElement(icon, { 
              size: sizes[size].iconSize, 
              color: colors[color].icon 
            })}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={valueContainerStyles}>
        {prefix && !loading && <span style={prefixSuffixStyles}>{prefix}</span>}
        {loading ? (
          <div style={loadingSkeletonStyles} className="shimmer" />
        ) : (
          <div 
            style={{
              ...valueStyles,
              transform: flashState ? 'scale(1.02)' : 'scale(1)'
            }}
            className={`value-display ${flashState ? `flash-${flashState}` : ''}`}
          >
            {value}
          </div>
        )}
        {suffix && !loading && <span style={prefixSuffixStyles}>{suffix}</span>}
      </div>

      {/* Change Indicator */}
      {changeValue !== null && !loading && (
        <div 
          style={{
            ...changeContainerStyles,
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? 'translateY(0)' : 'translateY(10px)',
            transition: prefersReducedMotion ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
          }}
          className={`change-indicator ${trend}-trend`}
        >
          <span 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: prefersReducedMotion ? 'none' : 'transform 0.2s ease'
            }}
          >
            {getTrendIcon()}
          </span>
          <span style={{
            ...changeTextStyles,
            transition: prefersReducedMotion ? 'none' : 'color 0.2s ease'
          }}>
            {formatChangeValue()} {trend !== 'neutral' ? (isPositive ? 'increase' : 'decrease') : 'change'}
          </span>
        </div>
      )}

      {/* Description */}
      {description && (
        <div 
          style={{
            ...descriptionStyles,
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? 'translateY(0)' : 'translateY(5px)',
            transition: prefersReducedMotion ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
          }}
          className="description-text"
        >
          {description}
        </div>
      )}
    </div>
  );
};

export default ModernStatsCard;