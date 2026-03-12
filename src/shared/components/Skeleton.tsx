import React from "react";
import { designTokens } from "@/styles/designTokens";

type SkeletonVariant = "text" | "circle" | "rectangular";

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
  variant?: SkeletonVariant;
}

const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  className = "",
  style = {},
  variant = "text",
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: designTokens.colors.neutral[200],
    ...style,
  };

  if (width !== undefined) baseStyles.width = width;
  if (height !== undefined) baseStyles.height = height;

  const getVariantClasses = () => {
    switch (variant) {
      case "circle":
        return "rounded-full";
      case "rectangular":
        return "rounded-md";
      case "text":
      default:
        return "rounded";
    }
  };

  return <div className={`animate-pulse ${getVariantClasses()} ${className}`} style={baseStyles} />;
};

export default Skeleton;
