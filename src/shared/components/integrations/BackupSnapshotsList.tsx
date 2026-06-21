/**
 * BackupSnapshotsList — Collapsible panel listing completed backup snapshots.
 *
 * Shown inside ResourceProtectionTab when backups are enabled.
 * Each snapshot row has a "Restore" action.
 */
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  HardDrive,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { ModernButton } from "../ui";
import IntegrationStatusBadge from "./IntegrationStatusBadge";
import {
  useBackupSnapshots,
  useBrowseBackupSnapshot,
} from "@/shared/hooks/resources/integrationHooks";

interface BackupSnapshotsListProps {
  integrationKey: string;
  resourceType: string;
  resourceId: string | number;
  onRestore: (snapshot: Record<string, unknown>) => void;
}

const BackupSnapshotsList: React.FC<BackupSnapshotsListProps> = ({
  integrationKey,
  resourceType,
  resourceId,
  onRestore,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [browseSnapshotId, setBrowseSnapshotId] = useState<string | null>(null);

  const { data: snapshots = [], isLoading } = useBackupSnapshots(
    integrationKey,
    resourceType,
    resourceId,
    { enabled: isExpanded }
  );

  const snapshotsList = snapshots as Record<string, unknown>[];
  const { data: browsedFiles = [], isLoading: browsing } = useBrowseBackupSnapshot(
    integrationKey,
    browseSnapshotId,
    "/",
    { enabled: Boolean(browseSnapshotId) }
  );

  return (
    <div className="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
      >
        <div className="flex items-center gap-2">
          <HardDrive size={14} className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Backup Snapshots
          </span>
          {!isLoading && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              {snapshotsList.length}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : snapshotsList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span aria-hidden="true" className="text-4xl">
                📸
              </span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No snapshots yet
              </p>
              <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
                Your backups run on schedule. The first snapshot will appear here once it's done.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {snapshotsList.map((snapshot) => {
                const completedAt = snapshot.completed_at as string | undefined;
                const identifier = snapshot.identifier as string | undefined;
                const config = (snapshot.config ?? {}) as Record<string, unknown>;
                const backupType = (config.backup_type as string) ?? "full";
                const sizeBytes = snapshot.result_size_bytes as number | undefined;

                return (
                  <div
                    key={(snapshot.id as string) ?? identifier}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-500" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {completedAt ? new Date(completedAt).toLocaleString() : "Unknown date"}
                          </span>
                          <IntegrationStatusBadge status="completed" />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {identifier && <span className="font-mono">{identifier}</span>}
                          <span className="capitalize">{backupType}</span>
                          {sizeBytes !== undefined && sizeBytes > 0 && (
                            <span>{formatBytes(sizeBytes)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setBrowseSnapshotId(
                            String(snapshot.external_operation_id ?? identifier ?? snapshot.id)
                          )
                        }
                      >
                        <FolderOpen size={14} className="mr-1" />
                        Browse
                      </ModernButton>
                      <ModernButton variant="outline" size="sm" onClick={() => onRestore(snapshot)}>
                        <RotateCcw size={14} className="mr-1" />
                        Restore
                      </ModernButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {browseSnapshotId && (
            <div className="border-t border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/60">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Snapshot Files
                </p>
                <button
                  type="button"
                  onClick={() => setBrowseSnapshotId(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Close
                </button>
              </div>
              {browsing ? (
                <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
              ) : browsedFiles.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  No files returned for this snapshot path.
                </p>
              ) : (
                <div className="max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950">
                  {browsedFiles.map((file, index) => (
                    <div
                      key={`${String(file.name ?? index)}-${index}`}
                      className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs last:border-b-0 dark:border-gray-800"
                    >
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        {String(file.name ?? "unknown")}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {String(file.type ?? "file")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default BackupSnapshotsList;
