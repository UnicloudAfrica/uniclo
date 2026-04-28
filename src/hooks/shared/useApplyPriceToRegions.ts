import { useMutation, useQueryClient } from "@tanstack/react-query";
import adminApi from "../../index/admin/api";
import tenantApi from "../../index/tenant/tenantApi";
import logger from "@/utils/logger";

export interface ApplyToRegionsItem {
  productable_type: string;
  productable_id: string | number;
  price_usd: number;
}

export interface ApplyToRegionsPayload {
  provider: string;
  regions: string[];
  items: ApplyToRegionsItem[];
}

export interface ApplyToRegionsSkipped {
  productable_type?: string;
  productable_id?: string | number;
  region: string;
  reason: string;
}

export interface ApplyToRegionsResult {
  message: string;
  applied: number;
  skipped: ApplyToRegionsSkipped[];
}

const adminApplyToRegions = async (payload: ApplyToRegionsPayload): Promise<ApplyToRegionsResult> => {
  const res = await adminApi("POST", "/product-pricing/apply-to-regions", payload as unknown as Record<string, unknown>);
  if (!res) {
    throw new Error("Failed to apply pricing to regions");
  }
  return res as ApplyToRegionsResult;
};

const tenantApplyToRegions = async (payload: ApplyToRegionsPayload): Promise<ApplyToRegionsResult> => {
  const res = await tenantApi("POST", "/admin/product-pricing/apply-to-regions", payload as unknown as Record<string, unknown>);
  if (!res) {
    throw new Error("Failed to apply pricing to regions");
  }
  return res as ApplyToRegionsResult;
};

export const useAdminApplyPriceToRegions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminApplyToRegions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-pricing-admin"] });
    },
    onError: (error: unknown) => {
      logger.error("Error applying admin pricing to regions:", error);
    },
  });
};

export const useTenantApplyPriceToRegions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tenantApplyToRegions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-product-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["product-pricing"] });
    },
    onError: (error: unknown) => {
      logger.error("Error applying tenant pricing to regions:", error);
    },
  });
};
