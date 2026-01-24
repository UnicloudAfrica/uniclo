// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { KeyRound, MapPin, RefreshCw, Trash2 } from "lucide-react";
import {
  ModernButton,
  ResourceEmptyState,
  ResourceListCard,
  ResourceSection,
  ModernTable,
} from "../ui";
import KeyPairCreateModal from "./KeyPairCreateModal";
import KeyPairDeleteModal from "./KeyPairDeleteModal";
import type { KeyPairPermissions } from "../../config/permissionPresets";

export interface KeyPair {
  id: string;
  name: string;
  fingerprint?: string;
  region?: string;
  created_at?: string;
  [key: string]: any;
}

interface KeyPairsOverviewProps {
  keyPairs: KeyPair[];
  isLoading: boolean;
  permissions: KeyPairPermissions;
  projectId: string;
  region: string;
  onSync: () => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
  isSyncing?: boolean;
  isDeleting?: boolean;
  onStatsUpdate?: (count: number) => void;
  itemsPerPage?: number;
  showRegionSelect?: boolean;
}

interface DeleteModalState {
  id: string;
  name: string;
}

/**
 * Shared Key Pairs overview component.
 * Pure presentation component.
 */
const KeyPairsOverview: React.FC<KeyPairsOverviewProps> = ({
  keyPairs = [],
  isLoading = false,
  permissions,
  projectId,
  region,
  onSync,
  onDelete,
  isSyncing = false,
  isDeleting = false,
  onStatsUpdate,
  itemsPerPage = 10,
  showRegionSelect,
}) => {
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);

  const totalItems = keyPairs.length;

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
        value: region || "All Regions",
        tone: "info",
        icon: <MapPin size={16} />,
      });
    }
    return baseStats;
  }, [totalItems, region]);

  const handleDelete = async (keyPair: KeyPair) => {
    try {
      await onDelete(keyPair.id, keyPair.name);
      setDeleteModal(null);
    } catch (error) {
      // Error handling is done in container
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (name: string) => (
          <div className="flex items-center gap-3">
            <KeyRound size={16} className="text-gray-400" />
            <span className="font-medium text-gray-900">{name}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "fingerprint",
        header: "Fingerprint",
        render: (fingerprint: string) => (
          <code className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-600 font-mono">
            {fingerprint || "—"}
          </code>
        ),
      },
      {
        key: "region",
        header: "Region",
        render: (val: string) => (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-sm">{val || region || "—"}</span>
          </div>
        ),
      },
      {
        key: "created_at",
        header: "Created",
        render: (date: string) => (
          <span className="text-sm text-gray-500">
            {date ? new Date(date).toLocaleString() : "—"}
          </span>
        ),
        sortable: true,
      },
    ],
    [region]
  );

  const actions = [];

  if (permissions.canSync) {
    actions.push(
      <ModernButton
        key="sync"
        variant="outline"
        size="sm"
        leftIcon={<RefreshCw size={16} />}
        onClick={onSync}
        isDisabled={!projectId || isSyncing}
        isLoading={isSyncing}
      >
        {isSyncing ? "Syncing..." : "Sync"}
      </ModernButton>
    );
  }

  if (permissions.canCreate) {
    actions.push(
      <ModernButton key="add" variant="primary" size="sm" onClick={() => setCreateModal(true)}>
        Add Key Pair
      </ModernButton>
    );
  }

  const tableActions = useMemo(() => {
    if (!permissions.canDelete) return [];
    return [
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        onClick: (keyPair: KeyPair) => setDeleteModal({ id: keyPair.id, name: keyPair.name }),
        tone: "danger" as const,
      },
    ];
  }, [permissions.canDelete]);

  return (
    <>
      <ResourceSection
        title="Key Pairs"
        description="Provision SSH key material to grant secure access to managed compute resources."
        actions={actions}
        meta={stats}
        isLoading={isLoading}
      >
        {keyPairs.length > 0 ? (
          <ModernTable
            data={keyPairs}
            columns={columns}
            actions={tableActions}
            paginated={true}
            pageSize={itemsPerPage}
            searchable={true}
            searchPlaceholder="Search key pairs..."
            searchKeys={["name", "fingerprint"]}
          />
        ) : (
          <ResourceEmptyState
            title="No Key Pairs"
            message="Synchronize key pairs from your cloud account or create a new key pair for secure SSH operations."
            action={
              permissions.canCreate ? (
                <ModernButton variant="primary" onClick={() => setCreateModal(true)}>
                  Create Key Pair
                </ModernButton>
              ) : null
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
        onConfirm={() => deleteModal && handleDelete(deleteModal as any)}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default KeyPairsOverview;
