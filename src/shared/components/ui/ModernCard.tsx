import React from "react";
import { designTokens } from "../../../styles/designTokens";

/**
 * ModernCard - Shared across Admin, Tenant, and Client dashboards
 *
 * A versatile card container with multiple variants.
 * Following shared-components.md workflow.
 */

export interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  variant?: "default" | "elevated" | "outlined" | "filled" | "glass";
  padding?: "default" | "none" | "sm" | "lg" | "xl";
  shadow?: string;
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  title = "",
  variant = "default",
  padding = "default",
  shadow = "default",
  hover = false,
  className = "",
  onClick,
  style: customStyle,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[100]}`,
        };
      case "outlined":
        return {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[200]}`,
        };
      case "filled":
        return {
          backgroundColor: designTokens.colors.neutral[50],
          border: "none",
        };
      case "glass":
        return {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          border: `1px solid ${designTokens.colors.neutral[200]}`,
          backdropFilter: "blur(12px)",
        };
      default:
        return {
          backgroundColor: designTokens.colors.neutral[0],
          border: `1px solid ${designTokens.colors.neutral[200]}`,
        };
    }
  };

  const getPaddingStyles = () => {
    switch (padding) {
      case "none":
        return { padding: "0" };
      case "sm":
        return { padding: designTokens.spacing[4] };
      case "lg":
        return { padding: designTokens.spacing[8] };
      case "xl":
        return { padding: designTokens.spacing[10] };
      default:
        return { padding: designTokens.spacing[6] };
    }
  };

  const baseStyles: React.CSSProperties = {
    borderRadius: designTokens.borderRadius.xl,
    transition: "all 0.2s ease",
    position: "relative",
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    ...getVariantStyles(),
    ...getPaddingStyles(),
    ...customStyle,
  };

  const hoverStyles: React.CSSProperties = hover
    ? {
        transform: "translateY(-2px)",
        boxShadow: designTokens.shadows.lg,
        cursor: onClick ? "pointer" : "default",
      }
    : {};

  const titleStyles: React.CSSProperties = {
    fontSize: designTokens.typography.fontSize.lg[0] as any,
    fontWeight: designTokens.typography.fontWeight.semibold,
    color: designTokens.colors.neutral[900],
    marginBottom: designTokens.spacing[4],
    paddingBottom: designTokens.spacing[3],
    borderBottom: `1px solid ${designTokens.colors.neutral[200]}`,
  };

  return (
    <div
      className={`modern-card ${className}`}
      style={baseStyles}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hover) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = "translateY(0)";
          // @ts-ignore
          e.currentTarget.style.boxShadow = getVariantStyles().boxShadow || "none";
        }
      }}
      {...props}
    >
      {title && <h3 style={titleStyles}>{title}</h3>}
      {children}
    </div>
  );
};

export default ModernCard;
