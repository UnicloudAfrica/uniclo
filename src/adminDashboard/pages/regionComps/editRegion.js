import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useUpdateRegion } from "../../../hooks/adminHooks/regionHooks"; // Adjust path
import { useFetchCountries } from "../../../hooks/resource"; // Adjust path
import ToastUtils from "../../../utils/toastUtil"; // Adjust path

const EditRegionModal = ({ isOpen, onClose, region }) => {
  const { mutate, isPending } = useUpdateRegion();
  const { isCountriesLoading: isFetching, data: countries } =
    useFetchCountries();
  const [formData, setFormData] = useState({
    name: region?.name || "",
    country_code: region?.country_code || "",
    city: region?.city || "",
    base_url: region?.base_url || "",
    is_active: region?.is_active || false,
    features: region?.features || {
      ebs: false,
      gpu: false,
      vpc: false,
      compute: false,
    },
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Region Name is required";
    if (!formData.country_code) newErrors.country_code = "Country is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.base_url.trim()) {
      newErrors.base_url = "Base URL is required";
    } else if (!/^https?:\/\/[^\s$.?#].[^\s]*$/.test(formData.base_url)) {
      newErrors.base_url = "Base URL must be a valid URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const updateFeature = (feature) => {
    setFormData((prev) => ({
      ...prev,
      features: { ...prev.features, [feature]: !prev.features[feature] },
    }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const regionData = {
      id: region.id,
      regionData: {
        name: formData.name,
        country_code: formData.country_code,
        city: formData.city,
        base_url: formData.base_url,
        is_active: formData.is_active,
        features: formData.features,
      },
    };

    mutate(regionData, {
      onSuccess: () => {
        ToastUtils.success("Region updated successfully");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to update region:", err);
        ToastUtils.error("Failed to update region. Please try again.");
      },
    });
  };

  if (!isOpen || !region) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Edit Region</h2>
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
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., US East (N. Virginia)"
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
                htmlFor="country_code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Country<span className="text-red-500">*</span>
              </label>
              <select
                id="country_code"
                value={formData.country_code}
                onChange={(e) => updateFormData("country_code", e.target.value)}
                className={`w-full input-field ${
                  errors.country_code ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isFetching}
              >
                <option value="" disabled>
                  {isFetching ? "Loading countries..." : "Select a country"}
                </option>
                {countries?.map((country) => (
                  <option key={country.iso2} value={country.iso2}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country_code && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.country_code}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                City<span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="e.g., Ashburn"
                className={`w-full input-field ${
                  errors.city ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="base_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Base URL<span className="text-red-500">*</span>
              </label>
              <input
                id="base_url"
                type="text"
                value={formData.base_url}
                onChange={(e) => updateFormData("base_url", e.target.value)}
                placeholder="e.g., http://example.com"
                className={`w-full input-field ${
                  errors.base_url ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.base_url && (
                <p className="text-red-500 text-xs mt-1">{errors.base_url}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="is_active"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Active
              </label>
              <input
                id="is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => updateFormData("is_active", e.target.checked)}
                className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="space-y-2">
                {["ebs", "gpu", "vpc", "compute"].map((feature) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <input
                      id={feature}
                      type="checkbox"
                      checked={formData.features[feature]}
                      onChange={() => updateFeature(feature)}
                      className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={feature}
                      className="text-sm text-gray-600 capitalize"
                    >
                      {feature}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || isFetching}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Update Region
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

export default EditRegionModal;
