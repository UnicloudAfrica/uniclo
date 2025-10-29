import { useState } from "react";
import {
  useDeleteClientElasticIp,
  useFetchClientElasticIps,
} from "../../../hooks/clientHooks/elasticIPHooks";
import { Trash2 } from "lucide-react";
import AddEip from "../eipComps/addEip";
import DeleteEipModal from "../eipComps/deleteEip";

const EIPs = ({ projectId = "", region = "" }) => {
  const { data: eips, isFetching } = useFetchClientElasticIps(
    projectId,
    region
  );
  const { mutate: deleteElasticIp, isPending: isDeleting } =
    useDeleteClientElasticIp();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (id, name) => setDeleteModal({ id, name });
  const closeDeleteModal = () => setDeleteModal(null);

  const handleDelete = () => {
    if (!deleteModal) return;
    const { id, name } = deleteModal;
    const payload = {
      project_id: projectId,
      region: region,
      elastic_ip_id: id,
    };

    deleteElasticIp(
      { id, payload },
      {
        onSuccess: () => {
          closeDeleteModal();
        },
        onError: (err) => {
          console.error("Failed to delete EIP:", err);
          closeDeleteModal();
        },
      }
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination logic
  const totalItems = eips?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEips = eips?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <p>Loading EIPs...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 rounded-[10px] font-Outfit">
        <div className="flex justify-end items-center mb-6">
          <button
            onClick={openCreateModal}
            className="rounded-[30px] py-3 px-9 bg-[--theme-color] text-white font-normal text-base hover:bg-[--secondary-color] transition-colors"
          >
            Add EIP
          </button>
        </div>
        {currentEips && currentEips.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentEips.map((eip) => (
                <div
                  key={eip.id}
                  className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3
                        className="font-medium text-gray-800 truncate pr-2"
                        title={eip.address}
                      >
                        {eip.address}
                      </h3>
                      <button
                        onClick={() => openDeleteModal(eip.id, eip.address)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete Elastic IP"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p>
                        Provider:{" "}
                        {typeof eip.provider === "string" &&
                        eip.provider.trim() !== ""
                          ? eip.provider.toUpperCase()
                          : "N/A"}
                      </p>
                      <p>Region: {eip.region}</p>
                      <p>Pool ID: {eip.pool_id}</p>
                      <p>
                        Status: <span className="capitalize">{eip.status}</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
          <p className="text-gray-500">
            No Elastic IPs found for this project.
          </p>
        )}
      </div>
      <AddEip
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
        region={region}
      />
      <DeleteEipModal
        isOpen={!!deleteModal}
        onClose={closeDeleteModal}
        eipName={deleteModal?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default EIPs;
