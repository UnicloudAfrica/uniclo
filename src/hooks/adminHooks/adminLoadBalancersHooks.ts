/**
 * Octavia (Load Balancer) admin hooks. The backend Driver methods exist
 * but a CRUD admin endpoint isn't built yet — surfaces a graceful
 * "coming soon" empty list while still wiring the page so it's
 * navigable. When the backend lands the endpoint shape, the queryFn
 * here is the only thing that needs to change.
 */
import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

export interface LoadBalancer {
  id: string;
  name: string;
  vip_address: string | null;
  vip_subnet_id: string | null;
  provisioning_status: string;
  operating_status: string;
  region: string;
}

export function useLoadBalancers(region?: string) {
  return useQuery({
    queryKey: ["admin", "load-balancers", region],
    queryFn: async () => {
      try {
        const r = await silentApi<{ data: LoadBalancer[] }>(
          "GET",
          `/inventory/load-balancers${region ? `?region=${region}` : ""}`
        );
        return r?.data ?? [];
      } catch {
        // Endpoint not yet implemented — return empty so the page
        // renders the empty-state instead of a hard error.
        return [];
      }
    },
    staleTime: 30_000,
  });
}
