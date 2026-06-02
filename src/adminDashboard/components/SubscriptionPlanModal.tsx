import React, { useEffect, useState } from "react";
import { ModernModal, ModernInput, ModernSelect, ModernTextarea } from "@/shared/components/ui";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import {
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
} from "@/shared/hooks/resources/subscriptionPlanHooks";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface SubscriptionPlanInput {
  id?: number | string;
  name?: string;
  description?: string;
  billing_interval?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  billing_interval_count?: number;
  base_price?: number;
  currency?: string;
  max_instances?: number;
  max_vcpus?: number;
  max_memory_gb?: number;
  max_storage_gb?: number;
  trial_days?: number;
  is_active?: boolean;
  is_public?: boolean;
}

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When provided, the modal is in edit mode and PUTs to the plan id. */
  plan?: SubscriptionPlanInput | null;
  /** Called after a successful create/update so the caller can close. */
  onSaved?: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// FORM STATE
// ═══════════════════════════════════════════════════════════════════

interface FormState {
  name: string;
  description: string;
  billing_interval: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
  billing_interval_count: string;
  base_price: string;
  currency: string;
  max_instances: string;
  max_vcpus: string;
  max_memory_gb: string;
  max_storage_gb: string;
  trial_days: string;
  is_active: boolean;
  is_public: boolean;
}

const num = (n?: number) => (n === undefined || n === null ? "" : String(n));

const buildInitialState = (plan?: SubscriptionPlanInput | null): FormState => ({
  name: plan?.name ?? "",
  description: plan?.description ?? "",
  billing_interval: plan?.billing_interval ?? "monthly",
  billing_interval_count: num(plan?.billing_interval_count) || "1",
  base_price: num(plan?.base_price),
  currency: plan?.currency ?? "NGN",
  max_instances: num(plan?.max_instances),
  max_vcpus: num(plan?.max_vcpus),
  max_memory_gb: num(plan?.max_memory_gb),
  max_storage_gb: num(plan?.max_storage_gb),
  trial_days: num(plan?.trial_days) || "0",
  is_active: plan?.is_active ?? true,
  is_public: plan?.is_public ?? false,
});

const INTERVAL_OPTIONS = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

const CURRENCY_OPTIONS = [
  { label: "NGN — Nigerian Naira", value: "NGN" },
  { label: "USD — US Dollar", value: "USD" },
  { label: "EUR — Euro", value: "EUR" },
  { label: "GBP — British Pound", value: "GBP" },
];

/**
 * Maps form strings into the backend payload. Empty optional numeric
 * fields are sent as `null` so the API clears them; required numerics
 * are coerced to numbers. Mirrors the validation rules on
 * `SubscriptionPlanController@store`.
 */
export const buildPayload = (form: FormState): Record<string, unknown> => {
  const optionalInt = (v: string) => (v.trim() === "" ? null : Number(v));

  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    billing_interval: form.billing_interval,
    billing_interval_count: Number(form.billing_interval_count) || 1,
    base_price: Number(form.base_price) || 0,
    currency: form.currency,
    max_instances: optionalInt(form.max_instances),
    max_vcpus: optionalInt(form.max_vcpus),
    max_memory_gb: optionalInt(form.max_memory_gb),
    max_storage_gb: optionalInt(form.max_storage_gb),
    trial_days: Number(form.trial_days) || 0,
    is_active: form.is_active,
    is_public: form.is_public,
  };
};

// ═══════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════

const SubscriptionPlanModal: React.FC<SubscriptionPlanModalProps> = ({
  isOpen,
  onClose,
  plan,
  onSaved,
}) => {
  const isEdit = Boolean(plan?.id);
  const [form, setForm] = useState<FormState>(() => buildInitialState(plan));
  const [nameError, setNameError] = useState("");

  const action = useAsyncAction();
  const { mutateAsync: createPlan } = useCreateSubscriptionPlan();
  const { mutateAsync: updatePlan } = useUpdateSubscriptionPlan();

  // Reset the form whenever the modal opens or the target plan changes.
  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState(plan));
      setNameError("");
    }
  }, [isOpen, plan]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (action.isPending) return; // React batching can collapse rapid clicks

    if (!form.name.trim()) {
      setNameError("Plan name is required");
      return;
    }
    setNameError("");

    const payload = buildPayload(form);

    await action.run(
      async () => {
        if (isEdit && plan?.id != null) {
          return updatePlan({ id: plan.id, data: payload });
        }
        return createPlan(payload);
      },
      {
        successToast: isEdit ? "Plan updated" : "Plan created",
        rethrow: false,
        onSuccess: () => {
          onSaved?.();
          onClose();
        },
      }
    );
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Subscription Plan" : "Create Subscription Plan"}
      subtitle={isEdit ? plan?.name : "Define a new billing plan for your customers"}
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
          label: isEdit ? "Save Changes" : "Create Plan",
          variant: "primary",
          onClick: handleSubmit,
          disabled: action.isPending,
        },
      ]}
    >
      <div className="space-y-5">
        <ModernInput
          label="Plan name"
          aria-label="Plan name"
          required
          placeholder="e.g. Starter, Pro, Enterprise"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          error={nameError}
        />

        <ModernTextarea
          label="Description"
          aria-label="Description"
          placeholder="What does this plan include?"
          rows={3}
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ModernInput
            label="Base price"
            aria-label="Base price"
            type="number"
            min={0}
            required
            value={form.base_price}
            onChange={(e) => setField("base_price", e.target.value)}
          />
          <ModernSelect
            label="Currency"
            aria-label="Currency"
            value={form.currency}
            options={CURRENCY_OPTIONS}
            onChange={(e) => setField("currency", e.target.value)}
          />
          <ModernSelect
            label="Billing interval"
            aria-label="Billing interval"
            value={form.billing_interval}
            options={INTERVAL_OPTIONS}
            onChange={(e) =>
              setField("billing_interval", e.target.value as FormState["billing_interval"])
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ModernInput
            label="Interval count"
            aria-label="Interval count"
            type="number"
            min={1}
            max={12}
            helper="e.g. 3 = every 3 months"
            value={form.billing_interval_count}
            onChange={(e) => setField("billing_interval_count", e.target.value)}
          />
          <ModernInput
            label="Trial days"
            aria-label="Trial days"
            type="number"
            min={0}
            max={365}
            value={form.trial_days}
            onChange={(e) => setField("trial_days", e.target.value)}
          />
          <ModernInput
            label="Max instances"
            aria-label="Max instances"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={form.max_instances}
            onChange={(e) => setField("max_instances", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <ModernInput
            label="Max vCPUs"
            aria-label="Max vCPUs"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={form.max_vcpus}
            onChange={(e) => setField("max_vcpus", e.target.value)}
          />
          <ModernInput
            label="Max memory (GB)"
            aria-label="Max memory (GB)"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={form.max_memory_gb}
            onChange={(e) => setField("max_memory_gb", e.target.value)}
          />
          <ModernInput
            label="Max storage (GB)"
            aria-label="Max storage (GB)"
            type="number"
            min={1}
            placeholder="Unlimited"
            value={form.max_storage_gb}
            onChange={(e) => setField("max_storage_gb", e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6 pt-1">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setField("is_active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Active (available for purchase)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.is_public}
              onChange={(e) => setField("is_public", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Public (visible to customers)
          </label>
        </div>
      </div>
    </ModernModal>
  );
};

export default SubscriptionPlanModal;
