import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import {
  useFetchTenantVpcs,
  useDeleteTenantVpc,
} from "../../../hooks/vpcHooks";
import ToastUtils from "../../../utils/toastUtil";

import AddTenantVpc from "../VpcComps/addVpc";

const VPCs = ({ projectId = "" }) => {
  const { data: vpcs, isFetching } = useFetchTenantVpcs(projectId);
  const { mutate: deleteVpc, isPending: isDeleting } = useDeleteTenantVpc();
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

  const handleDelete = () => {
    if (!deleteModal) return;

    const { vpcId, vpcName } = deleteModal;
    deleteVpc(
      { projectId, vpcId },
      {
        onSuccess: () => {
          ToastUtils.success(`VPC "${vpcName}" deleted successfully!`);
          closeDeleteModal();
        },
        onError: (err) => {
          console.error("Failed to delete VPC:", err);
          ToastUtils.error("Failed to delete VPC. Please try again.");
          closeDeleteModal();
        },
      }
    );
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
    <div className="bg-gray-50 rounded-[10px] p-6 font-Outfit">
      <div className="flex justify-end items-center mb-6">
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
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 w-full max-w-full relative"
              >
                <h3 className="font-medium text-gray-800">{vpc.name}</h3>
                <p className="text-sm text-gray-500 mt-1 break-words">
                  Provider: {vpc.provider.toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-1 break-words">
                  Region: {vpc.region}
                </p>
                <p
                  className="text-sm text-gray-500 mt-1 break-words"
                  title={vpc.cidr_block}
                >
                  CIDR Block: {vpc.cidr_block}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Default: {vpc.is_default ? "Yes" : "No"}
                </p>
                <p className="text-sm text-gray-500 mt-1">State: {vpc.state}</p>
                <div className="absolute top-2 right-2 flex space-x-2">
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

      {/* <DeleteVpcModal
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
      /> */}
    </div>
  );
};

export default VPCs;
