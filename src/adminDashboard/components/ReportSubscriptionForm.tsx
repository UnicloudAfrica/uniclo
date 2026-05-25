/**
 * ReportSubscriptionForm — modal form used for both creating and editing
 * a scheduled report subscription (Stream A, task A4).
 *
 * Mirrors the validation rules enforced by the backend so the user gets
 * inline feedback before the request goes out. The submit handler returns
 * the fully-formed payload; the parent page owns the create/update hook
 * and the toast / success / error UX.
 */
import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, X } from "lucide-react";

import {
  ModernButton,
  ModernModal,
  ModernSelect,
  ModernInput,
} from "@/shared/components/ui";

import {
  COMMON_TIMEZONES,
  type CreateReportSubscriptionPayload,
  type ReportCadence,
  type ReportOutput,
  type ReportSubscription,
} from "../hooks/useReportSubscriptions";

// ─── Days-of-week ─────────────────────────────────────────────────────

const DAY_OF_WEEK_OPTIONS = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

// ─── Email validation ─────────────────────────────────────────────────

// Loose but practical — matches the backend's email rule. We do not need
// RFC 5322 perfection here; the server is the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidEmail = (s: string): boolean => EMAIL_RE.test(s.trim());

// ─── Props ────────────────────────────────────────────────────────────

export interface ReportSubscriptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** When present, the form pre-fills with the subscription and submits an edit. */
  subscription?: ReportSubscription | null;
  /**
   * Called with the validated payload. The parent owns the actual mutation
   * call and is responsible for closing the modal once it resolves.
   */
  onSubmit: (payload: CreateReportSubscriptionPayload) => Promise<void>;
  /** Pending state from the parent's mutation hook. */
  isSubmitting?: boolean;
  /** Server-side error surfaced from the mutation hook. */
  serverError?: string | null;
}

// ─── Defaults ─────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  cadence: "daily" as ReportCadence,
  output: "pdf" as ReportOutput,
  recipientsInput: "",
  recipients: [] as string[],
  enabled: true,
  dayOfWeek: "1", // Monday
  dayOfMonth: "1",
  hourOfDay: "9",
  timezone: "UTC",
  customTimezone: "",
  useCustomTimezone: false,
};

const COMMON_TZ_VALUES = new Set(COMMON_TIMEZONES.map((t) => t.value));

// ─── Component ────────────────────────────────────────────────────────

const ReportSubscriptionForm: React.FC<ReportSubscriptionFormProps> = ({
  isOpen,
  onClose,
  subscription,
  onSubmit,
  isSubmitting = false,
  serverError = null,
}) => {
  const isEdit = !!subscription;

  const [state, setState] = useState(DEFAULT_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset / hydrate when the modal opens or the target subscription changes.
  useEffect(() => {
    if (!isOpen) return;
    if (subscription) {
      const hasCustomTz = !COMMON_TZ_VALUES.has(subscription.timezone);
      setState({
        cadence: subscription.cadence,
        output: subscription.output,
        recipientsInput: "",
        recipients: [...subscription.recipients],
        enabled: subscription.enabled,
        dayOfWeek: String(subscription.day_of_week ?? 1),
        dayOfMonth: String(subscription.day_of_month ?? 1),
        hourOfDay: String(subscription.hour_of_day),
        timezone: hasCustomTz ? "__custom__" : subscription.timezone,
        customTimezone: hasCustomTz ? subscription.timezone : "",
        useCustomTimezone: hasCustomTz,
      });
    } else {
      setState(DEFAULT_STATE);
    }
    setErrors({});
  }, [isOpen, subscription]);

  const update = <K extends keyof typeof DEFAULT_STATE>(
    key: K,
    value: (typeof DEFAULT_STATE)[K]
  ) => setState((prev) => ({ ...prev, [key]: value }));

  const addRecipient = () => {
    const candidate = state.recipientsInput.trim();
    if (!candidate) return;
    if (!isValidEmail(candidate)) {
      setErrors((e) => ({ ...e, recipientsInput: "Enter a valid email address." }));
      return;
    }
    if (state.recipients.includes(candidate)) {
      setErrors((e) => ({ ...e, recipientsInput: "Recipient already added." }));
      return;
    }
    setState((prev) => ({
      ...prev,
      recipients: [...prev.recipients, candidate],
      recipientsInput: "",
    }));
    setErrors((e) => {
      const { recipientsInput: _drop, ...rest } = e;
      return rest;
    });
  };

  const removeRecipient = (email: string) => {
    setState((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== email),
    }));
  };

  const validate = (): {
    ok: boolean;
    payload?: CreateReportSubscriptionPayload;
    errors: Record<string, string>;
  } => {
    const nextErrors: Record<string, string> = {};

    if (state.recipients.length === 0) {
      nextErrors.recipients = "Add at least one recipient.";
    } else {
      const bad = state.recipients.find((r) => !isValidEmail(r));
      if (bad) nextErrors.recipients = `"${bad}" is not a valid email.`;
    }

    const hour = Number(state.hourOfDay);
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      nextErrors.hourOfDay = "Hour must be between 0 and 23.";
    }

    let dayOfWeek: number | null = null;
    if (state.cadence === "weekly") {
      const dow = Number(state.dayOfWeek);
      if (!Number.isInteger(dow) || dow < 0 || dow > 6) {
        nextErrors.dayOfWeek = "Pick a day of the week.";
      } else {
        dayOfWeek = dow;
      }
    }

    let dayOfMonth: number | null = null;
    if (state.cadence === "monthly") {
      const dom = Number(state.dayOfMonth);
      if (!Number.isInteger(dom) || dom < 1 || dom > 28) {
        nextErrors.dayOfMonth = "Day must be between 1 and 28.";
      } else {
        dayOfMonth = dom;
      }
    }

    const timezone = state.useCustomTimezone
      ? state.customTimezone.trim()
      : state.timezone;
    if (!timezone) {
      nextErrors.timezone = "Timezone is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      return { ok: false, errors: nextErrors };
    }

    const payload: CreateReportSubscriptionPayload = {
      cadence: state.cadence,
      output: state.output,
      recipients: state.recipients,
      enabled: state.enabled,
      hour_of_day: hour,
      timezone,
      day_of_week: dayOfWeek,
      day_of_month: dayOfMonth,
    };

    return { ok: true, payload, errors: {} };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const result = validate();
    if (!result.ok || !result.payload) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    await onSubmit(result.payload);
  };

  const timezoneOptions = useMemo(
    () => [
      ...COMMON_TIMEZONES.map((t) => ({ value: t.value, label: t.label })),
      { value: "__custom__", label: "Other (enter IANA name)" },
    ],
    []
  );

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit subscription" : "Add subscription"}
      subtitle="Schedule a recurring utilization report for one or more recipients."
      size="lg"
      actions={[
        {
          label: "Cancel",
          variant: "ghost",
          onClick: onClose,
          disabled: isSubmitting,
        },
        {
          label: isSubmitting
            ? isEdit
              ? "Saving..."
              : "Creating..."
            : isEdit
              ? "Save changes"
              : "Create subscription",
          variant: "primary",
          onClick: handleSubmit,
          disabled: isSubmitting,
        },
      ]}
    >
      <div className="space-y-4">
        {/* Cadence + output */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="sub-cadence" className="mb-1 block text-xs font-medium text-slate-600">
              Cadence
            </label>
            <ModernSelect
              id="sub-cadence"
              value={state.cadence}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                update("cadence", e.target.value as ReportCadence)
              }
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
              ]}
            />
          </div>
          <div>
            <label htmlFor="sub-output" className="mb-1 block text-xs font-medium text-slate-600">
              Output format
            </label>
            <ModernSelect
              id="sub-output"
              value={state.output}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                update("output", e.target.value as ReportOutput)
              }
              options={[
                { value: "pdf", label: "PDF" },
                { value: "csv", label: "CSV" },
              ]}
            />
          </div>
        </div>

        {/* Day of week / month (conditional) */}
        {state.cadence === "weekly" ? (
          <div>
            <label htmlFor="sub-dow" className="mb-1 block text-xs font-medium text-slate-600">
              Day of week
            </label>
            <ModernSelect
              id="sub-dow"
              value={state.dayOfWeek}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                update("dayOfWeek", e.target.value)
              }
              options={DAY_OF_WEEK_OPTIONS}
            />
            {errors.dayOfWeek ? (
              <p className="mt-1 text-xs text-red-600">{errors.dayOfWeek}</p>
            ) : null}
          </div>
        ) : null}

        {state.cadence === "monthly" ? (
          <div>
            <label htmlFor="sub-dom" className="mb-1 block text-xs font-medium text-slate-600">
              Day of month (1–28)
            </label>
            <ModernInput
              id="sub-dom"
              type="number"
              min={1}
              max={28}
              value={state.dayOfMonth}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update("dayOfMonth", e.target.value)
              }
            />
            {errors.dayOfMonth ? (
              <p className="mt-1 text-xs text-red-600">{errors.dayOfMonth}</p>
            ) : null}
          </div>
        ) : null}

        {/* Hour of day */}
        <div>
          <label htmlFor="sub-hour" className="mb-1 block text-xs font-medium text-slate-600">
            Hour of day (0–23, in the timezone below)
          </label>
          <ModernInput
            id="sub-hour"
            type="number"
            min={0}
            max={23}
            value={state.hourOfDay}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              update("hourOfDay", e.target.value)
            }
          />
          {errors.hourOfDay ? (
            <p className="mt-1 text-xs text-red-600">{errors.hourOfDay}</p>
          ) : null}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="sub-tz" className="mb-1 block text-xs font-medium text-slate-600">
            Timezone
          </label>
          <ModernSelect
            id="sub-tz"
            value={state.timezone}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const v = e.target.value;
              const isCustom = v === "__custom__";
              setState((prev) => ({
                ...prev,
                timezone: v,
                useCustomTimezone: isCustom,
                customTimezone: isCustom ? prev.customTimezone : "",
              }));
            }}
            options={timezoneOptions}
          />
          {state.useCustomTimezone ? (
            <div className="mt-2">
              <ModernInput
                id="sub-tz-custom"
                placeholder="e.g. Africa/Abidjan"
                aria-label="Custom IANA timezone"
                value={state.customTimezone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  update("customTimezone", e.target.value)
                }
              />
            </div>
          ) : null}
          {errors.timezone ? (
            <p className="mt-1 text-xs text-red-600">{errors.timezone}</p>
          ) : null}
        </div>

        {/* Recipients */}
        <div>
          <label htmlFor="sub-recipient" className="mb-1 block text-xs font-medium text-slate-600">
            Recipients
          </label>
          <div className="flex gap-2">
            <ModernInput
              id="sub-recipient"
              type="email"
              placeholder="name@example.com"
              value={state.recipientsInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                update("recipientsInput", e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient();
                }
              }}
            />
            <ModernButton
              type="button"
              variant="secondary"
              size="md"
              onClick={addRecipient}
              disabled={!state.recipientsInput.trim()}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </ModernButton>
          </div>
          {errors.recipientsInput ? (
            <p className="mt-1 text-xs text-red-600">{errors.recipientsInput}</p>
          ) : null}
          {state.recipients.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {state.recipients.map((email) => (
                <li
                  key={email}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                >
                  <span>{email}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${email}`}
                    onClick={() => removeRecipient(email)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-xs text-slate-400">No recipients added yet.</p>
          )}
          {errors.recipients ? (
            <p className="mt-1 text-xs text-red-600">{errors.recipients}</p>
          ) : null}
        </div>

        {/* Enabled toggle */}
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={state.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span>Enabled — the schedule will run automatically when on.</span>
        </label>

        {serverError ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5" />
            <span>{serverError}</span>
          </div>
        ) : null}
      </div>
    </ModernModal>
  );
};

export default ReportSubscriptionForm;
