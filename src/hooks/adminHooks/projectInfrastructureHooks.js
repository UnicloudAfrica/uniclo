import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../index/admin/api';

// Convert backend response to frontend format
const convertBackendResponse = (backendData) => {
  if (!backendData) return null;
  
  // Convert backend format to frontend expected format
  const infrastructure = backendData.infrastructure || {};
  
  return {
    project_id: backendData.project?.identifier,
    overall_status: backendData.project?.status || 'pending',
    components: {
      domain: {
        status: 'completed', // Domain is managed separately
        details: null,
        error: null
      },
      vpc: {
        status: infrastructure.vpc?.status === 'configured' ? 'completed' : 
                infrastructure.vpc?.status === 'ready' ? 'pending' : 'pending',
        details: infrastructure.vpc?.details || null,
        error: null
      },
      edge_networks: {
        status: infrastructure.edge_networks?.status === 'configured' ? 'completed' :
                infrastructure.edge_networks?.ready_for_setup ? 'pending' : 'pending',
        details: infrastructure.edge_networks?.details || null,
        error: null
      },
      security_groups: {
        status: infrastructure.security_groups?.status === 'configured' ? 'completed' :
                infrastructure.security_groups?.ready_for_setup ? 'pending' : 'pending',
        details: infrastructure.security_groups?.details || null,
        error: null
      },
      subnets: {
        status: infrastructure.subnets?.status === 'configured' ? 'completed' :
                infrastructure.subnets?.ready_for_setup ? 'pending' : 'pending',
        details: infrastructure.subnets?.details || null,
        error: null
      }
    },
    completion_percentage: backendData.completion_percentage || 0,
    estimated_completion: backendData.estimated_completion_time ? 
      new Date(Date.now() + backendData.estimated_completion_time * 1000).toISOString() : null,
    last_updated: new Date().toISOString(),
    next_steps: backendData.next_steps || []
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

      const response = await api('GET', `/business/project-infrastructure/${projectId}`);
      
      // Convert backend response format to frontend expected format
      const convertedData = convertBackendResponse(response.data || response);
      
      return { data: convertedData };
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

      return await api('POST', '/business/project-infrastructure', {
        project_identifier: projectId,
        component: componentType,
        auto_configure: true,
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

      // For bulk setup, we'll call the endpoint multiple times
      // since the backend currently supports single component setup
      const results = [];
      for (const component of components) {
        const result = await api('POST', '/business/project-infrastructure', {
          project_identifier: projectId,
          component,
          auto_configure: true,
          timestamp: new Date().toISOString()
        });
        results.push(result);
      }
      return { success: true, results };
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

      // Reset functionality is not yet implemented in backend
      // Using DELETE endpoint when it becomes available
      return await api('DELETE', `/business/project-infrastructure/${projectId}`, {
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
    const stepOrder = ['domain', 'vpc', 'edge_networks', 'security_groups', 'subnets'];
    
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
