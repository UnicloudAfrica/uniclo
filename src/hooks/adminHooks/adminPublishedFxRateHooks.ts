import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";

/**
 * Admin hooks for the Published FX Rate CRUD (Part C of the pricing
 * plan). Powers the `PublishedFxRates` admin screen.
 */

export interface PublishedFxRateRow {
  id: number;
  source_currency: string;
  target_currency: string;
  rate: number;
  effective_from: string | null;
  effective_until: string | null;
  published_by: number | null;
  source: "admin" | "auto_refresh";
  notes?: string | null;
}

export interface PublishedFxRateQuery {
  source_currency?: string;
  target_currency?: string;
  active_only?: boolean;
}

export interface PublishFxRatePayload {
  source_currency: string;
  target_currency: string;
  rate: number;
  effective_from?: string;
  notes?: string;
}

const fetchRates = async (
  query: PublishedFxRateQuery = {},
): Promise<PublishedFxRateRow[]> => {
  const params = new URLSearchParams();
  if (query.source_currency) params.append("source_currency", query.source_currency);
  if (query.target_currency) params.append("target_currency", query.target_currency);
  if (query.active_only) params.append("active_only", "1");
  const qs = params.toString();
  const res = await silentApi<{ data: PublishedFxRateRow[] }>(
    "GET",
    `/published-fx-rates${qs ? `?${qs}` : ""}`,
  );
  return res?.data ?? [];
};

const publishRate = async (
  payload: PublishFxRatePayload,
): Promise<PublishedFxRateRow> => {
  const res = await api<{ data: PublishedFxRateRow }>(
    "POST",
    "/published-fx-rates",
    payload as unknown as Record<string, unknown>,
  );
  if (!res?.data) throw new Error("Failed to publish FX rate");
  return res.data;
};

export const useFetchPublishedFxRates = (query: PublishedFxRateQuery = {}) =>
  useQuery({
    queryKey: ["admin", "published-fx-rates", query],
    queryFn: () => fetchRates(query),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

export const usePublishFxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "published-fx-rates"] });
      // Also bust the public lookup cache used by `useFormatPrice`.
      queryClient.invalidateQueries({ queryKey: ["exchange-rates", "published"] });
    },
  });
};
