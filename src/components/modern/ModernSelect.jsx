import React, { forwardRef, useMemo, useState } from "react";
import { ChevronDown, AlertCircle, Check } from "lucide-react";
import { designTokens } from "../../styles/designTokens";

const mergeClassNames = (...values) =>
  values
    .flat()
    .filter(Boolean)
    .join(" ");

const ModernSelect = forwardRef(
  (
    {
      label = "",
      placeholder = "Select an option",
      value = "",
      onChange = () => {},
      onBlur = () => {},
      error = "",
      success = "",
      helper = "",
      required = false,
      disabled = false,
      size = "md", // sm, md, lg
      options = [],
      className = "",
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const parsedOptions = useMemo(
      () =>
        options.map((option) =>
          typeof option === "string"
            ? { label: option, value: option }
            : option
        ),
      [options]
    );

    const sizes = {
      sm: {
        height: "36px",
        padding: "0 36px 0 12px",
        fontSize: designTokens.typography.fontSize.sm[0],
        iconSize: 16,
      },
      md: {
        height: "44px",
        padding: "0 44px 0 16px",
        fontSize: designTokens.typography.fontSize.base[0],
        iconSize: 18,
      },
      lg: {
        height: "52px",
        padding: "0 48px 0 20px",
        fontSize: designTokens.typography.fontSize.lg[0],
        iconSize: 20,
      },
    };

    const baseStyles = {
      width: "100%",
      height: sizes[size].height,
      padding: sizes[size].padding,
      fontSize: sizes[size].fontSize,
      fontFamily: designTokens.typography.fontFamily.sans.join(", "),
      borderRadius: designTokens.borderRadius.lg,
      border: `1px solid ${designTokens.colors.neutral[300]}`,
      backgroundColor: disabled
        ? designTokens.colors.neutral[100]
        : designTokens.colors.neutral[50],
      color: disabled
        ? designTokens.colors.neutral[400]
        : designTokens.colors.neutral[800],
      appearance: "none",
      outline: "none",
      transition: "all 0.2s ease",
      boxShadow: "none",
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
      cursor: disabled ? "not-allowed" : "pointer",
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
          <select
            ref={ref}
            value={value}
            onChange={(event) => onChange(event)}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur(event);
            }}
            onFocus={() => setIsFocused(true)}
            disabled={disabled}
            style={computedStyles}
            className={mergeClassNames('modern-select-field')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {parsedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div
            className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
            style={{ color: designTokens.colors.neutral[400] }}
          >
            <ChevronDown size={sizes[size].iconSize} />
          </div>
          {(error || success) && (
            <div className="absolute inset-y-0 right-9 flex items-center">
              {error ? (
                <AlertCircle
                  size={sizes[size].iconSize}
                  color={designTokens.colors.error[500]}
                />
              ) : (
                <Check
                  size={sizes[size].iconSize}
                  color={designTokens.colors.success[500]}
                />
              )}
            </div>
          )}
        </div>
        {helper && <p style={helperTextStyles}>{helper}</p>}
      </div>
    );
  }
);

ModernSelect.displayName = "ModernSelect";

export default ModernSelect;
