import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import PaystackPop from "@paystack/inline-js";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
  useFetchProfile,
} from "../../hooks/resource";
import { useFetchProjects } from "../../hooks/projectHooks";
import { useCreateInstanceRequest } from "../../hooks/instancesHook";
import StepProgress from "./instancesubcomps/stepProgress";
import ConfigurationStep from "./instancesubcomps/configurationStep";
import ResourceAllocationStep from "./instancesubcomps/resourceAllocationStep";
import SummaryStep from "./instancesubcomps/summaryStep";
import PaymentStep from "./instancesubcomps/paymentStep";
import SuccessModal from "./successModalV2";
import { useFetchClients } from "../../hooks/clientHooks";

const AddInstanceModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();
  const { data: profile, isFetching: isProfileFetching } = useFetchProfile();

  const { data: clients, isFetching: isClientsFetching } = useFetchClients();
  const {
    mutate: createInstanceRequest,
    isPending: isSubmissionPending,
    isSuccess: isSubmissionSuccess,
    isError: isSubmissionError,
    error: submissionError,
  } = useCreateInstanceRequest();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedProject: null,
    user_id: "", // New field for selected client ID
    storage_size_gb: "",
    selectedComputeInstance: null,
    selectedEbsVolume: null,
    selectedOsImage: null,
    bandwidth_id: null,
    number_of_instances: null,
    months: "",
    tags: [],
  });
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
  }, [currentStep, isOpen]);

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

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      if (!formData.name.trim()) newErrors.name = "Instance Name is required";
      if (!formData.selectedProject)
        newErrors.selectedProject = "Project is required";
      if (!formData.user_id)
        // Validate user_id
        newErrors.user_id = "Client is required";
      if (formData.tags.length === 0)
        newErrors.tags = "At least one tag must be selected";
    } else if (currentStep === 1) {
      if (!formData.storage_size_gb)
        newErrors.storage_size_gb = "Storage Size is required";
      else if (
        isNaN(formData.storage_size_gb) ||
        parseInt(formData.storage_size_gb) < 30
      )
        newErrors.storage_size_gb =
          "Storage Size must be an integer and at least 30 GiB";
      if (!formData.number_of_instances)
        newErrors.number_of_instances = "Number of instances is required";
      else if (isNaN(formData.number_of_instances))
        newErrors.number_of_instances =
          "Number of instances must be an integer";
      if (!formData.selectedComputeInstance)
        newErrors.selectedComputeInstance = "Compute Instance is required";
      if (!formData.selectedEbsVolume)
        newErrors.selectedEbsVolume = "EBS Volume is required";
      if (!formData.selectedOsImage)
        newErrors.selectedOsImage = "OS Image is required";
      if (!formData.bandwidth_id)
        newErrors.bandwidth_id = "Bandwidth is required";
      if (!formData.months) newErrors.months = "Term (Months) is required";
      else if (isNaN(formData.months) || parseInt(formData.months) < 1)
        newErrors.months = "Term (Months) must be an integer and at least 1";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newValue =
        field === "bandwidth_id" && value ? parseInt(value) : value;
      return { ...prev, [field]: newValue };
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null);
  };

  const handleSelectChange = (field, value, optionsList) => {
    if (!value) {
      updateFormData(field, null);
      return;
    }
    const selectedOption = optionsList?.find(
      (option) => String(option.id) === String(value)
    );
    if (selectedOption) {
      updateFormData(field, selectedOption);
    } else {
      console.warn(
        `Selected ID ${value} not found in options for field ${field}.`
      );
      updateFormData(field, null);
    }
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
      const currentValues = prev[field];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter((v) => v !== value) };
      }
      return { ...prev, [field]: [...currentValues, value] };
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null);
  };

  const handleNext = () => {
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
          onClose();
        } else {
          console.log(
            `Payment method "${selectedPaymentOption?.name} (${selectedPaymentOption?.payment_type})" selected. Further implementation needed for non-card payments.`
          );
          onClose();
        }
      }
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

  const handleSubmit = () => {
    if (validateStep()) {
      const dataToSubmit = {
        name: formData.name,
        description: formData.description || null,
        project_id: formData.selectedProject?.id,
        user_id: formData.user_id, // Include user_id in the submission payload
        storage_size_gb: parseInt(formData.storage_size_gb),
        number_of_instances: parseInt(formData.number_of_instances),
        compute_instance_id: formData.selectedComputeInstance?.id,
        ebs_volume_id: formData.selectedEbsVolume?.id,
        os_image_id: formData.selectedOsImage?.id,
        bandwidth_id: formData.bandwidth_id
          ? parseInt(formData.bandwidth_id)
          : null,
        months: parseInt(formData.months),
        tags: formData.tags,
      };

      createInstanceRequest(dataToSubmit, {
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

  const handlePaystackPayment = useCallback(() => {
    if (!paystackKey) {
      console.error("Paystack key is missing.");
      alert("Payment gateway not configured. Please contact support.");
      setIsPaying(false);
      return;
    }
    if (!profile?.email) {
      console.error("User email is missing for Paystack transaction.");
      alert("User email is not available. Cannot proceed with payment.");
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
      console.error("Missing transaction identifier or amount.");
      alert("Missing transaction details. Cannot proceed with payment.");
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
        console.log("Paystack Payment Successful:", transaction);
        setIsPaying(false);
        setIsSuccessModalOpen(true);
      },
      onCancel: () => {
        console.log("Paystack Payment Cancelled");
        setIsPaying(false);
      },
      onError: (error) => {
        console.error("Paystack Payment Error:", error);
        setIsPaying(false);
      },
    });
  }, [
    paystackKey,
    profile?.email,
    instanceRequestResponse,
    selectedPaymentOption,
    popup,
  ]);

  const handleSuccessModalClose = () => {
    setIsSuccessModalOpen(false);
    onClose();
  };

  const isPaymentButtonDisabled =
    isPaying ||
    isProfileFetching ||
    !profile?.email ||
    !instanceRequestResponse ||
    !selectedPaymentOption;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
              <h2 className="text-lg font-semibold text-[#575758]">
                Add Instance
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isSubmissionPending || isPaying}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-3">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>
            <div className="px-6 pb-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              {currentStep === 0 && (
                <ConfigurationStep
                  formData={formData}
                  errors={errors}
                  updateFormData={updateFormData}
                  handleSelectChange={handleSelectChange}
                  handleCheckboxChange={handleCheckboxChange}
                  isSubmissionPending={isSubmissionPending}
                  projects={projects}
                  isProjectsFetching={isProjectsFetching}
                  clients={clients}
                  isClientsFetching={isClientsFetching}
                  availableTags={availableTags}
                />
              )}
              {currentStep === 1 && (
                <ResourceAllocationStep
                  formData={formData}
                  errors={errors}
                  updateFormData={updateFormData}
                  handleSelectChange={handleSelectChange}
                  isSubmissionPending={isSubmissionPending}
                  computerInstances={computerInstances}
                  isComputerInstancesFetching={isComputerInstancesFetching}
                  ebsVolumes={ebsVolumes}
                  isEbsVolumesFetching={isEbsVolumesFetching}
                  bandwidths={bandwidths}
                  isBandwidthsFetching={isBandwidthsFetching}
                  osImages={osImages}
                  isOsImagesFetching={isOsImagesFetching}
                />
              )}
              {currentStep === 2 && <SummaryStep formData={formData} />}
              {currentStep === 3 && (
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
              )}
              {isSubmissionError && currentStep !== 3 && (
                <p className="text-red-500 text-sm mt-4 text-center">
                  {generalError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isSubmissionPending || isPaying}
                >
                  Close
                </button>
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
                onClick={handleNext}
                disabled={
                  isSubmissionPending ||
                  (currentStep === 3 && isPaymentButtonDisabled)
                }
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {currentStep === steps.length - 1 &&
                selectedPaymentOption?.payment_type.toLowerCase() ===
                  "bank transfer"
                  ? "I Have Paid"
                  : currentStep === steps.length - 1
                  ? "Complete Order"
                  : "Next"}
                {(isSubmissionPending || isPaying || isProfileFetching) && (
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessModalClose}
        transactionReference={instanceRequestResponse?.identifier}
        saveCard={saveCard}
        closeEv={onClose}
      />
    </>
  );
};

export default AddInstanceModal;
