/**
 * Tenant Region Management API Service
 *
 * Handles tenant-owned region requests, MSP credential verification,
 * and revenue share tracking for tenant marketplace functionality.
 */

import config from "../config";
import useAuthStore from "@/stores/authStore";
import ToastUtils from "../utils/toastUtil";
import logger from "../utils/logger";

type Id = string | number;
type QueryParams = Record<string, string | number | boolean | null | undefined>;
type RegionRequestPayload = Record<string, unknown>;
type CredentialsPayload = {
  username: string;
  password: string;
  domain: string;
  domain_id?: string;
};
type FulfillmentMode = "manual" | "automated" | string;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
};

const toQueryString = (params: QueryParams): string => {
  const entries = Object.entries(params).filter(([, value]) => {
    if (value === undefined || value === null || value === "") return false;
    return true;
  });
  if (entries.length === 0) return "";
  return new URLSearchParams(entries.map(([key, value]) => [key, String(value)])).toString();
};

class TenantRegionApiService {
  /**
   * Get the authorization headers
   */
  getAuthHeaders() {
    const adminState = useAuthStore.getState();
    const tenantState = useAuthStore.getState();
    if (adminState?.getAuthHeaders) {
      return adminState.getAuthHeaders();
    }
    if (tenantState?.getAuthHeaders) {
      return tenantState.getAuthHeaders();
    }
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Fetch all region requests for tenant
   */
  async fetchRegionRequests() {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || [],
        };
      } else {
        throw new Error(data.message || "Failed to fetch region requests");
      }
    } catch (error) {
      logger.error("Error fetching region requests:", error);
      throw error;
    }
  }

  /**
   * Submit a new region request
   */
  async createRegionRequest(regionData: RegionRequestPayload) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(regionData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Region request submitted successfully");
        return {
          success: true,
          data: data.data,
        };
      } else {
        throw new Error(data.message || "Failed to submit region request");
      }
    } catch (error) {
      logger.error("Error creating region request:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to submit region request"));
      throw error;
    }
  }

  /**
   * Get region request details
   */
  async fetchRegionRequestById(id: Id) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data,
        };
      } else {
        throw new Error(data.message || "Failed to fetch region request");
      }
    } catch (error) {
      logger.error(`Error fetching region request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update region fulfillment mode
   */
  async updateFulfillmentMode(id: Id, mode: FulfillmentMode) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ fulfillment_mode: mode }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Fulfillment mode updated successfully");
        return {
          success: true,
          data: data.data,
        };
      } else {
        throw new Error(data.message || "Failed to update fulfillment mode");
      }
    } catch (error) {
      logger.error(`Error updating fulfillment mode for region ${id}:`, error);
      ToastUtils.error(getErrorMessage(error, "Failed to update fulfillment mode"));
      throw error;
    }
  }

  /**
   * Cancel/delete a pending region request
   */
  async cancelRegionRequest(id: Id) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Region request cancelled successfully");
        return {
          success: true,
          message: data.message,
        };
      } else {
        throw new Error(data.message || "Failed to cancel region request");
      }
    } catch (error) {
      logger.error(`Error cancelling region request ${id}:`, error);
      ToastUtils.error(getErrorMessage(error, "Failed to cancel region request"));
      throw error;
    }
  }

  /**
   * Verify MSP admin credentials
   */
  async verifyCredentials(regionId: Id, credentials: CredentialsPayload) {
    try {
      const response = await fetch(
        `${config.tenantURL}/admin/region-requests/${regionId}/verify-credentials`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Credentials verified successfully");
        return {
          success: true,
          verified: data.verified || true,
        };
      } else {
        throw new Error(data.message || "Failed to verify credentials");
      }
    } catch (error) {
      logger.error(`Error verifying credentials for region ${regionId}:`, error);
      ToastUtils.error(getErrorMessage(error, "Failed to verify credentials"));
      throw error;
    }
  }

  /**
   * Fetch revenue shares
   */
  async fetchRevenueShares(params: QueryParams = {}) {
    try {
      const queryString = toQueryString(params);
      const url = `${config.tenantURL}/admin/revenue-shares${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || [],
          stats: data.stats || {},
          pagination: data.pagination || {},
        };
      } else {
        throw new Error(data.message || "Failed to fetch revenue shares");
      }
    } catch (error) {
      logger.error("Error fetching revenue shares:", error);
      throw error;
    }
  }

  /**
   * Get revenue statistics
   */
  async fetchRevenueStats(params: QueryParams = {}) {
    try {
      const queryString = toQueryString(params);
      const url = `${config.tenantURL}/admin/revenue-shares-stats${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || {},
        };
      } else {
        throw new Error(data.message || "Failed to fetch revenue statistics");
      }
    } catch (error) {
      logger.error("Error fetching revenue stats:", error);
      throw error;
    }
  }

  /**
   * Export revenue shares as CSV
   */
  async exportRevenueShares(params: QueryParams = {}) {
    try {
      const queryString = toQueryString(params);
      const url = `${config.tenantURL}/admin/revenue-shares-export${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          ...this.getAuthHeaders(),
          Accept: "text/csv",
        },
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = globalThis.window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `revenue-shares-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.window.URL.revokeObjectURL(downloadUrl);

        ToastUtils.success("Revenue shares exported successfully");
        return { success: true };
      } else {
        throw new Error("Failed to export revenue shares");
      }
    } catch (error) {
      logger.error("Error exporting revenue shares:", error);
      ToastUtils.error(getErrorMessage(error, "Failed to export revenue shares"));
      throw error;
    }
  }
}

export default new TenantRegionApiService();
