import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PersonalInfoStep from "./personalInfoStep";
import BusinessInfoStep from "./partnerBuisnessStep"; // Renamed for clarity

export default function SignUpForm({
  activeTab,
  formData,
  errors,
  isPending,
  industries,
  isIndustriesFetching,
  updateFormData,
  handleSubmit,
}) {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  return (
    <form onSubmit={handleSubmit}>
      {step === 1 && (
        <PersonalInfoStep
          formData={formData}
          errors={errors}
          updateFormData={updateFormData}
          onNext={handleNext}
        />
      )}
      {step === 2 && (
        <BusinessInfoStep
          formData={formData}
          errors={errors}
          industries={industries}
          isIndustriesFetching={isIndustriesFetching}
          updateFormData={updateFormData}
          onBack={handleBack}
          isPending={isPending}
          isClient={activeTab === "client"} // Pass a prop to conditionally render fields
        />
      )}
      {/* {errors.general && (
        <p className="text-red-500 text-xs mt-1 text-center">
          {errors.general}
        </p>
      )} */}
      <div className="text-center mt-6">
        <span className="text-sm text-[#1E1E1E99]">
          Already have an account?{" "}
        </span>
        <Link
          to="/sign-in"
          className="text-sm text-[#288DD1] hover:text-[#6db1df] font-medium"
        >
          Login
        </Link>
      </div>
    </form>
  );
}
