// @ts-nocheck
import React, { useState, useMemo } from "react";
import { Eye, Trash2, RefreshCw } from "lucide-react";
import {
  useFetchClientSubnets,
  useDeleteClientSubnet,
  syncClientSubnetsFromProvider,
} from "../../../hooks/clientHooks/subnetHooks";
import AddSubnet from "../subnetComps/AddSubnet";
import { useQueryClient } from "@tanstack/react-query";
import DeleteSubnetModal from "../subnetComps/DeleteSubnet";
import ViewSubnetModal from "../subnetComps/ViewSubnet";
import ToastUtils from "../../../utils/toastUtil";
import {
  ResourceSection,
  ResourceEmptyState,
  ResourceListCard,
  ModernButton,
} from "../../../shared/components/ui";

interface SubnetsProps {
  projectId?: string;
  region?: string;
}

interface Subnet {
  id: string;
  name?: string;
  cidr_block?: string;
  cidr?: string;
  vpc_id?: string;
  region?: string;
  state?: string;
  status?: string;
  available_ip_address_count?: number;
  total_ip_address_count?: number;
  is_default?: boolean;
  availability_zone?: string;
  meta?: {
    available_ip_address_count?: number;
    total_ip_address_count?: number;
    is_default?: boolean;
    availability_zone?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status: any = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "active"].includes(normalized)) return "success";
  if (["pending", "associating", "provisioning"].includes(normalized)) return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const Subnets: React.FC<SubnetsProps> = ({ projectId = "", region = "" }) => {
  const { data: subnetData, isFetching } = useFetchClientSubnets(projectId, region);
  const { mutate: deleteSubnet, isPending: isDeleting } = useDeleteClientSubnet();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState<{ subnet: Subnet; subnetName: string } | null>(
    null
  );
  const [viewModal, setViewModal] = useState<Subnet | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const subnets = useMemo(() => {
    if (Array.isArray(subnetData)) return subnetData;
    if (subnetData && typeof subnetData === "object" && "data" in subnetData)
      return (subnetData as any).data;
    return [];
  }, [subnetData]);

  const totalItems = subnets?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSubnets = subnets?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];

  const handleDelete = () => {
    if (!deleteModal) return;
    const { subnet } = deleteModal;
    deleteSubnet(
      {
        id: subnet.id,
        payload: { project_id: projectId, region: subnet.region },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Subnet deleted");
          setDeleteModal(null);
        },
        onError: (err: any) => {
          ToastUtils.error(err?.message || "Failed to delete subnet");
          setDeleteModal(null);
        },
      }
    );
  };

  const handleSync = async () => {
    if (!projectId) {
      ToastUtils.error("Project is required to sync subnets");
      return;
    }

    setIsSyncing(true);
    try {
      await syncClientSubnetsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["clientSubnets", { projectId, region }],
      });
      ToastUtils.success("Subnets synced successfully!");
    } catch (error: any) {
      console.error("Failed to sync Subnets:", error);
      ToastUtils.error(error?.message || "Failed to sync subnets.");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncButton = (
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isLoading={isSyncing}
      isDisabled={isSyncing || !projectId}
    >
      {isSyncing ? "Syncing..." : "Sync Subnets"}
    </ModernButton>
  );

  const addButton = (
    <ModernButton key="add" variant="primary" size="sm" onClick={() => setCreateModal(true)}>
      Add Subnet
    </ModernButton>
  );

  return (
    <ResourceSection
      title="Subnets"
      description="Divide your VPC into IP ranges for tightly scoped workloads."
      actions={[syncButton, addButton]}
      isLoading={isFetching}
    >
      {currentSubnets.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {currentSubnets.map((subnet: Subnet) => {
              const displayName = subnet.name || subnet.cidr_block || `Subnet ${subnet.id}`;
              const cidr = subnet.cidr_block || subnet.cidr || "—";
              const vpcDisplay = subnet.vpc_id || "—";
              const status = (subnet.state || subnet.status || "unknown") ?? "unknown";
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
                  metadata={
                    [
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
                    ].filter(Boolean) as any[]
                  }
                  statuses={[{ label: status, tone: getToneForStatus(status) as any }]}
                  actions={[
                    {
                      key: "inspect",
                      label: "Inspect",
                      icon: <Eye size={16} />,
                      variant: "ghost",
                      onClick: () => setViewModal(subnet),
                    },
                    {
                      key: "remove",
                      label: "Remove",
                      icon: <Trash2 size={16} />,
                      variant: "danger",
                      onClick: () => setDeleteModal({ subnet, subnetName: displayName }),
                      disabled: isDeleting,
                    },
                  ]}
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
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
          title="No Subnets"
          message="Synchronize subnets from your cloud account or create a new subnet to allocate IP ranges."
          action={
            <ModernButton variant="primary" onClick={() => setCreateModal(true)}>
              Create Subnet
            </ModernButton>
          }
        />
      )}

      <AddSubnet
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />
      <ViewSubnetModal
        isOpen={Boolean(viewModal)}
        onClose={() => setViewModal(null)}
        subnet={viewModal}
      />
      <DeleteSubnetModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        subnetName={deleteModal?.subnetName || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </ResourceSection>
  );
};

export default Subnets;
