// @ts-nocheck
import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Trash2, RefreshCw, Plus, Link2, Link2Off } from "lucide-react";
import {
  syncClientIgwsFromProvider,
  useDeleteClientIgw,
  useFetchClientIgws,
} from "../../../hooks/clientHooks/igwHooks";
import AddIgw from "../igwComps/AddIGW";
import DeleteIgwModal from "../igwComps/DeleteIGW";
import ViewIgwModal from "../igwComps/ViewIGW";
import AttachIgwModal from "../igwComps/AttachIGW";

import {
  ModernButton,
  StatusPill,
  ResourceSection,
  ResourceEmptyState,
  ResourceListCard,
} from "../../../shared/components/ui";
import ToastUtils from "../../../utils/toastUtil";

interface IGWsProps {
  projectId?: string;
  region?: string;
}

interface IGW {
  id: string;
  name?: string;
  label?: string;
  region?: string;
  status?: string;
  state?: string;
  attached_vpc_id?: string;
  public_ip?: string;
  tags?: Record<string, string>;
  meta?: {
    public_ip?: string;
    router_ip?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status: any = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "attached"].includes(normalized)) return "success";
  if (["pending", "attaching", "detaching"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const IGWs: React.FC<IGWsProps> = ({ projectId = "", region = "" }) => {
  const selectedRegion = region;
  const queryClient = useQueryClient();
  const { data: igws, isFetching: isFetchingIgws } = useFetchClientIgws(projectId, selectedRegion, {
    enabled: Boolean(selectedRegion),
  });
  const { mutate: deleteIgw, isPending: isDeleting } = useDeleteClientIgw();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ igw: IGW } | null>(null);
  const [viewModal, setViewModal] = useState<IGW | null>(null);
  const [attachModal, setAttachModal] = useState<{ igw: IGW; mode: "attach" | "detach" } | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const totalItems = igws?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentIgws = (igws || []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const attachedCount = (igws || []).filter((igw: IGW) => igw.attached_vpc_id).length;

  const stats = [
    { label: "Total IGWs", value: totalItems, tone: "primary" as const },
    {
      label: "Attached",
      value: attachedCount,
      tone: (attachedCount ? "success" : "neutral") as "success" | "neutral",
    },
    selectedRegion ? { label: "Region", value: selectedRegion, tone: "info" as const } : null,
  ].filter(Boolean);

  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (igw: IGW) => setDeleteModal({ igw });
  const closeDeleteModal = () => setDeleteModal(null);
  const openViewModal = (igw: IGW) => setViewModal(igw);
  const closeViewModal = () => setViewModal(null);
  const openAttachModal = (igw: IGW, mode: "attach" | "detach") => setAttachModal({ igw, mode });
  const closeAttachModal = () => setAttachModal(null);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDelete = () => {
    if (!deleteModal?.igw) return;

    const { igw } = deleteModal;
    const payload = { project_id: projectId, region: igw.region || region };

    deleteIgw(
      { id: igw.id, payload },
      {
        onSuccess: () => {
          ToastUtils.success("Internet Gateway deleted");
          closeDeleteModal();
        },
        onError: (err: any) => {
          ToastUtils.error(err?.message || "Failed to delete Internet Gateway");
          closeDeleteModal();
        },
      }
    );
  };

  const handleSyncIgws = async () => {
    if (!projectId || !selectedRegion) {
      ToastUtils.error("Project and region are required to sync IGWs");
      return;
    }
    setIsSyncing(true);
    try {
      await syncClientIgwsFromProvider({
        project_id: projectId,
        region: selectedRegion,
      });
      await queryClient.invalidateQueries({
        queryKey: ["clientIgws", { projectId, region: selectedRegion }],
      });
      ToastUtils.success("Internet Gateways synced successfully!");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to sync Internet Gateways.");
    } finally {
      setIsSyncing(false);
    }
  };

  const actions = [
    <ModernButton
      key="sync"
      onClick={handleSyncIgws}
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      isDisabled={isSyncing || !projectId || !selectedRegion}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync IGWs"}
    </ModernButton>,
    <ModernButton
      key="add"
      onClick={openCreateModal}
      variant="primary"
      size="sm"
      leftIcon={<Plus size={16} />}
      isDisabled={!projectId}
    >
      Add IGW
    </ModernButton>,
  ];

  const renderGatewayCard = (igw: IGW) => {
    const displayName =
      igw.name || igw.label || (igw.id ? `Gateway ${igw.id}` : "Internet Gateway");
    const status = igw.status || igw.state || "unknown";
    const attachedVpc = igw.attached_vpc_id || "None";
    const publicIp = igw.public_ip || igw.meta?.public_ip || igw.meta?.router_ip || null;

    const tags = igw.tags && Object.keys(igw.tags).length ? igw.tags : null;

    return (
      <ResourceListCard
        key={igw.id}
        title={displayName}
        subtitle={igw.id}
        metadata={
          [
            { label: "Region", value: igw.region || selectedRegion || "—" },
            { label: "Attached VPC", value: attachedVpc },
            publicIp
              ? {
                  label: "Edge Public IP",
                  value: publicIp,
                }
              : null,
          ].filter(Boolean) as any[]
        }
        statuses={[{ label: status, tone: getToneForStatus(status) as any }]}
        actions={[
          {
            key: "inspect",
            label: "Inspect",
            icon: <Eye size={16} />,
            variant: "ghost",
            onClick: () => openViewModal(igw),
          },
          {
            key: "remove",
            label: "Remove",
            icon: <Trash2 size={16} />,
            variant: "danger",
            onClick: () => openDeleteModal(igw),
            disabled: isDeleting,
          },
        ]}
        footer={
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <ModernButton
                variant="outline"
                size="xs"
                leftIcon={<Link2 size={14} />}
                onClick={() => openAttachModal(igw, "attach")}
                isDisabled={!projectId || !region}
              >
                Attach
              </ModernButton>
              <ModernButton
                variant="ghost"
                size="xs"
                className="text-red-500 hover:text-red-600"
                leftIcon={<Link2Off size={14} />}
                onClick={() => openAttachModal(igw, "detach")}
                isDisabled={!projectId || !region || !igw.attached_vpc_id}
              >
                Detach
              </ModernButton>
            </div>
            {tags ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(tags).map(([key, value]) => (
                  <StatusPill key={`${igw.id}-${key}`} label={`${key}: ${value}`} tone="neutral" />
                ))}
              </div>
            ) : null}
          </div>
        }
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Internet Gateways"
        description="Manage gateways that expose your VPC resources to the internet."
        actions={actions}
        meta={stats as any}
        isLoading={Boolean(selectedRegion && isFetchingIgws)}
      >
        {currentIgws && currentIgws.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentIgws.map(renderGatewayCard)}
            </div>

            {totalPages > 1 && (
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
            )}
          </>
        ) : (
          <ResourceEmptyState
            title="No Internet Gateways"
            message="Sync from your cloud account or create a new attachment to expose network resources."
            action={
              <ModernButton
                variant="primary"
                onClick={handleSyncIgws}
                isDisabled={isSyncing || !projectId || !selectedRegion}
                isLoading={isSyncing}
              >
                Sync IGWs
              </ModernButton>
            }
          />
        )}
      </ResourceSection>

      <AddIgw
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
        region={region}
      />
      <DeleteIgwModal
        isOpen={Boolean(deleteModal)}
        onClose={closeDeleteModal}
        igwName={deleteModal?.igw?.name || deleteModal?.igw?.id || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <ViewIgwModal isOpen={Boolean(viewModal)} onClose={closeViewModal} igw={viewModal} />
      <AttachIgwModal
        isOpen={Boolean(attachModal)}
        onClose={closeAttachModal}
        projectId={projectId}
        region={region}
        igw={attachModal?.igw}
        mode={attachModal?.mode}
      />
    </>
  );
};

export default IGWs;
