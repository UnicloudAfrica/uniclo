import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { ModernButton } from "@/shared/components/ui";
import { getStepsForTarget } from "../../../dashboard/onboarding/stepConfig";
import { fetchAdminOnboardingSubmission } from "@/hooks/adminHooks/onboardingReviewHooks";
import logger from "@/utils/logger";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

type Tone = "success" | "warning" | "danger" | "neutral";

const STATUS_TONES: Record<string, Tone> = {
  not_started: "neutral",
  draft: "neutral",
  submitted: "neutral",
  in_review: "warning",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
};

const TONE_PILL: Record<Tone, string> = {
  success:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const StatusPill = ({ label, tone }: { label: string; tone: Tone }) => (
  <span
    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${TONE_PILL[tone]}`}
  >
    {label}
  </span>
);

const formatDateTime = (value: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

interface OnboardingStep {
  id: string;
  label?: string;
  [key: string]: unknown;
}
interface StatusRecord {
  status: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}

const deriveProgressBuckets = (steps: OnboardingStep[], statuses: Record<string, StatusRecord>) => {
  return steps.reduce(
    (acc, step) => {
      const status = statuses[step.id]?.status ?? "not_started";

      if (status === "approved") {
        acc.completed += 1;
      } else if (
        status === "submitted" ||
        status === "in_review" ||
        status === "changes_requested"
      ) {
        acc.inProgress += 1;
      } else if (status === "rejected") {
        acc.escalated += 1;
      } else {
        acc.pending += 1;
      }

      return acc;
    },
    { completed: 0, inProgress: 0, pending: 0, escalated: 0 }
  );
};

interface OnboardingStatusBoardProps {
  persona?: string;
  target?: string;
  tenantId?: string;
  userId?: string;
  entityName?: string;
  contextName?: string;
  className?: string;
}

const OnboardingStatusBoard: React.FC<OnboardingStatusBoardProps> = ({
  persona,
  target,
  tenantId,
  userId,
  entityName,
  contextName,
  className = "",
}) => {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState<Record<string, StatusRecord>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const steps = useMemo(() => {
    const key = persona ?? target ?? "tenant";
    return getStepsForTarget(key) ?? [];
  }, [persona, target]);

  const hasValidSubject =
    target === "tenant"
      ? Boolean(tenantId)
      : target === "client"
        ? Boolean(userId)
        : Boolean(userId);

  useEffect(() => {
    if (!target || !hasValidSubject || steps.length === 0) {
      setStatuses({});
      setIsLoading(false);
      setError(null);
      return;
    }

    let isCancelled = false;

    const fetchStatuses = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const stepResults = await Promise.all(
          (steps as unknown as OnboardingStep[]).map(async (step) => {
            try {
              const { submission, meta } = await fetchAdminOnboardingSubmission({
                target,
                tenantId,
                userId,
                step: step.id,
              });

              return [
                step.id,
                {
                  status: submission?.status ?? meta?.status ?? "not_started",
                  submitted_at: submission?.submitted_at ?? null,
                  reviewed_at: submission?.reviewed_at ?? null,
                },
              ];
            } catch (stepError) {
              logger.error(`Failed to load onboarding submission for ${step.id}`, stepError);
              return [
                step.id,
                {
                  status: "not_started",
                  submitted_at: null,
                  reviewed_at: null,
                },
              ];
            }
          })
        );

        if (!isCancelled) {
          setStatuses(Object.fromEntries(stepResults));
        }
      } catch (fetchError: unknown) {
        if (!isCancelled) {
          logger.error("Failed to load onboarding submissions", fetchError);
          const message =
            fetchError instanceof Error ? fetchError.message : String(fetchError);
          setError(message || "Unable to load onboarding submissions right now.");
          setStatuses({});
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchStatuses();

    return () => {
      isCancelled = true;
    };
  }, [target, hasValidSubject, steps, tenantId, userId, refreshToken]);

  const progressBuckets = useMemo(() => deriveProgressBuckets(steps as unknown as OnboardingStep[], statuses), [steps, statuses]);

  const headerDescription = useMemo(() => {
    if (!steps.length) {
      return "No onboarding steps configured for this customer.";
    }
    return "Track verification stages, review submissions, and take action when teams need nudges.";
  }, [steps.length]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Onboarding Journey
          </p>
          <h3 className="break-words text-lg font-semibold text-gray-900 dark:text-white">
            {entityName || "Record"}{" "}
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {contextName ? `• ${contextName}` : ""}
            </span>
          </h3>
          <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
            {headerDescription}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ModernButton
            variant="ghost"
            size="sm"
            onClick={() => setRefreshToken((token) => token + 1)}
            isDisabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </ModernButton>
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin-dashboard/onboarding-review")}
            className="gap-2"
          >
            <ClipboardList className="h-4 w-4" />
            Open Review Workspace
          </ModernButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OnboardingSummaryCard label="Approved" value={progressBuckets.completed} tone="success" />
        <OnboardingSummaryCard label="In Review" value={progressBuckets.inProgress} tone="warning" />
        <OnboardingSummaryCard label="Pending" value={progressBuckets.pending} tone="neutral" />
        <OnboardingSummaryCard
          label="Escalated"
          value={progressBuckets.escalated}
          tone={progressBuckets.escalated > 0 ? "danger" : "neutral"}
        />
      </div>

      {!hasValidSubject ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
          Provide a valid record to load onboarding submissions.
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <span className="min-w-0 flex-1 break-words">{error}</span>
        </div>
      ) : isLoading ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--theme-color)" }} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pulling the latest onboarding submissions…
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(steps as Array<OnboardingStep & { description?: string }>).map((step) => {
            const snapshot = statuses[step.id] ?? {
              status: "not_started",
              submitted_at: null,
              reviewed_at: null,
            };
            const statusLabel = STATUS_LABELS[snapshot.status] ?? snapshot.status ?? "Unknown";
            const statusTone = STATUS_TONES[snapshot.status] ?? "neutral";

            return (
              <div
                key={step.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-gray-900 dark:text-white">
                      {step.label}
                    </p>
                    {step.description && (
                      <p className="mt-1 break-words text-xs text-gray-500 dark:text-gray-400">
                        {step.description}
                      </p>
                    )}
                  </div>
                  <StatusPill label={statusLabel} tone={statusTone} />
                </div>

                <dl className="mt-4 space-y-3">
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Submitted
                    </dt>
                    <dd className="mt-0.5 break-words text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(snapshot.submitted_at)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Last reviewed
                    </dt>
                    <dd className="mt-0.5 break-words text-sm font-medium text-gray-900 dark:text-white">
                      {formatDateTime(snapshot.reviewed_at)}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status code
                    </dt>
                    <dd className="mt-0.5 break-all text-sm font-medium uppercase tracking-wide text-gray-900 dark:text-white">
                      {snapshot.status || "—"}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => navigate("/admin-dashboard/onboarding-review")}
                  >
                    Review Step
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </ModernButton>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const OnboardingSummaryCard = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: Tone;
}) => {
  const valueTone: Record<Tone, string> = {
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-red-600 dark:text-red-400",
    neutral: "text-gray-900 dark:text-white",
  };

  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-semibold ${valueTone[tone]}`}>{value}</p>
    </div>
  );
};

export default OnboardingStatusBoard;
