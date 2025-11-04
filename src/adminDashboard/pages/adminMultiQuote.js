import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useCreateMultiQuotes } from "../../hooks/adminHooks/calculatorOptionHooks";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import { useSharedClients } from "../../hooks/sharedCalculatorHooks";
import { useFetchProductPricing } from "../../hooks/resource";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import QuoteInfoStep from "./quoteComps/quoteInfoStep";
import QuoteResourceStep from "./quoteComps/quoteResourceStep";
import QuoteBreakdownStep from "./quoteComps/quoteBreakdownStep";
import ProductSummaryStep from "./quoteComps/quoteProductSummaryStep";
import QuoteFinalReviewStep from "./quoteComps/quoteFinalReviewStep";
import ToastUtils from "../../utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";

const AdminMultiQuote = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    // Step 1
    subject: "",
    email: "",
    emails: "",
    notes: "",
    bill_to_name: "",
    // Total discount fields
    apply_total_discount: false,
    total_discount_type: "percent",
    total_discount_value: "",
    total_discount_label: "",
    // Lead tracking fields
    create_lead: false,
    lead_first_name: "",
    lead_last_name: "",
    lead_email: "",
    lead_phone: "",
    lead_company: "",
    lead_country: "",
    // Step 2 (form part)
    region: "",
    compute_instance_id: null,
    os_image_id: null,
    months: 1,
    number_of_instances: 1,
    volume_type_id: null,
    storage_size_gb: "",
    bandwidth_id: null,
    bandwidth_count: 0,
    floating_ip_id: null,
    floating_ip_count: 0,
  });

  const [pricingRequests, setPricingRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiResponse, setApiResponse] = useState(null);
  
  // Assignment system (Admin only)
  const [assignType, setAssignType] = useState(''); // '', 'tenant', 'user'
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Hooks
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { mutate: createMultiQuotes, isPending: isSubmissionPending } =
    useCreateMultiQuotes();
    
  // Admin lists for assignment (tenants and users)
  const { data: adminClients = [] } = useFetchClients(); // Direct admin clients
  const { data: tenantClients = [] } = useSharedClients(selectedTenantId, { enabled: !!selectedTenantId }); // Tenant clients

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(formData.region, "compute_instance", {
      enabled: !!formData.region,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(formData.region, "os_image", {
      enabled: !!formData.region,
    });
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchProductPricing(formData.region, "volume_type", {
      enabled: !!formData.region,
    });
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchProductPricing(formData.region, "bandwidth", {
      enabled: !!formData.region,
    });
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchProductPricing(formData.region, "ip", {
      enabled: !!formData.region,
    });
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchProductPricing(formData.region, "cross_connect", {
      enabled: !!formData.region,
    });

  const steps = ["Quote Info", "Add Items", "Product Summary", "Final Review", "Confirmation"];
  const stepDescriptions = [
    "Capture who the quote is for and define billing context.",
    "Add compute, storage, and optional services for the quote.",
    "Review the items selected and adjust quantities as needed.",
    "Confirm delivery settings, discounts, and lead capture options.",
    "Share, download, or continue collaborating on this quote.",
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const stepDescription = stepDescriptions[currentStep] || stepDescriptions[0];

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSelectChange = (field, value) => {
    updateFormData(field, value);
  };

  const validateStep = (step = currentStep) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.subject) newErrors.subject = "Subject is required.";
      if (!formData.email) newErrors.email = "Primary email is required.";
      if (!formData.bill_to_name)
        newErrors.bill_to_name = "Bill to name is required.";
    } else if (step === 1) {
      if (pricingRequests.length === 0) {
        newErrors.general = "Please add at least one item to the quote.";
      }
    } else if (step === 3) { // Final review step
      if (formData.create_lead) {
        if (!formData.lead_first_name) {
          newErrors.lead_first_name = "First name is required for lead creation.";
        }
        if (!formData.lead_last_name) {
          newErrors.lead_last_name = "Last name is required for lead creation.";
        }
        if (!formData.lead_email) {
          newErrors.lead_email = "Email is required for lead creation.";
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateItem = () => {
    const newErrors = {};
    if (!formData.region) newErrors.region = "Region is required.";
    if (!formData.compute_instance_id)
      newErrors.compute_instance_id = "Compute instance is required.";
    if (!formData.os_image_id) newErrors.os_image_id = "OS image is required.";
    if (!formData.months || formData.months < 1)
      newErrors.months = "Term must be at least 1 month.";
    if (!formData.number_of_instances || formData.number_of_instances < 1)
      newErrors.number_of_instances = "At least 1 instance is required.";
    if (!formData.volume_type_id)
      newErrors.volume_type_id = "Volume type is required.";
    if (!formData.storage_size_gb || formData.storage_size_gb < 1)
      newErrors.storage_size_gb = "Storage size must be at least 1 GB.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addPricingRequest = () => {
    if (validateItem()) {
      const computeName =
        computerInstances?.find(
          (c) =>
            c.product.productable_id === parseInt(formData.compute_instance_id)
        )?.product.name || "N/A";
      const osName =
        osImages?.find(
          (o) => o.product.productable_id === parseInt(formData.os_image_id)
        )?.product.name || "N/A";

      const newRequest = {
        region: formData.region,
        compute_instance_id: parseInt(formData.compute_instance_id),
        os_image_id: parseInt(formData.os_image_id),
        months: parseInt(formData.months),
        number_of_instances: parseInt(formData.number_of_instances),
        volume_types: [
          {
            volume_type_id: parseInt(formData.volume_type_id),
            storage_size_gb: parseInt(formData.storage_size_gb),
          },
        ],
        // ... other fields
        _display: {
          compute: computeName,
          os: osName,
          storage: `${formData.storage_size_gb} GB`,
        },
      };
      setPricingRequests([...pricingRequests, newRequest]);
      // Reset form fields for the next item
      setFormData((prev) => ({
        ...prev,
        region: "",
        compute_instance_id: null,
        os_image_id: null,
        months: 1,
        number_of_instances: 1,
        volume_type_id: null,
        storage_size_gb: "",
      }));
      setErrors({});
      ToastUtils.success("Item added to quote.");
    }
  };

  const removePricingRequest = (index) => {
    setPricingRequests(pricingRequests.filter((_, i) => i !== index));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && validateStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(3)) {
      ToastUtils.error("Please complete all required fields in all steps.");
      return;
    }

    const payload = {
      subject: formData.subject,
      email: formData.email,
      emails: formData.emails.trim()
        ? formData.emails
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [],
      notes: formData.notes,
      bill_to_name: formData.bill_to_name,
      pricing_requests: pricingRequests.map((req) => {
        const { _display, ...rest } = req;
        return rest;
      }),
    };
    
    // Add assignment data based on assignment type
    if (assignType === 'tenant' && selectedTenantId) {
      payload.tenant_id = selectedTenantId;
    } else if (assignType === 'user' && selectedUserId) {
      payload.client_id = selectedUserId;
      // If user is under a tenant, include tenant_id as well
      if (selectedTenantId) {
        payload.tenant_id = selectedTenantId;
      }
    }

    // Add total discount if applied
    if (formData.apply_total_discount && formData.total_discount_value) {
      payload.total_discount = {
        type: formData.total_discount_type,
        value: parseFloat(formData.total_discount_value),
        label: formData.total_discount_label || null,
      };
    }

    // Add lead creation flag and info (we'll add this in step 4)
    if (formData.create_lead) {
      payload.create_lead = true;
      payload.lead_info = {
        first_name: formData.lead_first_name || '',
        last_name: formData.lead_last_name || '',
        email: formData.lead_email || formData.email,
        phone: formData.lead_phone || null,
        company: formData.lead_company || null,
        country: formData.lead_country || null,
      };
    }

    createMultiQuotes(payload, {
      onSuccess: (res) => {
        ToastUtils.success("Multi-quote created successfully!");
        setApiResponse(res);
        setCurrentStep((prev) => prev + 1); // Move to confirmation step
      },
      onError: (err) => {
        ToastUtils.error(
          err.message || "Failed to create quote. Please try again."
        );
      },
    });
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const selectedTenant = tenants?.find(
    (tenant) => String(tenant.id) === String(selectedTenantId)
  );
  const userPool = selectedTenantId ? tenantClients : adminClients;
  const selectedUser = userPool?.find(
    (user) => String(user.id) === String(selectedUserId)
  );
  const assignmentDetails = {
    assignType,
    tenant: selectedTenant,
    user: selectedUser,
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuoteInfoStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
          />
        );
      case 1:
        return (
          <QuoteResourceStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            regions={regions}
            isRegionsFetching={isRegionsFetching}
            computerInstances={computerInstances}
            isComputerInstancesFetching={isComputerInstancesFetching}
            ebsVolumes={ebsVolumes}
            isEbsVolumesFetching={isEbsVolumesFetching}
            osImages={osImages}
            isOsImagesFetching={isOsImagesFetching}
            bandwidths={bandwidths}
            isBandwidthsFetching={isBandwidthsFetching}
            floatingIps={floatingIps}
            isFloatingIpsFetching={isFloatingIpsFetching}
            crossConnects={crossConnects}
            isCrossConnectsFetching={isCrossConnectsFetching}
            onAddRequest={addPricingRequest}
            pricingRequests={pricingRequests}
            onRemoveRequest={removePricingRequest}
          />
        );
      case 2:
        return (
          <ProductSummaryStep
            pricingRequests={pricingRequests}
            formData={formData}
          />
        );
      case 3:
        return (
          <QuoteFinalReviewStep
            formData={formData}
            pricingRequests={pricingRequests}
            tenants={tenants}
            assignmentDetails={assignmentDetails}
            updateFormData={updateFormData}
            errors={errors}
          />
        );
      case 4:
        return <QuoteBreakdownStep apiResponse={apiResponse} />;
      default:
        return null;
    }
  };

  const activeStepLabel = steps[currentStep] || steps[0];
  const headerMeta = (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
      <StatusPill
        label={`Step ${currentStep + 1} of ${steps.length}`}
        tone={currentStep + 1 === steps.length ? "success" : "info"}
      />
      <span>{activeStepLabel}</span>
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>
        {pricingRequests.length} item{pricingRequests.length === 1 ? "" : "s"}
      </span>
      {formData.apply_total_discount && formData.total_discount_value && (
        <>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span>
            Discount {formData.total_discount_value}
            {formData.total_discount_type === "percent" ? "%" : ""}
          </span>
        </>
      )}
      {formData.subject && (
        <>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="truncate max-w-xs">{formData.subject}</span>
        </>
      )}
    </div>
  );

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => navigate("/admin-dashboard/quote")}
      >
        Close
      </ModernButton>
    </div>
  );

  const quoteMetadata = [
    formData.subject && { label: "Subject", value: formData.subject },
    formData.bill_to_name && { label: "Bill To", value: formData.bill_to_name },
    formData.email && { label: "Primary Email", value: formData.email },
    formData.emails && { label: "CC", value: formData.emails },
  ].filter(Boolean);

  const assignmentMetadata = [
    assignType
      ? {
          label: "Assignment Type",
          value: assignType.charAt(0).toUpperCase() + assignType.slice(1),
        }
      : null,
    assignType !== "" && selectedTenant
      ? {
          label: "Tenant",
          value:
            selectedTenant.name ||
            selectedTenant.company_name ||
            selectedTenant.id,
        }
      : null,
    assignType === "user" && selectedUser
      ? {
          label: "User",
          value:
            selectedUser.business_name ||
            `${selectedUser.first_name || ""} ${
              selectedUser.last_name || ""
            }`.trim() ||
            selectedUser.email ||
            selectedUser.id,
        }
      : null,
  ].filter(Boolean);
  const hasAssignmentData = assignmentMetadata.length > 0;
  const assignmentStatus =
    assignType === ""
      ? null
      : assignType === "tenant" && !selectedTenant
      ? { label: "Select tenant", tone: "warning" }
      : assignType === "user" && !selectedUser
      ? { label: "Select user", tone: "warning" }
      : { label: "Configured", tone: "success" };

  const totalInstancesSelected = pricingRequests.reduce(
    (sum, item) => sum + (item.number_of_instances || 0),
    0
  );
  const uniqueRegions = Array.from(
    new Set(pricingRequests.map((item) => item.region).filter(Boolean))
  );

  const itemsMetadata = [
    { label: "Total Items", value: pricingRequests.length || "0" },
    totalInstancesSelected
      ? { label: "Instances", value: totalInstancesSelected.toString() }
      : null,
    uniqueRegions.length
      ? { label: "Regions", value: uniqueRegions.join(", ") }
      : null,
  ].filter(Boolean);
  const hasQuoteItems = pricingRequests.length > 0;

  const discountMetadata = formData.apply_total_discount && formData.total_discount_value
    ? [
        {
          label: "Discount",
          value:
            formData.total_discount_type === "percent"
              ? `${formData.total_discount_value}%`
              : `$${formData.total_discount_value}`,
        },
        formData.total_discount_label
          ? { label: "Label", value: formData.total_discount_label }
          : null,
      ].filter(Boolean)
    : [];

  const summaryCards = [
    quoteMetadata.length
      ? {
          key: "quote-metadata",
          title: "Quote Snapshot",
          subtitle: "Primary context",
          metadata: quoteMetadata,
        }
      : null,
    hasAssignmentData
      ? {
          key: "assignment",
          title: "Assignment",
          subtitle: "Delivery owner",
          metadata: assignmentMetadata,
          statuses: assignmentStatus ? [assignmentStatus] : undefined,
        }
      : null,
    hasQuoteItems
      ? {
          key: "items",
          title: "Quote Items",
          subtitle: "Resources captured",
          metadata: itemsMetadata,
          statuses: [
            {
              label: "In Progress",
              tone: "info",
            },
          ],
        }
      : null,
    discountMetadata.length
      ? {
          key: "discount",
          title: "Discount",
          subtitle: "Order adjustments",
          metadata: discountMetadata,
          statuses: [
            { label: "Applied", tone: "info" },
          ],
        }
      : null,
  ].filter(Boolean);

  const stepCtas = [
    "Continue to Items",
    "Continue to Product Summary",
    "Continue to Final Review",
    "Submit Quote",
    "Finish",
  ];
  const isReviewStep = currentStep === steps.length - 2;
  const isFinalStep = currentStep === steps.length - 1;
  const primaryActionLabel = stepCtas[currentStep] || "Continue";

  const handlePrimaryAction = () => {
    if (isReviewStep) {
      handleSubmit();
    } else if (isFinalStep) {
      navigate("/admin-dashboard/quote");
    } else {
      handleNext();
    }
  };

  const disablePrimary =
    isSubmissionPending ||
    (currentStep === 1 && pricingRequests.length === 0) ||
    (isReviewStep && pricingRequests.length === 0);

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title="Create Multi-Quote"
        description="Build complex product quotes, assign them to tenants or users, and generate pricing breakdowns."
        subHeaderContent={headerMeta}
        actions={headerActions}
        contentClassName="space-y-6 2xl:space-y-8"
      >
        <ModernCard
          padding="lg"
          className="overflow-hidden border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-50 shadow-sm"
        >
          <div className="flex flex-col gap-6 2xl:flex-row 2xl:items-center 2xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={`Step ${currentStep + 1} of ${steps.length}`}
                  tone={currentStep + 1 === steps.length ? "success" : "info"}
                />
                <span className="text-sm font-medium text-primary-700">
                  {steps[currentStep]}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-primary-900">
                {activeStepLabel}
              </h2>
              <p className="text-sm text-primary-700 max-w-2xl">
                {stepDescription}
              </p>
            </div>
            <div className="w-full max-w-xl rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>
          </div>
        </ModernCard>

        {summaryCards.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map((card) => (
              <ModernCard key={card.key} padding="lg" className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {card.subtitle}
                    </p>
                    <h3 className="text-base font-semibold text-slate-900">
                      {card.title}
                    </h3>
                  </div>
                  {card.statuses?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {card.statuses.map((status, idx) => (
                        <StatusPill
                          key={`${card.key}-status-${idx}`}
                          label={status.label}
                          tone={status.tone}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
                <dl className="space-y-2 text-sm">
                  {card.metadata?.map((meta) => (
                    <div
                      key={`${card.key}-${meta.label}`}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <dt className="text-slate-500">{meta.label}</dt>
                      <dd className="font-semibold text-slate-900">{meta.value}</dd>
                    </div>
                  ))}
                </dl>
              </ModernCard>
            ))}
          </div>
        )}

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] 2xl:items-start">
          <div className="space-y-6">
            <ModernCard padding="lg" className="space-y-6">
              {renderStep()}
            </ModernCard>

            <ModernCard
              padding="lg"
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm text-slate-600">
                {isFinalStep
                  ? "Quote is ready. Close to return to the quotes dashboard."
                  : "Continue to the next step or go back to make adjustments."}
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                {currentStep > 0 && currentStep < steps.length && (
                  <ModernButton
                    variant="ghost"
                    onClick={handleBack}
                    isDisabled={isSubmissionPending}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" /> Back
                  </ModernButton>
                )}
                <ModernButton
                  variant="primary"
                  onClick={handlePrimaryAction}
                  isDisabled={disablePrimary}
                  isLoading={isSubmissionPending}
                >
                  {primaryActionLabel}
                </ModernButton>
              </div>
            </ModernCard>
          </div>

          <div className="space-y-6 2xl:sticky 2xl:top-24">
            <ModernCard padding="lg" className="space-y-5">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-900">Assignment</h3>
                <p className="text-xs text-slate-500">
                  Attach this quote to a tenant or client for easier follow-up.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { value: "", label: "None" },
                  { value: "tenant", label: "Tenant" },
                  { value: "user", label: "User" },
                ].map((option) => (
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
                      {assignType ? "Select tenant" : "Choose assignment first"}
                    </option>
                    {tenants?.map((tenant) => (
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
                      {assignType === "user" ? "Select user" : "Choose user assignment"}
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
                Current assignment: {" "}
                <span className="font-medium text-slate-700">
                  {assignType === "tenant" && selectedTenant
                    ? selectedTenant.name || selectedTenant.company_name
                    : assignType === "user" && selectedUser
                    ? selectedUser.business_name || selectedUser.email
                    : "Not assigned"}
                </span>
              </div>
            </ModernCard>

            {(formData.subject || formData.notes || formData.emails) && (
              <ModernCard padding="lg" className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Quote overview
                  </h3>
                  <p className="text-xs text-slate-500">
                    Snapshot of recipient and message context that will appear on the quote.
                  </p>
                </div>
                <dl className="space-y-3 text-sm">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Primary contact
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {formData.bill_to_name || "—"}
                    </dd>
                    <dd className="text-xs text-slate-500">
                      {formData.email || "No email provided"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      CC emails
                    </dt>
                    <dd className="mt-1 font-medium text-slate-900">
                      {formData.emails?.trim() || "—"}
                    </dd>
                  </div>
                  {formData.notes?.trim() && (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Notes
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">
                        {formData.notes.trim()}
                      </dd>
                    </div>
                  )}
                </dl>
              </ModernCard>
            )}

            {pricingRequests.length > 0 && (
              <ModernCard padding="lg" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Items queued
                  </h3>
                  <StatusPill
                    label={`${pricingRequests.length} item${pricingRequests.length === 1 ? "" : "s"}`}
                    tone="info"
                  />
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {pricingRequests.map((item, idx) => (
                    <div
                      key={`${item.region}-${idx}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                    >
                      <p className="font-semibold text-slate-900">
                        {item._display?.compute || "Compute"}
                        <span className="text-slate-400"> • </span>
                        {item._display?.os || "OS"}
                      </p>
                      <p className="mt-1">
                        {item.number_of_instances} instance
                        {item.number_of_instances === 1 ? "" : "s"} • {item.months} month
                        {item.months === 1 ? "" : "s"} • Region {item.region}
                      </p>
                      <p className="mt-1 text-slate-500">
                        Storage: {item._display?.storage || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </ModernCard>
            )}
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

export default AdminMultiQuote;
