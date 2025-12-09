import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Link2, Link2Off, MapPin, RefreshCw, Trash2 } from "lucide-react";
import {
  useDeleteTenantElasticIp,
  useFetchTenantElasticIps,
  useSyncTenantElasticIps,
} from "../../../hooks/elasticIPHooks";
import ToastUtils from "../../../utils/toastUtil.ts";
import AddEip from "../eipComponents/addEip";
import DeleteEipModal from "../eipComponents/deleteEip";
import AssociateEipModal from "../eipComponents/associateEip";
import DisassociateEipModal from "../eipComponents/disassociateEip";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["in-use", "associated", "allocated"].includes(normalized)) return "success";
  if (["available", "released"].includes(normalized)) return "info";
  if (["pending", "allocating"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const EIPs = ({ projectId = "", region = "", actionRequest, onActionHandled, onStatsUpdate }) => {
  const { data: eips, isFetching } = useFetchTenantElasticIps(projectId, region);
  const { mutate: deleteElasticIp, isPending: isDeleting } = useDeleteTenantElasticIp();
  const { mutate: syncElasticIps, isPending: isSyncing } = useSyncTenantElasticIps();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [associateModal, setAssociateModal] = useState(null);
  const [disassociateModal, setDisassociateModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const list = useMemo(() => (Array.isArray(eips) ? eips : []), [eips]);
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [list, currentPage]);

  const availableCount = useMemo(
    () => list.filter((eip) => (eip.status || "").toString().toLowerCase() === "available").length,
    [list]
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
      summary.push({ label: "Region", value: region, tone: "info", icon: <MapPin size={16} /> });
    }
    return summary;
  }, [totalItems, allocatedCount, availableCount, region]);

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (!isFetching) {
      if (lastCountRef.current !== list.length) {
        lastCountRef.current = list.length;
        onStatsUpdate?.(list.length);
      }
    }
  }, [list, isFetching, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "eips") {
      return;
    }
    if (lastActionToken.current === actionRequest.token) {
      return;
    }
    lastActionToken.current = actionRequest.token;

    if (actionRequest.type === "sync") {
      handleSync();
    } else if (actionRequest.type === "create") {
      setCreateModal(true);
    }

    onActionHandled?.(actionRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest]);

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync Elastic IPs.");
      return;
    }

    syncElasticIps(
      { project_id: projectId, region },
      {
        onSuccess: () => ToastUtils.success("Elastic IPs synced with provider."),
        onError: (err) => {
          console.error("Failed to sync Elastic IPs:", err);
          ToastUtils.error(err?.message || "Failed to sync Elastic IPs.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    const { id, allocationId } = deleteModal;
    const payload = {
      project_id: projectId,
      region,
      elastic_ip_id: allocationId,
    };

    deleteElasticIp(
      { id, payload },
      {
        onSuccess: () => {
          ToastUtils.success("Elastic IP released");
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete EIP:", err);
          ToastUtils.error(err?.message || "Failed to release Elastic IP.");
          setDeleteModal(null);
        },
      }
    );
  };

  const openDeleteModal = (eip) => {
    setDeleteModal({
      id: eip.id ?? eip.provider_resource_id,
      allocationId: eip.provider_resource_id || eip.public_ip,
      name: eip.address || eip.public_ip,
    });
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const actions = [
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={isSyncing || !projectId}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Elastic IPs"}
    </ModernButton>,
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      onClick={() => setCreateModal(true)}
      isDisabled={!projectId}
    >
      Allocate Elastic IP
    </ModernButton>,
  ];

  const paginationControls =
    totalItems > ITEMS_PER_PAGE ? (
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
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
    ) : null;

  const emptyState = (
    <ResourceEmptyState
      title="No Elastic IPs"
      message="Sync from your provider or allocate an elastic IP to expose workloads."
      action={
        <ModernButton
          variant="primary"
          size="sm"
          onClick={() => setCreateModal(true)}
          isDisabled={!projectId}
        >
          Allocate Elastic IP
        </ModernButton>
      }
    />
  );

  const renderCard = (eip) => {
    const status = eip.status || "unknown";
    const allocationId = eip.provider_resource_id || eip.id;
    const association =
      eip.associated_network_interface_id ||
      eip.associated_instance_id ||
      eip.network_interface_id ||
      eip.instance_id ||
      null;
    const associatedLabel = association ? association : "Not assigned";

    return (
      <ResourceListCard
        key={eip.id}
        title={eip.address || eip.public_ip || "Elastic IP"}
        subtitle={allocationId}
        metadata={[
          { label: "Region", value: eip.region || region || "—" },
          { label: "Pool", value: eip.pool_id || "—" },
          { label: "Attached To", value: associatedLabel },
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
            onClick: () => openDeleteModal(eip),
            disabled: isDeleting,
          },
        ]}
        footer={
          <div className="flex flex-wrap gap-2">
            <ModernButton
              variant="outline"
              size="sm"
              leftIcon={<Link2 size={14} />}
              onClick={() => setAssociateModal({ eip })}
              isDisabled={!projectId}
            >
              Associate
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              leftIcon={<Link2Off size={14} />}
              onClick={() => setDisassociateModal({ eip })}
              isDisabled={!(association && projectId)}
            >
              Disassociate
            </ModernButton>
          </div>
        }
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Elastic IPs"
        description="Allocate and manage public IP addresses for compute workloads."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {currentItems.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentItems.map(renderCard)}
            </div>
            {paginationControls}
          </>
        ) : (
          emptyState
        )}
      </ResourceSection>

      <AddEip
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />
      <DeleteEipModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        eipName={deleteModal?.name || ""}
        isDeleting={isDeleting}
      />
      <AssociateEipModal
        isOpen={Boolean(associateModal)}
        onClose={() => setAssociateModal(null)}
        projectId={projectId}
        region={region}
        elasticIp={associateModal?.eip || null}
      />
      <DisassociateEipModal
        isOpen={Boolean(disassociateModal)}
        onClose={() => setDisassociateModal(null)}
        projectId={projectId}
        region={region}
        elasticIp={disassociateModal?.eip || null}
      />
    </>
  );
};

export default EIPs;
