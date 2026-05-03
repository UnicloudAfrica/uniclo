import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "../../utils/logger";

/**
 * Admin hooks for integration-product pricing — Shield (StormWall /
 * Cloudflare) and AnyCloudFlow share the same shape: each service is an
 * `IntegrationProduct` row whose `product_pricing` row carries the
 * admin-set price.
 */

export interface IntegrationPricingRow {
  id: number;
  integration_key: string;
  service_type: string;
  name: string;
  description: string | null;
  billing_model: string;
  unit_label: string | null;
  provider: string | null;
  region: string | null;
  pricing_tiers: unknown;
  pricing_id: number | null;
  price: number | null;
  currency_code: string;
}

export interface UpdateIntegrationPricePayload {
  id: number;
  price: number;
  currency_code?: string;
}

interface ApiEnvelope<T> {
  data?: T;
}

const fetchIntegrationPricing = async (
  integrationKey: string,
): Promise<IntegrationPricingRow[]> => {
  const params = new URLSearchParams({ integration_key: integrationKey });
  const res = await silentApi<ApiEnvelope<IntegrationPricingRow[]>>(
    "GET",
    `/integration-pricing?${params.toString()}`,
  );
  if (!res?.data) throw new Error("Failed to fetch integration pricing.");
  return res.data;
};

const updateIntegrationPricing = async ({
  id,
  price,
  currency_code,
}: UpdateIntegrationPricePayload) => {
  const res = await api<ApiEnvelope<unknown>>("PATCH", `/integration-pricing/${id}`, {
    price,
    ...(currency_code ? { currency_code } : {}),
  });
  if (!res?.data) throw new Error("Failed to update integration price.");
  return res.data;
};

export const useFetchIntegrationPricing = (integrationKey: string) =>
  useQuery({
    queryKey: ["integration-pricing", integrationKey],
    queryFn: () => fetchIntegrationPricing(integrationKey),
    enabled: !!integrationKey,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

export const useUpdateIntegrationPricing = (integrationKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateIntegrationPricing,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-pricing", integrationKey] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating integration pricing:", error);
    },
  });
};
