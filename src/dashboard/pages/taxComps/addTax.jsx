import React, { useState, useEffect } from "react";
import { X, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useCreateTaxConfiguration, useFetchTaxTypes } from "../../../hooks/taxHooks";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useFetchCountries } from "../../../hooks/resource";

const AddTaxTypeModal = ({ isOpen, onClose }) => {
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();
  const { data: taxTypes, isFetching: isTaxTypesFetching } = useFetchTaxTypes();
  const { mutate, isPending } = useCreateTaxConfiguration();

  const [rates, setRates] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setRates([]);
      setErrors({});
    }
  }, [isOpen]);

  const addRateField = () => {
    setRates((prevRates) => [...prevRates, { taxTypeId: "", countryId: "", rate: "" }]);
  };

  const removeRateField = (index) => {
    setRates((prevRates) => prevRates.filter((_, i) => i !== index));
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`rate-${index}-taxType`];
      delete newErrors[`rate-${index}-country`];
      delete newErrors[`rate-${index}-rate`];
      return newErrors;
    });
  };

  const updateRateField = (index, field, value) => {
    setRates((prevRates) =>
      prevRates.map((rate, i) => (i === index ? { ...rate, [field]: value } : rate))
    );
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`rate-${index}-${field}`];
      return newErrors;
    });
  };

  const validateForm = () => {
    const newErrors = {};
    const existingRateCombinations = new Set();

    if (rates.length === 0) {
      newErrors.noRates = "At least one tax rate is required.";
    }

    rates.forEach((rateEntry, index) => {
      if (!rateEntry.taxTypeId) {
        newErrors[`rate-${index}-taxType`] = "Tax Type is required.";
      }
      if (!rateEntry.countryId) {
        newErrors[`rate-${index}-country`] = "Country is required.";
      }

      const rateValue = parseFloat(rateEntry.rate);
      if (isNaN(rateValue) || rateValue < 0 || rateValue > 100) {
        // Updated validation
        newErrors[`rate-${index}-rate`] = "Rate must be between 0 and 100.";
      }

      if (rateEntry.taxTypeId && rateEntry.countryId) {
        const combinationKey = `${rateEntry.taxTypeId}-${rateEntry.countryId}`;
        if (existingRateCombinations.has(combinationKey)) {
          newErrors[`rate-${index}-duplicate`] =
            "This Tax Type & Country combination already exists.";
        } else {
          existingRateCombinations.add(combinationKey);
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const dataToSubmit = {
      rates: rates.map((rateEntry) => ({
        country_id: parseInt(rateEntry.countryId),
        tax_type_id: rateEntry.taxTypeId,
        rate: parseFloat(rateEntry.rate),
      })),
    };

    mutate(dataToSubmit, {
      onSuccess: () => {
        ToastUtils.success("Tax rates added successfully");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to add Tax Rates:", err);
        ToastUtils.error(err.message || "Failed to add tax rates. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">Add Tax Rates</h2>
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
            {/* Section for managing multiple rates */}
            <div className="pt-0 mt-0">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center justify-between">
                Tax Rates per Country & Type
                <button
                  type="button"
                  onClick={addRateField}
                  className="px-3 py-1 bg-[#288DD1] text-white text-sm rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  disabled={isPending || isCountriesFetching || isTaxTypesFetching}
                >
                  <PlusCircle className="w-4 h-4 mr-1" /> Add Rate
                </button>
              </h3>

              {rates.length === 0 && (
                <p className="text-gray-500 text-sm mb-4">
                  Click "Add Rate" to define tax rates for specific countries and tax types.
                </p>
              )}
              {errors.noRates && <p className="text-red-500 text-xs mt-1">{errors.noRates}</p>}

              <div className="space-y-4">
                {rates.map((rateEntry, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50 relative"
                  >
                    {/* Tax Type Row */}
                    <div className="w-full">
                      <label
                        htmlFor={`taxType-${index}`}
                        className="block text-xs font-medium text-gray-700 mb-1"
                      >
                        Tax Type
                      </label>
                      <span
                        className={`w-full input-field block transition-all ${
                          errors[`rate-${index}-taxType`] ? "border-red-500 border" : ""
                        }`}
                      >
                        {isTaxTypesFetching ? (
                          <div className="flex items-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                            <span className="text-gray-500 text-sm">Loading tax types...</span>
                          </div>
                        ) : taxTypes && taxTypes.length > 0 ? (
                          <select
                            id={`taxType-${index}`}
                            value={rateEntry.taxTypeId}
                            onChange={(e) => updateRateField(index, "taxTypeId", e.target.value)}
                            className="w-full bg-transparent outline-none py-2"
                            disabled={isPending}
                          >
                            <option value="">Select tax type</option>
                            {taxTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center py-2 text-gray-500 text-sm">
                            No tax types available.
                          </div>
                        )}
                      </span>
                      {errors[`rate-${index}-taxType`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`rate-${index}-taxType`]}
                        </p>
                      )}
                    </div>
                    {/* Country and Rate Row */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <div className="w-full sm:w-1/2">
                        <label
                          htmlFor={`country-${index}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Country
                        </label>
                        <span
                          className={`w-full input-field block transition-all ${
                            errors[`rate-${index}-country`] ? "border-red-500 border" : ""
                          }`}
                        >
                          {isCountriesFetching ? (
                            <div className="flex items-center py-2">
                              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                              <span className="text-gray-500 text-sm">Loading countries...</span>
                            </div>
                          ) : countries && countries.length > 0 ? (
                            <select
                              id={`country-${index}`}
                              value={rateEntry.countryId}
                              onChange={(e) => updateRateField(index, "countryId", e.target.value)}
                              className="w-full bg-transparent outline-none py-2"
                              disabled={isPending}
                            >
                              <option value="">Select country</option>
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
                        {errors[`rate-${index}-country`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`rate-${index}-country`]}
                          </p>
                        )}
                      </div>
                      <div className="w-full sm:w-1/2">
                        <label
                          htmlFor={`rate-${index}`}
                          className="block text-xs font-medium text-gray-700 mb-1"
                        >
                          Rate (%)
                        </label>
                        <input
                          id={`rate-${index}`}
                          type="number"
                          step="0.01"
                          value={rateEntry.rate}
                          onChange={(e) => updateRateField(index, "rate", e.target.value)}
                          placeholder="e.g., 7.5"
                          className={`w-full input-field ${
                            errors[`rate-${index}-rate`] ? "border-red-500" : "border-gray-300"
                          }`}
                          disabled={isPending}
                        />
                        {errors[`rate-${index}-rate`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`rate-${index}-rate`]}
                          </p>
                        )}
                      </div>
                    </div>
                    {errors[`rate-${index}-duplicate`] && (
                      <p className="absolute -bottom-2 left-3 text-red-500 text-xs mt-1 w-full">
                        {errors[`rate-${index}-duplicate`]}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => removeRateField(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700 disabled:opacity-50"
                      disabled={isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
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
              Add Tax Rates
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTaxTypeModal;
