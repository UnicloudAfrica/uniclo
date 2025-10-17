import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import {
  useDeleteTenantSubnet,
  useFetchTenantSubnets,
  useSyncTenantSubnets,
} from "../../../hooks/subnetHooks";
import AddSubnet from "../subnetComps/addSubnet";
// import DeleteSubnetModal from "../subnetComps/deleteSubnet";
// import ViewSubnetModal from "../subnetComps/viewSubnet";
import ToastUtils from "../../../utils/toastUtil";

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

const Subnets = ({ projectId = "", region = "" }) => {
  const { data: subnets, isFetching } = useFetchTenantSubnets(
    projectId,
    region
  );
  const { mutate: deleteSubnet, isPending: isDeleting } =
    useDeleteTenantSubnet();
  const { mutate: syncSubnets, isPending: isSyncing } = useSyncTenantSubnets();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [viewModal, setViewModal] = useState(null); // subnet object
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (subnet, subnetName) =>
    setDeleteModal({ subnet, subnetName });
  const closeDeleteModal = () => setDeleteModal(null);
  const openViewModal = (subnet) => setViewModal(subnet);
  const closeViewModal = () => setViewModal(null);

  // Pagination
  const totalItems = subnets?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubnets = subnets?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDelete = () => {
    if (!deleteModal) return;

    const { subnet } = deleteModal;
    const payload = { project_id: projectId, region: subnet.region };

    deleteSubnet(
      { id: subnet.id, payload },
      {
        onSuccess: () => closeDeleteModal(),
        onError: (err) => {
          console.error("Failed to delete subnet:", err);
          closeDeleteModal();
        },
      }
    );
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync subnets.");
      return;
    }

    syncSubnets(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Subnets synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync subnets:", err);
          ToastUtils.error(err?.message || "Failed to sync subnets.");
        },
      }
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Subnets...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-[10px] font-Outfit">
      <div className="flex justify-end items-center gap-3 mb-6">
        <button
          onClick={handleSync}
          disabled={isSyncing || !projectId}
          className="rounded-[30px] py-3 px-6 border border-[#288DD1] text-[#288DD1] bg-white font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync Subnets"}
        </button>
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add Subnet
        </button>
      </div>

      {currentSubnets && currentSubnets.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSubnets.map((subnet) => (
              <div
                key={subnet.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-medium text-gray-800 truncate pr-2"
                      title={subnet.name}
                    >
                      {subnet.name}
                    </h3>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(subnet)}
                        className="text-gray-400 hover:text-[#288DD1] transition-colors"
                        title="View Subnet Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(subnet, subnet.name)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Subnet"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>VPC ID: {subnet.vpc_id}</p>
                    <p>Region: {subnet.region}</p>
                    <p title={subnet.cidr_block}>
                      CIDR Block: {subnet.cidr_block}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-gray-500">State:</span>
                  <Badge text={subnet.state} />
                </div>
              </div>
            ))}
          </div>

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
        <p className="text-gray-500 text-sm">
          No Subnets found for this project.
        </p>
      )}

      {/* Placeholder for AddSubnet Modal */}
      <AddSubnet
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      />

      {/* Placeholder for DeleteSubnetModal */}
      {/* <DeleteSubnetModal isOpen={!!deleteModal} onClose={closeDeleteModal} subnetName={deleteModal?.subnetName || ""} onConfirm={handleDelete} isDeleting={isDeleting} /> */}

      {/* Placeholder for ViewSubnetModal */}
      {/* <ViewSubnetModal isOpen={!!viewModal} onClose={closeViewModal} subnet={viewModal} /> */}
    </div>
  );
};

export default Subnets;
