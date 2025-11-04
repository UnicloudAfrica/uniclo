import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calculator, Loader2 } from "lucide-react";
import ToastUtils from "../../utils/toastUtil";
import StepProgress from "./calculatorComps/stepProgress";
import CalculatorSummaryStep from "./calculatorComps/calculatorSummaryStep";
import CalculatorConfigStep from "./calculatorComps/calculatorConfigStep";
import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import { useClientCalculatePricing } from "../../hooks/clientHooks/calculatorHook";

const ClientCalculator = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  const [calculatorData, setCalculatorData] = useState({
    pricing_requests: [],
    object_storage_items: [],
    country_code: "US",
    currency_code: "USD",
  });

  const [pricingResult, setPricingResult] = useState(null);
  const [errors, setErrors] = useState({});

  const { mutate: calculatePricingMutation, isPending: isCalculating } =
    useClientCalculatePricing({
      onSuccess: (data) => {
        setPricingResult(data);
        setCurrentStep(1); // Move to summary step
        ToastUtils.success("Pricing calculated successfully!");
      },
      onError: (error) => {
        console.error("Calculation error:", error);
        ToastUtils.error(
          error.message || "Failed to calculate pricing. Please try again."
        );
      },
    });

  const steps = ["Configuration", "Summary & Options"];

  const updateCalculatorData = (field, value) => {
    setCalculatorData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleCountryChange = (countryCode, currencyCode) => {
    const normalizedCountry = countryCode ? countryCode.toUpperCase() : "";
    const normalizedCurrency = currencyCode ? currencyCode.toUpperCase() : "USD";

    setCalculatorData((prev) => {
      if (
        prev.country_code === normalizedCountry &&
        prev.currency_code === normalizedCurrency
      ) {
        return prev;
      }

      return {
        ...prev,
        country_code: normalizedCountry,
        currency_code: normalizedCurrency,
        pricing_requests: [],
        object_storage_items: [],
      };
    });

    setPricingResult(null);
    setCurrentStep(0);
    setErrors({});
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

  const addStorageItem = (item) => {
    setCalculatorData((prev) => ({
      ...prev,
      object_storage_items: [...(prev.object_storage_items || []), item],
    }));
  };

  const removeStorageItem = (index) => {
    setCalculatorData((prev) => ({
      ...prev,
      object_storage_items: (prev.object_storage_items || []).filter(
        (_, i) => i !== index
      ),
    }));
  };

  const validateConfiguration = () => {
    const newErrors = {};

    if (
      calculatorData.pricing_requests.length === 0 &&
      (calculatorData.object_storage_items?.length || 0) === 0
    ) {
      newErrors.general =
        "Add at least one compute or object storage item to calculate.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculatePricing = async () => {
    if (!validateConfiguration()) {
      return;
    }

    const storageItems = calculatorData.object_storage_items || [];
    const hasComputeRequests = calculatorData.pricing_requests.length > 0;

    if (!hasComputeRequests && storageItems.length > 0) {
      const syntheticResult = {
        pricing: {
          lines: [],
          pre_discount_subtotal: 0,
          discount: 0,
          discount_label: null,
          subtotal: 0,
          tax: 0,
          total: 0,
          currency:
            storageItems[0]?.currency || calculatorData.currency_code || "USD",
        },
        summary: {
          total_items: 0,
          total_instances: 0,
          regions: [],
          has_discount: false,
        },
      };

      setPricingResult(syntheticResult);
      setCurrentStep(1);
      ToastUtils.success("Pricing calculation complete.");
      return;
    }

    const payload = {
      pricing_requests: calculatorData.pricing_requests.map((req) => {
        const { _display, ...rest } = req;
        return rest;
      }),
    };

    if (storageItems.length) {
      payload.object_storage_items = storageItems.map((item) => {
        const { _display, ...rest } = item;
        return rest;
      });
    }

    if (calculatorData.country_code) {
      payload.country_code = calculatorData.country_code;
    }

    calculatePricingMutation(payload);
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
          onAddStorageItem={addStorageItem}
          onRemoveStorageItem={removeStorageItem}
          onCountryChange={handleCountryChange}
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
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <main className="dashboard-content-shell p-6 md:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center pb-2 ">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-[#575758]">
                Advanced Calculator
              </h2>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Configure your infrastructure, calculate pricing with discounts,
              and optionally generate invoices and create leads.
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
                  disabled={isCalculating}
                >
                  <ChevronLeft className="w-4 h-4 mr-1 inline-block" /> Back
                </button>
              )}
            </div>

            {currentStep === 0 && (
              <button
                onClick={handleNext}
                disabled={
                  isCalculating || calculatorData.pricing_requests.length === 0
                }
                className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isCalculating ? (
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

export default ClientCalculator;
