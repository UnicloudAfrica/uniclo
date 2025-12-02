import React from "react";
import { X, Filter, Calendar, Tag, Users as UsersIcon } from "lucide-react";
import ModernButton from "./ModernButton";

/**
 * AdvancedFilterPanel - Expandable filter panel for leads
 */
const AdvancedFilterPanel = ({
    isOpen,
    onClose,
    filters,
    onFilterChange,
    onApply,
    onReset
}) => {
    if (!isOpen) return null;

    const handleFilterChange = (key, value) => {
        onFilterChange?.({ ...filters, [key]: value });
    };

    return (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Advanced Filters</h3>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Date Range */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Calendar className="h-4 w-4" />
                        Date Range
                    </label>
                    <select
                        value={filters?.dateRange || "all"}
                        onChange={(e) => handleFilterChange("dateRange", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                        <option value="all">All time</option>
                        <option value="today">Today</option>
                        <option value="week">This week</option>
                        <option value="month">This month</option>
                        <option value="quarter">This quarter</option>
                        <option value="year">This year</option>
                    </select>
                </div>

                {/* Source */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <Tag className="h-4 w-4" />
                        Source
                    </label>
                    <select
                        value={filters?.source || "all"}
                        onChange={(e) => handleFilterChange("source", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                        <option value="all">All sources</option>
                        <option value="website">Website</option>
                        <option value="referral">Referral</option>
                        <option value="social">Social Media</option>
                        <option value="email">Email Campaign</option>
                        <option value="event">Event</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                {/* Lead Type */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                        <UsersIcon className="h-4 w-4" />
                        Lead Type
                    </label>
                    <select
                        value={filters?.leadType || "all"}
                        onChange={(e) => handleFilterChange("leadType", e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    >
                        <option value="all">All types</option>
                        <option value="individual">Individual</option>
                        <option value="business">Business</option>
                        <option value="enterprise">Enterprise</option>
                    </select>
                </div>

                {/* Score Range */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                        Min Score
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={filters?.minScore || 0}
                        onChange={(e) => handleFilterChange("minScore", parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={onReset}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                    Reset
                </button>
                <ModernButton onClick={onApply} className="px-4 py-2">
                    Apply Filters
                </ModernButton>
            </div>
        </div>
    );
};

export default AdvancedFilterPanel;
