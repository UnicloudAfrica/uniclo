import { useState } from "react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantInternetGateways,
  useSyncTenantInternetGateways,
  useDeleteTenantInternetGateway,
} from "../../../hooks/internetGatewayHooks";
import AddIgwModal from "../igwComps/addIGW";
import AttachIgwModal from "../igwComps/attachIGW";
import DeleteIgwModal from "../igwComps/deleteIGW";

const IGWs = ({ projectId = "", region = "" }) => {
  const { data: igws, isFetching } = useFetchTenantInternetGateways(
    projectId,
    region
  );
  const { mutate: syncInternetGateways, isPending: isSyncing } =
    useSyncTenantInternetGateways();
  const { mutate: deleteIgw, isPending: isDeleting } =
    useDeleteTenantInternetGateway();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { igw }
  const [attachModal, setAttachModal] = useState(null); // { igw, mode }

  const items = igws || [];
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
      ToastUtils.error("Project context is required to sync IGWs.");
      return;
    }

    syncInternetGateways(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Internet Gateways synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync Internet Gateways:", err);
          ToastUtils.error(err?.message || "Failed to sync Internet Gateways.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal?.igw) return;
    const igw = deleteModal.igw;
    const providerId =
      igw.provider_resource_id || igw.id || igw.uuid || igw.name;

    deleteIgw(
      {
        id: igw.id ?? providerId,
        payload: {
          project_id: projectId,
          region,
          internet_gateway_id: providerId,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Internet Gateway deleted.");
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete IGW:", err);
          ToastUtils.error(err?.message || "Failed to delete IGW.");
          setDeleteModal(null);
        },
      }
    );
  };

  const openAttachModal = (igw, mode = "attach") => {
    setAttachModal({ igw, mode });
  };

  const closeAttachModal = () => setAttachModal(null);

  if (isFetching) {
    return (
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading Internet Gateways...</p>
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
          {isSyncing ? "Syncing..." : "Sync IGWs"}
        </button>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
          disabled={!projectId}
        >
          Add IGW
        </button>
      </div>

      {currentItems.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentItems.map((igw) => (
              <div
                key={igw.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 flex flex-col justify-between"
              >
                <div className="flex-grow space-y-1 text-sm text-gray-500">
                  <h3
                    className="font-medium text-gray-800 truncate"
                    title={igw.name || igw.provider_resource_id}
                  >
                    {igw.name || igw.provider_resource_id || "Unnamed IGW"}
                  </h3>
                  <p>Provider: {igw.provider?.toUpperCase() || "N/A"}</p>
                  <p>Region: {igw.region || "N/A"}</p>
                  <p>Status: {igw.status || "unknown"}</p>
                  <p>VPC: {igw.attached_vpc_id || "Not attached"}</p>
                </div>
                <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
                  <button
                    onClick={() => openAttachModal(igw, "attach")}
                    disabled={!projectId || !region}
                    className="px-3 py-1 rounded-full text-xs border border-[#288DD1] text-[#288DD1] hover:bg-[#E6F2FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Attach
                  </button>
                  <button
                    onClick={() => openAttachModal(igw, "detach")}
                    disabled={
                      !projectId ||
                      !region ||
                      !igw.attached_vpc_id ||
                      igw.attached_vpc_id === ""
                    }
                    className="px-3 py-1 rounded-full text-xs border border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Detach
                  </button>
                  <button
                    onClick={() => setDeleteModal({ igw })}
                    disabled={isDeleting}
                    className="px-3 py-1 rounded-full text-xs border border-red-500 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          No Internet Gateways found for this project.
        </p>
      )}
      <AddIgwModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        region={region}
      />
      <DeleteIgwModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        igwName={deleteModal?.igw?.name || deleteModal?.igw?.provider_resource_id || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
      <AttachIgwModal
        isOpen={!!attachModal}
        onClose={closeAttachModal}
        projectId={projectId}
        region={region}
        igw={attachModal?.igw}
        mode={attachModal?.mode}
      />
    </div>
  );
};

export default IGWs;
