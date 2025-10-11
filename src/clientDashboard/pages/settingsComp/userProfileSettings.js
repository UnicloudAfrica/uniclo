import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchCountries,
  useFetchStatesById,
  useFetchCitiesById,
} from "../../../hooks/resource";
import {
  useFetchClientProfile,
  useUserUpdateClientProfile,
} from "../../../hooks/clientHooks/profileHooks";

const UserProfileSettings = () => {
  const {
    data: profile,
    isFetching: isProfileFetching,
    refetch: refetchProfile,
  } = useFetchClientProfile();
  const { mutate: updateUserProfile, isPending: isSaving } =
    useUserUpdateClientProfile();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country_id: "",
    country: "",
    state_id: "",
    state: "",
    city_id: "",
    city: "",
    address: "",
    zip_code: "",
    business_name: "",
    company_type: "",
    registration_number: "",
    tin_number: "",
    current_password: "",
    new_password: "",
    confirm_new_password: "",
  });
  const [errors, setErrors] = useState({});

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

  const hasLoadedProfileRef = useRef(false);

  useEffect(() => {
    if (profile && !hasLoadedProfileRef.current) {
      setFormData((prev) => ({
        ...prev,
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        country_id: profile.country_id ? String(profile.country_id) : "",
        country: profile.country || "",
        state: profile.state || "",
        city: profile.city || "",
        address: profile.address || "",
        zip_code: profile.zip_code || "",
        business_name: profile.business_meta?.business_name || "",
        company_type: profile.business_meta?.company_type || "",
        registration_number: profile.business_meta?.registration_number || "",
        tin_number: profile.business_meta?.tin_number || "",
      }));
      hasLoadedProfileRef.current = true;
    }
  }, [profile]);

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

  const validateProfileForm = () => {
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
    if (!formData.country_id) newErrors.country_id = "Country is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!formData.current_password)
      newErrors.current_password = "Current password is required.";
    if (!formData.new_password)
      newErrors.new_password = "New password is required.";
    else if (formData.new_password.length < 6)
      newErrors.new_password = "New password must be at least 6 characters.";
    if (formData.new_password !== formData.confirm_new_password)
      newErrors.confirm_new_password = "New passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitProfile = (e) => {
    e.preventDefault();

    if (!validateProfileForm()) {
      ToastUtils.error("Please correct the errors in the profile form.");
      return;
    }

    const payload = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      country_id: parseInt(formData.country_id),
      country: formData.country,
      state: formData.state,
      city: formData.city,
      address: formData.address,
      zip_code: formData.zip_code,
      business_name: formData.business_name,
      company_type: formData.company_type,
      registration_number: formData.registration_number,
      tin_number: formData.tin_number,
    };

    updateUserProfile(payload, {
      onSuccess: () => {
        ToastUtils.success("Profile updated successfully!");
        refetchProfile();
      },
      onError: (err) => {
        console.error("Failed to update profile:", err);
        ToastUtils.error(
          err.message || "Failed to update profile. Please try again."
        );
      },
    });
  };

  const handleSubmitPassword = (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      ToastUtils.error("Please correct the errors in the password form.");
      return;
    }

    const payload = {
      current_password: formData.current_password,
      new_password: formData.new_password,
      new_password_confirmation: formData.confirm_new_password,
    };

    updateUserProfile(payload, {
      onSuccess: () => {
        ToastUtils.success("Password updated successfully!");
        refetchProfile();
        setFormData((prev) => ({
          ...prev,
          current_password: "",
          new_password: "",
          confirm_new_password: "",
        }));
      },
      onError: (err) => {
        console.error("Failed to update password:", err);
        ToastUtils.error(
          err.message || "Failed to update password. Please try again."
        );
      },
    });
  };

  const shouldShowStateInputField = !states || states.length === 0;
  const shouldShowCityInputField = !cities || cities.length === 0;

  if (isProfileFetching) {
    return (
      <div className="w-full min-h-[200px] flex items-center justify-center">
        <Loader2 className="w-12 text-[--theme-color] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="w-full min-h-[200px] flex flex-col items-center justify-center font-Outfit text-gray-600 text-lg">
        <p className="text-red-600 mb-4">
          User profile not found or an error occurred.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-[#ECEDF0]">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        User Profile Settings
      </h3>
      <form onSubmit={handleSubmitProfile} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              First Name
            </label>
            <input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleInputChange}
              className={`w-full input-field ${
                errors.first_name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSaving}
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Last Name
            </label>
            <input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleInputChange}
              className={`w-full input-field ${
                errors.last_name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSaving}
            />
            {errors.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
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
              className={`w-full input-field ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSaving}
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
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full input-field ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSaving}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Address
            </label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full input-field"
              disabled={isSaving}
            />
          </div>

          {/* Zip Code */}
          {/* This can be added if needed */}
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
          <div>
            <label
              htmlFor="country_id"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Country<span className="text-red-500">*</span>
            </label>
            {isCountriesFetching ? (
              <div className="flex items-center input-field py-2">
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
                className={`w-full input-field bg-transparent outline-none ${
                  errors.country_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSaving || isCountriesFetching}
              >
                <option value="">Select a country</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center input-field py-2 text-gray-500 text-sm">
                No countries available.
              </div>
            )}
            {errors.country_id && (
              <p className="text-red-500 text-xs mt-1">{errors.country_id}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              State<span className="text-red-500">*</span>
            </label>
            {shouldShowStateInputField ? (
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={handleInputChange}
                placeholder="Enter state name"
                className={`w-full input-field ${
                  errors.state ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSaving || !formData.country_id}
              />
            ) : (
              <select
                id="state_id"
                value={formData.state_id}
                onChange={handleStateChange}
                className={`w-full input-field bg-transparent outline-none ${
                  errors.state ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSaving || isStatesFetching || !formData.country_id}
              >
                <option value="">Select a state</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </select>
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
            {shouldShowCityInputField ? (
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
                  isSaving || (!formData.state_id && !formData.state.trim())
                }
              />
            ) : (
              <select
                id="city_id"
                value={formData.city_id}
                onChange={handleCityChange}
                className={`w-full input-field bg-transparent outline-none ${
                  errors.city ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSaving || isCitiesFetching || !formData.state_id}
              >
                <option value="">Select a city</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            )}
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>
        </div>

        {/* Business Information Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">
            Business Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="business_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Name
              </label>
              <input
                id="business_name"
                type="text"
                value={formData.business_name}
                onChange={handleInputChange}
                className="w-full input-field"
                disabled={isSaving}
              />
            </div>
            <div>
              <label
                htmlFor="company_type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Company Type
              </label>
              <input
                id="company_type"
                type="text"
                value={formData.company_type}
                onChange={handleInputChange}
                className="w-full input-field"
                disabled={isSaving}
              />
            </div>
            <div>
              <label
                htmlFor="registration_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Registration Number
              </label>
              <input
                id="registration_number"
                type="text"
                value={formData.registration_number}
                onChange={handleInputChange}
                className="w-full input-field"
                disabled={isSaving}
              />
            </div>
            <div>
              <label
                htmlFor="tin_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                TIN Number
              </label>
              <input
                id="tin_number"
                type="text"
                value={formData.tin_number}
                onChange={handleInputChange}
                className="w-full input-field"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Profile...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      </form>

      {/* Password & Security Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Password & Security
        </h3>
        <form onSubmit={handleSubmitPassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="current_password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Password
              </label>
              <input
                id="current_password"
                type="password"
                value={formData.current_password}
                onChange={handleInputChange}
                className={`w-full input-field ${
                  errors.current_password ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSaving}
              />
              {errors.current_password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.current_password}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="new_password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <input
                id="new_password"
                type="password"
                value={formData.new_password}
                onChange={handleInputChange}
                className={`w-full input-field ${
                  errors.new_password ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isSaving}
              />
              {errors.new_password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.new_password}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="confirm_new_password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                id="confirm_new_password"
                type="password"
                value={formData.confirm_new_password}
                onChange={handleInputChange}
                className={`w-full input-field ${
                  errors.confirm_new_password
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isSaving}
              />
              {errors.confirm_new_password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirm_new_password}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Changing Password...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileSettings;
