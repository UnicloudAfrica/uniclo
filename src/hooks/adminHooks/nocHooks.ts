import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";
import api from "../../index/admin/api";
import logger from "@/utils/logger";
import type { QueryHookOptions } from "@/shared/types/admin";

const QUERY_KEY = "noc";

export type NocStatus = "green" | "amber" | "red" | "unknown" | "offline";

export interface NocRegionSummary {
  code: string;
  name: string;
  country_code: string | null;
  city: string | null;
  provider: string;
  latitude: number;
  longitude: number;
  has_live_credentials: boolean;
  status: NocStatus;
  status_reason: string | null;
  cluster: {
    name: string | null;
    version: string | null;
    nodes_active: number | null;
    nodes_total: number | null;
  };
  capacity: {
    cpu_used_pct: number;
    memory_used_pct: number;
    storage_used_pct: number;
  };
  counts: {
    vms: number;
    vpcs: number;
    tenants: number;
    eips_used: number;
    eips_available: number;
    open_alarms: number;
  };
  fetched_at: string | null;
  stale: boolean;
}

export interface NocRegionsEnvelope {
  data: NocRegionSummary[];
  summary: {
    region_count: number;
    total_vms: number;
    total_tenants: number;
    total_open_alarms: number;
    regions_red: number;
    regions_amber: number;
    regions_green: number;
  };
}

export interface NocAlarm {
  id: string;
  entity_id: string;
  entity_type: string;
  type_id: string;
  type_name: string;
  state: string;
  created_at: string;
  updated_at: string;
  project_id: string | null;
  _region_code: string;
  _region_name: string;
  _severity: "critical" | "warning" | "info";
}

export interface NocNode {
  id: string;
  name: string;
  hostname: string;
  uptime: number;
  access_ip: string | null;
  management_ip: string | null;
  cpu_cores: number;
  cpu_model: string | null;
  total_disk_gb: number;
  services_ok: boolean;
}

export interface NocVm {
  id: string;
  name: string;
  status: string;
  instance_type: string;
  vcpus: number;
  ram_mb: number;
  disk_gb: number;
  project_id: string;
  vpc_id: string | null;
  address: string | null;
  hostname: string | null;
  created: string;
}

export interface NocVpc {
  id: string;
  name: string | null;
  cidr_block: string | null;
  state: string | null;
  is_default: boolean;
  project_id: string | null;
  created_at: string | null;
}

// ───────────────────────── Fetchers ─────────────────────────

const fetchRegions = async (): Promise<NocRegionsEnvelope> => {
  const res = await silentApi<NocRegionsEnvelope>("GET", "/noc/regions");
  if (!res?.data) throw new Error("Failed to fetch NOC regions");
  return res as NocRegionsEnvelope;
};

const fetchRegion = async (code: string) => {
  const res = await silentApi<{ region: unknown; snapshot: unknown }>(
    "GET",
    `/noc/regions/${code}`
  );
  return res;
};

const fetchAlarms = async (code?: string, state: string = "open"): Promise<NocAlarm[]> => {
  const path = code ? `/noc/regions/${code}/alarms` : "/noc/alarms";
  const res = await silentApi<{ data: NocAlarm[] }>("GET", `${path}?state=${state}`);
  return res?.data ?? [];
};

const fetchNodes = async (code: string): Promise<NocNode[]> => {
  const res = await silentApi<{ data: NocNode[] }>("GET", `/noc/regions/${code}/nodes`);
  return res?.data ?? [];
};

const fetchVms = async (code: string): Promise<NocVm[]> => {
  const res = await silentApi<{ data: NocVm[] }>("GET", `/noc/regions/${code}/vms`);
  return res?.data ?? [];
};

const fetchVpcs = async (code: string): Promise<NocVpc[]> => {
  const res = await silentApi<{ data: NocVpc[] }>("GET", `/noc/regions/${code}/vpcs`);
  return res?.data ?? [];
};

const fetchTopology = async (code: string, vpcId: string) => {
  const res = await silentApi<{
    data: { nodes: unknown[]; edges: unknown[]; error?: string };
  }>("GET", `/noc/regions/${code}/topology/${vpcId}`);
  return res?.data ?? { nodes: [], edges: [] };
};

const forceRefreshRegion = async (code: string) => {
  const res = await api("POST", `/noc/regions/${code}/refresh`);
  if (!res) throw new Error(`Failed to refresh region ${code}`);
  return res;
};

// ───────────────────────── Hooks ─────────────────────────

export const useFetchNocRegions = (options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, "regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 15,
    refetchInterval: 1000 * 30, // map refreshes every 30s
    refetchOnWindowFocus: true,
    ...options,
  });
};

export const useFetchNocRegion = (code: string, options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, "region", code],
    queryFn: () => fetchRegion(code),
    enabled: Boolean(code),
    staleTime: 1000 * 15,
    ...options,
  });
};

export const useFetchNocAlarms = (
  code: string | null = null,
  state: string = "open",
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "alarms", code ?? "all", state],
    queryFn: () => fetchAlarms(code ?? undefined, state),
    staleTime: 1000 * 10,
    refetchInterval: 1000 * 20,
    ...options,
  });
};

export const useFetchNocNodes = (code: string, options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, "nodes", code],
    queryFn: () => fetchNodes(code),
    enabled: Boolean(code),
    staleTime: 1000 * 30,
    ...options,
  });
};

export const useFetchNocVms = (code: string, options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, "vms", code],
    queryFn: () => fetchVms(code),
    enabled: Boolean(code),
    staleTime: 1000 * 30,
    ...options,
  });
};

export const useFetchNocVpcs = (code: string, options: QueryHookOptions = {}) => {
  return useQuery({
    queryKey: [QUERY_KEY, "vpcs", code],
    queryFn: () => fetchVpcs(code),
    enabled: Boolean(code),
    staleTime: 1000 * 60,
    ...options,
  });
};

export const useFetchNocTopology = (
  code: string,
  vpcId: string,
  options: QueryHookOptions = {}
) => {
  return useQuery({
    queryKey: [QUERY_KEY, "topology", code, vpcId],
    queryFn: () => fetchTopology(code, vpcId),
    enabled: Boolean(code) && Boolean(vpcId),
    staleTime: 1000 * 60,
    ...options,
  });
};

export const useForceRefreshNocRegion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forceRefreshRegion,
    onSuccess: (_, code) => {
      // Backend returns 202 and enqueues; give the worker ~3s to land the
      // new snapshot, then invalidate so the UI refetches.
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "regions"] });
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "region", code] });
      }, 3000);
    },
    onError: (error: unknown) => {
      logger.error("Error refreshing NOC region:", error);
    },
  });
};
