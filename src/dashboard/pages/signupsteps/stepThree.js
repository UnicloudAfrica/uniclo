import React from "react";

export const BusinessAddressStep = ({
  formData,
  updateFormData,
  errors,
  countries,
  isCountriesFetching,
}) => (
  <div className="space-y-4">
    <div>
      <label
        htmlFor="countryId"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Country
      </label>
      <span
        className={`w-full input-field block transition-all ${
          errors.countryId ? "border-red-500 border" : ""
        }`}
      >
        <select
          id="countryId"
          value={formData.countryId}
          onChange={(e) => updateFormData("countryId", e.target.value)}
          className="w-full bg-transparent outline-none"
          disabled={isCountriesFetching}
        >
          <option value="">Select country</option>
          {countries &&
            countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
        </select>
      </span>
      {errors.countryId && (
        <p className="text-red-500 text-xs mt-1">{errors.countryId}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="state"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        State/Province
      </label>
      <input
        id="state"
        type="text"
        value={formData.state}
        onChange={(e) => updateFormData("state", e.target.value)}
        placeholder="Enter state or province"
        className={`w-full input-field transition-all ${
          errors.state ? "border-red-500 border" : ""
        }`}
      />
      {errors.state && (
        <p className="text-red-500 text-xs mt-1">{errors.state}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="city"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        City
      </label>
      <input
        id="city"
        type="text"
        value={formData.city}
        onChange={(e) => updateFormData("city", e.target.value)}
        placeholder="Enter city"
        className={`w-full input-field transition-all ${
          errors.city ? "border-red-500 border" : ""
        }`}
      />
      {errors.city && (
        <p className="text-red-500 text-xs mt-1">{errors.city}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="address"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Street Address
      </label>
      <textarea
        id="address"
        value={formData.address}
        onChange={(e) => updateFormData("address", e.target.value)}
        placeholder="Enter full address"
        rows="3"
        className={`w-full input-field transition-all resize-none ${
          errors.address ? "border-red-500 border" : ""
        }`}
      />
      {errors.address && (
        <p className="text-red-500 text-xs mt-1">{errors.address}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="postalCode"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Postal Code
      </label>
      <input
        id="postalCode"
        type="text"
        value={formData.postalCode}
        onChange={(e) => updateFormData("postalCode", e.target.value)}
        placeholder="Enter postal code"
        className={`w-full input-field transition-all ${
          errors.postalCode ? "border-red-500 border" : ""
        }`}
      />
      {errors.postalCode && (
        <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
      )}
    </div>
  </div>
);
