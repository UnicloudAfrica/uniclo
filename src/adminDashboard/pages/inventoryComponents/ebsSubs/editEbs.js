import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

import ToastUtils from "../../../../utils/toastUtil"; // Ensure ToastUtils is
import { useUpdateEbsVolume } from "../../../../hooks/adminHooks/ebsHooks";
const EditEBSModal = ({ isOpen, onClose, ebsVolume }) => {
  const [formData, setFormData] = useState({
    name: "",
    media_type: "",
    // price: "",
    description: "",
    icon: "",
    iops_read: "",
    iops_write: "",
  });
  const [errors, setErrors] = useState({});

  // Populate form data when the modal opens or when the ebsVolume prop changes
  useEffect(() => {
    if (isOpen && ebsVolume) {
      setFormData({
        name: ebsVolume.name || "",
        media_type: ebsVolume.media_type || "",
        price:
          ebsVolume.price !== undefined && ebsVolume.price !== null
            ? parseFloat(ebsVolume.price).toFixed(2)
            : "",
        description: ebsVolume.description || "",
        icon: ebsVolume.icon || "",
        iops_read:
          ebsVolume.iops_read !== undefined && ebsVolume.iops_read !== null
            ? ebsVolume.iops_read.toString()
            : "",
        iops_write:
          ebsVolume.iops_write !== undefined && ebsVolume.iops_write !== null
            ? ebsVolume.iops_write.toString()
            : "",
      });
      setErrors({}); // Clear any previous errors
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: "",
        media_type: "",
        // price: "",
        description: "",
        icon: "",
        iops_read: "",
        iops_write: "",
      });
      setErrors({});
    }
  }, [isOpen, ebsVolume]);

  // Use the useUpdateEbsVolume hook
  const { mutate, isPending } = useUpdateEbsVolume();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Volume Name is required";
    // media_type is optional, so no required validation here

    const numberFields = [
      // "price",
      "iops_read",
      "iops_write",
    ];

    numberFields.forEach((field) => {
      const value = parseFloat(formData[field]);
      if (isNaN(value) || formData[field] === "") {
        newErrors[field] = `${field.replace(/_/g, " ")} must be a valid number`;
      } else if (value < 0) {
        newErrors[field] = `${field.replace(/_/g, " ")} cannot be negative`;
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

    if (ebsVolume?.id) {
      const updatedData = {
        name: formData.name,
        media_type: formData.media_type.trim() || null,
        // price: parseFloat(formData.price),
        description: formData.description.trim() || null,
        icon: formData.icon.trim() || null,
        iops_read: parseInt(formData.iops_read),
        iops_write: parseInt(formData.iops_write),
      };

      mutate(
        { id: ebsVolume.identifier, volumeData: updatedData },
        {
          onSuccess: () => {
            ToastUtils.success("EBS Volume updated successfully");
            onClose(); // Close modal on success
          },
          onError: (err) => {
            // console.error("Failed to update EBS Volume:", err);
            // ToastUtils.error("Failed to update EBS Volume. Please try again.");
          },
        }
      );
    } else {
      //   console.error("No EBS Volume ID provided for update.");
      //   ToastUtils.error("Cannot update: EBS Volume ID is missing.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[700px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit EBS Volume: {ebsVolume?.name || "N/A"}
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
                Volume Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., General Purpose SSD"
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
                htmlFor="media_type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Media Type<span className="">(Optional)</span>
              </label>
              <select
                id="media_type"
                value={formData.media_type}
                onChange={(e) => updateFormData("media_type", e.target.value)}
                className={`w-full input-field ${
                  errors.media_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Media Type</option>
                <option value="gp3">gp3 (General Purpose SSD)</option>
                <option value="io1">io1 (Provisioned IOPS SSD)</option>
                <option value="st1">st1 (Throughput Optimized HDD)</option>
                <option value="sc1">sc1 (Cold HDD)</option>
              </select>
              {errors.media_type && (
                <p className="text-red-500 text-xs mt-1">{errors.media_type}</p>
              )}
            </div>
            {/* <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price (USD)<span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateFormData("price", e.target.value)}
                placeholder="e.g., 5.00"
                className={`w-full input-field ${
                  errors.price ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div> */}
            <div>
              <label
                htmlFor="iops_read"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                IOPS Read<span className="text-red-500">*</span>
              </label>
              <input
                id="iops_read"
                type="number"
                value={formData.iops_read}
                onChange={(e) => updateFormData("iops_read", e.target.value)}
                placeholder="e.g., 500"
                className={`w-full input-field ${
                  errors.iops_read ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.iops_read && (
                <p className="text-red-500 text-xs mt-1">{errors.iops_read}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="iops_write"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                IOPS Write<span className="text-red-500">*</span>
              </label>
              <input
                id="iops_write"
                type="number"
                value={formData.iops_write}
                onChange={(e) => updateFormData("iops_write", e.target.value)}
                placeholder="e.g., 200"
                className={`w-full input-field ${
                  errors.iops_write ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.iops_write && (
                <p className="text-red-500 text-xs mt-1">{errors.iops_write}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Enter a brief description for the EBS volume"
                rows="3"
                className={`w-full input-field ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              ></textarea>
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="icon"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Icon (Optional)
              </label>
              <input
                id="icon"
                type="text"
                value={formData.icon}
                onChange={(e) => updateFormData("icon", e.target.value)}
                placeholder="e.g., storage, database"
                className={`w-full input-field ${
                  errors.icon ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.icon && (
                <p className="text-red-500 text-xs mt-1">{errors.icon}</p>
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

export default EditEBSModal;
