import React, { useMemo } from "react";
import { Search, X } from "lucide-react";
import { ModernCard } from "../ui";
import AdvancedFilters from "../tables/AdvancedFilters";

/**
 * Projects filter panel using generic AdvancedFilters
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
  // Convert filterOptions to AdvancedFilters schema
  const filterSchema = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "multiselect",
        options: filterOptions.statuses.map((s) => ({
          label: s.charAt(0).toUpperCase() + s.slice(1),
          value: s,
        })),
      },
      {
        key: "region",
        label: "Region",
        type: "multiselect", // Assuming region is multiselect based on previous implementation
        options: filterOptions.regions.map((r) => ({ label: r, value: r })),
      },
      {
        key: "provider",
        label: "Provider",
        type: "multiselect",
        options: filterOptions.providers.map((p) => ({
          label: p.charAt(0).toUpperCase() + p.slice(1),
          value: p,
        })),
      },
      {
        key: "dateRange", // Mapping dateFrom/dateTo to a single 'daterange' type if generic component supports it
        // AdvancedFilters generic component supports 'daterange' type which returns { start, end }
        // But 'filters' prop uses dateFrom and dateTo keys separately.
        // We need to map { start, end } back to { dateFrom, dateTo }
        label: "Created Date",
        type: "daterange",
      },
    ],
    [filterOptions]
  );

  // Map current flat filters to structure expected by AdvancedFilters
  const currentValues = useMemo(
    () => ({
      status: filters.status,
      region: filters.region,
      provider: filters.provider,
      dateRange: { start: filters.dateFrom, end: filters.dateTo },
    }),
    [filters]
  );

  const handleAdvancedFilterChange = (newValues) => {
    // Map back to parent structure
    const updatedFilters = {
      ...filters,
      status: newValues.status,
      region: newValues.region,
      provider: newValues.provider,
      dateFrom: newValues.dateRange?.start || null,
      dateTo: newValues.dateRange?.end || null,
    };
    onFilterChange(updatedFilters);
  };

  const hasActiveFilters =
    searchQuery ||
    filters.status.length > 0 ||
    filters.region.length > 0 ||
    filters.provider.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  // Helper to remove a single filter item (for badges)
  const handleRemoveFilter = (key, value) => {
    if (key === "status") {
      onFilterChange({ ...filters, status: filters.status.filter((s) => s !== value) });
    } else if (key === "region") {
      onFilterChange({ ...filters, region: filters.region.filter((r) => r !== value) });
    } else if (key === "provider") {
      onFilterChange({ ...filters, provider: filters.provider.filter((p) => p !== value) });
    }
  };

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
              placeholder="Search projects..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center gap-2">
          <AdvancedFilters
            filters={filterSchema}
            values={currentValues}
            onChange={handleAdvancedFilterChange}
            onApply={() => {
              /* implicit apply in change for now or no-op since parent handles state */
            }}
            onReset={onResetFilters}
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-sm text-blue-600 transition hover:text-blue-700 ml-2"
            >
              <X size={16} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
            >
              Status: {status}
              <button
                onClick={() => handleRemoveFilter("status", status)}
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
                onClick={() => handleRemoveFilter("region", region)}
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
                onClick={() => handleRemoveFilter("provider", provider)}
                className="hover:text-purple-900"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {customFilters}
    </ModernCard>
  );
};

export default ProjectsFilterPanel;
