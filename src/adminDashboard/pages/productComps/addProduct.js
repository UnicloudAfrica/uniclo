import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchCrossConnect,
  useFetchEbsVolumes,
  useFetchFloatingIPs,
  useFetchOsImages,
} from "../../../hooks/resource";
import { useCreateProducts } from "../../../hooks/adminHooks/adminProductHooks";
import ToastUtils from "../../../utils/toastUtil";

const AddProduct = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    productable_type: "",
    productable_id: "",
    provider: "",
    region: "",
  });
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [errors, setErrors] = useState({});

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { isFetching: isBandwidthsFetching, data: bandwidths } =
    useFetchBandwidths();
  const { isFetching: isVmsFetching, data: vms } = useFetchComputerInstances();
  const { isFetching: isOsImagesFetching, data: osImages } = useFetchOsImages();
  const { isFetching: isEbsVolumesFetching, data: ebsVolumes } =
    useFetchEbsVolumes();
  const { isFetching: isIPsFetching, data: ips } = useFetchFloatingIPs();
  const { isFetching: isCrossConnectsFetching, data: crossConnects } =
    useFetchCrossConnect();
  const { mutate: createProduct, isPending } = useCreateProducts();

  const productTypes = [
    { value: "compute_instance", label: "Compute Instance" },
    { value: "cross_connect", label: "Cross Connect" },
    { value: "os_image", label: "OS Image" },
    { value: "bandwidth", label: "Bandwidth" },
    { value: "ip", label: "IP" },
    { value: "volume_type", label: "Volume Type" },
  ];

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        productable_type: "",
        productable_id: "",
        provider: "",
        region: "",
      });
      setSelectedRegionCode("");
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.productable_type)
      newErrors.productable_type = "Product type is required";
    if (!formData.productable_id)
      newErrors.productable_id = "Product selection is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSelectChange = (field, value) => {
    if (field === "productable_type") {
      setFormData((prev) => ({
        ...prev,
        productable_type: value,
        productable_id: "",
      }));
      setErrors((prev) => ({
        ...prev,
        productable_type: null,
        productable_id: null,
      }));
    } else if (field === "region") {
      const region = regions?.find((r) => r.code === value);
      setSelectedRegionCode(value);
      setFormData((prev) => ({
        ...prev,
        region: region ? region.code : "",
        provider: region ? region.provider : "",
      }));
      setErrors((prev) => ({ ...prev, region: null, provider: null }));
    } else {
      updateFormData(field, value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const payload = {
      name: formData.name,
      productable_type: formData.productable_type,
      productable_id: parseInt(formData.productable_id),
      provider: formData.provider || null,
      region: formData.region || null,
    };

    createProduct(payload, {
      onSuccess: () => {
        // ToastUtils.success("Product added successfully!");
        onClose();
      },
      onError: (err) => {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to add product.";
        // ToastUtils.error(errorMsg);
        if (err.response?.data?.errors) {
          setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
        }
      },
    });
  };

  const getProductOptions = () => {
    switch (formData.productable_type) {
      case "compute_instance":
        return vms;
      case "cross_connect":
        return crossConnects;
      case "os_image":
        return osImages;
      case "bandwidth":
        return bandwidths;
      case "ip":
        return ips;
      case "volume_type":
        return ebsVolumes;
      default:
        return [];
    }
  };

  const isProductOptionsFetching = () => {
    switch (formData.productable_type) {
      case "compute_instance":
        return isVmsFetching;
      case "cross_connect":
        return isCrossConnectsFetching;
      case "os_image":
        return isOsImagesFetching;
      case "bandwidth":
        return isBandwidthsFetching;
      case "ip":
        return isIPsFetching;
      case "volume_type":
        return isEbsVolumesFetching;
      default:
        return false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[600px] mx-4 w-full flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Add Product</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px] flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Name<span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter product name"
                  className={`w-full input-field ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
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
                  onChange={(e) =>
                    handleSelectChange("productable_type", e.target.value)
                  }
                  className={`w-full input-field ${
                    errors.productable_type
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  disabled={isPending}
                >
                  <option value="">Select a product type</option>
                  {productTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.productable_type && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.productable_type}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="productable_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Product<span className="text-red-500">*</span>
                </label>
                <select
                  id="productable_id"
                  value={formData.productable_id}
                  onChange={(e) =>
                    updateFormData("productable_id", e.target.value)
                  }
                  className={`w-full input-field ${
                    errors.productable_id ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={
                    isPending ||
                    isProductOptionsFetching() ||
                    !formData.productable_type
                  }
                >
                  <option value="">
                    {!formData.productable_type
                      ? "Select a product type first"
                      : isProductOptionsFetching()
                      ? "Loading products..."
                      : "Select a product"}
                  </option>
                  {getProductOptions()?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                {errors.productable_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.productable_id}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="region"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Region
                </label>
                <select
                  id="region"
                  value={selectedRegionCode}
                  onChange={(e) => handleSelectChange("region", e.target.value)}
                  className={`w-full input-field ${
                    errors.region ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending || isRegionsFetching}
                >
                  <option value="">
                    {isRegionsFetching
                      ? "Loading regions..."
                      : "Select a region"}
                  </option>
                  {regions?.map((region) => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
                {errors.region && (
                  <p className="text-red-500 text-xs mt-1">{errors.region}</p>
                )}
              </div>
            </div>
          </form>
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
              Add Product
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

export default AddProduct;
