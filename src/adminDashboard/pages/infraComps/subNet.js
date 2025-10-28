import { useState } from "react";
import { Eye, Trash2, RefreshCw } from "lucide-react";
import {
  useFetchSubnets,
  useDeleteSubnet,
  syncSubnetsFromProvider,
} from "../../../hooks/adminHooks/subnetHooks";
import AddSubnet from "../subnetComps/addSubnet";
import { useQueryClient } from "@tanstack/react-query";
import DeleteSubnetModal from "../subnetComps/deleteSubnet";
import ViewSubnetModal from "../subnetComps/viewSubnet";
import ToastUtils from "../../../utils/toastUtil";
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";
import ResourceListCard from "../../components/ResourceListCard";
import ModernButton from "../../components/ModernButton";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "active"].includes(normalized)) return "success";
  if (["pending", "associating", "provisioning"].includes(normalized))
    return "warning";
  if (["error", "failed"].includes(normalized)) return "danger";
  return "neutral";
};

const Subnets = ({ projectId = "", region = "" }) => {
  const { data: subnets, isFetching } = useFetchSubnets(projectId, region);
  const { mutate: deleteSubnet, isPending: isDeleting } = useDeleteSubnet();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);

  const totalItems = subnets?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSubnets =
    subnets?.slice(startIndex, startIndex + ITEMS_PER_PAGE) || [];

  const handleDelete = () => {
    if (!deleteModal) return;
    const { subnet } = deleteModal;
    deleteSubnet(
      { id: subnet.id, payload: { project_id: projectId, region: subnet.region } },
      {
        onSuccess: () => {
          ToastUtils.success("Subnet deleted");
          setDeleteModal(null);
        },
        onError: (err) => {
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
      await syncSubnetsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({ queryKey: ["subnets", { projectId, region }] });
      ToastUtils.success("Subnets synced successfully!");
    } catch (error) {
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
      onClick={() => setCreateModal(true)}
    >
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
            {currentSubnets.map((subnet) => {
              const displayName =
                subnet.name || subnet.cidr_block || `Subnet ${subnet.id}`;
              const cidr = subnet.cidr_block || subnet.cidr || "—";
              const vpcDisplay = subnet.vpc_id || "—";
              const status =
                (subnet.state || subnet.status || "unknown") ?? "unknown";
              const availableIps =
                subnet.available_ip_address_count ??
                subnet.meta?.available_ip_address_count ??
                "—";
              const totalIps =
                subnet.total_ip_address_count ??
                subnet.meta?.total_ip_address_count ??
                "—";
              const isDefault =
                subnet.is_default ?? subnet.meta?.is_default ?? false;
              const zone =
                subnet.availability_zone || subnet.meta?.availability_zone;

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
                    { label: status, tone: getToneForStatus(status) },
                  ]}
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
                      onClick: () =>
                        setDeleteModal({ subnet, subnetName: displayName }),
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
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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
          title="No Subnets"
          message="Sync from your cloud account or create a subnet to reserve IP addresses."
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

      <DeleteSubnetModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        subnetName={deleteModal?.subnetName || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <ViewSubnetModal isOpen={!!viewModal} onClose={() => setViewModal(null)} subnet={viewModal} />
    </ResourceSection>
  );
};

export default Subnets;
