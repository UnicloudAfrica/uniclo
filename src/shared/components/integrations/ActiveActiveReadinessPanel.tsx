import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  XCircle,
  Award,
} from "lucide-react";
import { ModernButton } from "../ui";
import {
  useActiveActiveReadiness,
  useCertifyActiveActive,
} from "@/shared/hooks/resources";
import {
  ACTIVE_ACTIVE_STATUS_LABELS,
  type ActiveActiveReadinessCheck,
} from "@/types/bidirectional";

interface ActiveActiveReadinessPanelProps {
  pairId: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  ready: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  certified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  revoked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const checkIcon = (status: ActiveActiveReadinessCheck["status"]) => {
  if (status === "pass") {
    return <CheckCircle2 size={15} className="shrink-0 text-green-500" />;
  }
  if (status === "warn") {
    return <AlertTriangle size={15} className="shrink-0 text-yellow-500" />;
  }

  return <XCircle size={15} className="shrink-0 text-red-500" />;
};

const ActiveActiveReadinessPanel: React.FC<ActiveActiveReadinessPanelProps> = ({
  pairId,
  className = "",
}) => {
  const { data, isLoading, refetch, isFetching } = useActiveActiveReadiness(pairId);
  const certify = useCertifyActiveActive();

  const status = data?.status ?? "warning";

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Enterprise Active-Active Readiness
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Stateless bidirectional pairs can be assessed and certified here. Certification remains in history, but current validity is revoked automatically when the pair degrades.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </ModernButton>
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => certify.mutate({ pairId })}
            disabled={!data?.can_certify || certify.isPending}
          >
            <Award size={14} />
            {data?.status === "certified" ? "Certified" : certify.isPending ? "Certifying..." : "Certify"}
          </ModernButton>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {isLoading ? (
          <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span aria-hidden="true">🩺</span> Checking readiness…
          </p>
        ) : !data ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span aria-hidden="true" className="text-3xl">🩺</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No readiness check yet</p>
            <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
              Once your replication has been running long enough, we'll grade how ready it is for active-active mode.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Status"
                value={
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[status] ?? statusStyles.warning}`}>
                    {ACTIVE_ACTIVE_STATUS_LABELS[data.status] ?? data.status}
                  </span>
                }
              />
              <MetricCard label="Score" value={`${data.score}%`} />
              <MetricCard
                label="Current Validity"
                value={data.current_certification_valid ? "Valid" : "Revoked"}
              />
              <MetricCard
                label="Certified At"
                value={data.certified_at ? new Date(data.certified_at).toLocaleString() : "Not yet"}
              />
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Section title="Decision">
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Scope:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {data.certification_scope ? data.certification_scope.replace(/_/g, " ") : "not certifiable"}
                    </span>
                  </p>
                  <p>
                    Historical certification:{" "}
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {data.previously_certified ? "Yes" : "No"}
                    </span>
                  </p>
                  {data.revocation_reason && (
                    <p className="text-red-600 dark:text-red-400">
                      Revocation reason: {data.revocation_reason}
                    </p>
                  )}
                </div>
              </Section>

              <Section title="Blocking Issues">
                {data.blocking_issues.length > 0 ? (
                  <ul className="space-y-2 text-sm text-red-600 dark:text-red-400">
                    {data.blocking_issues.map((issue, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <XCircle size={15} className="mt-0.5 shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No blocking issues.</p>
                )}
              </Section>

              <Section title="Warnings">
                {data.warnings.length > 0 ? (
                  <ul className="space-y-2 text-sm text-yellow-700 dark:text-yellow-400">
                    {data.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No warnings.</p>
                )}
              </Section>

              <Section title="Checklist">
                <div className="space-y-3">
                  {data.checks.length > 0 ? (
                    data.checks.map((check) => (
                      <div
                        key={check.key}
                        className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
                      >
                        <div className="flex items-start gap-3">
                          {checkIcon(check.status)}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {check.key.replace(/_/g, " ")}
                            </p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {check.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No checklist data available.</p>
                  )}
                </div>
              </Section>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="rounded-lg border border-gray-100 p-4 dark:border-gray-800">
    <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h4>
    {children}
  </div>
);

export default ActiveActiveReadinessPanel;
