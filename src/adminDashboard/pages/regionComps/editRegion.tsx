// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { useUpdateRegion } from "../../../hooks/adminHooks/regionHooks";
import { useFetchCountries } from "../../../hooks/resource";
import ToastUtils from "../../../utils/toastUtil";

const DEFAULT_FEATURE_KEYS = ["compute", "vpc", "ebs", "gpu"];

const buildFeatureState = (features = {}) => {
  const normalized = DEFAULT_FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(features?.[key]);
    return acc;
  }, {});

  Object.entries(features || {}).forEach(([key, value]) => {
    normalized[key] = Boolean(value);
  });

  return normalized;
};

const createFormState = (region: any) => ({
  name: region?.name || "",
  country_code: region?.country_code || "",
  city: region?.city || "",
  base_url: region?.base_url || "",
  is_active: region?.is_active ?? true,
  is_verified: region?.is_verified ?? false,
  provider_label: region?.meta?.provider_label || "",
  features: buildFeatureState(region?.features || {}),
});

const EditRegionModal = ({ isOpen, onClose, region }: any) => {
  const { mutate, isPending } = useUpdateRegion();
  const { isCountriesLoading: isFetching, data: countries } = useFetchCountries();
  const [formData, setFormData] = useState(() => createFormState(region));
  const [errors, setErrors] = useState({});
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [metaRawInput, setMetaRawInput] = useState(
    region?.meta?.raw ? JSON.stringify(region.meta.raw, null, 2) : ""
  );

  useEffect(() => {
    if (region && isOpen) {
      setFormData(createFormState(region));
      setErrors({});
      setNewFeatureKey("");
      setMetaRawInput(region.meta?.raw ? JSON.stringify(region.meta.raw, null, 2) : "");
    }
  }, [region, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMetaRawInput("");
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Region Name is required";
    if (!formData.country_code) newErrors.country_code = "Country is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (formData.base_url && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(formData.base_url.trim())) {
      newErrors.base_url = "Base URL must be a valid URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: any, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFeatureToggle = (feature: any) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...buildFeatureState(prev.features),
        [feature]: !prev.features?.[feature],
      },
    }));
  };

  const handleAddFeature = () => {
    const normalizedKey = newFeatureKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!normalizedKey) return;

    setFormData((prev) => {
      if (Object.prototype.hasOwnProperty.call(prev.features || {}, normalizedKey)) {
        return prev;
      }

      return {
        ...prev,
        features: {
          ...buildFeatureState(prev.features),
          [normalizedKey]: true,
        },
      };
    });
    setNewFeatureKey("");
  };

  const featureKeys = useMemo(
    () => Object.keys(formData.features || {}).sort(),
    [formData.features]
  );

  const handleMetaRawChange = (value: any) => {
    setMetaRawInput(value);
    setErrors((prev) => ({ ...prev, meta_raw: null }));
  };

  const handleSubmit = (e: any) => {
    if (e) e.preventDefault();
    if (!validateForm() || !region) return;

    const trimmedName = formData.name.trim();
    const trimmedCity = formData.city.trim();
    const trimmedBaseUrl = formData.base_url.trim();
    const normalizedFeatures = {};

    Object.entries(buildFeatureState(formData.features)).forEach(([key, value]) => {
      normalizedFeatures[key] = Boolean(value);
    });

    const meta = {};
    if (formData.provider_label.trim()) {
      meta.provider_label = formData.provider_label.trim();
    }

    if (metaRawInput.trim()) {
      try {
        const parsedMeta = JSON.parse(metaRawInput.trim());
        if (typeof parsedMeta !== "object" || parsedMeta === null) {
          throw new Error("Metadata must be an object");
        }
        meta.raw = parsedMeta;
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          meta_raw: "Metadata must be valid JSON describing an object.",
        }));
        return;
      }
    }

    const regionData = {
      id: region.id,
      regionData: {
        name: trimmedName,
        country_code: formData.country_code,
        city: trimmedCity || null,
        base_url: trimmedBaseUrl || null,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
        features: normalizedFeatures,
      },
    };

    if (Object.keys(meta).length > 0) {
      regionData.regionData.meta = meta;
    }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <input
                  type="text"
                  value={region?.provider || ""}
                  readOnly
                  className="w-full input-field border-gray-200 bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Region Code</label>
                <input
                  type="text"
                  value={region?.code || ""}
                  readOnly
                  className="w-full input-field border-gray-200 bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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
                {countries?.map((country: any) => (
                  <option key={country.iso2} value={country.iso2}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country_code && (
                <p className="text-red-500 text-xs mt-1">{errors.country_code}</p>
              )}
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
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
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>
            <div>
              <label htmlFor="base_url" className="block text-sm font-medium text-gray-700 mb-2">
                Base URL
              </label>
              <input
                id="base_url"
                type="text"
                value={formData.base_url}
                onChange={(e) => updateFormData("base_url", e.target.value)}
                placeholder="e.g., https://api.example.com"
                className={`w-full input-field ${
                  errors.base_url ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.base_url && <p className="text-red-500 text-xs mt-1">{errors.base_url}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 mb-2">
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
                <label
                  htmlFor="is_verified"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Verified
                  <span className="text-xs text-gray-500 ml-1">(visible to tenants)</span>
                </label>
                <input
                  id="is_verified"
                  type="checkbox"
                  checked={formData.is_verified}
                  onChange={(e) => updateFormData("is_verified", e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </div>
              <div>
                <label
                  htmlFor="provider_label"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Provider Label
                </label>
                <input
                  id="provider_label"
                  type="text"
                  value={formData.provider_label}
                  onChange={(e) => updateFormData("provider_label", e.target.value)}
                  placeholder="e.g., UCA zCompute"
                  className="w-full input-field border-gray-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
              <div className="space-y-2">
                {featureKeys.map((feature: any) => (
                  <div key={feature} className="flex items-center space-x-2">
                    <input
                      id={`feature-${feature}`}
                      type="checkbox"
                      checked={Boolean(formData.features?.[feature])}
                      onChange={() => handleFeatureToggle(feature)}
                      className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`feature-${feature}`}
                      className="text-sm text-gray-600 capitalize"
                    >
                      {feature.replace(/_/g, " ")}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="text"
                  value={newFeatureKey}
                  onChange={(e) => setNewFeatureKey(e.target.value)}
                  placeholder="Add custom feature"
                  className="flex-1 input-field border-gray-300"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#E3F2FD] text-[#288DD1] text-sm font-medium hover:bg-[#d4e9fa] transition-colors"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="meta_raw" className="block text-sm font-medium text-gray-700 mb-2">
                Advanced Metadata (JSON)
              </label>
              <textarea
                id="meta_raw"
                value={metaRawInput}
                onChange={(e) => handleMetaRawChange(e.target.value)}
                placeholder='e.g., {"platform_project_id":"1234"}'
                rows={4}
                className={`w-full input-field ${
                  errors.meta_raw ? "border-red-500" : "border-gray-300"
                }`}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: supply provider-specific metadata. Must be valid JSON.
              </p>
              {errors.meta_raw && <p className="text-red-500 text-xs mt-1">{errors.meta_raw}</p>}
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
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRegionModal;
