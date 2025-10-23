import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import DeleteVpcModal from "../VpcComps/deleteVpc";
import ViewVpcModal from "../VpcComps/viewVpc";
import {
  useFetchClientVpcs,
  useDeleteClientVpc,
} from "../../../hooks/clientHooks/vpcHooks";
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

const VPCs = ({ projectId = "", region = "" }) => {
  const { data: vpcs, isFetching } = useFetchClientVpcs(projectId, region);
  const { mutate: deleteVpc, isPending: isDeleting } = useDeleteClientVpc();
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

    const { vpcId } = deleteModal;
    const payload = {
      project_id: projectId,
      region: region,
    };

    deleteVpc(
      { id: vpcId, payload },
      {
        onSuccess: () => {
          closeDeleteModal();
        },
        onError: (err) => {
          console.error("Failed to delete VPC:", err);
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

  return (
    <div className="bg-gray-50 rounded-[10px]  font-Outfit">
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[--theme-color] text-white font-normal text-base hover:bg-[--secondary-color] transition-colors"
        >
          Add VPC
        </button>
      </div>

      {currentVpcs && currentVpcs.length > 0 ? (
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
                        className="text-gray-400 hover:text-[--theme-color] transition-colors"
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
                    <p>
                      Provider:{" "}
                      {typeof vpc.provider === "string" && vpc.provider.trim() !== ""
                        ? vpc.provider.toUpperCase()
                        : "N/A"}
                    </p>
                    <p>Region: {vpc.region}</p>
                    <p title={vpc.cidr_block}>CIDR Block: {vpc.cidr_block}</p>
                    <p>Default: {vpc.is_default ? "Yes" : "No"}</p>
                    <p>
                      State:{" "}
                      <span className="capitalize">{vpc.state || "N/A"}</span>
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
                className="px-4 py-2 bg-[--theme-color] text-white rounded-[30px] font-medium text-sm hover:bg-[--secondary-color] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[--theme-color] text-white rounded-[30px] font-medium text-sm hover:bg-[--secondary-color] disabled:opacity-50 disabled:cursor-not-allowed"
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
        region={region}
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
