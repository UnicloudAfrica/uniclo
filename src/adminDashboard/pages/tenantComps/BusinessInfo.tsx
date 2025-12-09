// @ts-nocheck
import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useVerifyBusiness } from "../../../hooks/businessHooks";
import ToastUtils from "../../../utils/toastUtil";

interface BusinessInfoProps {
  formData: any;
  setFormData: (data: any) => void;
  errors: any;
  setErrors: (errors: any) => void;
  industries: any[];
  isIndustriesFetching: boolean;
}

const BusinessInfo: React.FC<BusinessInfoProps> & {
  validate: (data: any) => any;
} = ({ formData, setFormData, errors, setErrors, industries, isIndustriesFetching }) => {
  const [isBusinessVerified, setIsBusinessVerified] = useState(formData.business.verified);
  const [verificationType, setVerificationType] = useState(""); // Local state for CAC verification type
  const { mutate: verifyBusiness, isPending } = useVerifyBusiness();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    let field;
    if (id === "business_name") field = "name";
    else if (id === "business_email") field = "email";
    else if (id === "business_phone") field = "phone";
    else field = id;

    if (id === "verification_type") {
      setVerificationType(value);
    } else if (id === "business_structure") {
      setFormData((prev: any) => ({
        ...prev,
        business: { ...prev.business, type: value },
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        business: { ...prev.business, [field]: value },
        ...(id === "verification_token" ? { verification_token: value } : {}),
      }));
    }
    setErrors((prev: any) => ({ ...prev, [id]: null }));
  };

  const handleVerifyBusiness = () => {
    if (!formData.business.name || !formData.business.registration_number || !verificationType) {
      ToastUtils.error("Please fill in all required business fields to verify.");
      return;
    }

    const verificationData = {
      target: "tenant",
      business_name: formData.business.name,
      registration_number: formData.business.registration_number,
      company_type: formData.business.company_type,
      type: verificationType, // Use local verificationType
    };

    verifyBusiness(verificationData, {
      onSuccess: (data: any) => {
        setIsBusinessVerified(true);
        setFormData((prev: any) => ({
          ...prev,
          verification_token: data?.verification_token || prev.verification_token,
          business: { ...prev.business, verified: true },
        }));
        ToastUtils.success("Business verified successfully!");
      },
      onError: (err: any) => {
        setIsBusinessVerified(false);
        ToastUtils.error(err.message || "Failed to verify business.");
      },
    });
  };

  return (
    <div className="space-y-4 font-Outfit">
      <h3 className="text-base font-semibold text-gray-800 mb-3">Business Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="verification_type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Verification Type<span className="text-red-500">*</span>
          </label>
          <select
            id="verification_type"
            value={verificationType}
            onChange={handleInputChange}
            className={`w-full input-field ${
              errors.verification_type ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
          >
            <option value="">Select verification type</option>
            <option value="CAC_BASIC">CAC_BASIC</option>
            <option value="CAC_ENRICHED">CAC_ENRICHED</option>
          </select>
          {errors.verification_type && (
            <p className="text-red-500 text-xs mt-1">{errors.verification_type}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="business_structure"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Structure<span className="text-red-500">*</span>
          </label>
          <select
            id="business_structure"
            value={formData.business.type}
            onChange={handleInputChange}
            className={`w-full input-field ${
              errors.business_structure ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
          >
            <option value="">Select business structure</option>
            <option value="BNG">BNG</option>
            <option value="LLC">LLC</option>
            <option value="NGO">NGO</option>
            <option value="LLP">LLP</option>
            <option value="Other">Other</option>
          </select>
          {errors.business_structure && (
            <p className="text-red-500 text-xs mt-1">{errors.business_structure}</p>
          )}
        </div>
        <div>
          <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name<span className="text-red-500">*</span>
          </label>
          <input
            id="business_name"
            type="text"
            value={formData.business.name}
            onChange={handleInputChange}
            placeholder="e.g., Acme Corp"
            className={`w-full input-field ${
              errors.business_name ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
          />
          {errors.business_name && (
            <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>
          )}
        </div>
        <div>
          <label htmlFor="company_type" className="block text-sm font-medium text-gray-700 mb-2">
            Company Type<span className="text-red-500">*</span>
          </label>
          <select
            id="company_type"
            value={formData.business.company_type}
            onChange={handleInputChange}
            className={`w-full input-field ${
              errors.company_type ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
          >
            <option value="">Select company type</option>
            <option value="RC">Limited Liability Company</option>
            <option value="BN">Business Name</option>
            <option value="IT">Incorporated Trustees</option>
            <option value="LL">Limited Liability</option>
            <option value="LLP">Limited Liability Partnership</option>
            <option value="Other">Other</option>
          </select>
          {errors.company_type && (
            <p className="text-red-500 text-xs mt-1">{errors.company_type}</p>
          )}
        </div>
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
            Industry<span className="text-red-500">*</span>
          </label>
          {isIndustriesFetching ? (
            <div className="flex items-center py-2">
              <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
              <span className="text-gray-500 text-sm">Loading industries...</span>
            </div>
          ) : industries && industries.length > 0 ? (
            <select
              id="industry"
              value={formData.business.industry}
              onChange={handleInputChange}
              className={`w-full input-field ${
                errors.industry ? "border-red-500" : "border-gray-300"
              } rounded px-3 py-2`}
              disabled={isIndustriesFetching || isPending}
            >
              <option value="">Select an industry</option>
              {industries.map((industry: any) => (
                <option key={industry.name} value={industry.name}>
                  {industry.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center text-gray-500 text-sm">No industries available.</div>
          )}
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
            value={formData.business.registration_number}
            onChange={handleInputChange}
            placeholder="e.g., 123456789"
            className={`w-full input-field ${
              errors.registration_number ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
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
            value={formData.business.tin_number}
            onChange={handleInputChange}
            placeholder="e.g., 98-7654321"
            className={`w-full input-field ${
              errors.tin_number ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
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
            value={formData.business.website}
            onChange={handleInputChange}
            placeholder="e.g., https://example.com"
            className={`w-full input-field ${
              errors.website ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
            disabled={isIndustriesFetching || isPending}
          />
          {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
        </div>
        <div>
          <label htmlFor="business_email" className="block text-sm font-medium text-gray-700 mb-2">
            Business Email<span className="text-red-500">*</span>
          </label>
          <input
            id="business_email"
            type="email"
            value={formData.business.email}
            onChange={handleInputChange}
            placeholder="Enter business email address"
            className={`w-full input-field ${
              errors.business_email ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.business_email && (
            <p className="text-red-500 text-xs mt-1">{errors.business_email}</p>
          )}
        </div>
        <div>
          <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700 mb-2">
            Business Phone<span className="text-red-500">*</span>
          </label>
          <input
            id="business_phone"
            type="tel"
            value={formData.business.phone}
            onChange={handleInputChange}
            placeholder="Enter business phone (e.g., +1234567890)"
            className={`w-full input-field ${
              errors.business_phone ? "border-red-500" : "border-gray-300"
            } rounded px-3 py-2`}
          />
          {errors.business_phone && (
            <p className="text-red-500 text-xs mt-1">{errors.business_phone}</p>
          )}
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

BusinessInfo.validate = (formData: any) => {
  const newErrors: any = {};
  if (!formData.business.name) newErrors.business_name = "Business Name is required";
  if (!formData.business.company_type) newErrors.company_type = "Company Type is required";
  if (!formData.business.industry) newErrors.industry = "Industry is required";
  if (!formData.business.registration_number)
    newErrors.registration_number = "Registration Number is required";
  if (!formData.business.type) newErrors.business_structure = "Business Structure is required";
  if (!formData.business.email || !/\S+@\S+\.\S+/.test(formData.business.email))
    newErrors.business_email = "Valid business email is required";
  if (!formData.business.phone || !/^\+?\d{10,15}$/.test(formData.business.phone))
    newErrors.business_phone = "Valid business phone is required";
  if (formData.business.website && !/^https?:\/\/\S+$/.test(formData.business.website))
    newErrors.website = "Invalid website URL";
  if (!formData.verification_token)
    newErrors.verification_token = "Business verification is required";
  return newErrors;
};

export default BusinessInfo;
