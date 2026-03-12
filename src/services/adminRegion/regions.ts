/**
 * Admin Region API - Region Management Endpoints
 *
 * Handles creating, fetching, updating platform-owned regions, plus
 * object-storage verification, visibility updates, and verify/unverify.
 */

import config from "../../config";
import ToastUtils from "../../utils/toastUtil";
import logger from "../../utils/logger";
import { getAuthHeaders } from "./helpers";
import { verifyObjectStorage } from "./credentials";
import type {
  ApiResponse,
  ObjectStorageConfig,
  RegionApproval,
  RegionCreatePayload,
  RegionUpdatePayload,
} from "./types";

/**
 * Create a new platform-owned region (auto-approved)
 */
export async function createPlatformRegion(
  regionData: RegionCreatePayload
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/regions`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(regionData),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Platform region created successfully");
      const regionCode = data?.data?.code || regionData.code;
      // If Silo Storage payload included, verify right away using new endpoint
      const objectStorage = (
        regionData as RegionCreatePayload & { object_storage?: ObjectStorageConfig }
      )["object_storage"];
      if (objectStorage?.enabled && regionCode) {
        try {
          await verifyObjectStorage(regionCode, {
            object_storage: {
              base_url: objectStorage.base_url,
              access_key: objectStorage.access_key,
              account: objectStorage.account,
              default_quota_gb: objectStorage.default_quota_gb,
              notification_email: objectStorage.notification_email,
            },
          });
        } catch (error: unknown) {
          logger.error("Object storage verification after region creation failed:", error);
        }
      }

      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to create platform region");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error("Error creating platform region:", error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Get region by code
 */
export async function fetchRegionByCode(code: string): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${code}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch region`);
    }

    const data = await response.json();

    // Handle both response formats: { data: {...} } and { success: true, data: {...} }
    if (data.data) {
      return {
        success: true,
        data: data.data,
      };
    } else if (data.success !== false) {
      // If no nested data but success is not explicitly false, return data as is
      return {
        success: true,
        data: data,
      };
    } else {
      throw new Error(data.message || "Failed to fetch region");
    }
  } catch (error: unknown) {
    logger.error(`Error fetching region ${code}:`, error);
    throw error;
  }
}

/**
 * Update region by code
 */
export async function updateRegion(
  code: string,
  regionData: RegionUpdatePayload
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${code}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(regionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to update region`);
    }

    const data = await response.json();

    ToastUtils.success(data.message || "Region updated successfully");
    return {
      success: true,
      data: data.data || data,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error updating region ${code}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Update region visibility (public/private)
 */
export async function updateVisibility(
  regionCode: string,
  visibility: "public" | "private"
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${regionCode}/visibility`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ visibility }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || `Region is now ${visibility}`);
      return {
        success: true,
        data: data.data,
      };
    }

    throw new Error(data.message || "Failed to update visibility");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error updating visibility for region ${regionCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Verify/Approve a region
 */
export async function verifyRegion(regionCode: string): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${regionCode}/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region verified successfully");
      return {
        success: true,
        data: data.data,
      };
    }
    throw new Error(data.message || "Failed to verify region");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error verifying region ${regionCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Unverify a region
 */
export async function unverifyRegion(regionCode: string): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/regions/${regionCode}/unverify`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region verification removed");
      return {
        success: true,
        data: data.data,
      };
    }

    throw new Error(data.message || "Failed to unverify region");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error unverifying region ${regionCode}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}
