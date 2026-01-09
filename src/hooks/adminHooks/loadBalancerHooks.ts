import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE, getAdminApi } from "../../index/admin/adminAxios";
import ToastUtils from "../../utils/toastUtil";

const adminApi = getAdminApi();

// ==================== Load Balancers ====================

export const useLoadBalancers = (projectId: string) => {
  return useQuery({
    queryKey: ["load-balancers", projectId],
    queryFn: async () => {
      const { data } = await adminApi.get(`${API_BASE}/projects/${projectId}/load-balancers`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useLoadBalancer = (projectId: string, lbId: string) => {
  return useQuery({
    queryKey: ["load-balancer", projectId, lbId],
    queryFn: async () => {
      const { data } = await adminApi.get(
        `${API_BASE}/projects/${projectId}/load-balancers/${lbId}`
      );
      return data.data;
    },
    enabled: !!projectId && !!lbId,
  });
};

export const useCreateLoadBalancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const { data } = await adminApi.post(
        `${API_BASE}/projects/${projectId}/load-balancers`,
        payload
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Load Balancer created successfully");
      queryClient.invalidateQueries({ queryKey: ["load-balancers", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create Load Balancer");
    },
  });
};

export const useDeleteLoadBalancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, lbId }: { projectId: string; lbId: string }) => {
      await adminApi.delete(`${API_BASE}/projects/${projectId}/load-balancers/${lbId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Load Balancer deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["load-balancers", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete Load Balancer");
    },
  });
};

// ==================== Listeners ====================

export const useListeners = (projectId: string, lbId?: string) => {
  return useQuery({
    queryKey: ["listeners", projectId, lbId],
    queryFn: async () => {
      const params = lbId ? { load_balancer_id: lbId } : {};
      const { data } = await adminApi.get(`${API_BASE}/projects/${projectId}/listeners`, {
        params,
      });
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateListener = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const { data } = await adminApi.post(`${API_BASE}/projects/${projectId}/listeners`, payload);
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Listener created successfully");
      queryClient.invalidateQueries({ queryKey: ["listeners", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create Listener");
    },
  });
};

export const useDeleteListener = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, listenerId }: { projectId: string; listenerId: string }) => {
      await adminApi.delete(`${API_BASE}/projects/${projectId}/listeners/${listenerId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Listener deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["listeners", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete Listener");
    },
  });
};

// ==================== Target Groups ====================

export const useTargetGroups = (projectId: string) => {
  return useQuery({
    queryKey: ["target-groups", projectId],
    queryFn: async () => {
      const { data } = await adminApi.get(`${API_BASE}/projects/${projectId}/target-groups`);
      return data.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateTargetGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const { data } = await adminApi.post(
        `${API_BASE}/projects/${projectId}/target-groups`,
        payload
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Target Group created successfully");
      queryClient.invalidateQueries({ queryKey: ["target-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to create Target Group");
    },
  });
};

export const useDeleteTargetGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, tgId }: { projectId: string; tgId: string }) => {
      await adminApi.delete(`${API_BASE}/projects/${projectId}/target-groups/${tgId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Target Group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["target-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to delete Target Group");
    },
  });
};

export const useRegisterTargets = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      tgId,
      targets,
    }: {
      projectId: string;
      tgId: string;
      targets: any[];
    }) => {
      const { data } = await adminApi.post(
        `${API_BASE}/projects/${projectId}/target-groups/${tgId}/register`,
        { targets }
      );
      return data;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Targets registered successfully");
      queryClient.invalidateQueries({ queryKey: ["target-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error.response?.data?.error || "Failed to register targets");
    },
  });
};
