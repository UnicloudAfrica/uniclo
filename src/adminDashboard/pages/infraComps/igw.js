import { useState } from "react";
import { Eye, Trash2, RefreshCw } from "lucide-react";
import { useFetchIgws, useDeleteIgw, syncIgwsFromProvider } from "../../../hooks/adminHooks/igwHooks";
import AddIgw from "../igwComps/addIGW";
import DeleteIgwModal from "../igwComps/deleteIGW";
import ViewIgwModal from "../igwComps/viewIGW";
import { useQueryClient } from "@tanstack/react-query";
import ToastUtils from "../../../utils/toastUtil";
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";

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
  const [isSyncing, setIsSyncing] = useState(false);

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

  const syncButton = (
    <button
      onClick={async () => {
        if (!projectId || !selectedRegion) {
          ToastUtils.error("Project and region are required to sync IGWs");
          return;
        }
        setIsSyncing(true);
        try {
          await syncIgwsFromProvider({ project_id: projectId, region: selectedRegion });
          await queryClient.invalidateQueries({ queryKey: ["igws", { projectId, region: selectedRegion }] });
          ToastUtils.success("Internet Gateways synced successfully!");
        } catch (error) {
          console.error("Failed to sync IGWs:", error);
          ToastUtils.error(error?.message || "Failed to sync Internet Gateways.");
        } finally {
          setIsSyncing(false);
        }
      }}
      disabled={isSyncing || !projectId || !selectedRegion}
      className="flex items-center gap-2 rounded-full py-2.5 px-5 bg-white border border-[#288DD1] text-[#288DD1] text-sm hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Sync Internet Gateways from cloud provider"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync IGWs"}
    </button>
  );

  const addButton = (
    <button
      onClick={openCreateModal}
      className="rounded-full py-3 px-9 bg-[#288DD1] text-white font-medium text-sm hover:bg-[#1976D2] transition-colors"
    >
      Add IGW
    </button>
  );

  return (
    <ResourceSection
      title="Internet Gateways"
      description="Manage gateways that expose your VPC resources to the internet."
      actions={[syncButton, addButton]}
      isLoading={Boolean(selectedRegion && isFetchingIgws)}
    >
      {currentIgws && currentIgws.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentIgws.map((igw) => {
              const displayName =
                igw.name ||
                igw.provider_resource_id ||
                `igw-${igw.id}`;
              const status = igw.status || igw.state || "unknown";
              const attachedVpc = igw.attached_vpc_id || "None";
              const tags = Array.isArray(igw.tags) ? igw.tags : [];

              return (
                <div
                  key={igw.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col justify-between"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3
                        className="font-medium text-gray-800 truncate pr-2"
                        title={displayName}
                      >
                        {displayName}
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
                      <p>Region: {igw.region || selectedRegion || "—"}</p>
                      <p title={attachedVpc}>
                        VPC Attached: {attachedVpc}
                      </p>
                      <p>
                        Provider ID: {igw.provider_resource_id || "—"}
                      </p>
                      {tags.length > 0 && (
                        <p className="truncate" title={tags.join(", ")}>
                          Tags: {tags.join(", ")}
                        </p>
                      )}
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
        <ResourceEmptyState
          title="No Internet Gateways"
          message="Sync from the provider or create one to allow outbound connectivity."
          action={addButton}
        />
      )}

      <AddIgw isOpen={isCreateModalOpen} onClose={closeCreateModal} projectId={projectId} region={selectedRegion} />
      <DeleteIgwModal
        isOpen={!!deleteModal}
        onClose={closeDeleteModal}
        igwName={deleteModal?.igw?.name || `igw-${deleteModal?.igw?.id}`}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <ViewIgwModal isOpen={!!viewModal} onClose={closeViewModal} igw={viewModal} />
    </ResourceSection>
  );
};

export default IGWs;
