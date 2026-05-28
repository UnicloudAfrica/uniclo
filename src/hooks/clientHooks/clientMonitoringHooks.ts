/**
 * Client Monitoring Hooks — client-scoped view of the client's own monitored VMs.
 *
 * Returns the list of instances belonging to the calling client along with
 * their monitoring telemetry (status / last seen / latest CPU-mem-disk numbers)
 * and, where applicable, the operator-install command to copy/paste.
 *
 * Backend endpoint contract (mirrors the spec in CLAUDE.md before-claiming-done
 * checklist — "producer↔consumer comment"). The producer here is the BE
 * controller that reads from `monitoring_subscriptions` + `monitored_hosts` +
 * latest metrics sample. If the endpoint isn't live yet the hook still returns
 * a typed empty result, so the page renders the empty state instead of erroring.
 *
 *   GET /api/v1/business/monitoring/instances
 *   → { instances: ClientMonitoringInstance[] }
 */
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";

export interface ClientMonitoringMetrics {
  cpu_pct: number | null;
  memory_pct: number | null;
  disk_pct: number | null;
}

export interface ClientMonitoringDetail {
  status: string;
  last_seen_at: string | null;
  requires_operator_install: boolean;
  install_command: string | null;
  latest_metrics: ClientMonitoringMetrics | null;
}

export interface ClientMonitoringInstance {
  id: number | string;
  name: string;
  ip_address: string | null;
  /** `null` means monitoring is not enabled on this VM. */
  monitoring: ClientMonitoringDetail | null;
}

export interface ClientMonitoringResponse {
  instances: ClientMonitoringInstance[];
}

const EMPTY_RESPONSE: ClientMonitoringResponse = { instances: [] };

const fetchClientMonitoring = async (): Promise<ClientMonitoringResponse> => {
  try {
    const res = await clientSilentApi<ClientMonitoringResponse | { data?: ClientMonitoringResponse }>(
      "GET",
      "/business/monitoring/instances"
    );

    // Tolerate both `{ instances: [...] }` and `{ data: { instances: [...] } }`
    // shapes — the BE wrapping middleware is inconsistent across endpoints.
    const candidate = (res && typeof res === "object" && "data" in (res as object)
      ? (res as { data?: ClientMonitoringResponse }).data
      : res) as ClientMonitoringResponse | undefined;

    if (!candidate || !Array.isArray(candidate.instances)) {
      return EMPTY_RESPONSE;
    }
    return candidate;
  } catch {
    // Endpoint may not exist yet on BE — render the empty state instead of
    // bubbling a 404 toast to the user.
    return EMPTY_RESPONSE;
  }
};

type Opts = Omit<
  UseQueryOptions<ClientMonitoringResponse, Error>,
  "queryKey" | "queryFn"
>;

export const useClientMonitoring = (options: Opts = {}) =>
  useQuery<ClientMonitoringResponse, Error>({
    queryKey: ["clientMonitoring", "instances"],
    queryFn: fetchClientMonitoring,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    ...options,
  });
