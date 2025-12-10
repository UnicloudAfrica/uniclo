import { useEffect, useMemo, useRef, useState } from "react";
import { Link2, Link2Off, Plus, RefreshCw, Trash2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil.ts";
import {
  useFetchTenantInternetGateways,
  useSyncTenantInternetGateways,
  useDeleteTenantInternetGateway,
} from "../../../hooks/internetGatewayHooks";
import AddIgwModal from "../igwComps/addIGW";
import AttachIgwModal from "../igwComps/attachIGW";
import DeleteIgwModal from "../igwComps/deleteIGW";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "attached", "active"].includes(normalized)) return "success";
  if (["pending", "attaching", "detaching"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const IGWs = ({ projectId = "", region = "", actionRequest, onActionHandled, onStatsUpdate }) => {
  const { data: igws, isFetching } = useFetchTenantInternetGateways(projectId, region);
  const { mutate: syncInternetGateways, isPending: isSyncing } = useSyncTenantInternetGateways();
  const { mutate: deleteIgw, isPending: isDeleting } = useDeleteTenantInternetGateway();

  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [attachModal, setAttachModal] = useState(null);

  const items = useMemo(() => (Array.isArray(igws) ? igws : []), [igws]);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const attachedCount = useMemo(
    () => items.filter((igw) => Boolean(igw.attached_vpc_id || igw.vpc_id)).length,
    [items]
  );

  const stats = useMemo(() => {
    const summary = [
      { label: "Internet Gateways", value: totalItems, tone: totalItems ? "primary" : "neutral" },
      {
        label: "Attached",
        value: attachedCount,
        tone: attachedCount ? "success" : "neutral",
      },
    ];
    if (region) {
      summary.push({ label: "Region", value: region, tone: "info" });
    }
    return summary;
  }, [totalItems, attachedCount, region]);

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (!isFetching) {
      const count = Array.isArray(items) ? items.length : 0;
      if (lastCountRef.current !== count) {
        lastCountRef.current = count;
        onStatsUpdate?.(count);
      }
    }
  }, [items, isFetching, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "igws") {
      return;
    }
    if (lastActionToken.current === actionRequest.token) {
      return;
    }
    lastActionToken.current = actionRequest.token;

    if (actionRequest.type === "sync") {
      handleSync();
    } else if (actionRequest.type === "create") {
      setCreateModalOpen(true);
    }

    onActionHandled?.(actionRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest]);

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync IGWs.");
      return;
    }

    syncInternetGateways(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Internet Gateways synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync Internet Gateways:", err);
          ToastUtils.error(err?.message || "Failed to sync Internet Gateways.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal?.igw) return;
    const igw = deleteModal.igw;
    const providerId = igw.provider_resource_id || igw.id || igw.uuid || igw.name;

    deleteIgw(
      {
        id: igw.id ?? providerId,
        payload: {
          project_id: projectId,
          region,
          internet_gateway_id: providerId,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Internet Gateway deleted.");
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete IGW:", err);
          ToastUtils.error(err?.message || "Failed to delete IGW.");
          setDeleteModal(null);
        },
      }
    );
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const openAttachModal = (igw, mode = "attach") => {
    setAttachModal({ igw, mode });
  };

  const closeAttachModal = () => setAttachModal(null);

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
      {isSyncing ? "Syncing..." : "Sync IGWs"}
    </ModernButton>,
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      leftIcon={<Plus size={16} />}
      onClick={() => setCreateModalOpen(true)}
      isDisabled={!projectId}
    >
      Add IGW
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
      title="No Internet Gateways"
      message="Sync from your cloud account or create a gateway to expose VPC resources."
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            isDisabled={!projectId}
          >
            Add IGW
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            onClick={handleSync}
            isDisabled={isSyncing || !projectId}
            isLoading={isSyncing}
          >
            Sync IGWs
          </ModernButton>
        </div>
      }
    />
  );

  const renderCard = (igw) => {
    const name = igw.name || igw.label || igw.provider_resource_id || igw.id;
    const status = igw.status || igw.state || "unknown";
    const providerLabel =
      typeof igw.provider === "string" && igw.provider.trim() !== ""
        ? igw.provider.toUpperCase()
        : "—";
    const attachedVpc = igw.attached_vpc_id || igw.vpc_id || "Not attached";
    const publicIp = igw.public_ip || igw.meta?.public_ip || igw.meta?.router_ip;

    return (
      <ResourceListCard
        key={igw.id || name}
        title={name || "Internet Gateway"}
        subtitle={igw.id || igw.provider_resource_id || ""}
        metadata={[
          { label: "Provider", value: providerLabel },
          { label: "Region", value: igw.region || region || "—" },
          { label: "Attached VPC", value: attachedVpc },
          publicIp ? { label: "Edge Public IP", value: publicIp } : null,
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
            label: "Remove",
            icon: <Trash2 size={16} />,
            variant: "danger",
            onClick: () => setDeleteModal({ igw }),
            disabled: isDeleting,
          },
        ]}
        footer={
          <div className="flex flex-wrap gap-2">
            <ModernButton
              variant="outline"
              size="sm"
              leftIcon={<Link2 size={14} />}
              onClick={() => openAttachModal(igw, "attach")}
              isDisabled={!projectId || !region}
            >
              Attach
            </ModernButton>
            <ModernButton
              variant="outline"
              size="sm"
              leftIcon={<Link2Off size={14} />}
              onClick={() => openAttachModal(igw, "detach")}
              isDisabled={!projectId || !region || !igw.attached_vpc_id}
            >
              Detach
            </ModernButton>
          </div>
        }
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Internet Gateways"
        description="Manage gateways that expose your VPC networks to public connectivity."
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

      <AddIgwModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        region={region}
      />
      <AttachIgwModal
        isOpen={Boolean(attachModal)}
        onClose={closeAttachModal}
        igw={attachModal?.igw}
        mode={attachModal?.mode}
        projectId={projectId}
        region={region}
      />
      <DeleteIgwModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        igwName={
          deleteModal?.igw?.name ||
          deleteModal?.igw?.provider_resource_id ||
          deleteModal?.igw?.id ||
          ""
        }
        isDeleting={isDeleting}
      />
    </>
  );
};

export default IGWs;
