/**
 * Bridge Client Hooks — Admin-only hooks for managing LeanPloy bridge clients.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const QUERY_KEY = "bridgeClients";

const getApi = () => apiRegistry.admin;

export const bridgeClientKeys = {
  all: [QUERY_KEY] as const,
  list: (params?: AnyRecord) => [QUERY_KEY, "list", params] as const,
  detail: (id: number | string) => [QUERY_KEY, "detail", id] as const,
};

const buildQuery = (base: string, params?: AnyRecord): string => {
  if (!params || Object.keys(params).length === 0) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  }
  return `${base}?${qs.toString()}`;
};

export const useBridgeClients = (params?: AnyRecord) => {
  const { silentApi } = getApi();
  return useQuery({
    queryKey: bridgeClientKeys.list(params),
    queryFn: async () => {
      const res = await silentApi.get(buildQuery("/bridge-clients", params));
      return res;
    },
  });
};

export const useBridgeClient = (id: number | string) => {
  const { silentApi } = getApi();
  return useQuery({
    queryKey: bridgeClientKeys.detail(id),
    queryFn: async () => {
      const res = await silentApi.get(`/bridge-clients/${id}`);
      return (res as AnyRecord)?.data;
    },
    enabled: !!id,
  });
};

export const useCreateBridgeClient = () => {
  const { toastApi } = getApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AnyRecord) => {
      const res = await toastApi.post("/bridge-clients", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bridgeClientKeys.all });
    },
  });
};

export const useUpdateBridgeClient = () => {
  const { toastApi } = getApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: AnyRecord & { id: number | string }) => {
      const res = await toastApi.put(`/bridge-clients/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bridgeClientKeys.all });
    },
  });
};

export const useDeleteBridgeClient = () => {
  const { toastApi } = getApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const res = await toastApi.delete(`/bridge-clients/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bridgeClientKeys.all });
    },
  });
};

export const useRotateBridgeClientToken = () => {
  const { toastApi } = getApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const res = await toastApi.post(`/bridge-clients/${id}/rotate-token`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: bridgeClientKeys.all });
    },
  });
};
