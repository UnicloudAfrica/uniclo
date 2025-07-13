import React, { useState } from "react";
import { X, ChevronLeft, Loader2 } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instance_image: "",
    options: [], // Assuming options will be checkboxes for now
    storage_size_gb: "",
    compute_instance_id: "",
    ebs_volume_id: "",
    os_image_id: "",
    months: "",
  });
  const [errors, setErrors] = useState({});
  const [isPending, setIsPending] = useState(false); // Simulating loading for demonstration

  const steps = [
    "Configuration Details",
    "Resource Allocation",
    "Summary",
    "Payment",
  ];

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      // Configuration Details Step
      // 'name' => 'nullable|string' - no validation needed for required
      // 'description' => 'nullable|string' - no validation needed for required
      // 'instance_image' => 'nullable|string' - no validation needed for required
      // 'options' => 'nullable|array' - no validation needed for required
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
      if (!formData.compute_instance_id) {
        newErrors.compute_instance_id = "Compute Instance is required";
      }
      if (!formData.ebs_volume_id) {
        newErrors.ebs_volume_id = "EBS Volume is required";
      }
      if (!formData.os_image_id) {
        newErrors.os_image_id = "OS Image is required";
      }
      if (!formData.months) {
        newErrors.months = "Months is required";
      } else if (isNaN(formData.months) || parseInt(formData.months) < 1) {
        newErrors.months = "Months must be an integer and at least 1";
      }
    }
    // Summary and Payment steps don't have direct validation fields
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
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
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // This is the last step (Payment), simulate submission
        setIsPending(true);
        console.log("Final Form Data:", formData);
        // Simulate API call for payment/creation
        setTimeout(() => {
          setIsPending(false);
          alert("Order processed successfully!");
          onClose(); // Close modal on success
        }, 1500);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // Clear errors when going back
    }
  };

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
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Stepper Header inside the modal */}
            <div className="p-6">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>

            {/* Content */}
            <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              <div className="space-y-4 w-full">
                {currentStep === 0 && (
                  // Step 1: Configuration Details
                  <>
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Name
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
                      ></textarea>
                      {errors.description && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.description}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="instance_image"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Instance Image
                      </label>
                      <span
                        className={`w-full input-field block transition-all ${
                          errors.instance_image ? "border-red-500 border" : ""
                        }`}
                      >
                        <select
                          id="instance_image"
                          value={formData.instance_image}
                          onChange={(e) =>
                            updateFormData("instance_image", e.target.value)
                          }
                          className="w-full bg-transparent outline-none"
                        >
                          <option value="">Select an instance image</option>
                          <option value="Windows-Server-2019">
                            Windows Server 2019
                          </option>
                          <option value="Ubuntu-22.04-LTS">
                            Ubuntu 22.04 LTS
                          </option>
                          <option value="CentOS-8">CentOS 8</option>
                        </select>
                      </span>
                      {errors.instance_image && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.instance_image}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {["Option A", "Option B", "Option C"].map((option) => (
                          <label key={option} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.options.includes(option)}
                              onChange={() =>
                                handleCheckboxChange("options", option)
                              }
                              className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.options && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.options}
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
                          errors.compute_instance_id
                            ? "border-red-500 border"
                            : ""
                        }`}
                      >
                        <select
                          id="compute_instance_id"
                          value={formData.compute_instance_id}
                          onChange={(e) =>
                            updateFormData(
                              "compute_instance_id",
                              e.target.value
                            )
                          }
                          className="w-full bg-transparent outline-none"
                        >
                          <option value="">Select a compute instance</option>
                          <option value="instance-001">
                            Instance 001 (CPU: 2, RAM: 4GB)
                          </option>
                          <option value="instance-002">
                            Instance 002 (CPU: 4, RAM: 8GB)
                          </option>
                        </select>
                      </span>
                      {errors.compute_instance_id && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.compute_instance_id}
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
                          errors.ebs_volume_id ? "border-red-500 border" : ""
                        }`}
                      >
                        <select
                          id="ebs_volume_id"
                          value={formData.ebs_volume_id}
                          onChange={(e) =>
                            updateFormData("ebs_volume_id", e.target.value)
                          }
                          className="w-full bg-transparent outline-none"
                        >
                          <option value="">Select an EBS volume</option>
                          <option value="ebs-vol-a">EBS Volume A (SSD)</option>
                          <option value="ebs-vol-b">EBS Volume B (HDD)</option>
                        </select>
                      </span>
                      {errors.ebs_volume_id && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.ebs_volume_id}
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
                          errors.os_image_id ? "border-red-500 border" : ""
                        }`}
                      >
                        <select
                          id="os_image_id"
                          value={formData.os_image_id}
                          onChange={(e) =>
                            updateFormData("os_image_id", e.target.value)
                          }
                          className="w-full bg-transparent outline-none"
                        >
                          <option value="">Select an OS image</option>
                          <option value="os-win-2016">
                            Windows Server 2016
                          </option>
                          <option value="os-linux-ubuntu">
                            Ubuntu Linux LTS
                          </option>
                        </select>
                      </span>
                      {errors.os_image_id && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.os_image_id}
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
                  // Step 3: Summary
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Summary of Your Order
                    </h3>
                    {Object.entries(formData).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, " ")}:
                        </span>
                        <span className="text-sm text-gray-900">
                          {Array.isArray(value) && value.length > 0
                            ? value.join(", ")
                            : Array.isArray(value) && value.length === 0
                            ? "N/A"
                            : value || "N/A"}
                        </span>
                      </div>
                    ))}
                    <p className="text-center text-gray-700 italic mt-4">
                      Please review your selections before proceeding to
                      payment.
                    </p>
                  </div>
                )}

                {currentStep === 3 && (
                  // Step 4: Payment
                  <div className="text-center space-y-6 py-10">
                    <h3 className="text-2xl font-bold text-[#288DD1]">
                      Proceed to Payment
                    </h3>
                    <p className="text-gray-700">
                      You're almost there! Click 'Complete' to finalize your
                      order and proceed to the payment gateway.
                    </p>
                    {/* Placeholder for payment integration */}
                    <div className="bg-gray-100 p-6 rounded-lg border border-gray-200">
                      <p className="text-gray-600">
                        [ Payment Gateway Integration will go here ]
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                {currentStep > 0 && (
                  <button
                    onClick={handleBack}
                    className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1 inline-block" /> Back
                  </button>
                )}
              </div>
              <button
                onClick={handleNext}
                disabled={isPending}
                className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {currentStep === steps.length - 1 ? "Complete Order" : "Next"}
                {isPending && (
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
