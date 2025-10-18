import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import { designTokens } from "../../styles/designTokens";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchCrossConnect,
  useFetchEbsVolumes,
  useFetchFloatingIPs,
  useFetchOsImages,
} from "../../hooks/resource";
import { useCreateProducts } from "../../hooks/adminHooks/adminProductHooks";
import ToastUtils from "../../utils/toastUtil";
import useAuthRedirect from "../../utils/adminAuthRedirect";

const productTypes = [
  { value: "compute_instance", label: "Compute Instance" },
  { value: "cross_connect", label: "Cross Connect" },
  { value: "os_image", label: "OS Image" },
  { value: "bandwidth", label: "Bandwidth" },
  { value: "ip", label: "IP" },
  { value: "volume_type", label: "Volume Type" },
];

const AdminProductCreate = () => {
  const navigate = useNavigate();
  const { isLoading } = useAuthRedirect();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const enableProductFetch =
    !!selectedRegionCode && !!formData.productable_type;

  const { isFetching: isVmsFetching, data: vms } = useFetchComputerInstances(
    "USD",
    selectedRegionCode,
    {
      enabled:
        enableProductFetch && formData.productable_type === "compute_instance",
    }
  );
  const { isFetching: isOsImagesFetching, data: osImages } = useFetchOsImages(
    "USD",
    selectedRegionCode,
    { enabled: enableProductFetch && formData.productable_type === "os_image" }
  );
  const { isFetching: isEbsVolumesFetching, data: ebsVolumes } =
    useFetchEbsVolumes("USD", selectedRegionCode, {
      enabled:
        enableProductFetch && formData.productable_type === "volume_type",
    });
  const { isFetching: isBandwidthsFetching, data: bandwidths } =
    useFetchBandwidths("USD", selectedRegionCode, {
      enabled: enableProductFetch && formData.productable_type === "bandwidth",
    });
  const { isFetching: isIPsFetching, data: ips } = useFetchFloatingIPs(
    "USD",
    selectedRegionCode,
    { enabled: enableProductFetch && formData.productable_type === "ip" }
  );
  const { isFetching: isCrossConnectsFetching, data: crossConnects } =
    useFetchCrossConnect("USD", selectedRegionCode, {
      enabled:
        enableProductFetch && formData.productable_type === "cross_connect",
    });

  const { mutate: createProduct, isPending } = useCreateProducts();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const resetForm = () => {
    setFormData({
      name: "",
      productable_type: "",
      productable_id: "",
      provider: "",
      region: "",
    });
    setSelectedRegionCode("");
    setErrors({});
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.region) newErrors.region = "Region is required";
    if (!formData.productable_type)
      newErrors.productable_type = "Product type is required";
    if (!formData.productable_id)
      newErrors.productable_id = "Product selection is required";
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
      name: formData.name,
      productable_type: formData.productable_type,
      productable_id: parseInt(formData.productable_id, 10),
      provider: formData.provider || null,
      region: formData.region || null,
    };

    createProduct(payload, {
      onSuccess: () => {
        ToastUtils.success("Product added successfully!");
        navigate("/admin-dashboard/products");
      },
      onError: (err) => {
        const errorMsg =
          err.response?.data?.message ||
          err.message ||
          "Failed to add product.";
        ToastUtils.error(errorMsg);
        if (err.response?.data?.errors) {
          setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
        }
      },
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <main
        className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] min-h-full p-6 md:p-8"
        style={{ backgroundColor: designTokens.colors.neutral[25] }}
      >
        <div className="space-y-6 max-w-4xl">
          <div className="flex items-center gap-3">
            <ModernButton
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate("/admin-dashboard/products")}
            >
              <ArrowLeft size={16} />
              Back to Products
            </ModernButton>
          </div>

          <div className="space-y-2">
            <h1
              className="text-2xl font-bold"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              Add New Product
            </h1>
            <p
              className="text-sm"
              style={{ color: designTokens.colors.neutral[600] }}
            >
              Register a new product to make it available across tenant and
              business workflows.
            </p>
          </div>

          <ModernCard>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name<span className="text-red-500">*</span>
                  </label>
                  <input
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedRegionCode}
                    onChange={(e) =>
                      handleSelectChange("region", e.target.value)
                    }
                    className={`w-full input-field ${
                      errors.region ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending || isRegionsFetching}
                  >
                    <option value="">
                      {isRegionsFetching ? "Loading regions..." : "Select region"}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type<span className="text-red-500">*</span>
                  </label>
                  <select
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product<span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.productable_id}
                    onChange={(e) =>
                      updateFormData("productable_id", e.target.value)
                    }
                    className={`w-full input-field ${
                      errors.productable_id
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={
                      isPending ||
                      !selectedRegionCode ||
                      !formData.productable_type ||
                      isProductOptionsFetching()
                    }
                  >
                    <option value="">
                      {!selectedRegionCode || !formData.productable_type
                        ? "Select region and type first"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <input
                    type="text"
                    value={formData.provider}
                    readOnly
                    placeholder="Auto-filled from region"
                    className="w-full input-field bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <ModernButton
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    navigate("/admin-dashboard/products");
                  }}
                  isDisabled={isPending}
                >
                  Cancel
                </ModernButton>
                <ModernButton type="submit" isDisabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Product"
                  )}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        </div>
      </main>
    </>
  );
};

export default AdminProductCreate;
