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
  target = "tenant",
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

  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
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
            Registration Number
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
          ) : isBusinessVerified ? (
            "Business Verified"
          ) : (
            "Verify Business"
          )}
        </button>
      </div>
      {isBusinessVerified && (
        <p className="text-green-500 text-sm mt-4 text-center">Business Verified Successfully!</p>
      )}
    </div>
  );
};

export default ClientBusinessInputs;
