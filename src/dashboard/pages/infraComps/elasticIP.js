import { useEffect, useRef, useState } from "react";
import {
  useDeleteTenantElasticIp,
  useFetchTenantElasticIps,
  useSyncTenantElasticIps,
} from "../../../hooks/elasticIPHooks";
// import AddEip from "../eipComps/addEip";
import { Trash2 } from "lucide-react";
// import AddEip from "../eipComps/addEip";
import DeleteEipModal from "../eipComps/deleteEip";
import AssociateEipModal from "../eipComps/associateEip";
import DisassociateEipModal from "../eipComps/disassociateEip";
// import DeleteEipModal from "../eipComps/deleteEip";
import ToastUtils from "../../../utils/toastUtil";
import AddEip from "../eipComps/addEIp";

const EIPs = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: eips, isFetching } = useFetchTenantElasticIps(
    projectId,
    region
  );
  const { mutate: deleteElasticIp, isPending: isDeleting } =
    useDeleteTenantElasticIp();
  const { mutate: syncElasticIps, isPending: isSyncing } =
    useSyncTenantElasticIps();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { id, name }
  const [associateModal, setAssociateModal] = useState(null); // { eip }
  const [disassociateModal, setDisassociateModal] = useState(null); // { eip }
  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (eip) =>
    setDeleteModal({
      id: eip.id ?? eip.provider_resource_id,
      name: eip.address || eip.public_ip,
      allocationId: eip.provider_resource_id || eip.public_ip,
    });
  const closeDeleteModal = () => setDeleteModal(null);

  const handleDelete = () => {
    if (!deleteModal) return;
    const { id, allocationId } = deleteModal;
    const payload = {
      project_id: projectId,
      region: region,
      elastic_ip_id: allocationId,
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

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync Elastic IPs.");
      return;
    }

    syncElasticIps(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Elastic IPs synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync Elastic IPs:", err);
          ToastUtils.error(err?.message || "Failed to sync Elastic IPs.");
        },
      }
    );
  };

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    const count = Array.isArray(eips) ? eips.length : 0;
    if (lastCountRef.current !== count) {
      lastCountRef.current = count;
      onStatsUpdate?.(count);
    }
  }, [eips, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "eips") {
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
        <p>Loading EIPs...</p>
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
            {isSyncing ? "Syncing..." : "Sync Elastic IPs"}
          </button>
          <button
            onClick={openCreateModal}
            className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
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
                        onClick={() => openDeleteModal(eip)}
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
                  <div className="mt-4 pt-3 border-t flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => setAssociateModal({ eip })}
                      className="px-3 py-1 rounded-full border border-[#288DD1] text-[#288DD1] hover:bg-[#E6F2FA] transition-colors"
                    >
                      Associate
                    </button>
                    <button
                      onClick={() => setDisassociateModal({ eip })}
                      disabled={
                        !(
                          eip.associated_network_interface_id ||
                          eip.associated_instance_id
                        )
                      }
                      className="px-3 py-1 rounded-full border border-amber-500 text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Disassociate
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
      <AssociateEipModal
        isOpen={!!associateModal}
        onClose={() => setAssociateModal(null)}
        projectId={projectId}
        region={region}
        elasticIp={associateModal?.eip}
      />
      <DisassociateEipModal
        isOpen={!!disassociateModal}
        onClose={() => setDisassociateModal(null)}
        projectId={projectId}
        region={region}
        elasticIp={disassociateModal?.eip}
      />
    </>
  );
};

export default EIPs;
