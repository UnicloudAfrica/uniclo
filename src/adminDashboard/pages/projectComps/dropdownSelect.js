import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Loader2 } from "lucide-react";

export const DropdownSelect = ({
  options,
  value, // Can be single value (string/number) or array of values (for multi-select)
  onChange, // Callback receives single value or array of values
  placeholder,
  isFetching,
  displayKey, // Key to display in the list (e.g., 'name', 'first_name')
  valueKey, // Key to use as the value (e.g., 'id')
  searchKeys, // Array of keys to search against (e.g., ['name', 'email'])
  isMultiSelect = false, // New prop for multi-selection
  error, // Optional error message
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Determine the current display value for single select, or an array of selected options for multi-select
  const selectedDisplayValue = isMultiSelect
    ? options.filter((option) => value.includes(option[valueKey]))
    : options.find((option) => option[valueKey] === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    if (isMultiSelect) {
      const newSelectedValues = value.includes(option[valueKey])
        ? value.filter((val) => val !== option[valueKey]) // Remove if already selected
        : [...value, option[valueKey]]; // Add if not selected
      onChange(newSelectedValues);
    } else {
      onChange(option[valueKey]);
      setIsOpen(false);
    }
    setSearchTerm(""); // Clear search term after selection
  };

  const handleRemoveMultiSelect = (itemValue) => {
    const newSelectedValues = value.filter((val) => val !== itemValue);
    onChange(newSelectedValues);
  };

  const filteredOptions = options.filter((option) => {
    // If multi-select, exclude already selected options from the list
    if (isMultiSelect && value.includes(option[valueKey])) {
      return false;
    }
    // Filter by search term across specified searchKeys
    return searchKeys.some((key) =>
      String(option[key]).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input/Display Area */}
      <div
        className={`input-field flex items-center justify-between cursor-pointer ${
          error ? "border-red-500" : "border-gray-300"
        } ${isOpen ? "ring-1 ring-[#288DD1] border-[#288DD1]" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isMultiSelect ? (
          <div className="flex flex-wrap gap-2 py-1">
            {selectedDisplayValue.length > 0 ? (
              selectedDisplayValue.map((item) => (
                <span
                  key={item[valueKey]}
                  className="flex items-center bg-[#288DD1] text-white text-xs px-2 py-1 rounded-full"
                >
                  {item[displayKey]}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent dropdown from closing
                      handleRemoveMultiSelect(item[valueKey]);
                    }}
                    className="ml-1 text-white hover:text-gray-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
        ) : (
          <span className={value ? "text-gray-700" : "text-gray-500"}>
            {selectedDisplayValue
              ? selectedDisplayValue[displayKey]
              : placeholder}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 z-10 max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#288DD1]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking search
            />
          </div>
          {isFetching ? (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
            </div>
          ) : filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option[valueKey]}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-gray-700 text-sm"
                onClick={() => handleSelect(option)}
              >
                {option[displayKey]}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500 text-sm">
              No options found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
