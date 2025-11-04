import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Calculator } from "lucide-react";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import CalculatorConfigStep from "./calculatorComps/calculatorConfigStep";
import CalculatorSummaryStep from "./calculatorComps/calculatorSummaryStep";
import ToastUtils from "../../utils/toastUtil";
import { useSharedCalculatorPricing, useSharedClients } from "../../hooks/sharedCalculatorHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";

const AdminAdvancedCalculator = () => {
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

  const steps = ["Configuration", "Summary & Options"];
  const stepDescriptions = [
    "Add infrastructure, storage, and networking elements to scope pricing.",
    "Review calculated totals, apply discounts, and prepare follow-up actions.",
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
      setIsCalculating(false);
      return;
    }

    if (hasComputeRequests) {
      const invalidRequests = payload.pricing_requests.filter(
        (req) => !req.region || !req.compute_instance_id || !req.os_image_id
      );

      if (invalidRequests.length > 0) {
        ToastUtils.error(
          "Some configurations are missing required fields (region, compute instance, or OS image)."
        );
        setIsCalculating(false);
        return;
      }
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
        setIsCalculating(false);
      },
      onError: (error) => {
        let errorMessage = "Failed to calculate pricing. Please try again.";
        if (error.message) {
          if (error.message.includes("Invalid pricing")) {
            errorMessage =
              "The pricing service returned an unexpected response. Please contact support.";
          } else if (error.message.includes("Failed to fetch")) {
            errorMessage = "Unable to reach pricing service. Check your network connection.";
          } else {
            errorMessage = error.message;
          }
        }
        ToastUtils.error(errorMessage);
        setIsCalculating(false);
      },
    });
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handlePrimaryAction = () => {
    if (isFinalStep) {
      navigate("/admin-dashboard");
      return;
    }
    calculatePricing();
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

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
        />
      );
    }

    return (
      <CalculatorSummaryStep
        calculatorData={calculatorData}
        pricingResult={pricingResult}
        onRecalculate={() => setCurrentStep(0)}
      />
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
    ? "Complete"
    : isProcessing
    ? "Calculating..."
    : "Calculate Pricing";

  const disablePrimary =
    (!isFinalStep && calculatorData.pricing_requests.length === 0) ||
    (currentStep === 0 && isProcessing);

  const summaryCards = [
    {
      key: "configs",
      title: "Configurations",
      value: `${calculatorData.pricing_requests.length || 0} item$${
        calculatorData.pricing_requests.length === 1 ? "" : "s"
      }`,
      tone: calculatorData.pricing_requests.length ? "info" : "warning",
    },
    {
      key: "assignment",
      title: "Assignment",
      value:
        assignType === "tenant" && selectedTenant
          ? selectedTenant.name || selectedTenant.company_name
          : assignType === "user" && selectedUser
          ? selectedUser.business_name || selectedUser.email
          : "Not assigned",
      tone: assignType ? "success" : "neutral",
    },
    calculatorData.apply_total_discount && calculatorData.total_discount_value
      ? {
          key: "discount",
          title: "Discount",
          value:
            calculatorData.total_discount_type === "percent"
              ? `${calculatorData.total_discount_value}%`
              : `$${calculatorData.total_discount_value}`,
          tone: "info",
        }
      : null,
  ].filter(Boolean);

  const assignmentButtons = [
    { label: "None", value: "" },
    { label: "Tenant", value: "tenant" },
    { label: "User", value: "user" },
  ];

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Advanced Calculator"
        description="Build infrastructure quotes, calculate totals, and keep everything tied to the right account."
        actions={
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin-dashboard")}
          >
            Back to dashboard
          </ModernButton>
        }
        contentClassName="space-y-6 2xl:space-y-8"
      >
        <ModernCard
          padding="lg"
          className="space-y-6 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50"
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={`Step ${currentStep + 1} of ${steps.length}`}
                  tone={currentStep + 1 === steps.length ? "success" : "info"}
                />
                <span className="text-sm font-medium text-slate-600">
                  {steps[currentStep]}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">
                {currentStep === 0
                  ? "Build and queue infrastructure configurations"
                  : "Review pricing output and follow-up options"}
              </h2>
              <p className="text-sm text-slate-600">
                {stepDescriptions[currentStep]}
              </p>
            </div>
            <div className="w-full max-w-sm xl:pl-8">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>
          </div>
        </ModernCard>

        {summaryCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
              <ModernCard key={card.key} padding="lg" className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {card.title}
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {card.value}
                </p>
              </ModernCard>
            ))}
          </div>
        )}

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <div className="space-y-6">{renderStep()}</div>

          <div className="space-y-6 2xl:sticky 2xl:top-24">
            <ModernCard padding="lg" className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-slate-900">
                  Assignment
                </h3>
                <p className="text-sm text-slate-500">
                  Link this session to a tenant or direct client. We will carry
                  it through to the summary for quick follow-up.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {assignmentButtons.map((option) => (
                  <button
                    key={option.value || "none"}
                    type="button"
                    onClick={() => {
                      setAssignType(option.value);
                      setSelectedTenantId("");
                      setSelectedUserId("");
                    }}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      assignType === option.value
                        ? "border-primary-500 bg-primary-50 text-primary-600"
                        : "border-slate-200 text-slate-600 hover:border-primary-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Tenant
                  </label>
                  <select
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value);
                      setSelectedUserId("");
                    }}
                    disabled={assignType !== "tenant" && assignType !== "user"}
                    className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                      assignType ? "border-slate-300 bg-white" : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <option value="">
                      {assignType ? "Select tenant" : "Choose assignment type"}
                    </option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name || tenant.company_name || `Tenant ${tenant.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    disabled={assignType !== "user"}
                    className={`w-full rounded-xl border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ${
                      assignType === "user"
                        ? "border-slate-300 bg-white"
                        : "border-slate-200 bg-slate-50 text-slate-400"
                    }`}
                  >
                    <option value="">
                      {assignType === "user"
                        ? "Select user"
                        : "Choose user assignment"}
                    </option>
                    {userPool?.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.business_name ||
                          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                          user.email ||
                          `User ${user.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                Current assignment:{" "}
                <span className="font-medium text-slate-700">
                  {assignType === "tenant" && selectedTenant
                    ? selectedTenant.name || selectedTenant.company_name
                    : assignType === "user" && selectedUser
                    ? selectedUser.business_name || selectedUser.email
                    : "Not assigned"}
                </span>
              </div>
            </ModernCard>

            {currentStep === 0 && (
              <ModernCard padding="lg" className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Configuration snapshot
                  </h3>
                  <p className="text-sm text-slate-500">
                    Quick glance summary of what will feed the pricing engine.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Configurations
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {calculatorData.pricing_requests.length} item
                      {calculatorData.pricing_requests.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Discount
                    </p>
                    {calculatorData.apply_total_discount &&
                    calculatorData.total_discount_value ? (
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {calculatorData.total_discount_value}
                        {calculatorData.total_discount_type === "percent" ? "%" : ""}
                        {calculatorData.total_discount_label
                          ? ` • ${calculatorData.total_discount_label}`
                          : ""}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-500">Not applied</p>
                    )}
                  </div>
                </div>
              </ModernCard>
            )}

            {currentStep === 1 && pricingResult?.pricing && (
              <ModernCard padding="lg" className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    Latest calculation
                  </h3>
                  <p className="text-sm text-slate-500">
                    Totals from the most recent pricing run.
                  </p>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <dt className="text-slate-500">Grand total</dt>
                    <dd className="font-semibold text-slate-900">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: pricingResult.pricing.currency || "USD",
                      }).format(pricingResult.pricing.total || 0)}
                    </dd>
                  </div>
                  {pricingResult.pricing.monthly_total ? (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-slate-500">Monthly</dt>
                      <dd className="font-semibold text-slate-900">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: pricingResult.pricing.currency || "USD",
                        }).format(pricingResult.pricing.monthly_total)}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </ModernCard>
            )}
          </div>
        </div>

        <ModernCard
          padding="lg"
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              {currentStep === 0
                ? "Review the configuration before running the pricing engine."
                : "Pricing is ready. Take it forward or adjust the configuration."}
            </p>
            {errors.general && (
              <p className="font-medium text-red-600">{errors.general}</p>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            {currentStep > 0 && (
              <ModernButton
                variant="ghost"
                onClick={handleBack}
                isDisabled={isProcessing}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </ModernButton>
            )}
            <ModernButton
              variant="primary"
              onClick={handlePrimaryAction}
              isDisabled={disablePrimary}
              isLoading={!isFinalStep && isProcessing}
              leftIcon={
                currentStep === 0 && !isProcessing ? (
                  <Calculator className="h-4 w-4" />
                ) : undefined
              }
            >
              {primaryActionLabel}
            </ModernButton>
          </div>
        </ModernCard>
      </AdminPageShell>
    </>
  );
};

export default AdminAdvancedCalculator;
