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

const Badge = ({ text }) => {
  const badgeClasses = {
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-green-100 text-green-800",
    available: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800",
  };
  const badgeClass = badgeClasses[text?.toLowerCase()] || badgeClasses.default;

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${badgeClass}`}>
      {text}
    </span>
  );
};

const Subnets = ({ projectId = "", region = "" }) => {
  const { data: subnets, isFetching } = useFetchSubnets(projectId, region);
  const { mutate: deleteSubnet, isPending: isDeleting } = useDeleteSubnet();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isSyncing, setIsSyncing] = useState(false);

  const totalItems = subnets?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentSubnets = subnets?.slice(startIndex, startIndex + itemsPerPage) || [];

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
    <button
      onClick={handleSync}
      disabled={isSyncing || !projectId}
      className="flex items-center gap-2 rounded-full py-2.5 px-5 bg-white border border-[#288DD1] text-[#288DD1] text-sm hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Sync subnets from cloud provider"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Subnets"}
    </button>
  );

  const addButton = (
    <button
      onClick={() => setCreateModal(true)}
      className="rounded-full py-3 px-9 bg-[#288DD1] text-white font-medium text-sm hover:bg-[#1976D2] transition-colors"
    >
      Add Subnet
    </button>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentSubnets.map((subnet) => {
              const displayName =
                subnet.name || subnet.provider_resource_id || subnet.cidr_block || "Subnet";
              const cidr = subnet.cidr_block || subnet.cidr || "—";
              const vpcDisplay = subnet.vpc_provider_id || subnet.vpc_id || "—";
              const status = (subnet.state || subnet.status || "unknown") ?? "unknown";
              const availableIps =
                subnet.available_ip_address_count ??
                subnet.meta?.available_ip_address_count ??
                "—";
              const totalIps =
                subnet.total_ip_address_count ??
                subnet.meta?.total_ip_address_count ??
                "—";
              const isDefault = subnet.is_default ?? subnet.meta?.is_default ?? false;

              return (
                <div
                  key={subnet.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-800 truncate pr-2" title={displayName}>
                        {displayName}
                      </h3>
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <button
                          onClick={() => setViewModal(subnet)}
                          className="text-gray-400 hover:text-[#288DD1] transition-colors"
                          title="View Subnet Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ subnet, subnetName: displayName })}
                          disabled={isDeleting}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Subnet"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>VPC ID: {vpcDisplay}</p>
                      <p>Region: {subnet.region || region || "—"}</p>
                      <p title={cidr}>CIDR Block: {cidr}</p>
                      <p>Available IPs: {availableIps}</p>
                      <p>Total IPs: {totalIps}</p>
                      <p>Default Subnet: {isDefault ? "Yes" : "No"}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-sm text-gray-500">State:</span>
                    <Badge text={status} />
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-full font-medium text-sm hover:bg-[#1976D2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-full font-medium text-sm hover:bg-[#1976D2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <ResourceEmptyState
          title="No Subnets"
          message="Sync from your provider or create a subnet to reserve IP addresses."
          action={addButton}
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
