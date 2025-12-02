import React, { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import ModernCard from "../../adminDashboard/components/ModernCard";

/**
 * Advanced filter panel for projects
 */
const ProjectsFilterPanel = ({
    searchQuery,
    onSearchChange,
    filters,
    onFilterChange,
    onResetFilters,
    filterOptions,
    customFilters = null,
}) => {
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const handleStatusChange = (status) => {
        const newStatuses = filters.status.includes(status)
            ? filters.status.filter((s) => s !== status)
            : [...filters.status, status];

        onFilterChange({ ...filters, status: newStatuses });
    };

    const handleRegionChange = (region) => {
        const newRegions = filters.region.includes(region)
            ? filters.region.filter((r) => r !== region)
            : [...filters.region, region];

        onFilterChange({ ...filters, region: newRegions });
    };

    const handleProviderChange = (provider) => {
        const newProviders = filters.provider.includes(provider)
            ? filters.provider.filter((p) => p !== provider)
            : [...filters.provider, provider];

        onFilterChange({ ...filters, provider: newProviders });
    };

    const handleDateChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const hasActiveFilters =
        searchQuery ||
        filters.status.length > 0 ||
        filters.region.length > 0 ||
        filters.provider.length > 0 ||
        filters.dateFrom ||
        filters.dateTo;

    return (
        <ModernCard padding="sm" className="space-y-4">
            {/* Search and Quick Filters */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                {/* Search Input */}
                <div className="flex-1 md:max-w-md">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search projects by name, identifier, or description..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${showAdvancedFilters
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                    >
                        <Filter size={16} />
                        Filters
                        {hasActiveFilters && (
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                                {[
                                    filters.status.length,
                                    filters.region.length,
                                    filters.provider.length,
                                    filters.dateFrom ? 1 : 0,
                                    filters.dateTo ? 1 : 0,
                                ].reduce((a, b) => a + b, 0)}
                            </span>
                        )}
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onResetFilters}
                            className="flex items-center gap-1 text-sm text-blue-600 transition hover:text-blue-700"
                        >
                            <X size={16} />
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        {/* Status Filter */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <div className="space-y-2">
                                {filterOptions.statuses.map((status) => (
                                    <label key={status} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={filters.status.includes(status)}
                                            onChange={() => handleStatusChange(status)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm capitalize text-gray-700">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Region Filter */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Region
                            </label>
                            <div className="space-y-2">
                                {filterOptions.regions.length > 0 ? (
                                    filterOptions.regions.map((region) => (
                                        <label key={region} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.region.includes(region)}
                                                onChange={() => handleRegionChange(region)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">{region}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No regions available</p>
                                )}
                            </div>
                        </div>

                        {/* Provider Filter */}
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Provider
                            </label>
                            <div className="space-y-2">
                                {filterOptions.providers.length > 0 ? (
                                    filterOptions.providers.map((provider) => (
                                        <label key={provider} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={filters.provider.includes(provider)}
                                                onChange={() => handleProviderChange(provider)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm capitalize text-gray-700">{provider}</span>
                                        </label>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No providers available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Created From
                            </label>
                            <input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleDateChange("dateFrom", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Created To
                            </label>
                            <input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleDateChange("dateTo", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Custom Filters */}
                    {customFilters}
                </div>
            )}

            {/* Active Filter Badges */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {filters.status.map((status) => (
                        <span
                            key={status}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                            Status: {status}
                            <button
                                type="button"
                                onClick={() => handleStatusChange(status)}
                                className="hover:text-blue-900"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {filters.region.map((region) => (
                        <span
                            key={region}
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                        >
                            Region: {region}
                            <button
                                type="button"
                                onClick={() => handleRegionChange(region)}
                                className="hover:text-green-900"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    {filters.provider.map((provider) => (
                        <span
                            key={provider}
                            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                        >
                            Provider: {provider}
                            <button
                                type="button"
                                onClick={() => handleProviderChange(provider)}
                                className="hover:text-purple-900"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </ModernCard>
    );
};

export default ProjectsFilterPanel;
