import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useFetchProjects } from "../../../hooks/adminHooks/projectHooks";
import {
  useFetchBandwidths,
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
} from "../../../hooks/resource";
import StepProgress from "../../../dashboard/components/instancesubcomps/stepProgress";
import ToastUtils from "../../../utils/toastUtil";
import ConfigurationStep from "./configurationStep";
import ResourceAllocationStep from "./resourceAllocationStep";
import SummaryStep from "./summaryStep";
import { useCreateInstanceRequest } from "../../../hooks/adminHooks/instancesHook";

const AddAdminInstance = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();
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
    number_of_instances: 1,
    storage_size_gb: "",
    selectedComputeInstance: null,
    selectedEbsVolume: null,
    selectedOsImage: null,
    bandwidth_id: null,
    months: "",
    tags: [],
    fast_track: false,
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

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
  const steps = ["Configuration Details", "Resource Allocation", "Summary"];

  useEffect(() => {
    setGeneralError(null);
  }, [currentStep]);

  useEffect(() => {
    if (isSubmissionSuccess) {
      ToastUtils.success("Instance created successfully!");
      setFormData({
        name: "",
        description: "",
        selectedProject: null,
        number_of_instances: 1,
        storage_size_gb: "",
        selectedComputeInstance: null,
        selectedEbsVolume: null,
        selectedOsImage: null,
        bandwidth_id: null,
        months: "",
        tags: [],
        fast_track: false,
      });
      setErrors({});
      setGeneralError(null);
      setCurrentStep(0);
      onClose();
    }
    if (isSubmissionError) {
      // setGeneralError(submissionError?.message || "Failed to create instance.");
      // ToastUtils.error(
      //   submissionError?.message || "Failed to create instance."
      // );
    }
  }, [isSubmissionSuccess, isSubmissionError, submissionError, onClose]);

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      if (!formData.name.trim()) newErrors.name = "Instance Name is required";
      if (!formData.description.trim())
        newErrors.description = "Description is required";
      if (!formData.selectedProject)
        newErrors.selectedProject = "Project is required";
      if (
        !formData.number_of_instances ||
        isNaN(formData.number_of_instances) ||
        parseInt(formData.number_of_instances) < 1
      ) {
        newErrors.number_of_instances =
          "Number of Instances must be an integer and at least 1";
      }
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

    if (Object.keys(newErrors).length > 0) {
      ToastUtils.warning(
        "Please check the form for errors and make sure all required fields are filled."
      );
      return false;
    }
    return true;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newValue =
        (field === "bandwidth_id" ||
          field === "number_of_instances" ||
          field === "storage_size_gb" ||
          field === "months") &&
        value
          ? parseInt(value)
          : value;
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
      updateFormData(field, null);
    }
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

  const handleSubmit = () => {
    if (validateStep()) {
      const dataToSubmit = {
        name: formData.name,
        description: formData.description,
        project_id: formData.selectedProject?.id,
        number_of_instances: parseInt(formData.number_of_instances),
        storage_size_gb: parseInt(formData.storage_size_gb),
        compute_instance_id: formData.selectedComputeInstance?.id,
        ebs_volume_id: formData.selectedEbsVolume?.id,
        os_image_id: formData.selectedOsImage?.id,
        bandwidth_id: formData.bandwidth_id
          ? parseInt(formData.bandwidth_id)
          : null,
        months: parseInt(formData.months),
        tags: formData.tags,
        fast_track: formData.fast_track,
      };
      createInstanceRequest(dataToSubmit);
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setGeneralError(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      selectedProject: null,
      number_of_instances: 1,
      storage_size_gb: "",
      selectedComputeInstance: null,
      selectedEbsVolume: null,
      selectedOsImage: null,
      bandwidth_id: null,
      months: "",
      tags: [],
      fast_track: false,
    });
    setErrors({});
    setGeneralError(null);
    setCurrentStep(0);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const isAnyFetching =
    isComputerInstancesFetching ||
    isOsImagesFetching ||
    isBandwidthsFetching ||
    isEbsVolumesFetching ||
    isProjectsFetching;

  const renderStep = () => {
    if (isAnyFetching) {
      return (
        <div className="flex justify-center items-center h-full min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
          <p className="ml-2 text-gray-600">Loading resources...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <ConfigurationStep
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            handleSelectChange={handleSelectChange}
            handleCheckboxChange={handleCheckboxChange}
            projects={projects}
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
            computerInstances={computerInstances}
            ebsVolumes={ebsVolumes}
            bandwidths={bandwidths}
            osImages={osImages}
          />
        );
      case 2:
        return <SummaryStep formData={formData} bandwidths={bandwidths} />;
      default:
        return null;
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
              <h2 className="text-lg font-semibold text-[#575758]">
                Add New Instance
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isSubmissionPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-3">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>
            <div className="px-6 pb-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              {renderStep()}
              {generalError && (
                <p className="text-red-500 text-sm mt-4 text-center">
                  {generalError}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t">
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
                onClick={handleNext}
                disabled={isSubmissionPending || isAnyFetching}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {currentStep === steps.length - 1 ? "Create Instance" : "Next"}
                {isSubmissionPending && (
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddAdminInstance;
