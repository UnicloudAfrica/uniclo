import logger from "./logger";
/**
 * Export projects to CSV format
 * @param {Array} projects - Array of projects to export
 * @param {Array} columns - Column configuration
 * @returns {string} CSV string
 */
export interface ExportColumn {
  key: string;
  label: string;
}

export interface ProjectResourcesCount {
  instances?: number;
  volumes?: number;
  [key: string]: unknown;
}

export interface ProjectExportRecord {
  identifier?: string | number;
  status?: string;
  region?: string;
  availability_zone?: string;
  created_at?: string;
  updated_at?: string;
  resources_count?: ProjectResourcesCount;
  [key: string]: unknown;
}

const DEFAULT_COLUMNS: ExportColumn[] = [
  { key: "name", label: "Project Name" },
  { key: "identifier", label: "Identifier" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
  { key: "region", label: "Region" },
  { key: "availability_zone", label: "Availability Zone" },
  { key: "type", label: "Type" },
  { key: "created_at", label: "Created At" },
];

const getNestedValue = (record: ProjectExportRecord, path: string): unknown => {
  if (!path.includes(".")) {
    return record[path];
  }
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object") {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, record);
};

export const exportToCSV = (
  projects: ProjectExportRecord[],
  columns: ExportColumn[] = []
): string => {
  if (!Array.isArray(projects) || projects.length === 0) {
    return "";
  }

  const columnsToUse = columns.length > 0 ? columns : DEFAULT_COLUMNS;

  // Create CSV header
  const header = columnsToUse.map((col) => escapeCSVValue(col.label)).join(",");

  // Create CSV rows
  const rows = projects.map((project) => {
    return columnsToUse
      .map((col) => {
        let value = getNestedValue(project, col.key);

        // Format dates
        if (col.key.includes("_at") && value) {
          value = new Date(String(value)).toLocaleString();
        }

        // Handle nested values
        if (col.key.includes(".")) {
          value = getNestedValue(project, col.key);
        }

        // Handle null/undefined
        if (value == null) {
          value = "";
        }

        return escapeCSVValue(String(value));
      })
      .join(",");
  });

  return [header, ...rows].join("\n");
};

/**
 * Escape CSV value
 * @param {string} value - Value to escape
 * @returns {string} Escaped value
 */
const escapeCSVValue = (value: unknown): string => {
  if (value == null) return "";

  const stringValue = String(value);

  // If value contains comma, newline, or quotes, wrap in quotes and escape quotes
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
};

/**
 * Download CSV file
 * @param {string} csvContent - CSV content
 * @param {string} filename - Filename
 */
export const downloadCSV = (csvContent: string, filename = "projects.csv"): void => {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Export projects to Excel format (requires xlsx library)
 * @param {Array} projects - Array of projects to export
 * @param {Array} columns - Column configuration
 * @param {string} filename - Filename
 */
export const exportToExcel = async (
  projects: ProjectExportRecord[],
  columns: ExportColumn[] = [],
  filename = "projects.xlsx"
): Promise<void> => {
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error("No projects to export");
  }

  try {
    // Dynamically import xlsx to avoid bundling if not used
    const XLSX = (await import("xlsx")) as typeof import("xlsx");

    const columnsToUse = columns.length > 0 ? columns : DEFAULT_COLUMNS;

    // Transform data for Excel
    const data = projects.map((project) => {
      const row: Record<string, unknown> = {};
      columnsToUse.forEach((col) => {
        let value = getNestedValue(project, col.key);

        // Format dates
        if (col.key.includes("_at") && value) {
          value = new Date(String(value)).toLocaleString();
        }

        // Handle nested values
        if (col.key.includes(".")) {
          value = getNestedValue(project, col.key);
        }

        row[col.label] = value ?? "";
      });
      return row;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = columnsToUse.map((col) => {
      const maxLength = Math.max(
        col.label.length,
        ...data.map((row) => String(row[col.label] || "").length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet["!cols"] = colWidths;

    // Write file
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    logger.error("Failed to export to Excel:", error);
    throw new Error("Excel export failed. Please try CSV export instead.");
  }
};

/**
 * Export selected projects
 * @param {Array} projects - All projects
 * @param {Array} selectedIds - Selected project identifiers
 * @param {string} format - Export format ('csv' or 'excel')
 * @param {Array} columns - Column configuration
 */
export const exportSelectedProjects = async (
  projects: ProjectExportRecord[],
  selectedIds: Array<string | number>,
  format: "csv" | "excel" = "csv",
  columns: ExportColumn[] = []
): Promise<void> => {
  const selectedProjects = projects.filter((project) => {
    const identifier = project.identifier;
    if (identifier === undefined || identifier === null) {
      return false;
    }
    return selectedIds.includes(identifier);
  });

  if (selectedProjects.length === 0) {
    throw new Error("No projects selected for export");
  }

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `projects_${timestamp}`;

  if (format === "excel") {
    await exportToExcel(selectedProjects, columns, `${filename}.xlsx`);
  } else {
    const csvContent = exportToCSV(selectedProjects, columns);
    downloadCSV(csvContent, `${filename}.csv`);
  }
};

/**
 * Get default export columns
 * @returns {Array} Default columns for export
 */
export const getDefaultExportColumns = (): ExportColumn[] => [
  { key: "name", label: "Project Name" },
  { key: "identifier", label: "Identifier" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
  { key: "region", label: "Region" },
  { key: "availability_zone", label: "Availability Zone" },
  { key: "type", label: "Type" },
  { key: "resources_count.instances", label: "Instances" },
  { key: "resources_count.volumes", label: "Volumes" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
];

/**
 * Prepare projects data for export with custom formatting
 * @param {Array} projects - Projects to prepare
 * @returns {Array} Formatted projects
 */
export const prepareProjectsForExport = (
  projects: ProjectExportRecord[]
): ProjectExportRecord[] => {
  return projects.map((project) => ({
    ...project,
    status: (project.status || "").toUpperCase(),
    region: (project.region || "").toUpperCase(),
    availability_zone: (project.availability_zone || "").toUpperCase(),
    created_at: project.created_at ? new Date(project.created_at).toLocaleString() : "",
    updated_at: project.updated_at ? new Date(project.updated_at).toLocaleString() : "",
    instances_count: project.resources_count?.instances || 0,
    volumes_count: project.resources_count?.volumes || 0,
  }));
};
