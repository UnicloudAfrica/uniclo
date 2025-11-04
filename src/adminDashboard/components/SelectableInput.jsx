import React, { useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Loader2, X } from "lucide-react";

const SelectableInput = ({
  options = [],
  value = "",
  searchValue = "",
  onSearchChange = () => {},
  onSelect = () => {},
  placeholder = "Search...",
  disabled = false,
  isLoading = false,
  emptyMessage = "No results found",
  hasError = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const [dropdownStyles, setDropdownStyles] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const updateDropdownPosition = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyles({
      top: rect.bottom + window.scrollY + 8,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideContainer =
        containerRef.current && containerRef.current.contains(event.target);
      const clickedInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(event.target);

      if (!clickedInsideContainer && !clickedInsideDropdown) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || disabled) return;
    updateDropdownPosition();

    const handleResize = () => updateDropdownPosition();
    const handleScroll = () => updateDropdownPosition();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, disabled, options.length, searchValue]);

  const filteredOptions = useMemo(() => {
    const term = (searchValue || "").trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) =>
      option.name.toLowerCase().includes(term)
    );
  }, [options, searchValue]);

  const handleInputChange = (event) => {
    onSearchChange(event.target.value);
    if (!disabled) {
      setIsOpen(true);
      updateDropdownPosition();
    }
  };

  const handleOptionSelect = (option) => {
    onSearchChange(option.name);
    onSelect(option);
    setIsOpen(false);
  };

  const handleClear = () => {
    onSearchChange("");
    onSelect(null);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    inputRef.current?.focus();
    if (!isOpen) {
      updateDropdownPosition();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!disabled) {
        setIsOpen(true);
        updateDropdownPosition();
      }
    }

    if (event.key === "Enter" && filteredOptions.length === 1) {
      event.preventDefault();
      handleOptionSelect(filteredOptions[0]);
    }
  };

  const inputClasses = [
    "w-full input-field pr-10",
    disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "",
    hasError ? "border-red-500 focus:border-red-500 focus:ring-red-200" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const showDropdown = isOpen && !disabled;
  const showClearButton = !disabled && searchValue;

  const dropdown =
    showDropdown && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={dropdownRef}
            className="z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            style={{
              position: "absolute",
              top: dropdownStyles.top,
              left: dropdownStyles.left,
              width: dropdownStyles.width,
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : filteredOptions.length > 0 ? (
              <ul className="max-h-56 overflow-y-auto py-1">
                {filteredOptions.map((option, index) => {
                  const isSelected = String(option.id) === String(value);
                  return (
                    <li key={`${option.id}-${index}`}>
                      <button
                        type="button"
                        onClick={() => handleOptionSelect(option)}
                        className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm transition ${
                          isSelected
                            ? "bg-[#288DD1]/10 font-medium text-[#288DD1]"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {option.name}
                        {isSelected && (
                          <span className="text-xs font-semibold text-[#288DD1]">
                            Selected
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500">{emptyMessage}</div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              setIsOpen(true);
              updateDropdownPosition();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={handleToggle}
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:text-gray-600 focus:outline-none"
          tabIndex={-1}
          aria-label="Toggle options"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                showDropdown ? "rotate-180" : ""
              }`}
            />
          )}
        </button>
      </div>
      {dropdown}
    </div>
  );
};

export default SelectableInput;
