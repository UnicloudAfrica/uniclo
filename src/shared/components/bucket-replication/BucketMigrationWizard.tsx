import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  StoryStep,
  SuccessMoment,
  FriendlyTooltip,
  RESILIENCE,
} from "@/shared/components/orbit";
import { acfApi } from "../../../adminDashboard/pages/integrations/anycloudflow/api";
import { translateBucketError } from "../../../adminDashboard/pages/integrations/anycloudflow/bucketErrorTranslator";
import ToastUtils from "@/utils/toastUtil";

/**
 * BucketMigrationWizard — friendly 4-step flow for one-time bucket
 * copies. Replaces the inline `CreateMigrationModal` that used to sit
 * inside `BucketMigrationsPage`.
 *
 * The old modal flunked the modal-vs-wizard rule on every count:
 *   - 4 fields plus dependent validation (live = type-to-confirm + ack)
 *   - Provider mismatch warning that depends on both selects
 *   - Pricing preview that loads asynchronously
 *   - Destructive "live migration" branch that deserves its own page
 *
 * Steps:
 *   1. Pick the source bucket (the one with the live data)
 *   2. Pick the target bucket (warns on provider mismatch — Phase 3 only)
 *   3. Choose dry-run vs live; live requires type-to-confirm + egress ack
 *   4. Review + create; SuccessMoment on success, then navigate to detail
 */

interface BucketEndpoint {
  identifier: string;
  label: string;
  bucket_name: string;
  region?: string | null;
  provider?: string | null;
  preflight_passed_at?: string | null;
}

export interface BucketMigrationWizardProps {
  onSuccess: (createdId: string) => void;
  onCancel: () => void;
}

interface FormState {
  sourceId: string;
  targetId: string;
  dryRun: boolean;
  typedTarget: string;
  egressAcknowledged: boolean;
}

const INITIAL_FORM: FormState = {
  sourceId: "",
  targetId: "",
  dryRun: true,
  typedTarget: "",
  egressAcknowledged: false,
};

export function BucketMigrationWizard({
  onSuccess,
  onCancel,
}: BucketMigrationWizardProps): React.JSX.Element {
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

  // Only preflight-validated endpoints are eligible — same rule the
  // old modal enforced. We surface this in the empty state.
  const eligible = useMemo(
    () => endpoints.filter((e) => !!e.preflight_passed_at),
    [endpoints],
  );

  // Pricing preview is best-effort. Backend proxies to AcF service and
  // returns 404 when the downstream isn't deployed — `silent: true`
  // upstream means no toast spam, but we still hide the card so the
  // user doesn't see a half-broken "Pricing: $NaN/GB" message.
  const { data: pricingData } = useQuery({
    queryKey: ["acf-bucket-pricing", 1024],
    queryFn: () => acfApi.getBucketMigrationPricing(1024),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const pricing = (pricingData as { data?: Record<string, number> } | undefined)?.data
    ?? (pricingData as Record<string, number> | undefined);

  const source = eligible.find((e) => e.identifier === form.sourceId);
  const target = eligible.find((e) => e.identifier === form.targetId);
  const sameBucket = form.sourceId && form.sourceId === form.targetId;
  const providerMismatch = Boolean(
    source?.provider && target?.provider && source.provider !== target.provider,
  );
  const targetBucket = target?.bucket_name ?? "";
  const live = !form.dryRun;
  const typedCorrectly = !live || form.typedTarget === targetBucket;

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 1:
        return Boolean(form.sourceId);
      case 2:
        return Boolean(form.targetId) && !sameBucket && !providerMismatch;
      case 3:
        // dry-run is always valid; live requires both gates
        return form.dryRun || (form.egressAcknowledged && typedCorrectly && form.typedTarget.length > 0);
      case 4:
        return true;
      default:
        return false;
    }
  }, [step, form, sameBucket, providerMismatch, typedCorrectly]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  const create = useMutation({
    mutationFn: () =>
      acfApi.createBucketMigration({
        source_endpoint_identifier: form.sourceId,
        target_endpoint_identifier: form.targetId,
        dry_run: form.dryRun,
        confirm_target_bucket: form.dryRun ? undefined : form.typedTarget,
      }),
    onSuccess: (res: unknown) => {
      const id =
        ((res as { data?: { identifier?: string } })?.data?.identifier as string) ??
        ((res as { identifier?: string })?.identifier as string) ??
        `migration-${Date.now()}`;
      setCreatedId(id);
    },
    onError: (err: unknown) => ToastUtils.error(translateBucketError(err, "Migration creation failed")),
  });

  const submit = async () => {
    await create.mutateAsync();
  };

  // ── Empty-eligible-buckets guard ────────────────────────────────────
  if (eligible.length < 2) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-8 text-center dark:border-warning-800/40 dark:bg-warning-900/10">
          <span aria-hidden="true" className="text-5xl">🪣</span>
          <h2 className="mt-3 text-lg font-bold text-warning-900 dark:text-warning-100">
            You need two preflighted buckets first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-warning-800 dark:text-warning-200">
            Moving a bucket needs a source and a target — both must pass the preflight check
            so {RESILIENCE} knows the credentials work. You currently have{" "}
            <strong>{eligible.length}</strong> preflight-cleared bucket
            {eligible.length === 1 ? "" : "s"} connected.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 inline-flex items-center rounded-lg bg-warning-600 px-4 py-2 text-sm font-semibold text-white hover:bg-warning-700"
          >
            Take me to bucket endpoints
          </button>
        </div>
      </div>
    );
  }

  // (SuccessMoment overlays the wizard rather than replacing it —
  // see usage at the bottom of the render tree.)

  const endpointOption = (e: BucketEndpoint) => ({
    value: e.identifier,
    label: `${e.label} · ${e.bucket_name}${e.region ? ` (${e.region})` : ""}`,
  });

  return (
    <div className="space-y-4">
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={4}
          title="Where's the data right now?"
          blurb="Pick the bucket holding the live objects. Only buckets that passed our preflight credential check show up here."
          onBack={onCancel}
          backLabel="Cancel"
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {eligible.map((e) => {
              const isSelected = form.sourceId === e.identifier;
              return (
                <button
                  key={e.identifier}
                  type="button"
                  onClick={() => setForm({ ...form, sourceId: e.identifier })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                      : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{e.label}</p>
                  <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-300">{e.bucket_name}</p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    {e.provider ?? "—"} {e.region ? `· ${e.region}` : ""}
                  </p>
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
          title="Where should it land?"
          blurb="Pick the destination bucket. We'll warn you if anything obvious is off — like trying to copy across providers."
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {eligible
              .filter((e) => e.identifier !== form.sourceId)
              .map((e) => {
                const isSelected = form.targetId === e.identifier;
                return (
                  <button
                    key={e.identifier}
                    type="button"
                    onClick={() => setForm({ ...form, targetId: e.identifier })}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                        : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{e.label}</p>
                    <p className="mt-1 font-mono text-xs text-gray-600 dark:text-gray-300">{e.bucket_name}</p>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {e.provider ?? "—"} {e.region ? `· ${e.region}` : ""}
                    </p>
                  </button>
                );
              })}
          </div>

          {providerMismatch && (
            <div className="mt-4 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs text-danger-800 dark:border-danger-700/50 dark:bg-danger-900/20 dark:text-danger-200">
              <strong>Heads up:</strong> source and target are on different providers (
              {source?.provider} → {target?.provider}). Cross-provider migration is a Phase 3 feature
              and the API will reject this combination. Pick a target on the same provider as the source
              to continue.
            </div>
          )}

          {pricing && !providerMismatch && (
            <div className="mt-4 rounded-lg bg-primary-50 p-3 text-xs text-primary-900 dark:bg-primary-900/20 dark:text-primary-100">
              <strong>What it'll cost:</strong>{" "}
              ${(((pricing.rate_cents_per_gb ?? 1) as number) / 100).toFixed(3)}/GB transferred,{" "}
              ${(((pricing.minimum_cents ?? 500) as number) / 100).toFixed(2)} minimum per migration. A 1 TB
              run runs about ${(((pricing.estimated_cost_cents ?? 102400) as number) / 100).toFixed(2)}.
            </div>
          )}
        </StoryStep>
      )}

      {step === 3 && (
        <StoryStep
          stepNumber={3}
          totalSteps={4}
          title="Practice run or the real thing?"
          blurb="Dry-runs are free and copy nothing — they just produce an estimate. Live runs actually move bytes and you'll see your provider's egress charges on their bill."
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setForm({ ...form, dryRun: true, typedTarget: "", egressAcknowledged: false })}
              className={`rounded-xl border p-4 text-left transition-all ${
                form.dryRun
                  ? "border-success-500 bg-success-50 ring-1 ring-success-500 dark:border-success-400 dark:bg-success-900/20"
                  : "border-gray-200 bg-white hover:border-success-300 dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span aria-hidden="true">🔍</span> Dry-run first (recommended)
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Walk the source, count objects, estimate the cost. Nothing is copied. Free.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, dryRun: false })}
              className={`rounded-xl border p-4 text-left transition-all ${
                !form.dryRun
                  ? "border-warning-500 bg-warning-50 ring-1 ring-warning-500 dark:border-warning-400 dark:bg-warning-900/20"
                  : "border-gray-200 bg-white hover:border-warning-300 dark:border-gray-700 dark:bg-gray-900"
              }`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span aria-hidden="true">🚚</span> Live migration
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Copies objects for real. Charged per GB; provider egress is on their bill.
              </p>
            </button>
          </div>

          {live && (
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800 dark:border-warning-700/50 dark:bg-warning-900/20 dark:text-warning-200">
                <strong>About cloud-provider egress.</strong> {RESILIENCE} doesn't pass through your
                cloud provider's egress or request charges. Cross-region S3 typically runs ~$0.02/GB on
                the AWS bill; LIST/GET/PUT calls add ~$0.005 per 1,000 calls. That's separate from{" "}
                {RESILIENCE}'s migration fee.
              </div>

              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.egressAcknowledged}
                  onChange={(e) => setForm({ ...form, egressAcknowledged: e.target.checked })}
                  className="mt-0.5"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  I understand {RESILIENCE} isn't liable for my cloud provider's egress charges.
                </span>
              </label>

              <div>
                <label
                  htmlFor="bucket-migration-confirm-input"
                  className="block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Type the target bucket name to confirm —{" "}
                  <FriendlyTooltip
                    mode="inline"
                    term={<span className="font-mono font-bold underline decoration-dotted">{targetBucket || "bucket-name"}</span>}
                    definition="We make you type the destination bucket name so you can't accidentally start a live migration into the wrong target. The check is exact — copy/paste is fine."
                  />
                </label>
                <input
                  id="bucket-migration-confirm-input"
                  type="text"
                  value={form.typedTarget}
                  onChange={(e) => setForm({ ...form, typedTarget: e.target.value })}
                  placeholder={targetBucket}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                {form.typedTarget && !typedCorrectly && (
                  <p className="mt-1 text-xs text-danger-600">Doesn't match — type it exactly as shown.</p>
                )}
              </div>
            </div>
          )}
        </StoryStep>
      )}

      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={4}
          title="Last look — does this look right?"
          blurb="Review the plan and we'll kick it off. Dry-runs are reversible (cancellable any time); live runs you can pause and resume from the detail page."
          onBack={goBack}
          onNext={submit}
          nextDisabled={create.isPending}
          nextLabel={create.isPending ? "Sending it…" : form.dryRun ? "Start dry-run" : "Start live migration"}
          isFinalStep
          reassurance={
            form.dryRun
              ? "Nothing gets copied — we just count and estimate."
              : `${RESILIENCE} fees apply per GB; provider egress is separate.`
          }
        >
          <dl className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Source</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100">
                {source?.bucket_name ?? "—"} {source?.region ? `(${source.region})` : ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Target</dt>
              <dd className="font-mono text-gray-900 dark:text-gray-100">
                {target?.bucket_name ?? "—"} {target?.region ? `(${target.region})` : ""}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-600 dark:text-gray-400">Mode</dt>
              <dd className="text-gray-900 dark:text-gray-100">
                {form.dryRun ? "Dry-run (no objects copied)" : "Live migration"}
              </dd>
            </div>
          </dl>
        </StoryStep>
      )}

      <SuccessMoment
        open={Boolean(createdId)}
        onClose={() => createdId && onSuccess(createdId)}
        title={form.dryRun ? "Dry-run started!" : "Migration kicked off!"}
        body={
          form.dryRun
            ? "We're scanning the source — no objects are being copied. You'll see the estimate once it's done."
            : "Objects are streaming from source to target. We'll keep you posted on progress."
        }
        primaryCta={{
          label: form.dryRun ? "See the dry-run" : "Watch progress",
          onClick: () => createdId && onSuccess(createdId),
        }}
      />
    </div>
  );
}

export default BucketMigrationWizard;
