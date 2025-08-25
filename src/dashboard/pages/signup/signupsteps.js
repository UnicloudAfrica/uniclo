import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import PersonalInfoStep from "./personalInfoStep";
import PartnerBusinessStep from "./partnerBuisnessStep";
import ClientForm from "./clientForm";

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
      {activeTab === "partner" ? (
        <>
          {step === 1 && (
            <PersonalInfoStep
              formData={formData}
              errors={errors}
              updateFormData={updateFormData}
              onNext={handleNext}
            />
          )}
          {step === 2 && (
            <PartnerBusinessStep
              formData={formData}
              errors={errors}
              industries={industries}
              isIndustriesFetching={isIndustriesFetching}
              updateFormData={updateFormData}
              onBack={handleBack}
              isPending={isPending}
            />
          )}
        </>
      ) : (
        <ClientForm
          formData={formData}
          errors={errors}
          updateFormData={updateFormData}
          isPending={isPending}
        />
      )}
      {errors.general && (
        <p className="text-red-500 text-xs mt-1 text-center">
          {errors.general}
        </p>
      )}
      {activeTab === "client" && (
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign Up
            {isPending && (
              <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
            )}
          </button>
        </div>
      )}
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
