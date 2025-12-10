import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useCreatePricing } from "../../../hooks/pricingHooks";

const EditPricingModal = ({ isOpen, onClose, itemToEdit, refetchPricing }) => {
  const [formData, setFormData] = useState({
    local_price: "",
  });
  const [errors, setErrors] = useState({});
  const { mutate: updatePricing, isPending: isUpdating } = useCreatePricing();

  useEffect(() => {
    if (isOpen && itemToEdit) {
      setFormData({
        local_price: itemToEdit.local_price || "",
      });
      setErrors({});
    }
  }, [isOpen, itemToEdit]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    const priceValue = String(formData.local_price);

    if (!priceValue.trim()) {
      newErrors.local_price = "Set Price is required";
    } else if (isNaN(parseFloat(priceValue)) || parseFloat(priceValue) <= 0) {
      newErrors.local_price = "Set Price must be a positive number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    // Clean productable_type by removing "App\\Models\\"
    const cleanedProductableType = itemToEdit.productable_type.replace("App\\Models\\", "");

    const payload = {
      productable_type: cleanedProductableType,
      productable_id: itemToEdit.productable_id,
      price: parseFloat(formData.local_price),
    };

    updatePricing(payload, {
      onSuccess: () => {
        ToastUtils.success("Pricing updated successfully!");
        onClose();
        refetchPricing();
      },
      onError: (err) => {
        ToastUtils.error(err.message || "Failed to update pricing. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] w-full max-w-[500px] mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit Pricing for{" "}
            {itemToEdit?.productable?.name || itemToEdit?.productable?.identifier || "N/A"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isUpdating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-6 space-y-4">
            <div>
              <label htmlFor="local_price" className="block text-sm font-medium text-gray-700 mb-2">
                Set Price ({itemToEdit?.local_currency || "USD"})
                <span className="text-red-500">*</span>
              </label>
              <input
                id="local_price"
                type="number"
                step="0.01"
                value={formData.local_price}
                onChange={handleInputChange}
                placeholder="Enter new price"
                className={`w-full input-field ${
                  errors.local_price ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isUpdating}
              />
              {errors.local_price && (
                <p className="text-red-500 text-xs mt-1">{errors.local_price}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={isUpdating}
              >
                Save Changes
                {isUpdating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPricingModal;
