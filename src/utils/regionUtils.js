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

/**
 * Determines if the current user is an admin based on store state
 * @returns {boolean} True if user is admin, false otherwise
 */
export const isAdminUser = () => {
  const { isAuthenticated, role } = useAdminAuthStore.getState();
  return isAuthenticated && role === "admin";
};

/**
 * Formats a region name for display based on user role
 * @param {string} regionName - The original region name (e.g., "Zadara Lagos 1")
 * @param {boolean} isAdmin - Whether the current user is an admin (optional, will auto-detect)
 * @returns {string} Formatted region name
 */
export const formatRegionName = (regionName, isAdmin = null) => {
  if (!regionName) return "";

  // Auto-detect admin status if not provided
  const userIsAdmin = isAdmin !== null ? isAdmin : isAdminUser();

  // If user is admin, show full region name
  if (userIsAdmin) {
    return regionName;
  }

  // For non-admin users, remove only "Zadara" provider name but keep core region identifiers
  let displayName = regionName;

  // Remove "Zadara" (case insensitive) but preserve the rest
  // This keeps region identifiers like "Lagos 1", "Lagos 2", etc.
  displayName = displayName
    .replace(/zadara\s+/gi, "") // Remove "Zadara " but keep everything else
    .trim();

  // If the result is empty or too short, fallback to original name without Zadara
  if (displayName.length < 2) {
    displayName = regionName.replace(/zadara\s+/gi, "").trim();
  }

  return displayName || regionName; // Fallback to original if processing fails
};

/**
 * Processes an array of region objects for display
 * @param {Array} regions - Array of region objects with 'name' property
 * @param {boolean} isAdmin - Whether the current user is an admin (optional, will auto-detect)
 * @returns {Array} Array of regions with formatted display names
 */
export const formatRegionsForDisplay = (regions, isAdmin = null) => {
  if (!Array.isArray(regions)) return [];

  const userIsAdmin = isAdmin !== null ? isAdmin : isAdminUser();

  return regions.map((region) => ({
    ...region,
    displayName: formatRegionName(region.name, userIsAdmin),
    // Keep original name for backend communication
    originalName: region.name,
  }));
};

/**
 * Gets a formatted region name by code from a regions array
 * @param {Array} regions - Array of region objects
 * @param {string} regionCode - The region code to find
 * @param {boolean} isAdmin - Whether the current user is an admin (optional)
 * @returns {string} Formatted region name or the code if not found
 */
export const getFormattedRegionNameByCode = (regions, regionCode, isAdmin = null) => {
  if (!Array.isArray(regions) || !regionCode) return regionCode;

  const region = regions.find((r) => r.code === regionCode);
  if (!region) return regionCode;

  return formatRegionName(region.name, isAdmin);
};

/**
 * React hook to get formatted regions list
 * @param {Array} regions - Raw regions array
 * @returns {Array} Formatted regions array
 */
export const useFormattedRegions = (regions) => {
  const userIsAdmin = isAdminUser();
  return formatRegionsForDisplay(regions, userIsAdmin);
};
