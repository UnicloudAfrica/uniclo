import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateOsImage } from "../../../../hooks/adminHooks/os-imageHooks";
import ToastUtils from "../../../../utils/toastUtil";

const AddOSImageModal = ({ isOpen, onClose }) => {
  const { mutate, isPending } = useCreateOsImage();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "OS Image Name is required";
    }
    // if (!formData.price || isNaN(parseFloat(formData.price))) {
    //
    //   newErrors.price = "Price must be a valid number"; // Changed label
    // } else if (parseFloat(formData.price) < 0) {
    //
    //   newErrors.price = "Price cannot be negative"; // Changed label
    // }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null })); // Clear error when input changes
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      name: formData.name,
      // price: parseFloat(formData.price),
    };

    mutate(userData, {
      onSuccess: () => {
        ToastUtils.success("Product added successfully");
        onClose(); // Close modal on success
      },
      onError: (err) => {
        console.error("Failed to create OS Image:", err);
        // ToastUtils.error("Failed to create OS Image. Please try again."); // Uncomment if ToastUtils is used
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add New OS Image
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
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
            {/* <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price (USD)<span className="text-red-500">*</span>{" "}
        
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateFormData("price", e.target.value)}
                placeholder="e.g., 0.00 or 15.50"
                className={`w-full input-field ${
                  errors.price ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div> */}
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create OS Image
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

export default AddOSImageModal;
