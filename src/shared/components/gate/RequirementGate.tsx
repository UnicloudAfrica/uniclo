import React, { useCallback, useEffect, useState } from "react";
import config from "@/config";
import useAuthStore from "@/stores/authStore";

/**
 * Dynamic Input Gate (FE).
 *
 * Fetches the requirements the authenticated subject still must satisfy at a
 * placement, renders their dynamic field schema, and BLOCKS its children behind
 * a modal until the required fields are submitted. Supports a repeatable `group`
 * field type (e.g. Founder 1, Founder 2, …). Drives entirely off the server
 * schema — no hardcoded fields.
 */
interface GateField {
  key: string;
  type: string;
  label: string;
  consent_text?: string;
  required?: boolean;
  capability?: {
    label?: string;
    id_type?: string;
    provider?: string | null;
    auto_verifiable?: boolean;
    country_code?: string | null;
  };
  // `group` support
  fields?: GateField[];
  min?: number;
  max?: number;
  item_label?: string;
}
interface GateRequirement {
  id: number;
  key: string;
  title: string;
  description?: string;
  fields: GateField[];
}

const authHeaders = (): Record<string, string> => {
  const token = useAuthStore.getState().token;
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

/** Whether a field (incl. repeatable groups) is satisfied. */
const isFilled = (field: GateField, value: unknown): boolean => {
  if (field.type === "group") {
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
    const min = Math.max(field.min ?? 0, field.required ? 1 : 0);
    if (items.length < min) return false;
    return items.every((item) =>
      (field.fields || []).every((sf) => isFilled(sf, item?.[sf.key])),
    );
  }
  if (!field.required) return true;
  return field.type === "checkbox" ? value === true : !!value;
};

const RequirementGate: React.FC<{ placement?: string; children?: React.ReactNode }> = ({
  placement = "onboarding",
  children,
}) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [pending, setPending] = useState<GateRequirement[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({}); // file-path key -> filename (display)

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setPending([]);
      setLoaded(true);
      return;
    }
    try {
      const res = await fetch(
        `${config.baseURL}/requirements/pending?placement=${encodeURIComponent(placement)}`,
        { headers: authHeaders(), credentials: "include" },
      );
      const json = (await res.json().catch(() => ({}))) as { data?: GateRequirement[] };
      setPending(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setPending([]);
    } finally {
      setLoaded(true);
    }
  }, [isAuthenticated, placement]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = pending[0];
  if (!loaded || !current) return <>{children}</>;

  const isSatisfied = (current.fields || []).every((f) => isFilled(f, values[f.key]));

  const submit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch(`${config.baseURL}/requirements/${current.id}/submit`, {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify({ values }),
      });
      if (res.status === 201) {
        setValues({});
        await load();
      } else {
        const json = (await res.json().catch(() => ({}))) as { errors?: Record<string, string> };
        setErrors(json?.errors || {});
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** Upload a file to private storage and return the stored path (or null). */
  const uploadFile = async (file: File): Promise<string | null> => {
    const token = useAuthStore.getState().token;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`${config.baseURL}/requirements/upload`, {
      method: "POST",
      headers: { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: "include",
      body: fd,
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { path?: string } };
    return res.status === 201 && json?.data?.path ? json.data.path : null;
  };

  /** Render a single (non-group) input given a value + setter + a unique key for file display. */
  const renderInput = (field: GateField, value: unknown, setValue: (v: unknown) => void, fileKey: string) => {
    if (field.type === "checkbox") {
      return (
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            data-field={field.key}
            checked={value === true}
            onChange={(e) => setValue(e.target.checked)}
            className="mt-1"
          />
          <span>
            {field.consent_text || field.label}
            {field.required ? " *" : ""}
          </span>
        </label>
      );
    }
    if (field.type === "file") {
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {field.label}
            {field.required ? " *" : ""}
          </label>
          <input
            type="file"
            data-field={field.key}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFiles((s) => ({ ...s, [fileKey]: `Uploading ${file.name}…` }));
              const path = await uploadFile(file);
              if (path) {
                setValue(path);
                setFiles((s) => ({ ...s, [fileKey]: file.name }));
              } else {
                setFiles((s) => ({ ...s, [fileKey]: "" }));
              }
            }}
            className="block w-full text-sm text-gray-700"
          />
          {files[fileKey] && <p className="mt-1 text-xs text-gray-500">{files[fileKey]}</p>}
        </div>
      );
    }
    if (field.type === "verification") {
      return (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {field.capability?.label || field.label}
            {field.required ? " *" : ""}
          </label>
          <input
            type="text"
            data-field={field.key}
            value={(value as string) || ""}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Enter your ${field.capability?.label || "ID"}`}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            {field.capability?.auto_verifiable
              ? "We'll verify this automatically where available."
              : "We'll review this for verification."}
          </p>
        </div>
      );
    }
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <input
          type="text"
          data-field={field.key}
          value={(value as string) || ""}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>
    );
  };

  /** Render a top-level field — handles the repeatable `group` type. */
  const renderField = (field: GateField) => {
    if (field.type !== "group") {
      return renderInput(
        field,
        values[field.key],
        (val) => setValues((v) => ({ ...v, [field.key]: val })),
        field.key,
      );
    }

    const items = (Array.isArray(values[field.key]) ? values[field.key] : [{}]) as Record<string, unknown>[];
    const min = Math.max(field.min ?? 0, field.required ? 1 : 0);
    const max = field.max ?? 10;
    const itemLabel = field.item_label || field.label;
    const setItems = (next: Record<string, unknown>[]) => setValues((v) => ({ ...v, [field.key]: next }));

    return (
      <div className="rounded-lg border border-gray-200 p-3" data-group={field.key}>
        <p className="mb-2 text-sm font-medium text-gray-700">
          {field.label}
          {field.required ? " *" : ""}
        </p>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-md bg-gray-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">
                  {itemLabel} {i + 1}
                </span>
                {items.length > Math.max(min, 1) && (
                  <button
                    type="button"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {(field.fields || []).map((sf) => (
                  <div key={sf.key}>
                    {renderInput(
                      sf,
                      item[sf.key],
                      (val) => setItems(items.map((it, j) => (j === i ? { ...it, [sf.key]: val } : it))),
                      `${field.key}.${i}.${sf.key}`,
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {items.length < max && (
          <button
            type="button"
            data-add-group={field.key}
            onClick={() => setItems([...items, {}])}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline"
          >
            + Add {itemLabel.toLowerCase()}
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        data-testid="requirement-gate"
      >
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">{current.title}</h2>
          {current.description && <p className="mt-1 text-sm text-gray-500">{current.description}</p>}

          <div className="mt-4 space-y-4">
            {(current.fields || []).map((f) => (
              <div key={f.key}>
                {renderField(f)}
                {errors[f.key] && <p className="mt-1 text-xs text-red-600">{errors[f.key]}</p>}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!isSatisfied || submitting}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Continue"}
          </button>
        </div>
      </div>
      {children}
    </>
  );
};

export default RequirementGate;
