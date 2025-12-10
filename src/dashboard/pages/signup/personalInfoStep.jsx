import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PersonalInfoStep({
  formData,
  errors,
  updateFormData,
  onNext,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contactPersonFirstName}
            onChange={(e) =>
              updateFormData("contactPersonFirstName", e.target.value)
            }
            className={`input-field ${
              errors.contactPersonFirstName
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Enter first name"
          />
          {errors.contactPersonFirstName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.contactPersonFirstName}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contactPersonLastName}
            onChange={(e) =>
              updateFormData("contactPersonLastName", e.target.value)
            }
            className={`input-field ${
              errors.contactPersonLastName
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder="Enter last name"
          />
          {errors.contactPersonLastName && (
            <p className="text-red-500 text-xs mt-1">
              {errors.contactPersonLastName}
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData("email", e.target.value)}
          className={`input-field ${
            errors.email ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter email"
        />
        {errors.email && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={(e) => updateFormData("password", e.target.value)}
            className={`input-field ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-xs mt-1">{errors.password}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => updateFormData("confirmPassword", e.target.value)}
            className={`input-field ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Confirm password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => updateFormData("companyName", e.target.value)}
          className={`input-field ${
            errors.companyName ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter company name"
        />
        {errors.companyName && (
          <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
        )}
      </div>
      <div className="flex gap-4 mt-8">
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2"
        >
          Next
        </button>
      </div>
    </div>
  );
}
