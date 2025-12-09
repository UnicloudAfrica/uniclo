// @ts-nocheck
import React from "react";

interface BusinessAddressProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
  countries: any[];
  isCountriesFetching: boolean;
  states?: any[];
  isStatesFetching?: boolean;
  cities?: any[];
  isCitiesFetching?: boolean;
  setErrors?: (errors: any) => void;
}

const BusinessAddress: React.FC<BusinessAddressProps> & {
  validate: (data: any) => any;
} = ({ formData, setFormData, errors, countries, isCountriesFetching }) => {
  return (
    <div className="space-y-4 font-Outfit">
      <div>
        <label htmlFor="business_address" className="block text-sm font-medium text-gray-700 mb-2">
          Business Address *
        </label>
        <input
          id="business_address"
          type="text"
          value={formData.business.address}
          onChange={(e) =>
            setFormData({
              ...formData,
              business: { ...formData.business, address: e.target.value },
            })
          }
          placeholder="Enter business Address"
          className={`w-full input-field ${
            errors.address ? "border-red-500" : "border-gray-300"
          } rounded px-3 py-2`}
        />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
            Postal / Zip Code *
          </label>
          <input
            id="zip_code"
            type="text"
            value={formData.business.zip}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, zip: e.target.value },
              })
            }
            placeholder="Enter Postal / Zip Code"
            className={`w-full input-field ${
              errors.zip ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.zip && <p className="text-red-500 text-xs mt-1">{errors.zip}</p>}
        </div>
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
            Country *
          </label>
          <span
            className={`w-full input-field block transition-all ${
              errors.country ? "border-red-500 border" : "border-gray-300 border"
            } rounded px-3 py-2`}
          >
            <select
              id="country"
              value={formData.business.country_id || ""}
              onChange={(e) => {
                const value = e.target.value;
                const selectedCountry = countries?.find((c) => c.id === parseInt(value));
                setFormData({
                  ...formData,
                  business: {
                    ...formData.business,
                    country: selectedCountry ? selectedCountry.name : "",
                    country_id: value,
                  },
                });
              }}
              className="w-full bg-transparent outline-none"
              disabled={isCountriesFetching || !countries?.length}
            >
              <option value="" disabled>
                {isCountriesFetching ? "Loading countries..." : "Select country"}
              </option>
              {countries?.length ? (
                countries.map((country: any) => (
                  <option key={country.id} value={country.id.toString()}>
                    {country.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No countries available
                </option>
              )}
            </select>
          </span>
          {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            id="city"
            type="text"
            value={formData.business.city}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, city: e.target.value },
              })
            }
            placeholder="Enter City"
            className={`w-full input-field ${
              errors.city ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
            State/Region/Province *
          </label>
          <input
            id="state"
            type="text"
            value={formData.business.state}
            onChange={(e) =>
              setFormData({
                ...formData,
                business: { ...formData.business, state: e.target.value },
              })
            }
            placeholder="Enter State/Region/Province"
            className={`w-full input-field ${
              errors.state ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
        </div>
      </div>
    </div>
  );
};

BusinessAddress.validate = (formData: any) => {
  const newErrors: any = {};
  if (!formData.business.address) newErrors.address = "Address is required";
  if (!formData.business.zip) newErrors.zip = "Zip code is required";
  if (!formData.business.country_id) newErrors.country = "Country is required";
  if (!formData.business.city) newErrors.city = "City is required";
  if (!formData.business.state) newErrors.state = "State/Region is required";
  return newErrors;
};

export default BusinessAddress;
