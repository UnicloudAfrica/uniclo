import React, { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, AlertCircle, Check } from "lucide-react";
import { designTokens } from "../../../styles/designTokens";

interface Option {
  label: string;
  value: string | number;
}

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  error?: string;
  success?: string;
  helper?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  options?: Array<string | Option>;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

const mergeClassNames = (...values: (string | undefined | null | false)[]) =>
  values.flat().filter(Boolean).join(" ");

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label = "",
  placeholder = "Select an option",
  value = "",
  onChange,
  onBlur,
  error = "",
  success = "",
  helper = "",
  required = false,
  disabled = false,
  size = "md",
  options = [],
  className = "",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const parsedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string" ? { label: option, value: option } : option
      ),
    [options]
  );

  const selectedOption = useMemo(
    () =>
      parsedOptions.find(
        (option) => String(option.value) === String(value)
      ) || null,
    [parsedOptions, value]
  );

  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return parsedOptions;
    return parsedOptions.filter((option) => {
      const labelText = String(option.label || "").toLowerCase();
      const valueText = String(option.value || "").toLowerCase();
      return labelText.includes(term) || valueText.includes(term);
    });
  }, [parsedOptions, searchTerm]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    searchInputRef.current?.focus();
  }, [isOpen]);

  const sizes = {
    sm: {
      height: "36px",
      padding: "0 36px 0 12px",
      fontSize: designTokens.typography.fontSize.sm[0] as string,
      iconSize: 16,
    },
    md: {
      height: "44px",
      padding: "0 44px 0 16px",
      fontSize: designTokens.typography.fontSize.base[0] as string,
      iconSize: 18,
    },
    lg: {
      height: "52px",
      padding: "0 48px 0 20px",
      fontSize: designTokens.typography.fontSize.lg[0] as string,
      iconSize: 20,
    },
  };

  const computedStyles: React.CSSProperties = {
    width: "100%",
    height: sizes[size].height,
    padding: sizes[size].padding,
    fontSize: sizes[size].fontSize,
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    borderRadius: designTokens.borderRadius.lg,
    border: error
      ? `1px solid ${designTokens.colors.error[500]}`
      : success
        ? `1px solid ${designTokens.colors.success[500]}`
        : `1px solid ${
            isOpen ? designTokens.colors.primary[500] : designTokens.colors.neutral[300]
          }`,
    backgroundColor: disabled
      ? designTokens.colors.neutral[100]
      : designTokens.colors.neutral[50],
    color: disabled ? designTokens.colors.neutral[400] : designTokens.colors.neutral[800],
    appearance: "none",
    outline: "none",
    transition: "all 0.2s ease",
    boxShadow: error
      ? `0 0 0 3px ${designTokens.colors.error[100]}`
      : success
        ? `0 0 0 3px ${designTokens.colors.success[100]}`
        : isOpen
          ? `0 0 0 3px ${designTokens.colors.primary[100]}`
          : "none",
    cursor: disabled ? "not-allowed" : "pointer",
  };

  const labelStyles: React.CSSProperties = {
    display: "block",
    fontSize: designTokens.typography.fontSize.sm[0] as string,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: error ? designTokens.colors.error[700] : designTokens.colors.neutral[600],
    marginBottom: "6px",
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
  };

  const helperTextStyles: React.CSSProperties = {
    marginTop: "6px",
    fontSize: designTokens.typography.fontSize.xs[0] as string,
    fontFamily: designTokens.typography.fontFamily.sans.join(", "),
    color: error
      ? designTokens.colors.error[600]
      : success
        ? designTokens.colors.success[600]
        : designTokens.colors.neutral[500],
  };

  const handleSelect = (option: Option) => {
    if (disabled) return;
    const syntheticEvent = {
      target: {
        value: option.value,
        selectedOptions: [{ text: option.label }],
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange?.(syntheticEvent);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    setSearchTerm("");
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="flex items-center gap-1" style={labelStyles}>
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggle}
          onBlur={onBlur}
          disabled={disabled}
          style={computedStyles}
          className={mergeClassNames("flex items-center justify-between gap-2")}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span
            className={mergeClassNames(
              "min-w-0 flex-1 truncate",
              selectedOption ? "text-slate-800" : "text-slate-400"
            )}
            title={selectedOption ? selectedOption.label : placeholder}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            size={sizes[size].iconSize}
            className={mergeClassNames("transition-transform", isOpen ? "rotate-180" : "")}
            style={{ color: designTokens.colors.neutral[400] }}
          />
        </button>
        {(error || success) && (
          <div className="absolute inset-y-0 right-9 flex items-center">
            {error ? (
              <AlertCircle size={sizes[size].iconSize} color={designTokens.colors.error[500]} />
            ) : (
              <Check size={sizes[size].iconSize} color={designTokens.colors.success[500]} />
            )}
          </div>
        )}
        {isOpen && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-200 p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                disabled={disabled}
              />
            </div>
            {filteredOptions.length > 0 ? (
              <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
                {filteredOptions.map((option) => {
                  const isSelected = String(option.value) === String(value);
                  return (
                    <li key={`${option.value}-${option.label}`}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option)}
                        className={mergeClassNames(
                          "flex w-full items-center justify-between px-4 py-2 text-left text-sm transition",
                          isSelected
                            ? "bg-primary-50 text-primary-600"
                            : "text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <span>{option.label}</span>
                        {isSelected && <span className="text-xs font-semibold">Selected</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500">{emptyMessage}</div>
            )}
          </div>
        )}
      </div>
      {helper && <p style={helperTextStyles}>{helper}</p>}
    </div>
  );
};

export default SearchableSelect;
