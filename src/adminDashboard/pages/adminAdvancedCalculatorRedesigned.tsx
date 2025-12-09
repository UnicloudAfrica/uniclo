// @ts-nocheck

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calculator, Check, Settings, FileText, UserPlus } from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import CalculatorConfigStep from "./calculatorComps/calculatorConfigStep";
import CalculatorSummaryStep from "./calculatorComps/calculatorSummaryStep";
import ToastUtils from "../../utils/toastUtil";
import { useSharedCalculatorPricing, useSharedClients } from "../../hooks/sharedCalculatorHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import AdminPageShell from "../components/AdminPageShell.tsx";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import { useCustomerContext } from "../../hooks/adminHooks/useCustomerContext";
import CustomerContextSelector from "../../shared/components/common/CustomerContextSelector";

const AdminAdvancedCalculatorRedesigned = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const [calculatorData, setCalculatorData] = useState({
    pricing_requests: [],
    object_storage_items: [],
    apply_total_discount: false,
    total_discount_type: "percent",
    total_discount_value: "",
    total_discount_label: "",
    country_code: "US",
    currency_code: "USD",
  });

  const {
    contextType,
    setContextType,
    selectedTenantId,
    setSelectedTenantId,
    selectedUserId,
    setSelectedUserId,
    tenants,
    isTenantsFetching,
    userPool,
    isUsersFetching,
  } = useCustomerContext();

  // const [assignType, setAssignType] = useState("");
  // const [selectedTenantId, setSelectedTenantId] = useState("");
  // const [selectedUserId, setSelectedUserId] = useState("");

  const [pricingResult, setPricingResult] = useState(null);
  const [errors, setErrors] = useState({});

  const steps = [
    { title: "Configuration", icon: Settings },
    { title: "Summary", icon: FileText },
  ];

  const { mutate: calculatePricingMutation, isPending: isCalculatingMutation } =
    useSharedCalculatorPricing();

  // const { data: tenants = [] } = useFetchTenants();
  // const { data: adminClients = [] } = useFetchClients();
  // const { data: tenantClients = [] } = useSharedClients(selectedTenantId, {
  //   enabled: !!selectedTenantId,
  // });

  const updateCalculatorData = React.useCallback((field, value) => {
    setCalculatorData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const handleCountryChange = (countryCode: any, currencyCode: any) => {
    const normalizedCountry = countryCode ? countryCode.toUpperCase() : "";
    const normalizedCurrency = currencyCode ? currencyCode.toUpperCase() : "USD";

    setCalculatorData((prev) => {
      if (prev.country_code === normalizedCountry && prev.currency_code === normalizedCurrency) {
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
  const addPricingRequest = (request: any) => {
    setCalculatorData((prev) => ({
      ...prev,
      pricing_requests: [...prev.pricing_requests, request],
    }));
  };
  const removePricingRequest = (index: any) => {
    setCalculatorData((prev) => ({
      ...prev,
      pricing_requests: prev.pricing_requests.filter((_, i) => i !== index),
    }));
  };
  const addStorageItem = (item: any) => {
    setCalculatorData((prev) => ({
      ...prev,
      object_storage_items: [...(prev.object_storage_items || []), item],
    }));
  };
  const removeStorageItem = (index: any) => {
    setCalculatorData((prev) => ({
      ...prev,
      object_storage_items: (prev.object_storage_items || []).filter((_, i) => i !== index),
    }));
  };
  const validateConfiguration = () => {
    const newErrors = {};

    if (
      calculatorData.pricing_requests.length === 0 &&
      (calculatorData.object_storage_items?.length || 0) === 0
    ) {
      newErrors.general = "Add at least one compute or object storage entry before calculating.";
    }

    if (calculatorData.apply_total_discount) {
      if (
        !calculatorData.total_discount_value ||
        parseFloat(calculatorData.total_discount_value) <= 0
      ) {
        newErrors.total_discount_value = "Please enter a valid discount value.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const calculatePricing = () => {
    if (!validateConfiguration()) return;

    setIsCalculating(true);

    const storageItems = calculatorData.object_storage_items || [];

    const payload = {
      pricing_requests: calculatorData.pricing_requests.map((req: any) => {
        const { _display, ...rest } = req;
        return rest;
      }),
    };

    if (storageItems.length) {
      payload.object_storage_items = storageItems.map((item: any) => {
        const { _display, ...rest } = item;
        return rest;
      });
    }

    const hasComputeRequests = payload.pricing_requests.length > 0;

    if (!hasComputeRequests && storageItems.length === 0) {
      ToastUtils.error("Please add at least one configuration.");
      setIsCalculating(false);
      return;
    }

    if (contextType === "tenant" && selectedTenantId) {
      payload.tenant_id = selectedTenantId;
    } else if (contextType === "user" && selectedUserId) {
      payload.client_id = selectedUserId;
      if (selectedTenantId) payload.tenant_id = selectedTenantId;
    }

    if (calculatorData.apply_total_discount && calculatorData.total_discount_value) {
      const discountValue = parseFloat(calculatorData.total_discount_value);
      if (Number.isNaN(discountValue) || discountValue <= 0) {
        ToastUtils.error("Please enter a valid discount value.");
        setIsCalculating(false);
        return;
      }
      payload.total_discount = {
        type: calculatorData.total_discount_type,
        value: discountValue,
        label: calculatorData.total_discount_label || null,
      };
    }

    if (calculatorData.country_code) {
      payload.country_code = calculatorData.country_code;
    }

    calculatePricingMutation(payload, {
      onSuccess: (data) => {
        setPricingResult(data);
        setCurrentStep(1);
        ToastUtils.success("Pricing calculated successfully!");
      },
      onError: (error) => {
        ToastUtils.error(error.message || "Failed to calculate pricing. Please try again.");
      },
      onSettled: () => {
        setIsCalculating(false);
      },
    });
  };
  const handlePrimaryAction = () => {
    if (isFinalStep) {
      navigate("/admin-dashboard");
      return;
    }
    calculatePricing();
  };
  const renderStep = () => {
    if (currentStep === 0) {
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
        >
          {assignmentCard}
        </CalculatorConfigStep>
      );
    }

    return (
      <div className="space-y-6">
        {assignmentCard}
        <CalculatorSummaryStep
          calculatorData={calculatorData}
          pricingResult={pricingResult}
          onRecalculate={() => setCurrentStep(0)}
        />
      </div>
    );
  };
  const isProcessing = isCalculating || isCalculatingMutation;
  const isFinalStep = currentStep === steps.length - 1;
  const primaryActionLabel = isFinalStep
    ? "Finish & Exit"
    : isProcessing
      ? "Calculating..."
      : "Calculate Pricing";

  const disablePrimary =
    (!isFinalStep &&
      calculatorData.pricing_requests.length === 0 &&
      calculatorData.object_storage_items.length === 0) ||
    isProcessing;

  const assignmentCard = (
    <ModernCard padding="lg" className="space-y-5 bg-slate-50">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
          <UserPlus className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Assignment</h3>
          <p className="text-sm text-slate-500">
            Link this calculator session to a tenant or individual client.
          </p>
        </div>
      </div>

      <CustomerContextSelector
        contextType={contextType}
        setContextType={setContextType}
        selectedTenantId={selectedTenantId}
        setSelectedTenantId={setSelectedTenantId}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        tenants={tenants}
        isTenantsFetching={isTenantsFetching}
        userPool={userPool}
        isUsersFetching={isUsersFetching}
      />
    </ModernCard>
  );

  return (
    <div className="flex h-screen bg-slate-100">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeadbar />
        <main className="flex-1 overflow-y-auto bg-slate-100">
          <AdminPageShell
            title="Advanced Pricing Calculator"
            description="Build, price, and assign complex infrastructure quotes."
            subHeaderContent={
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 shadow-sm">
                  <Settings className="h-4 w-4 text-primary-500" />
                  {`Step ${currentStep + 1} · ${steps[currentStep].title}`}
                </span>
                <span className="text-slate-400">
                  {currentStep === 0
                    ? "Configure workloads, storage tiers, and optional networking before running pricing."
                    : "Review calculated totals, discounts, and export or assign the quote."}
                </span>
              </div>
            }
            contentBackground="transparent"
            disableContentPadding
            contentClassName="space-y-8 p-6 lg:p-8"
          >
            <ModernCard>
              <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-sm text-slate-500">
                    Step through configuration and generate accurate pricing.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {steps.map((step, index) => (
                    <div key={step.title} className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          currentStep > index
                            ? "bg-emerald-500 text-white"
                            : currentStep === index
                              ? "bg-primary-500 text-white"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {currentStep > index ? <Check size={16} /> : index + 1}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          currentStep >= index ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ModernCard>

            {renderStep()}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {currentStep > 0 && (
                <ModernButton
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                  isDisabled={isProcessing}
                  leftIcon={<ChevronLeft size={16} />}
                >
                  Back to configuration
                </ModernButton>
              )}
              <ModernButton
                variant="primary"
                onClick={handlePrimaryAction}
                isDisabled={disablePrimary}
                isLoading={isProcessing}
                leftIcon={
                  !isFinalStep && !isProcessing ? <Calculator className="h-4 w-4" /> : undefined
                }
              >
                {primaryActionLabel}
              </ModernButton>
            </div>

            {errors.general && <p className="text-sm font-medium text-red-600">{errors.general}</p>}
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
};
export default AdminAdvancedCalculatorRedesigned;
