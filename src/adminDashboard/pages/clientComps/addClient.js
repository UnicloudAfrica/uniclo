import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import {
  useFetchCountries,
  useFetchStatesById,
  useFetchCitiesById,
  useFetchIndustries,
} from "../../../hooks/resource";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useCreateClient } from "../../../hooks/adminHooks/clientHooks";
import ToastUtils from "../../../utils/toastUtil";
import ClientBusinessInputs from "../../../dashboard/pages/clientComps/subComps/clientBusinessInputs";

const AddClientModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    verified: false,
    country_id: "",
    country: "",
    state_id: "",
    state: "",
    city_id: "",
    city: "",
    address: "",
    zip_code: "",
    force_password_reset: false,
    tenant_id: "",
    business_name: "", // Reverted to business_name
    company_type: "",
    industry: "",
    registration_number: "",
    tin_number: "",
    website: "",
    verification_token: "",
  });
  const [errors, setErrors] = useState({});

  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    formData.country_id,
    { enabled: !!formData.country_id }
  );
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(
    formData.state_id,
    { enabled: !!formData.state_id }
  );
  const { data: industries, isFetching: isIndustriesFetching } =
    useFetchIndustries();
  const { mutate: createClient, isPending } = useCreateClient();

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        verified: false,
        country_id: "",
        country: "",
        state_id: "",
        state: "",
        city_id: "",
        city: "",
        address: "",
        zip_code: "",
        force_password_reset: false,
        tenant_id: "",
        business_name: "", // Reverted to business_name
        company_type: "",
        industry: "",
        registration_number: "",
        tin_number: "",
        website: "",
        verification_token: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.country_id && countries) {
      const selectedCountry = countries.find(
        (c) => c.id === parseInt(formData.country_id)
      );
      setFormData((prev) => ({
        ...prev,
        country: selectedCountry?.name || "",
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
    }
  }, [formData.country_id, countries]);

  useEffect(() => {
    if (formData.state_id && states) {
      const selectedState = states.find(
        (s) => s.id === parseInt(formData.state_id)
      );
      setFormData((prev) => ({
        ...prev,
        state: selectedState?.name || "",
        city_id: "",
        city: "",
      }));
    }
  }, [formData.state_id, states]);

  useEffect(() => {
    if (formData.city_id && cities) {
      const selectedCity = cities.find(
        (c) => c.id === parseInt(formData.city_id)
      );
      setFormData((prev) => ({ ...prev, city: selectedCity?.name || "" }));
    }
  }, [formData.city_id, cities]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First Name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email Address is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone Number is required";
    else if (!/^\d+$/.test(formData.phone))
      newErrors.phone = "Phone Number must contain only digits";
    if (!formData.password.trim()) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters long";
    if (formData.password !== formData.password_confirmation)
      newErrors.password_confirmation = "Passwords do not match";
    if (!formData.tenant_id) newErrors.tenant_id = "Tenant is required";
    if (!formData.country_id) newErrors.country_id = "Country is required";
    if (!formData.state_id) newErrors.state_id = "State is required";
    if (!formData.city_id && !formData.city.trim())
      newErrors.city = "City is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.zip_code.trim()) newErrors.zip_code = "Zip Code is required";
    if (!formData.business_name.trim())
      newErrors.business_name = "Business Name is required"; // Reverted to business_name
    if (!formData.company_type.trim())
      newErrors.company_type = "Business Type is required";
    if (!formData.registration_number.trim())
      newErrors.registration_number = "Registration Number is required";
    if (!formData.verification_token)
      newErrors.verification_token = "Business verification is required";
    if (formData.website.trim() && !/^https?:\/\/\S+/.test(formData.website))
      newErrors.website = "Invalid website URL";

    // Log errors for debugging
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSelectChange = (field, value, optionsList) => {
    if (field === "country_id") {
      const selectedCountry = optionsList?.find(
        (option) => String(option.id) === String(value)
      );
      setFormData((prev) => ({
        ...prev,
        country_id: value,
        country: selectedCountry?.name || "",
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
      setErrors((prev) => ({
        ...prev,
        country_id: null,
        state_id: null,
        city_id: null,
      }));
    } else if (field === "state_id") {
      const selectedState = optionsList?.find(
        (option) => String(option.id) === String(value)
      );
      setFormData((prev) => ({
        ...prev,
        state_id: value,
        state: selectedState?.name || "",
        city_id: "",
        city: "",
      }));
      setErrors((prev) => ({ ...prev, state_id: null, city_id: null }));
    } else if (field === "city_id") {
      const selectedCity = optionsList?.find(
        (option) => String(option.id) === String(value)
      );
      setFormData((prev) => ({
        ...prev,
        city_id: value,
        city: selectedCity?.name || "",
      }));
      setErrors((prev) => ({ ...prev, city_id: null }));
    } else if (field === "tenant_id") {
      setFormData((prev) => ({ ...prev, tenant_id: value }));
      setErrors((prev) => ({ ...prev, tenant_id: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      role: "client",
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      tenant_id: String(formData.tenant_id),
      verified: formData.verified,
      country_id: parseInt(formData.country_id),
      country: formData.country,
      state: formData.state,
      city: formData.city,
      address: formData.address,
      zip_code: formData.zip_code,
      force_password_reset: formData.force_password_reset,
      business: {
        name: formData.business_name, // Map business_name to name in payload
        company_type: formData.company_type,
        industry: formData.industry,
        registration_number: formData.registration_number,
        tin_number: formData.tin_number,
        website: formData.website,
      },
      verification_token: formData.verification_token,
    };

    createClient(payload, {
      onSuccess: () => {
        // ToastUtils.success("Client added successfully!");
        onClose();
      },
      onError: (err) => {
        const errorMsg =
          err.response?.data?.message || err.message || "Failed to add client.";
        // ToastUtils.error(errorMsg);
        if (err.response?.data?.errors) {
          setErrors((prev) => ({ ...prev, ...err.response.data.errors }));
        }
      },
    });
  };

  if (!isOpen) return null;

  const showCityDropdown = cities && cities.length > 0 && !isCitiesFetching;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] mx-4 w-full flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Add Client</h2>
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
                  htmlFor="tenant_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Tenant<span className="text-red-500">*</span>
                </label>
                <select
                  id="tenant_id"
                  value={formData.tenant_id}
                  onChange={(e) =>
                    handleSelectChange("tenant_id", e.target.value, tenants)
                  }
                  className={`w-full input-field ${
                    errors.tenant_id ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending || isTenantsFetching}
                >
                  <option value="">
                    {isTenantsFetching
                      ? "Loading tenants..."
                      : "Select a tenant"}
                  </option>
                  {tenants?.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
                {errors.tenant_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tenant_id}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name<span className="text-red-500">*</span>
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateFormData("first_name", e.target.value)}
                  placeholder="Enter first name"
                  className={`w-full input-field ${
                    errors.first_name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.first_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name<span className="text-red-500">*</span>
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateFormData("last_name", e.target.value)}
                  placeholder="Enter last name"
                  className={`w-full input-field ${
                    errors.last_name ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.last_name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address<span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter email address"
                  className={`w-full input-field ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Phone Number<span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="Enter phone number"
                  className={`w-full input-field ${
                    errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="country_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Country<span className="text-red-500">*</span>
                </label>
                <select
                  id="country_id"
                  value={formData.country_id}
                  onChange={(e) =>
                    handleSelectChange("country_id", e.target.value, countries)
                  }
                  className={`w-full input-field ${
                    errors.country_id ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending || isCountriesFetching}
                >
                  <option value="">
                    {isCountriesFetching
                      ? "Loading countries..."
                      : "Select a country"}
                  </option>
                  {countries?.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
                {errors.country_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.country_id}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="state_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  State<span className="text-red-500">*</span>
                </label>
                {states?.length > 0 ? (
                  <select
                    id="state_id"
                    value={formData.state_id}
                    onChange={(e) =>
                      handleSelectChange("state_id", e.target.value, states)
                    }
                    className={`w-full input-field ${
                      errors.state_id ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={
                      isPending || isStatesFetching || !formData.country_id
                    }
                  >
                    <option value="">
                      {!formData.country_id
                        ? "Select a country first"
                        : isStatesFetching
                        ? "Loading states..."
                        : "Select a state"}
                    </option>
                    {states?.map((state) => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    placeholder={
                      !formData.country_id
                        ? "Select a country first"
                        : "Enter state name"
                    }
                    className={`w-full input-field ${
                      errors.state ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending || !formData.country_id}
                  />
                )}
                {errors.state_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.state_id}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="city_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  City<span className="text-red-500">*</span>
                </label>
                {showCityDropdown ? (
                  <select
                    id="city_id"
                    value={formData.city_id}
                    onChange={(e) =>
                      handleSelectChange("city_id", e.target.value, cities)
                    }
                    className={`w-full input-field ${
                      errors.city_id ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={
                      isPending || isCitiesFetching || !formData.state_id
                    }
                  >
                    <option value="">
                      {!formData.state_id
                        ? "Select a state first"
                        : isCitiesFetching
                        ? "Loading cities..."
                        : "Select a city"}
                    </option>
                    {cities?.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder={
                      !formData.state_id
                        ? "Select a state first"
                        : isCitiesFetching
                        ? "Loading cities..."
                        : "Enter city name"
                    }
                    className={`w-full input-field ${
                      errors.city ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={
                      isPending || isCitiesFetching || !formData.state_id
                    }
                  />
                )}
                {errors.city_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.city_id}</p>
                )}
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Address<span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  type="text"
                  value={formData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter address"
                  className={`w-full input-field ${
                    errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>
              <div>
                <label
                  htmlFor="zip_code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Zip Code<span className="text-red-500">*</span>
                </label>
                <input
                  id="zip_code"
                  type="text"
                  value={formData.zip_code}
                  onChange={(e) => updateFormData("zip_code", e.target.value)}
                  placeholder="Enter zip code"
                  className={`w-full input-field ${
                    errors.zip_code ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                />
                {errors.zip_code && (
                  <p className="text-red-500 text-xs mt-1">{errors.zip_code}</p>
                )}
              </div>
              <div className="md:col-span-2 flex items-center mt-4">
                <input
                  id="verified"
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => updateFormData("verified", e.target.checked)}
                  className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                  disabled={isPending}
                />
                <label
                  htmlFor="verified"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Verify Account
                </label>
              </div>
            </div>
            <div className="bo">
              <ClientBusinessInputs
                formData={formData}
                handleInputChange={(e) => {
                  const { id, value } = e.target;
                  updateFormData(id, value);
                }}
                errors={errors}
                industries={industries}
                isIndustriesFetching={isIndustriesFetching}
                target="client"
              />
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Password & Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData("password", e.target.value)}
                    placeholder="Enter password"
                    className={`w-full input-field ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="password_confirmation"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Confirm Password<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="password_confirmation"
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) =>
                      updateFormData("password_confirmation", e.target.value)
                    }
                    placeholder="Confirm password"
                    className={`w-full input-field ${
                      errors.password_confirmation
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    disabled={isPending}
                  />
                  {errors.password_confirmation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.password_confirmation}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 flex items-center mt-2">
                  <input
                    id="force_password_reset"
                    type="checkbox"
                    checked={formData.force_password_reset}
                    onChange={(e) =>
                      updateFormData("force_password_reset", e.target.checked)
                    }
                    className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                    disabled={isPending}
                  />
                  <label
                    htmlFor="force_password_reset"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Force Password Reset on Next Login
                  </label>
                </div>
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
              disabled={isPending || !formData.verification_token}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Add Client
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

export default AddClientModal;
