import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useSharedCalculatorPricing } from "../../../hooks/sharedCalculatorHooks";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../../hooks/adminHooks/clientHooks";
import { useFetchClientProfile } from "../../../hooks/clientHooks/resources";
import { useFetchTenantBusinessSettings } from "../../../hooks/settingsHooks";
import PricingCalculatorConfig from "./calculator/PricingCalculatorConfig";
import CalculatorSummaryStep from "./calculator/CalculatorSummaryStep";
import { CustomerContextSelector } from "../../components";
import { ModernButton } from "../ui";

const SharedPricingCalculator = ({ mode = "admin", onExit }) => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isCalculating, setIsCalculating] = useState(false);
  const [pricingResult, setPricingResult] = useState(null);
  const [errors, setErrors] = useState({});

  // Initial State
  const [calculatorData, setCalculatorData] = useState({
    pricing_requests: [],
    object_storage_items: [],
    apply_total_discount: false,
    total_discount_type: "percent",
    total_discount_value: "",
    country_code: "US",
    currency_code: "USD",
  });

  // Customer Context State
  const [contextType, setContextType] = useState(mode === "client" ? "none" : "none");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  // Fetch data based on mode
  // Admin: Fetch all tenants and clients
  // Tenant: Fetch own clients (if needed, or just use context)
  // Client: No fetch needed for context, just self

  const { data: tenants = [], isFetching: isTenantsFetching } = useFetchTenants({
    enabled: mode === "admin",
  });

  const { data: adminClients = [], isFetching: isClientsFetching } = useFetchClients({
    enabled: mode === "admin",
  });

  const { mutateAsync: calculatePricing, isPending: isCalculatingMutation } =
    useSharedCalculatorPricing();

  // Fetch Client Profile if Client Mode
  const { data: clientProfile } = useFetchClientProfile({
    enabled: mode === "client",
  });

  // Fetch Tenant Settings if Tenant Mode
  const { data: tenantSettings } = useFetchTenantBusinessSettings({
    enabled: mode === "tenant",
  });

  // Derived User Pool
  // For Admin: All clients
  // For Tenant: Should filter clients by selected tenant or fetch tenant's clients
  // For now, keeping simple logic from original, but this might need adjustment for Tenant mode
  const userPool = adminClients;

  // Effect to set initial context based on mode
  useEffect(() => {
    if (mode === "client") {
      setContextType("none"); // Client is always self
    } else if (mode === "tenant") {
      // Tenant might want to select a user, or be "none" (self)
      // Default to none
    }
  }, [mode]);

  const updateCalculatorData = (field, value) => {
    setCalculatorData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleCountryChange = (countryCode, currencyCode) => {
    setCalculatorData((prev) => ({
      ...prev,
      country_code: countryCode,
      currency_code: currencyCode,
      pricing_requests: [], // Reset workloads on country change as prices differ
      object_storage_items: [],
    }));
    setPricingResult(null);
    setActiveStep(1);
  };

  const onAddStorageItem = (item) => {
    setCalculatorData((prev) => ({
      ...prev,
      object_storage_items: [...prev.object_storage_items, item],
    }));
  };

  const onRemoveStorageItem = (index) => {
    setCalculatorData((prev) => ({
      ...prev,
      object_storage_items: prev.object_storage_items.filter((_, i) => i !== index),
    }));
  };

  const validateConfig = () => {
    let isValid = true;
    const newErrors = {};

    if (
      calculatorData.pricing_requests.length === 0 &&
      calculatorData.object_storage_items.length === 0
    ) {
      newErrors.general = "Please add at least one workload or storage item.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCalculate = async () => {
    if (!validateConfig()) {
      return;
    }

    setIsCalculating(true);
    try {
      const payload = {
        pricing_requests: calculatorData.pricing_requests.map((req) => ({
          region: req.region,
          compute_instance_id: req.compute_instance_id,
          os_image_id: req.os_image_id,
          months: req.months,
          number_of_instances: req.number_of_instances,
          volume_types:
            req.volumes?.map((vol) => ({
              volume_type_id: vol.volume_type_id,
              storage_size_gb: vol.storage_size_gb,
            })) || [],
          bandwidth_id: req.bandwidth_id,
          bandwidth_count: req.bandwidth_count,
          floating_ip_id: req.floating_ip_id,
          floating_ip_count: req.floating_ip_count,
          cross_connect_id: req.cross_connect_id,
        })),
        object_storage_items: calculatorData.object_storage_items.map((item) => ({
          ...item,
          productable_id: item.tier_id,
        })),
        apply_total_discount: calculatorData.apply_total_discount,
        total_discount_type: calculatorData.total_discount_type,
        total_discount_value: calculatorData.total_discount_value,
        currency_code: calculatorData.currency_code,
      };

      // Add context to payload if applicable
      if (mode === "admin" || mode === "tenant") {
        if (contextType === "tenant" && selectedTenantId) {
          payload.tenant_id = selectedTenantId;
        } else if (contextType === "user" && selectedUserId) {
          payload.client_id = selectedUserId;
          if (selectedTenantId) payload.tenant_id = selectedTenantId;
        }
      }

      const response = await calculatePricing(payload);
      setPricingResult(response);
      setActiveStep(2);
    } catch (err) {
      console.error("Calculation failed:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="pb-24 md:pb-12">
      {/* Step Indicator - Could be passed as prop or kept here if generic */}
      <div className="mb-6 flex items-center gap-2">
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${activeStep === 1 ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200" : "text-slate-500"}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm">
            1
          </span>
          Configuration
        </div>
        <div className="h-px w-8 bg-slate-200"></div>
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${activeStep === 2 ? "bg-primary-50 text-primary-700 ring-1 ring-primary-200" : "text-slate-500"}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold shadow-sm border border-slate-200">
            2
          </span>
          Summary
        </div>
      </div>

      {activeStep === 1 ? (
        <PricingCalculatorConfig
          calculatorData={calculatorData}
          errors={errors}
          updateCalculatorData={updateCalculatorData}
          onAddStorageItem={onAddStorageItem}
          onRemoveStorageItem={onRemoveStorageItem}
          onCountryChange={handleCountryChange}
          mode={mode}
          clientProfile={clientProfile}
          tenantSettings={tenantSettings}
        >
          {/* Assignment Context Card - Only show for Admin and Tenant */}
          {mode !== "client" && (
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
              isUsersFetching={isClientsFetching}
              mode={mode} // Pass mode to selector to adjust options
            />
          )}
        </PricingCalculatorConfig>
      ) : (
        <CalculatorSummaryStep
          calculatorData={calculatorData}
          pricingResult={pricingResult}
          onRecalculate={() => setActiveStep(1)}
        />
      )}

      {/* Sticky Footer for Step 1 */}
      {activeStep === 1 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] md:static md:border-0 md:bg-transparent md:shadow-none md:p-0 md:hidden">
          <div className="mx-auto max-w-7xl md:px-6 lg:px-8">
            <div className="flex justify-end">
              <ModernButton
                size="lg"
                className="w-full md:w-auto shadow-lg shadow-primary-500/20"
                onClick={handleCalculate}
                isLoading={isCalculating}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Calculate Pricing
              </ModernButton>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Action Button for Step 1 */}
      {activeStep === 1 && (
        <div className="hidden md:flex justify-end mt-6">
          <ModernButton
            size="lg"
            className="shadow-lg shadow-primary-500/20"
            onClick={handleCalculate}
            isLoading={isCalculating}
            rightIcon={<ArrowRight className="h-5 w-5" />}
          >
            Calculate Pricing
          </ModernButton>
        </div>
      )}

      {/* Action Buttons for Step 2 */}
      {activeStep === 2 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end mt-6">
          <ModernButton
            variant="outline"
            onClick={() => setActiveStep(1)}
            leftIcon={<ChevronLeft size={16} />}
          >
            Back to configuration
          </ModernButton>
          <ModernButton variant="primary" onClick={onExit || (() => navigate(-1))}>
            Finish & Exit
          </ModernButton>
        </div>
      )}
    </div>
  );
};

export default SharedPricingCalculator;
