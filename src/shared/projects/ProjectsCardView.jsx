import React from "react";
import { Eye, Loader2, AlertCircle, Calendar, Server } from "lucide-react";
import ModernCard from "../../adminDashboard/components/ModernCard";
import ModernButton from "../../adminDashboard/components/ModernButton";
import Skeleton from "../components/Skeleton";
import ResourceEmptyState from "../../adminDashboard/components/ResourceEmptyState";
import { getStatusDisplayConfig, formatDate } from "../../utils/projectUtils";

/**
 * Mobile card view for projects
 */
const ProjectsCardView = ({
    projects,
    isLoading,
    isError,
    error,
    onViewProject,
    currentPage,
    totalPages,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    totalProjects,
}) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array(5)
                    .fill(0)
                    .map((_, i) => (
                        <ModernCard key={i} padding="sm">
                            <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <Skeleton width="70%" height={20} className="mb-2" />
                                        <Skeleton width="50%" height={14} />
                                    </div>
                                    <Skeleton width={80} height={24} className="rounded-full" />
                                </div>
                                <Skeleton width="100%" height={40} />
                                <div className="grid grid-cols-2 gap-3">
                                    <Skeleton width="100%" height={40} />
                                    <Skeleton width="100%" height={40} />
                                </div>
                            </div>
                        </ModernCard>
                    ))}
            </div>
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

    if (projects.length === 0) {
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
            <div className="space-y-4">
                {projects.map((project) => {
                    const statusStyle = getStatusDisplayConfig(project.status);

                    return (
                        <ModernCard
                            key={project.identifier}
                            padding="sm"
                            hover
                            onClick={() => onViewProject(project)}
                            className="cursor-pointer"
                        >
                            <div className="space-y-3">
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-semibold text-gray-900 truncate">
                                            {project.name}
                                        </h3>
                                        <p className="mt-1 text-xs text-gray-500 truncate">
                                            {project.identifier}
                                        </p>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium whitespace-nowrap ${statusStyle.animate ? "animate-pulse" : ""
                                            }`}
                                        style={{
                                            backgroundColor: statusStyle.backgroundColor,
                                            color: statusStyle.color,
                                        }}
                                    >
                                        {statusStyle.icon}
                                        <span className="capitalize">{statusStyle.label}</span>
                                    </span>
                                </div>

                                {/* Description */}
                                {project.description && (
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {project.description}
                                    </p>
                                )}

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-lg bg-gray-50 p-2">
                                        <p className="text-xs text-gray-500">Region</p>
                                        <p className="font-medium text-gray-900">
                                            {project.region ? project.region.toUpperCase() : "N/A"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2">
                                        <p className="text-xs text-gray-500">Provider</p>
                                        <p className="font-medium text-gray-900 capitalize">
                                            {project.provider || "—"}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Server size={12} />
                                            Instances
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {project.resources_count?.instances || 0}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 p-2">
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar size={12} />
                                            Created
                                        </p>
                                        <p className="font-medium text-gray-900">
                                            {formatDate(project.created_at, { month: "short", day: "numeric" })}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="flex justify-end pt-2 border-t border-gray-100">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onViewProject(project);
                                        }}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
                                    >
                                        View details
                                        <Eye size={14} />
                                    </button>
                                </div>
                            </div>
                        </ModernCard>
                    );
                })}
            </div>

            {/* Mobile Pagination */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                        Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalProjects)} -{" "}
                        {Math.min(currentPage * itemsPerPage, totalProjects)} of {totalProjects}
                    </span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                        {[10, 15, 20, 30].map((option) => (
                            <option key={option} value={option}>
                                {option} per page
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
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

export default ProjectsCardView;
