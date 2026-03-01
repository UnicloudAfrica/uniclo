import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, MapPin, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  useDeleteVpc,
  useFetchVpcs,
  syncVpcsFromProvider,
} from "../../../hooks/adminHooks/vcpHooks";
import { ModernButton } from "../../../shared/components/ui";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import AddVpc from "../vpcComps/addVpc";
import DeleteVpcModal from "../vpcComps/deleteVpc";
import ViewVpcModal from "../vpcComps/viewVpc";
import ToastUtils from "../../../utils/toastUtil";
import type { MetaItem, Tone } from "../../../shared/components/ui/ResourceSection";

const ITEMS_PER_PAGE = 6;

const normalizeStatus = (value: any) =>
  value ? value.toString().replace(/_/g, " ").toLowerCase() : "";

const getToneForStatus = (status: any): Tone => {
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

const VPCs = ({ projectId = "", region = "" }: any) => {
  const queryClient = useQueryClient();
  const { data: vpcs, isFetching } = useFetchVpcs(projectId, region);
  const { mutate: deleteVpc, isPending: isDeleting } = useDeleteVpc();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<any>(null); // stores vpc object
  const [viewModal, setViewModal] = useState<any>(null); // stores vpc object
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const vpcList = Array.isArray(vpcs) ? vpcs : [];
  const totalItems = vpcList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const currentVpcs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return vpcList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [vpcList, currentPage]);

  const stats = useMemo<MetaItem[]>(() => {
    const defaults = vpcList.filter((item: any) => item.is_default).length;
    const pending = vpcList.filter((item: any) =>
      ["pending", "creating", "syncing"].includes(normalizeStatus(item.state || item.status))
    ).length;
    const healthy = vpcList.filter((item: any) =>
      ["available", "active"].includes(normalizeStatus(item.state || item.status))
    ).length;

    const baseStats: MetaItem[] = [
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
  }, [vpcList, totalItems, region]);

  const openDeleteModal = (vpc: any) => setDeleteModal(vpc);
  const closeDeleteModal = () => setDeleteModal(null);
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openViewModal = (vpc: any) => setViewModal(vpc);
  const closeViewModal = () => setViewModal(null);

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Provide a project and region to sync VPCs.");
      return;
    }

    setIsSyncing(true);
    try {
      await syncVpcsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["vpcs", { projectId, region }],
      });
      ToastUtils.success("VPCs synced successfully.");
    } catch (error) {
      ToastUtils.error(error instanceof Error ? error.message : "Unable to sync VPCs right now.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteVpc(deleteModal.id, {
      onSuccess: () => {
        ToastUtils.success(`Deleted VPC "${deleteModal.name}".`);
        queryClient.invalidateQueries({
          queryKey: ["vpcs", { projectId, region }],
        });
        closeDeleteModal();
      },
      onError: (error) => {
        ToastUtils.error(error instanceof Error ? error.message : "Failed to delete VPC.");
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
              {currentVpcs.map((vpc: any, index: number) => {
                const vpcId = vpc.id != null ? String(vpc.id) : "";
                const cardKey = vpcId || vpc.cidr_block || vpc.name || `vpc-${index}`;
                const statuses: Array<{ label: string; tone?: Tone }> = [
                  {
                    label: normalizeStatus(vpc.state) || "unknown",
                    tone: getToneForStatus(vpc.state),
                  },
                ];
                if (vpc.status) {
                  statuses.push({
                    label: normalizeStatus(vpc.status) || "unknown",
                    tone: getToneForStatus(vpc.status),
                  });
                }

                return (
                  <ResourceListCard
                    key={cardKey}
                    title={vpc.name || "Unnamed VPC"}
                    subtitle={vpcId || "Unknown ID"}
                    metadata={[
                      { label: "Region", value: vpc.region || region || "—" },
                      { label: "CIDR", value: vpc.cidr_block || "—" },
                      {
                        label: "Default",
                        value: vpc.is_default ? "Yes" : "No",
                      },
                    ]}
                    statuses={statuses}
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
                );
              })}
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

      <AddVpc isOpen={isCreateModalOpen} onClose={closeCreateModal} projectId={projectId} />
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
