/**
 * Designate (DNS) admin hooks. Same shape as the Octavia hooks — Driver
 * methods exist, the dedicated REST surface for the UI is in flight.
 */
import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

export interface DnsZone {
  id: string;
  name: string;
  email: string | null;
  ttl: number | null;
  status: string;
  type: string;
  created_at: string | null;
  region: string;
}

export function useDnsZones(region?: string) {
  return useQuery({
    queryKey: ["admin", "dns-zones", region],
    queryFn: async () => {
      try {
        const r = await silentApi<{ data: DnsZone[] }>(
          "GET",
          `/inventory/dns-zones${region ? `?region=${region}` : ""}`
        );
        return r?.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });
}
