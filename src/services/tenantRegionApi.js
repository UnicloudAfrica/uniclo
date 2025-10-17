/**
 * Tenant Region Management API Service
 * 
 * Handles tenant-owned region requests, MSP credential verification,
 * and revenue share tracking for tenant marketplace functionality.
 */

import config from '../config';
import useMultiTenantAuthStore from '../stores/multiTenantAuthStore';
import useAdminAuthStore from '../stores/adminAuthStore';
import ToastUtils from '../utils/toastUtil';

class TenantRegionApiService {
  /**
   * Get the authorization headers
   */
  getAuthHeaders() {
    const tenantToken = useMultiTenantAuthStore.getState().token;
    const adminToken = useAdminAuthStore.getState().token;
    const token = tenantToken || adminToken;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Fetch all region requests for tenant
   */
  async fetchRegionRequests() {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests`, {
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
        throw new Error(data.message || 'Failed to fetch region requests');
      }
    } catch (error) {
      console.error('Error fetching region requests:', error);
      throw error;
    }
  }

  /**
   * Submit a new region request
   */
  async createRegionRequest(regionData) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(regionData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region request submitted successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to submit region request');
      }
    } catch (error) {
      console.error('Error creating region request:', error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Get region request details
   */
  async fetchRegionRequestById(id) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${id}`, {
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
        throw new Error(data.message || 'Failed to fetch region request');
      }
    } catch (error) {
      console.error(`Error fetching region request ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update region fulfillment mode
   */
  async updateFulfillmentMode(id, mode) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${id}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ fulfillment_mode: mode }),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Fulfillment mode updated successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Failed to update fulfillment mode');
      }
    } catch (error) {
      console.error(`Error updating fulfillment mode for region ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Cancel/delete a pending region request
   */
  async cancelRegionRequest(id) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Region request cancelled successfully');
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to cancel region request');
      }
    } catch (error) {
      console.error(`Error cancelling region request ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Verify MSP admin credentials
   */
  async verifyCredentials(regionId, credentials) {
    try {
      const response = await fetch(`${config.tenantURL}/admin/region-requests/${regionId}/verify-credentials`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Credentials verified successfully');
        return {
          success: true,
          verified: data.verified || true
        };
      } else {
        throw new Error(data.message || 'Failed to verify credentials');
      }
    } catch (error) {
      console.error(`Error verifying credentials for region ${regionId}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Fetch revenue shares
   */
  async fetchRevenueShares(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${config.tenantURL}/admin/revenue-shares${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || [],
          stats: data.stats || {},
          pagination: data.pagination || {}
        };
      } else {
        throw new Error(data.message || 'Failed to fetch revenue shares');
      }
    } catch (error) {
      console.error('Error fetching revenue shares:', error);
      throw error;
    }
  }

  /**
   * Get revenue statistics
   */
  async fetchRevenueStats(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${config.tenantURL}/admin/revenue-shares-stats${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || {}
        };
      } else {
        throw new Error(data.message || 'Failed to fetch revenue statistics');
      }
    } catch (error) {
      console.error('Error fetching revenue stats:', error);
      throw error;
    }
  }

  /**
   * Export revenue shares as CSV
   */
  async exportRevenueShares(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${config.tenantURL}/admin/revenue-shares-export${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${useAdminAuthStore.getState().token}`,
          'Accept': 'text/csv',
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `revenue-shares-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        ToastUtils.success('Revenue shares exported successfully');
        return { success: true };
      } else {
        throw new Error('Failed to export revenue shares');
      }
    } catch (error) {
      console.error('Error exporting revenue shares:', error);
      ToastUtils.error(error.message);
      throw error;
    }
  }
}

export default new TenantRegionApiService();
