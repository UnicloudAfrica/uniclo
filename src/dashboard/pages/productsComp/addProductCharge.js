import React, { useState, useMemo } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useCreateProductCharge } from "../../../hooks/pricingHooks";

const productTypeMap = {
  ComputeInstance: "ComputeInstance",
  EbsVolume: "EbsVolume",
  Bandwidth: "Bandwidth",
  OsImage: "OsImage",
};

const frequencyOptions = ["one_time", "monthly"];

const AddProductCharge = ({
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
  chargeOptions,
  isChargeOptionsFetching,
}) => {
  const [formData, setFormData] = useState({
    product_charge_id: "",
    productable_type: "",
    productable_id: "",
    frequency: "",
    price: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate: createProductCharge, isPending } = useCreateProductCharge();

  const closeModal = () => {
    onClose();
    setFormData({
      product_charge_id: "",
      productable_type: "",
      productable_id: "",
      frequency: "",
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

  const handleProductChargeIdChange = (e) => {
    const selectedId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      product_charge_id: selectedId,
    }));
    setErrors((prev) => ({ ...prev, product_charge_id: null }));
  };

  const handleProductTypeChange = (e) => {
    const selectedDisplayName = e.target.value;
    setFormData((prev) => ({
      ...prev,
      productable_type: selectedDisplayName,
      productable_id: "",
    }));
    setErrors((prev) => ({
      ...prev,
      productable_type: null,
      productable_id: null,
    }));
  };

  const handleProductableIdChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      productable_id: value,
    }));
    setErrors((prev) => ({ ...prev, productable_id: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.product_charge_id) {
      newErrors.product_charge_id = "Charge Option is required";
    }
    if (!formData.productable_type) {
      newErrors.productable_type = "Product Type is required";
    }
    if (!formData.productable_id) {
      newErrors.productable_id = "Product is required";
    }
    if (!formData.frequency) {
      newErrors.frequency = "Frequency is required";
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
      frequency: formData.frequency,
      product_charge_id: formData.product_charge_id,
    };

    createProductCharge(payload, {
      onSuccess: () => {
        ToastUtils.success("Product charge added successfully!");
        closeModal();
      },
      onError: (err) => {
        // console.error("Failed to add product charge:", err);
        // ToastUtils.error(
        //   err.message || "Failed to add product charge. Please try again."
        // );
      },
    });
  };

  const currentProductList = useMemo(() => {
    switch (formData.productable_type) {
      case "ComputeInstance":
        return computerInstances;
      case "EbsVolume":
        return ebsVolumes;
      case "Bandwidth":
        return bandwidths;
      case "OsImage":
        return osImages;
      default:
        return [];
    }
  }, [formData.productable_type, computerInstances, ebsVolumes, bandwidths, osImages]);

  const isCurrentProductListFetching = useMemo(() => {
    switch (formData.productable_type) {
      case "ComputeInstance":
        return isComputerInstancesFetching;
      case "EbsVolume":
        return isEbsVolumesFetching;
      case "Bandwidth":
        return isBandwidthsFetching;
      case "OsImage":
        return isOsImagesFetching;
      default:
        return false;
    }
  }, [
    formData.productable_type,
    isComputerInstancesFetching,
    isEbsVolumesFetching,
    isBandwidthsFetching,
    isOsImagesFetching,
  ]);

  const productLabel = useMemo(() => {
    if (formData.productable_type === "ComputeInstance") return "Compute Instance";
    if (formData.productable_type === "EbsVolume") return "EBS Volume";
    if (formData.productable_type === "Bandwidth") return "Bandwidth";
    if (formData.productable_type === "OsImage") return "OS Image";
    return "Product";
  }, [formData.productable_type]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] w-full max-w-[550px] mx-4">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
              <h2 className="text-lg font-semibold text-[#575758]">Set Product Charge</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px]">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="product_charge_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Charge Option<span className="text-red-500">*</span>
                  </label>
                  {isChargeOptionsFetching ? (
                    <div className="flex items-center input-field py-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                      <span className="text-gray-500 text-sm">Loading charge options...</span>
                    </div>
                  ) : Array.isArray(chargeOptions) && chargeOptions.length > 0 ? (
                    <select
                      id="product_charge_id"
                      value={formData.product_charge_id}
                      onChange={handleProductChargeIdChange}
                      className={`w-full input-field ${
                        errors.product_charge_id ? "border-red-500" : "border-gray-300"
                      }`}
                      disabled={isPending}
                    >
                      <option value="">Select a charge option</option>
                      {chargeOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center input-field py-2 text-gray-500 text-sm">
                      No charge options available.
                    </div>
                  )}
                  {errors.product_charge_id && (
                    <p className="text-red-500 text-xs mt-1">{errors.product_charge_id}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="productable_type"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Product Type<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="productable_type"
                    value={formData.productable_type}
                    onChange={handleProductTypeChange}
                    className={`w-full input-field ${
                      errors.productable_type ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  >
                    <option value="">Select a product type</option>
                    {Object.keys(productTypeMap).map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                  {errors.productable_type && (
                    <p className="text-red-500 text-xs mt-1">{errors.productable_type}</p>
                  )}
                </div>

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
                        onChange={handleProductableIdChange}
                        className={`w-full input-field ${
                          errors.productable_id ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isPending}
                      >
                        <option value="">Select a {productLabel.toLowerCase()}</option>
                        {currentProductList.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name || product.description || product.identifier}
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

                <div>
                  <label
                    htmlFor="frequency"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Frequency<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className={`w-full input-field ${
                      errors.frequency ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  >
                    <option value="">Select frequency</option>
                    {frequencyOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  {errors.frequency && (
                    <p className="text-red-500 text-xs mt-1">{errors.frequency}</p>
                  )}
                </div>

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
                  "Add Product Charge"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddProductCharge;
