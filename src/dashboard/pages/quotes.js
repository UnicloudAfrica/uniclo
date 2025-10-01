import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreatehTenantMultiQuotes,
  useFetchTenantCalculatorOptions as useFetchProductPricing,
} from "../../hooks/calculatorOptionHooks";
import { useFetchGeneralRegions, useFetchProfile } from "../../hooks/resource";
import { useFetchClients } from "../../hooks/clientHooks";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import StepProgress from "../components/instancesubcomps/stepProgress";
import QuoteInfoStep from "./quoteComps/quoteInfoStep";
import QuoteResourceStep from "./quoteComps/quoteResourceStep";
import QuoteSummaryStep from "./quoteComps/quoteSummaryStep";
import QuoteBreakdownStep from "./quoteComps/quoteBreakdownStep";
import ToastUtils from "../../utils/toastUtil";

const TenantQuotes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);

  const [formData, setFormData] = useState({
    subject: "",
    email: "",
    client_id: "",
    emails: "",
    notes: "",
    bill_to_name: "",
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
    cross_connect_count: 0,
  });

  const [pricingRequests, setPricingRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [apiResponse, setApiResponse] = useState(null);

  // Hooks
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const { data: regions, isFetching: isRegionsFetching } =
    useFetchGeneralRegions();
  const { mutate: createMultiQuotes, isPending: isSubmissionPending } =
    useCreatehTenantMultiQuotes();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(
      { region: formData.region, productable_type: "compute_instance" },
      { enabled: !!formData.region }
    );
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(
      { region: formData.region, productable_type: "os_image" },
      { enabled: !!formData.region }
    );
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchProductPricing(
      { region: formData.region, productable_type: "volume_type" },
      { enabled: !!formData.region }
    );
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchProductPricing(
      { region: formData.region, productable_type: "bandwidth" },
      { enabled: !!formData.region }
    );
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchProductPricing(
      { region: formData.region, productable_type: "ip" },
      { enabled: !!formData.region }
    );
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchProductPricing(
      { region: formData.region, productable_type: "cross_connect" },
      { enabled: !!formData.region }
    );

  const steps = ["Quote Info", "Add Items", "Summary", "Confirmation"];

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        email: profile.email,
        bill_to_name: `${profile.first_name} ${profile.last_name}`,
      }));
    }
  }, [profile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateStep = (step = currentStep) => {
    const newErrors = {};
    if (step === 0) {
      if (!formData.subject) newErrors.subject = "Subject is required.";
      if (!formData.email) newErrors.email = "Primary email is required.";
      if (!formData.client_id) newErrors.client_id = "Client is required.";
      if (!formData.bill_to_name)
        newErrors.bill_to_name = "Bill to name is required.";
    } else if (step === 1) {
      if (pricingRequests.length === 0) {
        newErrors.general = "Please add at least one item to the quote.";
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
        ...(formData.bandwidth_id && {
          bandwidth_id: parseInt(formData.bandwidth_id),
          bandwidth_count: parseInt(formData.bandwidth_count),
        }),
        ...(formData.floating_ip_id && {
          floating_ip_id: parseInt(formData.floating_ip_id),
          floating_ip_count: parseInt(formData.floating_ip_count),
        }),
        ...(formData.cross_connect_id && {
          cross_connect_id: parseInt(formData.cross_connect_id),
          cross_connect_count: parseInt(formData.cross_connect_count),
        }),
        _display: {
          compute: computeName,
          os: osName,
          storage: `${formData.storage_size_gb} GB`,
        },
      };
      setPricingRequests([...pricingRequests, newRequest]);
      setFormData((prev) => ({
        ...prev,
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
        cross_connect_count: 0,
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
    if (!validateStep(0) || !validateStep(1)) {
      ToastUtils.error("Please complete all required fields in all steps.");
      return;
    }

    const payload = {
      subject: formData.subject,
      client_id: formData.client_id,
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

    createMultiQuotes(payload, {
      onSuccess: (res) => {
        ToastUtils.success("Quote created successfully!");
        setApiResponse(res.data);
        setCurrentStep((prev) => prev + 1);
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
            handleSelectChange={(field, value) => updateFormData(field, value)}
            clients={clients}
            isClientsFetching={isClientsFetching}
          />
        );
      case 1:
        return (
          <QuoteResourceStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={(field, value) => updateFormData(field, value)}
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
          <QuoteSummaryStep
            formData={formData}
            pricingRequests={pricingRequests}
            clients={clients}
          />
        );
      case 3:
        return <QuoteBreakdownStep apiResponse={apiResponse} />;
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
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="text-lg font-semibold text-[#575758]">
              Create a New Quote
            </h2>
            {/* <button
              onClick={() => navigate("/dashboard/quotes")}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
            >
              <X className="w-5 h-5" />
            </button> */}
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
                currentStep === 2
                  ? handleSubmit
                  : currentStep === 3
                  ? () => navigate("/dashboard/quotes")
                  : handleNext
              }
              disabled={isSubmissionPending}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {currentStep === 3
                ? "Finish"
                : currentStep === 2
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

export default TenantQuotes;
