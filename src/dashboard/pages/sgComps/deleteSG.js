import { Loader2, X } from "lucide-react";

const DeleteSGModal = ({
  isOpen,
  onClose,
  onConfirm,
  securityGroupName,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Confirm Delete
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete the security group &quot;
            {securityGroupName}&quot;? This action cannot be undone.
          </p>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="ml-3 px-6 py-2 bg-red-500 text-white font-medium rounded-[30px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Delete
            {isDeleting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSGModal;
