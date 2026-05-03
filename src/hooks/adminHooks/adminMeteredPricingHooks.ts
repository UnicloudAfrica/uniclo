import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "../../utils/logger";

/**
 * Admin hooks for usage-based metric pricing — `metered_unit_prices`.
 * The billing engine multiplies each `subscription_items.usage_quantity`
 * by `unit_price` here to compute line subtotals at invoice time.
 */

export interface MeteredUnitPriceRow {
  id: number;
  metric_key: string;
  label: string;
  description: string | null;
  unit: string;
  unit_price: number;
  currency_code: string;
  is_active: boolean;
  metadata: unknown;
  updated_at: string | null;
}

export interface CreateMeteredPricePayload {
  metric_key: string;
  label: string;
  description?: string | null;
  unit: string;
  unit_price: number;
  currency_code: string;
  is_active?: boolean;
}

export interface UpdateMeteredPricePayload {
  id: number;
  patch: Partial<Omit<MeteredUnitPriceRow, "id">>;
}

interface ApiEnvelope<T> {
  data?: T;
}

const fetchMeteredPrices = async (): Promise<MeteredUnitPriceRow[]> => {
  const res = await silentApi<ApiEnvelope<MeteredUnitPriceRow[]>>("GET", "/metered-unit-prices");
  if (!res?.data) throw new Error("Failed to fetch metered prices.");
  return res.data;
};

const createMeteredPrice = async (
  payload: CreateMeteredPricePayload,
): Promise<MeteredUnitPriceRow> => {
  const res = await api<ApiEnvelope<MeteredUnitPriceRow>>("POST", "/metered-unit-prices", payload);
  if (!res?.data) throw new Error("Failed to create metered price.");
  return res.data;
};

const updateMeteredPrice = async ({
  id,
  patch,
}: UpdateMeteredPricePayload): Promise<MeteredUnitPriceRow> => {
  const res = await api<ApiEnvelope<MeteredUnitPriceRow>>(
    "PATCH",
    `/metered-unit-prices/${id}`,
    patch,
  );
  if (!res?.data) throw new Error("Failed to update metered price.");
  return res.data;
};

const deleteMeteredPrice = async (id: number) => {
  await api("DELETE", `/metered-unit-prices/${id}`);
  return id;
};

export const useFetchMeteredPrices = () =>
  useQuery({
    queryKey: ["metered-unit-prices"],
    queryFn: fetchMeteredPrices,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

export const useCreateMeteredPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMeteredPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metered-unit-prices"] });
    },
    onError: (error: unknown) => logger.error("Error creating metered price:", error),
  });
};

export const useUpdateMeteredPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMeteredPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metered-unit-prices"] });
    },
    onError: (error: unknown) => logger.error("Error updating metered price:", error),
  });
};

export const useDeleteMeteredPrice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMeteredPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metered-unit-prices"] });
    },
    onError: (error: unknown) => logger.error("Error deleting metered price:", error),
  });
};
