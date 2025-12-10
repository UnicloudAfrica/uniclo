import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreatePricing } from "../../../hooks/pricingHooks";
import ToastUtils from "../../../utils/toastUtil.ts";

const productTypeMap = {
  "Compute Instance": "ComputeInstance",
  "EBS Volume": "EbsVolume",
  Bandwidth: "Bandwidth",
  "OS Image": "OsImage",
};

const AddPricing = ({
  isOpen,
  onClose,
  computerInstances,
  isComputerInstancesFetching,
  osImages,
  isOsImagesFetching,
  bandwidths,
  isBandwidthsFetching,
  ebsVolumes,
  isEbsVolumesFetching,
}) => {
  const [formData, setFormData] = useState({
    productable_type: "",
    productable_id: "",
    price: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate: createPricing, isPending } = useCreatePricing();

  // closeModal is now just onClose prop
  const closeModal = () => {
    onClose(); // Call the onClose prop passed from parent
    setFormData({
      productable_type: "",
      productable_id: "",
      price: "",
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
    setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const handleProductTypeChange = (e) => {
    const selectedDisplayName = e.target.value;
    const actualProductableType = productTypeMap[selectedDisplayName] || "";
    setFormData((prev) => ({
      ...prev,
      productable_type: actualProductableType,
      productable_id: "",
    }));
    setErrors((prev) => ({
      ...prev,
      productable_type: null,
      productable_id: null,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.productable_type) {
      newErrors.productable_type = "Product Type is required";
    }
    if (!formData.productable_id) {
      newErrors.productable_id = "Product is required";
    }
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      newErrors.price = "Price must be a positive number";
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

    const payload = {
      productable_type: formData.productable_type,
      productable_id: parseInt(formData.productable_id),
      price: parseFloat(formData.price),
    };

    createPricing(payload, {
      onSuccess: () => {
        ToastUtils.success("Pricing added successfully!");
        closeModal();
      },
      onError: (err) => {
        // console.error("Failed to add pricing:", err);
        // ToastUtils.error(
        //   err.message || "Failed to add pricing. Please try again."
        // );
      },
    });
  };

  let currentProductList = [];
  let isCurrentProductListFetching = false;
  let productLabel = "Product";

  switch (formData.productable_type) {
    case productTypeMap["Compute Instance"]:
      currentProductList = computerInstances;
      isCurrentProductListFetching = isComputerInstancesFetching;
      productLabel = "Compute Instance";
      break;
    case productTypeMap["EBS Volume"]:
      currentProductList = ebsVolumes;
      isCurrentProductListFetching = isEbsVolumesFetching;
      productLabel = "EBS Volume";
      break;
    case productTypeMap["Bandwidth"]:
      currentProductList = bandwidths;
      isCurrentProductListFetching = isBandwidthsFetching;
      productLabel = "Bandwidth";
      break;
    case productTypeMap["OS Image"]:
      currentProductList = osImages;
      isCurrentProductListFetching = isOsImagesFetching;
      productLabel = "OS Image";
      break;
    default:
      currentProductList = [];
      isCurrentProductListFetching = false;
      productLabel = "Product";
      break;
  }

  return (
    <>
      {/* The button is moved to the parent component (Pricing) */}

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] w-full max-w-[550px] mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
              <h2 className="text-lg font-semibold text-[#575758]">Add New Pricing</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 w-full overflow-y-auto max-h-[calc(100vh-200px)]">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Product Type Selection */}
                <div>
                  <label
                    htmlFor="productable_type"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Product Type<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="productable_type"
                    value={
                      Object.keys(productTypeMap).find(
                        (key) => productTypeMap[key] === formData.productable_type
                      ) || ""
                    }
                    onChange={handleProductTypeChange}
                    className={`w-full input-field ${
                      errors.productable_type ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  >
                    <option value="">Select a product type</option>
                    {Object.keys(productTypeMap).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.productable_type && (
                    <p className="text-red-500 text-xs mt-1">{errors.productable_type}</p>
                  )}
                </div>

                {/* Dynamic Product Selection */}
                {formData.productable_type && (
                  <div>
                    <label
                      htmlFor="productable_id"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {productLabel}
                      <span className="text-red-500">*</span>
                    </label>
                    {isCurrentProductListFetching ? (
                      <div className="flex items-center input-field py-2">
                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                        <span className="text-gray-500 text-sm">
                          Loading {productLabel.toLowerCase()}s...
                        </span>
                      </div>
                    ) : Array.isArray(currentProductList) && currentProductList.length > 0 ? (
                      <select
                        id="productable_id"
                        value={formData.productable_id}
                        onChange={handleInputChange}
                        className={`w-full input-field ${
                          errors.productable_id ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isPending}
                      >
                        <option value="">Select a {productLabel.toLowerCase()}</option>
                        {currentProductList.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name || product.description || product.identifier}{" "}
                            {/* Use appropriate display field */}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center input-field py-2 text-gray-500 text-sm">
                        No {productLabel.toLowerCase()}s available.
                      </div>
                    )}
                    {errors.productable_id && (
                      <p className="text-red-500 text-xs mt-1">{errors.productable_id}</p>
                    )}
                  </div>
                )}

                {/* Price Input */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter price"
                    className={`w-full input-field ${
                      errors.price ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
              </form>
            </div>
            <div className="flex justify-end px-6 py-4">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isPending}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Pricing"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPricing;
