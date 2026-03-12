/**
 * Admin Region API - Approval Endpoints
 *
 * Handles fetching, approving, rejecting, suspending, reactivating tenant-owned
 * region requests, plus fast-track and platform-fee management.
 */

import config from "../../config";
import ToastUtils from "../../utils/toastUtil";
import logger from "../../utils/logger";
import { getAuthHeaders } from "./helpers";
import type { ApiResponse, RegionApproval } from "./types";

/**
 * Fetch all tenant region requests
 */
export async function fetchRegionApprovals(
  params: Record<string, string | number | undefined> = {}
): Promise<ApiResponse<RegionApproval[]>> {
  try {
    const query = new URLSearchParams();
    query.set("ownership_type", "tenant_owned");

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        query.delete(key);
      } else {
        query.set(key, String(value));
      }
    });

    const queryString = query.toString();
    const url = `${config.adminURL}/region-approvals${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        data: data.data || [],
      };
    } else {
      throw new Error(data.message || "Failed to fetch region approvals");
    }
  } catch (error: unknown) {
    logger.error("Error fetching region approvals:", error);
    throw error;
  }
}

/**
 * Get region details by approval ID
 */
export async function fetchRegionApprovalById(
  id: string | number
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success) {
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to fetch region");
    }
  } catch (error: unknown) {
    logger.error(`Error fetching region ${id}:`, error);
    throw error;
  }
}

/**
 * Approve a region
 */
export async function approveRegion(
  id: string | number,
  approvalData: Record<string, unknown> = {}
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "approve",
        ...approvalData,
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region approved successfully");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to approve region");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error approving region ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Reject a region
 */
export async function rejectRegion(
  id: string | number,
  reason: string
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "reject",
        reason,
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region rejected");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to reject region");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error rejecting region ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Suspend a region
 */
export async function suspendRegion(
  id: string | number,
  reason: string
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "suspend",
        reason,
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region suspended");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to suspend region");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error suspending region ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Reactivate a suspended region
 */
export async function reactivateRegion(id: string | number): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "reactivate",
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region reactivated");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to reactivate region");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error reactivating region ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Update fast-track settings for a region approval
 */
export async function updateFastTrackSettings(
  id: string | number,
  payload: Record<string, unknown>
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "update_fast_track",
        ...payload,
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Fast-track settings updated");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to update fast-track settings");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error updating fast-track ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Grant fast-track access to a tenant for a region
 */
export async function grantFastTrack(
  id: string | number,
  tenantId: string | number,
  notes: string = ""
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}/fast-track-grants`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        tenant_id: tenantId,
        notes,
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success("Fast-track access granted");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to grant fast-track");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error granting fast track ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Revoke fast-track access for a tenant
 */
export async function revokeFastTrack(
  id: string | number,
  tenantId: string | number
): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(
      `${config.adminURL}/region-approvals/${id}/fast-track-grants/${tenantId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Fast-track access revoked");
      return {
        success: true,
        data: null,
      };
    } else {
      throw new Error(data.message || "Failed to revoke fast-track");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error revoking fast track ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Update platform fee for a region
 */
export async function updatePlatformFee(
  id: string | number,
  platformFeePercentage: number
): Promise<ApiResponse<RegionApproval>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        action: "update_fee",
        platform_fee_percentage: platformFeePercentage,
      }),
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Platform fee updated");
      return {
        success: true,
        data: data.data,
      };
    } else {
      throw new Error(data.message || "Failed to update platform fee");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error updating platform fee for region ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}

/**
 * Delete a region approval
 */
export async function deleteRegion(id: string | number): Promise<ApiResponse<null>> {
  try {
    const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    const data = await response.json();

    if (data.success || response.ok) {
      ToastUtils.success(data.message || "Region deleted");
      return {
        success: true,
        data: null,
      };
    } else {
      throw new Error(data.message || "Failed to delete region");
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Error deleting region ${id}:`, error);
    ToastUtils.error(message);
    throw error;
  }
}
