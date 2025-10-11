import React from "react";

const CheckboxGroup = ({
  label,
  options,
  selectedValues,
  onChange,
  error,
  disabled,
  required,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="space-y-2 border border-gray-300 rounded-lg p-3">
      {options.map((option) => {
        const isObject = typeof option === "object" && option !== null;
        const value = isObject ? option.value : option;
        const displayLabel = isObject ? option.label : option;

        return (
          <label key={value} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedValues.includes(value)}
              onChange={() => onChange(value)}
              className="h-4 w-4 text-[--theme-color] border-gray-300 rounded focus:ring-[--theme-color]"
              disabled={disabled}
            />
            <span className="ml-2 text-sm text-gray-700">{displayLabel}</span>
          </label>
        );
      })}
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default CheckboxGroup;
