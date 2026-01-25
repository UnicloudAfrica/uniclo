// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { ModernButton } from "../../../shared/components/ui";
import StatusPill from "../../../shared/components/ui/StatusPill";
import { getStepsForTarget } from "../../../dashboard/onboarding/stepConfig";
import { fetchAdminOnboardingSubmission } from "../../../hooks/adminHooks/onboardingReviewHooks";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_TONES: Record<string, any> = {
  not_started: "neutral",
  draft: "info",
  submitted: "info",
  in_review: "info",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
};

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

const deriveProgressBuckets = (steps: any[], statuses: any) => {
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
  const [statuses, setStatuses] = useState<any>({});
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
          steps.map(async (step: any) => {
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
              console.error(`Failed to load onboarding submission for ${step.id}`, stepError);
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
      } catch (fetchError: any) {
        if (!isCancelled) {
          console.error("Failed to load onboarding submissions", fetchError);
          setError(fetchError?.message ?? "Unable to load onboarding submissions right now.");
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

  const progressBuckets = useMemo(() => deriveProgressBuckets(steps, statuses), [steps, statuses]);

  const headerDescription = useMemo(() => {
    if (!steps.length) {
      return "No onboarding steps configured for this customer.";
    }
    return "Track verification stages, review submissions, and take action when teams need nudges.";
  }, [steps.length]);

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Onboarding Journey
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {entityName || "Record"}{" "}
            <span className="text-sm font-medium text-slate-500">
              {contextName ? `• ${contextName}` : ""}
            </span>
          </h3>
          <p className="mt-1 text-sm text-slate-500">{headerDescription}</p>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <OnboardingSummaryCard label="Approved" value={progressBuckets.completed} tone="success" />
        <OnboardingSummaryCard label="In Review" value={progressBuckets.inProgress} tone="info" />
        <OnboardingSummaryCard label="Pending" value={progressBuckets.pending} tone="neutral" />
        <OnboardingSummaryCard
          label="Escalated"
          value={progressBuckets.escalated}
          tone={progressBuckets.escalated > 0 ? "danger" : "neutral"}
        />
      </div>

      {!hasValidSubject ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-sm text-slate-600">
          Provide a valid record to load onboarding submissions.
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
          <AlertTriangle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      ) : isLoading ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-3xl border border-[#EAECF0] bg-white">
          <Loader2 className="h-6 w-6 animate-spin text-[#288DD1]" />
          <p className="text-sm text-slate-600">Pulling the latest onboarding submissions…</p>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step: any) => {
            const snapshot = statuses[step.id] ?? {
              status: "not_started",
              submitted_at: null,
              reviewed_at: null,
            };
            const statusLabel = STATUS_LABELS[snapshot.status] ?? snapshot.status ?? "Unknown";
            const statusTone = STATUS_TONES[snapshot.status] ?? STATUS_TONES.not_started;

            return (
              <div
                key={step.id}
                className="rounded-3xl border border-[#EAECF0] bg-gradient-to-br from-white via-[#F8FAFC] to-white p-5 shadow-sm transition hover:border-primary/40"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                    {step.description && (
                      <p className="mt-1 text-sm text-slate-500">{step.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={statusLabel} tone={statusTone} />
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

                <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <span className="font-semibold text-slate-600">Submitted</span>
                    <p className="mt-1 text-slate-700">{formatDateTime(snapshot.submitted_at)}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Last reviewed</span>
                    <p className="mt-1 text-slate-700">{formatDateTime(snapshot.reviewed_at)}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Status code</span>
                    <p className="mt-1 text-slate-700 uppercase tracking-wide">
                      {snapshot.status || "—"}
                    </p>
                  </div>
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
  tone: string;
}) => {
  const palette =
    {
      success: {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        ring: "ring-emerald-100",
      },
      info: {
        bg: "bg-sky-50",
        text: "text-sky-600",
        ring: "ring-sky-100",
      },
      danger: {
        bg: "bg-rose-50",
        text: "text-rose-600",
        ring: "ring-rose-100",
      },
      neutral: {
        bg: "bg-slate-50",
        text: "text-slate-600",
        ring: "ring-slate-100",
      },
    }[tone] ??
    ({
      bg: "bg-slate-50",
      text: "text-slate-600",
      ring: "ring-slate-100",
    } as any);

  return (
    <div className={`rounded-3xl border border-[#EAECF0] ${palette.bg} p-4 shadow-sm`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${palette.text}`}>{value}</p>
    </div>
  );
};

export default OnboardingStatusBoard;
