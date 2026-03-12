/**
 * Region Display Utilities
 *
 * Utility functions to handle region display formatting across the application.
 * These functions ensure consistent region name display by hiding provider-specific
 * information (like "Zadara") from non-admin users while preserving it for admins.
 */

/**
 * Determines if the current user is an admin based on session state
 * @returns {boolean} True if user is admin, false otherwise
 */
import useAdminAuthStore from "../stores/adminAuthStore";

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
  const { isAuthenticated, role } = useAdminAuthStore.getState();
  return isAuthenticated && role === "admin";
};

/**
 * Formats a region name for display based on user role
 * @param {string} regionName - The original region name (e.g., "Zadara Lagos 1")
 * @param {boolean} isAdmin - Whether the current user is an admin (optional, will auto-detect)
 * @returns {string} Formatted region name
 */
export const formatRegionName = (regionName: string, isAdmin: boolean | null = null): string => {
  if (!regionName) return "";

  // Auto-detect admin status if not provided
  const userIsAdmin = isAdmin !== null ? isAdmin : isAdminUser();

  // If user is admin, show full region name
  if (userIsAdmin) {
    return regionName;
  }

  // For non-admin users, remove provider name prefix but keep core region identifiers
  // This strips "Zadara", "Nobus", or any future provider name from the display
  let displayName = regionName;

  // Remove known provider names (case insensitive) but preserve the rest
  // This keeps region identifiers like "Lagos 1", "West Africa AZ1", etc.
  displayName = displayName.replace(/\b(zadara|nobus)\s+/gi, "").trim();

  // If the result is empty or too short, try again without word boundary
  if (displayName.length < 2) {
    displayName = regionName.replace(/\b(zadara|nobus)\s*/gi, "").trim();
  }

  return displayName || regionName; // Fallback to original if processing fails
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
