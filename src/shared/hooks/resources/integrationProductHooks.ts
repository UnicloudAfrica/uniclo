/**
 * Integration Product Catalog — context-aware hook.
 *
 * Lists IntegrationProduct services (Shield, AnyCloudFlow, …) with their
 * effective price so the quote/invoice wizard can offer them as add-on line
 * items. Resolves the endpoint through the current API context exactly like
 * the availability-zone hook, so it works in admin / tenant / client mode:
 *
 *   admin  → /admin/v1/integration-products
 *   tenant → /tenant/v1/admin/integration-products
 *   client → /api/v1/business/integration-products
 *
 * The price here is display-only — the quote is re-priced server-side at
 * submit (with tenant overrides + FX), so the customer is never charged a
 * price the catalog didn't surface.
 */
import { useQuery } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

export interface IntegrationProductRow {
  id: number;
  integration_key: string;
  service_type: string;
  name: string;
  description: string | null;
  billing_model: string;
  unit_label: string | null;
  provider: string | null;
  region: string | null;
  pricing_tiers: Record<string, unknown> | null;
  pricing_id: number | null;
  price: number | null;
  currency_code: string;
  has_override?: boolean;
}

export const useFetchIntegrationProducts = (
  options: { integrationKey?: string; tenantId?: string | number | null; enabled?: boolean } = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const { integrationKey, tenantId, enabled = true } = options;

  return useQuery<IntegrationProductRow[]>({
    queryKey: ["integration-products", context, integrationKey ?? null, tenantId ?? null],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (integrationKey) params.set("integration_key", integrationKey);
      // tenant_id surfaces tenant-specific price overrides in the preview;
      // the quote is still re-priced authoritatively at submit.
      if (tenantId != null && tenantId !== "") params.set("tenant_id", String(tenantId));
      const query = params.toString();
      const res = await entry.silentApi<{ data?: IntegrationProductRow[] }>(
        "GET",
        `${entry.urlPrefix}/integration-products${query ? `?${query}` : ""}`
      );
      const data = (res as { data?: unknown })?.data ?? res;
      return Array.isArray(data) ? (data as IntegrationProductRow[]) : [];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
