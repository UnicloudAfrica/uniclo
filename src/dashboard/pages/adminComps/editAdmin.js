import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useUpdateTenantAdmin } from "../../../hooks/adminUserHooks";

export const EditAdminModal = ({ isOpen, onClose, admin }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    workspace_role: "member",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (admin) {
      setFormData({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        workspace_role: admin.pivot?.workspace_role || "",
        password: "",
        password_confirmation: "",
      });
      setErrors({});
    }
  }, [admin]);

  const { mutate: updateAdmin, isPending } = useUpdateTenantAdmin();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prevErrors) => ({ ...prevErrors, [name]: null }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = "First name is required.";
    if (!formData.last_name.trim()) newErrors.last_name = "Last name is required.";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email address is invalid.";
    }
    if (!formData.workspace_role) {
      newErrors.workspace_role = "Workspace role is required.";
    }

    // Password validation only if password field is touched
    if (formData.password.trim() || formData.password_confirmation.trim()) {
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!admin?.identifier) {
      ToastUtils.error("Admin identifier is missing for update.");
      return;
    }

    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const adminData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      workspace_role: formData.workspace_role,
    };

    // Only add password fields if they are provided
    if (formData.password.trim()) {
      adminData.password = formData.password;
      adminData.password_confirmation = formData.password_confirmation;
    }

    updateAdmin(
      { id: admin.identifier, adminData },
      {
        onSuccess: () => {
          ToastUtils.success("Admin updated successfully!");
          onClose();
        },
        onError: (err) => {
          //   console.error("Failed to update admin:", err);
          //   ToastUtils.error(
          //     err.message || "Failed to update admin. Please try again."
          //   );
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#1E1E1EB2]">
            Edit Admin: {admin?.first_name} {admin?.last_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            aria-label="Close"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 w-full max-h-[400px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                First Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={`input-field ${errors.first_name ? "border-red-500" : ""}`}
                disabled={isPending}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={`input-field ${errors.last_name ? "border-red-500" : ""}`}
                disabled={isPending}
              />
              {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? "border-red-500" : ""}`}
                disabled={isPending}
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`input-field ${errors.phone ? "border-red-500" : ""}`}
                disabled={isPending}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label
                htmlFor="workspace_role"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Workspace Role<span className="text-red-500">*</span>
              </label>
              <select
                id="workspace_role"
                name="workspace_role"
                value={formData.workspace_role}
                onChange={handleChange}
                className={`input-field ${errors.workspace_role ? "border-red-500" : ""}`}
                disabled={isPending}
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              {errors.workspace_role && (
                <p className="text-red-500 text-xs mt-1">{errors.workspace_role}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? "border-red-500" : ""}`}
                placeholder="Leave blank to keep current password"
                disabled={isPending}
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`input-field ${errors.password_confirmation ? "border-red-500" : ""}`}
                placeholder="Confirm new password"
                disabled={isPending}
              />
              {errors.password_confirmation && (
                <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
              )}
            </div>
          </div>

          {isPending && (
            <div className="flex items-center justify-center text-[#288DD1] my-4">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Saving changes...
            </div>
          )}
        </form>

        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Save Changes
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
