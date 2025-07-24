import React, { useState, useRef, useEffect } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { useCreateProject } from "../../../hooks/adminHooks/projectHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../../hooks/adminHooks/clientHooks";
import { DropdownSelect } from "./dropdownSelect"; // Ensure this path is correct

const CreateProjectModal = ({ isOpen, onClose }) => {
  const { mutate: createProject, isPending } = useCreateProject();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "vpc", // Default to vpc
    tenant_id: "", // Now compulsory
    client_ids: [], // Changed to an array for multiple clients
  });
  const [errors, setErrors] = useState({});

  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    // Make tenant_id compulsory
    if (!formData.tenant_id) {
      newErrors.tenant_id = "Partner is required";
    }
    // client_ids is optional, but if it needs validation (e.g., min 1 if selected), add here
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        tenant_id: formData.tenant_id, // tenant_id is now always included
        client_ids: formData.client_ids, // client_ids is an array
      };

      createProject(payload, {
        onSuccess: () => {
          ToastUtils.success("Project Created Successfully");
          onClose(); // Close modal on success
          // Reset form data after successful submission
          setFormData({
            name: "",
            description: "",
            type: "vpc",
            tenant_id: "",
            client_ids: [],
          });
        },
        onError: (error) => {
          console.error("Error creating project:", error.message);
          // ToastUtils.error(
          //   error?.message || "Failed to create project. Please try again."
          // );
          // setErrors((prev) => ({
          //   ...prev,
          //   general: error?.message || "Failed to create project.",
          // }));
        },
      });
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
          <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full ">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px] w-full">
              <h2 className="text-lg font-semibold text-[#575758]">
                Create New Project
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
                disabled={isPending}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
              <div className="space-y-4 w-full">
                {/* Project Name */}
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
                    className={`input-field ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Project Description */}
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
                    className={`input-field ${
                      errors.description ? "border-red-500" : "border-gray-300"
                    }`}
                  ></textarea>
                  {errors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Project Type */}
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
                        className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
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
                        className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
                      />
                      <span className="ml-2 text-sm text-gray-700">DVS</span>
                    </label>
                  </div>
                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">{errors.type}</p>
                  )}
                </div>

                {/* Partner (Tenant) Dropdown with Search - NOW COMPULSORY */}
                <div>
                  <label
                    htmlFor="tenant_id"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Partner<span className="text-red-500">*</span>
                  </label>
                  <DropdownSelect
                    options={tenants || []}
                    value={formData.tenant_id}
                    onChange={(value) => updateFormData("tenant_id", value)}
                    placeholder="Select a Partner"
                    isFetching={isTenantsFetching}
                    displayKey="name"
                    valueKey="id"
                    searchKeys={["name"]}
                    error={errors.tenant_id} // Pass error prop
                  />
                  {errors.tenant_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.tenant_id}
                    </p>
                  )}
                </div>

                {/* Client Dropdown with Search - Now Multi-Select */}
                <div>
                  <label
                    htmlFor="client_ids"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Client(s) (Optional)
                  </label>
                  <DropdownSelect
                    options={clients || []}
                    value={formData.client_ids} // Now an array
                    onChange={(value) => updateFormData("client_ids", value)} // Expects an array
                    placeholder="Select Client(s)"
                    isFetching={isClientsFetching}
                    displayKey="first_name" // Assuming 'first_name' is a good display
                    valueKey="id"
                    searchKeys={["first_name", "last_name", "email"]}
                    isMultiSelect={true} // Enable multi-select
                    error={errors.client_ids} // Pass error prop if you add validation for it
                  />
                  {errors.client_ids && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.client_ids}
                    </p>
                  )}
                </div>

                {/* {errors.general && (
                  <p className="text-red-500 text-xs mt-1">{errors.general}</p>
                )} */}
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                  disabled={isPending}
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
