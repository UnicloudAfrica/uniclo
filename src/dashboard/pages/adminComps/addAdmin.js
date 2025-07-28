import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateTenantAdmin } from "../../../hooks/adminUserHooks";

export const AddTenantAdminModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
    workspace_role: "admin",
    force_password_reset: true,
  });
  const [errors, setErrors] = useState({});

  const {
    mutate: createAdmin,
    isPending,
    isError,
    error,
    isSuccess,
  } = useCreateTenantAdmin();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last name is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!formData.password.trim()) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }
    if (!formData.password_confirmation.trim()) {
      newErrors.password_confirmation = "Confirm password is required.";
    } else if (formData.password_confirmation !== formData.password) {
      newErrors.password_confirmation = "Passwords do not match.";
    }
    if (!formData.workspace_role) {
      newErrors.workspace_role = "Workspace role is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const adminData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        workspace_role: formData.workspace_role,
        force_password_reset: formData.force_password_reset,
      };

      createAdmin(adminData, {
        onSuccess: () => {
          setTimeout(() => {
            setFormData({
              first_name: "",
              last_name: "",
              phone: "",
              email: "",
              password: "",
              password_confirmation: "",
              workspace_role: "admin",
              force_password_reset: true,
            });
            setErrors({});
            onClose();
          }, 1500);
        },
        onError: (err) => {
          console.error("Failed to add admin:", err);
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] w-full mx-4 flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Add New Admin
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors rounded-full p-1"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px] flex-1">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name<span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Enter first name"
                className={`w-full input-field ${
                  errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name<span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Enter last name"
                className={`w-full input-field ${
                  errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number<span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                className={`w-full input-field ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address<span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={`w-full input-field ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password<span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className={`w-full input-field ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password<span className="text-red-500">*</span>
              </label>
              <input
                id="password_confirmation"
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                placeholder="Confirm password"
                className={`w-full input-field ${
                  errors.password_confirmation
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.password_confirmation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="workspace_role"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Workspace Role<span className="text-red-500">*</span>
              </label>
              <select
                id="workspace_role"
                name="workspace_role"
                value={formData.workspace_role}
                onChange={handleChange}
                className={`w-full input-field ${
                  errors.workspace_role ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {errors.workspace_role && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.workspace_role}
                </p>
              )}
            </div>

            <div className="flex items-center mt-2">
              <input
                id="force_password_reset"
                type="checkbox"
                name="force_password_reset"
                checked={formData.force_password_reset}
                onChange={handleChange}
                className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                disabled={isPending}
              />
              <label
                htmlFor="force_password_reset"
                className="ml-2 block text-sm text-gray-900"
              >
                Force Password Reset on Next Login
              </label>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Admin"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
