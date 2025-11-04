import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useUpdateOsImage } from "../../../../hooks/adminHooks/os-imageHooks";
import ToastUtils from "../../../../utils/toastUtil";

const EditOS = ({ isOpen, onClose, osImage }) => {
  const [formData, setFormData] = useState({ name: "" });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && osImage) {
      setFormData({ name: osImage.name || "" });
      setErrors({});
    }
  }, [isOpen, osImage]);

  const { mutate, isPending } = useUpdateOsImage();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "OS Image Name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    if (osImage?.id) {
      const updatedData = { name: formData.name };

      mutate(
        { id: osImage.id, imageData: updatedData },
        {
          onSuccess: () => {
            ToastUtils.success("OS Image updated successfully");
            onClose();
          },
          onError: (err) => {
            console.error("Failed to update OS Image:", err);
            ToastUtils.error("Failed to update OS Image. Please try again.");
          },
        }
      );
    } else {
      console.error("No OS Image ID provided for update.");
      ToastUtils.error("Cannot update: OS Image ID is missing.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit OS Image: {osImage?.name || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="osImageName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                OS Image Name<span className="text-red-500">*</span>
              </label>
              <input
                id="osImageName"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Ubuntu 22.04 LTS"
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Save Changes
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOS;
