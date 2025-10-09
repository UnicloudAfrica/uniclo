import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateAccount } from "../../hooks/authHooks";
import useAuthStore from "../../stores/userAuthStore";
import ToastUtils from "../../utils/toastUtil";
import { useFetchIndustries } from "../../hooks/resource";
import Header from "./signup/header";
import SignUpForm from "./signup/signupsteps";
import TabSelector from "./signup/tabselector";
import sideBg from "./assets/sideBg.svg";

export default function DashboardSignUpV2() {
  const navigate = useNavigate();
  const setUserEmail = useAuthStore((state) => state.setUserEmail);
  const { mutate, isPending } = useCreateAccount();
  const { data: industries, isFetching: isIndustriesFetching } =
    useFetchIndustries();
  const [activeTab, setActiveTab] = useState("partner");
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    companyName: "",
    subdomain: "",
    businessPhone: "",
    phone: "",
    business_name: "",
    registration_number: "",
    company_type: "",
    tin_number: "",
    industry: "",
    website: "",
    verification_token: "",
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.contactPersonFirstName)
      newErrors.contactPersonFirstName = "First name is required";
    if (!formData.contactPersonLastName)
      newErrors.contactPersonLastName = "Last name is required";

    // Common business fields for both partner and client
    if (!formData.business_name)
      newErrors.business_name = "Business name is required";
    if (!formData.company_type)
      newErrors.company_type = "Business type is required";
    if (!formData.industry) newErrors.industry = "Industry is required";
    if (!formData.businessPhone)
      newErrors.businessPhone = "Business phone is required";
    else if (!/^\+?\d{10,15}$/.test(formData.businessPhone))
      newErrors.businessPhone =
        "Invalid phone number format (e.g., +1234567890)";

    if (activeTab === "partner") {
      if (!formData.subdomain) newErrors.subdomain = "Subdomain is required";
      else if (!/^[a-zA-Z0-9-]+$/.test(formData.subdomain))
        newErrors.subdomain =
          "Subdomain can only contain letters, numbers, and hyphens";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const userData = {
        first_name: formData.contactPersonFirstName,
        last_name: formData.contactPersonLastName,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
        role: activeTab === "partner" ? "tenant" : "client",
        phone: formData.businessPhone,
        domain:
          activeTab === "partner"
            ? `${formData.subdomain}.unicloudafrica.com`
            : `${formData.business_name
                .toLowerCase()
                .replace(/\s+/g, "-")}.unicloudafrica.com`,
        business: {
          phone: formData.businessPhone,
          name: formData.business_name,
          registration_number: formData.registration_number,
          company_type: formData.company_type,
          tin_number: formData.tin_number,
        },
        verification_token: formData.verification_token,
      };

      mutate(userData, {
        onSuccess: () => {
          // ToastUtils.success(
          //   "Account created successfully! Please verify your email."
          // );
          setUserEmail(formData.email);
          navigate("/verify-mail");
        },
        onError: (err) => {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to create account. Please try again.";
          setErrors({ general: errorMessage });
          // ToastUtils.error(errorMessage);
        },
      });
    }
  };

  return (
    <div className="min-h-screen flex p-8 font-Outfit">
      <div className="flex-1 flex flex-col justify-center bg-white">
        <div className="max-w-md mx-auto w-full">
          <Header />
          <TabSelector activeTab={activeTab} setActiveTab={setActiveTab} />
          <SignUpForm
            activeTab={activeTab}
            formData={formData}
            errors={errors}
            isPending={isPending}
            industries={industries}
            isIndustriesFetching={isIndustriesFetching}
            updateFormData={updateFormData}
            handleSubmit={handleSubmit}
          />
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
