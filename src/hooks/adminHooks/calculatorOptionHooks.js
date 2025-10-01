import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adminSilentApiforUser from "../../index/admin/silentadminforuser";
import apiAdminforUser from "../../index/admin/apiAdminforUser";

const fetchCalculatorOptions = async ({ tenant_id, region }) => {
  const params = new URLSearchParams();
  if (tenant_id) {
    params.append("tenant_id", tenant_id);
  }
  if (region) {
    params.append("region", region);
  }

  const queryString = params.toString();
  const res = await adminSilentApiforUser(
    "GET",
    `/calculator-options${queryString ? `?${queryString}` : ""}`
  );

  if (!res.data) {
    throw new Error("Failed to fetch calculator options");
  }
  return res.data;
};

export const useFetchCalculatorOptions = (
  { tenantId, region } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["calculatorOptions", { tenantId, region }],
    queryFn: () => fetchCalculatorOptions({ tenant_id: tenantId, region }),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

const createMultiQuotes = async (quoteData) => {
  const res = await apiAdminforUser("POST", "/multi-quotes", quoteData);
  if (!res) {
    throw new Error("Failed to create multi-quotes");
  }
  return res;
};

export const useCreateMultiQuotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultiQuotes,
    onSuccess: () => {
      //   queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
    },
    onError: (error) => {
      console.error("Error creating multi-quotes:", error);
    },
  });
};
