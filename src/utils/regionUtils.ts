/**
 * Region Display Utilities
 *
 * Utility functions to handle region display formatting across the application.
 * Region/AZ names from the API no longer contain provider prefixes (e.g. "Lagos AZ1"
 * instead of "Zadara Lagos AZ1"), so formatting is now a lightweight pass-through
 * with a safety-net strip for any legacy data that still carries a provider name.
 */

import useAuthStore from "@/stores/authStore";

export interface RegionLike {
  name?: string;
  code?: string;
  [key: string]: unknown;
}

export interface RegionDisplay extends RegionLike {
  displayName: string;
  originalName: string;
}

/**
 * Determines if the current user is an admin based on store state
 * @returns {boolean} True if user is admin, false otherwise
 */
export const isAdminUser = (): boolean => {
  const { isAuthenticated, role } = useAuthStore.getState();
  return isAuthenticated && role === "admin";
};

/**
 * Formats a region or AZ name for display.
 *
 * With the new naming convention, names no longer contain provider prefixes
 * (e.g. "Lagos AZ1", "Nigeria"). A lightweight safety-net regex still strips
 * any legacy provider names that might slip through from older data.
 *
 * @param {string} regionName - The region or AZ name (e.g., "Lagos AZ1", "Nigeria")
 * @param {boolean} isAdmin - Whether the current user is an admin (optional, will auto-detect)
 * @returns {string} Formatted region name
 */
export const formatRegionName = (regionName: string, isAdmin: boolean | null = null): string => {
  if (!regionName) return "";

  // Auto-detect admin status if not provided
  const userIsAdmin = isAdmin !== null ? isAdmin : isAdminUser();

  // Admins see the full name as-is
  if (userIsAdmin) {
    return regionName;
  }

  // Safety-net: strip any legacy provider names that may still exist in older data
  const displayName = regionName.replace(/\b(zadara|nobus)\s*/gi, "").trim();

  return displayName || regionName;
};

/**
 * Processes an array of region objects for display
 * @param {Array} regions - Array of region objects with 'name' property
 * @param {boolean} isAdmin - Whether the current user is an admin (optional, will auto-detect)
 * @returns {Array} Array of regions with formatted display names
 */
export const formatRegionsForDisplay = (
  regions: RegionLike[],
  isAdmin: boolean | null = null
): RegionDisplay[] => {
  if (!Array.isArray(regions)) return [];

  const userIsAdmin = isAdmin !== null ? isAdmin : isAdminUser();

  return regions.map((region) => ({
    ...region,
    displayName: formatRegionName(region.name ?? "", userIsAdmin),
    // Keep original name for backend communication
    originalName: region.name ?? "",
  }));
};

/**
 * Gets a formatted region name by code from a regions array
 * @param {Array} regions - Array of region objects
 * @param {string} regionCode - The region code to find
 * @param {boolean} isAdmin - Whether the current user is an admin (optional)
 * @returns {string} Formatted region name or the code if not found
 */
export const getFormattedRegionNameByCode = (
  regions: RegionLike[],
  regionCode: string,
  isAdmin: boolean | null = null
): string => {
  if (!Array.isArray(regions) || !regionCode) return regionCode;

  const region = regions.find((r) => r.code === regionCode);
  if (!region) return regionCode;

  return formatRegionName(region.name ?? "", isAdmin);
};

/**
 * React hook to get formatted regions list
 * @param {Array} regions - Raw regions array
 * @returns {Array} Formatted regions array
 */
export const useFormattedRegions = (regions: RegionLike[]): RegionDisplay[] => {
  const userIsAdmin = isAdminUser();
  return formatRegionsForDisplay(regions, userIsAdmin);
};
