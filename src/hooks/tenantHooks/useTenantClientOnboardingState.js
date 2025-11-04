import { useQuery } from "@tanstack/react-query";
import api from "../../index/api";

const fetchDelegatedOnboarding = async () => {
  const response = await api("GET", "/business/onboarding/delegated");
  return response?.data ?? { tenants: [], clients: [] };
};

export const useTenantClientOnboardingState = (options = {}) =>
  useQuery({
    queryKey: ["tenant-onboarding", "delegated"],
    queryFn: fetchDelegatedOnboarding,
    staleTime: 30 * 1000,
    ...options,
  });
