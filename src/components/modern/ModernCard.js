import React from 'react';
import { designTokens } from '../../styles/designTokens';

const ModernCard = ({ 
  children, 
  variant = 'default', 
  padding = 'default',
  shadow = 'default',
  hover = false,
  className = '',
  onClick,
  ...props 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'elevated':
        return {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[100]}`,
          boxShadow: designTokens.shadows.md
        };
      case 'outlined':
        return {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[200]}`,
          boxShadow: 'none'
        };
      case 'filled':
        return {
          backgroundColor: designTokens.colors.neutral[50],
          border: 'none',
          boxShadow: 'none'
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          border: `1px solid ${designTokens.colors.neutral[200]}`,
          backdropFilter: 'blur(12px)',
          boxShadow: designTokens.shadows.sm
        };
      default:
        return {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[100]}`,
          boxShadow: designTokens.shadows[shadow]
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case 'none':
        return { padding: '0' };
      case 'sm':
        return { padding: designTokens.spacing[4] };
      case 'lg':
        return { padding: designTokens.spacing[8] };
      case 'xl':
        return { padding: designTokens.spacing[10] };
      default:
        return { padding: designTokens.spacing[6] };
    }
  };

  const baseStyles = {
    borderRadius: designTokens.borderRadius.xl,
    transition: designTokens.transitions.duration.normal,
    position: 'relative',
    ...getVariantStyles(),
    ...getPaddingStyles()
  };

  const hoverStyles = hover ? {
    transform: 'translateY(-2px)',
    boxShadow: designTokens.shadows.lg,
    cursor: onClick ? 'pointer' : 'default'
  } : {};

  return (
    <div
      className={`modern-card ${className}`}
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) {
          Object.assign(e.target.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = getVariantStyles().boxShadow;
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ModernCard;