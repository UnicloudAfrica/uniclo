// src/components/client/ClientBusinessInputs.jsx
import React from "react";
import { Loader2 } from "lucide-react";
import VerifyRCInput from "../../../../utils/verifyRcInput";

const ClientBusinessInputs = ({
  formData,
  handleInputChange,
  errors,
  industries,
  isIndustriesFetching,
}) => {
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-base font-semibold text-gray-800 mb-3">
        Business Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="business_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
            disabled={isIndustriesFetching}
          />
          {errors.business_name && (
            <p className="text-red-500 text-xs mt-1">{errors.business_name}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="business_type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Business Type<span className="text-red-500">*</span>
          </label>
          <span
            className={`w-full input-field block transition-all ${
              errors.business_type ? "border-red-500 border" : ""
            }`}
          >
            <select
              id="business_type"
              value={formData.business_type}
              onChange={handleInputChange}
              className="w-full bg-transparent outline-none"
              disabled={isIndustriesFetching}
            >
              <option value="">Select business type</option>
              <option value="BNG">Business Name</option>
              <option value="LLC">Limited Liability Company</option>
              <option value="NGO">Non-Governmental Organization</option>
              <option value="LLP">Limited Liability Partnership</option>
              <option value="Other">Other</option>
            </select>
          </span>
          {errors.business_type && (
            <p className="text-red-500 text-xs mt-1">{errors.business_type}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="industry"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
                <span className="text-gray-500 text-sm">
                  Loading industries...
                </span>
              </div>
            ) : industries && industries.length > 0 ? (
              <select
                id="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="w-full bg-transparent outline-none"
                disabled={isIndustriesFetching}
              >
                <option value="">Select an industry</option>
                {industries.map((industry) => (
                  <option key={industry.name} value={industry.name}>
                    {industry.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center  text-gray-500 text-sm">
                No industries available.
              </div>
            )}
          </span>
          {errors.industry && (
            <p className="text-red-500 text-xs mt-1">{errors.industry}</p>
          )}
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
            disabled={isIndustriesFetching}
          />
          {errors.registration_number && (
            <p className="text-red-500 text-xs mt-1">
              {errors.registration_number}
            </p>
          )}
        </div>
        <div>
          <VerifyRCInput
            value={formData.rc_verified}
            onChange={handleInputChange}
            error={errors.rc_verified}
            disabled={isIndustriesFetching}
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
            placeholder="e.g., 98-7654321"
            className={`w-full input-field ${
              errors.tin_number ? "border-red-500" : "border-gray-300"
            }`}
            disabled={isIndustriesFetching}
          />
          {errors.tin_number && (
            <p className="text-red-500 text-xs mt-1">{errors.tin_number}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
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
            disabled={isIndustriesFetching}
          />
          {errors.website && (
            <p className="text-red-500 text-xs mt-1">{errors.website}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientBusinessInputs;
