import { useMemo, useState } from "react";
import {
  useFetchElasticIps,
  useDeleteElasticIp,
  syncElasticIpsFromProvider,
} from "../../../hooks/adminHooks/eipHooks";
import AddEip from "../eipComps/addEip";
import { Trash2, RefreshCw, MapPin, Activity } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import DeleteEipModal from "../eipComps/deleteEip";
import ToastUtils from "../../../utils/toastUtil";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";
import type {
  MetaItem as ResourceMetaItem,
  Tone,
} from "../../../shared/components/ui/ResourceSection";

const ITEMS_PER_PAGE = 6;

interface ElasticIpRecord {
  id?: string | number;
  address?: string;
  allocation_id?: string;
  association_id?: string;
  instance_id?: string;
  network_interface_id?: string;
  resource_id?: string;
  region?: string;
  pool_id?: string;
  created_at?: string;
  status?: string;
  [key: string]: unknown;
}

interface ResourceCardMetadata {
  label: string;
  value: string | number;
}

const getToneForStatus = (status = ""): Tone => {
  const normalized = status.toString().toLowerCase();
  if (["available", "released"].includes(normalized)) return "info";
  if (["in-use", "associated", "allocated"].includes(normalized)) return "success";
  if (["pending", "allocating"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const EIPs = ({ projectId = "", region = "" }: any) => {
  const { data: eipsData, isFetching } = useFetchElasticIps(projectId, region);
  const eips = useMemo<ElasticIpRecord[]>(
    () => (Array.isArray(eipsData) ? (eipsData as ElasticIpRecord[]) : []),
    [eipsData]
  );
  const { mutate: deleteElasticIp, isPending: isDeleting } = useDeleteElasticIp();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ id: string | number; name: string } | null>(
    null
  );
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (id: string | number, name: string) => setDeleteModal({ id, name });
  const closeDeleteModal = () => setDeleteModal(null);

  const handleDelete = () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    const payload = {
      project_id: projectId,
      region: region,
      elastic_ip_id: id,
    };

    deleteElasticIp(
      { id, payload },
      {
        onSuccess: () => {
          closeDeleteModal();
        },
        onError: (err) => {
          console.error("Failed to delete EIP:", err);
          closeDeleteModal();
        },
      }
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const totalItems = eips.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentEips = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return eips.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [eips, currentPage]);

  const availableCount = useMemo(
    () => eips.filter((eip) => (eip.status || "").toString().toLowerCase() === "available").length,
    [eips]
  );
  const allocatedCount = totalItems - availableCount;

  const stats = useMemo<ResourceMetaItem[]>(() => {
    const summary: ResourceMetaItem[] = [
      {
        label: "Elastic IPs",
        value: totalItems,
        tone: totalItems ? "primary" : "neutral",
        icon: <Activity size={16} />,
      },
      {
        label: "Allocated",
        value: allocatedCount,
        tone: allocatedCount ? "success" : "neutral",
      },
      {
        label: "Available",
        value: availableCount,
        tone: availableCount ? "info" : "neutral",
      },
    ];
    if (region) {
      summary.push({
        label: "Region",
        value: region,
        tone: "info",
        icon: <MapPin size={16} />,
      });
    }
    return summary;
  }, [totalItems, allocatedCount, availableCount, region]);

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Project and region are required to sync Elastic IPs");
      return;
    }
    setIsSyncing(true);
    try {
      await syncElasticIpsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["elasticIps", { projectId, region }],
      });
      ToastUtils.success("Elastic IPs synced successfully!");
    } catch (error) {
      console.error("Failed to sync Elastic IPs:", error);
      ToastUtils.error(error instanceof Error ? error.message : "Failed to sync Elastic IPs.");
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
      isDisabled={isSyncing || !projectId || !region}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Elastic IPs"}
    </ModernButton>,
    <ModernButton key="add" variant="primary" size="sm" onClick={openCreateModal}>
      Allocate Elastic IP
    </ModernButton>,
  ];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const renderCard = (eip: ElasticIpRecord) => {
    const status = eip.status || "unknown";
    const allocationId = eip.allocation_id ?? (eip.id != null ? String(eip.id) : undefined);
    const cardKey = eip.id ?? eip.allocation_id ?? eip.address ?? "eip";
    const association =
      eip.association_id || eip.instance_id || eip.network_interface_id || eip.resource_id || null;
    const attachedLabel = association ? association : "Not assigned";
    const metadata: ResourceCardMetadata[] = [
      { label: "Region", value: eip.region || region || "—" },
      { label: "Pool", value: eip.pool_id || "—" },
      { label: "Attached To", value: String(attachedLabel) },
    ];
    if (eip.created_at) {
      metadata.push({
        label: "Allocated",
        value: new Date(eip.created_at).toLocaleString(),
      });
    }

    const deleteId = eip.id ?? eip.allocation_id;

    return (
      <ResourceListCard
        key={cardKey}
        title={eip.address || "Elastic IP"}
        {...(allocationId ? { subtitle: allocationId } : {})}
        metadata={metadata}
        statuses={[
          {
            label: status,
            tone: getToneForStatus(status),
          },
        ]}
        actions={[
          {
            key: "delete",
            label: "Release",
            icon: <Trash2 size={16} />,
            variant: "danger",
            onClick: () => {
              if (deleteId == null) return;
              openDeleteModal(deleteId, eip.address ?? String(deleteId));
            },
            disabled: isDeleting || deleteId == null,
          },
        ]}
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Elastic IPs"
        description="Allocate and manage public IPv4 addresses for workloads that require stable internet reachability."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {currentEips.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentEips.map(renderCard)}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
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
                  onClick={handleNextPage}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </ModernButton>
              </div>
            )}
          </>
        ) : (
          <ResourceEmptyState
            title="No Elastic IPs"
            message="Sync from your cloud account or allocate a new Elastic IP address."
            action={
              <ModernButton variant="primary" onClick={openCreateModal}>
                Allocate Elastic IP
              </ModernButton>
            }
          />
        )}
      </ResourceSection>
      <AddEip
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
        region={region}
      />
      <DeleteEipModal
        isOpen={!!deleteModal}
        onClose={closeDeleteModal}
        eipName={deleteModal?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default EIPs;
