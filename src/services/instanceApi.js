/**
 * Instance Management API Service
 * 
 * This service provides updated instance management operations after the removal
 * of the /business/instance-management endpoints. These endpoints were consolidated
 * into standard CRUD operations for instances.
 * 
 * REMOVED ENDPOINTS:
 * - POST /business/instance-management/{id}/actions (bulk instance actions)
 * - POST /business/instance-management/{id}/refresh (status refresh)
 * - GET /business/instance-management/{id}/console (console access)
 * - GET /business/instance-management (enhanced instance listing)
 * 
 * REPLACEMENT STRATEGY:
 * - Use standard /business/instances endpoints for CRUD operations
 * - Console access functionality has been disabled temporarily
 * - Instance actions should be handled through individual API calls
 * - Status refresh is handled by re-fetching instance data
 */

import config from '../config';
import useAdminAuthStore from '../stores/adminAuthStore';
import ToastUtils from '../utils/toastUtil';

class InstanceApiService {
  /**
   * Get the authorization headers
   */
  getAuthHeaders() {
    const { token } = useAdminAuthStore.getState();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Fetch all instances using the standard instances endpoint
   * This replaces the enhanced instance-management listing
   */
  async fetchInstances(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `${config.baseURL}/business/instances${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        return {
          success: true,
          data: data.data || [],
          meta: data.meta || {}
        };
      } else {
        throw new Error(data.error || 'Failed to fetch instances');
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
      throw error;
    }
  }

  /**
   * Fetch a specific instance by ID or identifier
   */
  async fetchInstanceById(id) {
    try {
      const response = await fetch(`${config.baseURL}/business/instances/${id}`, {
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
        throw new Error(data.error || 'Failed to fetch instance');
      }
    } catch (error) {
      console.error(`Error fetching instance ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new instance
   */
  async createInstance(instanceData) {
    try {
      const response = await fetch(`${config.baseURL}/business/instances`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(instanceData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Instance created successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.error || data.message || 'Failed to create instance');
      }
    } catch (error) {
      console.error('Error creating instance:', error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Update an instance
   */
  async updateInstance(id, updateData) {
    try {
      const response = await fetch(`${config.baseURL}/business/instances/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Instance updated successfully');
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.error || data.message || 'Failed to update instance');
      }
    } catch (error) {
      console.error(`Error updating instance ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * Delete an instance
   */
  async deleteInstance(id) {
    try {
      const response = await fetch(`${config.baseURL}/business/instances/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success || response.ok) {
        ToastUtils.success(data.message || 'Instance deleted successfully');
        return {
          success: true,
          message: data.message || 'Instance deleted successfully'
        };
      } else {
        throw new Error(data.error || data.message || 'Failed to delete instance');
      }
    } catch (error) {
      console.error(`Error deleting instance ${id}:`, error);
      ToastUtils.error(error.message);
      throw error;
    }
  }

  /**
   * DISABLED: Execute instance action
   * This functionality was removed with the instance-management endpoints
   * 
   * @deprecated This method is disabled. Instance actions are no longer available
   * through bulk action endpoints. Use individual CRUD operations instead.
   */
  async executeInstanceAction(instanceId, action, params = {}) {
    console.warn('Instance actions are no longer available. This method is deprecated.');
    ToastUtils.warning(`Instance action '${action}' is no longer available. Use individual instance management operations instead.`);
    
    // For delete action, redirect to the delete method
    if (action === 'destroy' || action === 'delete') {
      return this.deleteInstance(instanceId);
    }
    
    return Promise.resolve({
      success: false,
      message: 'Instance actions have been disabled'
    });
  }

  /**
   * DISABLED: Get console access URL
   * Console access has been temporarily disabled due to removal of instance-management endpoints
   * 
   * @deprecated Console access is temporarily unavailable
   */
  async getConsoleUrl(instanceId, consoleType = 'novnc') {
    console.warn('Console access is temporarily disabled.');
    ToastUtils.warning('Console access is currently unavailable and will be restored in a future update.');
    
    return Promise.resolve({
      success: false,
      message: 'Console access is temporarily unavailable'
    });
  }

  /**
   * Refresh instance data (replaces the dedicated refresh endpoint)
   * This simply re-fetches the instance data instead of calling a refresh endpoint
   */
  async refreshInstanceStatus(instanceId) {
    try {
      const result = await this.fetchInstanceById(instanceId);
      ToastUtils.success('Instance status refreshed');
      return result;
    } catch (error) {
      ToastUtils.error('Failed to refresh instance status');
      throw error;
    }
  }

  /**
   * DISABLED: Bulk instance actions
   * Bulk actions were removed with the instance-management endpoints
   * 
   * @deprecated Bulk actions are no longer available
   */
  async executeBulkAction(instanceIds, action) {
    console.warn('Bulk instance actions are no longer available.');
    ToastUtils.warning(`Bulk action '${action}' is no longer available. Please manage instances individually.`);
    
    return Promise.resolve({
      success: false,
      message: 'Bulk actions have been disabled'
    });
  }

  /**
   * Create multiple instances
   * This uses the multi-instances endpoint for bulk creation
   */
  async createMultipleInstances(instanceConfigurations, options = {}) {
    try {
      const payload = {
        pricing_requests: instanceConfigurations,
        ...options
      };

      const response = await fetch(`${config.baseURL}/business/multi-instances`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Idempotency-Key': options.idempotencyKey || `multi-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        ToastUtils.success(data.message || 'Multiple instances creation initiated');
        return {
          success: true,
          data: data.data,
          message: data.message
        };
      } else {
        if (data.errors) {
          // Handle validation errors
          const firstError = Object.values(data.errors)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : (data.message || 'Validation failed');
          throw new Error(errorMessage);
        }
        throw new Error(data.message || 'Failed to create multiple instances');
      }
    } catch (error) {
      console.error('Error creating multiple instances:', error);
      ToastUtils.error(error.message);
      throw error;
    }
  }
}

// Export a singleton instance
const instanceApiService = new InstanceApiService();
export default instanceApiService;

// Also export named functions for individual operations
export const {
  fetchInstances,
  fetchInstanceById,
  createInstance,
  updateInstance,
  deleteInstance,
  refreshInstanceStatus,
  createMultipleInstances,
  executeInstanceAction,
  getConsoleUrl,
  executeBulkAction
} = instanceApiService;