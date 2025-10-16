/**
 * Admin Region Approval API Service
 * 
 * Handles admin approval, rejection, suspension of tenant-owned regions
 */

import config from '../config';
import useAdminAuthStore from '../stores/adminAuthStore';
import ToastUtils from '../utils/toastUtil';

class AdminRegionApiService {
  getAuthHeaders() {
    const { token } = useAdminAuthStore.getState();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Fetch all tenant region requests
   */
  async fetchRegionApprovals(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${config.baseURL}/admin/v1/region-approvals${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || []
        };
      } else {
        throw new Error(data.message || 'Failed to fetch region approvals');
      }
    } catch (error) {
      console.error('Error fetching region approvals:', error);
      throw error;
    }
  }

  /**
   * Get region details
   */
  async fetchRegionApprovalById(id) {
    try {
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to fetch region');
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
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'approve',
          ...approvalData
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region approved successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to approve region');
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
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'reject',
          reason
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region rejected');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to reject region');
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
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'suspend',
          reason
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region suspended');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to suspend region');
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
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'reactivate'
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region reactivated');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to reactivate region');
      }
    } catch (error) {
      console.error(`Error reactivating region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Update platform fee
   */
  async updatePlatformFee(id, platformFeePercentage) {
    try {
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          action: 'update_fee',
          platform_fee_percentage: platformFeePercentage
        }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Platform fee updated');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to update platform fee');
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
      const response = await fetch(`${config.baseURL}/admin/v1/region-approvals/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region deleted');
        return {
          success: true
        };
      } else {
        throw new Error(data.message || 'Failed to delete region');
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
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(regionData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Platform region created successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to create platform region');
      }
    } catch (error) {
      console.error('Error creating platform region:', error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Verify MSP admin credentials for platform-owned regions
   * Admin can only verify credentials for regions they create (platform-owned)
   */
  async verifyCredentials(regionCode, credentials) {
    try {
      const response = await fetch(`${config.adminURL}/regions/${regionCode}/verify-credentials`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Credentials verified successfully');
        return {
          success: true,
          verified: data.verified || true,
          credentials_updated_at: data.credentials_updated_at
        };
      } else {
        throw new Error(data.message || 'Failed to verify credentials');
      }
    } catch (error) {
      console.error(`Error verifying credentials for region ${regionCode}:`, error);
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
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to fetch region');
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
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(regionData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region updated successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to update region');
      }
    } catch (error) {
      console.error(`Error updating region ${code}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }
}

export default new AdminRegionApiService();
