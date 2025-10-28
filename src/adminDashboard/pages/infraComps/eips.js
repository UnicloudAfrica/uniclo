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
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";
import ResourceListCard from "../../components/ResourceListCard";
import ModernButton from "../../components/ModernButton";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "released"].includes(normalized)) return "info";
  if (["in-use", "associated", "allocated"].includes(normalized))
    return "success";
  if (["pending", "allocating"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const EIPs = ({ projectId = "", region = "" }) => {
  const { data: eips, isFetching } = useFetchElasticIps(projectId, region);
  const { mutate: deleteElasticIp, isPending: isDeleting } =
    useDeleteElasticIp();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (id, name) => setDeleteModal({ id, name });
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

  const totalItems = eips?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentEips = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (eips ?? []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [eips, currentPage]);

  const availableCount = useMemo(
    () =>
      (eips || []).filter(
        (eip) => (eip.status || "").toString().toLowerCase() === "available"
      ).length,
    [eips]
  );
  const allocatedCount = totalItems - availableCount;

  const stats = useMemo(() => {
    const summary = [
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
      ToastUtils.error(error?.message || "Failed to sync Elastic IPs.");
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
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      onClick={openCreateModal}
    >
      Allocate Elastic IP
    </ModernButton>,
  ];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const renderCard = (eip) => {
    const status = eip.status || "unknown";
    const allocationId = eip.allocation_id || eip.id;
    const association =
      eip.association_id ||
      eip.instance_id ||
      eip.network_interface_id ||
      eip.resource_id ||
      null;
    const attachedLabel = association ? association : "Not assigned";

    return (
      <ResourceListCard
        key={eip.id}
        title={eip.address || "Elastic IP"}
        subtitle={allocationId}
        metadata={[
          { label: "Region", value: eip.region || region || "—" },
          { label: "Pool", value: eip.pool_id || "—" },
          { label: "Attached To", value: attachedLabel },
          eip.created_at
            ? {
                label: "Allocated",
                value: new Date(eip.created_at).toLocaleString(),
              }
            : null,
        ].filter(Boolean)}
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
            onClick: () => openDeleteModal(eip.id, eip.address),
            disabled: isDeleting,
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
