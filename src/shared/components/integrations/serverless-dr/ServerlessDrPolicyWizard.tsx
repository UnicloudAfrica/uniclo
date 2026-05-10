import React, { useMemo, useState } from "react";
import {
  StoryStep,
  SuccessMoment,
  StatusBadge,
  FriendlyTooltip,
  RESILIENCE,
} from "@/shared/components/orbit";
import { useCreateServerlessDrPolicy } from "@/shared/hooks/resources/serverlessDrHooks";
import { useFetchExternalEndpoints } from "@/shared/hooks/resources";
import type { ExternalEndpoint } from "@/shared/hooks/resources/externalEndpointHooks";

/**
 * ServerlessDrPolicyWizard — friendly 4-step flow for setting up a new
 * Serverless DR policy.
 *
 * The pattern mirrors VmEndpointWizard:
 *   1. Name & describe   — what to call it + why it exists
 *   2. Pick the workloads — which VMs / endpoints get protected
 *   3. RPO / RTO targets  — how-much-data and how-fast (with FriendlyTooltip)
 *   4. Review & save      — final summary, then SuccessMoment
 *
 * On success: navigate to the policy detail page so the user can activate it.
 */

export interface ServerlessDrPolicyWizardProps {
  onSuccess: (createdId: string) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  description: string;
  syncIntervalMin: number;
  rpoTargetMin: number;
  rtoTargetMin: number;
  selectedSourceIds: string[];
}

const INITIAL_FORM: FormState = {
  name: "",
  description: "",
  syncIntervalMin: 15,
  rpoTargetMin: 30,
  rtoTargetMin: 60,
  selectedSourceIds: [],
};

const SYNC_PRESETS = [
  { value: 5, label: "Every 5 min", blurb: "Tightest sync — best RPO, highest cost" },
  { value: 15, label: "Every 15 min", blurb: "Good balance for most workloads" },
  { value: 60, label: "Every hour", blurb: "Lower cost — RPO up to 1 hour" },
  { value: 240, label: "Every 4 hours", blurb: "For low-priority workloads" },
];

export function ServerlessDrPolicyWizard({
  onSuccess,
  onCancel,
}: ServerlessDrPolicyWizardProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const create = useCreateServerlessDrPolicy();
  const { data: endpointsData } = useFetchExternalEndpoints({ extra: { per_page: 200 } });
  const endpoints = useMemo<ExternalEndpoint[]>(
    () => (Array.isArray(endpointsData) ? endpointsData : []),
    [endpointsData],
  );

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 1:
        return form.name.trim().length >= 1;
      case 2:
        return form.selectedSourceIds.length >= 1;
      case 3:
        return (
          form.syncIntervalMin > 0 &&
          form.rpoTargetMin > 0 &&
          form.rtoTargetMin > 0
        );
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, form]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    const created = (await create.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || null,
      replication_interval_minutes: form.syncIntervalMin,
      rpo_target_minutes: form.rpoTargetMin,
      rto_target_minutes: form.rtoTargetMin,
      source_endpoint_ids: form.selectedSourceIds,
    } as unknown as Parameters<typeof create.mutateAsync>[0])) as unknown as {
      identifier: string;
    };
    setCreatedId(created.identifier);
  };

  const toggleSource = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedSourceIds: f.selectedSourceIds.includes(id)
        ? f.selectedSourceIds.filter((x) => x !== id)
        : [...f.selectedSourceIds, id],
    }));
  };

  return (
    <>
      {/* Step 1: name + description */}
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={4}
          title="What should we call this safety net?"
          blurb="A name you'll recognise, plus a short note for your team. Something like 'Production web tier — DR' or 'Finance DB — nightly DR'."
          illustration={<span aria-hidden="true" className="text-7xl">🛟</span>}
          onBack={onCancel}
          backLabel="Cancel"
          onNext={goNext}
          nextDisabled={!stepIsValid}
          reassurance="You can rename it later — this isn't permanent."
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                A name
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                autoFocus
                maxLength={255}
                placeholder="e.g. Production web tier — DR"
                aria-label="Policy name"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                A note (optional)
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                maxLength={500}
                placeholder="What's special about this DR plan? Anyone reading this should know what it covers."
                aria-label="Policy description"
                className="mt-1.5 block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>
          </div>
        </StoryStep>
      )}

      {/* Step 2: pick workloads */}
      {step === 2 && (
        <StoryStep
          stepNumber={2}
          totalSteps={4}
          title="Which servers should this protect?"
          blurb="Pick the source servers you want covered. We'll mirror them quietly to a sleeping backup — boots up only if disaster strikes."
          illustration={<span aria-hidden="true" className="text-7xl">🖥️</span>}
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
          reassurance="You can add or remove servers from this policy later."
        >
          {endpoints.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-surface-card p-8 text-center dark:border-gray-700">
              <span aria-hidden="true" className="text-4xl">🛰️</span>
              <p className="mt-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                No source servers connected yet
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                You'll need at least one connected source endpoint to set up DR.
                Connect one first, then come back here.
              </p>
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Source endpoints to protect</legend>
              {endpoints.map((ep) => {
                const checked = form.selectedSourceIds.includes(ep.identifier);
                return (
                  <label
                    key={ep.identifier}
                    className={[
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                      checked
                        ? "border-primary-500 bg-primary-500/5 shadow-sm dark:bg-primary-500/10"
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSource(ep.identifier)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {ep.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        {ep.host}
                        {ep.port ? `:${ep.port}` : ""} · {ep.provider ?? "unknown provider"} ·{" "}
                        {ep.resource_type}
                      </p>
                    </div>
                    {checked && (
                      <StatusBadge tone="success" label="Selected" friendlyLabel="In the plan" size="sm" />
                    )}
                  </label>
                );
              })}
            </fieldset>
          )}
        </StoryStep>
      )}

      {/* Step 3: RPO + RTO + sync interval */}
      {step === 3 && (
        <StoryStep
          stepNumber={3}
          totalSteps={4}
          title="How fresh should the backup stay?"
          blurb="Two numbers shape your safety net: how often we sync (sets your worst-case data loss) and how fast we boot the backup (sets your downtime if disaster hits)."
          illustration={<span aria-hidden="true" className="text-7xl">⏱️</span>}
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="space-y-5">
            {/* Sync interval — preset chips + custom */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How often should we sync?{" "}
                <FriendlyTooltip
                  mode="icon"
                  definition="Tighter intervals = less data lost if disaster strikes (lower RPO), but slightly higher cost. Most workloads do fine with 15 minutes."
                />
              </legend>
              <div
                role="radiogroup"
                aria-label="Sync interval"
                className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
              >
                {SYNC_PRESETS.map((p) => {
                  const selected = form.syncIntervalMin === p.value;
                  return (
                    <button
                      type="button"
                      key={p.value}
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setForm({ ...form, syncIntervalMin: p.value })}
                      className={[
                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/40",
                        selected
                          ? "border-primary-500 bg-primary-500/5 shadow-sm dark:bg-primary-500/10"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
                      ].join(" ")}
                    >
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {p.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {p.blurb}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* RPO + RTO targets */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Worst-case data loss (
                  <FriendlyTooltip
                    mode="inline"
                    term="RPO"
                    definition="Recovery Point Objective — how many minutes of data you can afford to lose if disaster hits. Lower = better, costs more."
                  />
                  ) — minutes
                </span>
                <input
                  type="number"
                  value={form.rpoTargetMin}
                  onChange={(e) =>
                    setForm({ ...form, rpoTargetMin: parseInt(e.target.value, 10) || 1 })
                  }
                  min={1}
                  max={1440}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recovery time (
                  <FriendlyTooltip
                    mode="inline"
                    term="RTO"
                    definition="Recovery Time Objective — how many minutes you can be down before your backup must take over. Lower = faster boot, costs more."
                  />
                  ) — minutes
                </span>
                <input
                  type="number"
                  value={form.rtoTargetMin}
                  onChange={(e) =>
                    setForm({ ...form, rtoTargetMin: parseInt(e.target.value, 10) || 1 })
                  }
                  min={1}
                  max={1440}
                  className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
            </div>
          </div>
        </StoryStep>
      )}

      {/* Step 4: review */}
      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={4}
          title="One last look — does this look right?"
          blurb={`We'll save your policy as a draft. ${RESILIENCE} won't actually start syncing until you activate it on the next page.`}
          illustration={<span aria-hidden="true" className="text-7xl">✅</span>}
          onBack={goBack}
          onNext={async () => {
            await submit();
          }}
          isFinalStep
          nextLabel="Save it"
          reassurance="No syncing happens yet — you'll activate it on the next page."
        >
          <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-surface-card text-sm dark:divide-gray-800 dark:border-gray-800">
            <ReviewRow label="Name" value={form.name} />
            {form.description && <ReviewRow label="Note" value={form.description} multiline />}
            <ReviewRow
              label="Servers"
              value={`${form.selectedSourceIds.length} selected`}
            />
            <ReviewRow label="Sync every" value={`${form.syncIntervalMin} min`} />
            <ReviewRow label="Worst-case data loss" value={`${form.rpoTargetMin} min (RPO target)`} />
            <ReviewRow label="Recovery time" value={`${form.rtoTargetMin} min (RTO target)`} />
          </dl>
        </StoryStep>
      )}

      {/* Celebration */}
      <SuccessMoment
        open={Boolean(createdId)}
        onClose={() => createdId && onSuccess(createdId)}
        title="Saved as a draft!"
        body={`Your safety net is set up. Activate it on the next page to start mirroring your servers — until then, ${RESILIENCE} is just sitting tight.`}
        primaryCta={{
          label: "Open the policy",
          onClick: () => createdId && onSuccess(createdId),
        }}
      />
    </>
  );
}

function ReviewRow({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd
        className={[
          "min-w-0 flex-1 text-sm text-gray-900 dark:text-gray-100",
          multiline ? "whitespace-pre-wrap" : "truncate",
        ].join(" ")}
      >
        {value || <span className="text-gray-400">—</span>}
      </dd>
    </div>
  );
}

export default ServerlessDrPolicyWizard;
