import React, { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchCountries,
  useFetchIndustries,
  useFetchStatesById,
} from "../../../hooks/resource";
import {
  useCreateProfile,
  useFetchTenantProfile,
} from "../../../hooks/profileHooks";
import AccountSettingsInputs from "./accoutsettingsInput";
import AccountSettingsColors from "./accountSettingsColor";
import AccountSettingsImages from "./accountSettingsImage";

const TenantProfileSettings = () => {
  const {
    data: tenantProfile,
    isFetching: isProfileFetching,
    refetch: refetchTenantProfile,
  } = useFetchTenantProfile();
  const { mutate: updateProfile, isPending: isSaving } = useCreateProfile();

  const [businessData, setBusinessData] = useState({
    name: "",
    type: "",
    industry: "",
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

  const hasLoadedProfileRef = useRef(false);

  useEffect(() => {
    if (tenantProfile && !hasLoadedProfileRef.current) {
      setBusinessData({
        name: tenantProfile.name || "",
        type: tenantProfile.type || "",
        industry: tenantProfile.industry || "",
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
        privacy_policy_url: tenantProfile.privacy_policy_url || "",
        unsubscription_url: tenantProfile.unsubscription_url || "",
        help_center_url: tenantProfile.help_center_url || "",
        logo_href: tenantProfile.logo_href || "",
        theme_color: tenantProfile.theme_color || "#288DD1",
        secondary_color: tenantProfile.secondary_color || "#676767",
        text_color: tenantProfile.text_color || "#121212",
        ahref_link_color: tenantProfile.ahref_link_color || "#288DD1",
      });

      if (
        tenantProfile.country &&
        Array.isArray(countries) &&
        !countries.some(
          (c) => c.name?.toLowerCase() === tenantProfile.country.toLowerCase()
        )
      ) {
        setIsCustomCountry(true);
      }

      hasLoadedProfileRef.current = true;
    }
  }, [tenantProfile, countries]);

  useEffect(() => {
    if (
      tenantProfile &&
      Array.isArray(states) &&
      states.length > 0 &&
      businessData.country_id &&
      tenantProfile.state
    ) {
      const matchedState = states.find(
        (s) => s.name?.toLowerCase() === tenantProfile.state.toLowerCase()
      );
      if (matchedState) {
        setBusinessData((prev) => ({
          ...prev,
          state_id: String(matchedState.id),
        }));
      } else {
        setIsCustomState(true);
      }
    } else if (
      tenantProfile &&
      tenantProfile.state &&
      (!Array.isArray(states) || states.length === 0) &&
      businessData.country_id
    ) {
      setIsCustomState(true);
    }
  }, [states, tenantProfile, businessData.country_id]);

  const updateFormData = (field, value) => {
    setBusinessData((prevData) => {
      const newData = { ...prevData, [field]: value };

      if (field === "country_id") {
        const selectedCountry = countries?.find((c) => String(c.id) === value);
        const newIsCustomCountry = value === "other" || !selectedCountry;

        newData.country = selectedCountry
          ? selectedCountry.name
          : value === "other"
          ? ""
          : prevData.country;
        newData.state_id = "";
        newData.state = "";
        newData.city = "";

        setIsCustomCountry(newIsCustomCountry);
        setIsCustomState(false);
      } else if (field === "state_id") {
        const selectedState = states?.find((s) => String(s.id) === value);
        const newIsCustomState = value === "other" || !selectedState;

        newData.state = selectedState
          ? selectedState.name
          : value === "other"
          ? ""
          : prevData.state;
        newData.city = "";

        setIsCustomState(newIsCustomState);
      } else if (field === "country" && isCustomCountry) {
        newData.country = value;
      } else if (field === "state" && isCustomState) {
        newData.state = value;
      } else if (field === "city") {
        newData.city = value;
      }

      return newData;
    });

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleFileChange = (name, fileBase64) => {
    setBusinessData((prevData) => ({
      ...prevData,
      [name]: fileBase64,
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

    const payload = {
      name: businessData.name,
      type: businessData.type,
      industry: businessData.industry,
      registration_number: businessData.registration_number,
      tin_number: businessData.tin_number,
      email: businessData.email,
      phone: businessData.phone,
      website: businessData.website,
      zip: businessData.zip,
      country_id: businessData.country_id
        ? parseInt(businessData.country_id)
        : null,
      country: businessData.country,
      state: businessData.state,
      city: businessData.city,
      privacy_policy_url: businessData.privacy_policy_url,
      unsubscription_url: businessData.unsubscription_url,
      help_center_url: businessData.help_center_url,
      logo_href: businessData.logo_href,
      theme_color: businessData.theme_color,
      secondary_color: businessData.secondary_color,
      text_color: businessData.text_color,
      ahref_link_color: businessData.ahref_link_color,
    };

    if (businessData.national_id_document) {
      payload.national_id_document = businessData.national_id_document;
    }
    if (businessData.logo) {
      payload.logo = businessData.logo;
    }
    if (businessData.registration_document) {
      payload.registration_document = businessData.registration_document;
    }
    if (businessData.utility_bill_document) {
      payload.utility_bill_document = businessData.utility_bill_document;
    }

    updateProfile(payload, {
      onSuccess: () => {
        ToastUtils.success("Account settings updated successfully!");
        refetchTenantProfile();
      },
      onError: (err) => {
        // console.error("Failed to update profile:", err);
        // ToastUtils.error(
        //   err.message || "Failed to update settings. Please try again."
        // );
      },
    });
  };

  return (
    <div className="w-full mx-auto">
      {isProfileFetching ? (
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
      )}
    </div>
  );
};

export default TenantProfileSettings;
