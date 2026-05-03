import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "../../utils/logger";

/**
 * Tenant-side hooks for usage-based metric overrides.
 *
 * Mirrors the Flow plan flow: list endpoint joins
 * `metered_unit_prices` with the caller's `tenant_metered_unit_prices`
 * row; PATCH upserts; DELETE reverts.
 */

export interface TenantMeteredPricingRow {
  metric_id: number;
  metric_key: string;
  label: string;
  description: string | null;
  unit: string;
  currency_code: string;
  admin_unit_price: number;
  tenant_unit_price: number | null;
  effective_unit_price: number;
  is_active: boolean;
  has_override: boolean;
}

interface ApiEnvelope<T> {
  data?: T;
}

const fetchRows = async (): Promise<TenantMeteredPricingRow[]> => {
  const res = await tenantSilentApi<ApiEnvelope<TenantMeteredPricingRow[]>>(
    "GET",
    "/metered-unit-prices",
  );
  if (!res?.data) throw new Error("Failed to fetch tenant metered pricing.");
  return res.data;
};

const updateRow = async ({
  metricId,
  unit_price,
  is_active,
}: {
  metricId: number;
  unit_price: number;
  is_active?: boolean;
}) => {
  const res = await tenantApi<ApiEnvelope<unknown>>(
    "PATCH",
    `/metered-unit-prices/${metricId}`,
    { unit_price, ...(is_active !== undefined ? { is_active } : {}) },
  );
  if (!res) throw new Error("Failed to save metered override.");
  return res.data;
};

const revertRow = async (metricId: number) => {
  const res = await tenantApi<ApiEnvelope<unknown>>(
    "DELETE",
    `/metered-unit-prices/${metricId}`,
  );
  if (!res) throw new Error("Failed to revert metered override.");
  return res.data;
};

export const useTenantFetchMeteredPricing = () =>
  useQuery({
    queryKey: ["tenant-metered-pricing"],
    queryFn: fetchRows,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

export const useTenantUpdateMeteredPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-metered-pricing"] });
    },
    onError: (error: unknown) => logger.error("Tenant metered override save failed:", error),
  });
};

export const useTenantRevertMeteredPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-metered-pricing"] });
    },
    onError: (error: unknown) => logger.error("Tenant metered override revert failed:", error),
  });
};
