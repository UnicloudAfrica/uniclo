import { useMemo, useState } from "react";
import { Eye, MapPin, Plus, RefreshCw, Trash2 } from "lucide-react";
import ModernButton from "../../../adminDashboard/components/ModernButton";
import ResourceSection from "../../../adminDashboard/components/ResourceSection";
import ResourceEmptyState from "../../../adminDashboard/components/ResourceEmptyState";
import ResourceListCard from "../../../adminDashboard/components/ResourceListCard";
import {
  useFetchTenantVpcs,
  useDeleteTenantVpc,
  useSyncTenantVpcs,
} from "../../../hooks/vpcHooks";
import AddTenantVpc from "../VpcComps/addVpc";
import DeleteVpcModal from "../VpcComps/deleteVpc";
import ViewVpcModal from "../VpcComps/viewVpc";
import ToastUtils from "../../../utils/toastUtil";

const ITEMS_PER_PAGE = 6;

const normalizeStatus = (value) =>
  value ? value.toString().replace(/_/g, " ").toLowerCase() : "";

const getToneForStatus = (status) => {
  const normalized = normalizeStatus(status);
  if (
    ["active", "available", "ready", "associated", "attached"].includes(
      normalized
    )
  ) {
    return "success";
  }
  if (
    ["pending", "creating", "syncing", "associating"].includes(normalized)
  ) {
    return "warning";
  }
  if (["failed", "error", "deleting", "detached"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
};

const VPCs = ({ projectId = "", region = "" }) => {
  const { data: vpcs, isFetching } = useFetchTenantVpcs(projectId, region);
  const { mutate: deleteVpc, isPending: isDeleting } = useDeleteTenantVpc();
  const { mutate: syncVpcs, isPending: isSyncing } = useSyncTenantVpcs();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = vpcs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentVpcs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (vpcs ?? []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [vpcs, currentPage]);

  const stats = useMemo(() => {
    const defaults = (vpcs ?? []).filter((item) => item.is_default).length;
    const pending = (vpcs ?? []).filter((item) =>
      ["pending", "creating", "syncing"].includes(
        normalizeStatus(item.state || item.status)
      )
    ).length;
    const healthy = (vpcs ?? []).filter((item) =>
      ["available", "active"].includes(
        normalizeStatus(item.state || item.status)
      )
    ).length;

    const baseStats = [
      { label: "Total VPCs", value: totalItems, tone: "primary" },
      { label: "Healthy", value: healthy, tone: healthy ? "success" : "neutral" },
      {
        label: "Pending Actions",
        value: pending,
        tone: pending ? "warning" : "neutral",
      },
      {
        label: "Default VPCs",
        value: defaults,
        tone: defaults ? "info" : "neutral",
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
  }, [vpcs, totalItems, region]);

  const openDeleteModal = (vpc) => setDeleteModal(vpc);
  const closeDeleteModal = () => setDeleteModal(null);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openViewModal = (vpc) => setViewModal(vpc);
  const closeViewModal = () => setViewModal(null);

  const handleSync = () => {
    if (!projectId || !region) {
      ToastUtils.error("Provide a project and region to sync VPCs.");
      return;
    }

    syncVpcs(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("VPCs synced successfully.");
        },
        onError: (error) => {
          ToastUtils.error(error?.message || "Unable to sync VPCs right now.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal) return;

    deleteVpc(deleteModal.id, {
      onSuccess: () => {
        ToastUtils.success(
          `Deleted VPC "${deleteModal.name || deleteModal.id || "item"}".`
        );
        closeDeleteModal();
      },
      onError: (error) => {
        ToastUtils.error(error?.message || "Failed to delete VPC.");
        closeDeleteModal();
      },
    });
  };

  const actions = [
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isLoading={isSyncing}
      isDisabled={!projectId || !region || isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync VPCs"}
    </ModernButton>,
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      leftIcon={<Plus size={16} />}
      onClick={openCreateModal}
      isDisabled={!projectId}
    >
      Add VPC
    </ModernButton>,
  ];

  return (
    <>
      <ResourceSection
        title="Virtual Private Clouds"
        description="Segment your project networking into isolated address spaces that match your infrastructure topology."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {totalItems > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentVpcs.map((vpc) => (
                <ResourceListCard
                  key={vpc.id || vpc.uuid}
                  title={vpc.name || "Unnamed VPC"}
                  subtitle={vpc.id || vpc.uuid || "Unknown ID"}
                  metadata={[
                    { label: "Region", value: vpc.region || region || "—" },
                    { label: "CIDR", value: vpc.cidr_block || "—" },
                    {
                      label: "Default",
                      value: vpc.is_default ? "Yes" : "No",
                    },
                  ]}
                  statuses={[
                    vpc.state
                      ? {
                          label: normalizeStatus(vpc.state) || "unknown",
                          tone: getToneForStatus(vpc.state),
                        }
                      : null,
                    vpc.status
                      ? {
                          label: normalizeStatus(vpc.status) || "unknown",
                          tone: getToneForStatus(vpc.status),
                        }
                      : null,
                  ].filter(Boolean)}
                  actions={[
                    {
                      key: "inspect",
                      label: "Inspect",
                      icon: <Eye size={16} />,
                      variant: "ghost",
                      onClick: () => openViewModal(vpc),
                    },
                    {
                      key: "remove",
                      label: "Remove",
                      icon: <Trash2 size={16} />,
                      variant: "danger",
                      onClick: () => openDeleteModal(vpc),
                      disabled: isDeleting,
                    },
                  ]}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
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
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(totalPages, prev + 1)
                    )
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
            title="No VPCs yet"
            message="Create a VPC or sync from your cloud account to start structuring your project networks."
            action={
              <ModernButton
                onClick={openCreateModal}
                size="sm"
                leftIcon={<Plus size={16} />}
                isDisabled={!projectId}
              >
                Add your first VPC
              </ModernButton>
            }
          />
        )}
      </ResourceSection>

      <AddTenantVpc
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          projectId={projectId}
      />
      <DeleteVpcModal
        isOpen={Boolean(deleteModal)}
        onClose={closeDeleteModal}
        vpcName={deleteModal?.name || deleteModal?.id || "VPC"}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <ViewVpcModal
        isOpen={Boolean(viewModal)}
        onClose={closeViewModal}
        vpc={viewModal}
      />
    </>
  );
};

export default VPCs;
