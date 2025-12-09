// @ts-nocheck
import React from "react";

const CheckboxGroup = ({ label, options, selectedValues, onChange, error, disabled, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <div className="space-y-2 border border-gray-300 rounded-lg p-3">
      {options.map((option: any) => (
        <label key={option.value || option} className="flex items-center">
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value || option)}
            onChange={() => onChange(option.value || option)}
            className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
            disabled={disabled}
          />
          <span className="ml-2 text-sm text-gray-700">{option.label || option}</span>
        </label>
      ))}
    </div>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export default CheckboxGroup;
