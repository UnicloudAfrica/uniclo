import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import api from "../../index/api";

export interface TenantOnboardingStateResponse {
  tenants?: unknown[];
  clients?: unknown[];
}

const fetchDelegatedOnboarding = async (): Promise<TenantOnboardingStateResponse> => {
  const response = await api<{ data?: TenantOnboardingStateResponse }>(
    "GET",
    "/business/onboarding/delegated"
  );
  return response?.data ?? { tenants: [], clients: [] };
};

export const useTenantClientOnboardingState = (
  options: Omit<UseQueryOptions<TenantOnboardingStateResponse, Error>, "queryKey" | "queryFn"> = {}
) =>
  useQuery({
    queryKey: ["tenant-onboarding", "delegated"],
    queryFn: fetchDelegatedOnboarding,
    staleTime: 30 * 1000,
    ...options,
  });
