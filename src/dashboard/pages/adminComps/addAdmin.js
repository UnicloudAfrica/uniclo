import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateTenantAdmin } from "../../../hooks/adminUserHooks";

export const AddTenantAdminModal = ({ isOpen, onClose }) => {
  // State for form fields
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});

  // Use the useCreateAdmin hook
  const {
    mutate: createAdmin,
    isPending,
    isError,
    error,
    isSuccess,
  } = useCreateTenantAdmin();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    // Clear error for the current field as user types
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  // Basic form validation
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
    // Password confirmation validation
    if (!formData.password_confirmation.trim()) {
      newErrors.password_confirmation = "Confirm password is required.";
    } else if (formData.password_confirmation !== formData.password) {
      newErrors.password_confirmation = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    // Removed async keyword
    e.preventDefault();

    if (validateForm()) {
      const adminData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        role: "tenant",
      };

      // Call mutate directly without await
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
            });
            setErrors({});
            // ToastUtils.success("Admin added");
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
        {/* Header */}
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

        {/* Content */}
        <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px] flex-1">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Phone Number */}
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

            {/* Email Address */}
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

            {/* Password */}
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

            {/* Password Confirmation */}
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

            {isPending && (
              <div className="flex items-center justify-center text-[#288DD1] col-span-full">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Adding admin...
              </div>
            )}

            {/* {isError && (
              <p className="text-red-500 text-sm text-center col-span-full">
                Error:{" "}
                {error?.message || "Failed to add admin. Please try again."}
              </p>
            )}

            {isSuccess && ( // Using isSuccess from the hook
              <p className="text-green-600 text-sm text-center col-span-full">
                Admin added successfully!
              </p>
            )} */}
          </form>
        </div>

        {/* Footer */}
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
