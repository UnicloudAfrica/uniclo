// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, MapPin, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  useFetchClientVpcs,
  useDeleteClientVpc,
  syncClientVpcsFromProvider,
} from "../../../hooks/clientHooks/vpcHooks";
import {
  ModernButton,
  ResourceSection,
  ResourceEmptyState,
  ResourceListCard,
} from "../../../shared/components/ui";
import AddTenantVpc from "../VpcComps/AddVpc";
import DeleteVpcModal from "../VpcComps/DeleteVpc";
import ViewVpcModal from "../VpcComps/ViewVpc";
import ToastUtils from "../../../utils/toastUtil";

interface VpcsProps {
  projectId?: string;
  region?: string;
}

interface Vpc {
  id: string;
  name?: string;
  region?: string;
  cidr_block?: string;
  is_default?: boolean;
  state?: string;
  status?: string;
  [key: string]: any;
}

const ITEMS_PER_PAGE = 6;

const normalizeStatus = (value: any) =>
  value ? value.toString().replace(/_/g, " ").toLowerCase() : "";

const getToneForStatus = (status: any) => {
  const normalized = normalizeStatus(status);
  if (["active", "available", "ready", "associated", "attached"].includes(normalized)) {
    return "success";
  }
  if (["pending", "creating", "syncing", "associating"].includes(normalized)) {
    return "warning";
  }
  if (["failed", "error", "deleting", "detached"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
};

const VPCs: React.FC<VpcsProps> = ({ projectId = "", region = "" }) => {
  const queryClient = useQueryClient();
  const { data: vpcData, isFetching } = useFetchClientVpcs(projectId, region);
  const { mutate: deleteVpc, isPending: isDeleting } = useDeleteClientVpc();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<Vpc | null>(null);
  const [viewModal, setViewModal] = useState<Vpc | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle both array and object response structures
  const vpcs = useMemo(() => {
    if (Array.isArray(vpcData)) return vpcData;
    if (vpcData && typeof vpcData === "object" && "data" in vpcData) return (vpcData as any).data;
    return [];
  }, [vpcData]);

  const totalItems = vpcs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentVpcs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (vpcs ?? []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [vpcs, currentPage]);

  const stats = useMemo(() => {
    const defaults = (vpcs ?? []).filter((item: Vpc) => item.is_default).length;
    const pending = (vpcs ?? []).filter((item: Vpc) =>
      ["pending", "creating", "syncing"].includes(normalizeStatus(item.state || item.status))
    ).length;
    const healthy = (vpcs ?? []).filter((item: Vpc) =>
      ["available", "active"].includes(normalizeStatus(item.state || item.status))
    ).length;

    const baseStats = [
      {
        label: "Total VPCs",
        value: totalItems,
        tone: "primary",
      },
      {
        label: "Healthy",
        value: healthy,
        tone: healthy ? "success" : "neutral",
      },
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
    ] as any[];

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

  const openDeleteModal = (vpc: Vpc) => setDeleteModal(vpc);
  const closeDeleteModal = () => setDeleteModal(null);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openViewModal = (vpc: Vpc) => setViewModal(vpc);
  const closeViewModal = () => setViewModal(null);

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Provide a project and region to sync VPCs.");
      return;
    }

    setIsSyncing(true);
    try {
      await syncClientVpcsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["clientVpcs", { projectId, region }],
      });
      ToastUtils.success("VPCs synced successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Unable to sync VPCs right now.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = () => {
    if (!deleteModal) return;

    deleteVpc(
      {
        id: deleteModal.id,
        payload: {
          project_id: projectId,
          region,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success(`Deleted VPC "${deleteModal.name || deleteModal.id}".`);
          queryClient.invalidateQueries({
            queryKey: ["clientVpcs", { projectId, region }],
          });
          closeDeleteModal();
        },
        onError: (error: any) => {
          ToastUtils.error(error?.message || "Failed to delete VPC.");
          closeDeleteModal();
        },
      }
    );
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
              {currentVpcs.map((vpc: Vpc) => (
                <ResourceListCard
                  key={vpc.id}
                  title={vpc.name || "Unnamed VPC"}
                  subtitle={vpc.id || "Unknown ID"}
                  metadata={[
                    { label: "Region", value: vpc.region || region || "—" },
                    { label: "CIDR", value: vpc.cidr_block || "—" },
                    {
                      label: "Default",
                      value: vpc.is_default ? "Yes" : "No",
                    },
                  ]}
                  statuses={
                    [
                      {
                        label: normalizeStatus(vpc.state) || "unknown",
                        tone: getToneForStatus(vpc.state) as any,
                      },
                      vpc.status
                        ? {
                            label: normalizeStatus(vpc.status) || "unknown",
                            tone: getToneForStatus(vpc.status) as any,
                          }
                        : null,
                    ].filter(Boolean) as any[]
                  }
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
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
            title="No VPCs yet"
            message="Create a VPC or sync from your cloud account to start structuring your project networks."
            action={
              <ModernButton
                variant="primary"
                leftIcon={<Plus size={16} />}
                onClick={openCreateModal}
              >
                Create VPC
              </ModernButton>
            }
          />
        )}
      </ResourceSection>

      <AddTenantVpc
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
        region={region}
      />
      <DeleteVpcModal
        isOpen={Boolean(deleteModal)}
        onClose={closeDeleteModal}
        vpcName={deleteModal?.name || deleteModal?.id || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <ViewVpcModal isOpen={Boolean(viewModal)} onClose={closeViewModal} vpc={viewModal} />
    </>
  );
};

export default VPCs;
