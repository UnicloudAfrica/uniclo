import React, { useState, useEffect } from "react";
import { X, ChevronLeft, Loader2 } from "lucide-react";
import {
  useFetchComputerInstances,
  useFetchEbsVolumes,
  useFetchOsImages,
} from "../../hooks/resource"; // Assuming these hooks exist
import { useFetchProjects } from "../../hooks/projectHooks"; // Assuming these hooks exist
import { useCreateInstanceRequest } from "../../hooks/instancesHook"; // Assuming this hook exists

// Re-using the StepProgress component
const StepProgress = ({ currentStep, steps }) => (
  <div className="flex items-center justify-between mb-8">
    {steps.map((step, index) => (
      <React.Fragment key={step}>
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              index <= currentStep
                ? "bg-[#288DD1] text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {index + 1}
          </div>
          <p
            className={`text-xs mt-2 text-center ${
              index <= currentStep ? "text-[#288DD1]" : "text-gray-500"
            }`}
          >
            {step}
          </p>
        </div>
        {index < steps.length - 1 && (
          <div
            className={`flex-1 h-0.5 mx-4 ${
              index < currentStep ? "bg-[#288DD1]" : "bg-gray-200"
            }`}
          />
        )}
      </React.Fragment>
    ))}
  </div>
);

const AddInstanceModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { data: computerInstances, isFetching: isComputerInstancesFetching } =
    useFetchComputerInstances();
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchOsImages();
  const { data: ebsVolumes, isFetching: isEbsVolumesFetching } =
    useFetchEbsVolumes();
  const { data: projects, isFetching: isProjectsFetching } = useFetchProjects();

  // Hook for creating instance request
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
    selectedProject: null, // Stores { id, name }
    storage_size_gb: "",
    selectedComputeInstance: null, // Stores { id, name, vcpus, ram_gb }
    selectedEbsVolume: null, // Stores { id, name, type }
    selectedOsImage: null, // Stores { id, name }
    months: "",
    tags: [], // Initialize as empty array
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null); // For general submission errors
  const [instanceRequestResponse, setInstanceRequestResponse] = useState(null); // To store API response for payment step

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

  // Clear general error when moving between steps or opening modal
  useEffect(() => {
    setGeneralError(null);
  }, [currentStep, isOpen]);

  // Close modal on successful submission and reset form
  useEffect(() => {
    if (isSubmissionSuccess) {
      // No need to close here, as we transition to Payment step
      // onClose(); // This would close the modal immediately after submission
      // Reset form data after successful submission if needed, or let parent handle
      setFormData({
        name: "",
        description: "",
        selectedProject: null,
        storage_size_gb: "",
        selectedComputeInstance: null,
        selectedEbsVolume: null,
        selectedOsImage: null,
        months: "",
        tags: [],
      });
      setErrors({});
      setGeneralError(null);
      setCurrentStep(3); // Move to payment step
    }
  }, [isSubmissionSuccess, onClose]);

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      // Configuration Details Step
      if (!formData.name.trim()) {
        newErrors.name = "Instance Name is required";
      }
      if (!formData.selectedProject) {
        newErrors.selectedProject = "Project is required";
      }
      if (formData.tags.length === 0) {
        newErrors.tags = "At least one tag must be selected";
      }
      // description is nullable, no validation needed
    } else if (currentStep === 1) {
      // Resource Allocation Step
      if (!formData.storage_size_gb) {
        newErrors.storage_size_gb = "Storage Size is required";
      } else if (
        isNaN(formData.storage_size_gb) ||
        parseInt(formData.storage_size_gb) < 30
      ) {
        newErrors.storage_size_gb =
          "Storage Size must be an integer and at least 30 GiB";
      }
      if (!formData.selectedComputeInstance) {
        newErrors.selectedComputeInstance = "Compute Instance is required";
      }
      if (!formData.selectedEbsVolume) {
        newErrors.selectedEbsVolume = "EBS Volume is required";
      }
      if (!formData.selectedOsImage) {
        newErrors.selectedOsImage = "OS Image is required";
      }
      if (!formData.months) {
        newErrors.months = "Term (Months) is required";
      } else if (isNaN(formData.months) || parseInt(formData.months) < 1) {
        newErrors.months = "Term (Months) must be an integer and at least 1";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => {
      const newFormData = { ...prev, [field]: value };
      console.log("Updating formData. New state for", field, ":", value);
      console.log("Full new formData:", newFormData);
      return newFormData;
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null); // Clear general error on input change
  };

  const handleSelectChange = (field, value, optionsList) => {
    console.log(
      `handleSelectChange called for field: ${field}, value: ${value}`
    );
    if (!value) {
      // Handles "Select a project" option which has an empty string value
      updateFormData(field, null);
      return;
    }
    // Ensure comparison is robust for both string and number IDs
    const selectedOption = optionsList?.find(
      (option) => String(option.id) === String(value)
    );
    console.log("Found selected option:", selectedOption);
    if (selectedOption) {
      updateFormData(field, selectedOption);
    } else {
      console.warn(
        `Selected ID ${value} not found in options for field ${field}. This might indicate stale data or an invalid selection.`
      );
      updateFormData(field, null); // Reset if selected option is not found
    }
  };

  const handleCheckboxChange = (field, value) => {
    setFormData((prev) => {
      const currentValues = prev[field];
      if (currentValues.includes(value)) {
        return { ...prev, [field]: currentValues.filter((v) => v !== value) };
      } else {
        return { ...prev, [field]: [...currentValues, value] };
      }
    });
    setErrors((prev) => ({ ...prev, [field]: null }));
    setGeneralError(null); // Clear general error on input change
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        // If on Summary step, trigger submission
        if (currentStep === 2) {
          handleSubmit();
        } else {
          setCurrentStep(currentStep + 1);
        }
      } else {
        // This is the last step (Payment), if already submitted, then just close
        onClose();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // Clear errors when going back
      setGeneralError(null); // Clear general error when going back
      setInstanceRequestResponse(null); // Clear response if going back from payment
    }
  };

  const handleSubmit = () => {
    if (validateStep()) {
      const dataToSubmit = {
        name: formData.name,
        description: formData.description || null,
        project_id: formData.selectedProject?.id, // Send ID
        storage_size_gb: parseInt(formData.storage_size_gb),
        compute_instance_id: formData.selectedComputeInstance?.id, // Send ID
        ebs_volume_id: formData.selectedEbsVolume?.id, // Send ID
        os_image_id: formData.selectedOsImage?.id, // Send ID
        months: parseInt(formData.months),
        tags: formData.tags,
      };

      createInstanceRequest(dataToSubmit, {
        onSuccess: (response) => {
          setInstanceRequestResponse(response); // Save the full response
          // currentStep is updated in useEffect based on isSubmissionSuccess
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

  // Log projects data to see if it's being fetched correctly
  useEffect(() => {
    console.log("Projects data:", projects);
  }, [projects]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
              <h2 className="text-lg font-semibold text-[#575758]">
                Add Instance
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isSubmissionPending} // Disable close during submission
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Stepper Header inside the modal */}
            <div className="px-6 py-3">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>

            {/* Content */}
            <div className="px-6 pb-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              <div className="space-y-4 w-full">
                {currentStep === 0 && (
                  // Step 1: Configuration Details
                  <>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Name<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateFormData("name", e.target.value)}
                        placeholder="Enter instance name"
                        className={`w-full input-field ${
                          errors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isSubmissionPending}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          updateFormData("description", e.target.value)
                        }
                        placeholder="Enter description (optional)"
                        rows="3"
                        className={`w-full input-field ${
                          errors.description
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        disabled={isSubmissionPending}
                      ></textarea>
                      {errors.description && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="project_id"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Project<span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`w-full input-field block transition-all ${
                          errors.selectedProject ? "border-red-500 border" : ""
                        }`}
                      >
                        {isProjectsFetching ? (
                          <div className="flex items-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                            <span className="text-gray-500 text-sm">
                              Loading projects...
                            </span>
                          </div>
                        ) : projects && projects.length > 0 ? (
                          <select
                            id="project_id"
                            value={formData.selectedProject?.id || ""}
                            onChange={(e) =>
                              handleSelectChange(
                                "selectedProject",
                                e.target.value,
                                projects
                              )
                            }
                            className="w-full bg-transparent outline-none py-2"
                            disabled={isSubmissionPending}
                          >
                            <option value="">Select a project</option>
                            {projects?.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center py-2 text-gray-500 text-sm">
                            No projects available.
                          </div>
                        )}
                      </span>
                      {errors.selectedProject && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.selectedProject}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags<span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-2 border border-gray-300 rounded-lg p-3">
                        {availableTags.map((tag) => (
                          <label key={tag} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.tags.includes(tag)}
                              onChange={() => handleCheckboxChange("tags", tag)}
                              className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                              disabled={isSubmissionPending}
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {tag}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.tags && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.tags}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {currentStep === 1 && (
                  // Step 2: Resource Allocation
                  <>
                    <div>
                      <label
                        htmlFor="storage_size_gb"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Storage Size (GiB)
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="storage_size_gb"
                        type="number"
                        value={formData.storage_size_gb}
                        onChange={(e) =>
                          updateFormData("storage_size_gb", e.target.value)
                        }
                        placeholder="Min 30 GiB"
                        className={`w-full input-field ${
                          errors.storage_size_gb
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                        disabled={isSubmissionPending}
                      />
                      {errors.storage_size_gb && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.storage_size_gb}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="compute_instance_id"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Compute Instance<span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`w-full input-field block transition-all ${
                          errors.selectedComputeInstance
                            ? "border-red-500 border"
                            : ""
                        }`}
                      >
                        {isComputerInstancesFetching ? (
                          <div className="flex items-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                            <span className="text-gray-500 text-sm">
                              Loading compute instances...
                            </span>
                          </div>
                        ) : computerInstances &&
                          computerInstances.length > 0 ? (
                          <select
                            id="compute_instance_id"
                            value={formData.selectedComputeInstance?.id || ""}
                            onChange={(e) =>
                              handleSelectChange(
                                "selectedComputeInstance",
                                e.target.value,
                                computerInstances
                              )
                            }
                            className="w-full bg-transparent outline-none py-2"
                            disabled={isSubmissionPending}
                          >
                            <option value="">Select a compute instance</option>
                            {computerInstances?.map((instance) => (
                              <option key={instance.id} value={instance.id}>
                                {instance.name} (CPU: {instance.vcpus}, RAM:{" "}
                                {instance.memory_gib}GB)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center py-2 text-gray-500 text-sm">
                            No compute instances available.
                          </div>
                        )}
                      </span>
                      {errors.selectedComputeInstance && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.selectedComputeInstance}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="ebs_volume_id"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        EBS Volume<span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`w-full input-field block transition-all ${
                          errors.selectedEbsVolume
                            ? "border-red-500 border"
                            : ""
                        }`}
                      >
                        {isEbsVolumesFetching ? (
                          <div className="flex items-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                            <span className="text-gray-500 text-sm">
                              Loading EBS volumes...
                            </span>
                          </div>
                        ) : ebsVolumes && ebsVolumes.length > 0 ? (
                          <select
                            id="ebs_volume_id"
                            value={formData.selectedEbsVolume?.id || ""}
                            onChange={(e) =>
                              handleSelectChange(
                                "selectedEbsVolume",
                                e.target.value,
                                ebsVolumes
                              )
                            }
                            className="w-full bg-transparent outline-none py-2"
                            disabled={isSubmissionPending}
                          >
                            <option value="">Select an EBS volume</option>
                            {ebsVolumes?.map((volume) => (
                              <option key={volume.id} value={volume.id}>
                                {volume.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center py-2 text-gray-500 text-sm">
                            No EBS volumes available.
                          </div>
                        )}
                      </span>
                      {errors.selectedEbsVolume && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.selectedEbsVolume}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="os_image_id"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        OS Image<span className="text-red-500">*</span>
                      </label>
                      <span
                        className={`w-full input-field block transition-all ${
                          errors.selectedOsImage ? "border-red-500 border" : ""
                        }`}
                      >
                        {isOsImagesFetching ? (
                          <div className="flex items-center py-2">
                            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
                            <span className="text-gray-500 text-sm">
                              Loading OS images...
                            </span>
                          </div>
                        ) : osImages && osImages.length > 0 ? (
                          <select
                            id="os_image_id"
                            value={formData.selectedOsImage?.id || ""}
                            onChange={(e) =>
                              handleSelectChange(
                                "selectedOsImage",
                                e.target.value,
                                osImages
                              )
                            }
                            className="w-full bg-transparent outline-none py-2"
                            disabled={isSubmissionPending}
                          >
                            <option value="">Select an OS image</option>
                            {osImages?.map((image) => (
                              <option key={image.id} value={image.id}>
                                {image.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center py-2 text-gray-500 text-sm">
                            No OS images available.
                          </div>
                        )}
                      </span>
                      {errors.selectedOsImage && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.selectedOsImage}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="months"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Term (Months)<span className="text-red-500">*</span>
                      </label>
                      <input
                        id="months"
                        type="number"
                        value={formData.months}
                        onChange={(e) =>
                          updateFormData("months", e.target.value)
                        }
                        placeholder="Minimum 1 month"
                        className={`w-full input-field ${
                          errors.months ? "border-red-500" : "border-gray-300"
                        }`}
                        disabled={isSubmissionPending}
                      />
                      {errors.months && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.months}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  // Step 3: Summary - Trigger API call here
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Summary of Your Order
                    </h3>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Name:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Description:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.description || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Project:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.selectedProject?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Storage Size (GiB):
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.storage_size_gb || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Compute Instance:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.selectedComputeInstance?.name || "N/A"} (CPU:{" "}
                        {formData.selectedComputeInstance?.vcpus}, RAM:{" "}
                        {formData.selectedComputeInstance?.memory_gib}GB)
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        EBS Volume:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.selectedEbsVolume?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        OS Image:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.selectedOsImage?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm font-medium text-gray-600">
                        Term (Months):
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.months || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-sm font-medium text-gray-600">
                        Tags:
                      </span>
                      <span className="text-sm text-gray-900">
                        {formData.tags.length > 0
                          ? formData.tags.join(", ")
                          : "N/A"}
                      </span>
                    </div>

                    <p className="text-center text-gray-700 italic mt-4">
                      Please review your selections before proceeding to
                      payment.
                    </p>
                  </div>
                )}

                {currentStep === 3 && (
                  // Step 4: Payment - Show API response here
                  <div className="text-center space-y-6 py-10">
                    <h3 className="text-2xl font-bold text-[#288DD1]">
                      Payment Details
                    </h3>
                    {isSubmissionPending ? (
                      <div className="flex items-center justify-center flex-col">
                        <Loader2 className="w-8 h-8 animate-spin text-[#288DD1]" />
                        <p className="ml-2 text-gray-700 mt-2">
                          Processing your request...
                        </p>
                      </div>
                    ) : isSubmissionError ? (
                      <div className="text-red-500">
                        <p className="text-lg font-semibold">Error!</p>
                        <p>
                          {generalError ||
                            "Failed to process your order. Please try again."}
                        </p>
                      </div>
                    ) : instanceRequestResponse ? (
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-left">
                        <p className="text-green-700 text-lg font-semibold mb-2">
                          Order Processed Successfully!
                        </p>
                        <p className="text-gray-800">
                          <strong>Instance ID:</strong>{" "}
                          {instanceRequestResponse.id}
                        </p>
                        <p className="text-gray-800">
                          <strong>Instance Name:</strong>{" "}
                          {instanceRequestResponse.name}
                        </p>
                        <p className="text-gray-800">
                          <strong>Status:</strong>{" "}
                          {instanceRequestResponse.status}
                        </p>
                        <p className="text-gray-800">
                          <strong>Created At:</strong>{" "}
                          {new Date(
                            instanceRequestResponse.created_at
                          ).toLocaleString()}
                        </p>
                        {/* Add more details from instanceRequestResponse as needed */}
                        <p className="text-gray-700 italic mt-4">
                          You can now find your new instance in the Instances
                          list.
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-700">
                        Click 'Complete Order' to finalize your request.
                      </p>
                    )}
                  </div>
                )}
                {isSubmissionError &&
                  currentStep !== 3 && ( // Show error if not on payment step and there's an error
                    <p className="text-red-500 text-sm mt-4 text-center">
                      {generalError}
                    </p>
                  )}
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isSubmissionPending}
                >
                  Close
                </button>
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
                disabled={
                  isSubmissionPending ||
                  (currentStep === 3 && !instanceRequestResponse)
                }
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {currentStep === steps.length - 1 ? "Complete Order" : "Next"}
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

export default AddInstanceModal;
