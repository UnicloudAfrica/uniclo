/**
 * External Endpoint Hooks — Context-aware hooks for Migration-as-a-Service endpoints.
 *
 * Basic CRUD via createResourceHooks factory + custom hooks for:
 * - Test connection
 * - Scan endpoint size
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResourceHooks, createQueryKeys } from "../createResourceHooks";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown,
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ─── Types ──────────────────────────────────────────────────────

export interface ExternalEndpoint {
  id: string;
  identifier: string;
  tenant_id: string;
  user_id: number;
  resource_type: "vm" | "database" | "storage";
  name: string;
  label?: string;
  host: string;
  port?: number;
  provider?: string;
  region?: string;
  os_family?: string;
  engine?: string;
  engine_version?: string;
  connection_status: "untested" | "connected" | "failed";
  last_tested_at?: string;
  last_test_error?: string;
  estimated_size_bytes?: number;
  estimated_size_formatted?: string;
  credentials_masked?: Record<string, string>;
  acf_endpoint_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEndpointPayload {
  resource_type: "vm" | "database" | "storage";
  name: string;
  host: string;
  port?: number;
  provider?: string;
  region?: string;
  os_family?: string;
  engine?: string;
  engine_version?: string;
  credentials: Record<string, string>;
}

// ─── Query Keys ─────────────────────────────────────────────────

export const externalEndpointExtendedKeys = {
  ...createQueryKeys("externalEndpoints"),
  list: (context: string, params?: AnyRecord) =>
    ["externalEndpoints", "list", context, params] as const,
  detail: (context: string, id: string) =>
    ["externalEndpoints", "detail", context, id] as const,
};

// ─── CRUD Hooks (factory) ───────────────────────────────────────

const endpointHooks = createResourceHooks<ExternalEndpoint>({
  resourcePath: "integrations/external-endpoints",
  queryKeyBase: "externalEndpoints",
  dataKey: "data",
  updateMethod: "put",
});

export const {
  useFetchList: useFetchExternalEndpoints,
  useFetchById: useFetchExternalEndpoint,
  useCreate: useCreateExternalEndpoint,
  useUpdate: useUpdateExternalEndpoint,
  useDelete: useDeleteExternalEndpoint,
  queryKeys: externalEndpointKeys,
} = endpointHooks;

// ─── Custom Hooks ───────────────────────────────────────────────

/**
 * Test connection to an external endpoint via AnyCloudFlow.
 */
export const useTestEndpointConnection = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, { endpointId: string }>({
    mutationFn: async ({ endpointId }) => {
      const uri = `${entry.urlPrefix}/integrations/external-endpoints/${endpointId}/test-connection`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error(
          (envelope.message as string) || "Connection test failed",
        );
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
    onSuccess: (_data, { endpointId }) => {
      queryClient.invalidateQueries({
        queryKey: externalEndpointExtendedKeys.detail(context, endpointId),
      });
      queryClient.invalidateQueries({
        queryKey: externalEndpointExtendedKeys.list(context),
      });
    },
  });
};

/**
 * Trigger a size scan on an external endpoint.
 */
export const useScanEndpointSize = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AnyRecord, Error, { endpointId: string }>({
    mutationFn: async ({ endpointId }) => {
      const uri = `${entry.urlPrefix}/integrations/external-endpoints/${endpointId}/scan-size`;
      const envelope = asEnvelope(await entry.toastApi.post<AnyRecord>(uri));
      if (!envelope.success) {
        throw new Error((envelope.message as string) || "Scan failed");
      }
      return (envelope.data ?? {}) as AnyRecord;
    },
  });
};
