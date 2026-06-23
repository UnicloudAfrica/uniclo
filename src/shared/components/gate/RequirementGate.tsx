import React, { useCallback, useEffect, useState } from "react";
import config from "@/config";
import useAuthStore from "@/stores/authStore";

/**
 * Dynamic Input Gate (FE).
 *
 * Fetches the requirements the authenticated subject still must satisfy at a
 * placement, renders their dynamic field schema, and BLOCKS its children behind
 * a modal until the required fields are submitted. Drives entirely off the
 * server-defined schema — no hardcoded fields.
 */
interface GateField {
  key: string;
  type: string;
  label: string;
  consent_text?: string;
  required?: boolean;
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
  // Don't block while we're still resolving, or when nothing is outstanding.
  if (!loaded || !current) return <>{children}</>;

  const isSatisfied = (current.fields || []).every((f) => {
    if (!f.required) return true;
    return f.type === "checkbox" ? values[f.key] === true : !!values[f.key];
  });

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

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        data-testid="requirement-gate"
      >
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">{current.title}</h2>
          {current.description && (
            <p className="mt-1 text-sm text-gray-500">{current.description}</p>
          )}

          <div className="mt-4 space-y-4">
            {(current.fields || []).map((f) => (
              <div key={f.key}>
                {f.type === "checkbox" ? (
                  <label className="flex items-start gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      data-field={f.key}
                      checked={values[f.key] === true}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.checked }))}
                      className="mt-1"
                    />
                    <span>
                      {f.consent_text || f.label}
                      {f.required ? " *" : ""}
                    </span>
                  </label>
                ) : (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      {f.label}
                      {f.required ? " *" : ""}
                    </label>
                    <input
                      type="text"
                      data-field={f.key}
                      value={(values[f.key] as string) || ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    />
                  </div>
                )}
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
