import React from "react";
import { designTokens } from "../../../styles/designTokens";

const ModernCard = ({
  children,
  title = "",
  variant = "default",
  padding = "default",
  hover = false,
  className = "",
  onClick,
  ...props
}) => {
  const palette = designTokens.colors;
  const radius = designTokens.borderRadius.xl;

  const variantStyles = {
    default: {
      backgroundColor: palette.neutral[0],
      border: `1px solid ${palette.neutral[200]}`,
      boxShadow: designTokens.shadows.sm,
    },
    elevated: {
      backgroundColor: palette.neutral[0],
      border: `1px solid ${palette.neutral[100]}`,
      boxShadow: designTokens.shadows.md,
    },
    outlined: {
      backgroundColor: palette.neutral[0],
      border: `1px solid ${palette.neutral[200]}`,
      boxShadow: "none",
    },
    filled: {
      backgroundColor: palette.neutral[50],
      border: "none",
      boxShadow: "none",
    },
  };

  const paddingStyles = {
    none: "0px",
    sm: designTokens.spacing[4],
    default: designTokens.spacing[6],
    lg: designTokens.spacing[8],
  };

  const baseStyles = {
    borderRadius: radius,
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    transition: "all 0.2s ease",
    cursor: onClick ? "pointer" : "default",
    ...variantStyles[variant],
    padding: paddingStyles[padding] ?? paddingStyles.default,
  };

  const hoverStyles =
    hover || onClick
      ? {
          transform: "translateY(-2px)",
          boxShadow: designTokens.shadows.lg,
        }
      : {};

  const titleStyles = {
    fontSize: designTokens.typography.fontSize.lg[0],
    fontWeight: designTokens.typography.fontWeight.semibold,
    marginBottom: designTokens.spacing[2],
    color: palette.neutral[900],
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onMouseEnter={(event) => {
        Object.assign(event.currentTarget.style, hoverStyles);
      }}
      onMouseLeave={(event) => {
        Object.assign(event.currentTarget.style, {
          transform: "translateY(0)",
          boxShadow: baseStyles.boxShadow,
        });
      }}
      onClick={onClick}
      {...props}
    >
      {title ? <h3 style={titleStyles}>{title}</h3> : null}
      {children}
    </div>
  );
};

export default ModernCard;
