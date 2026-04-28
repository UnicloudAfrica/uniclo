import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

/**
 * Admin hooks for provider unit costs (Part A).
 *
 * Rows here drive the pricing recompute pipeline — edits on this table
 * regenerate `ProductPricing` via `PricingRecomputeService`. UI invalidates
 * both the unit-cost query AND the product-pricing query after a write.
 */

export interface ProviderUnitCostRow {
  id: number;
  provider: string;
  availability_zone_id: number | null;
  metric: string;
  unit_amount: number;
  per: number;
  unit_measure: string;
  currency_code: string;
  per_unit: number | null;
  notes: string | null;
  effective_from: string | null;
  updated_at: string | null;
}

export interface ProviderUnitCostQuery {
  provider?: string;
  availability_zone_id?: number | null;
}

export interface SaveUnitCostPayload {
  provider: string;
  availability_zone_id?: number | null;
  metric: string;
  unit_amount: number;
  per?: number;
  unit_measure: string;
  currency_code: string;
  notes?: string;
}

const fetchRows = async (query: ProviderUnitCostQuery): Promise<ProviderUnitCostRow[]> => {
  const params = new URLSearchParams();
  if (query.provider) params.append("provider", query.provider);
  if (query.availability_zone_id !== undefined) {
    params.append(
      "availability_zone_id",
      query.availability_zone_id === null ? "" : String(query.availability_zone_id),
    );
  }
  const qs = params.toString();
  const res = await silentApi<{ data: ProviderUnitCostRow[] }>(
    "GET",
    `/provider-unit-costs${qs ? `?${qs}` : ""}`,
  );
  return res?.data ?? [];
};

const saveRow = async (payload: SaveUnitCostPayload): Promise<ProviderUnitCostRow> => {
  const res = await api<{ data: ProviderUnitCostRow }>(
    "POST",
    "/provider-unit-costs",
    payload as unknown as Record<string, unknown>,
  );
  if (!res?.data) throw new Error("Failed to save unit cost");
  return res.data;
};

const deleteRow = async (id: number): Promise<unknown> =>
  await api("DELETE", `/provider-unit-costs/${id}`);

export interface ProviderAzRow {
  id: number;
  code: string;
  provider: string;
}

const fetchAzs = async (provider: string): Promise<ProviderAzRow[]> => {
  const res = await silentApi<{ data: ProviderAzRow[] }>(
    "GET",
    `/provider-unit-costs/availability-zones?provider=${provider}`,
  );
  return res?.data ?? [];
};

export const useFetchProviderUnitCosts = (query: ProviderUnitCostQuery = {}) =>
  useQuery({
    queryKey: ["admin", "provider-unit-costs", query],
    queryFn: () => fetchRows(query),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

export const useSaveProviderUnitCost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "provider-unit-costs"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
  });
};

export const useDeleteProviderUnitCost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "provider-unit-costs"] });
    },
  });
};

export const useFetchProviderAzs = (provider: string | null) =>
  useQuery({
    queryKey: ["admin", "provider-azs", provider],
    queryFn: () => (provider ? fetchAzs(provider) : Promise.resolve([])),
    enabled: !!provider,
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });
