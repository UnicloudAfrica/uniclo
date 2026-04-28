import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

/**
 * Admin hooks for ProductPricing localizations (Part L) — the
 * stability feature where admins pin an exact amount per currency
 * so customer-facing prices don't drift with FX moves.
 */

export interface PricingLocalizationRow {
  id: number;
  currency_code: string;
  amount: number;
  is_manual: boolean;
  updated_by: number | null;
  updated_at: string | null;
}

export interface PricingLocalizationIndex {
  product_pricing: {
    id: number;
    canonical_amount: number;
    canonical_currency: string;
  };
  localizations: PricingLocalizationRow[];
}

export interface SetLocalizationPayload {
  productPricingId: number;
  currency_code: string;
  amount: number;
  is_manual?: boolean;
}

export interface PricingDriftRow {
  localization_id: number;
  product_pricing_id: number;
  currency_code: string;
  actual: number;
  expected: number;
  drift_percent: number;
}

const fetchLocalizations = async (
  productPricingId: number,
): Promise<PricingLocalizationIndex | null> => {
  const res = await silentApi<{ data: PricingLocalizationIndex }>(
    "GET",
    `/product-pricing/${productPricingId}/localizations`,
  );
  return res?.data ?? null;
};

const setLocalization = async (
  payload: SetLocalizationPayload,
): Promise<PricingLocalizationRow> => {
  const { productPricingId, ...body } = payload;
  const res = await api<{ data: PricingLocalizationRow }>(
    "POST",
    `/product-pricing/${productPricingId}/localizations`,
    body as unknown as Record<string, unknown>,
  );
  if (!res?.data) throw new Error("Failed to save localization");
  return res.data;
};

const removeLocalization = async ({
  productPricingId,
  currencyCode,
}: {
  productPricingId: number;
  currencyCode: string;
}): Promise<unknown> => {
  return await api(
    "DELETE",
    `/product-pricing/${productPricingId}/localizations/${currencyCode}`,
  );
};

const fetchDrift = async (
  threshold = 10,
): Promise<{ data: PricingDriftRow[]; meta: { threshold_percent: number; count: number } }> => {
  const res = await silentApi<{
    data: PricingDriftRow[];
    meta: { threshold_percent: number; count: number };
  }>("GET", `/product-pricing-localizations/drift?threshold=${threshold}`);
  return res ?? { data: [], meta: { threshold_percent: threshold, count: 0 } };
};

export const useFetchPricingLocalizations = (productPricingId: number | null) =>
  useQuery({
    queryKey: ["admin", "pricing-localizations", productPricingId],
    queryFn: () =>
      productPricingId ? fetchLocalizations(productPricingId) : Promise.resolve(null),
    enabled: !!productPricingId,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

export const useSetPricingLocalization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setLocalization,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-localizations", vars.productPricingId],
      });
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
  });
};

export const useRemovePricingLocalization = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeLocalization,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "pricing-localizations", vars.productPricingId],
      });
    },
  });
};

export const useFetchPricingDrift = (threshold = 10) =>
  useQuery({
    queryKey: ["admin", "pricing-drift", threshold],
    queryFn: () => fetchDrift(threshold),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
