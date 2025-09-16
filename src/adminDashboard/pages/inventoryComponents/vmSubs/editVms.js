import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

import ToastUtils from "../../../../utils/toastUtil";
import { useUpdateVmInstance } from "../../../../hooks/adminHooks/vmHooks";

const EditVMModal = ({ isOpen, onClose, vm }) => {
  const [formData, setFormData] = useState({
    name: "",
    family: "",
    vcpus: "",
    memory_gib: "",
    price: "", // Consolidated price field
  });
  const [errors, setErrors] = useState({});

  // Populate form data when the modal opens or when the vm prop changes
  useEffect(() => {
    if (isOpen && vm) {
      setFormData({
        name: vm.name || "",
        family: vm.family || "",
        vcpus:
          vm.vcpus !== undefined && vm.vcpus !== null
            ? vm.vcpus.toString()
            : "",
        memory_gib:
          vm.memory_gib !== undefined && vm.memory_gib !== null
            ? vm.memory_gib.toString()
            : "",
        price:
          vm.price !== undefined && vm.price !== null // Use vm.price for initialization
            ? parseFloat(vm.price).toFixed(2) // Format to 2 decimal places for display
            : "",
      });
      setErrors({}); // Clear any previous errors
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: "",
        family: "",
        vcpus: "",
        memory_gib: "",
        price: "", // Reset consolidated price
      });
      setErrors({});
    }
  }, [isOpen, vm]);

  // Use the useUpdateVmInstance hook
  const { mutate, isPending } = useUpdateVmInstance();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "VM Name is required";
    if (!formData.family.trim()) newErrors.family = "Family is required";

    const numberFields = [
      "vcpus",
      "memory_gib",
      "price", // Validate the consolidated price field
    ];

    numberFields.forEach((field) => {
      const value = parseFloat(formData[field]);
      if (isNaN(value) || formData[field] === "") {
        newErrors[field] = `${field
          .replace(/_/g, " ")
          .replace("gib", "GiB")
          .replace("vcpus", "vCPUs")} is required and must be a valid number`;
      } else if (value < 0) {
        newErrors[field] = `${field
          .replace(/_/g, " ")
          .replace("gib", "GiB")
          .replace("vcpus", "vCPUs")} cannot be negative`;
      }
    });

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

    if (vm?.identifier) {
      const updatedData = {
        name: formData.name,
        family: formData.family,
        vcpus: parseInt(formData.vcpus),
        memory_gib: parseFloat(formData.memory_gib),
        price: parseFloat(formData.price), // Use the consolidated price
      };

      mutate(
        { id: vm.identifier, instanceData: updatedData },
        {
          onSuccess: () => {
            ToastUtils.success("VM Instance updated successfully");
            onClose();
          },
          onError: (err) => {
            console.error("Failed to update VM Instance:", err);
            ToastUtils.error("Failed to update VM Instance. Please try again.");
          },
        }
      );
    } else {
      console.error("No VM Instance ID provided for update.");
      ToastUtils.error("Cannot update: VM Instance ID is missing.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[700px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit VM Instance: {vm?.name || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[calc(100vh-200px)] justify-start">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                VM Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., General Purpose"
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="family"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Family<span className="text-red-500">*</span>
              </label>
              <input
                id="family"
                type="text"
                value={formData.family}
                onChange={(e) => updateFormData("family", e.target.value)}
                placeholder="e.g., Standard"
                className={`w-full input-field ${
                  errors.family ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.family && (
                <p className="text-red-500 text-xs mt-1">{errors.family}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="vcpus"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                vCPUs<span className="text-red-500">*</span>
              </label>
              <input
                id="vcpus"
                type="number"
                value={formData.vcpus}
                onChange={(e) => updateFormData("vcpus", e.target.value)}
                placeholder="e.g., 4"
                className={`w-full input-field ${
                  errors.vcpus ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.vcpus && (
                <p className="text-red-500 text-xs mt-1">{errors.vcpus}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="memory_gib"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Memory (GiB)<span className="text-red-500">*</span>
              </label>
              <input
                id="memory_gib"
                type="number"
                step="0.1"
                value={formData.memory_gib}
                onChange={(e) => updateFormData("memory_gib", e.target.value)}
                placeholder="e.g., 8.0"
                className={`w-full input-field ${
                  errors.memory_gib ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.memory_gib && (
                <p className="text-red-500 text-xs mt-1">{errors.memory_gib}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="price" // Changed to 'price'
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price (USD)<span className="text-red-500">*</span>{" "}
                {/* Updated label */}
              </label>
              <input
                id="price" // Changed to 'price'
                type="number"
                step="0.01"
                value={formData.price} // Changed to 'price'
                onChange={(e) => updateFormData("price", e.target.value)} // Changed to 'price'
                placeholder="e.g., 36.00" // Updated placeholder
                className={`w-full input-field ${
                  errors.price ? "border-red-500" : "border-gray-300" // Changed to 'price'
                }`}
              />
              {errors.price && ( // Changed to 'price'
                <p className="text-red-500 text-xs mt-1">
                  {errors.price} {/* Changed to 'price' */}
                </p>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
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

export default EditVMModal;
