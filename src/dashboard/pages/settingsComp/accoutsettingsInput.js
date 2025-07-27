import React from "react";
import { Loader2 } from "lucide-react";

const AccountSettingsInputs = ({
  businessData,
  updateFormData,
  errors,
  countries,
  isCountriesFetching,
  industries,
  isIndustriesFetching,
  states,
  isStatesFetching,
  isCustomCountry,
  isCustomState,
}) => {
  // Determine if state input field should be shown instead of select
  const shouldShowStateInputField =
    !Array.isArray(states) ||
    states.length === 0 ||
    (businessData?.state &&
      !states.some(
        (s) => s.name?.toLowerCase() === businessData.state.toLowerCase()
      ));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <select
          id="type"
          value={businessData.type}
          onChange={(e) => updateFormData("type", e.target.value)}
          className={`w-full input-field bg-transparent outline-none ${
            errors.type ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">Select business type</option>
          <option value="BNG">Business Name</option>
          <option value="LLC">Limited Liability Company</option>
          <option value="NGO">Non-Governmental Organization</option>
          <option value="LLP">Limited Liability Partnership</option>
          <option value="Other">Other</option>
        </select>
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
        {isIndustriesFetching ? (
          <div className="flex items-center input-field py-2">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
            <span className="text-gray-500 text-sm">Loading industries...</span>
          </div>
        ) : Array.isArray(industries?.message) &&
          industries.message.length > 0 ? (
          <select
            id="industry"
            value={businessData.industry}
            onChange={(e) => updateFormData("industry", e.target.value)}
            className={`w-full input-field bg-transparent outline-none ${
              errors.industry ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isIndustriesFetching}
          >
            <option value="">Select an industry</option>
            {industries.message.map((industry) => (
              <option key={industry.name} value={industry.name}>
                {industry.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center input-field py-2 text-gray-500 text-sm">
            No industries available.
          </div>
        )}
        {errors.industry && (
          <p className="text-red-500 text-xs mt-1">{errors.industry}</p>
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
        {isCountriesFetching ? (
          <div className="flex items-center input-field py-2">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
            <span className="text-gray-500 text-sm">Loading countries...</span>
          </div>
        ) : Array.isArray(countries) && countries.length > 0 ? (
          <select
            id="country_id"
            value={businessData.country_id}
            onChange={(e) => updateFormData("country_id", e.target.value)}
            className={`w-full input-field bg-transparent outline-none ${
              errors.country_id ? "border-red-500" : "border-gray-300"
            }`}
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
          <div className="flex items-center input-field py-2 text-gray-500 text-sm">
            No countries available.
          </div>
        )}
        {isCustomCountry && (
          <input
            type="text"
            id="country"
            value={businessData.country}
            onChange={(e) => updateFormData("country", e.target.value)}
            placeholder="Enter custom country name"
            className={`w-full input-field mt-2 ${
              errors.country ? "border-red-500" : "border-gray-300"
            }`}
          />
        )}
        {errors.country_id && (
          <p className="text-red-500 text-xs mt-1">{errors.country_id}</p>
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
        {isStatesFetching ? (
          <div className="flex items-center input-field py-2">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
            <span className="text-gray-500 text-sm">Loading states...</span>
          </div>
        ) : Array.isArray(states) &&
          states.length > 0 &&
          !shouldShowStateInputField ? (
          <select
            id="state_id"
            value={businessData.state_id}
            onChange={(e) => updateFormData("state_id", e.target.value)}
            className={`w-full input-field bg-transparent outline-none ${
              errors.state ? "border-red-500" : "border-gray-300"
            }`}
            disabled={
              isStatesFetching || !businessData.country_id || isCustomCountry
            }
          >
            <option value="">Select state</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        ) : (
          <input
            type="text"
            id="state"
            value={businessData.state}
            onChange={(e) => updateFormData("state", e.target.value)}
            placeholder="Enter state or province"
            className={`w-full input-field ${
              errors.state ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isStatesFetching || !businessData.country_id}
          />
        )}
        {isCustomState && (
          <input
            type="text"
            id="state"
            value={businessData.state}
            onChange={(e) => updateFormData("state", e.target.value)}
            placeholder="Enter custom state name"
            className={`w-full input-field mt-2 ${
              errors.state ? "border-red-500" : "border-gray-300"
            }`}
          />
        )}
        {errors.state && (
          <p className="text-red-500 text-xs mt-1">{errors.state}</p>
        )}
      </div>

      {/* City - Always a direct input */}
      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          City<span className="text-red-500">*</span>
        </label>
        <input
          id="city"
          type="text"
          value={businessData.city}
          onChange={(e) => updateFormData("city", e.target.value)}
          placeholder="Enter city name"
          className={`w-full input-field ${
            errors.city ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isStatesFetching || !businessData.state} // Disable if state is loading or not entered
        />
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

      {/* Website & Policy URLs */}
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
          onChange={(e) => updateFormData("privacy_policy_url", e.target.value)}
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
          onChange={(e) => updateFormData("unsubscription_url", e.target.value)}
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
          onChange={(e) => updateFormData("help_center_url", e.target.value)}
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
  );
};

export default AccountSettingsInputs;
