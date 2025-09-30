import React, { useState, useEffect, useMemo } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import { useFetchCountries } from "../../../hooks/resource";
import { useFetchProducts } from "../../../hooks/adminHooks/adminProductHooks";
import { useCreateProductPricing } from "../../../hooks/adminHooks/adminproductPricingHook";

const AddProductPricing = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    region: "",
    provider: "",
    country_code: "",
    pricings: [{ category: "", product_id: "", price_usd: "" }],
  });
  const [errors, setErrors] = useState({});

  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { isFetching: isCountriesFetching, data: countries } =
    useFetchCountries();
  const {
    isFetching: isProductsFetching,
    data: products,
    error: productErrors,
  } = useFetchProducts();
  const { mutate: addProductPricing, isPending } = useCreateProductPricing();

  // Reset form state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        region: "",
        provider: "",
        country_code: "",
        pricings: [{ category: "", product_id: "", price_usd: "" }],
      });
      setErrors({});
    }
  }, [isOpen]);

  // Update provider when region changes
  useEffect(() => {
    if (formData.region && regions) {
      const selectedRegion = regions.find((r) => r.code === formData.region);
      if (selectedRegion) {
        setFormData((prev) => ({
          ...prev,
          provider: selectedRegion.provider || "",
        }));
      }
    }
  }, [formData.region, regions]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    if (!formData.country_code) {
      newErrors.country_code = "Please select a country.";
    }
    if (!formData.region) {
      newErrors.region = "Please select a region.";
    }
    formData.pricings.forEach((pricing, index) => {
      if (!pricing.product_id) {
        newErrors[`pricing_category_${index}`] = "Please select a category.";
      }
      if (!pricing.product_id) {
        newErrors[`pricing_product_id_${index}`] = "Please select a product.";
      }
      if (!pricing.price_usd || pricing.price_usd <= 0) {
        newErrors[`pricing_price_usd_${index}`] =
          "Please enter a positive price.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  // Handle pricing entry changes
  const handlePricingChange = (index, field, value) => {
    const newPricings = [...formData.pricings];
    const updatedPricing = { ...newPricings[index] };

    if (field === "category") {
      updatedPricing.category = value;
      updatedPricing.product_id = ""; // Reset product when category changes
    } else {
      updatedPricing[field] =
        field === "price_usd" ? parseFloat(value) || "" : value;
    }
    newPricings[index] = updatedPricing;
    setFormData((prev) => ({ ...prev, pricings: newPricings }));
    setErrors((prev) => ({ ...prev, [`pricing_${field}_${index}`]: null }));
  };

  // Add a new pricing entry
  const addPricingEntry = () => {
    setFormData((prev) => ({
      ...prev,
      pricings: [
        ...prev.pricings,
        { category: "", product_id: "", price_usd: "" },
      ],
    }));
  };

  // Remove a pricing entry
  const removePricingEntry = (index) => {
    if (formData.pricings.length === 1) {
      setErrors((prev) => ({
        ...prev,
        pricings: "At least one pricing entry is required.",
      }));
      return;
    }
    const newPricings = formData.pricings.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, pricings: newPricings }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`pricing_product_id_${index}`];
      delete newErrors[`pricing_price_usd_${index}`];
      return newErrors;
    });
  };

  // Memoize product categories
  const productCategories = useMemo(() => {
    if (!products) return [];
    const categories = new Set(products.map((p) => p.productable_type));
    return Array.from(categories);
  }, [products]);

  // Format category name for display
  const formatCategoryName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      );
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Transform formData to match API payload
    const payload = {
      provider: formData.provider,
      country_code: formData.country_code,
      region: formData.region,
      pricings: formData.pricings.map(({ product_id, price_usd }) => ({
        product_id: parseInt(product_id, 10) || product_id, // Ensure numeric ID
        price_usd,
      })),
    };

    addProductPricing(payload, {
      onSuccess: () => {
        ToastUtils.success("Product pricing added successfully!");
        onClose();
      },
      onError: (error) => {
        // ToastUtils.error("Failed to add product pricing. Please try again.");
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add Product Pricing
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Modal Body */}
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            {productErrors && (
              <p className="text-red-500 text-sm">{productErrors.message}</p>
            )}
            {/* Country Field */}
            <div>
              <label
                htmlFor="country_code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Country<span className="text-red-500">*</span>
              </label>
              <select
                id="country_code"
                name="country_code"
                value={formData.country_code}
                onChange={handleChange}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.country_code ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isCountriesFetching}
              >
                <option value="">Select Country</option>
                {isCountriesFetching ? (
                  <option value="" disabled>
                    Loading countries...
                  </option>
                ) : (
                  countries?.map((country) => (
                    <option key={country.iso2} value={country.iso2}>
                      {country.name}
                    </option>
                  ))
                )}
              </select>
              {errors.country_code && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.country_code}
                </p>
              )}
            </div>
            {/* Region Field */}
            <div>
              <label
                htmlFor="region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region<span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                  errors.region ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isRegionsFetching}
              >
                <option value="">Select Region</option>
                {isRegionsFetching ? (
                  <option value="" disabled>
                    Loading regions...
                  </option>
                ) : (
                  regions
                    ?.filter(
                      (region) =>
                        !formData.country_code ||
                        region.country_code === formData.country_code
                    )
                    .map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))
                )}
              </select>
              {errors.region && (
                <p className="text-red-500 text-xs mt-1">{errors.region}</p>
              )}
            </div>
            {/* Provider Field */}
            <div>
              <label
                htmlFor="provider"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Provider
              </label>
              <input
                id="provider"
                type="text"
                name="provider"
                value={formData.provider}
                className="w-full rounded-[10px] border px-3 py-2 text-sm border-gray-300 bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            {/* Pricings Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricings<span className="text-red-500">*</span>
              </label>
              {formData.pricings.map((pricing, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded-lg bg-gray-50"
                >
                  {/* Row 1: Category and Product */}
                  <div>
                    <label className="text-xs text-gray-600">Category</label>
                    <div className="w-full">
                      <select
                        value={pricing.category}
                        onChange={(e) =>
                          handlePricingChange(index, "category", e.target.value)
                        }
                        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                          errors[`pricing_category_${index}`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        disabled={isProductsFetching}
                      >
                        <option value="">Select Category</option>
                        {productCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {formatCategoryName(cat)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Product</label>
                    <div className="w-full">
                      <select
                        value={pricing.product_id}
                        onChange={(e) =>
                          handlePricingChange(
                            index,
                            "product_id",
                            e.target.value
                          )
                        }
                        className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                          errors[`pricing_product_id_${index}`]
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        disabled={isProductsFetching || !pricing.category}
                      >
                        <option value="">Select Product</option>
                        {products
                          ?.filter(
                            (p) => p.productable_type === pricing.category
                          )
                          .map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  {/* Row 2: Price and Delete Button */}
                  <div>
                    <label className="text-xs text-gray-600">Price (USD)</label>
                    <input
                      type="number"
                      value={pricing.price_usd}
                      onChange={(e) =>
                        handlePricingChange(index, "price_usd", e.target.value)
                      }
                      placeholder="0.00"
                      className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
                        errors[`pricing_price_usd_${index}`]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <button
                      type="button"
                      onClick={() => removePricingEntry(index)}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed p-2"
                      disabled={formData.pricings.length === 1}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              {errors.pricings && (
                <p className="text-red-500 text-xs mt-1">{errors.pricings}</p>
              )}
              {formData.pricings.map((_, index) => (
                <div key={index}>
                  {errors[`pricing_category_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`pricing_category_${index}`]}
                    </p>
                  )}
                  {errors[`pricing_product_id_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`pricing_product_id_${index}`]}
                    </p>
                  )}
                  {errors[`pricing_price_usd_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`pricing_price_usd_${index}`]}
                    </p>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPricingEntry}
                className="flex items-center gap-2 text-[#288DD1] hover:text-[#1976D2] mt-2"
              >
                <Plus className="w-4 h-4" />
                Add Pricing
              </button>
            </div>
          </div>
        </div>
        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isPending}
            >
              Add Pricing
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

export default AddProductPricing;
