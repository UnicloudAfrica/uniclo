import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useUpdateFloatingIP } from "../../../../hooks/adminHooks/floatingIPHooks";
import ToastUtils from "../../../../utils/toastUtil";

const EditFloatingIP = ({ isOpen, onClose, floatingIP }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    // price: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && floatingIP) {
      setFormData({
        name: floatingIP.name || "",
        description: floatingIP.description || "",
        // price:
        //   floatingIP.price !== undefined && floatingIP.price !== null
        //     ? parseFloat(floatingIP.price).toFixed(2)
        //     : "",
      });
      setErrors({});
    }
  }, [isOpen, floatingIP]);

  const { mutate, isPending } = useUpdateFloatingIP();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    // if (!formData.price || isNaN(parseFloat(formData.price))) {
    //   newErrors.price = "Price must be a valid number";
    // } else if (parseFloat(formData.price) < 0) {
    //   newErrors.price = "Price cannot be negative";
    // }
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

    if (floatingIP?.id) {
      const updatedData = {
        name: formData.name,
        description: formData.description,
        // price: parseFloat(formData.price),
      };

      mutate(
        { id: floatingIP.id, ipData: updatedData },
        {
          onSuccess: () => {
            // console.log("Floating IP updated successfully!");
            ToastUtils.success("Floating IP updated successfully");
            onClose();
          },
          onError: (err) => {
            // console.error("Failed to update Floating IP:", err);
            // ToastUtils.error("Failed to update Floating IP. Please try again.");
          },
        }
      );
    } else {
      //   console.error("No Floating IP ID provided for update.");
      //   ToastUtils.error("Cannot update: Floating IP ID is missing.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit Floating IP: {floatingIP?.name || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="floatingIPName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Name<span className="text-red-500">*</span>
              </label>
              <input
                id="floatingIPName"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Public IP Address"
                className={`w-full input-field rounded-[10px] px-3 py-2 text-sm border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="floatingIPDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description<span className="text-red-500">*</span>
              </label>
              <textarea
                id="floatingIPDescription"
                rows="3"
                value={formData.description}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="e.g., Public IP for web server"
                className={`w-full input-field rounded-[10px] px-3 py-2 text-sm border ${
                  errors.description ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>
            {/* <div>
              <label
                htmlFor="floatingIPPrice"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Price (USD)<span className="text-red-500">*</span>
              </label>
              <input
                id="floatingIPPrice"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateFormData("price", e.target.value)}
                placeholder="e.g., 0.00 or 15.50"
                className={`w-full input-field rounded-[10px] px-3 py-2 text-sm border ${
                  errors.price ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div> */}
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

export default EditFloatingIP;
