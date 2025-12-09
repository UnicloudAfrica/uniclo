// @ts-nocheck
import { useMemo, useState } from "react";
import { Eye, Trash2, RefreshCw, ShieldCheck } from "lucide-react";
import {
  useFetchSecurityGroups,
  useDeleteSecurityGroup,
  syncSecurityGroupsFromProvider,
} from "../../../hooks/adminHooks/securityGroupHooks";
import AddSG from "../sgComps/addSG";
import DeleteSGModal from "../sgComps/deleteSG";
import ViewSGModal from "../sgComps/viewSGModal";
import { useQueryClient } from "@tanstack/react-query";
import ToastUtils from "../../../utils/toastUtil";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["active", "available", "in-use"].includes(normalized)) return "success";
  if (["pending", "creating", "syncing"].includes(normalized)) return "warning";
  if (["failed", "error"].includes(normalized)) return "danger";
  return "neutral";
};

const SecurityGroup = ({ projectId = "", region = "" }: any) => {
  const queryClient = useQueryClient();
  const { data: securityGroups, isFetching } = useFetchSecurityGroups(projectId, region);
  const { mutate: deleteSecurityGroup, isPending: isDeleting } = useDeleteSecurityGroup();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const totalItems = securityGroups?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const currentSecurityGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (securityGroups ?? []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [securityGroups, currentPage]);

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteSecurityGroup(deleteModal.id, {
      onSuccess: () => {
        setDeleteModal(null);
      },
      onError: (err) => {
        console.error("Failed to delete Security Group:", err);
        setDeleteModal(null);
      },
    });
  };

  const handleSync = async () => {
    if (!projectId) {
      ToastUtils.error("Project is required to sync security groups");
      return;
    }
    setIsSyncing(true);
    try {
      await syncSecurityGroupsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["securityGroups", { projectId, region }],
      });
      ToastUtils.success("Security groups synced successfully!");
    } catch (error) {
      console.error("Failed to sync Security Groups:", error);
      ToastUtils.error(error?.message || "Failed to sync security groups.");
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
      isDisabled={!projectId || isSyncing}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Security Groups"}
    </ModernButton>,
    <ModernButton key="add" variant="primary" size="sm" onClick={() => setCreateModal(true)}>
      Add Security Group
    </ModernButton>,
  ];

  const stats = useMemo(() => {
    const base = [
      {
        label: "Total Security Groups",
        value: totalItems,
        tone: totalItems ? "primary" : "neutral",
        icon: <ShieldCheck size={16} />,
      },
    ];
    if (region) {
      base.push({
        label: "Region",
        value: region,
        tone: "info",
      });
    }
    return base;
  }, [totalItems, region]);

  const renderSecurityGroupCard = (securityGroup: any) => {
    const inboundRules =
      securityGroup.ingress_rules?.length ??
      securityGroup.inbound_rules?.length ??
      securityGroup.rules?.inbound?.length ??
      0;
    const outboundRules =
      securityGroup.egress_rules?.length ??
      securityGroup.outbound_rules?.length ??
      securityGroup.rules?.outbound?.length ??
      0;
    const status = securityGroup.status || securityGroup.state || "Not specified";

    return (
      <ResourceListCard
        key={securityGroup.id}
        title={securityGroup.name || securityGroup.id}
        subtitle={securityGroup.id}
        metadata={[
          {
            label: "Region",
            value: securityGroup.region || region || "—",
          },
          {
            label: "Inbound Rules",
            value: inboundRules,
          },
          {
            label: "Outbound Rules",
            value: outboundRules,
          },
          securityGroup.description
            ? {
                label: "Description",
                value: securityGroup.description,
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
            key: "inspect",
            label: "Inspect",
            icon: <Eye size={16} />,
            variant: "ghost",
            onClick: () => setViewModal(securityGroup),
          },
          {
            key: "remove",
            label: "Remove",
            icon: <Trash2 size={16} />,
            variant: "danger",
            onClick: () =>
              setDeleteModal({
                id: securityGroup.id,
                name: securityGroup.name,
              }),
            disabled: isDeleting,
          },
        ]}
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Security Groups"
        description="Manage firewall rules that control inbound and outbound access to project resources."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {currentSecurityGroups.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentSecurityGroups.map(renderSecurityGroupCard)}
            </div>
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
            title="No Security Groups"
            message="Create a security group or sync from your cloud account to begin defining access policies."
            action={
              <ModernButton variant="primary" onClick={() => setCreateModal(true)}>
                New Security Group
              </ModernButton>
            }
          />
        )}
      </ResourceSection>

      <AddSG
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />
      <ViewSGModal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        securityGroup={viewModal}
      />
      <DeleteSGModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        securityGroupName={deleteModal?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default SecurityGroup;
