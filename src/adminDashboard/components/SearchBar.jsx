import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Reusable SearchBar component with debouncing and keyboard shortcuts
 * 
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {function} props.onChange - Callback when search value changes
 * @param {string} props.placeholder - Placeholder text
 * @param {number} props.debounceMs - Debounce delay in milliseconds (default: 300)
 * @param {boolean} props.isLoading - Show loading state
 * @param {string} props.className - Additional CSS classes
 */
const SearchBar = ({
    value = '',
    onChange,
    placeholder = 'Search...',
    debounceMs = 300,
    isLoading = false,
    className = '',
}) => {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef(null);
    const debounceTimer = useRef(null);

    // Sync external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Debounced onChange
    useEffect(() => {
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            if (localValue !== value) {
                onChange(localValue);
            }
        }, debounceMs);

        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [localValue, debounceMs, onChange, value]);

    // Keyboard shortcut: Ctrl+K or Cmd+K to focus
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search
                        className={`h-5 w-5 transition-colors ${isLoading ? 'text-blue-500 animate-pulse' : 'text-gray-400'
                            }`}
                    />
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                    placeholder={placeholder}
                    className="block w-full pl-10 pr-10 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    aria-label="Search"
                />

                {localValue && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Clear search"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Keyboard shortcut hint */}
            <div className="absolute right-0 -bottom-5 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                    {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                {' + '}
                <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                    K
                </kbd>
                {' to focus'}
            </div>
        </div>
    );
};

export default SearchBar;
