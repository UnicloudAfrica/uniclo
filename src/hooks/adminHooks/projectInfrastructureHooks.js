import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../index/admin/api';

// Mock infrastructure status for development (remove when backend is ready)
const getMockInfrastructureStatus = (projectId) => {
  return {
    project_id: projectId,
    overall_status: 'pending',
    components: {
      domain: {
        status: 'pending',
        details: null,
        error: null
      },
      vpc: {
        status: 'pending',
        details: null,
        error: null
      },
      edge_networks: {
        status: 'pending',
        details: null,
        error: null
      },
      storage: {
        status: 'pending',
        details: null,
        error: null
      },
      networking: {
        status: 'pending',
        details: null,
        error: null
      }
    },
    estimated_completion: null,
    last_updated: new Date().toISOString()
  };
};

// Fetch project infrastructure status
export const useProjectInfrastructureStatus = (projectId, options = {}) => {
  return useQuery({
    queryKey: ['project-infrastructure-status', projectId],
    queryFn: async () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      try {
        // Try to call the real API first
        return await api('GET', `/projects/${projectId}/infrastructure/status`);
      } catch (error) {
        // If API returns 404 (not found), return mock data for development
        if (error.message.includes('404') || error.message.includes('could not be found')) {
          console.warn('Infrastructure API not yet implemented, using mock data for development');
          return { data: getMockInfrastructureStatus(projectId) };
        }
        // Re-throw other errors
        throw error;
      }
    },
    enabled: !!projectId,
    staleTime: 30000, // Consider data stale after 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry for 404 or 403 errors
      if (error.message.includes('404') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
    ...options
  });
};

// Setup infrastructure component mutation
export const useSetupInfrastructureComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, componentType }) => {
      if (!projectId || !componentType) {
        throw new Error('Project ID and component type are required');
      }

      return await api('POST', `/projects/${projectId}/infrastructure/setup/${componentType}`, {
        component: componentType,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the infrastructure status
      queryClient.invalidateQueries({
        queryKey: ['project-infrastructure-status', variables.projectId]
      });

      // Also invalidate project details to update any related data
      queryClient.invalidateQueries({
        queryKey: ['project-details', variables.projectId]
      });
    },
    onError: (error, variables) => {
      console.error(`Failed to setup ${variables.componentType}:`, error);
    }
  });
};

// Bulk infrastructure setup mutation (for future use)
export const useBulkSetupInfrastructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, components }) => {
      if (!projectId || !Array.isArray(components) || components.length === 0) {
        throw new Error('Project ID and components array are required');
      }

      return await api('POST', `/projects/${projectId}/infrastructure/setup/bulk`, {
        components,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate infrastructure status
      queryClient.invalidateQueries({
        queryKey: ['project-infrastructure-status', variables.projectId]
      });
      
      // Also invalidate project details
      queryClient.invalidateQueries({
        queryKey: ['project-details', variables.projectId]
      });
    },
    onError: (error, variables) => {
      console.error('Failed to setup infrastructure components:', error);
    }
  });
};

// Reset/rollback infrastructure component (for future use)
export const useResetInfrastructureComponent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, componentType }) => {
      if (!projectId || !componentType) {
        throw new Error('Project ID and component type are required');
      }

      return await api('POST', `/projects/${projectId}/infrastructure/reset/${componentType}`, {
        component: componentType,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch the infrastructure status
      queryClient.invalidateQueries({
        queryKey: ['project-infrastructure-status', variables.projectId]
      });
    },
    onError: (error, variables) => {
      console.error(`Failed to reset ${variables.componentType}:`, error);
    }
  });
};

// Helper hook to get infrastructure setup progress
export const useInfrastructureProgress = (projectId) => {
  const { data: infraStatus } = useProjectInfrastructureStatus(projectId);

  const progress = React.useMemo(() => {
    if (!infraStatus?.components) {
      return {
        completedSteps: 0,
        totalSteps: 0,
        percentage: 0,
        currentStep: null,
        nextStep: null
      };
    }

    const components = infraStatus.components;
    const stepOrder = ['domain', 'vpc', 'edge_networks', 'storage', 'networking'];
    
    const completedSteps = stepOrder.filter(step => 
      components[step]?.status === 'completed'
    ).length;

    const currentStep = stepOrder.find(step => 
      components[step]?.status === 'in_progress'
    );

    const nextStep = stepOrder.find(step => 
      components[step]?.status === 'pending' || !components[step]
    );

    return {
      completedSteps,
      totalSteps: stepOrder.length,
      percentage: (completedSteps / stepOrder.length) * 100,
      currentStep,
      nextStep,
      isComplete: completedSteps === stepOrder.length
    };
  }, [infraStatus]);

  return progress;
};

const projectInfrastructureHooks = {
  useProjectInfrastructureStatus,
  useSetupInfrastructureComponent,
  useBulkSetupInfrastructure,
  useResetInfrastructureComponent,
  useInfrastructureProgress
};

export default projectInfrastructureHooks;
