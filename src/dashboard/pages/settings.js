import React, { useState, useEffect } from "react";
import useAuthRedirect from "../../utils/authRedirect";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import { Loader2 } from "lucide-react";

import {
  useFetchCitiesById,
  useFetchCountries,
  useFetchIndustries,
  useFetchStatesById,
} from "../../hooks/resource";
import { FileInput } from "../../utils/fileInput";

export default function Settings() {
  const { isLoading: authLoading } = useAuthRedirect();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: "",
    type: "",
    industry: "", // Will be selected from dropdown
    address: "",
    national_id_document: null,
    logo: null,
    registration_document: null,
    utility_bill_document: null,
    registration_number: "",
    tin_number: "",
    email: "",
    phone: "",
    website: "",
    zip: "",
    country_id: "",
    country: "",
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    privacy_policy_url: "",
    unsubscription_url: "",
    help_center_url: "",
    logo_href: "",
    theme_color: "#288DD1",
    secondary_color: "#676767",
    text_color: "#121212",
    ahref_link_color: "#288DD1",
  });

  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [isCustomState, setIsCustomState] = useState(false);
  const [isCustomCity, setIsCustomCity] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  const { data: industries, isFetching: isIndustriesFetching } =
    useFetchIndustries();

  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    businessData?.country_id
  );
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(
    businessData?.state_id
  );

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Centralized update function for form data
  const updateFormData = (field, value) => {
    setBusinessData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    // Handle conditional logic for location dropdowns
    if (field === "country_id") {
      setIsCustomCountry(value === "other");
      // Reset state and city when country changes
      setBusinessData((prevData) => ({
        ...prevData,
        state_id: "",
        state: "",
        city_id: "",
        city: "",
      }));
    } else if (field === "state_id") {
      setIsCustomState(value === "other");
      // Reset city when state changes
      setBusinessData((prevData) => ({
        ...prevData,
        city_id: "",
        city: "",
      }));
    } else if (field === "city_id") {
      setIsCustomCity(value === "other");
    }

    // Clear error for the updated field
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[field];
      return newErrors;
    });
  };

  // Handle file input changes from the FileInput component
  const handleFileChange = (name, file) => {
    setBusinessData((prevData) => ({
      ...prevData,
      [name]: file, // This will be the base64 string provided by FileInput
    }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (!businessData.name) newErrors.name = "Business name is required";
    if (!businessData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(businessData.email)) {
      newErrors.email = "Invalid email format";
    }
    // Only require if not loading and options are available
    if (
      !businessData.industry &&
      !isIndustriesFetching &&
      industries?.message?.length > 0
    )
      newErrors.industry = "Industry is required";
    if (!businessData.type) newErrors.type = "Business Type is required";

    // Validation for country/state/city, considering 'other' option
    if (!businessData.country_id && !businessData.country) {
      newErrors.countryId = "Country is required";
    } else if (businessData.country_id === "other" && !businessData.country) {
      newErrors.country = "Custom country name is required";
    }

    if (!businessData.state_id && !businessData.state) {
      newErrors.state = "State/Province is required";
    } else if (businessData.state_id === "other" && !businessData.state) {
      newErrors.state = "Custom state name is required";
    }

    if (!businessData.city_id && !businessData.city) {
      newErrors.city = "City is required";
    } else if (businessData.city_id === "other" && !businessData.city) {
      newErrors.city = "Custom city name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      console.log("Validation failed", errors);
      return;
    }

    setIsSaving(true);
    console.log("Saving business data:", businessData);

    // In a real application, you'd send `businessData` to your backend API here.
    // Example: mutation.mutate(businessData, { onSuccess: ..., onError: ... });

    // Simulate API call success/failure
    setTimeout(() => {
      setIsSaving(false);
      alert("Business data updated successfully!");
      // Optionally, navigate or show a success message
    }, 2000);
  };

  if (authLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 pb-20">
        <div className="w-full mx-auto">
          {/* <h2 className="text-2xl font-semibold text-[#121212] mb-6">
            Business Settings
          </h2> */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ">
              {/* Business Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={businessData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter business name"
                  className={`w-full input-field ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Business Type */}
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Type
                </label>
                <span
                  className={`w-full block input-field transition-all ${
                    errors.type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <select
                    id="type"
                    value={businessData.type}
                    onChange={(e) => updateFormData("type", e.target.value)}
                    className="w-full bg-transparent outline-none"
                  >
                    <option value="">Select business type</option>
                    <option value="BNG">Business Name</option>
                    <option value="LLC">Limited Liability Company</option>
                    <option value="NGO">Non-Governmental Organization</option>
                    <option value="LLP">Limited Liability Partnership</option>
                    <option value="Other">Other</option>
                  </select>
                </span>
                {errors.type && (
                  <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                )}
              </div>

              {/* Industry */}
              <div>
                <label
                  htmlFor="industry"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Industry
                </label>
                <span
                  className={`w-full block input-field transition-all ${
                    errors.industry ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <select
                    id="industry"
                    value={businessData.industry}
                    onChange={(e) => updateFormData("industry", e.target.value)}
                    className="w-full bg-transparent outline-none"
                    disabled={isIndustriesFetching}
                  >
                    <option value="">Select an industry</option>
                    {isIndustriesFetching ? (
                      <option disabled>Loading industries...</option>
                    ) : (
                      // Ensure industries and industries.message exist before mapping
                      industries?.message?.map((industry) => (
                        <option key={industry.name} value={industry.name}>
                          {industry.name}
                        </option>
                      ))
                    )}
                  </select>
                </span>
                {errors.industry && (
                  <p className="text-red-500 text-xs mt-1">{errors.industry}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={businessData.address}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  placeholder="Enter business address"
                  className="w-full input-field border-gray-300"
                />
              </div>

              {/* Country */}
              <div>
                <label
                  htmlFor="countryId"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Country<span className="text-red-500">*</span>
                </label>
                <span
                  className={`w-full input-field block transition-all ${
                    errors.countryId
                      ? "border-red-500 border"
                      : "border-gray-300"
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
                      id="countryId"
                      value={businessData.country_id}
                      onChange={(e) =>
                        updateFormData("country_id", e.target.value)
                      }
                      className="w-full bg-transparent outline-none"
                      disabled={isCountriesFetching}
                    >
                      <option value="">Select country</option>
                      {countries.map((country) => (
                        <option key={country.id} value={country.id}>
                          {country.name}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <div className="flex items-center py-2 text-gray-500 text-sm">
                      No countries available.
                    </div>
                  )}
                </span>
                {isCustomCountry && (
                  <input
                    type="text"
                    id="country"
                    value={businessData.country}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    placeholder="Enter country"
                    className={`w-full input-field transition-all mt-2 ${
                      errors.country
                        ? "border-red-500 border"
                        : "border-gray-300"
                    }`}
                  />
                )}
                {errors.countryId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.countryId}
                  </p>
                )}
                {errors.country && isCustomCountry && (
                  <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label
                  htmlFor="state_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  State/Province<span className="text-red-500">*</span>
                </label>
                {/* Render select dropdown if country selected and not "other", and states are available */}
                {businessData.country_id &&
                businessData.country_id !== "other" &&
                states &&
                states.length > 0 ? (
                  <>
                    <span
                      className={`w-full input-field block transition-all ${
                        errors.state
                          ? "border-red-500 border"
                          : "border-gray-300"
                      }`}
                    >
                      {isStatesFetching ? (
                        <div className="flex items-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                          <span className="text-gray-500 text-sm">
                            Loading states...
                          </span>
                        </div>
                      ) : (
                        <select
                          id="state_id"
                          value={businessData.state_id}
                          onChange={(e) =>
                            updateFormData("state_id", e.target.value)
                          }
                          className="w-full bg-transparent outline-none"
                          disabled={isStatesFetching}
                        >
                          <option value="">Select state</option>
                          {states.map((state) => (
                            <option key={state.id} value={state.id}>
                              {state.name}
                            </option>
                          ))}
                          <option value="other">Other</option>
                        </select>
                      )}
                    </span>
                    {isCustomState && (
                      <input
                        type="text"
                        id="state"
                        value={businessData.state}
                        onChange={(e) =>
                          updateFormData("state", e.target.value)
                        }
                        placeholder="Enter state or province"
                        className={`w-full input-field transition-all mt-2 ${
                          errors.state
                            ? "border-red-500 border"
                            : "border-gray-300"
                        }`}
                      />
                    )}
                  </>
                ) : (
                  // Render text input if no country selected, country is "other", or no states available
                  <input
                    type="text"
                    id="state"
                    value={businessData.state}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    placeholder="Enter state or province"
                    className={`w-full input-field transition-all ${
                      errors.state ? "border-red-500 border" : "border-gray-300"
                    }`}
                    // Disable if states are loading or custom country is selected (meaning we need text input)
                    disabled={
                      isStatesFetching || businessData.country_id === "other"
                    }
                  />
                )}
                {errors.state && (
                  <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label
                  htmlFor="city_id"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  City<span className="text-red-500">*</span>
                </label>
                {/* Render select dropdown if state selected and not "other", country not "other", and cities are available */}
                {businessData.state_id &&
                !isCustomState &&
                businessData.country_id !== "other" &&
                cities &&
                cities.length > 0 ? (
                  <>
                    <span
                      className={`w-full input-field block transition-all ${
                        errors.city
                          ? "border-red-500 border"
                          : "border-gray-300"
                      }`}
                    >
                      {isCitiesFetching ? (
                        <div className="flex items-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                          <span className="text-gray-500 text-sm">
                            Loading cities...
                          </span>
                        </div>
                      ) : (
                        <select
                          id="city_id"
                          value={businessData.city_id}
                          onChange={(e) =>
                            updateFormData("city_id", e.target.value)
                          }
                          className="w-full bg-transparent outline-none"
                          disabled={isCitiesFetching}
                        >
                          <option value="">Select city</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                          <option value="other">Other</option>
                        </select>
                      )}
                    </span>
                    {isCustomCity && (
                      <input
                        type="text"
                        id="city"
                        value={businessData.city}
                        onChange={(e) => updateFormData("city", e.target.value)}
                        placeholder="Enter city"
                        className={`w-full input-field transition-all mt-2 ${
                          errors.city
                            ? "border-red-500 border"
                            : "border-gray-300"
                        }`}
                      />
                    )}
                  </>
                ) : (
                  // Render text input if no state selected, state is "other", or no cities available, or custom country selected
                  <input
                    type="text"
                    id="city"
                    value={businessData.city}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    placeholder="Enter city"
                    className={`w-full input-field transition-all ${
                      errors.city ? "border-red-500 border" : "border-gray-300"
                    }`}
                    disabled={
                      isCitiesFetching ||
                      isCustomState ||
                      businessData.country_id === "other"
                    }
                  />
                )}
                {errors.city && (
                  <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                )}
              </div>

              {/* Zip Code */}
              <div>
                <label
                  htmlFor="zip"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Zip Code
                </label>
                <input
                  id="zip"
                  name="zip"
                  type="text"
                  value={businessData.zip}
                  onChange={(e) => updateFormData("zip", e.target.value)}
                  placeholder="e.g., 8000"
                  className="w-full input-field border-gray-300"
                />
              </div>

              {/* Registration Number & TIN Number */}
              <div>
                <label
                  htmlFor="registration_number"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Registration Number
                </label>
                <input
                  id="registration_number"
                  name="registration_number"
                  type="text"
                  value={businessData.registration_number}
                  onChange={(e) =>
                    updateFormData("registration_number", e.target.value)
                  }
                  placeholder="Enter business registration number"
                  className="w-full input-field border-gray-300"
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
                  name="tin_number"
                  type="text"
                  value={businessData.tin_number}
                  onChange={(e) => updateFormData("tin_number", e.target.value)}
                  placeholder="Enter Tax Identification Number"
                  className="w-full input-field border-gray-300"
                />
              </div>

              {/* Email & Phone */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Business Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={businessData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter business email address"
                  className={`w-full input-field ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
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
                  Business Phone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={businessData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="e.g., +41 79 123 45 67"
                  className="w-full input-field border-gray-300"
                />
              </div>
            </div>

            {/* Website & Policy URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-lg shadow-sm border border-[#ECEDF0] p-6">
              <div>
                <label
                  htmlFor="website"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Website
                </label>
                <input
                  id="website"
                  name="website"
                  type="url"
                  value={businessData.website}
                  onChange={(e) => updateFormData("website", e.target.value)}
                  placeholder="e.g., https://www.yourbusiness.com"
                  className="w-full input-field border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="privacy_policy_url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Privacy Policy URL
                </label>
                <input
                  id="privacy_policy_url"
                  name="privacy_policy_url"
                  type="url"
                  value={businessData.privacy_policy_url}
                  onChange={(e) =>
                    updateFormData("privacy_policy_url", e.target.value)
                  }
                  placeholder="e.g., https://www.yourbusiness.com/privacy"
                  className="w-full input-field border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="unsubscription_url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Unsubscription URL
                </label>
                <input
                  id="unsubscription_url"
                  name="unsubscription_url"
                  type="url"
                  value={businessData.unsubscription_url}
                  onChange={(e) =>
                    updateFormData("unsubscription_url", e.target.value)
                  }
                  placeholder="e.g., https://www.yourbusiness.com/unsubscribe"
                  className="w-full input-field border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="help_center_url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Help Center URL
                </label>
                <input
                  id="help_center_url"
                  name="help_center_url"
                  type="url"
                  value={businessData.help_center_url}
                  onChange={(e) =>
                    updateFormData("help_center_url", e.target.value)
                  }
                  placeholder="e.g., https://www.yourbusiness.com/help"
                  className="w-full input-field border-gray-300"
                />
              </div>
              <div>
                <label
                  htmlFor="logo_href"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Logo Link (Href)
                </label>
                <input
                  id="logo_href"
                  name="logo_href"
                  type="url"
                  value={businessData.logo_href}
                  onChange={(e) => updateFormData("logo_href", e.target.value)}
                  placeholder="e.g., https://www.yourbusiness.com/logo-link"
                  className="w-full input-field border-gray-300"
                />
              </div>
            </div>

            {/* Theme Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-lg shadow-sm border border-[#ECEDF0] p-6">
              <div>
                <label
                  htmlFor="theme_color"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Theme Color
                </label>
                <input
                  id="theme_color"
                  name="theme_color"
                  type="color"
                  value={businessData.theme_color}
                  onChange={(e) =>
                    updateFormData("theme_color", e.target.value)
                  }
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label
                  htmlFor="secondary_color"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Secondary Color
                </label>
                <input
                  id="secondary_color"
                  name="secondary_color"
                  type="color"
                  value={businessData.secondary_color}
                  onChange={(e) =>
                    updateFormData("secondary_color", e.target.value)
                  }
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label
                  htmlFor="text_color"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Text Color
                </label>
                <input
                  id="text_color"
                  name="text_color"
                  type="color"
                  value={businessData.text_color}
                  onChange={(e) => updateFormData("text_color", e.target.value)}
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
              <div>
                <label
                  htmlFor="ahref_link_color"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Link Color
                </label>
                <input
                  id="ahref_link_color"
                  name="ahref_link_color"
                  type="color"
                  value={businessData.ahref_link_color}
                  onChange={(e) =>
                    updateFormData("ahref_link_color", e.target.value)
                  }
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                />
              </div>
            </div>

            {/* Document Uploads using the FileInput component */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 bg-white rounded-lg shadow-sm border border-[#ECEDF0] p-6">
              <FileInput
                id="national_id_document"
                label="National ID Document"
                accept="image/*,application/pdf"
                selectedFile={businessData.national_id_document}
                onChange={(e) =>
                  handleFileChange("national_id_document", e.target.files[0])
                }
                error={errors.national_id_document}
              />
              <FileInput
                id="logo"
                label="Business Logo"
                accept="image/*"
                selectedFile={businessData.logo}
                onChange={(e) => handleFileChange("logo", e.target.files[0])}
                error={errors.logo}
              />
              <FileInput
                id="registration_document"
                label="Registration Document"
                accept="image/*,application/pdf"
                selectedFile={businessData.registration_document}
                onChange={(e) =>
                  handleFileChange("registration_document", e.target.files[0])
                }
                error={errors.registration_document}
              />
              <FileInput
                id="utility_bill_document"
                label="Utility Bill Document"
                accept="image/*,application/pdf"
                selectedFile={businessData.utility_bill_document}
                onChange={(e) =>
                  handleFileChange("utility_bill_document", e.target.files[0])
                }
                error={errors.utility_bill_document}
              />
            </div>

            {/* Save Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-[30px] transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
              >
                {isSaving ? (
                  <Loader2 className="w-4 text-white animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
