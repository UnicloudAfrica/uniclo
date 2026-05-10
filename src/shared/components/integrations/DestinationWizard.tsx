import React, { useMemo, useState } from "react";
import {
  StoryStep,
  SuccessMoment,
} from "@/shared/components/orbit";
import DestinationConfigFields from "./DestinationConfigFields";
import {
  DESTINATION_TYPE_LABELS,
  useCreateDestination,
  type DestinationType,
} from "@/shared/hooks/resources/integrationHooks";
import ToastUtils from "@/utils/toastUtil";

/**
 * DestinationWizard — friendly 4-step flow for telling {RESILIENCE}
 * where backups should land. Replaces `CreateDestinationModal` per
 * RES-162 (the modal had 5 fields + a provider-specific sub-form,
 * failing the modal-vs-wizard rule).
 *
 * Steps:
 *   1. Pick the storage kind (S3, SSH, Azure Blob, GCS, Swift, …)
 *   2. Name + region pair (where data lives → where backup goes)
 *   3. Connection settings (provider-specific config sub-form)
 *   4. Review + save; SuccessMoment on success
 */

type AnyRecord = Record<string, unknown>;

export interface DestinationWizardProps {
  integrationKey?: string;
  onSuccess: (createdId: string | undefined) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  destinationType: DestinationType | "";
  sourceRegion: string;
  targetRegion: string;
  isDefault: boolean;
  config: AnyRecord;
}

const INITIAL_FORM: FormState = {
  name: "",
  destinationType: "",
  sourceRegion: "",
  targetRegion: "",
  isDefault: false,
  config: {},
};

// Friendly summaries paired with the technical label so the picker
// reads like a value menu, not a protocol cheat-sheet.
const TYPE_DESCRIPTIONS: Record<DestinationType, { emoji: string; tagline: string }> = {
  s3: { emoji: "🪣", tagline: "AWS S3 or any S3-compatible bucket. Most common pick." },
  object_storage: { emoji: "🗄", tagline: "S3-compatible object storage (MinIO, Wasabi, Backblaze B2, etc.)." },
  ssh: { emoji: "🖥️", tagline: "Another server you own. We rsync over SSH." },
  swift: { emoji: "☁️", tagline: "OpenStack Swift containers." },
  azure_blob: { emoji: "🔷", tagline: "Azure Blob Storage." },
  gcs: { emoji: "🟢", tagline: "Google Cloud Storage." },
};

export function DestinationWizard({
  integrationKey = "anycloudflow",
  onSuccess,
  onCancel,
}: DestinationWizardProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [createdId, setCreatedId] = useState<string | undefined>(undefined);
  const create = useCreateDestination();

  // Required-field check for the chosen destination type — we mirror
  // DestinationConfigFields' own rules so the wizard can disable Next
  // until the user has filled the mandatory bits.
  const requiredKeys = useMemo<string[]>(() => {
    if (!form.destinationType) return [];
    // Mirror the FIELDS_BY_TYPE table in DestinationConfigFields.
    // Keep this list intentionally short — only the truly mandatory
    // keys; optional ones are validated server-side.
    const required: Record<DestinationType, string[]> = {
      s3: ["bucket", "endpoint", "access_key", "secret_key"],
      object_storage: ["endpoint", "access_key", "secret_key", "bucket"],
      ssh: ["host", "username", "path"],
      swift: ["auth_url", "username", "password", "container"],
      azure_blob: ["account_name", "container"],
      gcs: ["project_id", "bucket"],
    };
    return required[form.destinationType] ?? [];
  }, [form.destinationType]);

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(form.destinationType);
      case 2:
        return (
          form.name.trim().length >= 2 &&
          form.sourceRegion.trim().length > 0 &&
          form.targetRegion.trim().length > 0
        );
      case 3:
        return requiredKeys.every((k) => {
          const v = form.config[k];
          return typeof v === "string" && v.trim().length > 0;
        });
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, form, requiredKeys]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    try {
      const result = await create.mutateAsync({
        integrationKey,
        data: {
          name: form.name.trim(),
          destination_type: form.destinationType,
          source_region: form.sourceRegion.trim(),
          target_region: form.targetRegion.trim(),
          is_default: form.isDefault,
          config: form.config,
        },
      });
      const id =
        ((result as { id?: string | number })?.id as string | undefined) ??
        ((result as { identifier?: string })?.identifier as string | undefined);
      setCreatedId(id ? String(id) : undefined);
    } catch (err) {
      ToastUtils.error(err instanceof Error ? err.message : "Couldn't save destination");
    }
  };

  const TYPES = (Object.entries(DESTINATION_TYPE_LABELS) as [DestinationType, string][]).map(
    ([value, label]) => ({ value, label, ...TYPE_DESCRIPTIONS[value] }),
  );

  return (
    <div className="space-y-4">
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={4}
          title="Where should backups land?"
          blurb="Pick the kind of storage. You can add as many destinations as you like — each one can serve different regions or different schedules."
          onBack={onCancel}
          backLabel="Cancel"
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {TYPES.map((t) => {
              const isSelected = form.destinationType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, destinationType: t.value, config: {} })
                  }
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                      : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span aria-hidden="true">{t.emoji}</span>
                    {t.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.tagline}</p>
                </button>
              );
            })}
          </div>
        </StoryStep>
      )}

      {step === 2 && (
        <StoryStep
          stepNumber={2}
          totalSteps={4}
          title="Give it a name and tell us the regions"
          blurb="A short, friendly name to recognise this destination later. Then where the source data lives, and where this destination is."
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Friendly name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lagos S3 Backup"
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Just for you — pick something you'll recognise on a Friday afternoon at 5pm.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Source region
                </label>
                <input
                  type="text"
                  value={form.sourceRegion}
                  onChange={(e) => setForm({ ...form, sourceRegion: e.target.value })}
                  placeholder="e.g. lagos-1"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Where your data lives today.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Target region
                </label>
                <input
                  type="text"
                  value={form.targetRegion}
                  onChange={(e) => setForm({ ...form, targetRegion: e.target.value })}
                  placeholder="e.g. nobus-region-1"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                  Where this destination is — usually a different region for resilience.
                </p>
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                className="mt-0.5"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Use this as the default destination for{" "}
                <span className="font-mono">{form.sourceRegion || "<region>"}</span>.{" "}
                <span className="text-gray-500 dark:text-gray-400">
                  Any new backups in that region will land here unless you pick somewhere else.
                </span>
              </span>
            </label>
          </div>
        </StoryStep>
      )}

      {step === 3 && form.destinationType && (
        <StoryStep
          stepNumber={3}
          totalSteps={4}
          title="Connection details"
          blurb="The credentials and settings we need to write to this destination. We never log secrets — they're stored encrypted and only used at backup time."
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <DestinationConfigFields
            type={form.destinationType}
            config={form.config}
            onChange={(config) => setForm({ ...form, config })}
          />
        </StoryStep>
      )}

      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={4}
          title="Last look — does this look right?"
          blurb="Review the destination. After you save, your next backup will start landing here."
          onBack={goBack}
          onNext={submit}
          nextDisabled={create.isPending}
          nextLabel={create.isPending ? "Saving destination…" : "Save destination"}
          isFinalStep
          reassurance="You can edit, test, or delete this destination any time from the list."
        >
          <dl className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Name</dt>
              <dd className="text-gray-900 dark:text-gray-100">{form.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Kind</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {form.destinationType ? DESTINATION_TYPE_LABELS[form.destinationType] : "—"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Source → Target</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100">
                {form.sourceRegion} → {form.targetRegion}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Default for region?</dt>
              <dd className="text-gray-900 dark:text-gray-100">{form.isDefault ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </StoryStep>
      )}

      <SuccessMoment
        open={createdId !== undefined}
        onClose={() => onSuccess(createdId)}
        title="Destination saved!"
        body="Your next backup in this region will land here. Want to test the connection? Open the destination on the list page and hit Test."
        primaryCta={{
          label: "Back to destinations",
          onClick: () => onSuccess(createdId),
        }}
      />
    </div>
  );
}

export default DestinationWizard;
