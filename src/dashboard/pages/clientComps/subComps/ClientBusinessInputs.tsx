import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useVerifyBusiness } from "../../../../hooks/businessHooks";
import ToastUtils from "../../../../utils/toastUtil";

interface ClientBusinessInputsProps {
  formData: any;
  handleInputChange: (e: any) => void;
  errors: any;
  industries: any[];
  isIndustriesFetching: boolean;
  target?: string;
  updateFormData?: (field: string, value: any) => void;
  tenants?: any[];
  tenantName?: string;
  countries?: any[];
  states?: any[];
  cities?: any[];
  handleSelectChange?: (field: string, value: any, optionsList?: any[]) => void;
  isTenantsFetching?: boolean;
  isCountriesFetching?: boolean;
  isStatesFetching?: boolean;
  isCitiesFetching?: boolean;
}

const ClientBusinessInputs: React.FC<ClientBusinessInputsProps> = ({
  formData,
  handleInputChange,
  errors,
  industries,
  isIndustriesFetching,
  target = "client",
  updateFormData,
  tenants = [],
  tenantName,
  countries = [],
  states = [],
  cities = [],
  handleSelectChange,
  isTenantsFetching = false,
  isCountriesFetching = false,
  isStatesFetching = false,
  isCitiesFetching = false,
}) => {
  const [type, setType] = useState("CAC_BASIC");
  const [isBusinessVerified, setIsBusinessVerified] = useState(false);

  const { mutate: verifyBusiness, isPending } = useVerifyBusiness();

  const handleVerifyBusiness = () => {
    if (!formData.business_name || !formData.registration_number || !formData.company_type) {
      ToastUtils.error("Please fill in all required business fields to verify.");
      return;
    }

    const verificationData = {
      target: target,
      business_name: formData.business_name,
      registration_number: formData.registration_number,
      company_type: formData.company_type,
      type,
    };

    verifyBusiness(verificationData, {
      onSuccess: (data: any) => {
        setIsBusinessVerified(true);
        ToastUtils.success("Business verified successfully!");
        if (data?.verification_token) {
          handleInputChange({
            target: {
              id: "verification_token",
              value: data.verification_token,
            },
          });
        }
      },
      onError: (err: any) => {
        setIsBusinessVerified(false);
        ToastUtils.error(err.message || "Failed to verify business.");
      },
    });
  };

  const handleCheckboxChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.checked;
    if (updateFormData) {
      updateFormData(field, value);
      return;
    }
    handleInputChange({ target: { id: field, value } });
  };

  const handleSelect = (field: string, value: any, optionsList?: any[]) => {
    if (handleSelectChange) {
      handleSelectChange(field, value, optionsList);
      return;
    }
    if (updateFormData) {
      updateFormData(field, value);
      return;
    }
    handleInputChange({ target: { id: field, value } });
  };

  const showTenantSelect = tenants && tenants.length > 0;
  const showTenantAssignment = showTenantSelect || !!tenantName;
  const showCountrySelect = countries && countries.length > 0;
  const showStateSelect = states && states.length > 0;
  const showCitySelect = cities && cities.length > 0;

  const verificationLabel = isBusinessVerified ? "Business Verified" : "Verify Business";

  return (
    <div className="space-y-8">
      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Account contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
              First name<span className="text-red-500">*</span>
            </label>
            <input
              id="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleInputChange}
              placeholder="First name"
              className={`w-full input-field ${errors.first_name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
              Last name<span className="text-red-500">*</span>
            </label>
            <input
              id="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleInputChange}
              placeholder="Last name"
              className={`w-full input-field ${errors.last_name ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="name@company.com"
              className={`w-full input-field ${errors.email ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone number<span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+234..."
              className={`w-full input-field ${errors.phone ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Credentials</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Temporary password<span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter temporary password"
              className={`w-full input-field ${errors.password ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          <div>
            <label
              htmlFor="password_confirmation"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm password<span className="text-red-500">*</span>
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={formData.password_confirmation}
              onChange={handleInputChange}
              placeholder="Re-enter password"
              className={`w-full input-field ${
                errors.password_confirmation ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.password_confirmation && (
              <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!formData.force_password_reset}
              onChange={handleCheckboxChange("force_password_reset")}
            />
            Force password reset on first login
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!formData.verified}
              onChange={handleCheckboxChange("verified")}
            />
            Mark client as verified
          </label>
        </div>
      </section>

      {showTenantAssignment && (
        <section>
          <h3 className="text-base font-semibold text-gray-800 mb-3">Tenant assignment</h3>
          <div>
            <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700 mb-2">
              Tenant workspace
            </label>
            {showTenantSelect ? (
              <select
                id="tenant_id"
                value={formData.tenant_id}
                onChange={(e) => handleSelect("tenant_id", e.target.value, tenants)}
                className={`w-full input-field ${
                  errors.tenant_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isTenantsFetching}
              >
                <option value="">Select tenant (optional)</option>
                {(tenants || []).map((tenant: any) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="tenant_id"
                type="text"
                value={tenantName || "Current tenant"}
                readOnly
                className="w-full input-field bg-gray-50 text-gray-600"
              />
            )}
            {errors.tenant_id && <p className="text-red-500 text-xs mt-1">{errors.tenant_id}</p>}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-base font-semibold text-gray-800 mb-3">Location details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="country_id" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              id="country_id"
              value={formData.country_id}
              onChange={(e) => handleSelect("country_id", e.target.value, countries)}
              className={`w-full input-field ${errors.country_id ? "border-red-500" : "border-gray-300"}`}
              disabled={isCountriesFetching || !showCountrySelect}
            >
              <option value="">{isCountriesFetching ? "Loading..." : "Select country"}</option>
              {(countries || []).map((country: any) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {errors.country_id && <p className="text-red-500 text-xs mt-1">{errors.country_id}</p>}
          </div>
          <div>
            <label htmlFor="state_id" className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <select
              id="state_id"
              value={formData.state_id}
              onChange={(e) => handleSelect("state_id", e.target.value, states)}
              className={`w-full input-field ${errors.state_id ? "border-red-500" : "border-gray-300"}`}
              disabled={isStatesFetching || !showStateSelect}
            >
              <option value="">{isStatesFetching ? "Loading..." : "Select state"}</option>
              {(states || []).map((state: any) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors.state_id && <p className="text-red-500 text-xs mt-1">{errors.state_id}</p>}
          </div>
          <div>
            <label htmlFor="city_id" className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            {showCitySelect ? (
              <select
                id="city_id"
                value={formData.city_id}
                onChange={(e) => handleSelect("city_id", e.target.value, cities)}
                className={`w-full input-field ${errors.city ? "border-red-500" : "border-gray-300"}`}
                disabled={isCitiesFetching}
              >
                <option value="">{isCitiesFetching ? "Loading..." : "Select city"}</option>
                {(cities || []).map((city: any) => (
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
                placeholder="City"
                className={`w-full input-field ${errors.city ? "border-red-500" : "border-gray-300"}`}
              />
            )}
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              id="address"
              type="text"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Street address"
              className={`w-full input-field ${errors.address ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
          </div>
          <div>
            <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700 mb-2">
              Zip code
            </label>
            <input
              id="zip_code"
              type="text"
              value={formData.zip_code}
              onChange={handleInputChange}
              placeholder="Zip code"
              className={`w-full input-field ${errors.zip_code ? "border-red-500" : "border-gray-300"}`}
            />
            {errors.zip_code && <p className="text-red-500 text-xs mt-1">{errors.zip_code}</p>}
          </div>
        </div>
      </section>

      <section className="border-t border-gray-200 pt-4">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              Type<span className="text-red-500">*</span>
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.type ? "border-red-500 border" : ""
              }`}
            >
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-transparent outline-none text-gray-700"
                disabled={isIndustriesFetching || isPending || isBusinessVerified}
              >
                <option value="CAC_BASIC">CAC_BASIC</option>
                <option value="CAC_ENRICHED">CAC_ENRICHED</option>
              </select>
            </span>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>
          <div>
            <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
              Business Name<span className="text-red-500">*</span>
            </label>
            <input
              id="business_name"
              type="text"
              value={formData.business_name}
              onChange={handleInputChange}
              placeholder="e.g., Acme Corp"
              className={`w-full input-field ${
                errors.business_name ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isIndustriesFetching || isPending || isBusinessVerified}
            />
            {errors.business_name && (
              <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>
            )}
          </div>
          <div>
            <label htmlFor="company_type" className="block text-sm font-medium text-gray-700 mb-2">
              Company Type<span className="text-red-500">*</span>
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.company_type ? "border-red-500 border" : ""
              }`}
            >
              <select
                id="company_type"
                value={formData.company_type}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none text-gray-700"
                disabled={isIndustriesFetching || isPending || isBusinessVerified}
              >
                <option value="">Select company type</option>
                <option value="RC">Limited Liability Company</option>
                <option value="BN">Business Name</option>
                <option value="IT">Incorporated Trustees</option>
                <option value="LL">Limited Liability</option>
                <option value="LLP">Limited Liability Partnership</option>
                <option value="Other">Other</option>
              </select>
            </span>
            {errors.company_type && (
              <p className="text-red-500 text-xs mt-1">{errors.company_type}</p>
            )}
          </div>
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry<span className="text-red-500">*</span>
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.industry ? "border-red-500 border" : ""
              }`}
            >
              {isIndustriesFetching ? (
                <div className="flex items-center py-2">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                  <span className="text-gray-500 text-sm">Loading industries...</span>
                </div>
              ) : industries && industries.length > 0 ? (
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  className="w-full bg-transparent outline-none text-gray-700"
                  disabled={isIndustriesFetching || isPending || isBusinessVerified}
                >
                  <option value="">Select an industry</option>
                  {industries.map((industry) => (
                    <option key={industry.name} value={industry.name}>
                      {industry.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center text-gray-500 text-sm">
                  No industries available.
                </div>
              )}
            </span>
            {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry}</p>}
          </div>
          <div>
            <label
              htmlFor="registration_number"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Registration Number<span className="text-red-500">*</span>
            </label>
            <input
              id="registration_number"
              type="text"
              value={formData.registration_number}
              onChange={handleInputChange}
              placeholder="e.g., 123456789"
              className={`w-full input-field ${
                errors.registration_number ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isIndustriesFetching || isPending || isBusinessVerified}
            />
            {errors.registration_number && (
              <p className="text-red-500 text-xs mt-1">{errors.registration_number}</p>
            )}
          </div>
          <div>
            <label htmlFor="tin_number" className="block text-sm font-medium text-gray-700 mb-2">
              TIN Number
            </label>
            <input
              id="tin_number"
              type="text"
              value={formData.tin_number}
              onChange={handleInputChange}
              placeholder="e.g., 98-7654321"
              className={`w-full input-field ${
                errors.tin_number ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isIndustriesFetching || isPending || isBusinessVerified}
            />
            {errors.tin_number && <p className="text-red-500 text-xs mt-1">{errors.tin_number}</p>}
          </div>
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              id="website"
              type="text"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="e.g., https://example.com"
              className={`w-full input-field ${
                errors.website ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isIndustriesFetching || isPending || isBusinessVerified}
            />
            {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
          </div>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={handleVerifyBusiness}
            disabled={isPending || isBusinessVerified}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#288DD1] hover:bg-[#6db1df] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span className="ml-2">Verifying Business...</span>
              </div>
            ) : (
              verificationLabel
            )}
          </button>
        </div>
        {isBusinessVerified && (
          <p className="text-green-500 text-sm mt-4 text-center">Business Verified Successfully!</p>
        )}
      </section>
    </div>
  );
};

export default ClientBusinessInputs;
