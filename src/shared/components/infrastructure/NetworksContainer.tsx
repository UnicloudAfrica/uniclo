/**
 * NetworksContainer — Shared component for displaying network segments.
 *
 * Replaces the near-identical networks.tsx in admin/tenant/client dashboards.
 * Uses `useApiContext()` to route API calls to the correct backend.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, RefreshCw, MapPin } from "lucide-react";
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import {
  ModernButton,
  StatusPill,
  ModernModal,
  ResourceSection,
  ResourceEmptyState,
  ResourceListCard,
} from "../ui";
import type { StatusTone } from "../ui/StatusPill";
import type { ModalAction } from "../ui/ModernModal";
import { designTokens } from "@/styles/designTokens";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";

type AnyRecord = Record<string, unknown>;

const ITEMS_PER_PAGE = 6;

interface NetworkRecord {
  id?: string | number;
  name?: string;
  cidr?: string;
  vpc_id?: string;
  region?: string;
  type?: string;
  status?: string;
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

interface NetworksContainerProps {
  projectId?: string;
  region?: string;
  onStatsUpdate?: (count: number) => void;
}

// ─── Utilities ───────────────────────────────────────────────────

const normalize = (value: unknown) => (value ? String(value).replace(/_/g, " ") : "").toLowerCase();

const getToneForStatus = (status: unknown): StatusTone => {
  const normalized = normalize(status);
  if (["active", "available"].includes(normalized)) return "success";
  if (["pending", "creating", "updating"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

// ─── Context-aware hooks ─────────────────────────────────────────

const useFetchNetworks = (
  projectId: string,
  region: string,
  options: Record<string, unknown> = {}
) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<AnyRecord>({
    queryKey: ["networks", context, { projectId, region }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("project_id", projectId);
      if (region) params.append("region", region);
      const qs = params.toString();
      const res = await entry.silentApi.get<Record<string, unknown>>(
        `${entry.urlPrefix}/networks${qs ? `?${qs}` : ""}`
      );
      return (res as Record<string, unknown>)?.data ?? res;
    },
    enabled: Boolean(projectId && region),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

// ─── Network Details Modal ───────────────────────────────────────

const NetworkDetailsModal = ({
  network,
  isOpen,
  onClose,
}: {
  network: NetworkRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const actions: ModalAction[] = [{ label: "Close", variant: "ghost", onClick: onClose }];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={network ? `Network \u2022 ${network.name || network.id}` : "Network"}
      size="lg"
      actions={actions}
      contentClassName="space-y-6"
    >
      {network ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                Network ID
              </p>
              <p
                className="font-medium text-sm break-all"
                style={{ color: designTokens.colors.neutral[800] }}
              >
                {String(network.id)}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                CIDR
              </p>
              <p
                className="font-medium text-sm"
                style={{ color: designTokens.colors.neutral[800] }}
              >
                {String(network.cidr || "\u2014")}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                Associated VPC
              </p>
              <p
                className="font-medium text-sm break-all"
                style={{ color: designTokens.colors.neutral[800] }}
              >
                {String(network.vpc_id || network?.meta?.vpc_id || "\u2014")}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                Type
              </p>
              <p
                className="font-medium text-sm capitalize"
                style={{ color: designTokens.colors.neutral[800] }}
              >
                {normalize(network.type || network?.meta?.network_type) || "\u2014"}
              </p>
            </div>
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                Lifecycle Status
              </p>
              <StatusPill
                label={String(network.status || "unknown")}
                tone={getToneForStatus(network.status)}
              />
            </div>
          </div>

          {network.meta && (
            <div className="space-y-3 rounded-2xl border border-dashed px-4 py-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Network Metadata
              </h3>
              <pre className="max-h-72 overflow-auto rounded-xl bg-slate-900/90 p-4 text-xs text-slate-100">
                {JSON.stringify(network.meta, null, 2)}
              </pre>
            </div>
          )}
        </>
      ) : (
        <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
          Network details are not available.
        </p>
      )}
    </ModernModal>
  );
};

// ─── Main Container ──────────────────────────────────────────────

const NetworksContainer = ({
  projectId = "",
  region = "",
  onStatsUpdate,
}: NetworksContainerProps) => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  const { data: networks, isFetching } = useFetchNetworks(projectId, region);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewNetwork, setViewNetwork] = useState<NetworkRecord | null>(null);

  const filteredNetworks = useMemo(() => {
    const list: NetworkRecord[] = Array.isArray(networks) ? networks : [];
    return list.filter((net) => (net.type || net?.meta?.network_type) === "vpc_network");
  }, [networks]);

  const totalItems = filteredNetworks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedNetworks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNetworks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNetworks, currentPage]);

  useEffect(() => {
    onStatsUpdate?.(filteredNetworks.length);
  }, [filteredNetworks, onStatsUpdate]);

  const stats = useMemo(() => {
    const uniqueVpcs = new Set(filteredNetworks.map((network) => network.vpc_id).filter(Boolean));
    const baseStats: {
      label: string;
      value: string | number;
      tone: StatusTone;
      icon?: React.ReactNode;
    }[] = [
      { label: "Total Networks", value: totalItems, tone: "info" },
      {
        label: "Connected VPCs",
        value: uniqueVpcs.size,
        tone: uniqueVpcs.size ? "info" : "neutral",
      },
    ];
    if (region) {
      baseStats.push({
        label: "Region",
        value: region,
        tone: "info",
        icon: <MapPin size={16} />,
      });
    }
    return baseStats;
  }, [filteredNetworks, totalItems, region]);

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Provide project and region to sync networks.");
      return;
    }
    setIsSyncing(true);
    try {
      const params = new URLSearchParams();
      params.append("project_id", projectId);
      params.append("region", region);
      params.append("refresh", "true");
      await entry.silentApi.get(`${entry.urlPrefix}/networks?${params.toString()}`);
      await queryClient.invalidateQueries({
        queryKey: ["networks", context, { projectId, region }],
      });
      ToastUtils.success("Networks synced successfully.");
    } catch (error) {
      logger.error("Error syncing networks:", error);
      ToastUtils.error(error instanceof Error ? error.message : "Failed to sync networks.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <>
      <ResourceSection
        title="Networks"
        description="Inspect the discovered networks that power your private connectivity."
        actions={[
          <ModernButton
            key="sync"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
            onClick={handleSync}
            isLoading={isSyncing}
            isDisabled={!projectId || !region || isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Networks"}
          </ModernButton>,
        ]}
        meta={stats}
        isLoading={isFetching}
      >
        {totalItems > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {paginatedNetworks.map((network, index) => {
                const networkId = network.id != null ? String(network.id) : "";
                return (
                  <ResourceListCard
                    key={networkId || `network-${index}`}
                    title={network.name || "Untitled network"}
                    subtitle={networkId || "Unknown ID"}
                    metadata={[
                      {
                        label: "Region",
                        value: String(network.region || region || "\u2014"),
                      },
                      {
                        label: "VPC",
                        value: String(network.vpc_id || network?.meta?.vpc_id || "\u2014"),
                      },
                      { label: "CIDR", value: String(network.cidr || "\u2014") },
                      {
                        label: "Type",
                        value: String(network.type || network?.meta?.network_type || "Unknown"),
                      },
                    ]}
                    statuses={[
                      {
                        label: String(network.status || "unknown"),
                        tone: getToneForStatus(network.status),
                      },
                    ]}
                    actions={[
                      {
                        key: "inspect",
                        label: "Inspect",
                        icon: <Eye size={16} />,
                        variant: "ghost",
                        onClick: () => setViewNetwork(network),
                      },
                    ]}
                  />
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </ModernButton>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </ModernButton>
              </div>
            )}
          </>
        ) : (
          <ResourceEmptyState
            title="No Networks Found"
            message="Sync your project to pull the networks configured for this environment."
            action={
              <ModernButton
                variant="primary"
                onClick={handleSync}
                isDisabled={!projectId || !region || isSyncing}
                isLoading={isSyncing}
              >
                Sync Networks
              </ModernButton>
            }
          />
        )}
      </ResourceSection>

      <NetworkDetailsModal
        network={viewNetwork}
        isOpen={Boolean(viewNetwork)}
        onClose={() => setViewNetwork(null)}
      />
    </>
  );
};

export default NetworksContainer;
