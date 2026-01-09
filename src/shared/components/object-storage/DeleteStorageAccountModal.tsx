// @ts-nocheck
import React, { useState } from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";

interface DeleteStorageAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  accountName: string;
  accountId: string;
  bucketCount?: number;
  accessKeyCount?: number;
}

/**
 * Reusable Delete Storage Account Modal
 * Used across Admin, Tenant, and Client dashboards
 */
const DeleteStorageAccountModal: React.FC<DeleteStorageAccountModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  accountName,
  accountId,
  bucketCount = 0,
  accessKeyCount = 0,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isConfirmValid = confirmText === accountName;
  const hasResources = bucketCount > 0 || accessKeyCount > 0;

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling done in parent
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Storage Account</h3>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {/* Warning */}
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                You are about to permanently delete this storage account:
              </p>
              <p className="mt-1 font-mono text-sm text-red-700">{accountName}</p>
            </div>

            {/* What will be deleted */}
            {hasResources && (
              <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800 mb-2">
                  The following will be permanently deleted:
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {bucketCount > 0 && (
                    <li>
                      • {bucketCount} bucket{bucketCount > 1 ? "s" : ""} and all objects inside
                    </li>
                  )}
                  {accessKeyCount > 0 && (
                    <li>
                      • {accessKeyCount} access key{accessKeyCount > 1 ? "s" : ""}
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Confirmation Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Type <span className="font-mono font-bold text-slate-900">"{accountName}"</span> to
                confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Enter account name"
                disabled={isDeleting}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:bg-slate-50 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isConfirmValid || isDeleting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteStorageAccountModal;
