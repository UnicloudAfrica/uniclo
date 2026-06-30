import React, { useEffect, useState } from "react";
import { ModernModal, ModernInput, ModernTextarea } from "@/shared/components/ui";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { marketingContentHooks } from "@/shared/hooks/resources/marketingContentHooks";
import {
  type FieldDef,
  type MarketingType,
  type TypeConfig,
  buildPayload,
  seedForm,
} from "./marketingFieldConfig";

interface MarketingContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: MarketingType;
  config: TypeConfig;
  /** Existing record for edit mode; null/undefined for create. */
  record?: Record<string, unknown> | null;
  /** Called after a successful create/update so the caller can refresh/close. */
  onSaved?: () => void;
}

/** Image-preview-eligible fields: URL kind whose key ends with `_url`. */
const isImageField = (field: FieldDef): boolean =>
  field.kind === "url" && field.key.endsWith("_url");

const MarketingContentModal: React.FC<MarketingContentModalProps> = ({
  isOpen,
  onClose,
  type,
  config,
  record,
  onSaved,
}) => {
  const isEdit = record != null && record.id != null;
  const [form, setForm] = useState<Record<string, string>>(() => seedForm(config, record));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const action = useAsyncAction();
  const hooks = marketingContentHooks(type);
  const { mutateAsync: createRecord } = hooks.useCreate();
  const { mutateAsync: updateRecord } = hooks.useUpdate();

  // Reset the form whenever the modal opens or the target record changes.
  useEffect(() => {
    if (isOpen) {
      setForm(seedForm(config, record));
      setErrors({});
    }
  }, [isOpen, config, record]);

  const setField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (action.isPending) return; // React batching can collapse rapid clicks

    // Client-side required guard mirrors the backend validation rules.
    const nextErrors: Record<string, string> = {};
    for (const field of config.fields) {
      if (field.required && !(form[field.key] ?? "").trim()) {
        nextErrors[field.key] = `${field.label} is required`;
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = buildPayload(config, form);

    await action.run(
      async () => {
        if (isEdit && record?.id != null) {
          return updateRecord({ id: record.id as string | number, data: payload });
        }
        return createRecord(payload);
      },
      {
        successToast: isEdit ? `${config.label} updated` : `${config.label} created`,
        rethrow: false,
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
      }
    );
  };

  const renderField = (field: FieldDef) => {
    const value = form[field.key] ?? "";
    const error = errors[field.key];

    if (field.kind === "textarea") {
      return (
        <ModernTextarea
          key={field.key}
          label={field.label}
          aria-label={field.label}
          required={field.required}
          helper={field.helper}
          error={error}
          rows={field.helper === "raw HTML" || field.helper === "raw HTML body" ? 6 : 3}
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
        />
      );
    }

    const inputType =
      field.kind === "url"
        ? "url"
        : field.kind === "number"
          ? "number"
          : field.kind === "date"
            ? "date"
            : "text";

    return (
      <div key={field.key} className="space-y-2">
        <ModernInput
          label={field.label}
          aria-label={field.label}
          type={inputType}
          required={field.required}
          helper={field.helper}
          error={error}
          value={value}
          onChange={(e) => setField(field.key, e.target.value)}
        />
        {isImageField(field) && value.trim() !== "" && (
          <img
            src={value.trim()}
            alt={`${field.label} preview`}
            className="h-20 w-auto max-w-[160px] rounded-lg border border-slate-200 object-contain"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        )}
      </div>
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit ${config.label}` : `New ${config.label}`}
      subtitle={isEdit ? undefined : `Add a new ${config.label.toLowerCase()} entry`}
      size="lg"
      loading={action.isPending}
      actions={[
        {
          label: "Cancel",
          variant: "outline",
          onClick: onClose,
          disabled: action.isPending,
        },
        {
          label: isEdit ? "Save Changes" : "Create",
          variant: "primary",
          onClick: handleSubmit,
          disabled: action.isPending,
        },
      ]}
    >
      <div className="space-y-5">{config.fields.map(renderField)}</div>
    </ModernModal>
  );
};

export default MarketingContentModal;
