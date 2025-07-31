import React, { useState, useEffect } from "react";

import Navbar from "../components/navbar";
import Footer from "../components/footer";
import Ads from "../components/ad";
import { Step1Configuration } from "../components/calcComps/step1";
import { Step2ContactForm } from "../components/calcComps/step2";
import { Step3Breakdown } from "../components/calcComps/step3";

const STEPS = ["Configuration", "Personal Details", "Breakdown"];

const StepProgress = ({ currentStep, steps }) => (
  <div className="flex items-center justify-between mb-8 w-full max-w-xl mx-auto">
    {steps.map((step, index) => (
      <React.Fragment key={step}>
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
      </React.Fragment>
    ))}
  </div>
);

// File: components/Step3Breakdown.js

// File: App.js (main calculator component)
export default function Calculator() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "user",
  });

  // Scrolls to the top of the window whenever the step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handlePrev = () => setCurrentStep((prev) => prev - 1);

  const handleSelect = (category, item) => {
    setSelectedOptions((prev) => ({ ...prev, [category]: item }));
  };

  const handlePersonalInfoChange = (e) => {
    const { id, value, name, type } = e.target;
    setPersonalInfo((prev) => ({
      ...prev,
      [type === "radio" ? name : id]: value,
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step1Configuration
            selectedOptions={selectedOptions}
            handleSelect={handleSelect}
            handleNext={handleNext}
          />
        );
      case 1:
        return (
          <Step2ContactForm
            personalInfo={personalInfo}
            handleInputChange={handlePersonalInfoChange}
            handleNext={handleNext}
            handlePrev={handlePrev}
          />
        );
      case 2:
        return (
          <Step3Breakdown
            selectedOptions={selectedOptions}
            personalInfo={personalInfo}
            handlePrev={handlePrev}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Navbar />
      <div className="mt-[10em] px-4 md:px-8 lg:px-16 w-full text-[#121212] font-Outfit flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <p className="font-medium text-3xl md:text-[40px] md:leading-[50px] text-center">
            Simple Calculator
          </p>
          <p className="text-center font-normal mt-3 text-[#676767] max-w-[700px] text-lg md:text-xl">
            Configure your ideal cloud setup and get an instant, transparent
            pricing estimate. Select from our available instances, storage, and
            networking options.
          </p>
        </div>

        <div className="max-w-5xl w-full mt-10 p-6 md:p-10 rounded-[24px] bg-[#FAFAFA] border border-[#ECEDF0] shadow-md">
          <StepProgress currentStep={currentStep} steps={STEPS} />
          {renderStep()}
        </div>
      </div>
      <Ads />
      <Footer />
    </>
  );
}
