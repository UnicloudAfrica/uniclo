// @ts-nocheck
import { X, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDeleteProject } from "../../../hooks/adminHooks/projectHooks";

const ConfirmDeleteModal = ({ isOpen, onClose, projectId, projectName }: any) => {
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Use the useDeleteProject hook
  const { mutate: deleteProject, isPending, isError, error } = useDeleteProject();

  const handleDelete = () => {
    if (projectId) {
      deleteProject(projectId, {
        onSuccess: () => {
          //   ToastUtils.success("Project Deleted Successfully");

          onClose(); // Close modal on success
          navigate("/admin-dashboard/projects"); // Navigate to the projects page
        },
        onError: (err) => {
          console.error("Error deleting project:", err.message);
        },
      });
    } else {
      console.error("Project ID is missing for deletion.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[400px] mx-4 w-full p-6 text-center">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Confirm Deletion</h2>
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete the project "<strong>{projectName}</strong>"? This action
          cannot be undone.
        </p>
        {/* {isError && (
          <p className="text-red-500 text-sm mb-4">
            Error deleting project: {error?.message || "Unknown error"}
          </p>
        )} */}
        <div className="flex justify-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isPending} // Disable cancel button when deleting
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending} // Disable delete button when deleting
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Delete
            {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
