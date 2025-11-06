import { X, Trash2 } from "lucide-react";

const DeleteIgwModal = ({
  isOpen,
  onClose,
  igwName = "",
  onConfirm,
  isDeleting = false,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[16px] w-full max-w-[460px] mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Delete Internet Gateway
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 text-red-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-700">
              Are you sure you want to delete "{igwName}"? This action cannot be
              undone.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 rounded bg-red-600 text-white text-sm disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteIgwModal;
