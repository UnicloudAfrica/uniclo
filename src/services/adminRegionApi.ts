/**
 * Admin Region Approval API Service
 *
 * Handles admin approval, rejection, suspension of tenant-owned regions
 */

import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import ToastUtils from "../utils/toastUtil";
import logger from "../utils/logger";

// --- Interfaces ---

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  verified?: boolean;
  credentials_updated_at?: string;
}

export interface RegionApproval {
  id: string | number;
  code: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  ownership_type: "tenant_owned" | "platform_owned";
  tenant_id?: string | number;
  tenant_name?: string;
  reason?: string;
  platform_fee_percentage?: number;
  fast_track_granted?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ProviderService {
  type: string;
  name: string;
  description?: string;
  fields: Array<{
    name: string;
    label: string;
    type: string;
    required: boolean;
    description?: string;
  }>;
}

export interface CredentialStatus {
  service_type: string;
  status: "valid" | "invalid" | "expired" | "not_provided";
  last_verified_at?: string;
  error?: string;
}

export interface ObjectStorageConfig {
  enabled: boolean;
  base_url: string;
  access_key: string;
  account: string;
  default_quota_gb: number;
  notification_email: string;
}

export interface FastTrackGrant {
  tenant_id: string | number;
  notes?: string;
}

export interface RegionCreatePayload {
  name: string;
  code: string;
  country_code: string | null;
  city: string | null;
  provider: string;
  is_active: boolean;
  ownership_type: string;
  visibility: string;
  fast_track_mode: string;
}

export interface RegionUpdatePayload {
  name?: string;
  is_active?: boolean;
  visibility?: "public" | "private";
  fast_track_mode?: string;
  [key: string]: unknown;
}

class AdminRegionApiService {
  getAuthHeaders() {
    const adminState = useAdminAuthStore.getState();
    if (adminState?.getAuthHeaders) {
      return adminState.getAuthHeaders();
    }
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Fetch all tenant region requests
   */
  async fetchRegionApprovals(
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
        throw new Error(data.message || "Failed to fetch region approvals");
      }
    } catch (error: unknown) {
      logger.error("Error fetching region approvals:", error);
      throw error;
    }
  }

  /**
   * Get region details
   */
  async fetchRegionApprovalById(id: string | number): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
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
  async approveRegion(
    id: string | number,
    approvalData: Record<string, unknown> = {}
  ): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
  async rejectRegion(id: string | number, reason: string): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
  async suspendRegion(id: string | number, reason: string): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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

  async reactivateRegion(id: string | number): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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

  async updateFastTrackSettings(
    id: string | number,
    payload: Record<string, unknown>
  ): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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

  async grantFastTrack(
    id: string | number,
    tenantId: string | number,
    notes: string = ""
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}/fast-track-grants`, {
        method: "POST",
        headers: this.getAuthHeaders(),
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

  async revokeFastTrack(
    id: string | number,
    tenantId: string | number
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        `${config.adminURL}/region-approvals/${id}/fast-track-grants/${tenantId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
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
   * Update platform fee
   */
  async updatePlatformFee(
    id: string | number,
    platformFeePercentage: number
  ): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
   * Delete a region
   */
  async deleteRegion(id: string | number): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
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

  /**
   * Create a new platform-owned region (auto-approved)
   */
  async createPlatformRegion(
    regionData: RegionCreatePayload
  ): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/regions`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(regionData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Platform region created successfully");
        const regionCode = data?.data?.code || regionData.code;
        // If Silo Storage payload included, verify right away using new endpoint
        const objectStorage = (regionData as any)["object_storage"] as
          | ObjectStorageConfig
          | undefined;
        if (objectStorage?.enabled && regionCode) {
          try {
            await this.verifyObjectStorage(regionCode, {
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
   * Verify MSP admin credentials for platform-owned regions
   * Admin can only verify credentials for regions they create (platform-owned)
   */
  async verifyCredentials(
    identifier: string | number,
    credentials: Record<string, unknown>,
    options: { scope?: string } = {}
  ): Promise<ApiResponse<null>> {
    const scope = options.scope || "region";
    const path =
      scope === "approval"
        ? `region-approvals/${identifier}/verify-credentials`
        : `regions/${identifier}/verify-credentials`;

    try {
      const response = await fetch(`${config.adminURL}/${path}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          data: null,
          message: data.message || "Credentials verified successfully",
          verified: data.verified ?? true,
          credentials_updated_at: data.credentials_updated_at,
        };
      } else {
        throw new Error(data.message || "Failed to verify credentials");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      logger.error(`Error verifying credentials for region ${identifier}:`, error);
      ToastUtils.error(message);
      throw error;
    }
  }

  /**
   * Region Management APIs (uses region code)
   */

  /**
   * Get region by code
   */
  async fetchRegionByCode(code: string): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/regions/${code}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
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
  async updateRegion(
    code: string,
    regionData: RegionUpdatePayload
  ): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/regions/${code}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
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

  async verifyObjectStorage(
    regionCode: string,
    payload: Record<string, unknown> | null = null
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        `${config.adminURL}/regions/${regionCode}/verify-object-storage`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: payload ? JSON.stringify(payload) : JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          data: null,
          message: data.message || "Object storage verified successfully",
        };
      }

      throw new Error(data.message || "Failed to verify Silo Storage");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      logger.error(`Error verifying Silo Storage for region ${regionCode}:`, error);
      ToastUtils.error(message || "Failed to verify Silo Storage");
      throw error;
    }
  }

  // ========================================
  // SERVICE-SPECIFIC CREDENTIAL MANAGEMENT
  // ========================================

  /**
   * Get available services and their credential field definitions for a provider
   * @param {string} provider - Provider code (zadara, aws, azure, gcp)
   */
  async getProviderServices(provider: string): Promise<ApiResponse<ProviderService[]>> {
    try {
      const response = await fetch(`${config.adminURL}/providers/${provider}/services`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          data: data.data || data,
        };
      }

      throw new Error(data.message || "Failed to fetch provider services");
    } catch (error: unknown) {
      logger.error(`Error fetching services for provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get credential status for all services in a region
   * @param {string|number} regionId - Region ID or code
   */
  async getCredentialStatus(regionId: string | number): Promise<ApiResponse<CredentialStatus[]>> {
    try {
      const response = await fetch(`${config.adminURL}/regions/${regionId}/credentials`, {
        method: "GET",
        headers: this.getAuthHeaders(),
        credentials: "include",
      });

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          data: data.data || data,
        };
      }

      throw new Error(data.message || "Failed to fetch credential status");
    } catch (error: unknown) {
      logger.error(`Error fetching credential status for region ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Store credentials for a specific service type
   * @param {string|number} regionId - Region ID or code
   * @param {string} serviceType - Service type (compute, object_storage, etc.)
   * @param {object} credentials - Credential data
   * @param {boolean} skipVerification - If true, store without verifying
   */
  async storeServiceCredentials(
    regionId: string | number,
    serviceType: string,
    credentials: Record<string, string>,
    skipVerification: boolean = false
  ): Promise<ApiResponse<null>> {
    try {
      const payload: Record<string, unknown> = { ...credentials };
      if (skipVerification) {
        payload["skip_verification"] = true;
      }

      const response = await fetch(
        `${config.adminURL}/regions/${regionId}/credentials/${serviceType}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        const label = serviceType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        ToastUtils.success(data.message || `${label} credentials saved successfully`);
        return {
          success: true,
          data: data.data || null,
        };
      }

      throw new Error(data.message || `Failed to store ${serviceType} credentials`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      logger.error(`Error storing ${serviceType} credentials for region ${regionId}:`, error);
      ToastUtils.error(message);
      throw error;
    }
  }

  async verifyServiceCredentials(
    regionId: string | number,
    serviceType: string,
    credentials: Record<string, string>
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        `${config.adminURL}/regions/${regionId}/credentials/${serviceType}/verify`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          data: null,
          message: data.message || "Credentials verified successfully",
        };
      }

      throw new Error(data.message || "Verification failed");
    } catch (error: unknown) {
      logger.error(`Error verifying ${serviceType} credentials for region ${regionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete credentials for a specific service type
   * @param {string|number} regionId - Region ID or code
   * @param {string} serviceType - Service type
   */
  async deleteServiceCredentials(
    regionId: string | number,
    serviceType: string
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        `${config.adminURL}/regions/${regionId}/credentials/${serviceType}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        const label = serviceType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        ToastUtils.success(data.message || `${label} credentials deleted`);
        return {
          success: true,
          data: null,
        };
      }

      throw new Error(data.message || `Failed to delete ${serviceType} credentials`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unknown error occurred";
      logger.error(`Error deleting ${serviceType} credentials for region ${regionId}:`, error);
      ToastUtils.error(message);
      throw error;
    }
  }
  /**
   * Verify credentials for a provider service before region creation
   */
  async verifyProviderServiceCredentials(
    provider: string,
    serviceType: string,
    credentials: Record<string, string>
  ): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(
        `${config.adminURL}/providers/${provider}/services/${serviceType}/verify`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          credentials: "include",
          body: JSON.stringify(credentials),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          data: null,
          message: data.message || "Credentials verified successfully",
        };
      }

      throw new Error(data.message || "Verification failed");
    } catch (error: unknown) {
      logger.error(`Error verifying ${serviceType} credentials for provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Update region visibility (public/private)
   */
  async updateVisibility(
    regionId: string | number,
    visibility: "public" | "private"
  ): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/regions/${regionId}/visibility`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
      logger.error(`Error updating visibility for region ${regionId}:`, error);
      ToastUtils.error(message);
      throw error;
    }
  }

  /**
   * Verify/Approve a region
   */
  async verifyRegion(regionId: string | number): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/regions/${regionId}/verify`, {
        method: "POST",
        headers: this.getAuthHeaders(),
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
      logger.error(`Error verifying region ${regionId}:`, error);
      ToastUtils.error(message);
      throw error;
    }
  }

  /**
   * Unverify a region
   */
  async unverifyRegion(regionId: string | number): Promise<ApiResponse<RegionApproval>> {
    try {
      const response = await fetch(`${config.adminURL}/regions/${regionId}/unverify`, {
        method: "POST",
        headers: this.getAuthHeaders(),
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
      logger.error(`Error unverifying region ${regionId}:`, error);
      ToastUtils.error(message);
      throw error;
    }
  }
}

export default new AdminRegionApiService();
