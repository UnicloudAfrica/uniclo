import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    type: "VPC", // Default to VPC as per the image
  });
  const [errors, setErrors] = useState({});
  const [isPending, setIsPending] = useState(false); // Simulating loading

  const validateForm = () => {
    const newErrors = {};
    if (!formData.projectName) {
      newErrors.projectName = "Project Name is required";
    }
    // Description is nullable, so no required validation
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      setIsPending(true);
      console.log("Submitting Project Data:", formData);
      // Simulate API call for project creation
      setTimeout(() => {
        setIsPending(false);
        alert("Project created successfully!");
        onClose(); // Close modal on success
      }, 1500);
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
                Create New Project
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              <div className="space-y-4 w-full">
                <div>
                  <label
                    htmlFor="projectName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Project Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={formData.projectName}
                    onChange={(e) =>
                      updateFormData("projectName", e.target.value)
                    }
                    placeholder="Enter project name"
                    className={`w-full input-field ${
                      errors.projectName ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.projectName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.projectName}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    placeholder="Enter project description (optional)"
                    rows="3"
                    className={`w-full input-field ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                  ></textarea>
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type<span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="projectType"
                        value="VPC"
                        checked={formData.type === "VPC"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                        className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">VPC</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="projectType"
                        value="DVS"
                        checked={formData.type === "DVS"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                        className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">DVS</span>
                    </label>
                  </div>
                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Create Project
                  {isPending && (
                    <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateProjectModal;
