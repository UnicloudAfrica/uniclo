import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type { ApiEnvelope, QueryHookOptions } from "@/shared/types/admin";

const QUERY_KEY = "anycloudflow-pricing";

const fetchAnyCloudFlowPricing = async () => {
  const res = await silentApi<ApiEnvelope>("GET", "/anycloudflow-pricing");
  if (!res?.data) {
    throw new Error("Failed to fetch AnyCloudFlow pricing");
  }
  return res;
};

const updateAnyCloudFlowPrice = async ({ id, price_usd }: { id: number; price_usd: number }) => {
  const res = await api("PATCH", `/anycloudflow-pricing/${id}`, { price_usd });
  if (!res) {
    throw new Error("Failed to update AnyCloudFlow price");
  }
  return res;
};

const fetchTenantOverrides = async (serviceId: number) => {
  const res = await silentApi<ApiEnvelope>(
    "GET",
    `/anycloudflow-pricing/${serviceId}/tenant-overrides`
  );
  if (!res?.data) {
    throw new Error("Failed to fetch tenant overrides");
  }
  return res;
};

const updateTenantOverride = async ({
  serviceId,
  tenantId,
  price_usd,
}: {
  serviceId: number;
  tenantId: string;
  price_usd: number;
}) => {
  const res = await api("PATCH", `/anycloudflow-pricing/${serviceId}/tenant-overrides/${tenantId}`, {
    price_usd,
  });
  if (!res) {
    throw new Error("Failed to update tenant override");
  }
  return res;
};

export const useFetchAnyCloudFlowPricing = (options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: fetchAnyCloudFlowPricing,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useUpdateAnyCloudFlowPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAnyCloudFlowPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating AnyCloudFlow price:", error);
    },
  });
};

export const useFetchTenantOverrides = (
  serviceId: number | null,
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "tenant-overrides", serviceId],
    queryFn: () => fetchTenantOverrides(serviceId!),
    enabled: !!serviceId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export interface PricingTier {
  min_units: number;
  max_units: number | null;
  price_usd: number;
  label?: string;
}

const updateAnyCloudFlowTiers = async ({
  id,
  pricing_tiers,
}: {
  id: number;
  pricing_tiers: PricingTier[] | null;
}) => {
  const res = await api("PUT", `/anycloudflow-pricing/${id}/tiers`, { pricing_tiers });
  if (!res) {
    throw new Error("Failed to update AnyCloudFlow tiers");
  }
  return res;
};

export const useUpdateAnyCloudFlowTiers = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAnyCloudFlowTiers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating AnyCloudFlow tiers:", error);
    },
  });
};

export const useUpdateTenantOverride = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTenantOverride,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating tenant override:", error);
    },
  });
};
