import React, { useState, forwardRef } from "react";
import { AlertCircle, Check } from "lucide-react";
import { designTokens } from "../../styles/designTokens";

const ModernTextarea = forwardRef(
  (
    {
      label = "",
      placeholder = "",
      value = "",
      onChange = () => {},
      onBlur = () => {},
      error = "",
      success = "",
      helper = "",
      required = false,
      disabled = false,
      rows = 4,
      className = "",
      textareaClassName = "",
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const baseStyles = {
      width: "100%",
      minHeight: `${rows * 24}px`,
      padding: "12px 16px",
      fontSize: designTokens.typography.fontSize.base[0],
      lineHeight: 1.5,
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
      borderRadius: designTokens.borderRadius.lg,
      outline: "none",
      resize: "vertical",
      transition: "all 0.2s ease",
      backgroundColor: disabled
        ? designTokens.colors.neutral[100]
        : designTokens.colors.neutral[50],
      color: disabled
        ? designTokens.colors.neutral[400]
        : designTokens.colors.neutral[900],
    };

    const computedStyles = {
      ...baseStyles,
      border: error
        ? `1px solid ${designTokens.colors.error[500]}`
        : success
        ? `1px solid ${designTokens.colors.success[500]}`
        : `1px solid ${
            isFocused
              ? designTokens.colors.primary[500]
              : designTokens.colors.neutral[300]
          }`,
      boxShadow: error
        ? isFocused
          ? `0 0 0 3px ${designTokens.colors.error[100]}`
          : "none"
        : success
        ? isFocused
          ? `0 0 0 3px ${designTokens.colors.success[100]}`
          : "none"
        : isFocused
        ? `0 0 0 3px ${designTokens.colors.primary[100]}`
        : "none",
      cursor: disabled ? "not-allowed" : "text",
    };

    const labelStyles = {
      display: "block",
      fontSize: designTokens.typography.fontSize.sm[0],
      fontWeight: designTokens.typography.fontWeight.medium,
      color: error
        ? designTokens.colors.error[700]
        : designTokens.colors.neutral[600],
      marginBottom: "6px",
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    };

    const helperTextStyles = {
      marginTop: "6px",
      fontSize: designTokens.typography.fontSize.xs[0],
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
      color: error
        ? designTokens.colors.error[600]
        : success
        ? designTokens.colors.success[600]
        : designTokens.colors.neutral[500],
    };

    return (
      <div className={className}>
        {label && (
          <label className="flex items-center gap-1" style={labelStyles}>
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            value={value}
            onChange={onChange}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur(event);
            }}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            disabled={disabled}
            style={computedStyles}
            className={`modern-textarea-field ${textareaClassName}`}
            rows={rows}
            {...props}
          />
          {(error || success) && (
            <div className="pointer-events-none absolute right-3 top-3 text-neutral-400">
              {error ? (
                <AlertCircle
                  size={18}
                  color={designTokens.colors.error[500]}
                />
              ) : (
                <Check
                  size={18}
                  color={designTokens.colors.success[500]}
                />
              )}
            </div>
          )}
        </div>
        {(error || success || helper) && (
          <p style={helperTextStyles}>{error || success || helper}</p>
        )}
      </div>
    );
  }
);

ModernTextarea.displayName = "ModernTextarea";

export default ModernTextarea;
