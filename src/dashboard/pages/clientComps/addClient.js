import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import {
  useFetchCitiesById,
  useFetchCountries,
  useFetchStatesById,
  useFetchProfile,
} from "../../../hooks/resource";
import ToastUtils from "../../../utils/toastUtil";
import { useCreateClient } from "../../../hooks/clientHooks";

const AddClientModal = ({ isOpen, onClose }) => {
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();

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
  });
  const [errors, setErrors] = useState({});

  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    formData.country_id,
    { enabled: !!formData.country_id }
  );

  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(
    formData.state_id,
    { enabled: !!formData.state_id }
  );

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
      });
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.country_id && countries) {
      const selectedCountry = countries.find(
        (c) => c.id === parseInt(formData.country_id)
      );
      if (selectedCountry) {
        setFormData((prev) => ({ ...prev, country: selectedCountry.name }));
      }
      setFormData((prev) => ({
        ...prev,
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
    } else if (!formData.country_id) {
      setFormData((prev) => ({
        ...prev,
        country: "",
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
      if (selectedState) {
        setFormData((prev) => ({ ...prev, state: selectedState.name }));
      }
      setFormData((prev) => ({ ...prev, city_id: "", city: "" }));
    } else if (!formData.state_id) {
      setFormData((prev) => ({ ...prev, state: "", city_id: "", city: "" }));
    }
  }, [formData.state_id, states]);

  useEffect(() => {
    if (formData.city_id && cities) {
      const selectedCity = cities.find(
        (c) => c.id === parseInt(formData.city_id)
      );
      if (selectedCity) {
        setFormData((prev) => ({ ...prev, city: selectedCity.name }));
      }
    } else if (!formData.city_id) {
      setFormData((prev) => ({ ...prev, city: "" }));
    }
  }, [formData.city_id, cities]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First Name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone Number is required";
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = "Phone Number must contain only digits";
    }

    if (formData.password.trim()) {
      if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long";
      }
      if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = "Passwords do not match";
      }
    }

    if (!formData.country_id) newErrors.country_id = "Country is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.zip_code.trim()) newErrors.zip_code = "Zip Code is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [id]: null }));
  };

  const handleCountryChange = (e) => {
    const countryId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      country_id: countryId,
      state_id: "",
      state: "",
      city_id: "",
      city: "",
    }));
    setErrors((prev) => ({
      ...prev,
      country_id: null,
      state: null,
      city: null,
    }));
  };

  const handleStateChange = (e) => {
    const stateId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state_id: stateId,
      city_id: "",
      city: "",
    }));
    setErrors((prev) => ({ ...prev, state_id: null, city: null }));
  };

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setFormData((prev) => ({
      ...prev,
      city_id: cityId,
    }));
    setErrors((prev) => ({ ...prev, city_id: null }));
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
      tenant_id: profile?.tenant_id,
      verified: formData.verified,
      country_id: parseInt(formData.country_id),
      country: formData.country,
      state: formData.state,
      city: formData.city,
      address: formData.address,
      zip_code: formData.zip_code,
      force_password_reset: formData.force_password_reset,
    };

    if (formData.password.trim()) {
      payload.password = formData.password;
      payload.password_confirmation = formData.password_confirmation;
    }

    createClient(payload, {
      onSuccess: () => {
        ToastUtils.success("Client added successfully!");
        onClose();
      },
      onError: (err) => {
        // Error handling can be added here if needed
      },
    });
  };

  if (!isOpen) return null;

  const isCountrySelectDisabled = isCountriesFetching || isPending;
  const isStateSelectDisabled =
    !formData.country_id || isStatesFetching || isPending;
  const isCitySelectDisabled =
    !formData.state_id || isCitiesFetching || isPending;

  const showStateInput = !states || states.length === 0;
  const showCityInput = !cities || cities.length === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] w-full max-w-[650px] mx-4">
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

        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  onChange={handleInputChange}
                  placeholder="e.g., John"
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
                  onChange={handleInputChange}
                  placeholder="e.g., Doe"
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
                  onChange={handleInputChange}
                  placeholder="e.g., john.doe@example.com"
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
                  onChange={handleInputChange}
                  placeholder="e.g., 08012345678"
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
                <span
                  className={`w-full input-field block transition-all ${
                    errors.country_id ? "border-red-500 border" : ""
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
                      id="country_id"
                      value={formData.country_id}
                      onChange={handleCountryChange}
                      className="w-full bg-transparent outline-none"
                      disabled={isCountrySelectDisabled}
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
                {errors.country_id && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.country_id}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  State<span className="text-red-500">*</span>
                </label>
                {showStateInput ? (
                  <input
                    id="state"
                    type="text"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state name"
                    className={`w-full input-field ${
                      errors.state ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={isPending || !formData.country_id}
                  />
                ) : (
                  <span
                    className={`w-full input-field block transition-all ${
                      errors.state ? "border-red-500 border" : ""
                    }`}
                  >
                    {isStatesFetching ? (
                      <div className="flex items-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                        <span className="text-gray-500 text-sm">
                          Loading states...
                        </span>
                      </div>
                    ) : states && states.length > 0 ? (
                      <select
                        id="state_id"
                        value={formData.state_id}
                        onChange={handleStateChange}
                        className="w-full bg-transparent outline-none"
                        disabled={isStateSelectDisabled}
                      >
                        <option value="">Select a state</option>
                        {states.map((state) => (
                          <option key={state.id} value={state.id}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center py-2 text-gray-500 text-sm">
                        No states available.
                      </div>
                    )}
                  </span>
                )}
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  City<span className="text-red-500">*</span>
                </label>
                {showCityInput ||
                (cities && cities.length === 0 && !isCitiesFetching) ? (
                  <input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city name"
                    className={`w-full input-field ${
                      errors.city ? "border-red-500" : "border-gray-300"
                    }`}
                    disabled={
                      isPending ||
                      (!formData.state_id &&
                        !formData.state.trim() &&
                        !showStateInput)
                    }
                  />
                ) : (
                  <span
                    className={`w-full input-field block transition-all ${
                      errors.city ? "border-red-500 border" : ""
                    }`}
                  >
                    {isCitiesFetching ? (
                      <div className="flex items-center py-2">
                        <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                        <span className="text-gray-500 text-sm">
                          Loading cities...
                        </span>
                      </div>
                    ) : cities && cities.length > 0 ? (
                      <select
                        id="city_id"
                        value={formData.city_id}
                        onChange={handleCityChange}
                        className="w-full bg-transparent outline-none"
                        disabled={isCitySelectDisabled}
                      >
                        <option value="">Select a city</option>
                        {cities.map((city) => (
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
                        onChange={handleInputChange}
                        placeholder="Enter city name"
                        className={`w-full bg-transparent outline-none ${
                          errors.city ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={
                          isPending ||
                          (!formData.state_id &&
                            !formData.state.trim() &&
                            !showStateInput)
                        }
                      />
                    )}
                  </span>
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
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Main St"
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
                  onChange={handleInputChange}
                  placeholder="e.g., 90210"
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
                  onChange={handleInputChange}
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

            <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-4">
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
              Close
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || isProfileFetching}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Submit
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
