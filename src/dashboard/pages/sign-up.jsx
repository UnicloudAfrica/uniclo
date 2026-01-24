import React, { useState, useEffect } from "react";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";
import { CreateAccountStep } from "./signupsteps/stepone";
import { BusinessInfoStep } from "./signupsteps/steptwo";
import { BusinessAddressStep } from "./signupsteps/stepThree";
import { UploadDocumentStep } from "./signupsteps/stepFour";
import { Link, useNavigate } from "react-router-dom";
import { useCreateAccount } from "../../hooks/authHooks";
import {
  useFetchCountries,
  useFetchIndustries,
  useFetchCitiesById,
  useFetchStatesById,
} from "../../hooks/resource";
import useTenantAuthStore from "../../stores/tenantAuthStore";
import useAuthRedirect from "../../utils/authRedirect";

export default function DashboardSignUp() {
  const Navigate = useNavigate();
  const { data: countries, isFetching: isCountriesFetching } = useFetchCountries();
  const { data: industries, isFetching: isIndustriesFetching } = useFetchIndustries();

  const { userEmail, setUserEmail } = useTenantAuthStore.getState();
  const { mutate, isPending } = useCreateAccount();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("partner");
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    contactPhone: "",
    businessName: "",
    registrationNumber: "",
    tinNumber: "",
    countryId: "",
    countryName: "",
    countryCode: "",
    state: "",
    state_id: "",
    city: "",
    city_id: "",
    address: "",
    postalCode: "",
    certificateOfIncorporation: null,
    utilityBill: null,
    tinCertificate: null,
    industry: "",
    businessType: "",
    nationalIdDocument: null,
    businessLogo: null,
    businessEmail: "",
    businessPhone: "",
    businessWebsite: "",
  });
  const { isLoading } = useAuthRedirect();
  const { data: states, isFetching: isStatesFetching } = useFetchStatesById(formData?.countryId);
  const { data: cities, isFetching: isCitiesFetching } = useFetchCitiesById(formData?.state_id);

  const steps = ["Create Account", "Business Info", "Business Address", "Upload Document"];

  const validateStep = () => {
    const newErrors = {};
    switch (currentStep) {
      case 0:
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 6)
          newErrors.password = "Password must be at least 6 characters";
        if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
        else if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";
        break;
      case 1:
        if (!formData.contactPersonFirstName)
          newErrors.contactPersonFirstName = "First name is required";
        if (!formData.contactPersonLastName)
          newErrors.contactPersonLastName = "Last name is required";
        if (!formData.contactPhone) newErrors.contactPhone = "Phone number is required";
        else if (!/^\+?\d{10,15}$/.test(formData.contactPhone))
          newErrors.contactPhone = "Invalid phone number";
        if (!formData.businessName) newErrors.businessName = "Business name is required";
        if (!formData.registrationNumber)
          newErrors.registrationNumber = "Registration number is required";
        if (!formData.tinNumber) newErrors.tinNumber = "TIN number is required";
        if (!formData.industry) newErrors.industry = "Industry is required";
        if (!formData.businessType) newErrors.businessType = "Business type is required";
        if (!formData.businessEmail) newErrors.businessEmail = "Business email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.businessEmail))
          newErrors.businessEmail = "Invalid email format";
        if (!formData.businessPhone) newErrors.businessPhone = "Business phone is required";
        else if (!/^\+?\d{10,15}$/.test(formData.businessPhone))
          newErrors.businessPhone = "Invalid phone number";
        if (!formData.businessWebsite) newErrors.businessWebsite = "Business website is required";
        else if (
          !/^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/.test(formData.businessWebsite)
        ) {
          newErrors.businessWebsite = "Invalid website URL";
        }
        break;
      case 2:
        if (!formData.countryId) newErrors.countryId = "Country is required";
        if (!formData.state_id && !formData.state) newErrors.state = "State is required";
        if (!formData.city_id && !formData.city) newErrors.city = "City is required";
        if (!formData.address) newErrors.address = "Address is required";
        if (!formData.postalCode) newErrors.postalCode = "Postal code is required";
        break;
      case 3:
        if (!formData.certificateOfIncorporation)
          newErrors.certificateOfIncorporation = "Certificate of Incorporation is required";
        if (!formData.utilityBill) newErrors.utilityBill = "Utility Bill is required";
        if (!formData.tinCertificate) newErrors.tinCertificate = "TIN Certificate is required";
        if (!formData.nationalIdDocument) newErrors.nationalIdDocument = "National ID is required";
        if (!formData.businessLogo) newErrors.businessLogo = "Business logo is required";
        break;
      default:
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };
      if (field === "countryId") {
        newFormData.countryName = countries?.find((c) => String(c.id) === value)?.name || "";
        newFormData.countryCode =
          countries?.find((c) => String(c.id) === value)?.iso2?.toUpperCase() ||
          countries?.find((c) => String(c.id) === value)?.iso3?.toUpperCase() ||
          "";
        newFormData.state_id = "";
        newFormData.state = "";
        newFormData.city_id = "";
        newFormData.city = "";
      } else if (field === "state_id") {
        newFormData.state =
          value === "other" ? "" : states?.find((s) => s.id === parseInt(value))?.name || "";
        newFormData.city_id = "";
        newFormData.city = "";
      } else if (field === "city_id") {
        newFormData.city =
          value === "other" ? "" : cities?.find((c) => c.id === parseInt(value))?.name || "";
      }
      return newFormData;
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleNext = () => {
    const isValid = validateStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setErrors({});
    } else if (isValid && currentStep === steps.length - 1) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const selectedCountry = countries?.find((c) => String(c.id) === formData.countryId) || null;
    const normalizedCountryId = selectedCountry ? String(selectedCountry.id) : "";
    const normalizedCountryName = formData.countryName || selectedCountry?.name || "";
    const normalizedCountryCode =
      formData.countryCode ||
      selectedCountry?.iso2?.toUpperCase() ||
      selectedCountry?.iso3?.toUpperCase() ||
      "";
    const normalizedState =
      formData.state || states?.find((s) => s.id === parseInt(formData.state_id))?.name || "";
    const normalizedCity =
      formData.city || cities?.find((c) => c.id === parseInt(formData.city_id))?.name || "";

    const userData = {
      first_name: formData.contactPersonFirstName,
      last_name: formData.contactPersonLastName,
      phone: formData.contactPhone,
      email: formData.email,
      role: "Client",
      account_type: "business",
      password: formData.password,
      password_confirmation: formData.confirmPassword,
      country_id: normalizedCountryId,
      country: normalizedCountryName,
      country_code: normalizedCountryCode,
      state: normalizedState,
      city: normalizedCity,
      business: {
        name: formData.businessName,
        type: formData.businessType,
        industry: formData.industry,
        address: formData.address,
        national_id_document: formData.nationalIdDocument,
        logo: formData.businessLogo,
        registration_document: formData.certificateOfIncorporation,
        utility_bill_document: formData.utilityBill,
        registration_number: formData.registrationNumber,
        tin_number: formData.tinNumber,
        email: formData.businessEmail,
        phone: formData.businessPhone,
        website: formData.businessWebsite,
        zip: formData.postalCode,
        country_id: normalizedCountryId,
        country: normalizedCountryName,
        country_code: normalizedCountryCode,
        state: normalizedState,
        state_id: formData.state_id === "other" ? null : formData.state_id,
        city: normalizedCity,
        city_id: formData.city_id === "other" ? null : formData.city_id,
      },
    };

    mutate(userData, {
      onSuccess: () => {
        setUserEmail(formData.email);
        Navigate("/verify-mail");
      },
      onError: (err) => {
        setErrors({ general: err.message || "Failed to create account" });
        console.log(err);
      },
    });
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CreateAccountStep
            formData={formData}
            updateFormData={updateFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            errors={errors}
          />
        );
      case 1:
        return (
          <BusinessInfoStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            industries={industries}
            isIndustriesFetching={isIndustriesFetching}
          />
        );
      case 2:
        return (
          <BusinessAddressStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            countries={countries}
            isCountriesFetching={isCountriesFetching}
            states={states}
            isStatesFetching={isStatesFetching}
            cities={cities}
            isCitiesFetching={isCitiesFetching}
          />
        );
      case 3:
        return (
          <UploadDocumentStep formData={formData} updateFormData={updateFormData} errors={errors} />
        );
      default:
        return null;
    }
  };

  const StepProgress = ({ currentStep, steps }) => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentStep ? "bg-[#288DD1] text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {index + 1}
            </div>
            <p
              className={`text-xs mt-2 text-center ${
                index <= currentStep ? "text-[#288DD1]" : "text-gray-500"
              }`}
            >
              {step}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-4 ${
                index < currentStep ? "bg-[#288DD1]" : "bg-gray-200"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="w-full h-svh flex items-center justify-center">
        <Loader2 className="w-12 text-[#288DD1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      <div className="flex-1 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <div className="flex items-center justify-center">
              <img src={logo} className="w-[100px]" alt="Logo" />
            </div>
          </div>
          <div className="mb-8 w-full text-center">
            <h1 className="text-2xl font-semibold text-[#121212] mb-2">Create an Account</h1>
            <p className="text-[#676767] text-sm">
              Join Unicloud Africa and launch your cloud in minutes.
            </p>
          </div>
          <StepProgress currentStep={currentStep} steps={steps} />
          <div>{renderCurrentStep()}</div>
          <div className="flex gap-4 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={isPending}
              className="flex-1 bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
            >
              {currentStep === steps.length - 1 ? "Complete Registration" : "Next"}
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
          <div className="text-center mt-6">
            <span className="text-sm text-[#1E1E1E99]">Already have an account? </span>
            <Link
              to="/sign-in"
              type="button"
              className="text-sm text-[#288DD1] hover:text-[#6db1df] font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
      <div
        style={{
          backgroundImage: `url(${sideBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className="flex-1 side-bg hidden lg:flex items-center justify-center relative overflow-hidden"
      ></div>
    </div>
  );
}
