import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, RefreshCw, MapPin } from "lucide-react";
import {
  useFetchNetworks,
  syncNetworksFromProvider,
} from "../../../hooks/adminHooks/networkHooks";
import ModernButton from "../../components/ModernButton";
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";
import ResourceListCard from "../../components/ResourceListCard";
import StatusPill from "../../components/StatusPill";
import ModernModal from "../../components/ModernModal";
import { designTokens } from "../../../styles/designTokens";
import ToastUtils from "../../../utils/toastUtil";

const ITEMS_PER_PAGE = 6;

const normalize = (value) => (value ? value.toString().replace(/_/g, " ") : "").toLowerCase();

const getToneForStatus = (status) => {
  const normalized = normalize(status);
  if (["active", "available"].includes(normalized)) return "success";
  if (["pending", "creating", "updating"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const NetworkDetailsModal = ({ network, isOpen, onClose }) => {
  const actions = [
    {
      label: "Close",
      variant: "ghost",
      onClick: onClose,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={network ? `Network • ${network.name || network.id}` : "Network"}
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
                {network.id}
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
                {network.cidr || "—"}
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
                {network.vpc_id || "—"}
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
                {normalize(network.type) || "—"}
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
                label={network.status || "unknown"}
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
        <p
          className="text-sm"
          style={{ color: designTokens.colors.neutral[500] }}
        >
          Network details are not available.
        </p>
      )}
    </ModernModal>
  );
};

const Networks = ({ projectId = "", region = "" }) => {
  const queryClient = useQueryClient();
  const { data: networks, isFetching } = useFetchNetworks(projectId, region);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewNetwork, setViewNetwork] = useState(null);

  const filteredNetworks = useMemo(() => {
    return (networks || []).filter(
      (net) => (net.type || net?.meta?.network_type) === "vpc_network"
    );
  }, [networks]);

  const totalItems = filteredNetworks.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedNetworks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNetworks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNetworks, currentPage]);

  const stats = useMemo(() => {
    const uniqueVpcs = new Set(
      filteredNetworks.map((network) => network.vpc_id).filter(Boolean)
    );
    const baseStats = [
      {
        label: "Total Networks",
        value: totalItems,
        tone: "primary",
      },
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
      await syncNetworksFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["networks", { projectId, region }],
      });
      ToastUtils.success("Networks synced successfully.");
    } catch (error) {
      ToastUtils.error(error?.message || "Unable to sync networks.");
    } finally {
      setIsSyncing(false);
    }
  };

  const actions = [
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={!projectId || !region || isSyncing}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Networks"}
    </ModernButton>,
  ];

  const renderNetworkCard = (network) => (
    <ResourceListCard
      key={network.id}
      title={network.name || "Untitled network"}
      subtitle={network.id || "Unknown ID"}
      metadata={[
        { label: "CIDR", value: network.cidr || "—" },
        { label: "VPC", value: network.vpc_id || "—" },
        {
          label: "Type",
          value: normalize(network.type) || network.type || "—",
        },
      ]}
      statuses={[
        {
          label: network.status || "unknown",
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

  return (
    <>
      <ResourceSection
        title="Networks"
        description="Review network segments synchronized from your VPC environments."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {paginatedNetworks.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {paginatedNetworks.map(renderNetworkCard)}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
            message="Synchronize network information from your cloud account to inspect available address ranges."
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

export default Networks;
