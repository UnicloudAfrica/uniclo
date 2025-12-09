/**
 * Region Helper Utilities
 */

import type { Region, RegionStatus, RegionStats } from "../types/region.types";

export const getRegionStatusVariant = (status: RegionStatus) => {
  switch (status) {
    case "active":
      return {
        label: "Active",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
      };
    case "maintenance":
      return {
        label: "Maintenance",
        bg: "bg-amber-50",
        text: "text-amber-700",
        dot: "bg-amber-500",
      };
    case "disabled":
      return { label: "Disabled", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };
    default:
      return { label: "Unknown", bg: "bg-gray-50", text: "text-gray-500", dot: "bg-gray-300" };
  }
};

export const getRegionFlag = (country: string): string => {
  const flags: Record<string, string> = {
    US: "🇺🇸",
    UK: "🇬🇧",
    DE: "🇩🇪",
    FR: "🇫🇷",
    JP: "🇯🇵",
    SG: "🇸🇬",
    AU: "🇦🇺",
    CA: "🇨🇦",
    IN: "🇮🇳",
    BR: "🇧🇷",
  };
  return flags[country.toUpperCase()] || "🌍";
};

export const calculateRegionStats = (regions: Region[]): RegionStats => {
  return regions.reduce(
    (stats, region) => {
      stats.total++;
      if (region.status === "active") stats.active++;
      if (region.status === "maintenance") stats.maintenance++;
      if (region.status === "disabled") stats.disabled++;
      stats.total_instances += region.instance_count || 0;
      stats.total_projects += region.project_count || 0;
      return stats;
    },
    { total: 0, active: 0, maintenance: 0, disabled: 0, total_instances: 0, total_projects: 0 }
  );
};

export const groupRegionsByProvider = (regions: Region[]) => {
  return regions.reduce(
    (acc, region) => {
      if (!acc[region.provider]) acc[region.provider] = [];
      acc[region.provider].push(region);
      return acc;
    },
    {} as Record<string, Region[]>
  );
};

export const sortRegionsByPriority = (regions: Region[]): Region[] => {
  return [...regions].sort((a, b) => {
    // Default region first
    if (a.is_default && !b.is_default) return -1;
    if (!a.is_default && b.is_default) return 1;

    // Then by priority
    const priorityA = a.priority || 999;
    const priorityB = b.priority || 999;
    if (priorityA !== priorityB) return priorityA - priorityB;

    // Then alphabetically
    return a.display_name.localeCompare(b.display_name);
  });
};

export const filterRegionsBySearch = (regions: Region[], query: string): Region[] => {
  if (!query.trim()) return regions;
  const q = query.toLowerCase();
  return regions.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.display_name.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q)
  );
};

export const getAvailableRegions = (regions: Region[]): Region[] => {
  return regions.filter((r) => r.status === "active");
};
