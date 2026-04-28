import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useCreateMultiQuotes } from "@/hooks/adminHooks/calculatorOptionHooks";
import { useFetchRegions } from "@/hooks/adminHooks/regionHooks";
import { useFetchProductPricing } from "@/hooks/resource";
import { useCustomerContext } from "@/hooks/adminHooks/useCustomerContext";
import CustomerContextSelector from "@/shared/components/common/CustomerContextSelector";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import QuoteInfoStep from "./quoteComps/quoteInfoStep";
import QuoteResourceStep from "./quoteComps/quoteResourceStep";
import QuoteBreakdownStep from "./quoteComps/quoteBreakdownStep";
import ProductSummaryStep from "./quoteComps/quoteProductSummaryStep";
import QuoteFinalReviewStep from "./quoteComps/quoteFinalReviewStep";
import type {
  MultiQuoteFormData,
  MultiQuoteFormErrors,
  UpdateFormData,
} from "./quoteComps/quoteTypes";
// import QuoteLivePreview from "./quoteComps/quoteLivePreview"; // Removed
import ToastUtils from "@/utils/toastUtil";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard } from "@/shared/components/ui";
import { ModernButton } from "@/shared/components/ui";
import StatusPill from "@/shared/components/ui/StatusPill";

type MultiQuotePayload = {
  subject: string;
  email: string;
  emails: string[];
  notes: string;
  bill_to_name: string;
  pricing_requests: Array<Record<string, unknown>>;
  object_storage_items: Array<Record<string, unknown>>;
  tenant_id?: string;
  client_id?: string;
  total_discount?: {
    type: string;
    value: number;
    label: string | null;
  };
  create_lead?: true;
  lead_info?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    company: string | null;
    country: string | null;
  };
};

const AdminMultiQuote = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState<MultiQuoteFormData>({
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
    cross_connect_id: null,
    // Silo Storage fields
    object_storage_region: "",
    object_storage_product_id: null,
    object_storage_quantity: 1000, // Default 1TB
    object_storage_months: 1,
  });

  const [pricingRequests, setPricingRequests] = useState<unknown[]>([]);
  const [objectStorageRequests, setObjectStorageRequests] = useState<unknown[]>([]);
  const [errors, setErrors] = useState<MultiQuoteFormErrors>({});
  const [apiResponse, setApiResponse] = useState<Record<string, unknown> | null>(null);

  // Assignment system (Admin only)
  // const [assignType, setAssignType] = useState(''); // '', 'tenant', 'user'
  // const [selectedTenantId, setSelectedTenantId] = useState('');
  // const [selectedUserId, setSelectedUserId] = useState('');

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

  // Hooks
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  // const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants(); // Handled by useCustomerContext
  const { mutate: createMultiQuotes, isPending: isSubmissionPending } = useCreateMultiQuotes();

  // Admin lists for assignment (tenants and users)
  // const { data: adminClients = [] } = useFetchClients(); // Direct admin clients
  // const { data: tenantClients = [] } = useSharedClients(selectedTenantId, { enabled: !!selectedTenantId }); // Tenant clients

  const { data: computerInstancesData, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(formData.region, "compute_instance", {
      enabled: !!formData.region,
    });
  const { data: osImagesData, isFetching: isOsImagesFetching } = useFetchProductPricing(
    formData.region,
    "os_image",
    {
      enabled: !!formData.region,
    }
  );
  const { data: ebsVolumesData, isFetching: isEbsVolumesFetching } = useFetchProductPricing(
    formData.region,
    "volume_type",
    {
      enabled: !!formData.region,
    }
  );
  const { data: bandwidthsData, isFetching: _isBandwidthsFetching } = useFetchProductPricing(
    formData.region,
    "bandwidth",
    {
      enabled: !!formData.region,
    }
  );
  const { data: floatingIpsData, isFetching: _isFloatingIpsFetching } = useFetchProductPricing(
    formData.region,
    "ip",
    {
      enabled: !!formData.region,
    }
  );
  const { data: crossConnectsData, isFetching: isCrossConnectsFetching } = useFetchProductPricing(
    formData.region,
    "cross_connect",
    {
      enabled: !!formData.region,
    }
  );
  const { data: objectStorageProductsData, isFetching: isObjectStorageProductsFetching } =
    useFetchProductPricing(formData.object_storage_region, "object_storage", {
      enabled: !!formData.object_storage_region,
    });

  const regionOptions = Array.isArray(regions) ? regions : [];
  const computerInstances = Array.isArray(computerInstancesData) ? computerInstancesData : [];
  const osImages = Array.isArray(osImagesData) ? osImagesData : [];
  const ebsVolumes = Array.isArray(ebsVolumesData) ? ebsVolumesData : [];
  const bandwidths = Array.isArray(bandwidthsData) ? bandwidthsData : [];
  const floatingIps = Array.isArray(floatingIpsData) ? floatingIpsData : [];
  const crossConnects = Array.isArray(crossConnectsData) ? crossConnectsData : [];
  const objectStorageProducts = Array.isArray(objectStorageProductsData)
    ? objectStorageProductsData
    : [];

  const steps = ["Quote Info", "Add Items", "Product Summary", "Final Review", "Confirmation"];

  useEffect(() => {
    globalThis.window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const toInt = (value: string | number | null | undefined) => {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const updateFormData: UpdateFormData = (
    field: keyof MultiQuoteFormData,
    value: MultiQuoteFormData[keyof MultiQuoteFormData]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };
  const validateStep = (step = currentStep) => {
    const newErrors: MultiQuoteFormErrors = {};
    if (step === 0) {
      if (!formData.subject) newErrors.subject = "Subject is required.";
      if (!formData.email) newErrors.email = "Primary email is required.";
      if (!formData.bill_to_name) newErrors.bill_to_name = "Bill to name is required.";
    } else if (step === 1) {
      if (pricingRequests.length === 0 && objectStorageRequests.length === 0) {
        newErrors.general = "Please add at least one item (compute or Silo Storage) to the quote.";
      }
    } else if (step === 3) {
      // Final review step
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
    const newErrors: MultiQuoteFormErrors = {};
    if (!formData.region) newErrors.region = "Region is required.";
    if (!formData.compute_instance_id)
      newErrors.compute_instance_id = "Compute instance is required.";
    if (!formData.os_image_id) newErrors.os_image_id = "OS image is required.";
    if (!formData.months || formData.months < 1)
      newErrors.months = "Term must be at least 1 month.";
    if (!formData.number_of_instances || formData.number_of_instances < 1)
      newErrors.number_of_instances = "At least 1 instance is required.";
    if (!formData.volume_type_id) newErrors.volume_type_id = "Volume type is required.";
    const storageSize = Number(formData.storage_size_gb);
    if (!formData.storage_size_gb || Number.isNaN(storageSize) || storageSize < 1)
      newErrors.storage_size_gb = "Storage size must be at least 1 GB.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const addPricingRequest = () => {
    if (validateItem()) {
      const computeName =
        computerInstances.find(
          (c: unknown) => c.product.productable_id === toInt(formData.compute_instance_id)
        )?.product.name || "N/A";
      const osName =
        osImages.find((o: unknown) => o.product.productable_id === toInt(formData.os_image_id))?.product
          .name || "N/A";

      const newRequest = {
        region: formData.region,
        compute_instance_id: toInt(formData.compute_instance_id),
        os_image_id: toInt(formData.os_image_id),

        months: toInt(formData.months),
        number_of_instances: toInt(formData.number_of_instances),
        volume_types: [
          {
            volume_type_id: toInt(formData.volume_type_id),
            storage_size_gb: toInt(formData.storage_size_gb),
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
  const validateObjectStorageItem = () => {
    const newErrors: MultiQuoteFormErrors = {};
    if (!formData.object_storage_region) newErrors.object_storage_region = "Region is required.";
    if (!formData.object_storage_product_id)
      newErrors.object_storage_product_id = "Storage tier is required.";
    if (!formData.object_storage_quantity || formData.object_storage_quantity < 1)
      newErrors.object_storage_quantity = "Quantity must be at least 1 GB.";
    if (!formData.object_storage_months || formData.object_storage_months < 1)
      newErrors.object_storage_months = "Term must be at least 1 month.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const addObjectStorageRequest = () => {
    if (validateObjectStorageItem()) {
      const productName =
        objectStorageProducts.find(
          (p: unknown) => p.product.productable_id === toInt(formData.object_storage_product_id)
        )?.product.name || "Silo Storage";

      const newRequest = {
        region: formData.object_storage_region,
        productable_id: toInt(formData.object_storage_product_id),
        quantity: toInt(formData.object_storage_quantity),
        months: toInt(formData.object_storage_months),
        _display: {
          name: productName,
          quantity: `${formData.object_storage_quantity} GB`,
        },
      };
      setObjectStorageRequests([...objectStorageRequests, newRequest]);
      // Reset Silo Storage fields
      setFormData((prev) => ({
        ...prev,
        object_storage_product_id: null,
        object_storage_quantity: 1000,
        object_storage_months: 1,
      }));
      setErrors({});
      ToastUtils.success("Object storage added to quote.");
    }
  };
  const removeObjectStorageRequest = (index: number) => {
    setObjectStorageRequests(objectStorageRequests.filter((_, i) => i !== index));
  };
  const removePricingRequest = (index: number) => {
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

    const payload: MultiQuotePayload = {
      subject: formData.subject,
      email: formData.email,
      emails: formData.emails.trim()
        ? formData.emails
          .split(",")
          .map((e: unknown) => e.trim())
          .filter(Boolean)
        : [],
      notes: formData.notes,
      bill_to_name: formData.bill_to_name,
      pricing_requests: pricingRequests.map((req: unknown) => {
        const { _display, ...rest } = req as Record<string, unknown>;
        return rest;
      }),
      object_storage_items: objectStorageRequests.map((req: unknown) => {
        const { _display, ...rest } = req as Record<string, unknown>;
        return rest;
      }),
    };
    if (contextType === "tenant" && selectedTenantId) {
      payload.tenant_id = selectedTenantId;
    } else if (contextType === "user" && selectedUserId) {
      payload.client_id = selectedUserId;
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

    if (formData.create_lead) {
      payload.create_lead = true;
      payload.lead_info = {
        first_name: formData.lead_first_name || "",
        last_name: formData.lead_last_name || "",
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
        ToastUtils.error(err.message || "Failed to create quote. Please try again.");
      },
    });
  };
  const selectedTenant = tenants?.find(
    (tenant: unknown) => String(tenant.id) === String(selectedTenantId)
  );
  // const userPool = selectedTenantId ? tenantClients : adminClients;
  const selectedUser = userPool?.find((user) => String(user.id) === String(selectedUserId));
  const assignmentDetails = {
    assignType: contextType,
    tenant: selectedTenant,
    user: selectedUser,
  };
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuoteInfoStep formData={formData} errors={errors} updateFormData={updateFormData} />
        );
      case 1:
        return (
          <QuoteResourceStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            regions={regionOptions}
            isRegionsFetching={isRegionsFetching}
            computerInstances={computerInstances}
            isComputerInstancesFetching={isComputerInstancesFetching}
            ebsVolumes={ebsVolumes}
            isEbsVolumesFetching={isEbsVolumesFetching}
            osImages={osImages}
            isOsImagesFetching={isOsImagesFetching}
            bandwidths={bandwidths as unknown[]}
            isBandwidthsFetching={false}
            floatingIps={floatingIps as unknown[]}
            isFloatingIpsFetching={false}
            crossConnects={crossConnects as unknown[]}
            isCrossConnectsFetching={isCrossConnectsFetching}
            onAddRequest={addPricingRequest}
            pricingRequests={pricingRequests}
            onRemoveRequest={removePricingRequest}
            // Silo Storage Props
            objectStorageProducts={objectStorageProducts}
            isObjectStorageProductsFetching={isObjectStorageProductsFetching}
            onAddObjectStorageRequest={addObjectStorageRequest}
            objectStorageRequests={objectStorageRequests}
            onRemoveObjectStorageRequest={removeObjectStorageRequest}
          />
        );
      case 2:
        return (
          <ProductSummaryStep
            pricingRequests={pricingRequests}
            objectStorageRequests={objectStorageRequests as Array<Record<string, unknown>>}
            formData={formData}
          />
        );
      case 3:
        return (
          <QuoteFinalReviewStep
            formData={formData}
            pricingRequests={pricingRequests}
            objectStorageRequests={objectStorageRequests}
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

    // Render the assignment selector in the sidebar or as a step component
    // For now, we'll render it in the sidebar area if on desktop, or above the form
  };
  const renderAssignmentSelector = () => (
    <div className="mb-6">
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
    </div>
  );

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
        {pricingRequests.length + objectStorageRequests.length} item
        {pricingRequests.length + objectStorageRequests.length === 1 ? "" : "s"}
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
        onClick={() => navigate("/admin-dashboard/create-invoice")}
      >
        Close
      </ModernButton>
    </div>
  );

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
      navigate("/admin-dashboard/create-invoice");
    } else {
      handleNext();
    }
  };
  const disablePrimary =
    isSubmissionPending ||
    isSubmissionPending ||
    (currentStep === 1 && pricingRequests.length === 0 && objectStorageRequests.length === 0) ||
    (isReviewStep && pricingRequests.length === 0 && objectStorageRequests.length === 0);

  // if (isAuthLoading) {
  //   return (
  //     <div className="flex h-screen w-full items-center justify-center bg-slate-50">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
  //     </div>
  //   );
  // }

  return (
    <>
      <AdminPageShell
        title="Create Multi-Quote"
        description="Build complex product quotes, assign them to tenants or users, and generate pricing breakdowns."
        actions={headerActions}
        contentClassName="pb-20"
      >
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header Meta */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {headerMeta}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Column: Assignment & Progress */}
            <div className="space-y-6 lg:col-span-1">
              {renderAssignmentSelector()}
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>

            <div className="lg:col-span-2">
              <ModernCard padding="xl">{renderStep()}</ModernCard>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-6">
            {currentStep > 0 ? (
              <ModernButton
                variant="outline"
                onClick={handleBack}
                isDisabled={isSubmissionPending}
                leftIcon={<ChevronLeft className="h-4 w-4" />}
              >
                Back
              </ModernButton>
            ) : (
              <div />
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
        </div>
      </AdminPageShell>
    </>
  );
};
export default AdminMultiQuote;
