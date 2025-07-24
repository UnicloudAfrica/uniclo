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
const AddAdminInstance = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: bandwidths, isFetching: isBandwidthsFetching } =
    useFetchBandwidths();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();
  //   const {
  //     mutate: createInstanceRequest,
  //     isPending: isSubmissionPending,
  //     isSuccess: isSubmissionSuccess,
  //     isError: isSubmissionError,
  //     error: submissionError,
  //   } = useCreateInstance();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    selectedProject: null,
    storage_size_gb: "",
    selectedComputeInstance: null,
    selectedEbsVolume: null,
    selectedOsImage: null,
    bandwidth_id: null,
    months: "",
    tags: [],
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

  const steps = [
    "Configuration Details",
    "Resource Allocation",
    "Summary",
    // "Payment" step is intentionally excluded for admin flow
  ];

  useEffect(() => {
    setGeneralError(null);
  }, [currentStep]);

  // Handle successful submission
  useEffect(() => {
    if (isSubmissionSuccess) {
      ToastUtils.success("Instance created successfully!");
      // Optionally reset form or redirect
      setFormData({
        name: "",
        description: "",
        selectedProject: null,
        storage_size_gb: "",
        selectedComputeInstance: null,
        selectedEbsVolume: null,
        selectedOsImage: null,
        bandwidth_id: null,
        months: "",
        tags: [],
      });
      setErrors({});
      setGeneralError(null);
      setCurrentStep(0); // Reset to first step
      // In a real app, you might want to close a modal or redirect here
      // onClose(); // If this component is part of a modal
    }
    if (isSubmissionError) {
      setGeneralError(submissionError?.message || "Failed to create instance.");
    }
  }, [isSubmissionSuccess, isSubmissionError, submissionError]);

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      if (!formData.name.trim()) newErrors.name = "Instance Name is required";
      if (!formData.selectedProject)
        newErrors.selectedProject = "Project is required";
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
        description: formData.description || null,
        project_id: formData.selectedProject?.id,
        storage_size_gb: parseInt(formData.storage_size_gb),
        compute_instance_id: formData.selectedComputeInstance?.id,
        ebs_volume_id: formData.selectedEbsVolume?.id,
        os_image_id: formData.selectedOsImage?.id,
        bandwidth_id: formData.bandwidth_id
          ? parseInt(formData.bandwidth_id)
          : null,
        months: parseInt(formData.months),
        tags: formData.tags,
      };

      createInstanceRequest(dataToSubmit); // Call the mutation
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Last step (Summary), proceed to submit
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

  // This component is not a modal, so onClose might not be directly applicable
  // If this component is intended to be used within a modal, the parent should pass onClose.
  // For now, I'll keep the onClose prop for consistency if it's eventually wrapped.
  const onClose = () => {
    // Implement logic to close or reset the overall view if needed
    // For example, if this component is rendered conditionally by a parent,
    // the parent would update its state to unmount this component.
    setFormData({
      // Reset form on close
      name: "",
      description: "",
      selectedProject: null,
      storage_size_gb: "",
      selectedComputeInstance: null,
      selectedEbsVolume: null,
      selectedOsImage: null,
      bandwidth_id: null,
      months: "",
      tags: [],
    });
    setErrors({});
    setGeneralError(null);
    setCurrentStep(0);
  };

  const isAnyFetching =
    isComputerInstancesFetching ||
    isOsImagesFetching ||
    isBandwidthsFetching ||
    isEbsVolumesFetching ||
    isProjectsFetching;

  return (
    <div className="flex flex-col h-full font-Outfit">
      <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
        <h2 className="text-lg font-semibold text-[#575758]">
          Add New Instance (Admin)
        </h2>
        {/* Removed close button if not a modal, or keep if wrapped by one */}
        {/* <button
          onClick={onClose}
          className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
          disabled={isSubmissionPending}
        >
          <X className="w-5 h-5" />
        </button> */}
      </div>
      <div className="px-6 py-3">
        <StepProgress currentStep={currentStep} steps={steps} />
      </div>
      <div className="flex-1 px-6 pb-6 w-full overflow-y-auto flex flex-col items-center justify-start">
        {isAnyFetching ? (
          <div className="flex justify-center items-center h-full min-h-[200px]">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
            <p className="ml-2 text-gray-600">Loading resources...</p>
          </div>
        ) : (
          <>
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
            {generalError && (
              <p className="text-red-500 text-sm mt-4 text-center">
                {generalError}
              </p>
            )}
          </>
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
  );
};

export default AddAdminInstance;
