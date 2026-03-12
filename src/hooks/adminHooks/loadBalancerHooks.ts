import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import ToastUtils from "@/utils/toastUtil";
import type { LoadBalancer } from "@/shared/components/infrastructure/types";

// ==================== Load Balancers ====================

export const useLoadBalancers = (projectId: string) => {
  return useQuery<LoadBalancer[], Error>({
    queryKey: ["load-balancers", projectId],
    queryFn: async () => {
      const result: { data: LoadBalancer[] } = await adminApi.get(
        `/projects/${projectId}/load-balancers`
      );
      return result.data || [];
    },
    enabled: !!projectId,
  });
};

export const useLoadBalancer = (projectId: string, lbId: string) => {
  return useQuery<LoadBalancer, Error>({
    queryKey: ["load-balancer", projectId, lbId],
    queryFn: async () => {
      const result: { data: LoadBalancer } = await adminApi.get(
        `/projects/${projectId}/load-balancers/${lbId}`
      );
      return result.data;
    },
    enabled: !!projectId && !!lbId,
  });
};

export const useCreateLoadBalancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const result = await adminApi.post<{ data: LoadBalancer }>(
        `/projects/${projectId}/load-balancers`,
        payload
      );
      return result;
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Load Balancer created successfully");
      queryClient.invalidateQueries({ queryKey: ["load-balancers", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to create Load Balancer");
    },
  });
};

export const useDeleteLoadBalancer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, lbId }: { projectId: string; lbId: string }) => {
      await adminApi.delete(`/projects/${projectId}/load-balancers/${lbId}`);
    },
    onSuccess: (_, { projectId }) => {
      ToastUtils.success("Load Balancer deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["load-balancers", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to delete Load Balancer");
    },
  });
};

// ==================== Listeners ====================

export const useListeners = (projectId: string, lbId?: string) => {
  return useQuery({
    queryKey: ["listeners", projectId, lbId],
    queryFn: async () => {
      const url = lbId
        ? `/projects/${projectId}/listeners?load_balancer_id=${lbId}`
        : `/projects/${projectId}/listeners`;
      const result: any = await adminApi.get(url);
      return result.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateListener = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const result = await adminApi.post<{ data: unknown }>(
        `/projects/${projectId}/listeners`,
        payload
      );
      return result;
    },
    onSuccess: (_: any, { projectId }: any) => {
      ToastUtils.success("Listener created successfully");
      queryClient.invalidateQueries({ queryKey: ["listeners", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to create Listener");
    },
  });
};

export const useDeleteListener = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, listenerId }: { projectId: string; listenerId: string }) => {
      await adminApi.delete(`/projects/${projectId}/listeners/${listenerId}`);
    },
    onSuccess: (_: any, { projectId }: any) => {
      ToastUtils.success("Listener deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["listeners", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to delete Listener");
    },
  });
};

// ==================== Target Groups ====================

export const useTargetGroups = (projectId: string) => {
  return useQuery({
    queryKey: ["target-groups", projectId],
    queryFn: async () => {
      const result: any = await adminApi.get(`/projects/${projectId}/target-groups`);
      return result.data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateTargetGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const result: any = await adminApi.post(`/projects/${projectId}/target-groups`, payload);
      return result;
    },
    onSuccess: (_: any, { projectId }: any) => {
      ToastUtils.success("Target Group created successfully");
      queryClient.invalidateQueries({ queryKey: ["target-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to create Target Group");
    },
  });
};

export const useDeleteTargetGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, tgId }: { projectId: string; tgId: string }) => {
      await adminApi.delete(`/projects/${projectId}/target-groups/${tgId}`);
    },
    onSuccess: (_: any, { projectId }: any) => {
      ToastUtils.success("Target Group deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["target-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to delete Target Group");
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
      targets: unknown;
    }) => {
      const result: any = await adminApi.post(
        `/projects/${projectId}/target-groups/${tgId}/register`,
        { targets } as any
      );
      return result;
    },
    onSuccess: (_: any, { projectId }: any) => {
      ToastUtils.success("Targets registered successfully");
      queryClient.invalidateQueries({ queryKey: ["target-groups", projectId] });
    },
    onError: (error: any) => {
      ToastUtils.error(error?.message || "Failed to register targets");
    },
  });
};
