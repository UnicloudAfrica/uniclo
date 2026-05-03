import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import tenantSilentApi from "../../index/tenant/silentTenant";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "../../utils/logger";

/**
 * Tenant-side hooks for SimpleDeploy plan pricing overrides.
 *
 * The list endpoint joins the platform default (`flow_plans`) with the
 * caller's optional override row (`tenant_flow_plan_pricing`) so the
 * UI can render both side-by-side. PATCH upserts the override; DELETE
 * reverts the row to the platform default.
 */

export interface TenantFlowPlanPricingRow {
  plan_id: number;
  name: string;
  slug: string;
  admin_price_monthly_kobo: number;
  tenant_price_monthly_kobo: number | null;
  effective_price_monthly_kobo: number;
  is_active: boolean;
  has_override: boolean;
}

interface ApiEnvelope<T> {
  data?: T;
}

const fetchRows = async (): Promise<TenantFlowPlanPricingRow[]> => {
  const res = await tenantSilentApi<ApiEnvelope<TenantFlowPlanPricingRow[]>>(
    "GET",
    "/flow-plan-pricing",
  );
  if (!res?.data) throw new Error("Failed to fetch tenant flow plan pricing.");
  return res.data;
};

const updateRow = async ({
  planId,
  price_monthly_kobo,
  is_active,
}: {
  planId: number;
  price_monthly_kobo: number;
  is_active?: boolean;
}) => {
  const res = await tenantApi<ApiEnvelope<unknown>>(
    "PATCH",
    `/flow-plan-pricing/${planId}`,
    { price_monthly_kobo, ...(is_active !== undefined ? { is_active } : {}) },
  );
  if (!res) throw new Error("Failed to save tenant override.");
  return res.data;
};

const revertRow = async (planId: number) => {
  const res = await tenantApi<ApiEnvelope<unknown>>(
    "DELETE",
    `/flow-plan-pricing/${planId}`,
  );
  if (!res) throw new Error("Failed to revert tenant override.");
  return res.data;
};

export const useTenantFetchFlowPlanPricing = () =>
  useQuery({
    queryKey: ["tenant-flow-plan-pricing"],
    queryFn: fetchRows,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

export const useTenantUpdateFlowPlanPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-flow-plan-pricing"] });
    },
    onError: (error: unknown) => logger.error("Tenant flow plan override save failed:", error),
  });
};

export const useTenantRevertFlowPlanPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revertRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-flow-plan-pricing"] });
    },
    onError: (error: unknown) => logger.error("Tenant flow plan override revert failed:", error),
  });
};
