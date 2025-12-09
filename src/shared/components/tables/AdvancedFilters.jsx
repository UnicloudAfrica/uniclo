import React, { useState } from "react";
import { Filter, X, Calendar, ChevronDown } from "lucide-react";

/**
 * Reusable AdvancedFilters component
 *
 * @param {Object} props
 * @param {Array} props.filters - Array of filter configurations
 * @param {Object} props.values - Current filter values
 * @param {function} props.onChange - Callback when filter values change
 * @param {function} props.onApply - Callback when apply button clicked
 * @param {function} props.onReset - Callback when reset button clicked
 * @param {string} props.className - Additional CSS classes
 */
const AdvancedFilters = ({
  filters = [],
  values = {},
  onChange,
  onApply,
  onReset,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (filterKey, value) => {
    onChange({
      ...values,
      [filterKey]: value,
    });
  };

  const activeFilterCount = Object.values(values).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object" && v !== null) {
      return Object.values(v).some((val) => val !== null && val !== "");
    }
    return v !== null && v !== "";
  }).length;

  const handleReset = () => {
    const resetValues = {};
    filters.forEach((filter) => {
      if (filter.type === "multiselect") {
        resetValues[filter.key] = [];
      } else if (filter.type === "daterange") {
        resetValues[filter.key] = { start: null, end: null };
      } else {
        resetValues[filter.key] = "";
      }
    });
    onChange(resetValues);
    onReset();
  };

  const renderFilter = (filter) => {
    const value = values[filter.key];

    switch (filter.type) {
      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleValueChange(filter.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <label key={option.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...(value || []), option.value]
                      : (value || []).filter((v) => v !== option.value);
                    handleValueChange(filter.key, newValue);
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case "daterange":
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">From</label>
              <input
                type="date"
                value={value?.start || ""}
                onChange={(e) =>
                  handleValueChange(filter.key, {
                    ...value,
                    start: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">To</label>
              <input
                type="date"
                value={value?.end || ""}
                onChange={(e) =>
                  handleValueChange(filter.key, {
                    ...value,
                    end: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        );

      case "text":
        return (
          <input
            type="text"
            value={value || ""}
            onChange={(e) => handleValueChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Filter panel */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Advanced Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {filter.label}
                  </label>
                  {renderFilter(filter)}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={() => {
                  onApply();
                  setIsOpen(false);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
