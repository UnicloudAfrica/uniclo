import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useUpdateProject } from "../../../hooks/adminHooks/projectHooks";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../../hooks/adminHooks/clientHooks";
import { DropdownSelect } from "./dropdownSelect"; // Ensure this path is correct

const EditProjectModal = ({
  isOpen,
  onClose,
  projectDetails, // Now contains all project data
  projectId,
}) => {
  const [formData, setFormData] = useState({
    name: projectDetails?.name || "",
    description: projectDetails?.description || "",
    type: projectDetails?.type || "vpc",
    tenant_id: projectDetails?.tenant_id || "",
    client_ids: projectDetails?.clients?.map((client) => client.id) || [], // Initialize with client IDs
  });
  const [errors, setErrors] = useState({});

  const { mutate: updateProject, isPending } = useUpdateProject();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();

  // Update local state when projectDetails prop changes
  useEffect(() => {
    if (projectDetails) {
      setFormData({
        name: projectDetails.name || "",
        description: projectDetails.description || "",
        type: projectDetails.type || "vpc",
        tenant_id: projectDetails.tenant_id || "",
        client_ids: projectDetails.clients?.map((client) => client.id) || [],
      });
      setErrors({}); // Clear errors on projectDetails change
    }
  }, [projectDetails]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    if (!formData.tenant_id) {
      newErrors.tenant_id = "Partner is required";
    }
    // client_ids is optional, no specific validation needed unless business logic dictates a min/max
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      tenant_id: formData.tenant_id,
      client_ids: formData.client_ids,
    };

    updateProject(
      {
        id: projectId,
        projectData: payload,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Project Updated Successfully");
          onClose();
        },
        onError: (err) => {
          console.error("Error updating project:", err.message);
          ToastUtils.error(
            err?.message || "Failed to update project. Please try again."
          );
          setErrors((prev) => ({
            ...prev,
            general: err?.message || "Failed to update project.",
          }));
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1100] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full   overflow-y-auto">
        <div className="flex justify-between items-center border-b  px-6 py-4 mb-4">
          <h2 className="text-lg font-semibold text-[#575758]">Edit Project</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2]"
            disabled={isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4  max-h-[400px]  px-6 py-4 w-full overflow-y-auto">
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
              disabled={isPending}
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
              onChange={(e) => updateFormData("description", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none input-field focus:ring-2 focus:ring-[#288DD1] resize-y"
              rows="4"
              placeholder="Enter project description (optional)"
              disabled={isPending}
            />
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
                  disabled={isPending}
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
                  disabled={isPending}
                />
                <span className="ml-2 text-sm text-gray-700">DVS</span>
              </label>
            </div>
            {errors.type && (
              <p className="text-red-500 text-xs mt-1">{errors.type}</p>
            )}
          </div>

          {/* Partner (Tenant) Dropdown */}
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
              error={errors.tenant_id}
              disabled={isPending} // Disable if saving
            />
            {errors.tenant_id && (
              <p className="text-red-500 text-xs mt-1">{errors.tenant_id}</p>
            )}
          </div>

          {/* Client(s) Dropdown (Multi-Select) */}
          <div>
            <label
              htmlFor="client_ids"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Client(s) (Optional)
            </label>
            <DropdownSelect
              options={clients || []}
              value={formData.client_ids}
              onChange={(value) => updateFormData("client_ids", value)}
              placeholder="Select Client(s)"
              isFetching={isClientsFetching}
              displayKey="first_name"
              valueKey="id"
              searchKeys={["first_name", "last_name", "email"]}
              isMultiSelect={true}
              error={errors.client_ids}
              disabled={isPending} // Disable if saving
            />
            {errors.client_ids && (
              <p className="text-red-500 text-xs mt-1">{errors.client_ids}</p>
            )}
          </div>

          {errors.general && (
            <p className="text-red-500 text-xs mt-1">{errors.general}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6  px-6 py-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-6 py-2 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Save Changes
            {isPending && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
