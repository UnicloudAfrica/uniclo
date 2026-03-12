import React from "react";
import { Configuration } from "@/types/InstanceConfiguration";
import TagsInput from "./TagsInput";

interface FinalizeDetailsSectionProps {
  cfg: Configuration;
  resourceLabel: string;
  focusKey: (field: string) => string;
  updateConfigWithFocus: (patch: Partial<Configuration>) => void;
}

const FinalizeDetailsSection: React.FC<FinalizeDetailsSectionProps> = ({
  cfg,
  resourceLabel,
  focusKey,
  updateConfigWithFocus,
}) => {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {resourceLabel} name *
          </label>
          <input
            type="text"
            data-focus-key={focusKey("instance_name")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.name}
            onChange={(e) => updateConfigWithFocus({ name: e.target.value })}
            placeholder={`Enter ${resourceLabel.toLowerCase()} name`}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Quantity *</label>
          <input
            type="number"
            min="1"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.instance_count}
            onChange={(e) => updateConfigWithFocus({ instance_count: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          data-focus-key={focusKey("instance_description")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          rows={2}
          value={cfg.description}
          onChange={(e) => updateConfigWithFocus({ description: e.target.value })}
          placeholder="Optional description"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Tags (Optional)</label>
        <TagsInput
          value={cfg.tags || ""}
          onChange={(next) => updateConfigWithFocus({ tags: next })}
          placeholder="Type a tag and press comma"
          dataFocusKey={focusKey("tags")}
        />
        <p className="mt-1 text-xs text-gray-500">Press comma or enter to create a tag pill.</p>
      </div>
    </>
  );
};

export default FinalizeDetailsSection;
