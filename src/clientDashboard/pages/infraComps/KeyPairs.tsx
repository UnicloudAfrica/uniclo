// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, RefreshCw, Trash2, KeyRound } from "lucide-react";
import {
  useFetchClientKeyPairs,
  useDeleteClientKeyPair,
  syncClientKeyPairsFromProvider,
} from "../../../hooks/clientHooks/keyPairsHook";
import {
  ModernButton,
  ResourceSection,
  ResourceEmptyState,
  ResourceListCard,
} from "../../../shared/components/ui";
import AddKeyTenantPair from "../keyPairComps/addKeyPair";
import DeleteKeyPairModal from "../keyPairComps/deleteKeyPair";
import ToastUtils from "../../../utils/toastUtil";

const ITEMS_PER_PAGE = 6;

interface KeyPair {
  id: string;
  name: string;
  fingerprint?: string;
  region?: string;
  created_at?: string;
  [key: string]: any;
}

interface KeyPairsProps {
  projectId?: string;
  region?: string;
  onStatsUpdate?: (count: number) => void;
}

interface DeleteModalState {
  id: string;
  name: string;
}

const KeyPairs: React.FC<KeyPairsProps> = ({ projectId = "", region = "", onStatsUpdate }) => {
  const queryClient = useQueryClient();
  const { data: keyPairs, isFetching } = useFetchClientKeyPairs(projectId, region);
  const { mutate: deleteKeyPair, isPending: isDeleting } = useDeleteClientKeyPair();

  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = keyPairs?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedKeyPairs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (keyPairs ?? []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [keyPairs, currentPage]);

  useEffect(() => {
    onStatsUpdate?.(totalItems);
  }, [totalItems, onStatsUpdate]);

  const stats = useMemo(() => {
    const baseStats = [
      {
        label: "Total Key Pairs",
        value: totalItems,
        tone: "primary" as const,
        icon: <KeyRound size={16} />,
      },
    ];
    if (region) {
      baseStats.push({
        label: "Region",
        value: region as any,
        tone: "info",
        icon: <MapPin size={16} />,
      } as any);
    }
    return baseStats;
  }, [totalItems, region]);

  const handleSync = async () => {
    if (!projectId) {
      ToastUtils.error("Provide a project before syncing key pairs.");
      return;
    }
    setIsSyncing(true);
    try {
      await syncClientKeyPairsFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["clientKeyPairs", { projectId, region }],
      });
      ToastUtils.success("Key pairs synced successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Unable to sync key pairs.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = () => {
    if (!deleteModal) return;
    deleteKeyPair(
      {
        id: deleteModal.id,
        payload: {
          project_id: projectId,
          region,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success(`Deleted key pair "${deleteModal.name}".`);
          queryClient.invalidateQueries({
            queryKey: ["clientKeyPairs", { projectId, region }],
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
          label: "Remove",
          icon: <Trash2 size={16} />,
          variant: "danger" as const,
          onClick: () =>
            setDeleteModal({
              id: keyPair.id,
              name: keyPair.name,
            }),
          disabled: isDeleting,
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

      <AddKeyTenantPair
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />
      <DeleteKeyPairModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        keyPairName={deleteModal?.name || deleteModal?.id || ""}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default KeyPairs;
