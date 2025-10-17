import { useEffect, useRef, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import DeleteVpcModal from "../VpcComps/deleteVpc";
import ViewVpcModal from "../VpcComps/viewVpc";
import {
  useFetchTenantVpcs,
  useDeleteTenantVpc,
  useSyncTenantVpcs,
} from "../../../hooks/vpcHooks";
import AddTenantVpc from "../VpcComps/addVpc";

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
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${badgeClass}`}
    >
      {text}
    </span>
  );
};

const VPCs = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: vpcs, isFetching } = useFetchTenantVpcs(projectId, region);
  const { mutate: deleteVpc, isPending: isDeleting } = useDeleteTenantVpc();
  const { mutate: syncVpcs, isPending: isSyncing } = useSyncTenantVpcs();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { vpcId, vpcName } or null
  const [viewModal, setViewModal] = useState(null); // vpc object or null
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Number of VPCs per page

  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (vpcId, vpcName) =>
    setDeleteModal({ vpcId, vpcName });
  const closeDeleteModal = () => setDeleteModal(null);
  const openViewModal = (vpc) => setViewModal(vpc);
  const closeViewModal = () => setViewModal(null);

  // Pagination logic
  const totalItems = vpcs?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVpcs = vpcs?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync VPCs.");
      return;
    }

    syncVpcs(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("VPCs synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync VPCs:", err);
          ToastUtils.error(err?.message || "Failed to sync VPCs.");
        },
      }
    );
  };

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (isFetching) {
      return;
    }
    const list = Array.isArray(vpcs)
      ? vpcs
      : Array.isArray(vpcs?.data)
      ? vpcs.data
      : [];
    const count = list.length;
    if (lastCountRef.current !== count) {
      lastCountRef.current = count;
      onStatsUpdate?.(count);
    }
  }, [vpcs, onStatsUpdate, isFetching]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "vpcs") {
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

  const handleDelete = () => {
    if (!deleteModal) return;

    const { vpcId, vpcName } = deleteModal;
    deleteVpc(vpcId, {
      onSuccess: () => {
        // ToastUtils.success(`VPC "${vpcName}" deleted successfully!`);
        closeDeleteModal();
      },
      onError: (err) => {
        console.error("Failed to delete VPC:", err);
        // ToastUtils.error("Failed to delete VPC. Please try again.");
        closeDeleteModal();
      },
    });
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading VPCs...</p>
      </div>
    );
  }

  // console.log(
  //   "VPCs Data:",
  //   vpcs,
  //   "Current Page:",
  //   currentPage,
  //   "Total Pages:",
  //   totalPages
  // );

  return (
    <div className="bg-gray-50 rounded-[10px]  font-Outfit">
      <div className="flex justify-end items-center gap-3 mb-6">
        <button
          onClick={handleSync}
          disabled={isSyncing || !projectId}
          className="rounded-[30px] py-3 px-6 border border-[#288DD1] text-[#288DD1] bg-white font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync VPCs"}
        </button>
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add VPC
        </button>
      </div>

      {vpcs && vpcs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentVpcs.map((vpc) => (
              <div
                key={vpc.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-medium text-gray-800 truncate pr-2"
                      title={vpc.name}
                    >
                      {vpc.name}
                    </h3>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(vpc)}
                        className="text-gray-400 hover:text-[#288DD1] transition-colors"
                        title="View VPC Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(vpc.id, vpc.name)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete VPC"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Provider: {vpc.provider.toUpperCase()}</p>
                    <p>Region: {vpc.region}</p>
                    <p title={vpc.cidr_block}>CIDR Block: {vpc.cidr_block}</p>
                    <p>Default: {vpc.is_default ? "Yes" : "No"}</p>
                    <p>
                      State: <span className="capitalize">{vpc.state}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-gray-500">Status:</span>
                  <Badge text={vpc.status} />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-[30px] font-medium text-sm hover:bg-[#1976D2] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500 text-sm">No VPCs found for this project.</p>
      )}

      <AddTenantVpc
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      />

      <DeleteVpcModal
        isOpen={!!deleteModal}
        onClose={closeDeleteModal}
        vpcName={deleteModal?.vpcName || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />

      <ViewVpcModal
        isOpen={!!viewModal}
        onClose={closeViewModal}
        vpc={viewModal}
      />
    </div>
  );
};

export default VPCs;
