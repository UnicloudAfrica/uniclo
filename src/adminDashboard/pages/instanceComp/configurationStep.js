import React from "react";
import CheckboxGroup from "./checkGroup";

export const ConfigurationStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
  handleCheckboxChange,
  tenants,
  clients,
  projects,
  availableTags,
}) => (
  <div className="space-y-4 w-full">
    <div>
      <label
        htmlFor="project_id"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Project<span className="text-red-500">*</span> (This will apply to all
        configurations)
      </label>
      <span
        className={`w-full input-field block transition-all ${
          errors.topLevel_selectedProject ? "border-red-500 border" : ""
        }`}
      >
        {projects && projects.length > 0 ? (
          <select
            id="project_id"
            value={formData.topLevel_selectedProject?.id || ""}
            onChange={(e) =>
              handleSelectChange(
                "topLevel_selectedProject",
                e.target.value,
                projects
              )
            }
            className="w-full bg-transparent outline-none "
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center text-gray-500 text-sm">
            No projects available.
          </div>
        )}
      </span>
      {errors.topLevel_selectedProject && (
        <p className="text-red-500 text-xs mt-1">
          {errors.topLevel_selectedProject}
        </p>
      )}
    </div>
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Assign To
      </label>
      <div className="flex space-x-4">
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="client"
            checked={formData.topLevel_assigned_to_type === "client"}
            onChange={(e) =>
              updateFormData("topLevel_assigned_to_type", e.target.value)
            }
            className="form-radio text-[#288DD1]"
          />
          <span className="ml-2 text-gray-700">Client</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="radio"
            value="tenant"
            checked={formData.topLevel_assigned_to_type === "tenant"}
            onChange={(e) =>
              updateFormData("topLevel_assigned_to_type", e.target.value)
            }
            className="form-radio text-[#288DD1]"
          />
          <span className="ml-2 text-gray-700">Partner</span>
        </label>
      </div>
    </div>
    {formData.topLevel_assigned_to_type === "client" && (
      <div>
        <label
          htmlFor="selectedClient"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Client
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.topLevel_user_id ? "border-red-500 border" : ""
          }`}
        >
          {clients && clients.length > 0 ? (
            <select
              id="selectedClient"
              value={formData.topLevel_user_id || ""}
              onChange={(e) =>
                handleSelectChange("topLevel_user_id", e.target.value)
              }
              className="w-full bg-transparent outline-none"
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name} ({client.email})
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center text-gray-500 text-sm">
              No clients available.
            </div>
          )}
        </span>
        {errors.topLevel_user_id && (
          <p className="text-red-500 text-xs mt-1">{errors.topLevel_user_id}</p>
        )}
      </div>
    )}
    {formData.topLevel_assigned_to_type === "tenant" && (
      <div>
        <label
          htmlFor="selectedTenant"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Partner
        </label>
        <span
          className={`w-full input-field block transition-all ${
            errors.topLevel_tenant_id ? "border-red-500 border" : ""
          }`}
        >
          {tenants && tenants.length > 0 ? (
            <select
              id="selectedTenant"
              value={formData.topLevel_tenant_id || ""}
              onChange={(e) =>
                handleSelectChange("topLevel_tenant_id", e.target.value)
              }
              className="w-full bg-transparent outline-none"
            >
              <option value="">Select a partner</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center text-gray-500 text-sm">
              No partners available.
            </div>
          )}
        </span>
        {errors.topLevel_tenant_id && (
          <p className="text-red-500 text-xs mt-1">
            {errors.topLevel_tenant_id}
          </p>
        )}
      </div>
    )}
    <CheckboxGroup
      label="Tags"
      options={availableTags}
      selectedValues={formData.tags}
      onChange={(tag) => handleCheckboxChange("tags", tag)}
      error={errors.tags}
      required
    />
    <div className="flex items-center">
      <input
        id="fast_track"
        type="checkbox"
        checked={formData.fast_track}
        onChange={(e) => updateFormData("fast_track", e.target.checked)}
        className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
      />
      <label
        htmlFor="fast_track"
        className="ml-2 block text-sm font-medium text-gray-700"
      >
        Fast Track
      </label>
    </div>
  </div>
);

export default ConfigurationStep;
