import React from "react";
import { designTokens } from "../../styles/designTokens";

const Skeleton = ({ width, height, className = "", style = {}, variant = "text" }) => {
    const baseStyles = {
        backgroundColor: designTokens.colors.neutral[200],
        ...style,
    };

    if (width) baseStyles.width = width;
    if (height) baseStyles.height = height;

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

    return (
        <div
            className={`animate-pulse ${getVariantClasses()} ${className}`}
            style={baseStyles}
        />
    );
};

export default Skeleton;
