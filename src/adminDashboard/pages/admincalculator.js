import React, { useEffect, useState } from "react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";

import Step1Configuration from "../../components/calcComps/step1";
import { Step2Summary } from "./calcComp/breakdownCalculator";
import AdminPageShell from "../components/AdminPageShell";

const STEPS = ["Configuration", "Breakdown"];

const StepProgress = ({ currentStep, steps }) => (
  <div className="flex items-center justify-between mb-8 w-full max-w-xl mx-auto">
    {steps.map((step, index) => (
      <div key={step} className="flex items-center">
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
              index <= currentStep
                ? "bg-[#288DD1] text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {index + 1}
          </div>
          <p
            className={`text-xs mt-2 text-center transition-colors duration-300 ${
              index <= currentStep ? "text-[#288DD1]" : "text-gray-500"
            }`}
          >
            {step}
          </p>
        </div>
        {index < steps.length - 1 && (
          <div
            className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${
              index < currentStep ? "bg-[#288DD1]" : "bg-gray-200"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

export default function Admincalculator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [billingData, setBillingData] = useState({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleNextWithData = (data) => {
    setBillingData(data);
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => setCurrentStep((prev) => prev - 1);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1Configuration src="dashboard" handleNext={handleNextWithData} />
        );

      case 1:
        return (
          <Step2Summary billingData={billingData} handlePrev={handlePrev} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />
      <AdminPageShell
        title="Cloud Cost Calculator"
        description="Create your cloud setup, select instances, storage, and networking, and get an instant price estimate with discounts."
        contentClassName="space-y-6"
      >
        <div className="w-full">
          <StepProgress currentStep={currentStep} steps={STEPS} />
          {renderStep()}
        </div>
      </AdminPageShell>
    </>
  );
}
