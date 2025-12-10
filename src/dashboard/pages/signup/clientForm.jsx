import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function ClientForm({
  formData,
  errors,
  updateFormData,
  isPending,
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
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => updateFormData("phone", e.target.value)}
          className={`input-field ${
            errors.phone ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="Enter phone number (e.g., +1234567890)"
        />
        {errors.phone && (
          <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
        )}
      </div>
    </div>
  );
}
