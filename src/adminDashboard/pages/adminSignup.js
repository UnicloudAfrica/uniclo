import React, { useState } from "react";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react"; // Added Loader2
import sideBg from "./assets/sideBg.svg";
import logo from "./assets/logo.png";
import { PersonalInfoStep } from "./signupsteps/steptwo";
import { CreateAccountStep } from "./signupsteps/stepone";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { useCreateAccount } from "../../hooks/authHooks";
import { Link, useNavigate } from "react-router-dom";
import { useCreateAdminAccount } from "../../hooks/adminHooks/authHooks";

export default function AdminSignup() {
  const Navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("partner");
  const [currentStep, setCurrentStep] = useState(0);
  const { mutate, isPending } = useCreateAdminAccount();
  const [errors, setErrors] = useState({});
  const { userEmail, setUserEmail } = useAdminAuthStore.getState();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    contactPersonFirstName: "",
    contactPersonLastName: "",
    contactPhone: "",
    businessName: "",
  });
  const { isLoading } = useAdminAuthStore();

  const steps = ["Create Account", "Personal Info"];

  const validateStep = () => {
    const newErrors = {};
    switch (currentStep) {
      case 0:
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
        break;
      case 1:
        if (!formData.contactPersonFirstName)
          newErrors.contactPersonFirstName = "First name is required";
        if (!formData.contactPersonLastName)
          newErrors.contactPersonLastName = "Last name is required";
        if (!formData.contactPhone)
          newErrors.contactPhone = "Phone number is required";
        else if (!/^\+?\d{10,15}$/.test(formData.contactPhone))
          newErrors.contactPhone = "Invalid phone number";
        break;

      default:
        break;
    }
    console.log("Validation errors:", newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    const isValid = validateStep();
    console.log("Is Step Valid:", isValid, "Current Step:", currentStep);
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

    const userData = {
      first_name: formData.contactPersonFirstName,
      last_name: formData.contactPersonLastName,
      phone: formData.contactPhone,
      email: formData.email,
      role: "Admin",
      password: formData.password,
      password_confirmation: formData.confirmPassword,
    };
    mutate(userData, {
      onSuccess: () => {
        setUserEmail(formData.email);
        Navigate("/verify-admin-mail");
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
          <PersonalInfoStep
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
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
                index <= currentStep
                  ? "bg-[#288DD1] text-white"
                  : "bg-gray-200 text-gray-500"
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
      <div className=" w-full h-svh flex items-center justify-center">
        <Loader2 className=" w-12 text-[#288DD1] animate-spin" />
      </div>
    ); // Or a spinner
  }

  return (
    <>
      <div className="min-h-screen flex p-8 font-Outfit">
        <div className="flex-1 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-8">
              <div className="flex items-center justify-center">
                <img src={logo} className="w-[100px]" alt="Logo" />
              </div>
            </div>
            <div className="mb-8 w-full text-center">
              <h1 className="text-2xl font-semibold text-[#121212] mb-2">
                Create an Admin Account
              </h1>
              <p className="text-[#676767] text-sm">
                Create an admin account on Unicloud Africa.
              </p>
            </div>
            <StepProgress currentStep={currentStep} steps={steps} />
            <div className="">{renderCurrentStep()}</div>
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
                {currentStep === steps.length - 1
                  ? "Complete Registration"
                  : "Next"}
                {isPending && (
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                )}
              </button>
            </div>
            <div className="text-center mt-6">
              <span className="text-sm text-[#1E1E1E99]">
                Already have an account?{" "}
              </span>
              <Link
                to="/admin-signin"
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
    </>
  );
}
