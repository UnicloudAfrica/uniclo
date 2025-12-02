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
  style: customStyle = {},
  onClick,
  ...props
}) => {
  const fontStack = designTokens.typography.fontFamily.sans.join(", ");
  const transition = `all ${designTokens.transitions.duration.normal} ${designTokens.transitions.easing.inOut}`;

  const getVariantStyles = () => {
    const { primary, secondary, neutral, error, success } = designTokens.colors;

    const base = {
      backgroundColor: neutral[0],
      color: neutral[900],
      border: "1px solid transparent",
      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.08)",
    };

    switch (variant) {
      case "primary":
        return {
          base: {
            ...base,
            backgroundColor: primary[500],
            color: neutral[0],
            border: `1px solid ${primary[500]}`,
            boxShadow: `0 10px 18px -10px ${primary[500]}`,
          },
          hover: {
            backgroundColor: primary[600],
            color: neutral[0],
            border: `1px solid ${primary[600]}`,
            boxShadow: `0 14px 24px -12px ${primary[500]}`,
          },
          active: {
            backgroundColor: primary[700],
            border: `1px solid ${primary[700]}`,
          },
        };
      case "secondary":
        return {
          base: {
            ...base,
            backgroundColor: secondary[500],
            color: neutral[0],
            border: `1px solid ${secondary[500]}`,
            boxShadow: `0 10px 18px -10px ${secondary[500]}`,
          },
          hover: {
            backgroundColor: secondary[600],
            color: neutral[0],
            border: `1px solid ${secondary[600]}`,
            boxShadow: `0 14px 24px -12px ${secondary[500]}`,
          },
          active: {
            backgroundColor: secondary[700],
            border: `1px solid ${secondary[700]}`,
          },
        };
      case "outline":
        return {
          base: {
            ...base,
            backgroundColor: "transparent",
            color: primary[500],
            border: `1px solid ${primary[500]}`,
            boxShadow: "none",
          },
          hover: {
            backgroundColor: primary[50],
            color: primary[600],
            border: `1px solid ${primary[600]}`,
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
            boxShadow: "none",
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
            border: `1px solid ${error[500]}`,
            boxShadow: `0 10px 18px -10px ${error[500]}`,
          },
          hover: {
            backgroundColor: error[600],
            color: neutral[0],
            border: `1px solid ${error[600]}`,
            boxShadow: `0 14px 24px -12px ${error[500]}`,
          },
          active: {
            backgroundColor: error[700],
            border: `1px solid ${error[700]}`,
          },
        };
      case "success":
        return {
          base: {
            ...base,
            backgroundColor: success[500],
            color: neutral[0],
            border: `1px solid ${success[500]}`,
            boxShadow: `0 10px 18px -10px ${success[500]}`,
          },
          hover: {
            backgroundColor: success[600],
            color: neutral[0],
            border: `1px solid ${success[600]}`,
            boxShadow: `0 14px 24px -12px ${success[500]}`,
          },
          active: {
            backgroundColor: success[700],
            border: `1px solid ${success[700]}`,
          },
        };
      default:
        return {
          base,
          hover: {
            backgroundColor: neutral[50],
            color: neutral[900],
          },
          active: {
            backgroundColor: neutral[100],
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
  const sizeStyles = getSizeStyles();

  const controlBaseStyles = {
    fontFamily: fontStack,
    fontWeight: designTokens.typography.fontWeight.semibold,
    borderRadius: designTokens.borderRadius.main,
    transition: "all 0.2s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    outline: "none",
    textDecoration: "none",
    cursor: isDisabled || isLoading ? "not-allowed" : "pointer",
    opacity: isDisabled ? 0.5 : 1,
    ...sizeStyles,
  };

  const buttonStyles = {
    ...controlBaseStyles,
    ...base,
  };

  const handleClick = (event) => {
    if (!isDisabled && !isLoading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      type="button"
      className={`modern-button modern-button--${variant} modern-button--${size} ${className}`}
      style={{ ...buttonStyles, ...customStyle }}
      onClick={handleClick}
      disabled={isDisabled || isLoading}
      onMouseEnter={(e) => {
        if (!isDisabled && !isLoading) {
          Object.assign(e.currentTarget.style, hover);
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabled && !isLoading) {
          Object.assign(e.currentTarget.style, base);
        }
      }}
      onMouseDown={(e) => {
        if (!isDisabled && !isLoading) {
          Object.assign(e.currentTarget.style, active);
        }
      }}
      onMouseUp={(e) => {
        if (!isDisabled && !isLoading) {
          Object.assign(e.currentTarget.style, hover);
        }
      }}
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
