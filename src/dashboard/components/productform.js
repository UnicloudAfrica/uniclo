import React, { useState } from "react";
import { Eye, EyeOff, ChevronLeft, Loader2 } from "lucide-react";
import { useCreateProduct } from "../../hooks/adminHooks/productsHook";

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

const ProductForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    solution: "",
    data_type: [], // Array for multiple checkbox selections
    usable_capacity: "",
    term_of_use: "",
    application_use: [], // Array for multiple checkbox selections
    vm_count: "",
    networking_requirements: "",
    accomplish_goal: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { mutate: createProduct, isLoading: isPending } = useCreateProduct();

  const steps = ["Solution Selection", "Storage", "Compute", "Personal Info"];
  const computeSteps = ["Solution Selection", "Compute", "Personal Info"];

  const validateStep = () => {
    const newErrors = {};
    if (currentStep === 0) {
      if (!formData.solution) newErrors.solution = "Solution is required";
    } else if (currentStep === 1 && formData.solution !== "Compute") {
      if (!formData.data_type.length)
        newErrors.data_type = "At least one data type is required";
      if (!formData.usable_capacity)
        newErrors.usable_capacity = "Usable capacity is required";
      else if (isNaN(formData.usable_capacity) || formData.usable_capacity <= 0)
        newErrors.usable_capacity = "Usable capacity must be a positive number";
      if (!formData.term_of_use)
        newErrors.term_of_use = "Term of use is required";
    } else if (
      (currentStep === 1 && formData.solution === "Compute") ||
      (currentStep === 2 && formData.solution !== "Compute")
    ) {
      if (!formData.application_use.length)
        newErrors.application_use = "At least one application use is required";
      if (!formData.vm_count) newErrors.vm_count = "VM count is required";
      if (!formData.networking_requirements)
        newErrors.networking_requirements =
          "Networking requirements are required";
      if (!formData.accomplish_goal)
        newErrors.accomplish_goal = "Goal is required";
    } else if (
      (currentStep === 2 && formData.solution === "Compute") ||
      (currentStep === 3 && formData.solution !== "Compute")
    ) {
      if (!formData.first_name) newErrors.first_name = "First name is required";
      if (!formData.last_name) newErrors.last_name = "Last name is required";
      if (!formData.email) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        newErrors.email = "Invalid email format";
      if (!formData.phone) newErrors.phone = "Phone is required";
      if (!formData.password) newErrors.password = "Password is required";
      else if (formData.password.length < 6)
        newErrors.password = "Password must be at least 6 characters";
      if (!formData.password_confirmation)
        newErrors.password_confirmation = "Confirm password is required";
      else if (formData.password !== formData.password_confirmation)
        newErrors.password_confirmation = "Passwords do not match";
    }
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
      const isCompute = formData.solution === "Compute";
      const maxSteps = isCompute ? computeSteps.length : steps.length;
      if (currentStep < maxSteps - 1) {
        setCurrentStep(currentStep + 1); // Always increment by 1
      } else {
        createProduct(formData, {
          onSuccess: () => alert("Product request submitted successfully!"),
          onError: (error) => alert(`Error: ${error.message}`),
        });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1); // Always decrement by 1
      setErrors({});
    }
  };

  // Skeleton Loader for Form
  const FormSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      {[...Array(3)].map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      ))}
      <div className="flex gap-4 mt-8">
        <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
        <div className="h-10 bg-gray-200 rounded-lg flex-1"></div>
      </div>
    </div>
  );

  return (
    <div className="max-w min-h-[80vh] mx-auto p">
      {/* Stepper Header */}
      <StepProgress
        currentStep={currentStep}
        steps={formData.solution === "Compute" ? computeSteps : steps}
      />

      {/* Form Content */}

      <div className="space-y-4">
        {currentStep === 0 && (
          <div>
            <label
              htmlFor="solution"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Solution *
            </label>
            <span
              className={`w-full input-field block transition-all ${
                errors.solution ? "border-red-500 border" : ""
              } `}
            >
              <select
                id="solution"
                value={formData.solution}
                onChange={(e) => updateFormData("solution", e.target.value)}
                className="w-full bg-transparent outline-none"
              >
                <option value="" disabled>
                  Select a solution
                </option>
                <option value="Storage">Storage</option>
                <option value="Compute">Compute</option>
                <option value="Full Stack (Storage and Compute)">
                  Full Stack (Storage and Compute)
                </option>
                <option value="Full Stack + GPU">Full Stack + GPU</option>
              </select>
            </span>
            {errors.solution && (
              <p className="text-red-500 text-xs mt-1">{errors.solution}</p>
            )}
          </div>
        )}
        {currentStep === 1 && formData.solution !== "Compute" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Type *
              </label>
              <div className="space-y-2">
                {["File", "Block", "Object"].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.data_type.includes(type)}
                      onChange={() => handleCheckboxChange("data_type", type)}
                      className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {errors.data_type && (
                <p className="text-red-500 text-xs mt-1">{errors.data_type}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="usable_capacity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Usable Capacity Needed (TiB) *
              </label>
              <input
                id="usable_capacity"
                type="number"
                value={formData.usable_capacity}
                onChange={(e) =>
                  updateFormData("usable_capacity", e.target.value)
                }
                placeholder="Enter capacity in TiB"
                className={`w-full input-field ${
                  errors.usable_capacity ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.usable_capacity && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.usable_capacity}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="term_of_use"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Term of Use *
              </label>
              <span
                className={`w-full input-field block transition-all ${
                  errors.term_of_use ? "border-red-500 border" : ""
                } `}
              >
                <select
                  id="term_of_use"
                  value={formData.term_of_use}
                  onChange={(e) =>
                    updateFormData("term_of_use", e.target.value)
                  }
                  className="w-full bg-transparent outline-none"
                >
                  <option value="" disabled>
                    Select term
                  </option>
                  <option value="Hourly">Hourly</option>
                  <option value="12 mo.">12 mo.</option>
                  <option value="24 mo.">24 mo.</option>
                  <option value="36 mo.">36 mo.</option>
                </select>
              </span>
              {errors.term_of_use && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.term_of_use}
                </p>
              )}
            </div>
          </>
        )}
        {((currentStep === 1 && formData.solution === "Compute") ||
          (currentStep === 2 && formData.solution !== "Compute")) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How is your application used? *
              </label>
              <div className="space-y-2">
                {[
                  "Backup",
                  "Kubernetes Cluster",
                  "Database",
                  "File/Object Server",
                  "Desktop Virtualizations (VDI)",
                  "Server Virtualization",
                  "Media Server",
                  "Data Warehouse",
                  "Medical Imaging",
                  "Video Imaging",
                  "Email Server",
                  "EBS Only",
                  "Drives Only",
                  "Other",
                ].map((use) => (
                  <label key={use} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.application_use.includes(use)}
                      onChange={() =>
                        handleCheckboxChange("application_use", use)
                      }
                      className="h-4 w-4 text-[#288DD1] border-gray-300 rounded focus:ring-[#288DD1]"
                    />
                    <span className="ml-2 text-sm text-gray-700">{use}</span>
                  </label>
                ))}
              </div>
              {errors.application_use && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.application_use}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="vm_count"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                How many VMs? *
              </label>
              <span
                className={`w-full input-field block transition-all ${
                  errors.vm_count ? "border-red-500 border" : ""
                } `}
              >
                <select
                  id="vm_count"
                  value={formData.vm_count}
                  onChange={(e) => updateFormData("vm_count", e.target.value)}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="" disabled>
                    Select VM count
                  </option>
                  <option value="under 20">under 20</option>
                  <option value="20">20</option>
                  <option value="40">40</option>
                  <option value="60+">60+</option>
                </select>
              </span>
              {errors.vm_count && (
                <p className="text-red-500 text-xs mt-1">{errors.vm_count}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="networking_requirements"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Networking Requirements *
              </label>
              <span
                className={`w-full input-field block transition-all ${
                  errors.networking_requirements ? "border-red-500 border" : ""
                } `}
              >
                <select
                  id="networking_requirements"
                  value={formData.networking_requirements}
                  onChange={(e) =>
                    updateFormData("networking_requirements", e.target.value)
                  }
                  className="w-full bg-transparent outline-none"
                >
                  <option value="" disabled>
                    Select networking requirements
                  </option>
                  <option value="Less than 1GB">Less than 1GB</option>
                  <option value="1 GB">1 GB</option>
                  <option value="10 GB">10 GB</option>
                  <option value="Other">Other</option>
                </select>
              </span>
              {errors.networking_requirements && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.networking_requirements}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="accomplish_goal"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                What can we help you accomplish? *
              </label>
              <input
                id="accomplish_goal"
                type="text"
                value={formData.accomplish_goal}
                onChange={(e) =>
                  updateFormData("accomplish_goal", e.target.value)
                }
                placeholder="Enter your goal"
                className={`w-full input-field ${
                  errors.accomplish_goal ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.accomplish_goal && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accomplish_goal}
                </p>
              )}
            </div>
          </>
        )}
        {((currentStep === 2 && formData.solution === "Compute") ||
          (currentStep === 3 && formData.solution !== "Compute")) && (
          <>
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                First Name *
              </label>
              <input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => updateFormData("first_name", e.target.value)}
                placeholder="Enter first name"
                className={`w-full input-field ${
                  errors.first_name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Last Name *
              </label>
              <input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => updateFormData("last_name", e.target.value)}
                placeholder="Enter last name"
                className={`w-full input-field ${
                  errors.last_name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData("email", e.target.value)}
                placeholder="Enter email address"
                className={`w-full input-field ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone *
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="Enter phone number"
                className={`w-full input-field ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  placeholder="Enter password"
                  className={`w-full input-field transition-all ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="password_confirmation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showPassword ? "text" : "password"}
                  value={formData.password_confirmation}
                  onChange={(e) =>
                    updateFormData("password_confirmation", e.target.value)
                  }
                  placeholder="Confirm password"
                  className={`w-full input-field ${
                    errors.password_confirmation
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password_confirmation}
                </p>
              )}
            </div>
          </>
        )}
        <div className="flex gap-4 mt-8">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={isPending}
            className="flex-1 bg-[#288DD1] hover:bg-[#6db1df] text-white font-semibold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-1 focus:ring-[#288DD1] focus:ring-offset-2 flex items-center justify-center"
          >
            {(currentStep === 2 && formData.solution === "Compute") ||
            (currentStep === 3 && formData.solution !== "Compute")
              ? "Complete"
              : "Next"}
            {isPending && (
              <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
