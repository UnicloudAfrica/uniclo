/**
 * React Hook for Instance Management Operations
 *
 * This hook provides a React-friendly interface for instance management operations
 * after the removal of instance-management endpoints. It uses the instanceApiService
 * and provides state management and loading states.
 */

import { useState, useCallback, useEffect } from "react";
import instanceApiService from "../services/instanceApi";

export const useInstanceApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch instances with loading state
  const fetchInstances = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.fetchInstances(params);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch instance by ID with loading state
  const fetchInstanceById = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.fetchInstanceById(id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create instance with loading state
  const createInstance = useCallback(async (instanceData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.createInstance(instanceData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update instance with loading state
  const updateInstance = useCallback(async (id, updateData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.updateInstance(id, updateData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete instance with loading state
  const deleteInstance = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.deleteInstance(id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh instance status
  const refreshInstanceStatus = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.refreshInstanceStatus(id);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create multiple instances
  const createMultipleInstances = useCallback(async (configurations, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await instanceApiService.createMultipleInstances(configurations, options);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // DEPRECATED: Instance actions (shows warning)
  const executeInstanceAction = useCallback(async (instanceId, action, params = {}) => {
    return instanceApiService.executeInstanceAction(instanceId, action, params);
  }, []);

  // DEPRECATED: Console access (shows warning)
  const getConsoleUrl = useCallback(async (instanceId, consoleType = "novnc") => {
    return instanceApiService.getConsoleUrl(instanceId, consoleType);
  }, []);

  // DEPRECATED: Bulk actions (shows warning)
  const executeBulkAction = useCallback(async (instanceIds, action) => {
    return instanceApiService.executeBulkAction(instanceIds, action);
  }, []);

  return {
    // State
    loading,
    error,
    clearError,

    // Working methods (use standard endpoints)
    fetchInstances,
    fetchInstanceById,
    createInstance,
    updateInstance,
    deleteInstance,
    refreshInstanceStatus,
    createMultipleInstances,

    // Deprecated methods (show warnings)
    executeInstanceAction,
    getConsoleUrl,
    executeBulkAction,
  };
};

/**
 * Hook for instance list management with local state
 */
export const useInstanceList = () => {
  const [instances, setInstances] = useState([]);
  const [filteredInstances, setFilteredInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { loading, error, clearError, fetchInstances, deleteInstance, refreshInstanceStatus } =
    useInstanceApi();

  // Load instances and update state
  const loadInstances = useCallback(
    async (params = {}) => {
      try {
        const result = await fetchInstances(params);
        setInstances(result.data || []);
        return result;
      } catch (err) {
        setInstances([]);
        throw err;
      }
    },
    [fetchInstances]
  );

  // Refresh specific instance in the list
  const refreshInstance = useCallback(
    async (instanceId) => {
      try {
        const result = await refreshInstanceStatus(instanceId);

        // Update the instance in the local state
        setInstances((prev) =>
          prev.map((instance) =>
            instance.id === instanceId || instance.identifier === instanceId
              ? { ...instance, ...result.data }
              : instance
          )
        );

        return result;
      } catch (err) {
        throw err;
      }
    },
    [refreshInstanceStatus]
  );

  // Remove instance from local state after deletion
  const removeInstance = useCallback(
    async (instanceId) => {
      try {
        await deleteInstance(instanceId);

        // Remove from local state
        setInstances((prev) =>
          prev.filter(
            (instance) => instance.id !== instanceId && instance.identifier !== instanceId
          )
        );

        // Remove from selection if selected
        setSelectedInstances((prev) => {
          const newSelected = new Set(prev);
          newSelected.delete(instanceId);
          return newSelected;
        });
      } catch (err) {
        throw err;
      }
    },
    [deleteInstance]
  );

  // Filter instances based on search and status
  const filterInstances = useCallback(() => {
    let filtered = [...instances];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (instance) =>
          (instance.name && instance.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (instance.identifier &&
            instance.identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (instance.floating_ip?.ip_address &&
            instance.floating_ip.ip_address.includes(searchTerm)) ||
          (instance.private_ip && instance.private_ip.includes(searchTerm))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((instance) => instance.status === statusFilter);
    }

    setFilteredInstances(filtered);
  }, [instances, searchTerm, statusFilter]);

  // Update filtered instances when dependencies change
  useEffect(() => {
    filterInstances();
  }, [filterInstances]);

  // Instance selection handlers
  const selectInstance = useCallback((instanceId) => {
    setSelectedInstances((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(instanceId)) {
        newSelected.delete(instanceId);
      } else {
        newSelected.add(instanceId);
      }
      return newSelected;
    });
  }, []);

  const selectAllInstances = useCallback(() => {
    if (selectedInstances.size === filteredInstances.length) {
      setSelectedInstances(new Set());
    } else {
      setSelectedInstances(new Set(filteredInstances.map((i) => i.id || i.identifier)));
    }
  }, [selectedInstances, filteredInstances]);

  const clearSelection = useCallback(() => {
    setSelectedInstances(new Set());
  }, []);

  return {
    // Data state
    instances,
    filteredInstances,
    selectedInstances,
    searchTerm,
    statusFilter,

    // Loading and error state
    loading,
    error,
    clearError,

    // Data operations
    loadInstances,
    refreshInstance,
    removeInstance,

    // Filter operations
    setSearchTerm,
    setStatusFilter,
    filterInstances,

    // Selection operations
    selectInstance,
    selectAllInstances,
    clearSelection,
  };
};

export default useInstanceApi;
