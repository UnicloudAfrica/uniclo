import React from 'react';
import { designTokens } from '../../styles/designTokens';

const ModernButton = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  className = '',
  onClick,
  ...props
}) => {
  const getVariantStyles = () => {
    const baseStyles = {
      fontWeight: designTokens.typography.fontWeight.medium,
      borderRadius: designTokens.borderRadius.lg,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: designTokens.spacing[2],
      border: 'none',
      outline: 'none',
      fontFamily: designTokens.typography.fontFamily.sans.join(', ')
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.primary[500],
          color: designTokens.colors.neutral[0],
          boxShadow: `0 1px 3px 0 ${designTokens.colors.primary[500]}20`,
          ':hover': {
            backgroundColor: designTokens.colors.primary[600],
            boxShadow: `0 4px 12px 0 ${designTokens.colors.primary[500]}30`,
            transform: 'translateY(-1px)'
          },
          ':active': {
            backgroundColor: designTokens.colors.primary[700],
            transform: 'translateY(0)'
          }
        };
        
      case 'secondary':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.secondary[500],
          color: designTokens.colors.neutral[0],
          boxShadow: `0 1px 3px 0 ${designTokens.colors.secondary[500]}20`,
          ':hover': {
            backgroundColor: designTokens.colors.secondary[600],
            boxShadow: `0 4px 12px 0 ${designTokens.colors.secondary[500]}30`,
            transform: 'translateY(-1px)'
          }
        };

      case 'outline':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: designTokens.colors.primary[600],
          border: `1px solid ${designTokens.colors.primary[300]}`,
          ':hover': {
            backgroundColor: designTokens.colors.primary[50],
            borderColor: designTokens.colors.primary[400],
            transform: 'translateY(-1px)'
          }
        };

      case 'ghost':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: designTokens.colors.neutral[700],
          ':hover': {
            backgroundColor: designTokens.colors.neutral[100],
            color: designTokens.colors.neutral[900]
          }
        };

      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.error[500],
          color: designTokens.colors.neutral[0],
          ':hover': {
            backgroundColor: designTokens.colors.error[600],
            transform: 'translateY(-1px)'
          }
        };

      case 'success':
        return {
          ...baseStyles,
          backgroundColor: designTokens.colors.success[500],
          color: designTokens.colors.neutral[0],
          ':hover': {
            backgroundColor: designTokens.colors.success[600],
            transform: 'translateY(-1px)'
          }
        };

      default:
        return baseStyles;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'xs':
        return {
          padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
          fontSize: designTokens.typography.fontSize.xs[0],
          lineHeight: designTokens.typography.fontSize.xs[1].lineHeight,
          minHeight: '24px'
        };
      case 'sm':
        return {
          padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
          fontSize: designTokens.typography.fontSize.sm[0],
          lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
          minHeight: '32px'
        };
      case 'lg':
        return {
          padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
          fontSize: designTokens.typography.fontSize.lg[0],
          lineHeight: designTokens.typography.fontSize.lg[1].lineHeight,
          minHeight: '48px'
        };
      case 'xl':
        return {
          padding: `${designTokens.spacing[4]} ${designTokens.spacing[8]}`,
          fontSize: designTokens.typography.fontSize.xl[0],
          lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
          minHeight: '56px'
        };
      default: // md
        return {
          padding: `${designTokens.spacing[2.5]} ${designTokens.spacing[4]}`,
          fontSize: designTokens.typography.fontSize.base[0],
          lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
          minHeight: '40px'
        };
    }
  };

  const buttonStyles = {
    ...getVariantStyles(),
    ...getSizeStyles(),
    opacity: isDisabled ? 0.6 : 1,
    pointerEvents: isDisabled ? 'none' : 'auto'
  };

  const handleClick = (e) => {
    if (!isDisabled && !isLoading && onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = (e) => {
    if (!isDisabled && !isLoading) {
      const hoverStyles = getVariantStyles()[':hover'];
      if (hoverStyles) {
        Object.assign(e.target.style, hoverStyles);
      }
    }
  };

  const handleMouseLeave = (e) => {
    if (!isDisabled && !isLoading) {
      // Reset to base styles
      Object.assign(e.target.style, getVariantStyles());
    }
  };

  return (
    <button
      className={`modern-button modern-button--${variant} modern-button--${size} ${className}`}
      style={buttonStyles}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div className="loading-spinner" style={{
          width: '16px',
          height: '16px',
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      )}
      {leftIcon && !isLoading && leftIcon}
      {children}
      {rightIcon && !isLoading && rightIcon}
      
      {/* Add keyframes for spinner */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
};

export default ModernButton;