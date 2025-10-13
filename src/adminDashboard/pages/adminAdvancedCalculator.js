import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calculator, Loader2 } from "lucide-react";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminActiveTab from "../components/adminActiveTab";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import CalculatorConfigStep from "./calculatorComps/calculatorConfigStep";
import CalculatorSummaryStep from "./calculatorComps/calculatorSummaryStep";
import ToastUtils from "../../utils/toastUtil";
import { useSharedCalculatorPricing } from "../../hooks/sharedCalculatorHooks";

const AdminAdvancedCalculator = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const [calculatorData, setCalculatorData] = useState({
    tenant_id: "",
    client_id: "",
    pricing_requests: [],
    // Total discount fields
    apply_total_discount: false,
    total_discount_type: "percent",
    total_discount_value: "",
    total_discount_label: "",
  });

  const [pricingResult, setPricingResult] = useState(null);
  const [errors, setErrors] = useState({});

  const steps = ["Configuration", "Summary & Options"];
  
  // Use shared calculator pricing hook
  const { mutate: calculatePricingMutation, isPending: isCalculatingMutation } = useSharedCalculatorPricing();

  const updateCalculatorData = (field, value) => {
    setCalculatorData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const addPricingRequest = (request) => {
    setCalculatorData((prev) => ({
      ...prev,
      pricing_requests: [...prev.pricing_requests, request],
    }));
  };

  const removePricingRequest = (index) => {
    setCalculatorData((prev) => ({
      ...prev,
      pricing_requests: prev.pricing_requests.filter((_, i) => i !== index),
    }));
  };

  const validateConfiguration = () => {
    const newErrors = {};
    
    if (calculatorData.pricing_requests.length === 0) {
      newErrors.general = "Please add at least one configuration to calculate.";
    }

    if (calculatorData.apply_total_discount) {
      if (!calculatorData.total_discount_value || parseFloat(calculatorData.total_discount_value) <= 0) {
        newErrors.total_discount_value = "Please enter a valid discount value.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePricing = () => {
    if (!validateConfiguration()) {
      return;
    }

    setIsCalculating(true);

    // Prepare payload
    const payload = {
      client_id: calculatorData.client_id || null,
      tenant_id: calculatorData.tenant_id || null,
      pricing_requests: calculatorData.pricing_requests.map((req) => {
        const { _display, ...rest } = req;
        return rest;
      }),
    };

    // Add total discount if applied
    if (calculatorData.apply_total_discount && calculatorData.total_discount_value) {
      payload.total_discount = {
        type: calculatorData.total_discount_type,
        value: parseFloat(calculatorData.total_discount_value),
        label: calculatorData.total_discount_label || null,
      };
    }

    // Use the mutation from shared hook
    calculatePricingMutation(payload, {
      onSuccess: (data) => {
        setPricingResult(data);
        setCurrentStep(1); // Move to summary step
        ToastUtils.success("Pricing calculated successfully!");
        setIsCalculating(false);
      },
      onError: (error) => {
        console.error('Calculation error:', error);
        ToastUtils.error(error.message || "Failed to calculate pricing. Please try again.");
        setIsCalculating(false);
      }
    });
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      calculatePricing();
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <CalculatorConfigStep
            calculatorData={calculatorData}
            errors={errors}
            updateCalculatorData={updateCalculatorData}
            onAddRequest={addPricingRequest}
            onRemoveRequest={removePricingRequest}
          />
        );
      case 1:
        return (
          <CalculatorSummaryStep
            calculatorData={calculatorData}
            pricingResult={pricingResult}
            onRecalculate={() => setCurrentStep(0)}
          />
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
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center pb-4 border-b">
            <div className="flex items-center">
              <Calculator className="w-6 h-6 mr-3 text-[#288DD1]" />
              <h2 className="text-lg font-semibold text-[#575758]">
                Advanced Calculator
              </h2>
            </div>
            <button
              onClick={() => navigate("/admin-dashboard")}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Configure your infrastructure, calculate pricing with discounts, and optionally generate invoices and create leads.
            </p>
          </div>

          <div className="sticky top-0 z-10 bg-white pt-6 pb-4 border-b mb-6">
            <StepProgress currentStep={currentStep} steps={steps} />
          </div>

          <div
            ref={contentRef}
            className="w-full flex flex-col items-center justify-start"
          >
            {renderStep()}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isCalculating || isCalculatingMutation}
                >
                  <ChevronLeft className="w-4 h-4 mr-1 inline-block" /> Back
                </button>
              )}
            </div>

            {currentStep === 0 && (
              <button
                onClick={handleNext}
                disabled={isCalculating || isCalculatingMutation || calculatorData.pricing_requests.length === 0}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {(isCalculating || isCalculatingMutation) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calculate Pricing
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminAdvancedCalculator;