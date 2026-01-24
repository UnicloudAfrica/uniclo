import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, MapPin, RefreshCw, Trash2 } from "lucide-react";
import { useApiContext } from "../../../hooks/useApiContext";
import {
  keyPairsKeys,
  useDeleteKeyPair,
  useFetchKeyPairs,
  useSyncKeyPairs,
} from "../../hooks/keyPairsHooks";
import { ModernButton, ResourceEmptyState, ResourceListCard, ResourceSection } from "../ui";
import ToastUtils from "../../../utils/toastUtil";
import KeyPairCreateModal from "./KeyPairCreateModal";
import KeyPairDeleteModal from "./KeyPairDeleteModal";

interface KeyPairsSectionProps {
  projectId?: string;
  region?: string;
  onStatsUpdate?: (count: number) => void;
  itemsPerPage?: number;
  showRegionSelect?: boolean;
}

interface DeleteModalState {
  id: string;
  name: string;
}

interface KeyPair {
  id: string;
  name: string;
  fingerprint?: string;
  region?: string;
  created_at?: string;
  [key: string]: any;
}

const KeyPairsSection: React.FC<KeyPairsSectionProps> = ({
  projectId = "",
  region = "",
  onStatsUpdate,
  itemsPerPage = 6,
  showRegionSelect,
}) => {
  const queryClient = useQueryClient();
  const { context } = useApiContext();

  const { data: keyPairs = [], isFetching } = useFetchKeyPairs(projectId, region, {
    enabled: Boolean(projectId),
  });
  const { mutate: deleteKeyPair, isPending: isDeleting } = useDeleteKeyPair();
  const { mutateAsync: syncKeyPairs, isPending: isSyncing } = useSyncKeyPairs();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = keyPairs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedKeyPairs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return keyPairs.slice(startIndex, startIndex + itemsPerPage);
  }, [keyPairs, currentPage, itemsPerPage]);

  useEffect(() => {
    onStatsUpdate?.(totalItems);
  }, [totalItems, onStatsUpdate]);

  const showRegionPicker = showRegionSelect ?? !region;

  const stats = useMemo(() => {
    const baseStats = [
      {
        label: "Total Key Pairs",
        value: totalItems,
        tone: "primary",
        icon: <KeyRound size={16} />,
      },
    ];
    if (region) {
      baseStats.push({
        label: "Region",
        value: region,
        tone: "info",
        icon: <MapPin size={16} />,
      });
    }
    return baseStats;
  }, [totalItems, region]);

  const handleSync = async () => {
    if (!projectId) {
      ToastUtils.error("Provide a project before syncing key pairs.");
      return;
    }
    try {
      await syncKeyPairs({ project_id: projectId, region });
      ToastUtils.success("Key pairs synced successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Unable to sync key pairs.");
    }
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteKeyPair(
      {
        id: deleteModal.id,
        project_id: projectId,
        region,
        payload: {
          project_id: projectId,
          region,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success(`Deleted key pair "${deleteModal.name}".`);
          queryClient.invalidateQueries({
            queryKey: keyPairsKeys.list(context, projectId, region),
          });
          setDeleteModal(null);
        },
        onError: (error: any) => {
          ToastUtils.error(error?.message || "Failed to delete key pair.");
          setDeleteModal(null);
        },
      }
    );
  };

  const actions = [
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={!projectId || isSyncing}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync Key Pairs"}
    </ModernButton>,
    <ModernButton key="add" variant="primary" size="sm" onClick={() => setCreateModal(true)}>
      Add Key Pair
    </ModernButton>,
  ];

  const renderKeyPairCard = (keyPair: KeyPair) => (
    <ResourceListCard
      key={keyPair.id}
      title={keyPair.name}
      subtitle={keyPair.fingerprint}
      metadata={
        [
          { label: "Region", value: keyPair.region || region || "—" },
          keyPair.created_at
            ? {
                label: "Created",
                value: new Date(keyPair.created_at).toLocaleString(),
              }
            : null,
        ].filter(Boolean) as any
      }
      actions={[
        {
          key: "remove",
          icon: <Trash2 size={16} />,
          variant: "danger",
          onClick: () =>
            setDeleteModal({
              id: keyPair.id,
              name: keyPair.name,
            }),
          disabled: isDeleting,
          title: "Remove Key Pair",
        },
      ]}
    />
  );

  return (
    <>
      <ResourceSection
        title="Key Pairs"
        description="Provision SSH key material to grant secure access to managed compute resources."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {paginatedKeyPairs.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {paginatedKeyPairs.map(renderKeyPairCard)}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  isDisabled={currentPage === 1}
                >
                  Previous
                </ModernButton>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  isDisabled={currentPage === totalPages}
                >
                  Next
                </ModernButton>
              </div>
            )}
          </>
        ) : (
          <ResourceEmptyState
            title="No Key Pairs"
            message="Synchronize key pairs from your cloud account or create a new key pair for secure SSH operations."
            action={
              <ModernButton variant="primary" onClick={() => setCreateModal(true)}>
                Create Key Pair
              </ModernButton>
            }
          />
        )}
      </ResourceSection>

      <KeyPairCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
        showRegionSelect={showRegionPicker}
      />

      <KeyPairDeleteModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        keyPairName={deleteModal?.name || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default KeyPairsSection;
