import React, { useEffect, useMemo, useState } from "react";
import { KeyRound, MapPin, RefreshCw, Trash2 } from "lucide-react";
import { ModernButton, ResourceEmptyState, ResourceSection, ModernTable } from "../ui";
import type { MetaItem } from "../ui/ResourceSection";
import KeyPairCreateModal from "./KeyPairCreateModal";
import KeyPairDeleteModal from "./KeyPairDeleteModal";
import type { KeyPairPermissions } from "../../config/permissionPresets";

import { KeyPair } from "./types";

interface KeyPairsOverviewProps {
  keyPairs: KeyPair[];
  isLoading: boolean;
  permissions: KeyPairPermissions;
  projectId?: string;
  region?: string;
  onSync: () => Promise<void>;
  onDelete: (id: string, name: string) => Promise<void>;
  isSyncing?: boolean;
  isDeleting?: boolean;
  onStatsUpdate?: (count: number) => void;
  itemsPerPage?: number;
  showRegionSelect?: boolean;
  hideHeader?: boolean;
  onHeaderActionsReady?: (actions: React.ReactNode[]) => void;
}

interface DeleteModalState {
  id: string;
  name: string;
}

/**
 * Shared Key Pairs overview component.
 * Pure presentation component.
 *
 * When `hideHeader` is true, the ResourceSection wrapper is skipped
 * and header actions are hoisted via `onHeaderActionsReady` callback.
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
  hideHeader = false,
  onHeaderActionsReady,
}) => {
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);

  const totalItems = keyPairs.length;

  useEffect(() => {
    onStatsUpdate?.(totalItems);
  }, [totalItems, onStatsUpdate]);

  const showRegionPicker = showRegionSelect ?? !region;

  const stats = useMemo(() => {
    const baseStats: MetaItem[] = [
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
    } catch {
      // Error handling is done in container
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (value: unknown) => (
          <div className="flex items-center gap-3">
            <KeyRound size={16} className="text-gray-400" />
            <span className="font-medium text-gray-900">{String(value ?? "")}</span>
          </div>
        ),
        sortable: true,
      },
      {
        key: "fingerprint",
        header: "Fingerprint",
        render: (value: unknown) => (
          <code className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-600 font-mono">
            {String(value || "—")}
          </code>
        ),
        hideOnMobile: true,
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
        hideOnMobile: true,
      },
    ],
    [region]
  );

  const headerActionButtons: React.ReactNode[] = [];

  if (permissions.canSync) {
    headerActionButtons.push(
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
    headerActionButtons.push(
      <ModernButton key="add" variant="primary" size="sm" onClick={() => setCreateModal(true)}>
        Add Key Pair
      </ModernButton>
    );
  }

  useEffect(() => {
    if (onHeaderActionsReady) {
      onHeaderActionsReady(headerActionButtons);
    }
  }, [permissions.canSync, permissions.canCreate, isSyncing, projectId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const tableContent = keyPairs.length > 0 ? (
    <ModernTable
      data={keyPairs}
      columns={columns as never}
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
  );

  const modals = (
    <>
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
        onConfirm={() => deleteModal && handleDelete(deleteModal as never)}
        isDeleting={isDeleting}
      />
    </>
  );

  if (hideHeader) {
    return (
      <div className="space-y-6">
        {/* Stats chips when header is hidden */}
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        >
          {stats.map(({ label, value, tone = "primary", icon }, index) => (
            <div
              key={`${label}-${index}`}
              className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: `rgb(var(--theme-${tone === "primary" ? "primary" : tone}-50) / 1)`,
                borderColor: `rgb(var(--theme-${tone === "primary" ? "primary" : tone}-200) / 1)`,
              }}
            >
              {icon && <span className="text-sm opacity-70">{icon}</span>}
              <div>
                <span className="text-xs font-medium uppercase tracking-wide opacity-70">
                  {label}
                </span>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent border-primary-500" />
            <p className="text-sm text-gray-500">Loading key pairs...</p>
          </div>
        ) : (
          tableContent
        )}

        {modals}
      </div>
    );
  }

  return (
    <>
      <ResourceSection
        title="Key Pairs"
        description="Provision SSH key material to grant secure access to managed compute resources."
        actions={headerActionButtons}
        meta={stats}
        isLoading={isLoading}
      >
        {tableContent}
      </ResourceSection>

      {modals}
    </>
  );
};

export default KeyPairsOverview;
