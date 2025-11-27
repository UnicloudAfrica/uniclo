
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calculator, Check, Settings, FileText, UserPlus } from "lucide-react";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import CalculatorConfigStep from "./calculatorComps/calculatorConfigStep";
import CalculatorSummaryStep from "./calculatorComps/calculatorSummaryStep";
import ToastUtils from "../../utils/toastUtil";
import { useSharedCalculatorPricing, useSharedClients } from "../../hooks/sharedCalculatorHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";

const AdminAdvancedCalculatorRedesigned = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const [assignType, setAssignType] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const [pricingResult, setPricingResult] = useState(null);
  const [errors, setErrors] = useState({});

  const steps = [
    { title: "Configuration", icon: Settings },
    { title: "Summary", icon: FileText },
  ];

  const { mutate: calculatePricingMutation, isPending: isCalculatingMutation } =
    useSharedCalculatorPricing();

  const { data: tenants = [] } = useFetchTenants();
  const { data: adminClients = [] } = useFetchClients();
  const { data: tenantClients = [] } = useSharedClients(selectedTenantId, {
    enabled: !!selectedTenantId,
  });

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
        "Add at least one compute or object storage entry before calculating.";
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

    const hasComputeRequests = payload.pricing_requests.length > 0;

    if (!hasComputeRequests && storageItems.length === 0) {
      ToastUtils.error("Please add at least one configuration.");
      setIsCalculating(false);
      return;
    }

    if (assignType === "tenant" && selectedTenantId) {
      payload.tenant_id = selectedTenantId;
    } else if (assignType === "user" && selectedUserId) {
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
        ToastUtils.error(
          error.message || "Failed to calculate pricing. Please try again."
        );
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
  
  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);

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

  const selectedTenant = tenants.find(
    (tenant) => String(tenant.id) === String(selectedTenantId)
  );
  const userPool = selectedTenantId ? tenantClients : adminClients;
  const selectedUser = userPool?.find(
    (user) => String(user.id) === String(selectedUserId)
  );

  const isProcessing = isCalculating || isCalculatingMutation;
  const isFinalStep = currentStep === steps.length - 1;
  const primaryActionLabel = isFinalStep
    ? "Finish & Exit"
    : isProcessing
    ? "Calculating..."
    : "Calculate Pricing";

  const disablePrimary =
    (!isFinalStep && (calculatorData.pricing_requests.length === 0 && calculatorData.object_storage_items.length === 0)) ||
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => {
            setAssignType("");
            setSelectedTenantId("");
            setSelectedUserId("");
          }}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            assignType === ""
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          None
        </button>
        <button
          type="button"
          onClick={() => {
            setAssignType("tenant");
            setSelectedUserId("");
          }}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            assignType === "tenant"
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          Tenant
        </button>
        <button
          type="button"
          onClick={() => setAssignType("user")}
          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
            assignType === "user"
              ? "bg-primary-500 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          User
        </button>
      </div>

      <select
        value={selectedTenantId}
        onChange={(event) => {
          setSelectedTenantId(event.target.value);
          setSelectedUserId("");
        }}
        disabled={!assignType}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-100"
      >
        <option value="">{assignType ? "Select tenant" : "Choose assignment type first"}</option>
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>

      <select
        value={selectedUserId}
        onChange={(event) => setSelectedUserId(event.target.value)}
        disabled={assignType !== "user"}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:bg-slate-100"
      >
        <option value="">{assignType === "user" ? "Select user" : "Choose user assignment"}</option>
        {userPool.map((user) => (
          <option key={user.id} value={user.id}>
            {`${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email}
          </option>
        ))}
      </select>

      <div className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600">
        <p className="text-xs uppercase tracking-wide text-slate-400">Current selection</p>
        <p className="mt-1 font-semibold text-primary-600">
          {assignType === "user" && selectedUser
            ? `${selectedUser.first_name ?? ""} ${selectedUser.last_name ?? ""}`.trim() ||
              selectedUser.email
            : assignType === "tenant" && selectedTenant
            ? selectedTenant.name
            : "None"}
        </p>
      </div>
    </ModernCard>
  );
    
  return (
    <div className="flex h-screen bg-slate-100">
      <AdminSidebar isMobileMenuOpen={isMobileMenuOpen} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
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
                  <h2 className="text-lg font-semibold text-slate-900">{steps[currentStep].title}</h2>
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

            {errors.general && (
              <p className="text-sm font-medium text-red-600">{errors.general}</p>
            )}
          </AdminPageShell>
        </main>
      </div>
    </div>
  );
};
export default AdminAdvancedCalculatorRedesigned;
