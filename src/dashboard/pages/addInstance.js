import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import PaystackPop from "@paystack/inline-js";
import { useQueryClient } from "@tanstack/react-query";
import { useFetchProductPricing, useFetchProfile } from "../../hooks/resource";
import { useFetchProjects } from "../../hooks/projectHooks";
import {
  useInitiateMultiInstanceRequest,
  useFetchInstanceRequests,
} from "../../hooks/instancesHook";
import StepProgress from "../components/instancesubcomps/stepProgress";
import ConfigurationStep from "../components/instancesubcomps/configurationStep";
import ResourceAllocationStep from "../components/instancesubcomps/resourceAllocationStep";
import SummaryStep from "../components/instancesubcomps/summaryStep";
import PaymentStep from "../components/instancesubcomps/paymentStep";
import SuccessModal from "../components/successModalV2";
import { useFetchClients } from "../../hooks/clientHooks";
// import { useFetchKeyPairs } from "../../hooks/keyPairsHook";
import ToastUtils from "../../utils/toastUtil";
import Headbar from "../components/headbar";
import Sidebar from "../components/sidebar";
import ActiveTab from "../components/activeTab";
import { useFetchTenantKeyPairs } from "../../hooks/keyPairsHook";
import { useFetchTenantSubnets } from "../../hooks/subnetHooks";
import { useFetchTenantSecurityGroups } from "../../hooks/securityGroupHooks";

const AddInstancePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const contentRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const {
    mutate: initiateMultiInstanceRequest,
    isPending: isSubmissionPending,
    isSuccess: isSubmissionSuccess,
    isError: isSubmissionError,
    error: submissionError,
  } = useInitiateMultiInstanceRequest();

  const [formData, setFormData] = useState({
    instance_name: "",
    storage_size_gb: "",
    selectedComputeInstance: null,
    selectedEbsVolume: null,
    selectedOsImage: null,
    selectedBandwidth: null,
    bandwidth_count: 0,
    selectedFloatingIp: null,
    floating_ip_count: 0,
    selectedCrossConnect: null,
    cross_connect_count: 0,
    number_of_instances: 1,
    months: "",
    tags: [],
    fast_track: false,
    keypair_name: "",
    selectedProject: null,
    network_id: "",
    subnet_id: "",
    security_group_ids: [],
    user_id: "",
  });

  const selectedRegion = formData.selectedProject?.default_region || "";

  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchProductPricing(selectedRegion, "compute_instance", {
      enabled: !!selectedRegion,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(selectedRegion, "os_image", {
      enabled: !!selectedRegion,
    });
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchProductPricing(selectedRegion, "bandwidth", {
      enabled: !!selectedRegion,
    });
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchProductPricing(selectedRegion, "volume_type", {
      enabled: !!selectedRegion,
    });
  const { data: crossConnects, isFetching: isCrossConnectsFetching } =
    useFetchProductPricing(selectedRegion, "cross_connect", {
      enabled: !!selectedRegion,
    });
  const { data: floatingIps, isFetching: isFloatingIpsFetching } =
    useFetchProductPricing(selectedRegion, "ip", {
      enabled: !!selectedRegion,
    });
  const { data: subnets, isFetching: isSubnetsFetching } =
    useFetchTenantSubnets(
      formData.selectedProject?.identifier,
      selectedRegion,
      { enabled: !!formData.selectedProject?.identifier && !!selectedRegion }
    );
  const { data: securityGroups, isFetching: isSecurityGroupsFetching } =
    useFetchTenantSecurityGroups(
      formData.selectedProject?.identifier,
      selectedRegion,
      {
        enabled: !!formData.selectedProject?.identifier && !!selectedRegion,
      }
    );
  const { data: keyPairs, isFetching: isKeyPairsFetching } =
    useFetchTenantKeyPairs(
      formData.selectedProject?.identifier,
      selectedRegion,
      {
        enabled: !!formData.selectedProject?.identifier && !!selectedRegion,
      }
    );

  const [pricingRequests, setPricingRequests] = useState([]);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [instanceRequestResponse, setInstanceRequestResponse] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;
  const popup = useMemo(() => new PaystackPop(), []);

  const availableTags = [
    "Web Server",
    "Database",
    "Development",
    "Production",
    "Analytics",
    "Testing",
    "Backend",
    "Frontend",
    "Monitoring",
    "Security",
    "CI/CD",
    "Data Processing",
    "Others",
  ];

  const steps = [
    "Configuration Details",
    "Resource Allocation",
    "Summary",
    "Payment",
  ];

  useEffect(() => {
    setGeneralError(null);
  }, [currentStep]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  useEffect(() => {
    if (isSubmissionSuccess && instanceRequestResponse) {
      setCurrentStep(3);
      if (
        !selectedPaymentOption &&
        instanceRequestResponse.payment_gateway_options?.length > 0
      ) {
        const paystackOption =
          instanceRequestResponse.payment_gateway_options.find(
            (option) =>
              option.name.toLowerCase() === "paystack" &&
              option.payment_type.toLowerCase() === "card"
          );
        setSelectedPaymentOption(
          paystackOption || instanceRequestResponse.payment_gateway_options[0]
        );
      }
    }
  }, [isSubmissionSuccess, instanceRequestResponse, selectedPaymentOption]);

  const validateStep = (step = currentStep, action = "next") => {
    const newErrors = {};
    if (step === 0) {
      if (formData.tags.length === 0)
        newErrors.tags = "At least one tag must be selected";
    } else if (step === 1) {
      const isSubmittingStep = pricingRequests.length === 0;
      if (isSubmittingStep || action === "add") {
        if (!formData.instance_name.trim())
          newErrors.instance_name = "Instance Name is required.";
        if (!formData.selectedProject)
          newErrors.selectedProject = "A project must be selected.";
        if (!formData.storage_size_gb)
          newErrors.storage_size_gb = "Storage Size is required";
        else if (
          isNaN(formData.storage_size_gb) ||
          parseInt(formData.storage_size_gb, 10) < 1
        )
          newErrors.storage_size_gb =
            "Must be a positive integer of at least 1 GiB";
        if (!formData.selectedComputeInstance)
          newErrors.selectedComputeInstance = "Compute Instance is required";
        if (!formData.selectedEbsVolume)
          newErrors.selectedEbsVolume = "EBS Volume is required";
        if (!formData.selectedOsImage)
          newErrors.selectedOsImage = "OS Image is required";
        if (!formData.keypair_name)
          newErrors.keypair_name = "Key Pair is required";
        if (!formData.months) newErrors.months = "Term (Months) is required";
        else if (isNaN(formData.months) || parseInt(formData.months) < 1)
          newErrors.months = "Term (Months) must be an integer and at least 1";
      }
    } else if (step === 2) {
      if (pricingRequests.length === 0) {
        newErrors.general = "There are no instance configurations to submit.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [
        "bandwidth_id",
        "number_of_instances",
        "storage_size_gb",
        "months",
        "floating_ip_count",
      ].includes(field)
        ? value
          ? parseInt(value)
          : ""
        : value,
    }));
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null);
  };

  const handleSelectChange = (field, value, optionsList) => {
    if (["network_id", "subnet_id", "keypair_name"].includes(field)) {
      updateFormData(field, value);
      return;
    }

    if (!value) {
      updateFormData(field, null);
      return;
    }
    const selectedOption = optionsList?.find((option) =>
      option.product
        ? String(option.product.id) === String(value)
        : String(option.id) === String(value)
    );
    updateFormData(field, selectedOption || null);
  };

  const handlePaymentOptionChange = (e) => {
    const selectedId = e.target.value;
    const option = instanceRequestResponse?.payment_gateway_options?.find(
      (opt) => String(opt.id) === String(selectedId)
    );
    setSelectedPaymentOption(option);
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      if (field === "security_group_ids") {
        const currentValues = prev.security_group_ids || [];
        if (currentValues.includes(value)) {
          return {
            ...prev,
            security_group_ids: currentValues.filter((v) => v !== value),
          };
        }
        return { ...prev, security_group_ids: [...currentValues, value] };
      }

      const currentValues = prev[field];
      return {
        ...prev,
        [field]: currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value],
      };
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null);
  };

  const handleNext = () => {
    if (currentStep === 1 && pricingRequests.length === 0) {
      addPricingRequest();
      ToastUtils.info("Configuration added. Click Next again to proceed.");
      return;
    }

    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        if (currentStep === 2) {
          handleSubmit();
        } else {
          setCurrentStep(currentStep + 1);
        }
      } else {
        if (
          selectedPaymentOption?.name.toLowerCase() === "paystack" &&
          selectedPaymentOption?.payment_type.toLowerCase() === "card"
        ) {
          handlePaystackPayment();
        } else if (
          selectedPaymentOption?.payment_type.toLowerCase() === "bank transfer"
        ) {
          setIsSuccessModalOpen(true);
        } else {
          console.log(
            `Payment method "${selectedPaymentOption?.name} (${selectedPaymentOption?.payment_type})" selected. Further implementation needed for non-card payments.`
          );
          handleClose();
        }
      }
    } else {
      ToastUtils.error("Please check the errors in your form.");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setGeneralError(null);
      setInstanceRequestResponse(null);
      setIsPaying(false);
      setSelectedPaymentOption(null);
    }
  };

  const addPricingRequest = () => {
    if (validateStep(1, "add")) {
      const newRequest = {
        name: formData.instance_name,
        project_id: formData.selectedProject.id,
        region: formData.selectedProject.default_region,
        os_image_id: formData.selectedOsImage.product.productable_id,
        compute_instance_id:
          formData.selectedComputeInstance.product.productable_id,
        months: parseInt(formData.months),
        number_of_instances: parseInt(formData.number_of_instances),
        volume_types: [
          {
            volume_type_id: formData.selectedEbsVolume.product.productable_id,
            storage_size_gb: parseInt(formData.storage_size_gb),
          },
        ],
        keypair_name: formData.keypair_name,
        ...(formData.network_id && { network_id: formData.network_id }),
        ...(formData.subnet_id && { subnet_id: formData.subnet_id }),
        ...(formData.security_group_ids.length > 0 && {
          security_group_ids: formData.security_group_ids,
        }),
        ...(formData.selectedBandwidth && {
          bandwidth_id: formData.selectedBandwidth.product.productable_id,
          bandwidth_count: parseInt(formData.bandwidth_count),
        }),
        ...(formData.selectedFloatingIp && {
          floating_ip_id: formData.selectedFloatingIp.product.productable_id,
          floating_ip_count: parseInt(formData.floating_ip_count),
        }),
        // Add cross connect similarly if needed
        _display: {
          compute: formData.selectedComputeInstance.product.productable_name,
          name: formData.instance_name,
          project: formData.selectedProject.name,
          os: formData.selectedOsImage.product.productable_name,
          storage: `${formData.storage_size_gb} GiB`,
        },
      };
      setPricingRequests([...pricingRequests, newRequest]);
      setFormData((prev) => ({
        ...prev,
        instance_name: "",
        number_of_instances: 1,
        storage_size_gb: "",
        selectedComputeInstance: null,
        selectedEbsVolume: null,
        selectedOsImage: null,
        selectedBandwidth: null,
        bandwidth_count: 0,
        selectedFloatingIp: null,
        floating_ip_count: 0,
        network_id: "",
        subnet_id: "",
        security_group_ids: [],
        keypair_name: "",
        months: "",
      }));
      setErrors({});
      ToastUtils.success("Instance configuration added to the list.");
    }
  };

  const removePricingRequest = (index) => {
    setPricingRequests(pricingRequests.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (pricingRequests.length === 0) {
      ToastUtils.error(
        "Please add at least one instance configuration before submitting."
      );
      return;
    }
    if (validateStep(2)) {
      const dataToSubmit = {
        pricing_requests: pricingRequests.map((req) => {
          const { _display, ...rest } = req;
          return rest;
        }),
        tags: formData.tags,
        fast_track: formData.fast_track,
      };

      initiateMultiInstanceRequest(dataToSubmit, {
        onSuccess: (response) => {
          setInstanceRequestResponse(response);
        },
        onError: (err) => {
          console.error("Error creating instance request:", err);
          setGeneralError(
            err.message ||
              "Failed to create instance request. Please try again."
          );
        },
      });
    }
  };

  const handlePaystackPayment = () => {
    if (!paystackKey) {
      ToastUtils.warning(
        "Payment gateway not configured. Please contact support."
      );
      setIsPaying(false);
      return;
    }
    if (!profile?.email) {
      setIsPaying(false);
      return;
    }
    const amountForPaystack =
      selectedPaymentOption?.total || instanceRequestResponse?.data?.amount;
    if (
      amountForPaystack === undefined ||
      amountForPaystack === null ||
      !instanceRequestResponse?.identifier
    ) {
      ToastUtils.warning(
        "Missing transaction details. Cannot proceed with payment."
      );
      setIsPaying(false);
      return;
    }
    setIsPaying(true);
    popup.newTransaction({
      key: paystackKey,
      email: profile.email,
      amount: amountForPaystack * 100,
      reference: instanceRequestResponse.identifier,
      channels: ["card"],
      onSuccess: (transaction) => {
        setIsPaying(false);
        setIsSuccessModalOpen(true);
      },
      onCancel: () => {
        setIsPaying(false);
      },
      onError: (error) => {
        console.error("Paystack Payment Error:", error);
        setIsPaying(false);
      },
    });
  };

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    handleClose();
  };

  const handleClose = () => {
    queryClient.invalidateQueries({ queryKey: ["instanceRequests"] });
    navigate("/dashboard/instances");
  };

  const isAnyFetching =
    isComputerInstancesFetching ||
    isOsImagesFetching ||
    isBandwidthsFetching ||
    isEbsVolumesFetching ||
    isProjectsFetching ||
    isClientsFetching ||
    isCrossConnectsFetching ||
    isFloatingIpsFetching ||
    isSubnetsFetching ||
    isKeyPairsFetching;

  const isPaymentButtonDisabled =
    isPaying ||
    isProfileFetching ||
    !profile?.email ||
    !instanceRequestResponse ||
    !selectedPaymentOption;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ConfigurationStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleCheckboxChange={handleCheckboxChange}
            handleSelectChange={handleSelectChange}
            availableTags={availableTags}
          />
        );
      case 1:
        return (
          <ResourceAllocationStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={handleSelectChange}
            isSubmissionPending={isSubmissionPending}
            handleCheckboxChange={handleCheckboxChange}
            computerInstances={computerInstances}
            isComputerInstancesFetching={isComputerInstancesFetching}
            ebsVolumes={ebsVolumes}
            isEbsVolumesFetching={isEbsVolumesFetching}
            bandwidths={bandwidths}
            isBandwidthsFetching={isBandwidthsFetching}
            osImages={osImages}
            isOsImagesFetching={isOsImagesFetching}
            floatingIps={floatingIps}
            isFloatingIpsFetching={isFloatingIpsFetching}
            crossConnects={crossConnects}
            isCrossConnectsFetching={isCrossConnectsFetching}
            subnets={subnets}
            isSubnetsFetching={isSubnetsFetching}
            securityGroups={securityGroups}
            projects={projects}
            isProjectsFetching={isProjectsFetching}
            keyPairs={keyPairs}
            isKeyPairsFetching={isKeyPairsFetching}
            onAddRequest={addPricingRequest}
            pricingRequests={pricingRequests}
            onRemoveRequest={removePricingRequest}
          />
        );
      case 2:
        return (
          <SummaryStep formData={formData} pricingRequests={pricingRequests} />
        );
      case 3:
        return (
          <PaymentStep
            isSubmissionPending={isSubmissionPending}
            isSubmissionError={isSubmissionError}
            generalError={generalError}
            instanceRequestResponse={instanceRequestResponse}
            selectedPaymentOption={selectedPaymentOption}
            handlePaymentOptionChange={handlePaymentOptionChange}
            isPaying={isPaying}
            isProfileFetching={isProfileFetching}
            saveCard={saveCard}
            setSaveCard={setSaveCard}
            amountToPayFromGateway={selectedPaymentOption?.total}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Headbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <ActiveTab />
      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center pb-4 border-b">
            <h2 className="text-lg font-semibold text-[#575758]">
              Add New Instance
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
              disabled={isSubmissionPending || isPaying}
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
            {isSubmissionError && currentStep !== 3 && (
              <p className="text-red-500 text-sm mt-4 text-center">
                {generalError}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isSubmissionPending || isPaying}
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
                  ? handleClose
                  : handleNext
              }
              disabled={
                isSubmissionPending ||
                (isAnyFetching && currentStep !== 0) ||
                (currentStep === 3 && isPaymentButtonDisabled)
              }
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {currentStep === 3
                ? "Finish"
                : currentStep === 2
                ? "Submit Request"
                : "Next"}
              {(isSubmissionPending ||
                (isAnyFetching && currentStep !== 0) ||
                isPaying) && (
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              )}
            </button>
          </div>
        </div>
      </main>
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        transactionReference={instanceRequestResponse?.identifier}
        saveCard={saveCard}
        closeEv={handleClose}
      />
    </>
  );
};

export default AddInstancePage;
