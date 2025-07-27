import React, { useState, useEffect } from "react";
import useAuthRedirect from "../../utils/authRedirect";
import Headbar from "../components/headbar";
import ActiveTab from "../components/activeTab";
import Sidebar from "../components/sidebar";
import { Loader2 } from "lucide-react";
import ToastUtils from "../../utils/toastUtil"; // Import ToastUtils

import {
  useFetchCitiesById,
  useFetchCountries,
  useFetchIndustries,
  useFetchStatesById,
} from "../../hooks/resource";
import {
  useCreateProfile,
  useFetchTenantProfile,
} from "../../hooks/profileHooks";
import AccountSettingsInputs from "./settingsComp/accoutsettingsInput";
import AccountSettingsColors from "./settingsComp/accountSettingsColor";
import AccountSettingsImages from "./settingsComp/accountSettingsImage";

export default function Settings() {
  const { isLoading: authLoading } = useAuthRedirect();
  const {
    data: tenantProfile,
    isFetching: isProfileFetching,
    refetch: refetchTenantProfile,
  } = useFetchTenantProfile();
  const { mutate: updateProfile, isPending: isSaving } = useCreateProfile();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [businessData, setBusinessData] = useState({
    name: "",
    type: "",
    industry: "",
    // address: "", // Removed as per request
    national_id_document: null,
    logo: null,
    registration_document: null,
    utility_bill_document: null,
    registration_number: "",
    tin_number: "",
    email: "",
    phone: "",
    website: "",
    zip: "",
    country_id: "",
    country: "",
    state: "",
    state_id: "",
    city: "",
    // city_id: "",
    privacy_policy_url: "",
    unsubscription_url: "",
    help_center_url: "",
    logo_href: "",
    theme_color: "#288DD1",
    secondary_color: "#676767",
    text_color: "#121212",
    ahref_link_color: "#288DD1",
  });

  const [isCustomCountry, setIsCustomCountry] = useState(false);
  const [isCustomState, setIsCustomState] = useState(false);
  // const [isCustomCity, setIsCustomCity] = useState(false); // No longer needed as city is always input

  const [errors, setErrors] = useState({});

  const { data: countries, isFetching: isCountriesFetching } =
    useFetchCountries();
  const { data: industries, isFetching: isIndustriesFetching } =
    useFetchIndustries();

  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(
    businessData?.country_id,
    {
      enabled:
        !!businessData?.country_id && businessData.country_id !== "other",
    }
  );

  // Effect to populate form data from tenantProfile
  useEffect(() => {
    if (tenantProfile) {
      setBusinessData({
        name: tenantProfile.name || "",
        type: tenantProfile.type || "",
        industry: tenantProfile.industry || "",
        address: tenantProfile.address || "",
        national_id_document: null,
        logo: null,
        registration_document: null,
        utility_bill_document: null,
        registration_number: tenantProfile.registration_number || "",
        tin_number: tenantProfile.tin_number || "",
        email: tenantProfile.email || "",
        phone: tenantProfile.phone || "",
        website: tenantProfile.website || "",
        zip: tenantProfile.zip || "",
        country_id: tenantProfile.country_id
          ? String(tenantProfile.country_id)
          : "",
        country: tenantProfile.country || "",
        state: tenantProfile.state || "",
        state_id: "",
        city: tenantProfile.city || "",
        // city_id: "", // Removed
        privacy_policy_url: tenantProfile.privacy_policy_url || "",
        unsubscription_url: tenantProfile.unsubscription_url || "",
        help_center_url: tenantProfile.help_center_url || "",
        logo_href: tenantProfile.logo_href || "",
        theme_color: tenantProfile.theme_color || "#288DD1",
        secondary_color: tenantProfile.secondary_color || "#676767",
        text_color: tenantProfile.text_color || "#121212",
        ahref_link_color: tenantProfile.ahref_link_color || "#288DD1",
      });

      // Set custom flags based on existing data
      if (
        tenantProfile.country_id &&
        countries &&
        !countries.some((c) => c.id === tenantProfile.country_id)
      ) {
        setIsCustomCountry(true);
      }
      if (
        tenantProfile.state &&
        states &&
        !states.some((s) => s.name === tenantProfile.state)
      ) {
        setIsCustomState(true);
      }
    }
  }, [tenantProfile]);

  useEffect(() => {
    if (
      Array.isArray(states) &&
      states.length > 0 &&
      businessData.country_id &&
      tenantProfile?.state
    ) {
      const matchedState = states.find(
        (s) => s.name?.toLowerCase() === tenantProfile.state.toLowerCase()
      );
      if (matchedState && businessData.state_id !== String(matchedState.id)) {
        setBusinessData((prev) => ({
          ...prev,
          state_id: String(matchedState.id),
        }));
      }
    }
  }, [states, tenantProfile, businessData.country_id, businessData.state_id]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const updateFormData = (field, value) => {
    setBusinessData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    if (field === "country_id") {
      const selectedCountry = countries?.find((c) => c.id === parseInt(value));
      setIsCustomCountry(value === "other" || !selectedCountry);
      setBusinessData((prevData) => ({
        ...prevData,
        country_id: value,
        country: selectedCountry
          ? selectedCountry.name
          : value === "other"
          ? ""
          : prevData.country,
        state_id: "",
        state: "",
        city: "",
      }));
    } else if (field === "state_id") {
      const selectedState = states?.find((s) => s.id === parseInt(value));
      setIsCustomState(value === "other" || !selectedState);
      setBusinessData((prevData) => ({
        ...prevData,
        state_id: value,
        state: selectedState
          ? selectedState.name
          : value === "other"
          ? ""
          : prevData.state,
        city: "",
      }));
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleFileChange = (name, file) => {
    setBusinessData((prevData) => ({
      ...prevData,
      [name]: file,
    }));
  };

  const validateForm = () => {
    let newErrors = {};
    if (!businessData.name.trim()) newErrors.name = "Business name is required";
    if (!businessData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(businessData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (
      !businessData.industry &&
      !isIndustriesFetching &&
      Array.isArray(industries?.message) &&
      industries.message.length > 0
    )
      newErrors.industry = "Industry is required";
    if (!businessData.type.trim()) newErrors.type = "Business Type is required";

    if (!businessData.country_id && !businessData.country.trim()) {
      newErrors.country_id = "Country is required";
    } else if (
      businessData.country_id === "other" &&
      !businessData.country.trim()
    ) {
      newErrors.country = "Custom country name is required";
    }

    if (!businessData.state_id && !businessData.state.trim()) {
      newErrors.state = "State/Province is required";
    } else if (
      businessData.state_id === "other" &&
      !businessData.state.trim()
    ) {
      newErrors.state = "Custom state name is required";
    }

    if (!businessData.city.trim()) {
      // City is always a text input now
      newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      ToastUtils.error("Please correct the errors in the form.");
      return;
    }

    const payload = new FormData();
    payload.append("name", businessData.name);
    payload.append("type", businessData.type);
    payload.append("industry", businessData.industry);
    payload.append("address", businessData.address);
    payload.append("registration_number", businessData.registration_number);
    payload.append("tin_number", businessData.tin_number);
    payload.append("email", businessData.email);
    payload.append("phone", businessData.phone);
    payload.append("website", businessData.website);
    payload.append("zip", businessData.zip);
    payload.append("country_id", businessData.country_id);
    payload.append("country", businessData.country);
    payload.append("state", businessData.state);
    payload.append("city", businessData.city);
    payload.append("privacy_policy_url", businessData.privacy_policy_url);
    payload.append("unsubscription_url", businessData.unsubscription_url);
    payload.append("help_center_url", businessData.help_center_url);
    payload.append("logo_href", businessData.logo_href);
    payload.append("theme_color", businessData.theme_color);
    payload.append("secondary_color", businessData.secondary_color);
    payload.append("text_color", businessData.text_color);
    payload.append("ahref_link_color", businessData.ahref_link_color);

    if (businessData.national_id_document) {
      payload.append("national_id_document", businessData.national_id_document);
    }
    if (businessData.logo) {
      payload.append("logo", businessData.logo);
    }
    if (businessData.registration_document) {
      payload.append(
        "registration_document",
        businessData.registration_document
      );
    }
    if (businessData.utility_bill_document) {
      payload.append(
        "utility_bill_document",
        businessData.utility_bill_document
      );
    }

    updateProfile(payload, {
      onSuccess: () => {
        ToastUtils.success("Account settings updated successfully!");
        refetchTenantProfile(); // Refetch profile to show updated data
      },
      onError: (err) => {
        console.error("Failed to update profile:", err);
        ToastUtils.error(
          err.message || "Failed to update settings. Please try again."
        );
      },
    });
  };

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-8 pb-20">
        {authLoading || isProfileFetching ? (
          <div className="w-full min-h-[calc(100vh-200px)] flex items-center justify-center">
            <Loader2 className="w-12 text-[#288DD1] animate-spin" />
          </div>
        ) : !tenantProfile ? (
          <div className="w-full min-h-[calc(100vh-200px)] flex flex-col items-center justify-center font-Outfit text-gray-600 text-lg">
            <p className="text-red-600 mb-4">
              Tenant profile not found or an error occurred.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="w-full mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <AccountSettingsInputs
                businessData={businessData}
                updateFormData={updateFormData}
                errors={errors}
                countries={countries}
                isCountriesFetching={isCountriesFetching}
                industries={industries}
                isIndustriesFetching={isIndustriesFetching}
                states={states}
                isStatesFetching={isStatesFetching}
                isCustomCountry={isCustomCountry}
                isCustomState={isCustomState}
              />

              <AccountSettingsColors
                businessData={businessData}
                updateFormData={updateFormData}
              />

              <AccountSettingsImages
                businessData={businessData}
                handleFileChange={handleFileChange}
                errors={errors}
              />

              <div className="flex justify-end mt-8">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
