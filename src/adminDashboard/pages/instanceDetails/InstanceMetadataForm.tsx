import React from "react";
import { ModernButton, ModernCard } from "@/shared/components/ui";
import ModernInput from "@/shared/components/ui/ModernInput";

import type { GenericRecord } from "./instanceDetailsTypes";

interface MetadataFormState {
  name: string;
  description: string;
  tags: string;
}

interface InstanceMetadataFormProps {
  metadataForm: MetadataFormState;
  setMetadataForm: React.Dispatch<React.SetStateAction<MetadataFormState>>;
  managedInstance: GenericRecord | null;
  isMetadataUpdating: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const InstanceMetadataForm: React.FC<InstanceMetadataFormProps> = ({
  metadataForm,
  setMetadataForm,
  managedInstance,
  isMetadataUpdating,
  onSubmit,
}) => {
  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Metadata &amp; Tags</h2>
        <p className="text-sm text-slate-500">
          Update descriptive fields that appear across dashboards.
        </p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <ModernInput
          label="Display Name"
          value={metadataForm.name}
          onChange={(event) =>
            setMetadataForm((prev) => ({
              ...prev,
              name: event.target.value,
            }))
          }
          placeholder="Instance display name"
          id="instance-display-name"
        />
        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            value={metadataForm.description}
            onChange={(event) =>
              setMetadataForm((prev) => ({
                ...prev,
                description: event.target.value,
              }))
            }
            rows={4}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="Add a short description for this instance"
          />
        </div>
        <ModernInput
          label="Tags"
          value={metadataForm.tags}
          onChange={(event) =>
            setMetadataForm((prev) => ({
              ...prev,
              tags: event.target.value,
            }))
          }
          placeholder="Comma separated tags (e.g. production, finance)"
        />
        <div className="flex justify-end gap-2">
          <ModernButton
            type="button"
            variant="ghost"
            onClick={() =>
              setMetadataForm({
                name: (managedInstance?.["name"] as string) || "",
                description: (managedInstance?.["description"] as string) || "",
                tags: Array.isArray(managedInstance?.["tags"])
                  ? (managedInstance["tags"] as string[]).join(", ")
                  : (managedInstance?.["tags"] as string) || "",
              })
            }
          >
            Reset
          </ModernButton>
          <ModernButton
            type="submit"
            variant="primary"
            isLoading={isMetadataUpdating}
            isDisabled={isMetadataUpdating}
          >
            Save Changes
          </ModernButton>
        </div>
      </form>
    </ModernCard>
  );
};

export default InstanceMetadataForm;
