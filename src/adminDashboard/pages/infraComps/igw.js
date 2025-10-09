import { useState, useEffect } from "react";
import { Eye, Trash2, RotateCw } from "lucide-react";
import { useFetchIgws, useDeleteIgw } from "../../../hooks/adminHooks/igwHooks";
import AddIgw from "../igwComps/addIGW";
import DeleteIgwModal from "../igwComps/deleteIGW";
import ViewIgwModal from "../igwComps/viewIGW";
import adminSilentApiforUser from "../../../index/admin/silentadminforuser";
import { useQueryClient } from "@tanstack/react-query";
import ToastUtils from "../../../utils/toastUtil";

const Badge = ({ text }) => {
  const badgeClasses = {
    attached: "bg-green-100 text-green-800",
    detached: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    available: "bg-blue-100 text-blue-800",
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

const IGWs = ({ projectId = "", region = "" }) => {
  const selectedRegion = region;
  const { data: igws, isFetching: isFetchingIgws } = useFetchIgws(
    projectId,
    selectedRegion,
    {
      enabled: !!selectedRegion,
    }
  );
  const { mutate: deleteIgw, isPending: isDeleting } = useDeleteIgw();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const queryClient = useQueryClient();
  const [deleteModal, setDeleteModal] = useState(null); // { igw }
  const [viewModal, setViewModal] = useState(null); // igw object
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {}, []);

  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (igw) => setDeleteModal({ igw });
  const closeDeleteModal = () => setDeleteModal(null);
  const openViewModal = (igw) => setViewModal(igw);
  const closeViewModal = () => setViewModal(null);

  // Pagination
  const totalItems = igws?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIgws = igws?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDelete = () => {
    if (!deleteModal) return;

    const { igw } = deleteModal;
    // The delete hook expects a payload. We'll assume it needs project_id and region.
    const payload = { project_id: projectId, region: igw.region };

    deleteIgw(
      { id: igw.id, payload },
      {
        onSuccess: () => { ToastUtils.success("Internet Gateway deleted"); closeDeleteModal(); },
        onError: (err) => { ToastUtils.error(err?.message || "Failed to delete Internet Gateway"); closeDeleteModal(); },
      }
    );
  };

  if (selectedRegion && isFetchingIgws) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Internet Gateways...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-[10px] font-Outfit">
      <div className="flex justify-between items-center mb-6">
        <div />
        <button
            onClick={async () => {
              try {
                if (!projectId || !selectedRegion) return;
                const params = new URLSearchParams();
                params.append("project_id", projectId);
                params.append("region", selectedRegion);
                params.append("refresh", "1");
                await adminSilentApiforUser("GET", `/business/internet-gateways?${params.toString()}`);
              } finally {
                queryClient.invalidateQueries({ queryKey: ["igws"] });
              }
            }}
            className="flex items-center gap-2 rounded-[30px] py-2 px-4 bg-white border text-gray-700 text-sm hover:bg-gray-50"
title="Refresh"
          >
            <RotateCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          >
            Add IGW
          </button>
        </div>
      </div>

      {currentIgws && currentIgws.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentIgws.map((igw) => (
              <div
                key={igw.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3
                      className="font-medium text-gray-800 truncate pr-2"
                      title={igw.name}
                    >
                      {igw.name || `igw-${igw.id}`}
                    </h3>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button
                        onClick={() => openViewModal(igw)}
                        className="text-gray-400 hover:text-[#288DD1] transition-colors"
                        title="View IGW Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(igw)}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Delete IGW"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p>Region: {igw.region}</p>
                    <p>
                      VPC Attached: {igw.attachments?.[0]?.vpc_id || "None"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="text-sm text-gray-500">State:</span>
                  <Badge text={igw.state} />
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
          No Internet Gateways found for this project.
        </p>
      )}

      <AddIgw isOpen={isCreateModalOpen} onClose={closeCreateModal} projectId={projectId} region={selectedRegion} />
      <DeleteIgwModal isOpen={!!deleteModal} onClose={closeDeleteModal} igwName={deleteModal?.igw?.name || `igw-${deleteModal?.igw?.id}`} onConfirm={handleDelete} isDeleting={isDeleting} />
      <ViewIgwModal isOpen={!!viewModal} onClose={closeViewModal} igw={viewModal} />
    </div>
  );
};

export default IGWs;
