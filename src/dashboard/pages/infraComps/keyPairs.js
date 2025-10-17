import { useState } from "react";
import { Trash2, X, Loader2 } from "lucide-react";
import {
  useDeleteTenantKeyPair,
  useFetchTenantKeyPairs,
  useSyncTenantKeyPairs,
} from "../../../hooks/keyPairsHook";
import AddKeyTenantPair from "../keyPairComps/addKeyPair";
import DeleteKeyPairModal from "../keyPairComps/deleteKeyPair";
import ToastUtils from "../../../utils/toastUtil";

const KeyPairs = ({ projectId = "", region = "" }) => {
  const { data: keyPairs, isFetching } = useFetchTenantKeyPairs(
    projectId,
    region
  );
  const { mutate: deleteKeyPair, isPending: isDeleting } =
    useDeleteTenantKeyPair();
  const { mutate: syncKeyPairs, isPending: isSyncing } =
    useSyncTenantKeyPairs();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null); // { keyPairId, keyPairName } or null
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Number of key pairs per page

  const openCreateModal = () => setCreateModal(true);
  const closeCreateModal = () => setCreateModal(false);
  const openDeleteModal = (keyPairId, keyPairName) =>
    setDeleteModal({ keyPairId, keyPairName });
  const closeDeleteModal = () => setDeleteModal(null);

  // Pagination logic
  const totalItems = keyPairs?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentKeyPairs = keyPairs?.slice(startIndex, endIndex) || [];

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

    const { keyPairId, keyPairName } = deleteModal;
    deleteKeyPair(keyPairId, {
      onSuccess: () => {
        // ToastUtils.success(`Key pair "${keyPairName}" deleted successfully!`);
        closeDeleteModal();
      },
      onError: (err) => {
        console.error("Failed to delete key pair:", err);
        // ToastUtils.error("Failed to delete key pair. Please try again.");
        closeDeleteModal();
      },
    });
  };

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync key pairs.");
      return;
    }

    syncKeyPairs(
      { project_id: projectId, region },
      {
        onSuccess: () => {
          ToastUtils.success("Key pairs synced with provider.");
        },
        onError: (err) => {
          console.error("Failed to sync key pairs:", err);
          ToastUtils.error(err?.message || "Failed to sync key pairs.");
        },
      }
    );
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center mt-6 bg-gray-50 rounded-[10px] font-Outfit">
        <p className="text-gray-500 text-sm">Loading key pairs...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-[10px] pfont-Outfit">
      <div className="flex justify-end items-center gap-3 mb-6">
        {/* <h2 className="text-lg font-semibold text-[#575758]">Key Pairs</h2> */}
        <button
          onClick={handleSync}
          disabled={isSyncing || !projectId}
          className="rounded-[30px] py-3 px-6 border border-[#288DD1] text-[#288DD1] bg-white font-normal text-base hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSyncing ? "Syncing..." : "Sync Key Pairs"}
        </button>
        <button
          onClick={openCreateModal}
          className="rounded-[30px] py-3 px-9 bg-[#288DD1] text-white font-normal text-base hover:bg-[#1976D2] transition-colors"
        >
          Add Key Pair
        </button>
      </div>

      {keyPairs && keyPairs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentKeyPairs.map((keyPair) => (
              <div
                key={keyPair.id}
                className="p-4 bg-white rounded-[10px] shadow-sm border border-gray-200 w-full max-w-full relative"
              >
                <h3 className="font-medium text-gray-800">{keyPair.name}</h3>
                <p
                  className="text-sm text-gray-500 mt-1 break-words"
                  title={keyPair.fingerprint}
                >
                  Fingerprint: {keyPair.fingerprint}
                </p>
                <button
                  onClick={() => openDeleteModal(keyPair.id, keyPair.name)}
                  disabled={isDeleting}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete Key Pair"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
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
        <p className="text-gray-500 text-sm">
          No key pairs found for this project.
        </p>
      )}

      <AddKeyTenantPair
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        projectId={projectId}
      />

      <DeleteKeyPairModal
        isOpen={!!deleteModal}
        onClose={closeDeleteModal}
        keyPairName={deleteModal?.keyPairName || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default KeyPairs;
