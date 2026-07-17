/**
 * Gateway Health hooks — admin-only third-party credential + connectivity
 * management. Backed by /admin/v1/gateways.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(res: unknown): { data?: T } =>
  (res ?? {}) as { data?: T };

export interface GatewayField {
  field: string;
  label: string;
  secret: boolean;
  present: boolean;
  source: "override" | "env" | "missing";
  display: string | null;
  env_var: string | null;
}

export interface Gateway {
  key: string;
  label: string;
  group: "integration" | "payment" | "cloud";
  editable: boolean;
  mode: string | null;
  base_url: string | null;
  configured: boolean;
  fields: GatewayField[];
}

export interface GatewayTestResult {
  status:
    | "healthy"
    | "auth_failed"
    | "degraded"
    | "reachable"
    | "unreachable"
    | "not_configured"
    | "not_testable"
    | "unknown";
  http_status: number | null;
  detail: string;
}

export const gatewayKeys = {
  all: ["gateways"] as const,
};

export const useGateways = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<{ gateways: Gateway[]; cloud_note: string }, Error>({
    queryKey: gatewayKeys.all,
    queryFn: async () => {
      const env = asEnvelope<{ gateways: Gateway[]; cloud_note: string }>(
        await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/gateways`),
      );
      return env.data ?? { gateways: [], cloud_note: "" };
    },
    staleTime: 15_000,
  });
};

export const useTestGateway = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<GatewayTestResult, Error, string>({
    mutationFn: async (key) => {
      const env = asEnvelope<GatewayTestResult>(
        await entry.silentApi.post<AnyRecord>(`${entry.urlPrefix}/gateways/${key}/test`),
      );
      return env.data as GatewayTestResult;
    },
  });
};

export const useUpdateGateway = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<Gateway, Error, { key: string; fields: Record<string, string> }>({
    mutationFn: async ({ key, fields }) => {
      const env = asEnvelope<Gateway>(
        await entry.toastApi.put<AnyRecord>(`${entry.urlPrefix}/gateways/${key}`, { fields }),
      );
      return env.data as Gateway;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: gatewayKeys.all }),
  });
};

export const useClearGatewayField = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const qc = useQueryClient();

  return useMutation<Gateway, Error, { key: string; field: string }>({
    mutationFn: async ({ key, field }) => {
      const env = asEnvelope<Gateway>(
        await entry.toastApi.delete<AnyRecord>(`${entry.urlPrefix}/gateways/${key}/fields/${field}`),
      );
      return env.data as Gateway;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: gatewayKeys.all }),
  });
};
