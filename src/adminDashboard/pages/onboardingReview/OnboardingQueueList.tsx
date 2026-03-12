import React from "react";
import { Clock, Loader2, MessageCircle } from "lucide-react";
import { ModernTable, StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS } from "@/shared/constants/onboarding";
import type { EnrichedQueueEntry, PersonaOption, QueueEntry } from "./onboardingReviewTypes";
import { formatDateTime } from "./onboardingReviewHelpers";

interface OnboardingQueueListProps {
  isQueueLoading: boolean;
  reviewQueue: QueueEntry[];
  personaOptionMap: Map<string, PersonaOption>;
  persona: string | null;
  tenantId: string | number | null;
  userId: string | number | null;
  onSelect: (entry: QueueEntry) => void;
}

const OnboardingQueueList: React.FC<OnboardingQueueListProps> = ({
  isQueueLoading,
  reviewQueue,
  personaOptionMap,
  persona,
  tenantId,
  userId,
  onSelect,
}) => {
  if (isQueueLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading review queue...
      </div>
    );
  }

  if (reviewQueue.length === 0) {
    return <p className="text-sm text-gray-500">Nothing is waiting for review right now.</p>;
  }

  const sortedQueue = reviewQueue.slice().sort((a: QueueEntry, b: QueueEntry) => {
    const aTime = a.queued_since ? new Date(a.queued_since).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.queued_since ? new Date(b.queued_since).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });

  const enrichedQueue = sortedQueue.map((entry: QueueEntry) => {
    const personaMeta = personaOptionMap.get(entry.persona);
    const personaLabel = personaMeta?.label ?? entry.persona;
    const tenantKey = tenantId ? String(tenantId) : "";
    const userKey = userId ? String(userId) : "";
    const entryTenantId = entry.tenant_id || "";
    const entryUserId = entry.user_id || "";
    const secondaryLine = entry.subtitle || entry.email || entry.tenant_name || null;
    const queuedSince = entry.queued_since ? formatDateTime(entry.queued_since) : "\u2014";
    const lastActivity = entry.last_activity_at ? formatDateTime(entry.last_activity_at) : "\u2014";
    const awaitingSteps = Array.isArray(entry.awaiting_steps) ? entry.awaiting_steps : [];
    const isActive =
      persona === entry.persona &&
      ((entry.target === "tenant" && tenantKey === entryTenantId) ||
        (entry.target !== "tenant" && userKey === entryUserId));

    return {
      ...entry,
      id: entry.key,
      _personaLabel: personaLabel,
      _secondaryLine: secondaryLine,
      _queuedSince: queuedSince,
      _lastActivity: lastActivity,
      _awaitingSteps: awaitingSteps,
      _isActive: isActive,
    } as EnrichedQueueEntry;
  });

  return (
    <>
      {/* Desktop view */}
      <div className="hidden rounded-2xl border border-gray-200 md:block">
        <ModernTable<EnrichedQueueEntry>
          data={enrichedQueue}
          columns={[
            {
              key: "label",
              header: "SUBJECT",
              render: (_: unknown, entry: EnrichedQueueEntry) => (
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{entry.label}</p>
                  {entry._secondaryLine && (
                    <p className="text-xs text-gray-500">{entry._secondaryLine}</p>
                  )}
                </div>
              ),
            },
            {
              key: "_personaLabel",
              header: "PERSONA",
              render: (val: unknown) => (
                <span className="text-xs text-gray-600">{val as string}</span>
              ),
            },
            {
              key: "_awaitingSteps",
              header: "PENDING STEPS",
              render: (val: unknown) => {
                const awaitingSteps = val as EnrichedQueueEntry["_awaitingSteps"];
                return (
                  <div className="flex flex-wrap gap-1">
                    {awaitingSteps.length === 0 ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                        None
                      </span>
                    ) : (
                      awaitingSteps
                        .slice(0, 3)
                        .map((step: { label: string; status: string }, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                          >
                            {step.label}
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
                              {STATUS_LABELS[step.status] ?? step.status}
                            </span>
                          </span>
                        ))
                    )}
                    {awaitingSteps.length > 3 && (
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                        +{awaitingSteps.length - 3} more
                      </span>
                    )}
                  </div>
                );
              },
            },
            {
              key: "_queuedSince",
              header: "QUEUED",
              render: (val: unknown) => (
                <span className="text-xs text-gray-600">{val as string}</span>
              ),
            },
            {
              key: "_lastActivity",
              header: "LAST ACTIVITY",
              render: (val: unknown) => (
                <span className="text-xs text-gray-600">{val as string}</span>
              ),
            },
          ]}
          onRowClick={(entry: EnrichedQueueEntry) => onSelect(entry)}
          searchable={false}
          filterable={false}
          exportable={false}
          paginated={false}
          enableAnimations={false}
        />
      </div>

      {/* Mobile view */}
      <div className="space-y-3 md:hidden">
        {enrichedQueue.map((entry: EnrichedQueueEntry) => (
          <button
            key={entry.key}
            onClick={() => onSelect(entry)}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
              entry._isActive
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">{entry.label}</p>
                {entry._secondaryLine && (
                  <p className="text-xs text-gray-500">{entry._secondaryLine}</p>
                )}
                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                  {entry._personaLabel}
                </p>
              </div>
              <StatusPill
                label={`${entry.total_pending} ${entry.total_pending === 1 ? "step" : "steps"}`}
                tone="info"
              />
            </div>
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2 text-xs">
                <Clock size={12} />
                <span>Queued {entry._queuedSince}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MessageCircle size={12} />
                <span>Last activity {entry._lastActivity}</span>
              </div>
            </div>
            {entry._awaitingSteps.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {entry._awaitingSteps
                  .slice(0, 3)
                  .map((step: { id: string; label: string; status: string }) => (
                    <span
                      key={`${entry.key}-${step.id}-mobile`}
                      className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                    >
                      {step.label}
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
                        {STATUS_LABELS[step.status] ?? step.status}
                      </span>
                    </span>
                  ))}
                {entry._awaitingSteps.length > 3 && (
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                    +{entry._awaitingSteps.length - 3} more
                  </span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>
    </>
  );
};

export default OnboardingQueueList;
