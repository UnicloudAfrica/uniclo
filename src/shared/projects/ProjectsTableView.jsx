import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Eye, Archive, PlayCircle, Trash2, Loader2, AlertCircle } from "lucide-react";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import Skeleton from "../components/Skeleton";
import ResourceEmptyState from "../../adminDashboard/components/ResourceEmptyState";
import { getStatusDisplayConfig, formatDate } from "../../utils/projectUtils";

/**
 * Desktop table view for projects
 */
const ProjectsTableView = ({
    projects,
    isLoading,
    isFetching,
    isError,
    error,
    selectedProjects = [],
    onSelectProject,
    onSelectAll,
    onViewProject,
    onArchiveProject,
    onActivateProject,
    onDeleteProject,
    sortConfig,
    onSort,
    currentPage,
    totalPages,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    totalProjects,
}) => {
    const [expandedRows, setExpandedRows] = useState([]);

    const toggleRow = (identifier) => {
        setExpandedRows((prev) =>
            prev.includes(identifier)
                ? prev.filter((id) => id !== identifier)
                : [...prev, identifier]
        );
    };

    const handleSort = (key) => {
        const direction =
            sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
        onSort(key, direction);
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return sortConfig.direction === "asc" ? (
            <ChevronUp size={14} className="inline" />
        ) : (
            <ChevronDown size={14} className="inline" />
        );
    };

    if (isFetching && !isLoading) {
        return (
            <ModernCard>
                <div className="space-y-4 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton width={200} height={24} />
                        <div className="flex gap-2">
                            <Skeleton width={80} height={32} />
                            <Skeleton width={80} height={32} />
                        </div>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b">
                            <div className="flex gap-4">
                                <Skeleton width={20} height={20} />
                                <Skeleton width={100} height={16} />
                                <Skeleton width={100} height={16} />
                                <Skeleton width={100} height={16} />
                                <Skeleton width={100} height={16} />
                            </div>
                        </div>
                        {Array(5)
                            .fill(0)
                            .map((_, i) => (
                                <div key={i} className="p-4 border-b last:border-0 flex gap-4 items-center">
                                    <Skeleton width={20} height={20} />
                                    <div className="flex-1 grid grid-cols-5 gap-4">
                                        <Skeleton width="80%" height={16} />
                                        <Skeleton width="60%" height={16} />
                                        <Skeleton width="70%" height={16} />
                                        <Skeleton width="50%" height={16} />
                                        <Skeleton width="40%" height={16} />
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </ModernCard>
        );
    }

    if (isError) {
        return (
            <ModernCard>
                <div className="py-8">
                    <ResourceEmptyState
                        title="Failed to load projects"
                        message={error?.message || "An unexpected error occurred."}
                        icon={<AlertCircle size={24} className="text-red-500" />}
                    />
                </div>
            </ModernCard>
        );
    }

    if (!isLoading && projects.length === 0) {
        return (
            <ModernCard>
                <div className="py-8">
                    <ResourceEmptyState
                        title="No projects found"
                        message="Try adjusting your filters or create a new project to get started."
                        icon={<Eye size={24} />}
                    />
                </div>
            </ModernCard>
        );
    }

    return (
        <>
            <ModernCard>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="w-10 px-6 py-3"></th>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedProjects.length === projects.length && projects.length > 0}
                                        onChange={onSelectAll}
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                    onClick={() => handleSort("name")}
                                >
                                    Project Name <SortIcon columnKey="name" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Identifier
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                    onClick={() => handleSort("status")}
                                >
                                    Status <SortIcon columnKey="status" />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Region
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Provider
                                </th>
                                <th
                                    className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:text-gray-700"
                                    onClick={() => handleSort("created_at")}
                                >
                                    Created <SortIcon columnKey="created_at" />
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {projects.map((project) => {
                                const statusStyle = getStatusDisplayConfig(project.status);
                                const isExpanded = expandedRows.includes(project.identifier);

                                return (
                                    <React.Fragment key={project.identifier}>
                                        <tr
                                            className={`transition-colors hover:bg-gray-50 ${isExpanded ? "bg-blue-50/30" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleRow(project.identifier)}
                                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedProjects.includes(project.identifier)}
                                                    onChange={() => onSelectProject(project.identifier)}
                                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td
                                                className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                                                onClick={() => onViewProject(project)}
                                            >
                                                {project.name || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {project.identifier || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusStyle.animate ? "animate-pulse" : ""
                                                        }`}
                                                    style={{
                                                        backgroundColor: statusStyle.backgroundColor,
                                                        color: statusStyle.color,
                                                    }}
                                                >
                                                    {statusStyle.icon}
                                                    <span className="capitalize">{statusStyle.label}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {project.region ? project.region.toUpperCase() : "N/A"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                                {project.provider || "—"}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(project.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => onViewProject(project)}
                                                        className="text-blue-600 hover:text-blue-900 transition"
                                                        title="View details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {onActivateProject && project.status !== "active" && (
                                                        <button
                                                            onClick={() => onActivateProject(project)}
                                                            className="text-green-600 hover:text-green-900 transition"
                                                            title="Activate project"
                                                        >
                                                            <PlayCircle size={16} />
                                                        </button>
                                                    )}
                                                    {onArchiveProject && (
                                                        <button
                                                            onClick={() => onArchiveProject(project)}
                                                            className="text-gray-600 hover:text-gray-900 transition"
                                                            title="Archive project"
                                                        >
                                                            <Archive size={16} />
                                                        </button>
                                                    )}
                                                    {onDeleteProject && (
                                                        <button
                                                            onClick={() => onDeleteProject(project)}
                                                            className="text-red-600 hover:text-red-900 transition"
                                                            title="Delete project"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan="9" className="px-6 py-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div className="col-span-2">
                                                            <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                                                            <p className="text-gray-600">
                                                                {project.description || "No description provided."}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 mb-1">Resources</h4>
                                                            <div className="flex gap-4">
                                                                <div>
                                                                    <span className="text-gray-500 block text-xs">Instances</span>
                                                                    <span className="font-medium">
                                                                        {project.resources_count?.instances || 0}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 block text-xs">Volumes</span>
                                                                    <span className="font-medium">
                                                                        {project.resources_count?.volumes || 0}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </ModernCard>

            {/* Pagination */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                        {[10, 15, 20, 30, 50].map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <span className="text-sm text-gray-600">
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalProjects)} -{" "}
                        {Math.min(currentPage * itemsPerPage, totalProjects)} of {totalProjects}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <ModernButton
                            variant="outline"
                            size="sm"
                            isDisabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                        >
                            Previous
                        </ModernButton>
                        <ModernButton
                            variant="outline"
                            size="sm"
                            isDisabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => onPageChange(currentPage + 1)}
                        >
                            Next
                        </ModernButton>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProjectsTableView;
