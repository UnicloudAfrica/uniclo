/**
 * Admin Region Approval API Service
 *
 * Handles admin approval, rejection, suspension of tenant-owned regions
 */

import config from "../config";
import useAdminAuthStore from "../stores/adminAuthStore";
import ToastUtils from "../utils/toastUtil.ts";

class AdminRegionApiService {
  getAuthHeaders() {
    const { token } = useAdminAuthStore.getState();
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Fetch all tenant region requests
   */
  async fetchRegionApprovals(params = {}) {
    try {
      const query = new URLSearchParams();
      query.set("ownership_type", "tenant_owned");

      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          query.delete(key);
        } else {
          query.set(key, value);
        }
      });

      const queryString = query.toString();
      const url = `${config.adminURL}/region-approvals${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error("Error fetching region approvals:", error);
      throw error;
    }
  }

  /**
   * Get region details
   */
  async fetchRegionApprovalById(id) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error fetching region ${id}:`, error);
      throw error;
    }
  }

  /**
   * Approve a region
   */
  async approveRegion(id, approvalData = {}) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error approving region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Reject a region
   */
  async rejectRegion(id, reason) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error rejecting region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Suspend a region
   */
  async suspendRegion(id, reason) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error suspending region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Reactivate a suspended region
   */
  async reactivateRegion(id) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error reactivating region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  async updateFastTrackSettings(id, payload) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: "update_fast_track",
          ...payload,
        }),
      });
      const data = await response.json();
      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Fast-track settings updated");
        return { success: true, data: data.data };
      }
      throw new Error(data.message || "Failed to update fast-track settings");
    } catch (error) {
      console.error(`Error updating fast-track ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  async grantFastTrack(id, tenantId, notes = "") {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}/fast-track-grants`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ tenant_id: tenantId, notes }),
      });
      const data = await response.json();
      if (data.success || response.ok) {
        ToastUtils.success("Fast-track access granted.");
        return { success: true, data: data.data };
      }
      throw new Error(data.message || "Failed to grant fast-track");
    } catch (error) {
      console.error(`Error granting fast track ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  async revokeFastTrack(id, tenantId) {
    try {
      const response = await fetch(
        `${config.adminURL}/region-approvals/${id}/fast-track-grants/${tenantId}`,
        {
          method: "DELETE",
          headers: this.getAuthHeaders(),
        }
      );
      const data = await response.json();
      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Fast-track access revoked.");
        return { success: true };
      }
      throw new Error(data.message || "Failed to revoke fast-track");
    } catch (error) {
      console.error(`Error revoking fast track ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Update platform fee
   */
  async updatePlatformFee(id, platformFeePercentage) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "PATCH",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error updating platform fee for region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Delete a region
   */
  async deleteRegion(id) {
    try {
      const response = await fetch(`${config.adminURL}/region-approvals/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Region deleted");
        return {
          success: true,
        };
      } else {
        throw new Error(data.message || "Failed to delete region");
      }
    } catch (error) {
      console.error(`Error deleting region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Create a new platform-owned region (auto-approved)
   */
  async createPlatformRegion(regionData) {
    try {
      const response = await fetch(`${config.adminURL}/regions`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(regionData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || "Platform region created successfully");
        const regionCode = data?.data?.code || regionData.code;
        // If object storage payload included, verify right away using new endpoint
        if (regionData.object_storage?.enabled && regionCode) {
          try {
            await this.verifyObjectStorage(regionCode, {
              object_storage: {
                base_url: regionData.object_storage.base_url,
                access_key: regionData.object_storage.access_key,
                account: regionData.object_storage.account,
                default_quota_gb: regionData.object_storage.default_quota_gb,
                notification_email: regionData.object_storage.notification_email,
              },
            });
          } catch (error) {
            console.error("Object storage verification after region creation failed:", error);
          }
        }

        return {
          success: true,
          data: data.data,
        };
      } else {
        throw new Error(data.message || "Failed to create platform region");
      }
    } catch (error) {
      console.error("Error creating platform region:", error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Verify MSP admin credentials for platform-owned regions
   * Admin can only verify credentials for regions they create (platform-owned)
   */
  async verifyCredentials(identifier, credentials, options = {}) {
    const scope = options.scope || "region";
    const path =
      scope === "approval"
        ? `region-approvals/${identifier}/verify-credentials`
        : `regions/${identifier}/verify-credentials`;

    try {
      const response = await fetch(`${config.adminURL}/${path}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          message: data.message || "Credentials verified successfully",
          verified: data.verified ?? true,
          credentials_updated_at: data.credentials_updated_at,
        };
      } else {
        throw new Error(data.message || "Failed to verify credentials");
      }
    } catch (error) {
      console.error(`Error verifying credentials for region ${identifier}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Region Management APIs (uses region code)
   */

  /**
   * Get region by code
   */
  async fetchRegionByCode(code) {
    try {
      const response = await fetch(`${config.adminURL}/regions/${code}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error fetching region ${code}:`, error);
      throw error;
    }
  }

  /**
   * Update region by code
   */
  async updateRegion(code, regionData) {
    try {
      const response = await fetch(`${config.adminURL}/regions/${code}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
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
    } catch (error) {
      console.error(`Error updating region ${code}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  async verifyObjectStorage(regionCode, payload = null) {
    try {
      const response = await fetch(
        `${config.adminURL}/regions/${regionCode}/verify-object-storage`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: payload ? JSON.stringify(payload) : JSON.stringify({}),
        }
      );

      const data = await response.json();

      if (data.success || response.ok) {
        return {
          success: true,
          message: data.message || "Object storage verified successfully",
        };
      }

      throw new Error(data.message || "Failed to verify object storage");
    } catch (error) {
      console.error(`Error verifying object storage for region ${regionCode}:`, error);
      ToastUtils.error(error.message || "Failed to verify object storage");
      throw error;
    }
  }
}

export default new AdminRegionApiService();
