import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useUpdateTenantAdmin } from "../../../hooks/adminUserHooks";

export const EditAdminModal = ({ isOpen, onClose, admin, onUpdateSuccess }) => {
  // State to hold form data, initialized with admin prop
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    country_id: "", // Assuming country_id is used for country selection
    city: "",
    state: "",
    role: "", // Assuming role can be edited
  });

  // Populate form data when the modal opens or admin prop changes
  useEffect(() => {
    if (admin) {
      setFormData({
        first_name: admin.first_name || "",
        last_name: admin.last_name || "",
        email: admin.email || "",
        phone: admin.phone || "",
        address: admin.address || "",
        zip: admin.zip || "",
        country_id: admin.country_id || "", // Use country_id if available
        city: admin.city || "",
        state: admin.state || "",
        role: admin.role || "",
      });
    }
  }, [admin]);

  // Use the useUpdateAdmin hook
  const {
    mutate: updateAdmin, // Renamed mutate to updateAdmin for clarity
    isPending,
    isError,
    error,
    isSuccess,
  } = useUpdateTenantAdmin();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!admin?.identifier) {
      //   ToastUtils.error("Admin ID is missing for update.");
      return;
    }

    // Prepare data for update. Only send fields that are editable and might have changed.
    const updatedData = {
      id: admin.identifier, // Admin ID is required for the update mutation
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      zip: formData.zip,
      country_id: formData.country_id,
      city: formData.city,
      state: formData.state,
      role: formData.role,
    };

    updateAdmin(updatedData, {
      onSuccess: () => {
        // ToastUtils.success("Admin updated successfully!");
        onClose(); // Close the modal on successful update
      },
      onError: (err) => {
        console.error("Failed to update admin:", err);
        // ToastUtils.error(
        //   err?.message || "Failed to update admin. Please try again."
        // );
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1001] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] mx-4 w-full">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
          <h2 className="text-lg font-semibold text-[#1E1E1EB2]">
            Edit Admin: {admin?.first_name} {admin?.last_name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            aria-label="Close"
            disabled={isPending} // Disable close button while saving
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Form */}
        <form
          onSubmit={handleSubmit}
          className="px-6 py-6 w-full max-h-[400px] overflow-y-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            {/* Last Name */}
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            {/* Address */}
            {/* <div className="md:col-span-2">
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input-field"
              />
            </div> */}
            {/* City */}
            {/* <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input-field"
              />
            </div> */}
            {/* State */}
            {/* <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input-field"
              />
            </div> */}
            {/* Zip */}
            {/* <div>
              <label
                htmlFor="zip"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Zip Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="input-field"
              />
            </div> */}
            {/* Country ID (or actual country name, depending on API) */}
            {/* <div>
              <label
                htmlFor="country_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Country
              </label>
              <input
                type="text" // Could be a select dropdown with country options in a real app
                id="country_id"
                name="country_id"
                value={formData.country_id}
                onChange={handleChange}
                className="input-field"
              />
            </div> */}
          </div>

          {/* Loading/Error messages */}
          {isPending && (
            <div className="flex items-center justify-center text-[#288DD1] my-4">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Saving changes...
            </div>
          )}
          {/* 
          {isError && (
            <p className="text-red-500 text-sm my-4 text-center">
              Error: {error?.message || "Failed to update admin."}
            </p>
          )} */}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
              disabled={isPending} // Disable if saving is in progress
            >
              Cancel
            </button>
            <button
              type="submit" // This button will submit the form
              onClick={handleSubmit}
              disabled={isPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Save Changes
              {isPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
