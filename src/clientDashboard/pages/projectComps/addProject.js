import React, { useState, useRef, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateClientProject } from "../../../hooks/clientHooks/projectHooks";
import { useFetchGeneralRegions } from "../../../hooks/resource";

const CreateProjectModal = ({ isOpen, onClose }) => {
  const { mutate: createProject, isPending } = useCreateClientProject();
  const { isFetching: isRegionsFetching, data: regions } =
    useFetchGeneralRegions();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    default_region: "",
    type: "vpc",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.default_region)
      newErrors.default_region = "Default Region is required";
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
      createProject(formData, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error creating project:", error.message);
        },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
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
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          <div className="space-y-4 w-full">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name<span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="Enter project name"
                className={`w-full input-field ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
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
                onChange={(e) => updateFormData("description", e.target.value)}
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
              <label
                htmlFor="default_region"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Region<span className="text-red-500">*</span>
              </label>
              <select
                id="default_region"
                value={formData.default_region}
                onChange={(e) =>
                  updateFormData("default_region", e.target.value)
                }
                className={`w-full input-field ${
                  errors.default_region ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isRegionsFetching}
              >
                <option value="" disabled>
                  {isRegionsFetching ? "Loading regions..." : "Select a region"}
                </option>
                {regions?.map((region) => (
                  <option key={region.region} value={region.region}>
                    {region.label}
                  </option>
                ))}
              </select>
              {errors.default_region && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.default_region}
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
                    value="vpc"
                    checked={formData.type === "vpc"}
                    onChange={(e) => updateFormData("type", e.target.value)}
                    className="h-4 w-4 text-[--theme-color] border-gray-300 focus:ring-[--theme-color]"
                  />
                  <span className="ml-2 text-sm text-gray-700">VPC</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="projectType"
                    value="dvs"
                    checked={formData.type === "dvs"}
                    onChange={(e) => updateFormData("type", e.target.value)}
                    className="h-4 w-4 text-[--theme-color] border-gray-300 focus:ring-[--theme-color]"
                  />
                  <span className="ml-2 text-sm text-gray-700">DVS</span>
                </label>
              </div>
              {errors.type && (
                <p className="text-red-500 text-xs mt-1">{errors.type}</p>
              )}
            </div>
            {errors.general && (
              <p className="text-red-500 text-xs mt-1">{errors.general}</p>
            )}
          </div>
        </div>
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
              className="px-8 py-3 bg-[--theme-color] text-white font-medium rounded-full hover:bg-[--secondary-color] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
  );
};

export default CreateProjectModal;
