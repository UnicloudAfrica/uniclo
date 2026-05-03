import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "../../utils/logger";

/**
 * Admin hooks for SimpleDeploy (legacy UniCloudFlow) plan pricing.
 *
 * Plans live in `flow_plans` and store their monthly fee as
 * `price_monthly_kobo` (NGN minor units). The UI converts to ₦ for
 * display and back to kobo on save so the operator never has to think
 * in minor units.
 */

export interface FlowPlanRow {
  id: number;
  slug: string;
  name: string;
  price_monthly_kobo: number;
  trial_days: number;
  max_servers: number | null;
  max_sites: number | null;
  max_databases: number | null;
  zero_downtime: boolean;
  ssl_management: boolean;
  git_integration: boolean;
  features: unknown;
  is_active: boolean;
}

export interface UpdateFlowPlanPayload {
  id: number;
  patch: Partial<Omit<FlowPlanRow, "id">>;
}

interface ApiEnvelope<T> {
  data?: T;
  message?: string;
}

const fetchFlowPlans = async (): Promise<FlowPlanRow[]> => {
  const res = await silentApi<ApiEnvelope<FlowPlanRow[]>>("GET", "/flow-plan-pricing");
  if (!res?.data) throw new Error("Failed to fetch flow plans.");
  return res.data;
};

const updateFlowPlan = async ({ id, patch }: UpdateFlowPlanPayload): Promise<FlowPlanRow> => {
  const res = await api<ApiEnvelope<FlowPlanRow>>(
    "PATCH",
    `/flow-plan-pricing/${id}`,
    patch,
  );
  if (!res?.data) throw new Error("Failed to update flow plan.");
  return res.data;
};

export const useFetchFlowPlans = () =>
  useQuery({
    queryKey: ["flow-plan-pricing"],
    queryFn: fetchFlowPlans,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

export const useUpdateFlowPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFlowPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flow-plan-pricing"] });
    },
    onError: (error: unknown) => {
      logger.error("Error updating flow plan:", error);
    },
  });
};
