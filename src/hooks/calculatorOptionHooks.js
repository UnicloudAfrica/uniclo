import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

const fetchTenantCalculatorOptions = async ({
  tenant_id,
  region,
  productable_type,
}) => {
  const params = new URLSearchParams();
  if (tenant_id) {
    params.append("tenant_id", tenant_id);
  }
  if (region) {
    params.append("region", region);
  }
  if (productable_type) {
    params.append("productable_type", productable_type);
  }

  const queryString = params.toString();
  const res = await silentApi(
    "GET",
    `/calculator-options${queryString ? `?${queryString}` : ""}`
  );

  if (!res.data) {
    throw new Error("Failed to fetch calculator options");
  }
  return res.data;
};

export const useFetchTenantCalculatorOptions = (
  { tenantId, region, productable_type } = {},
  options = {}
) => {
  return useQuery({
    queryKey: [
      "tenantCalculatorOptions",
      { tenantId, region, productable_type },
    ],
    queryFn: () =>
      fetchTenantCalculatorOptions({
        tenant_id: tenantId,
        region,
        productable_type,
      }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

const createMultiQuotes = async (quoteData) => {
  const res = await api("POST", "/multi-quotes", quoteData);
  if (!res) {
    throw new Error("Failed to create multi-quotes");
  }
  return res;
};

export const useCreatehTenantMultiQuotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultiQuotes,
    onSuccess: () => {
      //   queryClient.invalidateQueries({ queryKey: ["tenant-quotes"] });
    },
    onError: (error) => {
      console.error("Error creating multi-quotes:", error);
    },
  });
};
