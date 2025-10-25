import { useEffect, useMemo, useRef, useState } from "react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantNetworkInterfaces,
  useSyncTenantNetworkInterfaces,
  useDeleteTenantNetworkInterface,
} from "../../../hooks/eni";
import AddEniModal from "../ENIComps/addEni";
import DeleteEniModal from "../ENIComps/deleteEni";
import ManageEniSecurityGroupsModal from "../ENIComps/manageSecurityGroups";

const ENIs = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: enis, isFetching } = useFetchTenantNetworkInterfaces(
    projectId,
    region
  );
  const { mutate: syncEnis, isPending: isSyncing } =
    useSyncTenantNetworkInterfaces();
  const { mutate: deleteEni, isPending: isDeleting } =
    useDeleteTenantNetworkInterface();

  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [manageModal, setManageModal] = useState(null);
  const itemsPerPage = 6;

  const items = useMemo(() => (Array.isArray(enis) ? enis : []), [enis]);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = items.slice(startIndex, startIndex + itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync ENIs.");
      return;
    }

    syncEnis(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Network interfaces synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync network interfaces:", err);
          ToastUtils.error(
            err?.message || "Failed to sync network interfaces."
          );
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal?.eni) return;
    const eni = deleteModal.eni;
    const id = eni.id ?? eni.provider_resource_id;

    deleteEni(
      {
        id,
        payload: {
          project_id: projectId,
          region,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Network interface deleted.");
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete network interface:", err);
          ToastUtils.error(
            err?.message || "Failed to delete network interface."
          );
          setDeleteModal(null);
        },
      }
    );
  };

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    const count = Array.isArray(items) ? items.length : 0;
    if (lastCountRef.current !== count) {
      lastCountRef.current = count;
      onStatsUpdate?.(count);
    }
  }, [items, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "enis") {
      return;
    }
    if (lastActionToken.current === actionRequest.token) {
      return;
    }
    lastActionToken.current = actionRequest.token;

    if (actionRequest.type === "sync") {
      handleSync();
    } else if (actionRequest.type === "create") {
      setCreateModalOpen(true);
    }

    onActionHandled?.(actionRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest]);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Network Interfaces...</p>
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
          {isSyncing ? "Syncing..." : "Sync ENIs"}
        </button>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          disabled={!projectId}
        >
          Add ENI
        </button>
      </div>

      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((eni) => (
              <div
                key={eni.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow space-y-2 text-sm text-gray-500">
                  <h3
                    className="font-medium text-gray-800 truncate"
                    title={eni.provider_resource_id}
                  >
                    {eni.provider_resource_id}
                  </h3>
                  <p>
                    Provider:{" "}
                    {typeof eni.provider === "string" &&
                    eni.provider.trim() !== ""
                      ? eni.provider.toUpperCase()
                      : "N/A"}
                  </p>
                  <p>Region: {eni.region || "N/A"}</p>
                  <p>Private IP: {eni.private_ip_address || "N/A"}</p>
                  <p>Status: {eni.status || "unknown"}</p>
                  <p>
                    Security Groups:{" "}
                    {Array.isArray(eni.security_groups)
                      ? eni.security_groups.length
                      : 0}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => setManageModal({ eni })}
                    className="px-3 py-1 rounded-full border border-[#288DD1] text-[#288DD1] hover:bg-[#E6F2FA] transition-colors"
                  >
                    Manage Security Groups
                  </button>
                  <button
                    onClick={() => setDeleteModal({ eni })}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded-full border border-red-500 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Delete
                  </button>
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
          No Network Interfaces found for this project.
        </p>
      )}

      <AddEniModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        region={region}
      />
      <DeleteEniModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        eniName={
          deleteModal?.eni?.provider_resource_id || deleteModal?.eni?.id || ""
        }
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <ManageEniSecurityGroupsModal
        isOpen={!!manageModal}
        onClose={() => setManageModal(null)}
        projectId={projectId}
        region={region}
        eni={manageModal?.eni}
      />
    </div>
  );
};

export default ENIs;
