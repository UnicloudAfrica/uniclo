import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

type AnyRecord = Record<string, unknown>;

const asEnvelope = <T = AnyRecord>(
  res: unknown
): { success?: boolean; message?: string; data?: T } =>
  (res ?? {}) as { success?: boolean; message?: string; data?: T };

export type ResourceType = "instance" | "managed_database";

export interface ResizePreviewRequest {
  resource_type: ResourceType;
  resource_id: number;
  new_product_id: number;
}

export interface ResizeConfirmRequest extends ResizePreviewRequest {
  accepted_amount: number;
}

export interface ResizePreviewResponse {
  adjustment_type: "upgrade" | "downgrade" | "none";
  old_price: number;
  new_price: number;
  prorated_amount: number;
  days_remaining: number;
  total_days: number;
  billing_cycle: string;
  period_start: string | null;
  period_end: string | null;
  currency: string;
  payment_method: "wallet_debit" | "wallet_credit";
  wallet_balance: number | null;
  wallet_exists: boolean;
  sufficient_funds: boolean;
  shortfall: number;
  resource_type: string;
  resource_label: string;
  old_snapshot: Record<string, unknown>;
  new_product_name: string | null;
  new_product_id: number;
}

export interface ResizeConfirmResponse {
  adjustment_id: string;
  status: string;
  prorated_amount: number;
  currency: string;
  adjustment_type: string;
  wallet_transaction_id: string | null;
}

export type ResizeOption = ResizePreviewResponse;

export interface ResizeOptionsResponse {
  current_product: {
    id: number;
    name: string;
    price: number;
  };
  options: ResizeOption[];
}

export const useResizePreview = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation({
    mutationFn: async (payload: ResizePreviewRequest) => {
      const envelope = asEnvelope<ResizePreviewResponse>(
        await entry.silentApi.post<AnyRecord>(`${entry.urlPrefix}/billing/resize-preview`, payload as unknown as Record<string, unknown>)
      );

      if (!envelope.data) {
        throw new Error(envelope.message || "Failed to calculate resize preview.");
      }

      return envelope.data;
    },
  });
};

export const useResizeConfirm = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ResizeConfirmRequest) => {
      const envelope = asEnvelope<ResizeConfirmResponse>(
        await entry.toastApi.post<AnyRecord>(`${entry.urlPrefix}/billing/resize-confirm`, payload as unknown as Record<string, unknown>)
      );

      if (!envelope.data) {
        throw new Error(envelope.message || "Failed to confirm resize.");
      }

      return envelope.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletBalance"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["instances"] });
      queryClient.invalidateQueries({ queryKey: ["managedDatabases"] });
    },
  });
};

export const useResizeOptions = (
  resourceType: ResourceType,
  resourceId: number,
  options: { enabled?: boolean } = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery({
    queryKey: ["resizeOptions", context, resourceType, resourceId],
    queryFn: async () => {
      const envelope = asEnvelope<ResizeOptionsResponse>(
        await entry.silentApi.get<AnyRecord>(
          `${entry.urlPrefix}/billing/resize-options/${resourceType}/${resourceId}`
        )
      );

      if (!envelope.data) {
        throw new Error(envelope.message || "Failed to load resize options.");
      }

      return envelope.data;
    },
    enabled: options.enabled !== false && !!resourceId,
    staleTime: 1000 * 60,
  });
};
