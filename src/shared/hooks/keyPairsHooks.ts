import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import config from "../../config";
import { useApiContext, ApiContext } from "../../hooks/useApiContext";
import useAdminAuthStore from "../../stores/adminAuthStore";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import useClientAuthStore from "../../stores/clientAuthStore";

const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

const getKeyPairsPrefix = (context: ApiContext) => {
  if (context === "tenant") return "/admin";
  if (context === "client") return "/business";
  return "";
};

const getBaseUrlForContext = (context: ApiContext) => {
  if (context === "admin") return config.adminURL;
  if (context === "tenant") return config.tenantURL;
  return config.baseURL;
};

const buildUrl = (apiBaseUrl: string, context: ApiContext, path: string) => {
  return `${apiBaseUrl}${getKeyPairsPrefix(context)}${path}`;
};

const getAuthHeadersForContext = (context: ApiContext) => {
  const store =
    context === "admin"
      ? useAdminAuthStore
      : context === "tenant"
        ? useTenantAuthStore
        : useClientAuthStore;
  const getHeaders = store?.getState?.().getAuthHeaders;
  if (typeof getHeaders === "function") {
    return getHeaders();
  }
  return DEFAULT_HEADERS;
};

const getErrorMessage = (error: any, fallback: string) => {
  return (
    error?.response?.data?.error || error?.response?.data?.message || error?.message || fallback
  );
};

const extractKeyPairs = (payload: any) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const normalizeKeyPair = (item: any) => {
  return {
    ...item,
    id: item.id ?? item.provider_resource_id ?? item.name ?? "",
    name: item.name ?? item.key_name ?? item.keypair_name ?? item.id ?? "",
    fingerprint: item.fingerprint ?? item.key_fingerprint,
  };
};

const normalizeKeyPairs = (items: any[]) => items.map(normalizeKeyPair);

const resolveProjectId = (input: any) => input?.project_id ?? input?.projectId ?? "";

const resolveOptionalRegion = (region?: string) => region || "";

const requireRegion = (region?: string) => {
  if (!region) {
    throw new Error("Region is required for this request");
  }
  return region;
};

const requestKeyPairs = async ({
  apiBaseUrl,
  context,
  authHeaders,
  projectId,
  region,
  refresh = false,
}: {
  apiBaseUrl: string;
  context: ApiContext;
  authHeaders: Record<string, string>;
  projectId: string;
  region?: string;
  refresh?: boolean;
}) => {
  if (!projectId) return [];
  const params: Record<string, string | number> = {
    project_id: projectId,
  };
  if (region) {
    params.region = region;
  }
  if (refresh) {
    params.refresh = 1;
  }
  const { data } = await axios.get(buildUrl(apiBaseUrl, context, "/key-pairs"), {
    params,
    headers: authHeaders,
    withCredentials: true,
  });
  return normalizeKeyPairs(extractKeyPairs(data));
};

export const keyPairsKeys = {
  all: (context: ApiContext) => ["keyPairs", context] as const,
  list: (context: ApiContext, projectId?: string, region?: string) =>
    ["keyPairs", context, { projectId: projectId ?? "", region: region ?? "" }] as const,
  detail: (context: ApiContext, id?: string) => ["keyPairs", context, "detail", id ?? ""] as const,
};

export const useFetchKeyPairs = (projectId: string, region?: string, options: any = {}) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = resolveOptionalRegion(region);

  return useQuery({
    queryKey: keyPairsKeys.list(context, projectId, resolvedRegion),
    queryFn: () =>
      requestKeyPairs({
        apiBaseUrl,
        context,
        authHeaders,
        projectId,
        region: resolvedRegion,
      }),
    enabled: isAuthenticated && !!projectId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchKeyPairById = (id: string, options: any = {}) => {
  const { apiBaseUrl, context, authHeaders } = useApiContext();
  return useQuery({
    queryKey: keyPairsKeys.detail(context, id),
    queryFn: async () => {
      const { data } = await axios.get(buildUrl(apiBaseUrl, context, `/key-pairs/${id}`), {
        headers: authHeaders,
        withCredentials: true,
      });
      return data?.data ?? data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCreateKeyPair = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async (payload: any) => {
      const project_id = resolveProjectId(payload);
      const region = requireRegion(payload?.region);
      if (!project_id) {
        throw new Error("Project ID is required");
      }
      const requestPayload = { ...payload, project_id, region };
      if (requestPayload.projectId) delete requestPayload.projectId;
      if (requestPayload.publicKey && !requestPayload.public_key) {
        requestPayload.public_key = requestPayload.publicKey;
      }
      if (requestPayload.publicKey) delete requestPayload.publicKey;

      const { data } = await axios.post(
        buildUrl(apiBaseUrl, context, "/key-pairs"),
        requestPayload,
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_, payload) => {
      const projectId = resolveProjectId(payload);
      const region = payload?.region ?? "";
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: keyPairsKeys.list(context, projectId, region),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: keyPairsKeys.all(context) });
      }
    },
  });
};

export const useUpdateKeyPair = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async ({ id, keyPairData }: { id: string; keyPairData: any }) => {
      if (!id) throw new Error("Key pair ID is required");
      const { data } = await axios.patch(
        buildUrl(apiBaseUrl, context, `/key-pairs/${id}`),
        keyPairData,
        { headers: authHeaders, withCredentials: true }
      );
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: keyPairsKeys.detail(context, variables?.id),
      });
      queryClient.invalidateQueries({ queryKey: keyPairsKeys.all(context) });
    },
  });
};

export const useDeleteKeyPair = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async (input: any) => {
      const id = typeof input === "string" ? input : input?.id;
      if (!id) throw new Error("Key pair ID is required");
      const payload = typeof input === "object" ? input?.payload : undefined;
      const requestConfig: {
        headers: Record<string, string>;
        withCredentials: boolean;
        data?: any;
      } = {
        headers: authHeaders,
        withCredentials: true,
      };
      if (payload && Object.keys(payload).length > 0) {
        requestConfig.data = payload;
      }
      const { data } = await axios.delete(
        buildUrl(apiBaseUrl, context, `/key-pairs/${id}`),
        requestConfig
      );
      return data;
    },
    onSuccess: (_, input) => {
      const projectId = resolveProjectId(input || {});
      const region = input?.region ?? input?.payload?.region ?? "";
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: keyPairsKeys.list(context, projectId, region),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: keyPairsKeys.all(context) });
      }
    },
  });
};

export const useSyncKeyPairs = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, context, authHeaders } = useApiContext();

  return useMutation({
    mutationFn: async (payload: any) => {
      const projectId = resolveProjectId(payload);
      const region = resolveOptionalRegion(payload?.region);
      if (!projectId) {
        throw new Error("Project ID is required");
      }
      return requestKeyPairs({
        apiBaseUrl,
        context,
        authHeaders,
        projectId,
        region,
        refresh: true,
      });
    },
    onSuccess: (_, payload) => {
      const projectId = resolveProjectId(payload);
      const region = payload?.region ?? "";
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: keyPairsKeys.list(context, projectId, region),
        });
      } else {
        queryClient.invalidateQueries({ queryKey: keyPairsKeys.all(context) });
      }
    },
  });
};

const syncKeyPairsForContext = async (
  context: ApiContext,
  payload: { project_id?: string; projectId?: string; region?: string }
) => {
  const projectId = resolveProjectId(payload);
  const region = resolveOptionalRegion(payload?.region);
  if (!projectId) {
    throw new Error("Project ID is required");
  }
  const apiBaseUrl = getBaseUrlForContext(context);
  const authHeaders = getAuthHeadersForContext(context);
  try {
    return await requestKeyPairs({
      apiBaseUrl,
      context,
      authHeaders,
      projectId,
      region,
      refresh: true,
    });
  } catch (error: any) {
    throw new Error(getErrorMessage(error, "Failed to sync key pairs"));
  }
};

export const syncKeyPairsFromProvider = (payload: {
  project_id?: string;
  projectId?: string;
  region?: string;
}) => syncKeyPairsForContext("admin", payload);

export const syncTenantKeyPairsFromProvider = (payload: {
  project_id?: string;
  projectId?: string;
  region?: string;
}) => syncKeyPairsForContext("tenant", payload);

export const syncClientKeyPairsFromProvider = (payload: {
  project_id?: string;
  projectId?: string;
  region?: string;
}) => syncKeyPairsForContext("client", payload);

export const useFetchTenantKeyPairs = useFetchKeyPairs;
export const useFetchClientKeyPairs = useFetchKeyPairs;
export const useFetchTenantKeyPairById = useFetchKeyPairById;
export const useFetchClientKeyPairById = useFetchKeyPairById;
export const useCreateTenantKeyPair = useCreateKeyPair;
export const useCreateClientKeyPair = useCreateKeyPair;
export const useUpdateTenantKeyPair = useUpdateKeyPair;
export const useUpdateClientKeyPair = useUpdateKeyPair;
export const useDeleteTenantKeyPair = useDeleteKeyPair;
export const useDeleteClientKeyPair = useDeleteKeyPair;
export const useSyncTenantKeyPairs = useSyncKeyPairs;
