// components/PartnerBusinessStep.jsx
import React from "react";
import { Loader2 } from "lucide-react";
import ClientBusinessInputs from "../clientComps/subComps/clientBusinessInputs";

export default function PartnerBusinessStep({
  formData,
  errors,
  industries,
  isIndustriesFetching,
  updateFormData,
  onBack,
  isPending,
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subdomain <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <input
            type="text"
            value={formData.subdomain}
            onChange={(e) => updateFormData("subdomain", e.target.value)}
            className={`input-field sub-input flex-grow ${
              errors.subdomain ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="mycompany"
          />
          <span className="inline-flex items-center px-3 border border-l-0 border-gray-300 bg-gray-100 rounded-r-lg text-gray-700 text-sm">
            .unicloudafrica.com
          </span>
        </div>
        {errors.subdomain && (
          <p className="text-red-500 text-xs mt-1">{errors.subdomain}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Business Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.businessPhone}
          onChange={(e) => updateFormData("businessPhone", e.target.value)}
          className={`input-field ${
            errors.businessPhone ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter business phone (e.g., +1234567890)"
        />
        {errors.businessPhone && (
          <p className="text-red-500 text-xs mt-1">{errors.businessPhone}</p>
        )}
      </div>
      <ClientBusinessInputs
        formData={formData}
        handleInputChange={(e) => updateFormData(e.target.id, e.target.value)}
        errors={errors}
        industries={industries}
        isIndustriesFetching={isIndustriesFetching}
      />
      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isPending || !formData.verification_token}
          className="flex-1 bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sign Up
          {isPending && (
            <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
          )}
        </button>
      </div>
    </div>
  );
}
