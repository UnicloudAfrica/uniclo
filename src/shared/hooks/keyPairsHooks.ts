import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import config from "../../config";
import { useApiContext, ApiContext } from "@/hooks/useApiContext";
import useAdminAuthStore from "@/stores/adminAuthStore";
import useTenantAuthStore from "@/stores/tenantAuthStore";
import useClientAuthStore from "@/stores/clientAuthStore";

export interface KeyPair {
  id: string;
  name: string;
  fingerprint?: string;
  public_key?: string;
  provider_resource_id?: string;
  key_name?: string;
  keypair_name?: string;
  key_fingerprint?: string;
  [key: string]: unknown;
}

export interface KeyPairPayload {
  name?: string;
  project_id?: string;
  projectId?: string;
  region?: string;
  publicKey?: string;
  public_key?: string;
  [key: string]: unknown;
}

export interface KeyPairCreatePayload extends KeyPairPayload {
  name: string;
  project_id: string;
  region: string;
}

export interface KeyPairUpdatePayload {
  name?: string;
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asRecord = (value: unknown): Record<string, unknown> => (isRecord(value) ? value : {});

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

const getErrorMessage = (error: unknown, fallback: string) => {
  const record = asRecord(error);
  const response = asRecord(record.response);
  const responseData = asRecord(response.data);
  return (
    (responseData.error as string | undefined) ||
    (responseData.message as string | undefined) ||
    (record.message as string | undefined) ||
    fallback
  );
};

const extractKeyPairs = (payload: unknown) => {
  const record = asRecord(payload);
  if (Array.isArray(record.data)) return record.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const normalizeKeyPair = (item: unknown): KeyPair => {
  const record = asRecord(item);
  const id = String(record.id ?? record.provider_resource_id ?? record.name ?? "");
  const name = String(record.name ?? record.key_name ?? record.keypair_name ?? record.id ?? "");
  const fingerprint = String(record.fingerprint ?? record.key_fingerprint ?? "");

  return {
    ...record,
    id,
    name,
    fingerprint,
  } as KeyPair;
};

const normalizeKeyPairs = (items: unknown[]) => items.map(normalizeKeyPair);

const resolveProjectId = (input: unknown) => {
  const record = asRecord(input);
  return (
    (record.project_id as string | undefined) ?? (record.projectId as string | undefined) ?? ""
  );
};

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
  const params: Record<string, string | number> = {};
  if (projectId) {
    params.project_id = projectId;
  }
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

export const useFetchKeyPairs = (
  projectId?: string,
  region?: string,
  options: Record<string, unknown> = {}
) => {
  const { apiBaseUrl, context, authHeaders, isAuthenticated } = useApiContext();
  const resolvedRegion = resolveOptionalRegion(region);

  return useQuery({
    queryKey: keyPairsKeys.list(context, projectId, resolvedRegion),
    queryFn: () =>
      requestKeyPairs({
        apiBaseUrl,
        context,
        authHeaders,
        projectId: projectId || "",
        region: resolvedRegion,
      }),
    enabled: isAuthenticated && options.enabled !== false,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useFetchKeyPairById = (id: string, options = {}) => {
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
    mutationFn: async (payload: KeyPairPayload) => {
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
    mutationFn: async ({ id, keyPairData }: { id: string; keyPairData: KeyPairUpdatePayload }) => {
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
    mutationFn: async (input: string | { id?: string; payload?: KeyPairPayload }) => {
      const id = typeof input === "string" ? input : input?.id;
      if (!id) throw new Error("Key pair ID is required");
      const payload = typeof input === "object" ? input?.payload : undefined;
      const requestConfig: {
        headers: Record<string, string>;
        withCredentials: boolean;
        data?: KeyPairPayload;
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
      const inputObj = typeof input === "object" ? input : {};
      const projectId = resolveProjectId(inputObj);
      const region =
        (inputObj as { region?: string }).region ??
        (inputObj as { payload?: KeyPairPayload }).payload?.region ??
        "";
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
    mutationFn: async (payload: KeyPairPayload) => {
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

const syncKeyPairsForContext = async (context: ApiContext, payload: KeyPairPayload) => {
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
  } catch (error: unknown) {
    throw new Error(getErrorMessage(error, "Failed to sync key pairs"));
  }
};

export const syncKeyPairsFromProvider = (payload: KeyPairPayload) =>
  syncKeyPairsForContext("admin", payload);

export const syncTenantKeyPairsFromProvider = (payload: KeyPairPayload) =>
  syncKeyPairsForContext("tenant", payload);

export const syncClientKeyPairsFromProvider = (payload: KeyPairPayload) =>
  syncKeyPairsForContext("client", payload);

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
