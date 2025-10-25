import { useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import {
  useFetchKeyPairs,
  useDeleteKeyPair,
  syncKeyPairsFromProvider,
} from "../../../hooks/adminHooks/keyPairHooks";
import AddKeyPair from "../keyPairComps/addKeyPairs";
import DeleteKeyPairModal from "../keyPairComps/deleteKeyPair";
import ToastUtils from "../../../utils/toastUtil";
import { useQueryClient } from "@tanstack/react-query";
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";

const KeyPairs = ({ projectId = "", region = "" }) => {
  const queryClient = useQueryClient();
  const { data: keyPairs, isFetching } = useFetchKeyPairs(projectId, region);
  const { mutate: deleteKeyPair, isPending: isDeleting } = useDeleteKeyPair();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const itemsPerPage = 6;

  const totalItems = keyPairs?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentKeyPairs = keyPairs?.slice(startIndex, startIndex + itemsPerPage) || [];

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteKeyPair(deleteModal.keyPairId, {
      onSuccess: () => setDeleteModal(null),
      onError: (err) => {
        console.error("Failed to delete key pair:", err);
        setDeleteModal(null);
      },
    });
  };

  const handleSync = async () => {
    if (!projectId) {
      ToastUtils.error("Project is required to sync key pairs");
      return;
    }
    setIsSyncing(true);
    try {
      await syncKeyPairsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({ queryKey: ["keyPairs", { projectId, region }] });
      ToastUtils.success("Key pairs synced successfully!");
    } catch (error) {
      console.error("Failed to sync key pairs:", error);
      ToastUtils.error(error?.message || "Failed to sync key pairs.");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncButton = (
    <button
      onClick={handleSync}
      disabled={isSyncing || !projectId}
      className="rounded-full py-2.5 px-5 bg-white border border-[#288DD1] text-[#288DD1] text-sm flex items-center gap-2 hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync Key Pairs"}
    </button>
  );

  const addButton = (
    <button
      onClick={() => setCreateModal(true)}
      className="rounded-full py-3 px-9 bg-[#288DD1] text-white font-medium text-sm hover:bg-[#1976D2] transition-colors"
    >
      Add Key Pair
    </button>
  );

  return (
    <ResourceSection
      title="Key Pairs"
      description="Secure SSH access to your compute resources."
      actions={[syncButton, addButton]}
      isLoading={isFetching}
    >
      {currentKeyPairs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentKeyPairs.map((keyPair) => (
              <div
                key={keyPair.id}
                className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative"
              >
                <h3 className="font-medium text-gray-800">{keyPair.name}</h3>
                <p className="text-sm text-gray-500 mt-1 break-words" title={keyPair.fingerprint}>
                  Fingerprint: {keyPair.fingerprint}
                </p>
                <button
                  onClick={() => setDeleteModal({ keyPairId: keyPair.id, keyPairName: keyPair.name })}
                  disabled={isDeleting}
                  className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete Key Pair"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-full text-sm font-medium hover:bg-[#1976D2] disabled:opacity-50"
              >
                Previous
              </button>
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#288DD1] text-white rounded-full text-sm font-medium hover:bg-[#1976D2] disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <ResourceEmptyState
          title="No Key Pairs"
          message="Sync existing key pairs from the provider or create a new one to enable secure logins."
          action={addButton}
        />
      )}

      <AddKeyPair
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />

      <DeleteKeyPairModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        keyPairName={deleteModal?.keyPairName || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </ResourceSection>
  );
};

export default KeyPairs;
