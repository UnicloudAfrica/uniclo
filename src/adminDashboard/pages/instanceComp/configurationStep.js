import React from "react";
import { Loader2 } from "lucide-react";
import CheckboxGroup from "./checkGroup";

export const ConfigurationStep = ({
  formData,
  errors,
  updateFormData,
  handleSelectChange,
  handleCheckboxChange,
  isSubmissionPending,
  projects,
  isProjectsFetching,
  availableTags,
}) => (
  <div className="space-y-4 w-full">
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
        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="description"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Description<span className="text-red-500">*</span>
      </label>
      <textarea
        id="description"
        value={formData.description}
        onChange={(e) => updateFormData("description", e.target.value)}
        placeholder="Enter description"
        rows="3"
        className={`w-full input-field ${
          errors.description ? "border-red-500" : "border-gray-300"
        }`}
        disabled={isSubmissionPending}
      ></textarea>
      {errors.description && (
        <p className="text-red-500 text-xs mt-1">{errors.description}</p>
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
          <div className="flex items-center ">
            <Loader2 className="w-4 h-4 animate-spin mr-2 text-gray-500" />
            <span className="text-gray-500 text-sm">Loading projects...</span>
          </div>
        ) : projects && projects.length > 0 ? (
          <select
            id="project_id"
            value={formData.selectedProject?.id || ""}
            onChange={(e) =>
              handleSelectChange("selectedProject", e.target.value, projects)
            }
            className="w-full bg-transparent outline-none "
            disabled={isSubmissionPending}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center  text-gray-500 text-sm">
            No projects available.
          </div>
        )}
      </span>
      {errors.selectedProject && (
        <p className="text-red-500 text-xs mt-1">{errors.selectedProject}</p>
      )}
    </div>
    <div>
      <label
        htmlFor="number_of_instances"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Number of Instances<span className="text-red-500">*</span>
      </label>
      <input
        id="number_of_instances"
        type="number"
        value={formData.number_of_instances}
        onChange={(e) => updateFormData("number_of_instances", e.target.value)}
        min="1"
        placeholder="Enter number of instances"
        className={`w-full input-field ${
          errors.number_of_instances ? "border-red-500" : "border-gray-300"
        }`}
        disabled={isSubmissionPending}
      />
      {errors.number_of_instances && (
        <p className="text-red-500 text-xs mt-1">
          {errors.number_of_instances}
        </p>
      )}
    </div>
    <CheckboxGroup
      label="Tags"
      options={availableTags}
      selectedValues={formData.tags}
      onChange={(tag) => handleCheckboxChange("tags", tag)}
      error={errors.tags}
      disabled={isSubmissionPending}
      required
    />
    <div className="flex items-center">
      <input
        id="fast_track"
        type="checkbox"
        checked={formData.fast_track}
        onChange={(e) => updateFormData("fast_track", e.target.checked)}
        className="h-4 w-4 text-[#288DD1] focus:ring-[#288DD1] border-gray-300 rounded"
        disabled={isSubmissionPending}
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
