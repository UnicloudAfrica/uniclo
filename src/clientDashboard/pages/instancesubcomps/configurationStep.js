import React from "react";
import CheckboxGroup from "./checkboxGroup";

const ConfigurationStep = ({
  formData,
  errors,
  updateFormData,
  handleCheckboxChange,
  availableTags,
}) => {
  return (
    <div className="space-y-4 w-full">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Initial Configuration
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Start by adding some descriptive tags. These settings will apply to
          the entire request.
        </p>
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
          className="h-4 w-4 text-[--theme-color] focus:ring-[--theme-color] border-gray-300 rounded"
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
};

export default ConfigurationStep;
