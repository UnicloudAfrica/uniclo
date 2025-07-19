import React, { useState, useEffect } from "react";
import { X, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useFetchCountries } from "../../../hooks/resource";
import ToastUtils from "../../../utils/toastUtil";
import { useUpdateTaxConfiguration } from "../../../hooks/adminHooks/taxConfigurationHooks";

const EditTaxTypeModal = ({ isOpen, onClose, taxType }) => {
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  const { mutate, isPending } = useUpdateTaxConfiguration(); // Use the new update tax type hook

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    countryRates: [], // Array to manage rates
  });
  const [newRateCountryId, setNewRateCountryId] = useState("");
  const [newRateValue, setNewRateValue] = useState("");
  const [errors, setErrors] = useState({});

  // Populate form data when the modal opens or when the taxType prop changes
  useEffect(() => {
    if (isOpen && taxType) {
      setFormData({
        name: taxType.name || "",
        slug: taxType.slug || "",
        // Deep copy country_rates to avoid direct mutation of prop
        countryRates: taxType.country_rates
          ? taxType.country_rates.map((rate) => ({ ...rate }))
          : [],
      });
      setNewRateCountryId("");
      setNewRateValue("");
      setErrors({}); // Clear any previous errors
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        name: "",
        slug: "",
        countryRates: [],
      });
      setNewRateCountryId("");
      setNewRateValue("");
      setErrors({});
    }
  }, [isOpen, taxType]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Tax Type Name is required";
    }
    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    }

    // Validate existing rates
    formData.countryRates.forEach((rate, index) => {
      const rateValue = parseFloat(rate.rate);
      if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
        newErrors[`rate-${index}`] = "Rate must be a number between 0 and 1.";
      }
    });

    // Validate new rate if attempting to add
    if (newRateValue.trim() !== "" || newRateCountryId !== "") {
      const rateValue = parseFloat(newRateValue);
      if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
        newErrors.newRateValue = "New rate must be a number between 0 and 1.";
      }
      if (!newRateCountryId) {
        newErrors.newRateCountryId = "Country is required for new rate.";
      } else {
        // Check if country already has a rate for this tax type
        const countryAlreadyHasRate = formData.countryRates.some(
          (rate) => String(rate.country_id) === String(newRateCountryId)
        );
        if (countryAlreadyHasRate) {
          newErrors.newRateCountryId =
            "This country already has a rate for this tax type.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormDataField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null })); // Clear error for the specific field
  };

  const handleRateChange = (index, value) => {
    setFormData((prev) => {
      const updatedRates = [...prev.countryRates];
      updatedRates[index] = { ...updatedRates[index], rate: value };
      return { ...prev, countryRates: updatedRates };
    });
    setErrors((prev) => ({ ...prev, [`rate-${index}`]: null })); // Clear specific rate error
  };

  const handleRemoveRate = (index) => {
    setFormData((prev) => {
      const updatedRates = prev.countryRates.filter((_, i) => i !== index);
      return { ...prev, countryRates: updatedRates };
    });
  };

  const handleAddRate = () => {
    const newErrors = {};
    const rateValue = parseFloat(newRateValue);

    if (newRateValue.trim() === "") {
      newErrors.newRateValue = "Rate is required.";
    } else if (isNaN(rateValue) || rateValue < 0 || rateValue > 1) {
      newErrors.newRateValue = "Rate must be a number between 0 and 1.";
    }

    if (!newRateCountryId) {
      newErrors.newRateCountryId = "Country is required.";
    } else {
      const countryAlreadyHasRate = formData.countryRates.some(
        (rate) => String(rate.country_id) === String(newRateCountryId)
      );
      if (countryAlreadyHasRate) {
        newErrors.newRateCountryId =
          "This country already has a rate for this tax type.";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const selectedCountry = countries.find(
        (c) => String(c.id) === String(newRateCountryId)
      );

      setFormData((prev) => ({
        ...prev,
        countryRates: [
          ...prev.countryRates,
          {
            country_id: parseInt(newRateCountryId),
            rate: parseFloat(newRateValue).toFixed(5), // Store as string with precision
            country: selectedCountry, // Attach country object for display
          },
        ],
      }));
      setNewRateCountryId("");
      setNewRateValue("");
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) return;

    if (taxType?.id) {
      const updatedData = {
        name: formData.name,
        slug: formData.slug,
        rates: formData.countryRates.map((rate) => ({
          // Only include 'id' if it exists (for existing rates)
          ...(rate.id && { id: rate.id }),
          country_id: rate.country_id,
          rate: parseFloat(rate.rate), // Ensure rate is a number for submission
        })),
      };

      mutate(
        { id: taxType.id, configData: updatedData },
        {
          onSuccess: () => {
            ToastUtils.success("Tax type updated successfully");
            onClose();
          },
          onError: (err) => {
            console.error("Failed to update Tax Type:", err);
            ToastUtils.error(
              err.message || "Failed to update tax type. Please try again."
            );
          },
        }
      );
    } else {
      ToastUtils.error("No Tax Type ID provided for update.");
    }
  };

  if (!isOpen) return null;

  const availableCountriesForNewRate = countries?.filter(
    (country) =>
      !formData.countryRates.some(
        (rate) => String(rate.country_id) === String(country.id)
      )
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[700px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit Tax Type: {taxType?.name || "N/A"}
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
            {/* Tax Type Details */}
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
                onChange={(e) => updateFormDataField("name", e.target.value)}
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
            {/* <div>
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
                onChange={(e) => updateFormDataField("slug", e.target.value)}
                placeholder="e.g., vat"
                className={`w-full input-field ${
                  errors.slug ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.slug && (
                <p className="text-red-500 text-xs mt-1">{errors.slug}</p>
              )}
            </div> */}

            {/* Country Rates Management */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Country Rates
              </h3>
              {formData.countryRates.length > 0 ? (
                <div className="space-y-3">
                  {formData.countryRates.map((rate, index) => (
                    <div
                      key={rate.id || `new-${index}`} // Use existing ID or a new temporary key
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                    >
                      <span className="font-medium text-gray-700 w-1/3">
                        {rate.country?.name || `Country ID: ${rate.country_id}`}
                      </span>
                      <input
                        type="number"
                        step="0.001"
                        value={rate.rate}
                        onChange={(e) =>
                          handleRateChange(index, e.target.value)
                        }
                        className={`w-1/3 input-field ${
                          errors[`rate-${index}`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        disabled={isPending}
                      />
                      <button
                        onClick={() => handleRemoveRate(index)}
                        className="p-2 text-red-500 hover:text-red-700 transition-colors"
                        title="Remove Rate"
                        disabled={isPending}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      {errors[`rate-${index}`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`rate-${index}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-3">
                  No country-specific rates configured.
                </p>
              )}

              {/* Add New Rate Section */}
              <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Add New Rate
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="newRateCountry"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Country
                    </label>
                    <span
                      className={`w-full input-field block transition-all ${
                        errors.newRateCountryId ? "border-red-500 border" : ""
                      }`}
                    >
                      {isCountriesFetching ? (
                        <div className="flex items-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                          <span className="text-gray-500 text-sm">
                            Loading countries...
                          </span>
                        </div>
                      ) : availableCountriesForNewRate &&
                        availableCountriesForNewRate.length > 0 ? (
                        <select
                          id="newRateCountry"
                          value={newRateCountryId}
                          onChange={(e) => {
                            setNewRateCountryId(e.target.value);
                            setErrors((prev) => ({
                              ...prev,
                              newRateCountryId: null,
                            }));
                          }}
                          className="w-full bg-transparent outline-none"
                          disabled={isPending}
                        >
                          <option value="">Select a country</option>
                          {availableCountriesForNewRate.map((country) => (
                            <option key={country.id} value={country.id}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center py-2 text-gray-500 text-sm">
                          All countries already have rates.
                        </div>
                      )}
                    </span>
                    {errors.newRateCountryId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.newRateCountryId}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="newRateValue"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Rate (0-1)
                    </label>
                    <input
                      id="newRateValue"
                      type="number"
                      step="0.001"
                      value={newRateValue}
                      onChange={(e) => {
                        setNewRateValue(e.target.value);
                        setErrors((prev) => ({ ...prev, newRateValue: null }));
                      }}
                      placeholder="e.g., 0.075"
                      className={`w-full input-field ${
                        errors.newRateValue
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      disabled={isPending}
                    />
                    {errors.newRateValue && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.newRateValue}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleAddRate}
                  className="mt-4 px-4 py-2 bg-[#288DD1] text-white rounded-md hover:bg-[#1976D2] transition-colors flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isPending || !newRateCountryId || newRateValue.trim() === ""
                  }
                >
                  <PlusCircle className="w-4 h-4 mr-2" /> Add Rate
                </button>
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

export default EditTaxTypeModal;
