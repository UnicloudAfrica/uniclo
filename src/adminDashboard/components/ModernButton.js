import React from "react";
import { designTokens } from "../../styles/designTokens";

const ModernButton = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  isDisabled = false,
  leftIcon,
  rightIcon,
  className = "",
  onClick,
  ...props
}) => {
  const fontStack = designTokens.typography.fontFamily.sans.join(", ");
  const transition = `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.easing.inOut}`;

  const getVariantStyles = () => {
    const primary = designTokens.colors.primary;
    const secondary = designTokens.colors.secondary;
    const neutral = designTokens.colors.neutral;
    const success = designTokens.colors.success;
    const error = designTokens.colors.error;

    const base = {
      backgroundColor: neutral[0],
      color: neutral[900],
      border: "1px solid transparent",
    };

    switch (variant) {
      case "primary":
        return {
          base: {
            ...base,
            backgroundColor: primary[500],
            color: neutral[0],
            border: "1px solid transparent",
          },
          hover: {
            backgroundColor: primary[600],
          },
          active: {
            backgroundColor: primary[700],
          },
        };
      case "secondary":
        return {
          base: {
            ...base,
            backgroundColor: secondary[500],
            color: neutral[0],
            border: "1px solid transparent",
          },
          hover: {
            backgroundColor: secondary[600],
          },
          active: {
            backgroundColor: secondary[700],
          },
        };
      case "outline":
        return {
          base: {
            ...base,
            backgroundColor: "transparent",
            color: primary[500],
            border: `1px solid ${primary[500]}`,
          },
          hover: {
            backgroundColor: primary[50],
            border: `1px solid ${primary[400]}`,
          },
          active: {
            backgroundColor: primary[100],
            border: `1px solid ${primary[400]}`,
          },
        };
      case "ghost":
        return {
          base: {
            ...base,
            backgroundColor: "transparent",
            color: neutral[700],
            border: "1px solid transparent",
          },
          hover: {
            backgroundColor: neutral[100],
            color: neutral[900],
          },
          active: {
            backgroundColor: neutral[200],
          },
        };
      case "danger":
        return {
          base: {
            ...base,
            backgroundColor: error[500],
            color: neutral[0],
            border: "1px solid transparent",
          },
          hover: {
            backgroundColor: error[600],
          },
          active: {
            backgroundColor: error[700],
          },
        };
      case "success":
        return {
          base: {
            ...base,
            backgroundColor: success[500],
            color: neutral[0],
            border: "1px solid transparent",
          },
          hover: {
            backgroundColor: success[600],
          },
          active: {
            backgroundColor: success[700],
          },
        };
      default:
        return {
          base,
          hover: {
            backgroundColor: neutral[100],
          },
          active: {
            backgroundColor: neutral[200],
          },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "xs":
        return {
          padding: `${designTokens.spacing[1]} ${designTokens.spacing[2]}`,
          fontSize: designTokens.typography.fontSize.xs[0],
          lineHeight: designTokens.typography.fontSize.xs[1].lineHeight,
          minHeight: "24px",
        };
      case "sm":
        return {
          padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
          fontSize: designTokens.typography.fontSize.sm[0],
          lineHeight: designTokens.typography.fontSize.sm[1].lineHeight,
          minHeight: "32px",
        };
      case "base":
        return {
          padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
          fontSize: designTokens.typography.fontSize.base[0],
          lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
          minHeight: "32px",
        };
      case "lg":
        return {
          padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
          fontSize: designTokens.typography.fontSize.lg[0],
          lineHeight: designTokens.typography.fontSize.lg[1].lineHeight,
          minHeight: "48px",
        };
      case "xl":
        return {
          padding: `${designTokens.spacing[4]} ${designTokens.spacing[8]}`,
          fontSize: designTokens.typography.fontSize.xl[0],
          lineHeight: designTokens.typography.fontSize.xl[1].lineHeight,
          minHeight: "56px",
        };
      default:
        return {
          padding: `${designTokens.spacing[2.5]} ${designTokens.spacing[4]}`,
          fontSize: designTokens.typography.fontSize.base[0],
          lineHeight: designTokens.typography.fontSize.base[1].lineHeight,
          minHeight: "40px",
        };
    }
  };

  const { base, hover = {}, active = {} } = getVariantStyles();

  const controlBaseStyles = {
    fontFamily: fontStack,
    fontWeight: designTokens.typography.fontWeight.normal,
    borderRadius: designTokens.borderRadius.main,
    transition,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: designTokens.spacing[2],
    outline: "none",
    textDecoration: "none",
  };

  const buttonStyles = {
    ...controlBaseStyles,
    ...getSizeStyles(),
    opacity: isDisabled ? 0.6 : 1,
    pointerEvents: isDisabled ? "none" : "auto",
    cursor: isDisabled ? "not-allowed" : "pointer",
    "--btn-bg": base.backgroundColor || "transparent",
    "--btn-color": base.color || designTokens.colors.neutral[900],
    "--btn-border": base.border || "1px solid transparent",
    "--btn-hover-bg": hover.backgroundColor,
    "--btn-hover-color": hover.color,
    "--btn-hover-border": hover.border,
    "--btn-active-bg": active.backgroundColor,
    "--btn-active-border": active.border,
  };

  const handleClick = (event) => {
    if (!isDisabled && !isLoading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      className={`modern-button modern-button--${variant} modern-button--${size} ${className}`}
      style={buttonStyles}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      {...props}
    >
      {isLoading && (
        <div
          className="loading-spinner"
          style={{
            width: "16px",
            height: "16px",
            border: "2px solid transparent",
            borderTop: "2px solid currentColor",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      )}
      {leftIcon && !isLoading && leftIcon}
      {children}
      {rightIcon && !isLoading && rightIcon}
    </button>
  );
};

export default ModernButton;
