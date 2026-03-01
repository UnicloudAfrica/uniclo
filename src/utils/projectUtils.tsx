import React from "react";
import { Activity, AlertCircle, Check, Clock, Loader2, XCircle } from "lucide-react";
import { Project } from "../types/project";

export interface StatusDisplayConfig {
  backgroundColor: string;
  color: string;
  icon: React.ReactElement;
  label: string;
  animate: boolean;
}

/**
 * Get status display configuration for a project status
 * @param {string} status - Project status
 * @returns {StatusDisplayConfig} Status configuration with backgroundColor, color, icon, and label
 */
export const getStatusDisplayConfig = (status: string | undefined): StatusDisplayConfig => {
  const normalizedStatus = (status || "").toLowerCase();

  switch (normalizedStatus) {
    case "processing":
    case "provisioning":
      return {
        backgroundColor: "rgb(var(--theme-warning-100))",
        color: "rgb(var(--theme-warning-600))",
        icon: <Loader2 size={12} className="animate-spin" />,
        label: normalizedStatus === "processing" ? "Processing" : "Provisioning",
        animate: true,
      };
    case "active":
      return {
        backgroundColor: "rgb(var(--theme-success-100))",
        color: "rgb(var(--theme-success-600))",
        icon: <Check size={12} />,
        label: "Active",
        animate: false,
      };
    case "failed":
    case "error":
      return {
        backgroundColor: "rgb(var(--theme-danger-100))",
        color: "rgb(var(--theme-danger-600))",
        icon: <AlertCircle size={12} />,
        label: normalizedStatus === "failed" ? "Failed" : "Error",
        animate: false,
      };
    case "inactive":
    case "archived":
      return {
        backgroundColor: "var(--theme-surface-alt)",
        color: "var(--theme-text-color)",
        icon: <Clock size={12} />,
        label: normalizedStatus === "archived" ? "Archived" : "Inactive",
        animate: false,
      };
    case "pending":
      return {
        backgroundColor: "rgb(var(--theme-color-100))",
        color: "rgb(var(--theme-color-600))",
        icon: <Clock size={12} />,
        label: "Pending",
        animate: false,
      };
    case "deleted":
      return {
        backgroundColor: "rgb(var(--theme-danger-100))",
        color: "rgb(var(--theme-danger-700))",
        icon: <XCircle size={12} />,
        label: "Deleted",
        animate: false,
      };
    default:
      return {
        backgroundColor: "var(--theme-surface-alt)",
        color: "var(--theme-text-color)",
        icon: <Activity size={12} />,
        label: status || "Unknown",
        animate: false,
      };
  }
};

export interface ProjectFilters {
  status?: string[];
  region?: string[];
  provider?: string[];
  dateFrom?: string | null;
  dateTo?: string | null;
}

/**
 * Filter projects based on search query and filters
 * @param {Project[]} projects - Array of projects
 * @param {string} searchQuery - Search query string
 * @param {ProjectFilters} filters - Filter object with status, region, provider, etc.
 * @returns {Project[]} Filtered projects
 */
export const filterProjects = (
  projects: Project[],
  searchQuery: string,
  filters: ProjectFilters = {}
): Project[] => {
  if (!Array.isArray(projects)) return [];

  return projects.filter((project) => {
    // Search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        project?.name?.toLowerCase().includes(query) ||
        project?.identifier?.toLowerCase().includes(query) ||
        project?.description?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      const projectStatus = (project?.status || "").toLowerCase();
      const matchesStatus = filters.status.some((s) => s.toLowerCase() === projectStatus);
      if (!matchesStatus) return false;
    }

    // Region filter
    if (filters.region && filters.region.length > 0) {
      const projectRegion = (project?.region || "").toUpperCase();
      const matchesRegion = filters.region.some((r) => r.toUpperCase() === projectRegion);
      if (!matchesRegion) return false;
    }

    // Provider filter
    if (filters.provider && filters.provider.length > 0) {
      const projectProvider = (project?.provider || "").toLowerCase();
      const matchesProvider = filters.provider.some((p) => p.toLowerCase() === projectProvider);
      if (!matchesProvider) return false;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      const createdAt = project?.created_at ? new Date(project.created_at) : null;
      if (!createdAt) return false;

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        if (createdAt < fromDate) return false;
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        if (createdAt > toDate) return false;
      }
    }

    return true;
  });
};

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Sort projects based on sort configuration
 * @param {Project[]} projects - Array of projects
 * @param {SortConfig} sortConfig - Sort configuration with key and direction
 * @returns {Project[]} Sorted projects
 */
export const sortProjects = (projects: Project[], sortConfig: SortConfig): Project[] => {
  if (!Array.isArray(projects) || !sortConfig || !sortConfig.key) {
    return projects;
  }

  const { key, direction } = sortConfig;
  const multiplier = direction === "asc" ? 1 : -1;

  return [...projects].sort((a, b) => {
    const aValue = a[key as keyof Project];
    const bValue = b[key as keyof Project];

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Handle dates
    if (key === "created_at" || key === "updated_at") {
      const aTime = new Date(aValue as string).getTime();
      const bTime = new Date(bValue as string).getTime();
      return (aTime - bTime) * multiplier;
    }

    // Handle numbers
    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * multiplier;
    }

    // Handle strings
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    return aString.localeCompare(bString) * multiplier;
  });
};

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  provisioningProjects: number;
  inactiveProjects: number;
  totalInstances: number;
  totalVolumes: number;
}

/**
 * Calculate project statistics
 * @param {Project[]} projects - Array of projects
 * @returns {ProjectStats} Statistics object
 */
export const calculateProjectStats = (projects: Project[]): ProjectStats => {
  if (!Array.isArray(projects)) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      provisioningProjects: 0,
      inactiveProjects: 0,
      totalInstances: 0,
      totalVolumes: 0,
    };
  }

  return projects.reduce(
    (acc, project) => {
      const status = (project?.status || "unknown").toLowerCase();

      acc.totalProjects += 1;

      if (status === "active") {
        acc.activeProjects += 1;
      } else if (status === "provisioning" || status === "processing") {
        acc.provisioningProjects += 1;
      } else if (status === "inactive" || status === "archived") {
        acc.inactiveProjects += 1;
      }

      acc.totalInstances += (project?.resources_count?.instances as number) || 0;
      acc.totalVolumes += (project?.resources_count?.volumes as number) || 0;

      return acc;
    },
    {
      totalProjects: 0,
      activeProjects: 0,
      provisioningProjects: 0,
      inactiveProjects: 0,
      totalInstances: 0,
      totalVolumes: 0,
    }
  );
};

/**
 * Encode project ID for URL
 * @param {string|number} id - Project ID
 * @returns {string} Encoded ID
 */
export const encodeProjectId = (id: string | number): string => {
  return encodeURIComponent(btoa(String(id)));
};

/**
 * Decode project ID from URL
 * @param {string} encodedId - Encoded project ID
 * @returns {string} Decoded ID
 */
export const decodeProjectId = (encodedId: string): string => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (error) {
    console.error("Failed to decode project ID:", error);
    return encodedId;
  }
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {Intl.DateTimeFormatOptions} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (
  date: string | Date | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...options,
    });
  } catch {
    return "Invalid Date";
  }
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date: string | Date | undefined): string => {
  if (!date) return "N/A";

  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;

    return formatDate(dateObj);
  } catch {
    return "Invalid Date";
  }
};

/**
 * Get unique values from projects for a specific field
 * @param {Project[]} projects - Array of projects
 * @param {keyof Project} field - Field name
 * @returns {string[]} Unique values
 */
export const getUniqueValues = (projects: Project[], field: keyof Project): string[] => {
  if (!Array.isArray(projects)) return [];

  const values = projects.map((project) => project?.[field]).filter(Boolean) as string[];

  return Array.from(new Set(values));
};

export interface ProjectValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate project data
 * @param {Partial<Project>} projectData - Project data to validate
 * @returns {ProjectValidationResult} Validation result with isValid and errors
 */
export const validateProjectData = (projectData: Partial<Project>): ProjectValidationResult => {
  const errors: Record<string, string> = {};

  if (!projectData.name || projectData.name.trim().length === 0) {
    errors.name = "Project name is required";
  }

  if (!projectData.region) {
    errors.region = "Region is required";
  }

  if (projectData.name && projectData.name.length > 255) {
    errors.name = "Project name must be less than 255 characters";
  }

  if (projectData.description && projectData.description.length > 1000) {
    errors.description = "Description must be less than 1000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Check if project is in a transitional state
 * @param {Project} project - Project object
 * @returns {boolean} True if project is in transitional state
 */
export const isProjectTransitional = (project: Project): boolean => {
  const status = (project?.status || "").toLowerCase();
  return ["provisioning", "processing", "pending"].includes(status);
};

/**
 * Get project status priority for sorting
 * @param {string} status - Project status
 * @returns {number} Priority number (lower = higher priority)
 */
export const getStatusPriority = (status: string | undefined): number => {
  const normalizedStatus = (status || "").toLowerCase();
  const priorities: Record<string, number> = {
    error: 1,
    failed: 2,
    provisioning: 3,
    processing: 4,
    pending: 5,
    active: 6,
    inactive: 7,
    archived: 8,
    deleted: 9,
  };
  return priorities[normalizedStatus] || 10;
};
