/**
 * Project Helper Utilities
 * Shared utility functions for project-related operations
 */

import type {
  Project,
  ProjectUser,
  ProjectStats,
  ProjectSummaryItem,
} from "../types/project.types";

/**
 * Encode project ID for URL parameters
 */
export const encodeProjectId = (id: string): string => {
  return encodeURIComponent(btoa(id));
};

/**
 * Decode project ID from URL parameters
 */
export const decodeProjectId = (encodedId: string): string | null => {
  try {
    return atob(decodeURIComponent(encodedId));
  } catch (e) {
    console.error("Error decoding project ID:", e);
    return null;
  }
};

/**
 * Format user's full name from various name field combinations
 */
export const formatMemberName = (user: Partial<ProjectUser> = {}): string => {
  if (user.name) return user.name;
  if (user.full_name) return user.full_name;

  const parts = [user.first_name, user.middle_name, user.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (parts) return parts;
  return user.email || (user.id ? `User #${user.id}` : "Unknown user");
};

/**
 * Check if a user has tenant admin role
 */
export const isTenantAdmin = (user: ProjectUser | null | undefined): boolean => {
  if (!user) return false;

  // Check roles array
  if (
    Array.isArray(user.roles) &&
    user.roles.some((role) => role === "tenant_admin" || role === "tenant-admin")
  ) {
    return true;
  }

  // Check string role
  if (typeof user.role === "string") {
    const role = user.role.toLowerCase();
    if (role.includes("tenant_admin") || role.includes("tenant-admin")) {
      return true;
    }
  }

  // Check status
  if (user?.status?.tenant_admin) return true;

  return false;
};

/**
 * Convert text to title case
 */
export const toTitleCase = (input: string = ""): string =>
  input
    .toString()
    .replace(/[_-]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

/**
 * Format date to readable string
 */
export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

/**
 * Get project status variant (colors and labels)
 */
export const getProjectStatusVariant = (status: string = "") => {
  const normalized = status.toString().toLowerCase();

  switch (normalized) {
    case "active":
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "pending":
    case "processing":
    case "provisioning":
      return {
        label:
          normalized === "pending"
            ? "Pending"
            : normalized === "processing"
              ? "Processing"
              : "Provisioning",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "inactive":
      return {
        label: "Inactive",
        bg: "bg-gray-100",
        text: "text-gray-600",
        dot: "bg-gray-400",
      };
    case "failed":
    case "error":
      return {
        label: normalized === "failed" ? "Failed" : "Error",
        bg: "bg-rose-50",
        text: "text-rose-700",
        dot: "bg-rose-500",
      };
    default:
      return {
        label: toTitleCase(normalized || "Unknown"),
        bg: "bg-blue-50",
        text: "text-blue-700",
        dot: "bg-blue-500",
      };
  }
};

/**
 * Calculate project statistics from array of projects
 */
export const calculateProjectStats = (projects: Project[]): ProjectStats => {
  return projects.reduce(
    (stats, project) => {
      stats.total++;
      const status = project.status.toLowerCase();

      if (status === "active") stats.active++;
      else if (status === "inactive") stats.inactive++;
      else if (status === "pending" || status === "processing" || status === "provisioning")
        stats.pending++;
      else if (status === "failed" || status === "error") stats.failed++;

      return stats;
    },
    { total: 0, active: 0, inactive: 0, pending: 0, failed: 0 }
  );
};

/**
 * Normalize summary key for comparison
 */
export const normalizeSummaryKey = (value: string = ""): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Check if a summary item is completed
 */
export const isSummaryItemCompleted = (item: ProjectSummaryItem | undefined): boolean => {
  if (!item) return false;
  return item.completed === true || item.complete === true;
};

/**
 * Extract users from project data (handles multiple data structures)
 */
export const extractProjectUsers = (project: Project | null | undefined): ProjectUser[] => {
  if (!project) return [];

  if (project.users) {
    if (Array.isArray(project.users)) return project.users;
    if ("local" in project.users && Array.isArray(project.users.local)) {
      return project.users.local;
    }
  }

  return [];
};

/**
 * Extract instances from project data
 */
export const extractProjectInstances = (project: Project | null | undefined) => {
  if (!project) return [];

  if (Array.isArray(project.instances)) return project.instances;
  if (Array.isArray(project.pending_instances)) return project.pending_instances;

  return [];
};

/**
 * Filter projects by search query
 */
export const filterProjectsBySearch = (projects: Project[], searchQuery: string): Project[] => {
  if (!searchQuery.trim()) return projects;

  const query = searchQuery.toLowerCase();
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query) ||
      project.identifier.toLowerCase().includes(query) ||
      project.region.toLowerCase().includes(query) ||
      project.region_name?.toLowerCase().includes(query)
  );
};
