import React, { useEffect, useMemo, useState } from "react";
import { StoryStep, SuccessMoment, RESILIENCE } from "@/shared/components/orbit";
import {
  useFetchDestinations,
  DESTINATION_TYPE_LABELS,
  type IntegrationDestination,
} from "@/shared/hooks/resources/integrationHooks";

/**
 * BackupConfigWizard — friendly 4-step flow for turning on safety
 * backups for a resource. Replaces `BackupConfigModal` per RES-162
 * (the old modal had 4 fields plus a destination dependency check —
 * solidly past the modal-vs-wizard threshold).
 *
 * Steps:
 *   1. Where should backups land? (destination picker, with empty-state guard)
 *   2. How often? (schedule)
 *   3. Full or just-the-changes? (backup type)
 *   4. How long to keep them? (retention) + review + start
 *
 * The component is unopinionated about routing: it accepts an
 * `onSubmit` callback that receives the final config, plus an
 * `onCancel` callback. The page wrapper decides what happens next
 * (typically: invoke the parent resource's enable-backup mutation
 * then navigate back to the resource's protection tab).
 */

export interface BackupConfig {
  name?: string;
  schedule_type: string;
  cron_expression?: string;
  schedule_time?: string;
  schedule_day_of_week?: number;
  schedule_day_of_month?: number;
  backup_type: string;
  retention_days: number;
  immutable_days?: number;
  destination_id?: number;
  destination_ids?: number[];
  include_paths?: string[];
  exclude_paths?: string[];
  include_databases?: boolean;
  pre_backup_script?: string;
  post_backup_script?: string;
  compression?: boolean;
  encryption?: boolean;
}

export interface BackupConfigWizardProps {
  resourceName?: string;
  resourceRegion?: string;
  integrationKey?: string;
  isSubmitting?: boolean;
  initialConfig?: Partial<BackupConfig>;
  mode?: "create" | "edit";
  onSubmit: (config: BackupConfig) => void;
  onCancel: () => void;
}

interface FormState {
  name: string;
  scheduleType: string;
  backupType: string;
  retentionDays: number;
  immutableDays: number;
  destinationIds: number[];
  includePaths: string;
  excludePaths: string;
  includeDatabases: boolean;
  preBackupScript: string;
  postBackupScript: string;
  compression: boolean;
  encryption: boolean;
}

const SCHEDULE_OPTIONS = [
  {
    value: "daily",
    label: "Daily",
    cron: "0 2 * * *",
    description: "Every day at 2:00 AM",
    emoji: "🌙",
  },
  {
    value: "weekly",
    label: "Weekly",
    cron: "0 2 * * 0",
    description: "Every Sunday at 2:00 AM",
    emoji: "📅",
  },
  {
    value: "hourly",
    label: "Hourly",
    cron: "0 * * * *",
    description: "Every hour on the hour",
    emoji: "⏱️",
  },
];

const BACKUP_TYPE_OPTIONS = [
  {
    value: "full",
    label: "Full backup",
    desc: "A complete copy each time. Bigger storage footprint, simplest to restore.",
    emoji: "📦",
  },
  {
    value: "incremental",
    label: "Just-the-changes (incremental)",
    desc: "Only what changed since the last backup. Smaller, faster, restores chain together.",
    emoji: "🧩",
  },
  {
    value: "differential",
    label: "Since-last-full (differential)",
    desc: "Everything changed since the last full backup. Larger than incremental, simpler chain.",
    emoji: "🧭",
  },
];

const RETENTION_OPTIONS = [
  { value: 7, label: "7 days", helper: "Short — for fast-changing data with low compliance need." },
  { value: 14, label: "14 days", helper: "Two-week window for typical workloads." },
  { value: 30, label: "30 days", helper: "Default — covers a calendar month of recovery points." },
  { value: 90, label: "90 days", helper: "Quarter-long retention; useful for reporting cycles." },
];

const INITIAL_FORM: FormState = {
  name: "",
  scheduleType: "daily",
  backupType: "full",
  retentionDays: 30,
  immutableDays: 0,
  destinationIds: [],
  includePaths: "",
  excludePaths: "",
  includeDatabases: false,
  preBackupScript: "",
  postBackupScript: "",
  compression: true,
  encryption: true,
};

export function BackupConfigWizard({
  resourceName,
  resourceRegion,
  integrationKey = "anycloudflow",
  isSubmitting = false,
  initialConfig,
  mode = "create",
  onSubmit,
  onCancel,
}: BackupConfigWizardProps): React.JSX.Element {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const { data: allDestinations = [], isLoading: loadingDestinations } =
    useFetchDestinations(integrationKey);

  const activeDestinations = (allDestinations as IntegrationDestination[]).filter(
    (d) => d.is_active
  );
  const regionDestinations = useMemo(
    () =>
      resourceRegion
        ? activeDestinations.filter((d) => d.source_region === resourceRegion)
        : activeDestinations,
    [activeDestinations, resourceRegion]
  );
  const otherRegionDestinations = useMemo(
    () =>
      resourceRegion ? activeDestinations.filter((d) => d.source_region !== resourceRegion) : [],
    [activeDestinations, resourceRegion]
  );
  const defaultDest = regionDestinations.find((d) => d.is_default);

  useEffect(() => {
    if (!initialConfig) return;

    setForm({
      name: initialConfig.name ?? "",
      scheduleType: initialConfig.schedule_type ?? "daily",
      backupType: initialConfig.backup_type ?? "full",
      retentionDays: initialConfig.retention_days ?? 30,
      immutableDays: initialConfig.immutable_days ?? 0,
      destinationIds: initialConfig.destination_ids ?? [],
      includePaths: (initialConfig.include_paths ?? []).join("\n"),
      excludePaths: (initialConfig.exclude_paths ?? []).join("\n"),
      includeDatabases: Boolean(initialConfig.include_databases),
      preBackupScript: initialConfig.pre_backup_script ?? "",
      postBackupScript: initialConfig.post_backup_script ?? "",
      compression: initialConfig.compression ?? true,
      encryption: initialConfig.encryption ?? true,
    });
  }, [initialConfig]);

  // Pre-select the region default once we have data.
  useEffect(() => {
    if (mode === "create" && defaultDest && form.destinationIds.length === 0) {
      setForm((f) => ({ ...f, destinationIds: [defaultDest.id] }));
    }
  }, [defaultDest, form.destinationIds.length, mode]);

  const noDestinations = !loadingDestinations && regionDestinations.length === 0;
  const selectedDestinations = activeDestinations.filter((d) => form.destinationIds.includes(d.id));
  const selectedSchedule = SCHEDULE_OPTIONS.find((s) => s.value === form.scheduleType);

  const stepIsValid = useMemo(() => {
    switch (step) {
      case 1:
        return form.destinationIds.length > 0;
      case 2:
        return Boolean(form.scheduleType);
      case 3:
        return Boolean(form.backupType);
      case 4:
        return form.retentionDays > 0;
      default:
        return false;
    }
  }, [step, form]);

  const goNext = () => setStep((s) => Math.min(s + 1, 4));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));
  const toggleDestination = (id: number) => {
    setForm((current) => ({
      ...current,
      destinationIds: current.destinationIds.includes(id)
        ? current.destinationIds.filter((existing) => existing !== id)
        : [...current.destinationIds, id],
    }));
  };
  const lines = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const submit = () => {
    onSubmit({
      name: form.name.trim() || undefined,
      schedule_type: form.scheduleType,
      cron_expression: selectedSchedule?.cron,
      schedule_time: "02:00",
      backup_type: form.backupType,
      retention_days: form.retentionDays,
      immutable_days: form.immutableDays || undefined,
      destination_id: form.destinationIds[0],
      destination_ids: form.destinationIds,
      include_paths: lines(form.includePaths),
      exclude_paths: lines(form.excludePaths),
      include_databases: form.includeDatabases,
      pre_backup_script: form.preBackupScript.trim() || undefined,
      post_backup_script: form.postBackupScript.trim() || undefined,
      compression: form.compression,
      encryption: form.encryption,
    });
    setSubmitted(true);
  };

  // Empty-destination guard
  if (noDestinations) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-warning-200 bg-warning-50 p-8 text-center dark:border-warning-800/40 dark:bg-warning-900/10">
          <span aria-hidden="true" className="text-5xl">
            📍
          </span>
          <h2 className="mt-3 text-lg font-bold text-warning-900 dark:text-warning-100">
            Pick a place for backups first
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-warning-800 dark:text-warning-200">
            Before {RESILIENCE} can back this up, it needs somewhere to put the bytes — an S3
            bucket, an SFTP server, an Azure container, anywhere you trust. Add a destination and
            come back.
            {resourceRegion ? (
              <>
                {" "}
                You currently have <strong>0</strong> active destinations tagged for region{" "}
                <span className="font-mono">{resourceRegion}</span>.
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="mt-5 inline-flex items-center rounded-lg bg-warning-600 px-4 py-2 text-sm font-semibold text-white hover:bg-warning-700"
          >
            Take me to destinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {step === 1 && (
        <StoryStep
          stepNumber={1}
          totalSteps={4}
          title="Where should the backups live?"
          blurb={
            resourceName
              ? `Pick a destination for ${resourceName}'s backups. The default for this region is selected if you've set one.`
              : "Pick a destination. The default for this region is selected if you've set one."
          }
          onBack={onCancel}
          backLabel="Cancel"
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          {loadingDestinations ? (
            <div className="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Policy name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={resourceName ? `${resourceName} backup policy` : "Backup policy"}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {regionDestinations.map((d) => {
                  const isSelected = form.destinationIds.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDestination(d.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                          : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {d.name}
                        {d.is_default && (
                          <span className="ml-2 rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-semibold text-success-700 dark:bg-success-900/30 dark:text-success-300">
                            Default
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {DESTINATION_TYPE_LABELS[d.destination_type] ?? d.destination_type} →{" "}
                        <span className="font-mono">{d.target_region}</span>
                      </p>
                    </button>
                  );
                })}
              </div>

              {otherRegionDestinations.length > 0 && (
                <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50">
                  <summary className="cursor-pointer text-gray-700 dark:text-gray-300">
                    Or use a destination from a different region ({otherRegionDestinations.length})
                  </summary>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {otherRegionDestinations.map((d) => {
                      const isSelected = form.destinationIds.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDestination(d.id)}
                          className={`rounded-lg border p-3 text-left transition-all ${
                            isSelected
                              ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500"
                              : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900"
                          }`}
                        >
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {d.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{d.source_region}</span> →{" "}
                            <span className="font-mono">{d.target_region}</span>
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          )}
        </StoryStep>
      )}

      {step === 2 && (
        <StoryStep
          stepNumber={2}
          totalSteps={4}
          title="How often should we back up?"
          blurb="More often = smaller blast radius if something goes wrong. Less often = lower storage cost. Daily is the right call for most things."
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {SCHEDULE_OPTIONS.map((opt) => {
              const isSelected = form.scheduleType === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, scheduleType: opt.value })}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    isSelected
                      ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                      : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                  }`}
                >
                  <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span aria-hidden="true">{opt.emoji}</span>
                    {opt.label}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </StoryStep>
      )}

      {step === 3 && (
        <StoryStep
          stepNumber={3}
          totalSteps={4}
          title="Full backups or just the changes?"
          blurb="Full = complete copy every time, easy to restore but big. Incremental = only what's new, much smaller, but the chain has to be intact to restore."
          onBack={goBack}
          onNext={goNext}
          nextDisabled={!stepIsValid}
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {BACKUP_TYPE_OPTIONS.map((opt) => {
                const isSelected = form.backupType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, backupType: opt.value })}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                        : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                    }`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      <span aria-hidden="true">{opt.emoji}</span>
                      {opt.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="checkbox"
                  checked={form.includeDatabases}
                  onChange={(e) => setForm({ ...form, includeDatabases: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">
                    Include databases
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Ask AnyCloudFlow to include database-aware dumps when the source supports them.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="checkbox"
                  checked={form.encryption}
                  onChange={(e) => setForm({ ...form, encryption: e.target.checked })}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-semibold text-gray-900 dark:text-gray-100">
                    Encrypt backups
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Keep backup data encrypted at rest.
                  </span>
                </span>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Include paths
                </label>
                <textarea
                  value={form.includePaths}
                  onChange={(e) => setForm({ ...form, includePaths: e.target.value })}
                  rows={3}
                  placeholder="/var/www&#10;/etc/nginx"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Exclude paths
                </label>
                <textarea
                  value={form.excludePaths}
                  onChange={(e) => setForm({ ...form, excludePaths: e.target.value })}
                  rows={3}
                  placeholder="/tmp&#10;/var/cache"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <details className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-800/50">
              <summary className="cursor-pointer text-gray-700 dark:text-gray-300">
                Pre and post backup scripts
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <textarea
                  value={form.preBackupScript}
                  onChange={(e) => setForm({ ...form, preBackupScript: e.target.value })}
                  rows={3}
                  placeholder="pre-backup script"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <textarea
                  value={form.postBackupScript}
                  onChange={(e) => setForm({ ...form, postBackupScript: e.target.value })}
                  rows={3}
                  placeholder="post-backup script"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
              </div>
            </details>
          </div>
        </StoryStep>
      )}

      {step === 4 && (
        <StoryStep
          stepNumber={4}
          totalSteps={4}
          title="How long should we keep them?"
          blurb="After this window backups roll off automatically. Longer = more storage cost; shorter = less recovery runway."
          onBack={goBack}
          onNext={submit}
          nextDisabled={!stepIsValid || isSubmitting}
          nextLabel={
            isSubmitting ? "Saving…" : mode === "edit" ? "Save policy" : "Start backing up"
          }
          isFinalStep
          reassurance="You can change this later — it'll affect new backups, not ones already saved."
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {RETENTION_OPTIONS.map((opt) => {
                const isSelected = form.retentionDays === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, retentionDays: opt.value })}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:border-primary-400 dark:bg-primary-900/20"
                        : "border-gray-200 bg-white hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-primary-500"
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {opt.label}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{opt.helper}</p>
                  </button>
                );
              })}
            </div>

            <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-900">
              <input
                type="checkbox"
                checked={form.compression}
                onChange={(e) => setForm({ ...form, compression: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                <span className="block font-semibold text-gray-900 dark:text-gray-100">
                  Compress backups
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Reduce storage and transfer size before data leaves the source.
                </span>
              </span>
            </label>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                Immutable retention days
              </label>
              <input
                type="number"
                min={0}
                max={365}
                value={form.immutableDays}
                onChange={(e) => setForm({ ...form, immutableDays: Number(e.target.value) || 0 })}
                className="mt-1 w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set to 0 when the destination should control immutability itself.
              </p>
            </div>

            <dl className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600 dark:text-gray-400">Resource</dt>
                <dd className="text-gray-900 dark:text-gray-100">{resourceName ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600 dark:text-gray-400">Destination</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedDestinations.length > 0
                    ? selectedDestinations.map((destination) => destination.name).join(", ")
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600 dark:text-gray-400">Schedule</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedSchedule?.label ?? form.scheduleType}{" "}
                  <span className="text-gray-500">({selectedSchedule?.description})</span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600 dark:text-gray-400">Type</dt>
                <dd className="text-gray-900 dark:text-gray-100 capitalize">{form.backupType}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium text-gray-600 dark:text-gray-400">Retention</dt>
                <dd className="text-gray-900 dark:text-gray-100">{form.retentionDays} days</dd>
              </div>
            </dl>
          </div>
        </StoryStep>
      )}

      <SuccessMoment
        open={submitted && !isSubmitting}
        onClose={onCancel}
        title={mode === "edit" ? "Backup policy updated!" : "Backups turned on!"}
        body={
          mode === "edit"
            ? "Your backup policy changes are saved and will apply to the next run."
            : selectedSchedule?.value === "hourly"
              ? "Your first backup runs at the top of the next hour."
              : selectedSchedule?.value === "weekly"
                ? "Your first backup runs at the next Sunday 2:00 AM."
                : "Your first backup runs tonight at 2:00 AM."
        }
        primaryCta={{ label: "Got it", onClick: onCancel }}
      />
    </div>
  );
}

export default BackupConfigWizard;
