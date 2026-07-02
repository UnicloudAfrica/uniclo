import React, { useEffect, useState } from "react";
import { Copy, Info, Loader2 } from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import { ModernButton } from "@/shared/components/ui";
import { useRestoreInstanceFromBackup } from "@/shared/hooks/resources/instanceHooks";
import ToastUtils from "@/utils/toastUtil";

interface InstanceRestoreBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Source instance identifier (path param). */
  instanceIdentifier: string;
  /** Source instance display name — seeds the default restore name. */
  instanceName?: string;
  /** Local backup snapshot id to restore from. */
  snapshotId: string | number | null;
  onSuccess?: () => void;
}

/**
 * Restore a ready backup into a NEW, separately-billed instance.
 *
 * Non-destructive: the source instance is never modified. This intentionally
 * does NOT reuse the in-place RestoreSnapshotModal — that flow's "replaces
 * what's there" language is the wrong mental model here.
 */
const InstanceRestoreBackupModal: React.FC<InstanceRestoreBackupModalProps> = ({
  isOpen,
  onClose,
  instanceIdentifier,
  instanceName,
  snapshotId,
  onSuccess,
}) => {
  const defaultName = `${instanceName || instanceIdentifier}-restore`;
  const [name, setName] = useState(defaultName);

  const restore = useRestoreInstanceFromBackup();

  // Re-seed the name whenever the modal opens for a (possibly different) backup.
  useEffect(() => {
    if (isOpen) {
      setName(defaultName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, snapshotId]);

  const handleConfirm = async () => {
    if (restore.isPending || !snapshotId) return;
    try {
      await restore.mutateAsync({
        identifier: instanceIdentifier,
        snapshotId,
        name: name.trim() || undefined,
      });
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Restore failed.";
      ToastUtils.error(message);
    }
  };

  const handleClose = () => {
    if (restore.isPending) return;
    onClose();
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Restore from Backup"
      subtitle={instanceName ? `Recover a copy of ${instanceName}` : undefined}
      size="md"
    >
      <div className="space-y-5">
        {/* Non-destructive explainer */}
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">This creates a new instance.</p>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              A new, separately-billed instance is created from this backup. Your current instance is
              untouched and keeps running.
            </p>
          </div>
        </div>

        {/* Name input */}
        <div>
          <label
            htmlFor="restore-instance-name"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            New instance name
          </label>
          <div className="relative">
            <Copy className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="restore-instance-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={255}
              placeholder={defaultName}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <ModernButton variant="outline" onClick={handleClose} disabled={restore.isPending}>
            Cancel
          </ModernButton>
          <ModernButton
            variant="primary"
            onClick={handleConfirm}
            disabled={restore.isPending || !snapshotId}
            loading={restore.isPending}
          >
            {restore.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Starting…
              </>
            ) : (
              "Restore to New Instance"
            )}
          </ModernButton>
        </div>
      </div>
    </ModernModal>
  );
};

export default InstanceRestoreBackupModal;
