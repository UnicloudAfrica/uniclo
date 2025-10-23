import { useEffect, useRef, useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import {
  useDeleteTenantSecurityGroup,
  useFetchTenantSecurityGroups,
  useSyncTenantSecurityGroups,
} from "../../../hooks/securityGroupHooks";
import AddSG from "../sgComps/addSG";
import ViewSGModal from "../sgComps/viewSG";
import DeleteSGModal from "../sgComps/deleteSG";
import ToastUtils from "../../../utils/toastUtil";

const SecurityGroup = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: securityGroups, isFetching } =
    useFetchTenantSecurityGroups(projectId, region);
  const { mutate: deleteSecurityGroup, isPending: isDeleting } =
    useDeleteTenantSecurityGroup();
  const { mutate: syncSecurityGroups, isPending: isSyncing } =
    useSyncTenantSecurityGroups();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [viewModal, setViewModal] = useState(null); // securityGroup object
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Pagination logic
  const totalItems = securityGroups?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSecurityGroups =
    securityGroups?.slice(startIndex, endIndex) || [];

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteSecurityGroup(deleteModal.id, {
      onSuccess: () => {
        setDeleteModal(null);
      },
      onError: (err) => {
        console.error("Failed to delete Security Group:", err);
        setDeleteModal(null);
      },
    });
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync security groups.");
      return;
    }

    syncSecurityGroups(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Security groups synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync security groups:", err);
          ToastUtils.error(err?.message || "Failed to sync security groups.");
        },
      }
    );
  };

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (!isFetching) {
      const count = Array.isArray(securityGroups)
        ? securityGroups.length
        : 0;
      if (lastCountRef.current !== count) {
        lastCountRef.current = count;
        onStatsUpdate?.(count);
      }
    }
  }, [isFetching, securityGroups, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "securityGroups") {
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

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <p>Loading security groups...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 rounded-[10px] font-Outfit">
        <div className="flex justify-end items-center gap-3 mb-6">
          <button
            onClick={handleSync}
            disabled={isSyncing || !projectId}
            className="rounded-[30px] py-3 px-6 border border-[#288DD1] text-[#288DD1] bg-white font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSyncing ? "Syncing..." : "Sync Security Groups"}
          </button>
          <button
            onClick={openCreateModal}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          >
            Add SG
          </button>
        </div>
        {currentSecurityGroups && currentSecurityGroups.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentSecurityGroups.map((securityGroup) => (
                <div
                  key={securityGroup.id}
                  className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3
                        className="font-medium text-gray-800 truncate pr-2"
                        title={securityGroup.name}
                      >
                        {securityGroup.name}
                      </h3>
                      <div className="flex-shrink-0 flex items-center space-x-2">
                        <button
                          onClick={() => setViewModal(securityGroup)}
                          className="text-gray-400 hover:text-[#288DD1] transition-colors"
                          title="View Security Group Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({
                              id: securityGroup.id,
                              name: securityGroup.name,
                            })
                          }
                          disabled={isDeleting}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Security Group"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-500">
                      <p
                        className="truncate"
                        title={securityGroup.description || "No description"}
                      >
                        Description: {securityGroup.description || "N/A"}
                      </p>
                      <p>
                        Provider:{" "}
                        {typeof securityGroup.provider === "string" &&
                        securityGroup.provider.trim() !== ""
                          ? securityGroup.provider.toUpperCase()
                          : "N/A"}
                      </p>
                      <p>Region: {securityGroup.region}</p>
                      <p
                        className="truncate"
                        title={securityGroup.provider_resource_id}
                      >
                        Resource ID:{" "}
                        {securityGroup.provider_resource_id || "N/A"}
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
          <p className="text-gray-500">
            No security groups found for this project.
          </p>
        )}
      </div>
      {/* Placeholder for modals */}
      <AddSG
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      />
      <ViewSGModal
        isOpen={!!viewModal}
        onClose={() => setViewModal(null)}
        securityGroup={viewModal}
      />
      <DeleteSGModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        securityGroupName={deleteModal?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default SecurityGroup;
