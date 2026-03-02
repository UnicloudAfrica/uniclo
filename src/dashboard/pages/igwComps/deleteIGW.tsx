import { X } from "lucide-react";

const DeleteIgwModal = ({ isOpen, onClose, igwName = "", onConfirm, isDeleting = false }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[520px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[var(--theme-surface-alt)] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">
            Delete Internet Gateway
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[rgb(var(--theme-neutral-900) / 0.7)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-3 text-sm text-gray-700">
          <p>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-gray-900">{igwName}</span>?
          </p>
          <p>This action cannot be undone.</p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[var(--theme-text-color)] bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-8 py-3 bg-red-500 text-white font-medium rounded-[30px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteIgwModal;
