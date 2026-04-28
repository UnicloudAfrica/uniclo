import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ApiKeyData {
  id: number;
  uuid: string;
  name: string;
  mode: "live" | "test";
  description: string | null;
  scopes: string[];
  rate_limit_tier: string;
  allowed_ips: string[] | null;
  is_active: boolean;
  last_used_at: string | null;
  last_used_ip: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  plain_text_token?: string; // Only on create/rotate
}

export interface CreateApiKeyPayload {
  name: string;
  mode?: "live" | "test";
  description?: string;
  scopes: string[];
  expires_at?: string;
  allowed_ips?: string[];
}

export interface UpdateScopesPayload {
  scopes: string[];
}

export interface UpdateIpsPayload {
  allowed_ips: string[] | null;
}

export interface ScopeGroup {
  [scope: string]: string; // scope key → description
}

export interface WebhookEndpointData {
  id: number;
  identifier: string;
  url: string;
  description: string | null;
  events: string[];
  is_active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  secret?: string;
  secret_preview?: string;
  created_at: string;
}

export interface CreateWebhookPayload {
  url: string;
  description?: string;
  events: string[];
}

export interface UpdateWebhookPayload {
  url?: string;
  description?: string;
  events?: string[];
  is_active?: boolean;
}

export interface WebhookDeliveryData {
  id: number;
  event_type: string;
  payload: AnyRecord;
  response_code: number | null;
  response_body: string | null;
  duration_ms: number | null;
  attempt: number;
  status: "pending" | "success" | "failed";
  created_at: string;
}

export interface UsageSummary {
  period_days: number;
  total_requests: number;
  total_errors: number;
  error_rate: number;
  daily: Array<{
    date: string;
    requests: number;
    errors: number;
    avg_response_ms: number | null;
  }>;
  top_endpoints: Array<{
    endpoint: string;
    count: number;
  }>;
}

export interface WebhookEventInfo {
  [eventType: string]: string; // event key → description
}

// ═══════════════════════════════════════════════════════════════════
// API KEY HOOKS
// ═══════════════════════════════════════════════════════════════════

const DEV_PREFIX = "/developer";

export const useFetchApiKeys = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["apiKeys", context],
    queryFn: async () => {
      const envelope = asEnvelope<ApiKeyData[]>(
        await entry.silentApi.get<AnyRecord>(`${DEV_PREFIX}/api-keys`)
      );
      return envelope.data ?? [];
    },
    staleTime: 1000 * 30,
  });
};

export const useCreateApiKey = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateApiKeyPayload) => {
      const envelope = asEnvelope<ApiKeyData>(
        await entry.toastApi.post<AnyRecord>(`${DEV_PREFIX}/api-keys`, payload as unknown as Record<string, unknown>)
      );
      if (!envelope.data) throw new Error(envelope.message || "Failed to create API key.");
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
};

export const useRevokeApiKey = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: number) => {
      await entry.toastApi.delete<AnyRecord>(`${DEV_PREFIX}/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
};

export const useRotateApiKey = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: number) => {
      const envelope = asEnvelope<ApiKeyData>(
        await entry.toastApi.post<AnyRecord>(`${DEV_PREFIX}/api-keys/${keyId}/rotate`, {})
      );
      if (!envelope.data) throw new Error(envelope.message || "Failed to rotate API key.");
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
};

export const useUpdateApiKeyScopes = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, scopes }: { keyId: number; scopes: string[] }) => {
      const envelope = asEnvelope<ApiKeyData>(
        await entry.toastApi.put<AnyRecord>(`${DEV_PREFIX}/api-keys/${keyId}/scopes`, { scopes })
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
};

export const useUpdateApiKeyIps = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ keyId, allowed_ips }: { keyId: number; allowed_ips: string[] | null }) => {
      const envelope = asEnvelope<ApiKeyData>(
        await entry.toastApi.put<AnyRecord>(`${DEV_PREFIX}/api-keys/${keyId}/ips`, { allowed_ips })
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
    },
  });
};

export const useFetchAvailableScopes = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["apiKeyScopes", context],
    queryFn: async () => {
      const envelope = asEnvelope<Record<string, ScopeGroup>>(
        await entry.silentApi.get<AnyRecord>(`${DEV_PREFIX}/api-keys/scopes`)
      );
      return envelope.data ?? {};
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ═══════════════════════════════════════════════════════════════════
// WEBHOOK HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useFetchWebhooks = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["webhooks", context],
    queryFn: async () => {
      const envelope = asEnvelope<WebhookEndpointData[]>(
        await entry.silentApi.get<AnyRecord>(`${DEV_PREFIX}/webhooks`)
      );
      return envelope.data ?? [];
    },
    staleTime: 1000 * 30,
  });
};

export const useCreateWebhook = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateWebhookPayload) => {
      const envelope = asEnvelope<WebhookEndpointData>(
        await entry.toastApi.post<AnyRecord>(`${DEV_PREFIX}/webhooks`, payload as unknown as Record<string, unknown>)
      );
      if (!envelope.data) throw new Error(envelope.message || "Failed to create webhook.");
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
};

export const useUpdateWebhook = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateWebhookPayload & { id: number }) => {
      const envelope = asEnvelope<WebhookEndpointData>(
        await entry.toastApi.put<AnyRecord>(`${DEV_PREFIX}/webhooks/${id}`, payload)
      );
      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
};

export const useDeleteWebhook = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await entry.toastApi.delete<AnyRecord>(`${DEV_PREFIX}/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
    },
  });
};

export const useTestWebhook = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation({
    mutationFn: async (id: number) => {
      const envelope = asEnvelope<{ status: string; response_code: number; duration_ms: number }>(
        await entry.toastApi.post<AnyRecord>(`${DEV_PREFIX}/webhooks/${id}/test`, {})
      );
      return envelope.data;
    },
  });
};

export const useFetchWebhookDeliveries = (webhookId: number, options: { enabled?: boolean } = {}) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["webhookDeliveries", context, webhookId],
    queryFn: async () => {
      const envelope = asEnvelope<WebhookDeliveryData[]>(
        await entry.silentApi.get<AnyRecord>(`${DEV_PREFIX}/webhooks/${webhookId}/deliveries`)
      );
      return envelope.data ?? [];
    },
    enabled: options.enabled !== false && !!webhookId,
    staleTime: 1000 * 15,
  });
};

export const useFetchWebhookEvents = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["webhookEvents", context],
    queryFn: async () => {
      const envelope = asEnvelope<WebhookEventInfo>(
        await entry.silentApi.get<AnyRecord>(`${DEV_PREFIX}/webhook-events`)
      );
      return envelope.data ?? {};
    },
    staleTime: 1000 * 60 * 10,
  });
};

// ═══════════════════════════════════════════════════════════════════
// USAGE HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useFetchApiUsage = (days = 30) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["apiUsage", context, days],
    queryFn: async () => {
      const envelope = asEnvelope<UsageSummary>(
        await entry.silentApi.get<AnyRecord>(`${DEV_PREFIX}/usage?days=${days}`)
      );
      return envelope.data ?? null;
    },
    staleTime: 1000 * 60,
  });
};
