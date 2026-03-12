import { Loader2, Clock, MessageCircle } from "lucide-react";
import { StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS } from "@/shared/constants/onboarding";
import type { OnboardingStep, OnboardingSubject, ReviewQueueEntry } from "./types";
import { asArray, formatDateTime } from "./utils";
import SectionHeading from "./SectionHeading";

interface ReviewQueuePanelProps {
  reviewQueue: ReviewQueueEntry[];
  isQueueLoading: boolean;
  selectedSubject: OnboardingSubject | null;
  onSelect: (entry: ReviewQueueEntry) => void;
}

const sortByQueued = (a: ReviewQueueEntry, b: ReviewQueueEntry) => {
  const aTime = a.queued_since
    ? new Date(String(a.queued_since)).getTime()
    : Number.POSITIVE_INFINITY;
  const bTime = b.queued_since
    ? new Date(String(b.queued_since)).getTime()
    : Number.POSITIVE_INFINITY;
  return aTime - bTime;
};

const entryKeyOf = (entry: ReviewQueueEntry) =>
  `${entry.target}:${entry.target === "tenant" ? entry.tenant_id : entry.user_id}`;

const AwaitingStepsBadges = ({
  entryKey,
  steps,
  suffix,
}: {
  entryKey: string;
  steps: OnboardingStep[];
  suffix?: string;
}) => (
  <>
    {steps.slice(0, 3).map((step) => (
      <span
        key={`${entryKey}-${step.id}${suffix ? `-${suffix}` : ""}`}
        className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
      >
        {step.label}
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
          {step.status ? (STATUS_LABELS[step.status] ?? step.status) : "\u2014"}
        </span>
      </span>
    ))}
    {steps.length > 3 && (
      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
        +{steps.length - 3} more
      </span>
    )}
  </>
);

/* ---- Desktop table ---- */
const DesktopTable = ({
  entries,
  selectedSubject,
  onSelect,
}: {
  entries: ReviewQueueEntry[];
  selectedSubject: OnboardingSubject | null;
  onSelect: (entry: ReviewQueueEntry) => void;
}) => (
  <div className="hidden overflow-x-auto md:block">
    <table className="min-w-[640px] divide-y divide-gray-100 text-sm">
      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
        <tr>
          <th className="px-4 py-3 text-left font-semibold">Subject</th>
          <th className="hidden lg:table-cell px-4 py-3 text-left font-semibold">Persona</th>
          <th className="px-4 py-3 text-left font-semibold">Pending Steps</th>
          <th className="px-4 py-3 text-left font-semibold">Queued</th>
          <th className="hidden xl:table-cell px-4 py-3 text-left font-semibold">Last Activity</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 bg-white">
        {entries.map((entry) => {
          const eKey = entryKeyOf(entry);
          const isActive =
            selectedSubject && `${selectedSubject.target}:${selectedSubject.id}` === eKey;
          const secondaryLine = entry.subtitle || entry.email || entry.tenant_name || null;
          const queuedSince = entry.queued_since ? formatDateTime(entry.queued_since) : "\u2014";
          const lastActivity = entry.last_activity_at
            ? formatDateTime(entry.last_activity_at)
            : "\u2014";
          const awaitingSteps = asArray<OnboardingStep>(entry.awaiting_steps);

          return (
            <tr
              key={entry.key}
              onClick={() => onSelect(entry)}
              className={`cursor-pointer transition ${
                isActive ? "bg-blue-50/60" : "hover:bg-gray-50"
              }`}
            >
              <td className="max-w-[180px] px-4 py-3 align-top">
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{entry.label}</p>
                  {secondaryLine && <p className="text-xs text-gray-500">{secondaryLine}</p>}
                </div>
              </td>
              <td className="hidden lg:table-cell px-4 py-3 align-top text-xs text-gray-600">
                {entry.persona?.replace(/_/g, " ") ?? entry.target}
              </td>
              <td className="px-4 py-3 align-top">
                <div className="flex flex-wrap gap-2">
                  {awaitingSteps.length === 0 ? (
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                      None
                    </span>
                  ) : (
                    <AwaitingStepsBadges entryKey={entry.key} steps={awaitingSteps} />
                  )}
                </div>
              </td>
              <td className="px-4 py-3 align-top text-xs text-gray-600">{queuedSince}</td>
              <td className="hidden xl:table-cell px-4 py-3 align-top text-xs text-gray-600">
                {lastActivity}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

/* ---- Mobile cards ---- */
const MobileCards = ({
  entries,
  selectedSubject,
  onSelect,
}: {
  entries: ReviewQueueEntry[];
  selectedSubject: OnboardingSubject | null;
  onSelect: (entry: ReviewQueueEntry) => void;
}) => (
  <div className="space-y-3 px-4 py-4 md:hidden">
    {entries.map((entry) => {
      const eKey = entryKeyOf(entry);
      const isActive =
        selectedSubject && `${selectedSubject.target}:${selectedSubject.id}` === eKey;
      const secondaryLine = entry.subtitle || entry.email || entry.tenant_name || null;
      const awaitingSteps = asArray<OnboardingStep>(entry.awaiting_steps);
      const queuedSince = entry.queued_since ? formatDateTime(entry.queued_since) : "\u2014";
      const lastActivity = entry.last_activity_at
        ? formatDateTime(entry.last_activity_at)
        : "\u2014";

      return (
        <button
          key={entry.key}
          onClick={() => onSelect(entry)}
          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
            isActive
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">{entry.label}</p>
              {secondaryLine && <p className="text-xs text-gray-500">{secondaryLine}</p>}
              <p className="text-[11px] uppercase tracking-wide text-gray-400">
                {entry.persona?.replace(/_/g, " ") ?? entry.target}
              </p>
            </div>
            <StatusPill
              label={`${entry.total_pending} ${entry.total_pending === 1 ? "step" : "steps"}`}
              tone="info"
            />
          </div>
          <div className="mt-3 space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Queued {queuedSince}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle size={12} />
              <span>Last activity {lastActivity}</span>
            </div>
          </div>
          {awaitingSteps.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <AwaitingStepsBadges entryKey={entry.key} steps={awaitingSteps} suffix="mobile" />
            </div>
          )}
        </button>
      );
    })}
  </div>
);

/* ---- Composite panel ---- */
const ReviewQueuePanel = ({
  reviewQueue,
  isQueueLoading,
  selectedSubject,
  onSelect,
}: ReviewQueuePanelProps) => {
  const sorted = reviewQueue.slice().sort(sortByQueued);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <SectionHeading title="Backlog" count={reviewQueue.length} />
        {isQueueLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
            Refreshing...
          </div>
        )}
      </div>
      {isQueueLoading && reviewQueue.length === 0 ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          Loading pending submissions...
        </div>
      ) : reviewQueue.length === 0 ? (
        <p className="px-4 py-6 text-sm text-gray-500">No submissions are waiting for review.</p>
      ) : (
        <>
          <DesktopTable entries={sorted} selectedSubject={selectedSubject} onSelect={onSelect} />
          <MobileCards entries={sorted} selectedSubject={selectedSubject} onSelect={onSelect} />
        </>
      )}
    </div>
  );
};

export default ReviewQueuePanel;
