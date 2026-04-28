import React from "react";
import { Trash2, Save } from "lucide-react";
import { Configuration } from "@/types/InstanceConfiguration";
import TemplateSelector from "./TemplateSelector";

interface ConfigurationHeaderProps {
  cfg: Configuration;
  index: number;
  totalConfigurations: number;
  configurationLabel: string;
  resourceLabel: string;
  variant: "classic" | "cube";
  removeConfiguration: (id: string) => void;
  onSaveTemplate?: (config: Configuration) => void;
  showTemplateSelector?: boolean;
  onTemplateSelect?: (template: unknown) => void;
}

const ConfigurationHeader: React.FC<ConfigurationHeaderProps> = ({
  cfg,
  index,
  totalConfigurations,
  configurationLabel,
  resourceLabel,
  variant,
  removeConfiguration,
  onSaveTemplate,
  showTemplateSelector,
  onTemplateSelect,
}) => {
  const isCube = variant === "cube";

  return (
    <>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">
            {configurationLabel} #{index + 1}: {cfg.name || "Untitled"}
          </p>
          <p className="text-sm text-gray-600">
            {isCube
              ? "Build a cube-instance with region, size, image, storage, and networking."
              : `Define ${resourceLabel.toLowerCase()}s, storage, and networking for this configuration.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onSaveTemplate && (
            <button
              type="button"
              onClick={() => onSaveTemplate(cfg)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100 hover:text-primary-700 focus:outline-none"
              title="Save as Template"
            >
              <Save className="h-4 w-4" />
              Save Template
            </button>
          )}
          {totalConfigurations > 1 && (
            <button
              type="button"
              onClick={() => removeConfiguration(cfg.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      {showTemplateSelector && onTemplateSelect && (
        <TemplateSelector onSelect={onTemplateSelect} primaryActionLabel="Apply template" />
      )}
    </>
  );
};

export default ConfigurationHeader;
