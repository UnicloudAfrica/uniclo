import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateMultiQuotes,
  useFetchCalculatorOptions,
} from "../../hooks/adminHooks/calculatorOptionHooks";
import { useFetchRegions } from "../../hooks/adminHooks/regionHooks";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchProductPricing } from "../../hooks/resource";
import AdminSidebar from "../components/adminSidebar";
import AdminHeadbar from "../components/adminHeadbar";
import AdminActiveTab from "../components/adminActiveTab";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import QuoteInfoStep from "./quoteComps/quoteInfoStep";
import QuoteResourceStep from "./quoteComps/quoteResourceStep";
import QuoteSummaryStep from "./quoteComps/quoteSummaryStep";
import QuoteBreakdownStep from "./quoteComps/quoteBreakdownStep";
import ProductSummaryStep from "./quoteComps/quoteProductSummaryStep";
import QuoteFinalReviewStep from "./quoteComps/quoteFinalReviewStep";
import ToastUtils from "../../utils/toastUtil";

const AdminMultiQuote = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  const [formData, setFormData] = useState({
    // Step 1
    tenant_id: "",
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

  // Hooks
  const { data: regions, isFetching: isRegionsFetching } = useFetchRegions();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { mutate: createMultiQuotes, isPending: isSubmissionPending } =
    useCreateMultiQuotes();

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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

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
      if (!formData.tenant_id) newErrors.tenant_id = "Tenant is required.";
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
      tenant_id: formData.tenant_id,
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <QuoteInfoStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={handleSelectChange}
            tenants={tenants}
            isTenantsFetching={isTenantsFetching}
          />
        );
      case 1:
        return (
          <QuoteResourceStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={handleSelectChange}
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
            <h2 className="text-lg font-semibold text-[#575758]">
              Create Multi-Quote
            </h2>
            <button
              onClick={() => navigate("/admin-dashboard/quote")}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isSubmissionPending}
                >
                  <ChevronLeft className="w-4 h-4 mr-1 inline-block" /> Back
                </button>
              )}
            </div>
            <button
              onClick={
                currentStep === 3
                  ? handleSubmit
                  : currentStep === 4
                  ? () => navigate("/admin-dashboard/quote")
                  : handleNext
              }
              disabled={isSubmissionPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {currentStep === 4
                ? "Finish"
                : currentStep === 3
                ? "Submit Quote"
                : "Next"}
              {isSubmissionPending && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminMultiQuote;
