import React from "react";
import { designTokens } from "../../../styles/designTokens";

const ModernButton = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  rightIcon,
  fullWidth = false,
  className = "",
  isLoading = false,
  disabled = false,
  ...props
}) => {
  const colors = designTokens.colors;

  const variantStyles = {
    primary: {
      backgroundColor: colors.primary[600],
      color: colors.neutral[0],
      border: `1px solid ${colors.primary[600]}`,
      hover: {
        backgroundColor: colors.primary[700],
        borderColor: colors.primary[700],
      },
      focus: {
        boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      },
    },
    outline: {
      backgroundColor: "transparent",
      color: colors.primary[600],
      border: `1px solid ${colors.primary[200]}`,
      hover: {
        backgroundColor: colors.primary[50],
        borderColor: colors.primary[300],
      },
      focus: {
        boxShadow: `0 0 0 3px ${colors.primary[100]}`,
      },
    },
    subtle: {
      backgroundColor: colors.neutral[100],
      color: colors.neutral[900],
      border: `1px solid ${colors.neutral[100]}`,
      hover: {
        backgroundColor: colors.neutral[200],
        borderColor: colors.neutral[200],
      },
      focus: {
        boxShadow: `0 0 0 3px ${colors.neutral[200]}`,
      },
    },
    ghost: {
      backgroundColor: "transparent",
      color: colors.neutral[700],
      border: "1px solid transparent",
      hover: {
        backgroundColor: colors.neutral[100],
        borderColor: "transparent",
      },
      focus: {
        boxShadow: `0 0 0 3px ${colors.neutral[200]}`,
      },
    },
  };

  const sizeStyles = {
    sm: {
      padding: "6px 12px",
      fontSize: "13px",
      gap: "6px",
    },
    md: {
      padding: "10px 16px",
      fontSize: "14px",
      gap: "8px",
    },
    lg: {
      padding: "12px 20px",
      fontSize: "15px",
      gap: "10px",
    },
  };

  const selectedVariant = variantStyles[variant] || variantStyles.primary;
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  const baseStyles = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: selectedSize.gap,
    padding: selectedSize.padding,
    fontSize: selectedSize.fontSize,
    fontWeight: designTokens.typography.fontWeight.semibold,
    borderRadius: designTokens.borderRadius.full,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.2s ease-in-out",
    textDecoration: "none",
    width: fullWidth ? "100%" : "auto",
    ...selectedVariant,
  };

  const handleMouseEnter = (event) => {
    if (disabled) return;
    Object.assign(event.currentTarget.style, selectedVariant.hover);
  };

  const handleMouseLeave = (event) => {
    if (disabled) return;
    Object.assign(event.currentTarget.style, {
      backgroundColor: selectedVariant.backgroundColor,
      color: selectedVariant.color,
      border: selectedVariant.border,
    });
  };

  const handleFocus = (event) => {
    if (disabled) return;
    Object.assign(event.currentTarget.style, selectedVariant.focus);
  };

  const handleBlur = (event) => {
    if (disabled) return;
    Object.assign(event.currentTarget.style, {
      boxShadow: "none",
    });
  };

  return (
    <button
      type="button"
      className={className}
      style={baseStyles}
      disabled={disabled || isLoading}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Loading...
        </span>
      ) : (
        <>
          {icon ? <span className="inline-flex items-center">{icon}</span> : null}
          <span className="inline-flex items-center">{children}</span>
          {rightIcon ? (
            <span className="inline-flex items-center">{rightIcon}</span>
          ) : null}
        </>
      )}
    </button>
  );
};

export default ModernButton;
