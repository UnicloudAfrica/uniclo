import React from "react";
import { Loader2 } from "lucide-react";

export const BusinessAddressStep = ({
  formData,
  updateFormData,
  errors,
  countries,
  isCountriesFetching,
  states,
  isStatesFetching,
  cities,
  isCitiesFetching,
}) => {
  const isCustomState = formData.state_id === "other";
  const isCustomCity = formData.city_id === "other";

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="countryId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Country<span className="text-red-500">*</span>
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.countryId ? "border-red-500 border" : "border-gray-300"
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
              value={formData.countryId}
              onChange={(e) => updateFormData("countryId", e.target.value)}
              className="w-full bg-transparent outline-none py-2"
              disabled={isCountriesFetching}
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
        {errors.countryId && (
          <p className="text-red-500 text-xs mt-1">{errors.countryId}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="state_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          State/Province<span className="text-red-500">*</span>
        </label>
        {formData.countryId &&
        formData.countryId !== "other" &&
        states &&
        states.length > 0 ? (
          <>
            <span
              className={`w-full input-field block transition-all ${
                errors.state ? "border-red-500 border" : "border-gray-300"
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
                  value={formData.state_id}
                  onChange={(e) => updateFormData("state_id", e.target.value)}
                  className="w-full bg-transparent outline-none py-2"
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
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                placeholder="Enter state or province"
                className={`w-full input-field transition-all mt-2 ${
                  errors.state ? "border-red-500 border" : "border-gray-300"
                }`}
              />
            )}
          </>
        ) : (
          <input
            type="text"
            id="state"
            value={formData.state}
            onChange={(e) => updateFormData("state", e.target.value)}
            placeholder="Enter state or province"
            className={`w-full input-field transition-all ${
              errors.state ? "border-red-500 border" : "border-gray-300"
            }`}
          />
        )}
        {errors.state && (
          <p className="text-red-500 text-xs mt-1">{errors.state}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="city_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          City<span className="text-red-500">*</span>
        </label>
        {formData.state_id &&
        !isCustomState &&
        formData.countryId !== "other" &&
        cities &&
        cities.length > 0 ? (
          <>
            <span
              className={`w-full input-field block transition-all ${
                errors.city ? "border-red-500 border" : "border-gray-300"
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
                  value={formData.city_id}
                  onChange={(e) => updateFormData("city_id", e.target.value)}
                  className="w-full bg-transparent outline-none py-2"
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
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="Enter city"
                className={`w-full input-field transition-all mt-2 ${
                  errors.city ? "border-red-500 border" : "border-gray-300"
                }`}
              />
            )}
          </>
        ) : (
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData("city", e.target.value)}
            placeholder="Enter city"
            className={`w-full input-field transition-all ${
              errors.city ? "border-red-500 border" : "border-gray-300"
            }`}
          />
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
          Street Address<span className="text-red-500">*</span>
        </label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData("address", e.target.value)}
          placeholder="Enter full address"
          rows="3"
          className={`w-full input-field transition-all resize-none ${
            errors.address ? "border-red-500 border" : "border-gray-300"
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
          Postal Code<span className="text-red-500">*</span>
        </label>
        <input
          id="postalCode"
          type="text"
          value={formData.postalCode}
          onChange={(e) => updateFormData("postalCode", e.target.value)}
          placeholder="Enter postal code"
          className={`w-full input-field transition-all ${
            errors.postalCode ? "border-red-500 border" : "border-gray-300"
          }`}
        />
        {errors.postalCode && (
          <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
        )}
      </div>
    </div>
  );
};

export default BusinessAddressStep;
