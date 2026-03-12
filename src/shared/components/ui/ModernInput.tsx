import {
  useState,
  forwardRef,
  memo,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
  type CSSProperties,
  type InputHTMLAttributes,
} from "react";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import type { ControlSize } from "./types";

const mergeClassNames = (...values: (string | undefined | null | false)[]) =>
  values.flat().filter(Boolean).join(" ");

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

type InputIconProps = {
  size?: number;
  color?: string;
};

interface ModernInputProps extends BaseInputProps {
  label?: string | undefined;
  error?: string | undefined;
  success?: string | undefined;
  helper?: string | undefined;
  size?: ControlSize;
  variant?: "default" | "filled" | "outline";
  isDisabled?: boolean;
  icon?: ReactNode;
  endIcon?: ReactNode;
  inputClassName?: string;
}

const ModernInput = forwardRef<HTMLInputElement, ModernInputProps>(
  (
    {
      type = "text",
      label = "",
      placeholder = "",
      value = "",
      onChange,
      onBlur,
      error = "",
      success = "",
      helper = "",
      required = false,
      disabled = false,
      isDisabled = false,
      size = "md", // sm, md, lg
      variant = "default", // default, filled, outline
      icon = null,
      endIcon = null,
      className = "",
      inputClassName = "",
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const resolvedDisabled = disabled || isDisabled;

    const sizes = {
      sm: {
        height: "36px",
        padding: icon ? "0 12px 0 36px" : "0 12px",
        fontSize: designTokens.typography.fontSize.sm[0],
        iconSize: 16,
      },
      md: {
        height: "44px",
        padding: icon ? "0 16px 0 44px" : "0 16px",
        fontSize: designTokens.typography.fontSize.base[0],
        iconSize: 18,
      },
      lg: {
        height: "52px",
        padding: icon ? "0 20px 0 52px" : "0 20px",
        fontSize: designTokens.typography.fontSize.lg[0],
        iconSize: 20,
      },
    };

    const getVariantStyles = () => {
      const currentSize = sizes[size as keyof typeof sizes];
      const paddingValue = currentSize.padding;
      const paddingParts = paddingValue.split(" ");

      // Calculate padding based on endIcon presence
      const calculatedPadding = endIcon
        ? `${paddingParts[0]} 44px ${paddingParts[2] || "0"} ${paddingParts[3] || paddingParts[1]}`
        : paddingValue;

      const baseStyles: CSSProperties = {
        width: "100%",
        height: currentSize.height,
        padding: calculatedPadding,
        fontSize: currentSize.fontSize,
        fontFamily: designTokens.typography.fontFamily.sans.join(", "),
        borderRadius: designTokens.borderRadius.lg,
        outline: "none",
        transition: "all 0.2s ease",
        backgroundColor: resolvedDisabled
          ? designTokens.colors.neutral[100]
          : designTokens.colors.neutral[50],
        color: resolvedDisabled
          ? designTokens.colors.neutral[400]
          : designTokens.colors.neutral[900],
      };

      if (error) {
        return {
          ...baseStyles,
          border: `1px solid ${designTokens.colors.error[500]}`,
          boxShadow: isFocused ? `0 0 0 3px ${designTokens.colors.error[100]}` : "none",
        };
      }

      if (success) {
        return {
          ...baseStyles,
          border: `1px solid ${designTokens.colors.success[500]}`,
          boxShadow: isFocused ? `0 0 0 3px ${designTokens.colors.success[100]}` : "none",
        };
      }

      switch (variant) {
        case "filled":
          return {
            ...baseStyles,
            backgroundColor: resolvedDisabled
              ? designTokens.colors.neutral[200]
              : designTokens.colors.neutral[50],
            border: `1px solid transparent`,
            boxShadow: isFocused ? `0 0 0 2px ${designTokens.colors.primary[500]}` : "none",
          };

        case "outline":
          return {
            ...baseStyles,
            border: `2px solid ${isFocused ? designTokens.colors.primary[500] : designTokens.colors.neutral[300]}`,
            boxShadow: "none",
          };

        default:
          return {
            ...baseStyles,
            border: `1px solid ${
              isFocused ? designTokens.colors.primary[500] : designTokens.colors.neutral[300]
            }`,
            boxShadow: isFocused ? `0 0 0 3px ${designTokens.colors.primary[100]}` : "none",
          };
      }
    };

    const labelStyles: CSSProperties = {
      display: "block",
      fontSize: designTokens.typography.fontSize.sm[0],
      fontWeight: designTokens.typography.fontWeight.medium,
      color: error ? designTokens.colors.error[700] : designTokens.colors.neutral[600],
      marginBottom: "6px",
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    };

    const helperTextStyles: CSSProperties = {
      fontSize: designTokens.typography.fontSize.xs[0],
      marginTop: "6px",
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    };

    const getHelperTextColor = () => {
      if (error) return designTokens.colors.error[600];
      if (success) return designTokens.colors.success[600];
      return designTokens.colors.neutral[500];
    };

    const containerStyles: CSSProperties = {
      position: "relative",
      width: "100%",
    };

    const currentSize = sizes[size as keyof typeof sizes];

    const iconStyles: CSSProperties = {
      position: "absolute",
      left: size === "sm" ? "10px" : size === "md" ? "14px" : "16px",
      top: "50%",
      transform: "translateY(-50%)",
      color: error
        ? designTokens.colors.error[500]
        : success
          ? designTokens.colors.success[500]
          : designTokens.colors.neutral[400],
      pointerEvents: "none",
      zIndex: 1,
    };

    const endIconStyles: CSSProperties = {
      position: "absolute",
      right: size === "sm" ? "10px" : size === "md" ? "14px" : "16px",
      top: "50%",
      transform: "translateY(-50%)",
      color: designTokens.colors.neutral[400],
      cursor: type === "password" ? "pointer" : "default",
      zIndex: 1,
    };

    const handlePasswordToggle = () => {
      setShowPassword(!showPassword);
    };

    const getInputType = () => {
      if (type === "password") {
        return showPassword ? "text" : "password";
      }
      return type;
    };

    const renderEndIcon = () => {
      if (type === "password") {
        return (
          <button
            type="button"
            onClick={handlePasswordToggle}
            style={endIconStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = designTokens.colors.neutral[600];
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = designTokens.colors.neutral[400];
            }}
          >
            {showPassword ? (
              <EyeOff size={currentSize.iconSize} />
            ) : (
              <Eye size={currentSize.iconSize} />
            )}
          </button>
        );
      }

      if (error) {
        return (
          <div style={endIconStyles}>
            <AlertCircle size={currentSize.iconSize} color={designTokens.colors.error[500]} />
          </div>
        );
      }

      if (success) {
        return (
          <div style={endIconStyles}>
            <Check size={currentSize.iconSize} color={designTokens.colors.success[500]} />
          </div>
        );
      }

      if (endIcon) {
        return <div style={endIconStyles}>{endIcon}</div>;
      }

      return null;
    };

    return (
      <div style={containerStyles} className={className}>
        {label && (
          <label style={labelStyles}>
            {label}
            {required && (
              <span style={{ color: designTokens.colors.error[500], marginLeft: "2px" }}>*</span>
            )}
          </label>
        )}

        <div style={{ position: "relative" }}>
          {icon && (
            <div style={iconStyles}>
              {isValidElement(icon)
                ? cloneElement(icon as ReactElement<InputIconProps>, {
                    size: currentSize.iconSize,
                  })
                : icon}
            </div>
          )}

          <input
            ref={ref}
            type={getInputType()}
            value={value}
            onChange={onChange}
            onBlur={(e) => {
              setIsFocused(false);
              if (onBlur) onBlur(e);
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            disabled={resolvedDisabled}
            style={getVariantStyles()}
            className={mergeClassNames("modern-input-field", inputClassName)}
            {...props}
          />

          {renderEndIcon()}
        </div>

        {(error || success || helper) && (
          <div style={{ ...helperTextStyles, color: getHelperTextColor() }}>
            {error || success || helper}
          </div>
        )}
      </div>
    );
  }
);

ModernInput.displayName = "ModernInput";

export default memo(ModernInput);
