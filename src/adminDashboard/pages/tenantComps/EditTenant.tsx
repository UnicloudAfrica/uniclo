// @ts-nocheck
import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useUpdateTenant } from "../../../hooks/adminHooks/tenantHooks";
import {
  useFetchCountries,
  useFetchStatesById,
  useFetchCitiesById,
  useFetchIndustries,
} from "../../../hooks/resource";
import ToastUtils from "../../../utils/toastUtil";

interface EditTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerDetails: any;
}

const EditTenantModal: React.FC<EditTenantModalProps> = ({ isOpen, onClose, partnerDetails }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    country_id: "",
    country: "",
    state_id: "",
    state: "",
    city_id: "",
    city: "",
    zip_code: "",
    company_type: "",
    industry: "",
    registration_number: "",
    tin_number: "",
    website: "",
  });

  const [errors, setErrors] = useState<any>({});

  const { mutate: updateTenant, isPending } = useUpdateTenant();
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(formData.country_id, {
    enabled: !!formData.country_id,
  });
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(formData.state_id, {
    enabled: !!formData.state_id,
  });
  const { data: industries, isFetching: isIndustriesFetching } = useFetchIndustries();

  useEffect(() => {
    if (partnerDetails) {
      setFormData({
        name: partnerDetails.name || "",
        email: partnerDetails.email || "",
        phone: partnerDetails.phone || "",
        address: partnerDetails.address || "",
        country_id: partnerDetails.country_id || "",
        country: partnerDetails.country || "",
        state_id: partnerDetails.state_id || "",
        state: partnerDetails.state || "",
        city_id: partnerDetails.city_id || "",
        city: partnerDetails.city || "",
        zip_code: partnerDetails.zip_code || "",
        company_type: partnerDetails.company_type || "",
        industry: partnerDetails.industry || "",
        registration_number: partnerDetails.registration_number || "",
        tin_number: partnerDetails.tin_number || "",
        website: partnerDetails.website || "",
      });
    }
  }, [partnerDetails]);

  // Update country name when ID changes
  useEffect(() => {
    if (formData.country_id && countries) {
      const selectedCountry = countries.find(
        (c: any) => String(c.id) === String(formData.country_id)
      );
      if (selectedCountry && selectedCountry.name !== formData.country) {
        setFormData((prev) => ({ ...prev, country: selectedCountry.name }));
      }
    }
  }, [formData.country_id, countries]);

  // Update state name when ID changes
  useEffect(() => {
    if (formData.state_id && states) {
      const selectedState = states.find((s: any) => String(s.id) === String(formData.state_id));
      if (selectedState && selectedState.name !== formData.state) {
        setFormData((prev) => ({ ...prev, state: selectedState.name }));
      }
    }
  }, [formData.state_id, states]);

  // Update city name when ID changes
  useEffect(() => {
    if (formData.city_id && cities) {
      const selectedCity = cities.find((c: any) => String(c.id) === String(formData.city_id));
      if (selectedCity && selectedCity.name !== formData.city) {
        setFormData((prev) => ({ ...prev, city: selectedCity.name }));
      }
    }
  }, [formData.city_id, cities]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: null }));
    }

    // Reset dependent fields
    if (name === "country_id") {
      setFormData((prev) => ({
        ...prev,
        country_id: value,
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
    } else if (name === "state_id") {
      setFormData((prev) => ({
        ...prev,
        state_id: value,
        city_id: "",
        city: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Partner Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.company_type) newErrors.company_type = "Type is required";
    if (!formData.industry) newErrors.industry = "Industry is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    updateTenant(
      { id: partnerDetails.identifier, tenantData: formData },
      {
        onSuccess: () => {
          ToastUtils.success("Partner updated successfully");
          onClose();
        },
        onError: (err: any) => {
          console.error("Failed to update partner:", err);
          ToastUtils.error(err.message || "Failed to update partner. Please try again.");
        },
      }
    );
  };

  if (!isOpen) return null;

  const showCityDropdown = cities && cities.length > 0 && !isCitiesFetching;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit overflow-y-auto py-10">
      <div className="bg-white rounded-[24px] max-w-4xl mx-4 w-full my-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-xl font-semibold text-gray-800">Edit Partner</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isPending}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter partner name"
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter email address"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="https://example.com"
              />
            </div>

            {/* Business Details */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Type <span className="text-red-500">*</span>
              </label>
              <select
                name="company_type"
                value={formData.company_type}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${
                  errors.company_type ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Type</option>
                <option value="RC">Limited Liability Company</option>
                <option value="BN">Business Name</option>
                <option value="IT">Incorporated Trustees</option>
                <option value="LL">Limited Liability</option>
                <option value="LLP">Limited Liability Partnership</option>
                <option value="Other">Other</option>
              </select>
              {errors.company_type && (
                <p className="mt-1 text-xs text-red-500">{errors.company_type}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry <span className="text-red-500">*</span>
              </label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                disabled={isIndustriesFetching}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white ${
                  errors.industry ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Industry</option>
                {industries?.map((ind: any) => (
                  <option key={ind.id || ind.name} value={ind.name}>
                    {ind.name}
                  </option>
                ))}
              </select>
              {errors.industry && <p className="mt-1 text-xs text-red-500">{errors.industry}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                name="registration_number"
                value={formData.registration_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="e.g. RC123456"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">TIN Number</label>
              <input
                type="text"
                name="tin_number"
                value={formData.tin_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Tax Identification Number"
              />
            </div>

            {/* Location */}
            <div className="md:col-span-2 mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                disabled={isCountriesFetching}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
              >
                <option value="">Select Country</option>
                {countries?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                name="state_id"
                value={formData.state_id}
                onChange={handleChange}
                disabled={!formData.country_id || isStatesFetching}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">Select State</option>
                {states?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              {showCityDropdown ? (
                <select
                  name="city_id"
                  value={formData.city_id}
                  onChange={handleChange}
                  disabled={!formData.state_id || isCitiesFetching}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Select City</option>
                  {cities?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Enter city"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Zip Code"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-6 py-2.5 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-2.5 bg-[#288DD1] text-white font-medium rounded-lg hover:bg-[#1F7AC4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTenantModal;
