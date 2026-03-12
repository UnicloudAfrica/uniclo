/**
 * ConfirmDialog — Shared confirmation dialog to replace browser confirm().
 *
 * Renders a modal overlay with a title, message, cancel + confirm buttons.
 * Supports a loading state during async operations.
 *
 * Usage:
 *   const [confirmState, setConfirmState] = useState<{ open: boolean; ... }>(...)
 *   <ConfirmDialog
 *     isOpen={confirmState.open}
 *     title="Delete VPC?"
 *     message="This action cannot be undone."
 *     confirmLabel="Delete"
 *     onConfirm={() => { ... }}
 *     onCancel={() => setConfirmState({ ...confirmState, open: false })}
 *     isLoading={isDeleting}
 *     variant="danger"
 *   />
 */
import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ConfirmDialogProps {
  /** Whether the dialog is visible */
  isOpen: boolean;
  /** Dialog title */
  title: string;
  /** Descriptive message */
  message: string;
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels */
  onCancel: () => void;
  /** Show a spinner on the confirm button */
  isLoading?: boolean;
  /** Visual style — "danger" (red) or "warning" (amber) */
  variant?: "danger" | "warning";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "danger",
}) => {
  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const iconBg = isDanger ? "bg-red-50" : "bg-amber-50";
  const iconColor = isDanger ? "text-red-600" : "text-amber-600";
  const btnBg = isDanger ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}
          >
            <AlertTriangle size={20} className={iconColor} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white ${btnBg} rounded-lg disabled:opacity-50`}
          >
            {isLoading && <RefreshCw size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
