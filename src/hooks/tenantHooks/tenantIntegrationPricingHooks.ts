import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "../../utils/logger";

/**
 * Tenant-side hooks for IntegrationProduct pricing overrides (Shield +
 * AnyCloudFlow). The list endpoint joins the admin default with the
 * CALLING tenant's optional override row so the pane can render both
 * side-by-side; PATCH upserts the override (server enforces the >= admin
 * floor), DELETE reverts to the admin default. No tenant id is sent —
 * the backend resolves it from the session.
 *
 * Paths carry the `/admin` segment because the tenant API base
 * (`config.tenantURL`) stops at `/tenant/v1` while these routes live in
 * the tenant `admin` route group — same convention as `tenantPricingHooks`
 * (the working tenant product-pricing editor).
 */

export interface TenantIntegrationPricingRow {
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
  admin_price: number | null;
  admin_currency_code: string;
  tenant_price: number | null;
  currency_code: string;
  effective_price: number | null;
  has_override: boolean;
}

interface ApiEnvelope<T> {
  data?: T;
}

const QUERY_KEY = "tenant-integration-pricing";

const fetchRows = async (
  integrationKey: string,
): Promise<TenantIntegrationPricingRow[]> => {
  const params = new URLSearchParams({ integration_key: integrationKey });
  const res = await tenantSilentApi<ApiEnvelope<TenantIntegrationPricingRow[]>>(
    "GET",
    `/admin/integration-pricing?${params.toString()}`,
  );
  if (!res?.data) throw new Error("Failed to fetch tenant integration pricing.");
  return res.data;
};

const upsertRow = async ({
  integrationProductId,
  price,
  currency_code,
}: {
  integrationProductId: number;
  price: number;
  currency_code?: string;
}) => {
  const res = await tenantApi<ApiEnvelope<unknown>>(
    "PATCH",
    `/admin/integration-pricing/${integrationProductId}`,
    { price, ...(currency_code ? { currency_code } : {}) },
  );
  if (!res?.data) throw new Error("Failed to save integration override.");
  return res.data;
};

const revertRow = async (integrationProductId: number) => {
  const res = await tenantApi<ApiEnvelope<unknown>>(
    "DELETE",
    `/admin/integration-pricing/${integrationProductId}`,
  );
  if (!res?.data) throw new Error("Failed to revert integration override.");
  return res.data;
};

export const useTenantFetchIntegrationPricing = (integrationKey: string) =>
  useQuery({
    queryKey: [QUERY_KEY, integrationKey],
    queryFn: () => fetchRows(integrationKey),
    enabled: !!integrationKey,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

export const useTenantUpsertIntegrationPricing = (integrationKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: upsertRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, integrationKey] });
    },
    onError: (error: unknown) =>
      logger.error("Tenant integration override save failed:", error),
  });
};

export const useTenantRevertIntegrationPricing = (integrationKey: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, integrationKey] });
    },
    onError: (error: unknown) =>
      logger.error("Tenant integration override revert failed:", error),
  });
};
