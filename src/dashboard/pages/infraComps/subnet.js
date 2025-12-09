import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, RefreshCw, Trash2 } from "lucide-react";
import {
  useDeleteTenantSubnet,
  useFetchTenantSubnets,
  useSyncTenantSubnets,
} from "../../../hooks/subnetHooks";
import AddSubnet from "../subnetComps/addSubnet";
import DeleteSubnetModal from "../subnetComps/deleteSubnet";
import ViewSubnetModal from "../subnetComps/viewSubnet";
import ToastUtils from "../../../utils/toastUtil.ts";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "active"].includes(normalized)) return "success";
  if (["pending", "associating", "provisioning"].includes(normalized)) {
    return "warning";
  }
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const Subnets = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: subnets, isFetching } = useFetchTenantSubnets(projectId, region);
  const { mutate: deleteSubnet, isPending: isDeleting } = useDeleteTenantSubnet();
  const { mutate: syncSubnets, isPending: isSyncing } = useSyncTenantSubnets();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = subnets?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentSubnets = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (subnets ?? []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [subnets, currentPage]);

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (!isFetching) {
      const count = Array.isArray(subnets) ? subnets.length : 0;
      if (lastCountRef.current !== count) {
        lastCountRef.current = count;
        onStatsUpdate?.(count);
      }
    }
  }, [isFetching, subnets, onStatsUpdate]);

  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (subnet, subnetName) => setDeleteModal({ subnet, subnetName });
  const closeDeleteModal = () => setDeleteModal(null);
  const openViewModal = (subnet) => setViewModal(subnet);
  const closeViewModal = () => setViewModal(null);

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync subnets.");
      return;
    }

    syncSubnets(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Subnets synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync subnets:", err);
          ToastUtils.error(err?.message || "Failed to sync subnets.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal) return;

    const { subnet } = deleteModal;
    const payload = { project_id: projectId, region: subnet.region };

    deleteSubnet(
      { id: subnet.id, payload },
      {
        onSuccess: () => closeDeleteModal(),
        onError: (err) => {
          console.error("Failed to delete subnet:", err);
          closeDeleteModal();
        },
      }
    );
  };

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "subnets") {
      return;
    }
    if (lastActionToken.current === actionRequest.token) {
      return;
    }
    lastActionToken.current = actionRequest.token;

    if (actionRequest.type === "sync") {
      handleSync();
    } else if (actionRequest.type === "create") {
      openCreateModal();
    }

    onActionHandled?.(actionRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const syncButton = (
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={isSyncing || !projectId}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Subnets"}
    </ModernButton>
  );

  const addButton = (
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      onClick={openCreateModal}
      isDisabled={!projectId}
    >
      Add Subnet
    </ModernButton>
  );

  const paginationControls =
    totalItems > ITEMS_PER_PAGE ? (
      <div className="mt-6 flex items-center justify-between">
        <ModernButton
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          isDisabled={currentPage === 1}
        >
          Previous
        </ModernButton>
        <span className="text-sm text-slate-500">
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
      title="No subnets discovered yet"
      message="Sync from your provider or create a subnet to divide the VPC into smaller ranges."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <ModernButton
            variant="primary"
            size="sm"
            onClick={openCreateModal}
            isDisabled={!projectId}
          >
            Add Subnet
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            onClick={handleSync}
            isDisabled={isSyncing || !projectId}
            isLoading={isSyncing}
          >
            Sync Subnets
          </ModernButton>
        </div>
      }
    />
  );

  const subnetCards = (
    <>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {currentSubnets.map((subnet) => {
          const displayName = subnet.name || subnet.cidr_block || `Subnet ${subnet.id}`;
          const cidr = subnet.cidr_block || subnet.cidr || "—";
          const vpcDisplay = subnet.vpc_id || "—";
          const status = subnet.state || subnet.status || "Unknown";
          const availableIps =
            subnet.available_ip_address_count ?? subnet.meta?.available_ip_address_count ?? "—";
          const totalIps =
            subnet.total_ip_address_count ?? subnet.meta?.total_ip_address_count ?? "—";
          const isDefault = subnet.is_default ?? subnet.meta?.is_default ?? false;
          const zone = subnet.availability_zone || subnet.meta?.availability_zone;

          return (
            <ResourceListCard
              key={subnet.id}
              title={displayName}
              subtitle={subnet.id}
              metadata={[
                { label: "CIDR", value: cidr },
                { label: "VPC", value: vpcDisplay },
                { label: "Region", value: subnet.region || region || "—" },
                zone
                  ? {
                      label: "Availability Zone",
                      value: zone,
                    }
                  : null,
                {
                  label: "Available IPs",
                  value: availableIps,
                },
                {
                  label: "Total IPs",
                  value: totalIps,
                },
                {
                  label: "Default Subnet",
                  value: isDefault ? "Yes" : "No",
                },
              ].filter(Boolean)}
              statuses={[
                {
                  label: status,
                  tone: getToneForStatus(status),
                },
              ]}
              actions={[
                {
                  key: "inspect",
                  label: "Inspect",
                  icon: <Eye size={16} />,
                  variant: "ghost",
                  onClick: () => openViewModal(subnet),
                },
                {
                  key: "remove",
                  label: "Remove",
                  icon: <Trash2 size={16} />,
                  variant: "danger",
                  onClick: () => openDeleteModal(subnet, displayName),
                  disabled: isDeleting,
                },
              ]}
            />
          );
        })}
      </div>
      {paginationControls}
    </>
  );

  return (
    <ResourceSection
      title="Subnets"
      description="Divide your VPC into IP ranges for tightly scoped workloads."
      actions={[syncButton, addButton]}
      isLoading={isFetching}
    >
      {currentSubnets.length > 0 ? subnetCards : emptyState}
      <AddSubnet
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
        region={region}
      />
      <DeleteSubnetModal
        isOpen={Boolean(deleteModal)}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        subnetName={deleteModal?.subnetName}
        isLoading={isDeleting}
      />
      <ViewSubnetModal subnet={viewModal} isOpen={Boolean(viewModal)} onClose={closeViewModal} />
    </ResourceSection>
  );
};

export default Subnets;
