import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { FileInput } from "../../../utils/fileInput";
import { useUpdateTenant } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchCountries, useFetchIndustries } from "../../../hooks/resource"; // Import the resource hooks
import ToastUtils from "../../../utils/toastUtil";

const EditPartnerModal = ({ isOpen, onClose, partnerDetails }) => {
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    industry: "",
    address: "",
    registration_number: "",
    tin_number: "",
    email: "",
    phone: "",
    website: "",
    zip: "",
    country: "",
    city: "",
    state: "",
    national_id_document: null,
    registration_document: null,
    utility_bill_document: null,
    logo: null,
    // New fields for business details
    privacy_policy_url: "",
    unsubscription_url: "",
    help_center_url: "",
    logo_href: "",
    theme_color: "#288DD1", // Default color
    secondary_color: "#FFFFFF", // Default color
    ahref_link_color: "#288DD1", // Default color
  });
  const [errors, setErrors] = useState({});
  const {
    mutate: updateTenant,
    isPending,
    isSuccess,
    isError,
    error,
  } = useUpdateTenant();

  // Fetch countries and industries
  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  // Access the 'message' array from the industries data
  const { data: industriesData, isFetching: isIndustriesFetching } =
    useFetchIndustries();
  const industries = industriesData?.message || []; // Ensure it's an array

  // Define partner types
  const partnerTypes = [
    { value: "BNG", label: "Business Name" },
    { value: "LLC", label: "Limited Liability Company" },
    { value: "NGO", label: "Non-Governmental Organization" },
    { value: "LLP", label: "Limited Liability Partnership" },
    { value: "Other", label: "Other" },
  ];

  useEffect(() => {
    if (partnerDetails) {
      setFormData({
        name: partnerDetails.name || "",
        type: partnerDetails.type || "",
        industry: partnerDetails.industry || "",
        address: partnerDetails.address || "",
        registration_number: partnerDetails.registration_number || "",
        tin_number: partnerDetails.tin_number || "",
        email: partnerDetails.email || "",
        phone: partnerDetails.phone || "",
        website: partnerDetails.website || "",
        zip: partnerDetails.zip || "",
        country: partnerDetails.country || "",
        city: partnerDetails.city || "",
        state: partnerDetails.state || "",
        national_id_document: partnerDetails.national_id_document || null,
        registration_document: partnerDetails.registration_document || null,
        utility_bill_document: partnerDetails.utility_bill_document || null,
        logo: partnerDetails.logo || null,
        // Populate new fields from partnerDetails
        privacy_policy_url: partnerDetails.privacy_policy_url || "",
        unsubscription_url: partnerDetails.unsubscription_url || "",
        help_center_url: partnerDetails.help_center_url || "",
        logo_href: partnerDetails.logo_href || "",
        theme_color: partnerDetails.theme_color || "#288DD1",
        secondary_color: partnerDetails.secondary_color || "#FFFFFF",
        ahref_link_color: partnerDetails.ahref_link_color || "#288DD1",
      });
      setErrors({}); // Clear errors when new partnerDetails are loaded
    }
  }, [partnerDetails]);

  useEffect(() => {
    if (isSuccess) {
      onClose(); // Close modal on successful update
    }
  }, [isSuccess, onClose]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Partner Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    // Add more validation rules as needed for other fields
    if (
      formData.privacy_policy_url &&
      !/^https?:\/\/\S+$/.test(formData.privacy_policy_url)
    ) {
      newErrors.privacy_policy_url = "Invalid URL format";
    }
    if (
      formData.unsubscription_url &&
      !/^https?:\/\/\S+$/.test(formData.unsubscription_url)
    ) {
      newErrors.unsubscription_url = "Invalid URL format";
    }
    if (
      formData.help_center_url &&
      !/^https?:\/\/\S+$/.test(formData.help_center_url)
    ) {
      newErrors.help_center_url = "Invalid URL format";
    }
    if (formData.logo_href && !/^https?:\/\/\S+$/.test(formData.logo_href)) {
      newErrors.logo_href = "Invalid URL format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null })); // Clear error for the field being updated
  };

  const handleFileChange = (field, files) => {
    // files[0] will contain the base64 string from FileInput
    updateFormData(field, files.length > 0 ? files[0] : null);
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Find the country ID based on the selected country name
      const selectedCountry = countries?.find(
        (countryOption) => countryOption.name === formData.country
      );
      const countryId = selectedCountry ? selectedCountry.id : null;

      const dataToSubmit = {
        business: {
          name: formData.name,
          type: formData.type,
          industry: formData.industry,
          address: formData.address,
          national_id_document: formData.national_id_document,
          registration_document: formData.registration_document,
          utility_bill_document: formData.utility_bill_document,
          logo: formData.logo,
          registration_number: formData.registration_number,
          tin_number: formData.tin_number,
          email: formData.email,
          phone: formData.phone,
          website: formData.website || null, // Ensure null for empty URLs
          zip: formData.zip,
          city: formData.city,
          state: formData.state,
          privacy_policy_url: formData.privacy_policy_url || null,
          unsubscription_url: formData.unsubscription_url || null,
          help_center_url: formData.help_center_url || null,
          logo_href: formData.logo_href || null,
          theme_color: formData.theme_color || null,
          secondary_color: formData.secondary_color || null,
          ahref_link_color: formData.ahref_link_color || null,
          country: formData.country, // Send country name
          country_id: countryId, // Send country ID
          dependant_tenant: partnerDetails.dependant_tenant, // Assuming this is not editable and comes from existing details
          // If 'status' is a required field, it needs to be added to formData and handled here.
          // For now, it's omitted as it's not in the current form structure.
        },
      };

      updateTenant(
        {
          id: partnerDetails.identifier,
          tenantData: dataToSubmit,
        },
        {
          onSuccess: () => {
            ToastUtils.success("Partner edited successfully");
            onClose();
          },
          onError: (err) => {
            console.error("Failed to update partner:", err);
            // Error message is already set by the hook
          },
        }
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[800px] mx-4 w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Edit Partner Details
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
        <div className="px-6 py-6 w-full overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Inputs */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Partner Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter partner name"
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
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
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => updateFormData("type", e.target.value)}
                className={`w-full input-field ${
                  errors.type ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              >
                <option value="">Select a type</option>
                {partnerTypes.map((typeOption) => (
                  <option key={typeOption.value} value={typeOption.value}>
                    {typeOption.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="industry"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Industry
              </label>
              <select
                id="industry"
                value={formData.industry}
                onChange={(e) => updateFormData("industry", e.target.value)}
                className={`w-full input-field ${
                  errors.industry ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending || isIndustriesFetching}
              >
                <option value="">
                  {isIndustriesFetching
                    ? "Loading industries..."
                    : "Select an industry"}
                </option>
                {industries?.map((industryOption) => (
                  <option key={industryOption.name} value={industryOption.name}>
                    {industryOption.name}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="text-red-500 text-xs mt-1">{errors.industry}</p>
              )}
            </div>
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
                className={`w-full input-field ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
            </div>
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
                className={`w-full input-field ${
                  errors.city ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
            </div>
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
                className={`w-full input-field ${
                  errors.state ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
            </div>
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
                className={`w-full input-field ${
                  errors.zip ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
            </div>
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
                onChange={(e) =>
                  updateFormData("registration_number", e.target.value)
                }
                placeholder="Enter registration number"
                className={`w-full input-field ${
                  errors.registration_number
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isPending}
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
                onChange={(e) => updateFormData("tin_number", e.target.value)}
                placeholder="Enter TIN number"
                className={`w-full input-field ${
                  errors.tin_number ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
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
                type="url"
                value={formData.website}
                onChange={(e) => updateFormData("website", e.target.value)}
                placeholder="Enter website URL"
                className={`w-full input-field ${
                  errors.website ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
            </div>

            {/* New Business-related URL fields */}
            <div>
              <label
                htmlFor="privacy_policy_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Privacy Policy URL
              </label>
              <input
                id="privacy_policy_url"
                type="url"
                value={formData.privacy_policy_url}
                onChange={(e) =>
                  updateFormData("privacy_policy_url", e.target.value)
                }
                placeholder="Enter Privacy Policy URL"
                className={`w-full input-field ${
                  errors.privacy_policy_url
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.privacy_policy_url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.privacy_policy_url}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="unsubscription_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Unsubscription URL
              </label>
              <input
                id="unsubscription_url"
                type="url"
                value={formData.unsubscription_url}
                onChange={(e) =>
                  updateFormData("unsubscription_url", e.target.value)
                }
                placeholder="Enter Unsubscription URL"
                className={`w-full input-field ${
                  errors.unsubscription_url
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.unsubscription_url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.unsubscription_url}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="help_center_url"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Help Center URL
              </label>
              <input
                id="help_center_url"
                type="url"
                value={formData.help_center_url}
                onChange={(e) =>
                  updateFormData("help_center_url", e.target.value)
                }
                placeholder="Enter Help Center URL"
                className={`w-full input-field ${
                  errors.help_center_url ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.help_center_url && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.help_center_url}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="logo_href"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Business Logo Href
              </label>
              <input
                id="logo_href"
                type="url"
                value={formData.logo_href}
                onChange={(e) => updateFormData("logo_href", e.target.value)}
                placeholder="Enter Business Logo Href URL"
                className={`w-full input-field ${
                  errors.logo_href ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isPending}
              />
              {errors.logo_href && (
                <p className="text-red-500 text-xs mt-1">{errors.logo_href}</p>
              )}
            </div>

            {/* Color Pickers */}
            <div className="flex flex-col">
              <label
                htmlFor="theme_color"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Theme Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="theme_color"
                  type="color"
                  value={formData.theme_color}
                  onChange={(e) =>
                    updateFormData("theme_color", e.target.value)
                  }
                  className="w-10 h-10 rounded-md cursor-pointer border border-gray-300"
                  disabled={isPending}
                  title="Select Theme Color"
                />
                <input
                  type="text"
                  value={formData.theme_color}
                  onChange={(e) =>
                    updateFormData("theme_color", e.target.value)
                  }
                  className="input-field w-full"
                  placeholder="#RRGGBB"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="secondary_color"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Secondary Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="secondary_color"
                  type="color"
                  value={formData.secondary_color}
                  onChange={(e) =>
                    updateFormData("secondary_color", e.target.value)
                  }
                  className="w-10 h-10 rounded-md cursor-pointer border border-gray-300"
                  disabled={isPending}
                  title="Select Secondary Color"
                />
                <input
                  type="text"
                  value={formData.secondary_color}
                  onChange={(e) =>
                    updateFormData("secondary_color", e.target.value)
                  }
                  className="input-field w-full"
                  placeholder="#RRGGBB"
                  disabled={isPending}
                />
              </div>
            </div>
            <div className="flex flex-col">
              <label
                htmlFor="ahref_link_color"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ahref Link Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  id="ahref_link_color"
                  type="color"
                  value={formData.ahref_link_color}
                  onChange={(e) =>
                    updateFormData("ahref_link_color", e.target.value)
                  }
                  className="w-10 h-10 rounded-md cursor-pointer border border-gray-300"
                  disabled={isPending}
                  title="Select Ahref Link Color"
                />
                <input
                  type="text"
                  value={formData.ahref_link_color}
                  onChange={(e) =>
                    updateFormData("ahref_link_color", e.target.value)
                  }
                  className="input-field w-full"
                  placeholder="#RRGGBB"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* File Inputs */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <FileInput
                id="national_id_document"
                label="National ID Document"
                onChange={(e) =>
                  handleFileChange("national_id_document", e.target.files)
                }
                selectedFile={formData.national_id_document}
                error={errors.national_id_document}
                accept=".pdf,.jpg,.png"
              />
              <FileInput
                id="registration_document"
                label="Registration Document"
                onChange={(e) =>
                  handleFileChange("registration_document", e.target.files)
                }
                selectedFile={formData.registration_document}
                error={errors.registration_document}
                accept=".pdf,.jpg,.png"
              />
              <FileInput
                id="utility_bill_document"
                label="Utility Bill Document"
                onChange={(e) =>
                  handleFileChange("utility_bill_document", e.target.files)
                }
                selectedFile={formData.utility_bill_document}
                error={errors.utility_bill_document}
                accept=".pdf,.jpg,.png"
              />
              <FileInput
                id="logo"
                label="Company Logo"
                onChange={(e) => handleFileChange("logo", e.target.files)}
                selectedFile={formData.logo}
                error={errors.logo}
                accept=".jpg,.png"
              />
            </div>
          </div>
          {/* {isError && (
            <p className="text-red-500 text-sm mt-4 text-center">
              Error: {error?.message || "Failed to save changes."}
            </p>
          )} */}
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

export default EditPartnerModal;
