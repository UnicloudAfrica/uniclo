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
    <div className="text-center mb-6">
      <h3 className="text-xl font-semibold text-gray-800">
        Initial Configuration
      </h3>
      <p className="text-sm text-gray-500 mt-1">
        Start by adding some descriptive tags. These settings will apply to the
        entire request.
      </p>
    </div>
    <div>
      <label
        htmlFor="name"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Request Name<span className="text-red-500">*</span>
      </label>
      <input
        id="name"
        type="text"
        value={formData.name}
        onChange={(e) => updateFormData("name", e.target.value)}
        placeholder="e.g., My Web Server Request"
        className={`w-full input-field ${
          errors.name ? "border-red-500" : "border-gray-300"
        }`}
      />
      {errors.name && (
        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
      )}
    </div>

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
