import { Plus, Trash2 } from "lucide-react";
import FileDropInput from "./FileDropInput";
import ToastUtils from "@/utils/toastUtil";
import type { OnboardingFieldDefinition, OnboardingFileValue } from "@/types/onboarding";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object";

export interface FieldInputProps {
  field: OnboardingFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onFileChange?: (file: File | null) => void;
}

const FieldInput = ({ field, value, onChange, onFileChange }: FieldInputProps) => {
  const baseClass =
    "w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm";

  if (field.type === "textarea") {
    return (
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <textarea
          value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          rows={field.rows ?? 4}
          className={`${baseClass} p-3`}
        />
        {field.helperText && <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>}
      </div>
    );
  }

  if (field.type === "file") {
    const handleSelect = (file: File | null) => {
      if (onFileChange) {
        onFileChange(file);
        return;
      }

      if (!file) {
        onChange("");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        onChange(event.target?.result ?? "");
      };
      reader.onerror = () => {
        ToastUtils.error("We couldn't read that file. Please try again.");
      };
      reader.readAsDataURL(file);
    };

    const spanClass = field.fullWidth === false ? "" : "md:col-span-2";
    return (
      <div className={spanClass}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <FileDropInput
          accept={field.accept ?? ".pdf,.png,.jpg,.jpeg"}
          value={value}
          helperText={field.helperText}
          onFileSelected={handleSelect}
        />
        {isRecord(value) && typeof value.url === "string" && value.url.trim() !== "" && (
          <a
            href={value.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[--theme-color] font-medium mt-2"
          >
            View current file
          </a>
        )}
      </div>
    );
  }

  if (field.type === "select") {
    const options = field.options ?? [];
    const normalizedValue =
      typeof value === "string" || typeof value === "number" ? String(value) : "";
    const hasValueOption =
      normalizedValue !== "" && options.some((option) => option.value === normalizedValue);
    const computedOptions = hasValueOption
      ? options
      : normalizedValue
        ? [...options, { value: normalizedValue, label: normalizedValue }]
        : options;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <select
          value={normalizedValue}
          onChange={(event) => onChange(event.target.value)}
          className={`${baseClass} h-11 px-3 bg-white`}
        >
          <option value="" disabled>
            Select an option
          </option>
          {computedOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.helperText && <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>}
      </div>
    );
  }

  if (field.type === "collection") {
    return (
      <CollectionField
        field={field}
        value={Array.isArray(value) ? value : []}
        onChange={(nextValue) => onChange(nextValue)}
      />
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={field.type ?? "text"}
        value={typeof value === "string" || typeof value === "number" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
        className={`${baseClass} h-11 px-3`}
        placeholder={field.placeholder}
      />
      {field.helperText && <p className="text-xs text-gray-500 mt-1">{field.helperText}</p>}
    </div>
  );
};

interface CollectionFieldProps {
  field: OnboardingFieldDefinition;
  value: unknown[];
  onChange: (value: unknown[]) => void;
}

const CollectionField = ({ field, value, onChange }: CollectionFieldProps) => {
  const items = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    const template = (field.fields ?? []).reduce<Record<string, unknown>>((acc, sub) => {
      acc[sub.id] = "";
      return acc;
    }, {});

    onChange([...(items ?? []), template]);
  };

  const handleRemove = (index: number) => {
    const next = items.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const handleItemChange = (index: number, key: string, newValue: unknown) => {
    const next = items.map((item, idx) => {
      const itemRecord = isRecord(item) ? item : {};
      return idx === index ? { ...itemRecord, [key]: newValue } : itemRecord;
    });

    onChange(next);
  };

  const handleItemFileChange = (index: number, key: string, file: File | null) => {
    if (!file) {
      handleItemChange(index, key, "");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      handleItemChange(index, key, event.target?.result ?? "");
    };
    reader.onerror = () => {
      ToastUtils.error("We couldn't read that file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="md:col-span-2">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500"> *</span>}
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1 text-xs font-medium text-[--theme-color] hover:opacity-80"
        >
          <Plus className="w-4 h-4" /> Add {field.itemLabel ?? "entry"}
        </button>
      </div>
      {field.helperText && <p className="text-xs text-gray-500 mb-3">{field.helperText}</p>}

      <div className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet. Use the button above to add one.</p>
        ) : (
          items.map((item, index) => {
            const itemRecord = isRecord(item) ? item : {};
            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">
                    {field.itemLabel ?? "Entry"} {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(field.fields ?? []).map((subField) => {
                    const fieldValue = itemRecord[subField.id];
                    const scalarValue =
                      typeof fieldValue === "string" || typeof fieldValue === "number"
                        ? fieldValue
                        : "";

                    return (
                      <div
                        key={subField.id}
                        className={subField.type === "textarea" ? "md:col-span-2" : ""}
                      >
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {subField.label}
                          {subField.required && <span className="text-red-500"> *</span>}
                        </label>
                        {subField.type === "textarea" ? (
                          <textarea
                            value={scalarValue}
                            onChange={(event) =>
                              handleItemChange(index, subField.id, event.target.value)
                            }
                            rows={subField.rows ?? 3}
                            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm p-2"
                          />
                        ) : subField.type === "select" ? (
                          <select
                            value={scalarValue}
                            onChange={(event) =>
                              handleItemChange(index, subField.id, event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm h-10 px-3 bg-white"
                          >
                            <option value="" disabled>
                              Select an option
                            </option>
                            {(subField.options ?? []).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : subField.type === "file" ? (
                          <>
                            <FileDropInput
                              accept={subField.accept ?? ".pdf,.png,.jpg,.jpeg"}
                              value={itemRecord[subField.id] as OnboardingFileValue}
                              helperText={subField.helperText}
                              onFileSelected={(file: File | null) =>
                                handleItemFileChange(index, subField.id, file)
                              }
                            />
                            {(() => {
                              const currentValue = itemRecord[subField.id];
                              const fileRecord = isRecord(currentValue) ? currentValue : null;

                              if (!fileRecord || typeof fileRecord.url !== "string") {
                                return null;
                              }

                              return (
                                <a
                                  href={fileRecord.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-[--theme-color] mt-1"
                                >
                                  View current file
                                </a>
                              );
                            })()}
                          </>
                        ) : (
                          <input
                            type={subField.type ?? "text"}
                            value={scalarValue}
                            onChange={(event) =>
                              handleItemChange(index, subField.id, event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-[--theme-color] focus:outline-none text-sm h-10 px-3"
                            placeholder={subField.placeholder}
                          />
                        )}
                        {subField.helperText && subField.type !== "file" && (
                          <p className="text-[10px] text-gray-500 mt-1">{subField.helperText}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FieldInput;
