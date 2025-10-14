import React, { useEffect, useMemo, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { useFetchCountries } from "../../../hooks/resource";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateRegion } from "../../../hooks/adminHooks/regionHooks";

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

const createInitialFormData = () => ({
  provider: "",
  code: "",
  name: "",
  country_code: "",
  city: "",
  base_url: "",
  provider_label: "",
  is_active: true,
  features: buildFeatureState(),
});

const AddRegionModal = ({ isOpen, onClose }) => {
  const { mutate, isPending } = useCreateRegion();
  const { isCountriesLoading: isFetching, data: countries } =
    useFetchCountries();
  const [formData, setFormData] = useState(() => createInitialFormData());
  const [errors, setErrors] = useState({});
  const [newFeatureKey, setNewFeatureKey] = useState("");
  const [metaRawInput, setMetaRawInput] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFormData(createInitialFormData());
      setErrors({});
      setNewFeatureKey("");
      setMetaRawInput("");
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.provider.trim()) newErrors.provider = "Provider is required";
    if (!formData.code.trim()) newErrors.code = "Code is required";
    if (!formData.name.trim()) newErrors.name = "Region Name is required";
    if (!formData.country_code) newErrors.country_code = "Country is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (
      formData.base_url &&
      !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(formData.base_url.trim())
    ) {
      newErrors.base_url = "Base URL must be a valid URL";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleFeatureToggle = (feature) => {
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
      if (prev.features?.hasOwnProperty(normalizedKey)) {
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

  const handleMetaRawChange = (value) => {
    setMetaRawInput(value);
    setErrors((prev) => ({ ...prev, meta_raw: null }));
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    const trimmedProvider = formData.provider.trim();
    const trimmedCode = formData.code.trim();
    const trimmedName = formData.name.trim();
    const trimmedCity = formData.city.trim();
    const trimmedBaseUrl = formData.base_url.trim();

    const featuresPayload = Object.entries(
      buildFeatureState(formData.features)
    );
    const normalizedFeatures = {};
    featuresPayload.forEach(([key, value]) => {
      normalizedFeatures[key] = Boolean(value);
    });

    const regionData = {
      provider: trimmedProvider,
      code: trimmedCode,
      name: trimmedName || null,
      country_code: formData.country_code,
      city: trimmedCity || null,
      base_url: trimmedBaseUrl || null,
      is_active: formData.is_active,
      features: normalizedFeatures,
    };

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

    if (Object.keys(meta).length > 0) {
      regionData.meta = meta;
    }

    mutate(regionData, {
      onSuccess: () => {
        ToastUtils.success("Region added successfully");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to create region:", err);
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add New Region
          </h2>
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
                htmlFor="provider"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Provider<span className="text-red-500">*</span>
              </label>
              <input
                id="provider"
                type="text"
                value={formData.provider}
                onChange={(e) => updateFormData("provider", e.target.value)}
                placeholder="e.g., AWS"
                className={`w-full input-field ${
                  errors.provider ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.provider && (
                <p className="text-red-500 text-xs mt-1">{errors.provider}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Code<span className="text-red-500">*</span>
              </label>
              <input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => updateFormData("code", e.target.value)}
                placeholder="e.g., us-east-1"
                className={`w-full input-field ${
                  errors.code ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
            </div>
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
                Base URL
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
                onChange={(e) =>
                  updateFormData("provider_label", e.target.value)
                }
                placeholder="e.g., UCA zCompute"
                className="w-full input-field border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="space-y-2">
                {featureKeys.map((feature) => (
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
              <label
                htmlFor="meta_raw"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
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
              {errors.meta_raw && (
                <p className="text-red-500 text-xs mt-1">{errors.meta_raw}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || isFetching}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Region
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

export default AddRegionModal;
