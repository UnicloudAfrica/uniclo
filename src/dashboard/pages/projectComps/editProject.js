import { X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useUpdateProject } from "../../../hooks/projectHooks";
import ToastUtils from "../../../utils/toastUtil";
const EditDescriptionModal = ({
  isOpen,
  onClose,
  projectDetails,
  projectId,
}) => {
  const [newDescription, setNewDescription] = useState(
    projectDetails.description
  );
  const [saveError, setSaveError] = useState(null);

  const { mutate: updateProject, isPending } = useUpdateProject();

  // Update local state when currentDescription prop changes
  useEffect(() => {
    setNewDescription(projectDetails.description);
    setSaveError(null);
  }, [projectDetails.description]);

  const handleSave = () => {
    setSaveError(null); // Clear error before new attempt
    updateProject(
      {
        id: projectId,
        projectData: { description: newDescription },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Description Updated Successfully");
          onClose();
        },
        onError: (err) => {
          console.error("Error updating project:", err.message);
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[500px] mx-4 w-full p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit Description
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="input-field"
          rows="6"
          placeholder="Enter new description"
          disabled={isPending}
        />
        {/* {saveError && ( // Display local error state
          <p className="text-red-500 text-sm mt-2">
            Error saving description: {saveError}
          </p>
        )} */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Save Changes
            {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDescriptionModal;
