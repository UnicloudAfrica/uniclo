import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useFetchCountries } from "../../../hooks/resource";
import { useCreateTaxConfiguration } from "../../../hooks/adminHooks/taxConfigurationHooks";
import ToastUtils from "../../../utils/toastUtil";

const AddTaxTypeModal = ({ isOpen, onClose }) => {
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  const { mutate, isPending } = useCreateTaxConfiguration();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    initialRate: "",
    selectedCountryId: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        slug: "",
        initialRate: "",
        selectedCountryId: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tax Type Name is required";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }

    // Validate initial rate if provided
    if (formData.initialRate.trim() !== "") {
      const rateValue = parseFloat(formData.initialRate);
      if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
        // Rates are typically 0 to 1 (e.g., 0.075 for 7.5%)
        newErrors.initialRate = "Rate must be a number between 0 and 1.";
      }
      // If an initial rate is provided, a country MUST be selected.
      if (!formData.selectedCountryId) {
        newErrors.selectedCountryId =
          "Country is required for the initial rate.";
      }
    }
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

    const dataToSubmit = {
      name: formData.name,
      slug: formData.slug,
    };

    // If an initial rate and a country are provided, add them to country_rates
    if (formData.initialRate.trim() !== "" && formData.selectedCountryId) {
      dataToSubmit.rates = [
        {
          country_id: parseInt(formData.selectedCountryId),
          rate: parseFloat(formData.initialRate),
        },
      ];
    }

    mutate(dataToSubmit, {
      onSuccess: () => {
        ToastUtils.success("Tax type added successfully");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to create Tax Type:", err);
        ToastUtils.error(
          err.message || "Failed to add tax type. Please try again."
        );
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add New Tax Type
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[calc(100vh-200px)] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tax Type Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Value Added Tax"
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
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Slug<span className="text-red-500">*</span>
              </label>
              <input
                id="slug"
                type="text"
                value={formData.slug}
                onChange={(e) => updateFormData("slug", e.target.value)}
                placeholder="e.g., vat"
                className={`w-full input-field ${
                  errors.slug ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug}</p>
              )}
            </div>
            {/* Optional Initial Rate */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Optional Initial Rate
              </h3>
              <div>
                <label
                  htmlFor="initialRate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Rate (Enter percentage: 7.5 for 7.5% or decimal: 0.075)
                </label>
                <div className="relative">
                  <input
                    id="initialRate"
                    type="number"
                    step="0.001"
                    min="0"
                    max="100"
                    value={formData.initialRate}
                    onChange={(e) => {
                      let value = e.target.value;
                      // If user enters a value greater than 1, assume it's percentage format
                      // Convert to decimal for storage (7.5 becomes 0.075)
                      if (parseFloat(value) > 1 && parseFloat(value) <= 100) {
                        value = (parseFloat(value) / 100).toString();
                      }
                      updateFormData("initialRate", value);
                    }}
                    placeholder="7.5 or 0.075"
                    className={`w-full input-field ${
                      errors.initialRate ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                    {formData.initialRate && parseFloat(formData.initialRate) ? 
                      `${(parseFloat(formData.initialRate) * 100).toFixed(2)}%` : 
                      '%'
                    }
                  </div>
                </div>
                {errors.initialRate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.initialRate}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enter 7.5 for 7.5% tax (will be stored as 0.075)
                </p>
              </div>
              <div className="mt-4">
                <label
                  htmlFor="selectedCountryId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Country for Rate
                </label>
                <span
                  className={`w-full input-field block transition-all ${
                    errors.selectedCountryId ? "border-red-500 border" : ""
                  }`}
                >
                  {isCountriesFetching ? (
                    <div className="flex items-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                      <span className="text-gray-500 text-sm">
                        Loading countries...
                      </span>
                    </div>
                  ) : countries && countries.length > 0 ? (
                    <select
                      id="selectedCountryId"
                      value={formData.selectedCountryId}
                      onChange={(e) =>
                        updateFormData("selectedCountryId", e.target.value)
                      }
                      className="w-full bg-transparent outline-none py-2"
                      disabled={isPending}
                    >
                      <option value="">Select a country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center py-2 text-gray-500 text-sm">
                      No countries available.
                    </div>
                  )}
                </span>
                {errors.selectedCountryId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.selectedCountryId}
                  </p>
                )}
              </div>
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
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Add Tax Type
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

export default AddTaxTypeModal;
