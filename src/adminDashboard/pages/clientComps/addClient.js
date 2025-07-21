import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import {
  useFetchCountries,
  useFetchStatesById,
  useFetchCitiesById,
} from "../../../hooks/resource"; // Assuming these hooks exist
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks"; // Assuming this hook exists
import { useCreateClient } from "../../../hooks/adminHooks/clientHooks"; // Assuming a hook for creating clients
import ToastUtils from "../../../utils/toastUtil";

const AddClientModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "", // New email field
    phone: "",
    role: "client", // Hardcoded
    password: "", // Will be hardcoded for now as per example, but usually generated/set by user
    password_confirmation: "", // New field for password confirmation
    tenant_id: "", // Selected from dropdown
    force_reset_password: true, // Hardcoded
    verified: false, // Hardcoded
    country_id: "", // Selected from dropdown
    country: "", // Name of the selected country
    state_id: "", // Selected from dropdown (for fetching cities)
    state: "", // Name of the selected state
    city: "", // Name of the selected city (can be typed or selected)
    address: "",
    zip_code: "",
  });
  const [errors, setErrors] = useState({});

  // Fetch necessary data using hooks
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    formData?.country_id
  );
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(
    formData?.state_id
  );

  // Hook for creating a client
  const {
    mutate: createClient,
    isPending,
    isSuccess,
    isError,
    error,
  } = useCreateClient(); // Assuming useCreateClient hook exists

  useEffect(() => {
    if (isSuccess) {
      onClose(); // Close modal on successful client creation
      // Optionally, show a success toast message here
    }
  }, [isSuccess, onClose]);

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
    if (!formData.password.trim()) newErrors.password = "Password is required";
    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Passwords do not match";
    }
    if (!formData.tenant_id) newErrors.tenant_id = "Tenant is required";
    if (!formData.country_id) newErrors.country_id = "Country is required";
    if (!formData.state_id) newErrors.state_id = "State is required";
    if (!formData.city.trim()) newErrors.city = "City is required"; // City is still required
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.zip_code.trim()) newErrors.zip_code = "Zip Code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null })); // Clear error for the field being updated
  };

  const handleSelectChange = (field, value, optionsList) => {
    const selectedOption = optionsList?.find(
      (option) => String(option.id) === String(value)
    );

    if (field === "country_id") {
      updateFormData("country_id", value);
      updateFormData("country", selectedOption?.name || "");
      updateFormData("state_id", ""); // Reset state and city when country changes
      updateFormData("state", "");
      updateFormData("city", ""); // Clear city input
    } else if (field === "state_id") {
      updateFormData("state_id", value);
      updateFormData("state", selectedOption?.name || "");
      updateFormData("city", ""); // Clear city input when state changes
    } else if (field === "tenant_id") {
      updateFormData("tenant_id", value);
    }
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const dataToSubmit = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email, // Include email in submission data
        phone: formData.phone,
        role: formData.role, // Hardcoded
        password: formData.password, // Hardcoded for now
        password_confirmation: formData.password_confirmation, // Include password confirmation
        tenant_id: formData.tenant_id,
        force_reset_password: formData.force_reset_password, // Hardcoded
        verified: formData.verified, // Hardcoded
        country_id: formData.country_id,
        country: formData.country,
        state: formData.state,
        city: formData.city, // City is now directly from formData
        address: formData.address,
        zip_code: formData.zip_code,
      };

      createClient(dataToSubmit, {
        onSuccess: () => {
          // Success handled by useEffect
          ToastUtils.success("Client Added");
          onClose();
        },
        onError: (err) => {
          console.error("Error creating client:", err);
          // Error message is already set by the hook
        },
      });
    }
  };

  if (!isOpen) return null;

  const showCityDropdown = cities && cities.length > 0 && !isCitiesFetching;
  const showCityInput = !formData.state_id || !showCityDropdown; // Show input if no state selected, or if no cities available/loading

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] mx-4 w-full  flex flex-col">
        {/* Header */}
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
        {/* Content */}
        <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px] flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
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
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>
            {/* Last Name */}
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
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
            {/* Email Address */}
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
            {/* Phone Number */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number<span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
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
            {/* Password */}
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
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            {/* Password Confirmation */}
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
            {/* Tenant */}
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
                  {isTenantsFetching ? "Loading tenants..." : "Select a tenant"}
                </option>
                {tenants?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {errors.tenant_id && (
                <p className="text-red-500 text-xs mt-1">{errors.tenant_id}</p>
              )}
            </div>
            {/* Country */}
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
                <p className="text-red-500 text-xs mt-1">{errors.country_id}</p>
              )}
            </div>
            {/* State */}
            <div>
              <label
                htmlFor="state_id"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                State<span className="text-red-500">*</span>
              </label>
              <select
                id="state_id"
                value={formData.state_id}
                onChange={(e) =>
                  handleSelectChange("state_id", e.target.value, states)
                }
                className={`w-full input-field ${
                  errors.state_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending || isStatesFetching || !formData.country_id}
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
              {errors.state_id && (
                <p className="text-red-500 text-xs mt-1">{errors.state_id}</p>
              )}
            </div>
            {/* City - Conditional Rendering */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                City<span className="text-red-500">*</span>
              </label>
              {showCityDropdown ? (
                <select
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)} // Update formData directly
                  className={`w-full input-field ${
                    errors.city ? "border-red-500" : "border-gray-300"
                  }`}
                  disabled={isPending}
                >
                  <option value="">Select a city</option>
                  {cities?.map((city) => (
                    <option key={city.id} value={city.name}>
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
                  disabled={isPending || isCitiesFetching || !formData.state_id}
                />
              )}
              {errors.city && (
                <p className="text-red-500 text-xs mt-1">{errors.city}</p>
              )}
            </div>
            {/* Address */}
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
            {/* Zip Code */}
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
          </div>
          {/* {isError && (
            <p className="text-red-500 text-sm mt-4 text-center">
              Error: {error?.message || "Failed to add client."}
            </p>
          )} */}
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
