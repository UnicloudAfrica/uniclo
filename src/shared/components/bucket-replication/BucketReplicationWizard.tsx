import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  StoryStep,
  SuccessMoment,
  StatusBadge,
  FriendlyTooltip,
  RESILIENCE,
} from "@/shared/components/orbit";
import { acfApi } from "../../../adminDashboard/pages/integrations/anycloudflow/api";
import { translateBucketError } from "../../../adminDashboard/pages/integrations/anycloudflow/bucketErrorTranslator";
import ToastUtils from "@/utils/toastUtil";

/**
 * BucketReplicationWizard — friendly 4-step flow for setting up bucket
 * mirroring. Replaces the old 168-line modal. Lives at a real URL so
 * users can browser-back, bookmark, deep-link, and breathe.
 *
 * Steps:
 *   1. Pick a source bucket (the one with the live data)
 *   2. Pick a target bucket (the backup); warns same-region; gates GDPR
 *   3. Freshness + spending guardrails (RPO, bandwidth, monthly cap, change-feed mode)
 *   4. Name + review + create; SuccessMoment on success
 */

export interface BucketEndpoint {
  identifier: string;
  label: string;
  bucket_name: string;
  region?: string | null;
  preflight_passed_at?: string | null;
}

export interface BucketReplicationWizardProps {
  onSuccess: (createdId: string) => void;
  onCancel: () => void;
}

interface FormState {
  label: string;
  sourceId: string;
  targetId: string;
  rpoSeconds: number;
  bandwidthMbps: number | "";
  egressCapUsd: number | "";
  changeFeedSource: "polling" | "eventbridge_sqs";
  ackDpa: boolean;
}

const INITIAL_FORM: FormState = {
  label: "",
  sourceId: "",
  targetId: "",
  rpoSeconds: 300,
  bandwidthMbps: "",
  egressCapUsd: "",
  changeFeedSource: "polling",
  ackDpa: false,
};

export function BucketReplicationWizard({
  onSuccess,
  onCancel,
}: BucketReplicationWizardProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const { data: endpointsData } = useQuery({
    queryKey: ["acf-bucket-endpoints"],
    queryFn: () => acfApi.listBucketEndpoints(),
  });
  const endpoints: BucketEndpoint[] =
    ((endpointsData as { data?: unknown })?.data as BucketEndpoint[]) ??
    ((endpointsData as unknown) as BucketEndpoint[]) ??
    [];

  const source = endpoints.find((e) => e.identifier === form.sourceId);
  const target = endpoints.find((e) => e.identifier === form.targetId);
  const sameRegion = Boolean(source?.region && target?.region && source.region === target.region);
  const crossJurisdiction = Boolean(
    source?.region && target?.region && /^eu-/.test(source.region) !== /^eu-/.test(target.region),
  );
  const sameBucket = form.sourceId && form.sourceId === form.targetId;

  const bwMbps = form.bandwidthMbps === "" ? 0 : Number(form.bandwidthMbps);
  const bwTooLow = bwMbps > 0 && bwMbps < 128;

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(form.sourceId);
      case 2:
        return Boolean(form.targetId) && !sameBucket && (!crossJurisdiction || form.ackDpa);
      case 3:
        return form.rpoSeconds >= 30 && !bwTooLow;
      case 4:
        return form.label.trim().length >= 1;
      default:
        return false;
    }
  }, [step, form, sameBucket, crossJurisdiction, bwTooLow]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const create = useMutation({
    mutationFn: () =>
      acfApi.createBucketReplication({
        label: form.label.trim(),
        source_endpoint_id: form.sourceId,
        target_endpoint_id: form.targetId,
        conflict_policy: "reject_active_active",
        bandwidth_cap_mbps: form.bandwidthMbps === "" ? undefined : Number(form.bandwidthMbps),
        monthly_egress_cap_usd: form.egressCapUsd === "" ? undefined : Number(form.egressCapUsd),
        rpo_target_seconds: form.rpoSeconds,
        change_feed_source: form.changeFeedSource,
        data_sovereignty_ack_signed_at: form.ackDpa ? new Date().toISOString() : undefined,
      }),
    onSuccess: (res: unknown) => {
      const id =
        ((res as { data?: { identifier?: string } })?.data?.identifier as string) ??
        `replication-${Date.now()}`;
      setCreatedId(id);
    },
    onError: (err: unknown) => ToastUtils.error(translateBucketError(err, "Create failed")),
  });

  const submit = async () => {
    await create.mutateAsync();
  };

  // ── Empty-source-buckets guard ───────────────────────────────────────────
  if (endpoints.length < 2) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-8 text-center dark:border-warning-800/40 dark:bg-warning-900/10">
          <span aria-hidden="true" className="text-5xl">🪣</span>
          <h2 className="mt-3 text-lg font-bold text-warning-900 dark:text-warning-100">
            You need two buckets first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-warning-800 dark:text-warning-200">
            Mirroring needs a source bucket and a backup bucket. Right now you have{" "}
            <strong>{endpoints.length}</strong> connected. Connect at least one more, then come back.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 inline-flex items-center rounded-lg bg-warning-600 px-4 py-2 text-sm font-semibold text-white hover:bg-warning-700"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Step 1 — Pick source */}
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={4}
          title="Where's the live data?"
          blurb="Pick the bucket that has the data you care about — the one your apps write to today. We'll mirror everything in it to a backup in the next step."
          illustration={<span aria-hidden="true" className="text-7xl">📦</span>}
          onBack={onCancel}
          backLabel="Cancel"
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <BucketPicker
            buckets={endpoints}
            selectedId={form.sourceId}
            onSelect={(id) => setForm({ ...form, sourceId: id })}
            ariaLabel="Source bucket"
          />
        </StoryStep>
      )}

      {/* Step 2 — Pick target */}
      {step === 2 && (
        <StoryStep
          stepNumber={2}
          totalSteps={4}
          title="Where should the backup live?"
          blurb="Pick a different bucket — ideally in a different region, so a regional outage can't take both copies down at once."
          illustration={<span aria-hidden="true" className="text-7xl">🛟</span>}
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <BucketPicker
            buckets={endpoints.filter((e) => e.identifier !== form.sourceId)}
            selectedId={form.targetId}
            onSelect={(id) => setForm({ ...form, targetId: id, ackDpa: false })}
            ariaLabel="Target (backup) bucket"
          />

          {/* Live warnings */}
          {sameBucket && (
            <p className="mt-4 rounded-lg bg-danger-50 p-3 text-xs text-danger-800 dark:bg-danger-900/20 dark:text-danger-200">
              Source and backup need to be different buckets — otherwise we'd be copying a bucket onto itself.
            </p>
          )}
          {sameRegion && !sameBucket && (
            <p className="mt-4 rounded-lg bg-warning-50 p-3 text-xs text-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
              <strong>⚠️ Both buckets are in the same region.</strong> If that region goes down,
              both copies go down. Consider picking a backup in a different region for real
              disaster recovery.
            </p>
          )}
          {crossJurisdiction && (
            <div className="mt-4 space-y-2 rounded-lg bg-warning-50 p-3 text-xs text-warning-800 dark:bg-warning-900/20 dark:text-warning-200">
              <p className="font-semibold">⚠️ This crosses a data-sovereignty line</p>
              <p>
                The two buckets are in different jurisdictions (e.g. EU ↔ non-EU). That makes you
                the data processor under GDPR — make sure your team has a Data Processing
                Agreement and Standard Contractual Clauses signed with the customer before turning
                this on.
              </p>
              <label className="flex cursor-pointer items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  checked={form.ackDpa}
                  onChange={(e) => setForm({ ...form, ackDpa: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-warning-600 focus:ring-warning-500"
                />
                <span>Yes — we have a DPA and SCCs in place for this customer.</span>
              </label>
            </div>
          )}
        </StoryStep>
      )}

      {/* Step 3 — Freshness + guardrails */}
      {step === 3 && (
        <StoryStep
          stepNumber={3}
          totalSteps={4}
          title="How tight should the mirror be — and what's your spending ceiling?"
          blurb="Three knobs: how fresh the backup stays, how much network we're allowed to use, and a spending cap so a runaway sync can't hurt your bill."
          illustration={<span aria-hidden="true" className="text-7xl">⚙️</span>}
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="space-y-5">
            {/* RPO */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How fresh should the backup stay? (seconds)
              </span>
              <input
                type="number"
                min={30}
                value={form.rpoSeconds}
                onChange={(e) =>
                  setForm({ ...form, rpoSeconds: Math.max(30, Number(e.target.value) || 300) })
                }
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                The backup catches up every few seconds. This is the longest gap we'll tolerate
                before raising an alert. <strong>300s (5 minutes)</strong> is fine for most workloads.
              </p>
            </label>

            {/* Bandwidth */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Bandwidth limit (Mbps)
              </span>
              <input
                type="number"
                value={String(form.bandwidthMbps)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bandwidthMbps: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                placeholder="No limit"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Leave blank for no limit. Use <strong>128 Mbps</strong> or higher if you set one —
                anything less will stall the big-file copies.
              </p>
              {bwTooLow && (
                <p className="mt-1.5 text-xs text-danger-700 dark:text-danger-300">
                  That's too low — please use 128 Mbps or higher (or leave it blank).
                </p>
              )}
            </label>

            {/* Egress cap */}
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Monthly spending limit (USD)
              </span>
              <input
                type="number"
                value={String(form.egressCapUsd)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    egressCapUsd: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                placeholder="Leave blank for no limit"
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm tabular-nums text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set a $ ceiling so an unexpected spike can't run up your bill. We'll auto-pause
                the mirror if egress charges hit this number.
              </p>
            </label>

            {/* Change-feed source */}
            <fieldset>
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                How should we watch for changes?
              </legend>
              <div role="radiogroup" className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <ChangeFeedOption
                  selected={form.changeFeedSource === "polling"}
                  onClick={() => setForm({ ...form, changeFeedSource: "polling" })}
                  emoji="👀"
                  title="Polling"
                  blurb="Safe default — we check the source every few seconds. No setup needed."
                />
                <ChangeFeedOption
                  selected={form.changeFeedSource === "eventbridge_sqs"}
                  onClick={() => setForm({ ...form, changeFeedSource: "eventbridge_sqs" })}
                  emoji="⚡"
                  title="EventBridge + SQS"
                  blurb="Faster + cheaper at scale — but you'll need to set up AWS IAM roles."
                />
              </div>
            </fieldset>
          </div>
        </StoryStep>
      )}

      {/* Step 4 — Name + review */}
      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={4}
          title="Give it a name and we're done"
          blurb={`A name you'll recognise in the list. Then ${RESILIENCE} sets up the mirror — first it runs a preflight check, then mirroring kicks in.`}
          illustration={<span aria-hidden="true" className="text-7xl">✅</span>}
          onBack={goBack}
          isFinalStep
          nextLabel="Mirror this bucket"
          onNext={async () => {
            await submit();
          }}
          reassurance="$8/month per mirror, billed flat. Pausing doesn't refund this month — but stopping it before the next month does."
        >
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                A name for this mirror
              </span>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. prod-us-to-eu-backup"
                autoFocus
                className="mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </label>

            <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-surface-card text-sm dark:divide-gray-800 dark:border-gray-800">
              <ReviewRow
                label="Source"
                value={
                  source
                    ? `${source.label} (${source.bucket_name}${source.region ? ` · ${source.region}` : ""})`
                    : "—"
                }
              />
              <ReviewRow
                label="Backup target"
                value={
                  target
                    ? `${target.label} (${target.bucket_name}${target.region ? ` · ${target.region}` : ""})`
                    : "—"
                }
              />
              <ReviewRow label="Freshness target" value={`Within ${form.rpoSeconds}s`} />
              <ReviewRow
                label="Bandwidth"
                value={form.bandwidthMbps === "" ? "No limit" : `${form.bandwidthMbps} Mbps`}
              />
              <ReviewRow
                label="Spending cap"
                value={form.egressCapUsd === "" ? "No limit" : `$${form.egressCapUsd}/mo`}
              />
              <ReviewRow
                label="Change watcher"
                value={
                  form.changeFeedSource === "polling" ? "Polling (default)" : "EventBridge + SQS"
                }
              />
              <ReviewRow
                label="Conflict handling"
                value="Pause on conflict (safe default)"
              />
            </dl>

            {/* Friendly summary card */}
            <div className="space-y-1.5 rounded-lg bg-surface-alt p-3 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <p>
                <span className="mr-1.5" aria-hidden="true">🛡️</span>
                If both buckets get edited at once, we pause the mirror so you can resolve it.{" "}
                <FriendlyTooltip
                  mode="inline"
                  term="Auto-resolve modes"
                  definition="Source-wins, target-wins, last-write-wins, and manual-inbox modes are available once you turn on active-active replication — ask your engineer team if you need them."
                />
              </p>
              <p>
                <span className="mr-1.5" aria-hidden="true">🚦</span>
                After saving, the mirror runs a preflight check before going live — if the buckets
                aren't reachable or the IAM permissions are missing, you'll see what to fix.
              </p>
            </div>
          </div>
        </StoryStep>
      )}

      <SuccessMoment
        open={Boolean(createdId)}
        onClose={() => createdId && onSuccess(createdId)}
        title="Mirroring is set up!"
        body={`${RESILIENCE} is running the preflight now. Once it passes (usually a few seconds), the mirror goes live and changes start syncing automatically.`}
        primaryCta={{
          label: "Open the mirror",
          onClick: () => createdId && onSuccess(createdId),
        }}
      />
    </>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function BucketPicker({
  buckets,
  selectedId,
  onSelect,
  ariaLabel,
}: {
  buckets: BucketEndpoint[];
  selectedId: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <fieldset>
      <legend className="sr-only">{ariaLabel}</legend>
      <ul role="radiogroup" aria-label={ariaLabel} className="space-y-2">
        {buckets.map((b) => {
          const selected = selectedId === b.identifier;
          const ready = Boolean(b.preflight_passed_at);
          return (
            <li key={b.identifier}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(b.identifier)}
                className={[
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/40",
                  selected
                    ? "border-primary-500 bg-primary-500/5 shadow-sm dark:bg-primary-500/10"
                    : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
                ].join(" ")}
              >
                <span aria-hidden="true" className="text-2xl">
                  🪣
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {b.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {b.bucket_name}
                    {b.region && ` · ${b.region}`}
                  </p>
                </div>
                {ready ? (
                  <StatusBadge tone="success" label="Preflight passed" friendlyLabel="Ready" size="sm" />
                ) : (
                  <StatusBadge
                    tone="pending"
                    label="Preflight pending"
                    friendlyLabel="Not validated yet"
                    size="sm"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function ChangeFeedOption({
  selected,
  onClick,
  emoji,
  title,
  blurb,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  title: string;
  blurb: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={[
        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/40",
        selected
          ? "border-primary-500 bg-primary-500/5 shadow-sm dark:bg-primary-500/10"
          : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
      ].join(" ")}
    >
      <span aria-hidden="true" className="text-xl">
        {emoji}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400">{blurb}</span>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-44 shrink-0 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 truncate text-sm text-gray-900 dark:text-gray-100">{value}</dd>
    </div>
  );
}

export default BucketReplicationWizard;
