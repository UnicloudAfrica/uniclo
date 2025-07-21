import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useUpdateClient } from "../../../hooks/adminHooks/clientHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchCountries } from "../../../hooks/resource"; // Import the resource hook

export const EditClientModal = ({ client, onClose, onClientUpdated }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    zip: "",
    country: "", // This will store the country name
    city: "",
    state: "",
  });
  const [errors, setErrors] = useState({});

  const { mutate: updateClient, isPending } = useUpdateClient();
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();

  // Populate form data when client details change
  useEffect(() => {
    if (client) {
      setFormData({
        first_name: client.first_name || "",
        middle_name: client.middle_name || "",
        last_name: client.last_name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        zip: client.zip || "",
        country: client.country || "", // Set initial country name
        city: client.city || "",
        state: client.state || "",
      });
      setErrors({}); // Clear errors when new clientDetails are loaded
    }
  }, [client]);

  // Helper function to update form data and clear associated errors
  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  // Validate form fields before submission
  const validateForm = () => {
    const newErrors = {};
    if (!formData.first_name.trim())
      newErrors.first_name = "First Name is required";
    if (!formData.last_name.trim())
      newErrors.last_name = "Last Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      // Find the country ID based on the selected country name
      const selectedCountry = countries?.find(
        (countryOption) => countryOption.name === formData.country
      );
      const countryId = selectedCountry ? selectedCountry.id : null;

      const dataToSubmit = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        zip: formData.zip,
        country: formData.country, // Send country name
        country_id: countryId, // Send country ID
        city: formData.city,
        state: formData.state,
      };

      updateClient(
        { id: client.identifier, clientData: dataToSubmit },
        {
          onSuccess: (updatedData) => {
            ToastUtils.success("Client updated successfully!");
            if (onClientUpdated) {
              onClientUpdated({ ...client, ...updatedData });
            }
            onClose();
          },
          onError: (err) => {
            // ToastUtils.error(err?.message || "Failed to update client.");
          },
        }
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] mx-4 w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit Client Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-6 w-full overflow-y-auto max-h-[400px] flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name Input */}
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
                value={formData.first_name}
                onChange={(e) => updateFormData("first_name", e.target.value)}
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

            {/* Middle Name Input */}
            <div>
              <label
                htmlFor="middle_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Middle Name
              </label>
              <input
                id="middle_name"
                type="text"
                value={formData.middle_name}
                onChange={(e) => updateFormData("middle_name", e.target.value)}
                placeholder="Enter middle name"
                className="w-full input-field border-gray-300"
                disabled={isPending}
              />
            </div>

            {/* Last Name Input */}
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
                value={formData.last_name}
                onChange={(e) => updateFormData("last_name", e.target.value)}
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

            {/* Email Input */}
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
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
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

            {/* Phone Input */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number<span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="text"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
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

            {/* Address Input */}
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Address
              </label>
              <input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter street address"
                className="w-full input-field border-gray-300"
                disabled={isPending}
              />
            </div>

            {/* City Input */}
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                City
              </label>
              <input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => updateFormData("city", e.target.value)}
                placeholder="Enter city"
                className="w-full input-field border-gray-300"
                disabled={isPending}
              />
            </div>

            {/* State Input */}
            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                State
              </label>
              <input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                placeholder="Enter state"
                className="w-full input-field border-gray-300"
                disabled={isPending}
              />
            </div>

            {/* Zip Code Input */}
            <div>
              <label
                htmlFor="zip"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Zip Code
              </label>
              <input
                id="zip"
                type="text"
                value={formData.zip}
                onChange={(e) => updateFormData("zip", e.target.value)}
                placeholder="Enter zip code"
                className="w-full input-field border-gray-300"
                disabled={isPending}
              />
            </div>

            {/* Country Dropdown */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Country
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => updateFormData("country", e.target.value)}
                className={`w-full input-field ${
                  errors.country ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending || isCountriesFetching}
              >
                <option value="">
                  {isCountriesFetching
                    ? "Loading countries..."
                    : "Select a country"}
                </option>
                {countries?.map((countryOption) => (
                  <option key={countryOption.id} value={countryOption.name}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">{errors.country}</p>
              )}
            </div>
          </div>
        </div>
        {/* Footer */}
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

export default EditClientModal;
