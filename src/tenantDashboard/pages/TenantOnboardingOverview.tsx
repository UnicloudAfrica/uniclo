import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  FileDown,
  AlertCircle,
  MessageCircle,
  CheckCircle2,
  Clock,
  Send,
} from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import { useTenantClientOnboardingState } from "../../hooks/tenantHooks/useTenantClientOnboardingState";
import {
  useTenantSubjectOnboarding,
  type TenantSubjectOnboardingArgs,
  type TenantOnboardingTarget,
} from "../../hooks/tenantHooks/useTenantSubjectOnboarding";
import { StatusPill } from "../../shared/components/ui";
import ToastUtils from "../../utils/toastUtil";
import {
  useOnboardingReviewQueue,
  useUpdateOnboardingStatus,
} from "../../hooks/onboardingReviewHooks";
import { STATUS_LABELS, STATUS_OPTIONS, STATUS_TONES } from "../../shared/constants/onboarding";

type OnboardingStatus = keyof typeof STATUS_LABELS | (string & {});
type DecisionStatus = (typeof STATUS_OPTIONS)[number]["value"];

interface ProgressSummary {
  percentage: number;
  approved: number;
  required: number;
}

interface OnboardingStep {
  id: string | number;
  label?: string;
  status?: OnboardingStatus;
  requires_review?: boolean;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  [key: string]: unknown;
}

interface OnboardingSubjectState {
  id?: string | number;
  name?: string;
  email?: string;
  tenant_name?: string;
  status?: OnboardingStatus;
  steps?: OnboardingStep[];
  current_step?: string | number | null;
  progress?: Partial<ProgressSummary>;
  [key: string]: unknown;
}

interface OnboardingSubject {
  id: string | number;
  name?: string;
  email?: string;
  tenant_name?: string;
  target: TenantOnboardingTarget;
  subjectKey: string;
  source: "state" | "queue";
  status: OnboardingStatus;
  steps: OnboardingStep[];
  current_step?: string | number | null;
  progress: ProgressSummary;
}

interface ReviewQueueEntry {
  key: string;
  target: TenantOnboardingTarget;
  tenant_id?: string | number | null;
  user_id?: string | number | null;
  label?: string;
  subtitle?: string;
  email?: string;
  tenant_name?: string;
  persona?: string;
  status?: OnboardingStatus;
  awaiting_steps?: OnboardingStep[];
  total_pending?: number;
  queued_since?: string | number;
  last_activity_at?: string | number;
  progress?: Partial<ProgressSummary>;
}

interface SubmissionDocument {
  id: string | number;
  category?: string;
  created_at?: string;
  version?: string | number;
  url?: string;
}

interface SubmissionAttachment {
  url?: string;
  name?: string;
}

interface SubmissionThread {
  id: string | number;
  author?: { name?: string; type?: string };
  created_at?: string;
  message?: string;
  attachments?: SubmissionAttachment[];
  action?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizeProgress = (value: unknown, fallbackRequired: number): ProgressSummary => {
  const record = isRecord(value) ? value : {};
  const percentage = typeof record.percentage === "number" ? record.percentage : 0;
  const approved = typeof record.approved === "number" ? record.approved : 0;
  const required =
    typeof record.required === "number" ? record.required : Math.max(fallbackRequired, 0);
  return { percentage, approved, required };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim() !== "") return error;
  if (isRecord(error) && typeof error.message === "string" && error.message.trim() !== "") {
    return error.message;
  }
  return fallback;
};

const formatDateTime = (value: unknown) => (value ? new Date(String(value)).toLocaleString() : "—");

const flattenPayload = (payload: unknown, prefix = ""): Array<[string, unknown]> => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  return Object.entries(payload).flatMap(([key, value]): Array<[string, unknown]> => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value) && !("document_id" in value)) {
      return flattenPayload(value, path);
    }

    return [[path, value]];
  });
};

const renderValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">—</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400">—</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {value.map((item, index) => (
          <span
            key={index}
            className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
          >
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    const objectValue = value as Record<string, unknown>;
    if (objectValue.document_id) {
      return (
        <a
          href={String(objectValue.url || "")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
        >
          <FileDown size={16} />
          Download document
        </a>
      );
    }

    return (
      <pre className="rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return String(value);
};

const SectionHeading = ({ title, count }: { title: string; count: number }) => (
  <div className="flex items-center justify-between">
    <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{count}</span>
  </div>
);

const SubjectList = ({
  label,
  items,
  selectedKey,
  onSelect,
}: {
  label: string;
  items: OnboardingSubject[];
  selectedKey: string | null;
  onSelect: (subject: OnboardingSubject) => void;
}) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4">
    <SectionHeading title={label} count={items.length} />
    {items.length === 0 ? (
      <p className="mt-3 text-sm text-gray-500">No records yet.</p>
    ) : (
      <div className="mt-3 space-y-2">
        {items.map((item) => {
          const isActive = selectedKey === item.subjectKey;
          const currentStep =
            item.steps.find((step) => step.id === item.current_step) ?? item.steps[0];

          return (
            <button
              key={item.subjectKey}
              onClick={() => onSelect(item)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                isActive
                  ? "border-blue-500 bg-blue-50 shadow-sm"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {currentStep ? currentStep.label : "No steps yet"}
                  </p>
                </div>
                <StatusPill
                  label={STATUS_LABELS[item.status] ?? item.status.replace(/_/g, " ")}
                  tone={STATUS_TONES[item.status] ?? "neutral"}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${item.progress.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{item.progress.percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

const StepList = ({
  steps,
  activeStepId,
  onSelectStep,
}: {
  steps: OnboardingStep[];
  activeStepId: string | number | null;
  onSelectStep: (stepId: string | number) => void;
}) => (
  <div className="space-y-2">
    {steps.map((step) => {
      const isActive = step.id === activeStepId;
      const tone = STATUS_TONES[step.status ?? ""] ?? "neutral";

      return (
        <button
          key={step.id}
          onClick={() => onSelectStep(step.id)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
            isActive
              ? "border-blue-500 bg-blue-50 shadow-sm"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{step.label}</p>
              {step.requires_review && (
                <p className="text-xs text-gray-500">Manual review required</p>
              )}
            </div>
            <StatusPill
              label={
                step.status ? (STATUS_LABELS[step.status] ?? step.status.replace(/_/g, " ")) : "—"
              }
              tone={tone}
            />
          </div>
          <div className="mt-2 text-[11px] text-gray-500">
            <div>Submitted: {formatDateTime(step.submitted_at)}</div>
            <div>Reviewed: {formatDateTime(step.reviewed_at)}</div>
          </div>
        </button>
      );
    })}
  </div>
);

const TenantOnboardingOverview = () => {
  const [selectedSubject, setSelectedSubject] = useState<OnboardingSubject | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStep["id"] | null>(null);
  const [decision, setDecision] = useState<DecisionStatus>("in_review");
  const [decisionMessage, setDecisionMessage] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);

  const {
    data = { tenants: [], clients: [] },
    isLoading,
    isFetching,
    refetch: refetchState,
  } = useTenantClientOnboardingState();
  const stateData = useMemo(() => {
    const tenants = asArray<OnboardingSubjectState>(data?.tenants);
    const clients = asArray<OnboardingSubjectState>(data?.clients);
    return { tenants, clients };
  }, [data]);

  const {
    data: reviewQueueRaw = [],
    isFetching: isQueueLoading,
    refetch: refetchQueue,
  } = useOnboardingReviewQueue(null, { refetchInterval: 60_000 });
  const reviewQueue = useMemo<ReviewQueueEntry[]>(
    () => asArray<ReviewQueueEntry>(reviewQueueRaw),
    [reviewQueueRaw]
  );

  const updateStatusMutation = useUpdateOnboardingStatus();

  const tenantSubjects = useMemo(
    () =>
      (stateData.tenants ?? [])
        .map((item): OnboardingSubject | null => {
          if (item.id === null || item.id === undefined) {
            return null;
          }
          const steps = asArray<OnboardingStep>(item.steps);
          return {
            id: item.id,
            name: item.name,
            email: item.email,
            tenant_name: item.tenant_name,
            target: "tenant",
            subjectKey: `tenant:${item.id}`,
            source: "state",
            status: item.status ?? "submitted",
            steps,
            current_step: item.current_step ?? steps[0]?.id ?? null,
            progress: normalizeProgress(item.progress, steps.length),
          };
        })
        .filter((item): item is OnboardingSubject => Boolean(item)),
    [stateData.tenants]
  );

  const clientSubjects = useMemo(
    () =>
      (stateData.clients ?? [])
        .map((item): OnboardingSubject | null => {
          if (item.id === null || item.id === undefined) {
            return null;
          }
          const steps = asArray<OnboardingStep>(item.steps);
          return {
            id: item.id,
            name: item.name,
            email: item.email,
            tenant_name: item.tenant_name,
            target: "client",
            subjectKey: `client:${item.id}`,
            source: "state",
            status: item.status ?? "submitted",
            steps,
            current_step: item.current_step ?? steps[0]?.id ?? null,
            progress: normalizeProgress(item.progress, steps.length),
          };
        })
        .filter((item): item is OnboardingSubject => Boolean(item)),
    [stateData.clients]
  );

  useEffect(() => {
    if (!selectedSubject) {
      return;
    }

    if (selectedSubject.source === "queue") {
      const lookup =
        selectedSubject.target === "tenant"
          ? tenantSubjects.find((subject) => String(subject.id) === String(selectedSubject.id))
          : clientSubjects.find((subject) => String(subject.id) === String(selectedSubject.id));

      if (lookup) {
        setSelectedSubject(lookup);
        setActiveStep(lookup.current_step ?? lookup.steps[0]?.id ?? null);
      }
      return;
    }

    const exists =
      tenantSubjects.some((subject) => subject.subjectKey === selectedSubject.subjectKey) ||
      clientSubjects.some((subject) => subject.subjectKey === selectedSubject.subjectKey);

    if (!exists) {
      setSelectedSubject(null);
      setActiveStep(null);
    }
  }, [tenantSubjects, clientSubjects, selectedSubject]);

  useEffect(() => {
    if (!selectedSubject) {
      setActiveStep(null);
      return;
    }

    if (!activeStep && Array.isArray(selectedSubject.steps) && selectedSubject.steps.length > 0) {
      setActiveStep(selectedSubject.current_step ?? selectedSubject?.steps[0].id);
    }
  }, [selectedSubject, activeStep]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedSubject, activeStep]);

  const detailArgs = useMemo(() => {
    if (!selectedSubject || !activeStep) {
      return null;
    }

    return {
      target: selectedSubject.target,
      subjectId: String(selectedSubject.id),
      step: String(activeStep),
    } as TenantSubjectOnboardingArgs;
  }, [selectedSubject, activeStep]);

  const {
    data: submissionDetail,
    isLoading: isDetailLoading,
    isFetching: isDetailFetching,
    refetch: refetchSubmission,
  } = useTenantSubjectOnboarding(detailArgs ?? { target: "tenant", subjectId: "", step: "" }, {
    enabled: Boolean(detailArgs),
  });

  const selectedStepDefinition = useMemo(() => {
    if (!selectedSubject || !activeStep) {
      return null;
    }

    return (
      selectedSubject.steps.find((step) => step.id === activeStep) ??
      selectedSubject.steps[0] ??
      null
    );
  }, [selectedSubject, activeStep]);

  const currentStatus = selectedStepDefinition?.status ?? "not_started";

  useEffect(() => {
    if (!selectedStepDefinition) {
      setDecision("in_review");
      setDecisionMessage("");
      return;
    }

    if (["in_review", "changes_requested", "approved", "rejected"].includes(currentStatus)) {
      setDecision(currentStatus);
    } else {
      setDecision("in_review");
    }
    setDecisionMessage("");
  }, [currentStatus, selectedStepDefinition]);

  const requiresMessage = ["changes_requested", "rejected"].includes(decision);

  const canDecide = [
    "submitted",
    "in_review",
    "changes_requested",
    "approved",
    "rejected",
  ].includes(currentStatus);

  const handleSelectSubject = (subject: OnboardingSubject) => {
    setSelectedSubject(subject);
    setActiveStep(subject.current_step ?? subject.steps[0]?.id ?? null);
  };

  const handleQueueSelect = (entry: ReviewQueueEntry | null) => {
    if (!entry) {
      return;
    }

    const isTenant = entry.target === "tenant";
    const subjectId = isTenant ? entry.tenant_id : entry.user_id;
    const match = isTenant
      ? tenantSubjects.find((subject) => String(subject.id) === String(subjectId))
      : clientSubjects.find((subject) => String(subject.id) === String(subjectId));

    if (match) {
      setSelectedSubject(match);
      const preferredStep =
        entry.awaiting_steps?.[0]?.id ?? match.current_step ?? match.steps[0]?.id ?? null;
      setActiveStep(preferredStep);
      return;
    }

    const fallbackSteps = (entry.awaiting_steps ?? []).map((step) => ({
      id: step.id,
      label: step.label,
      status: step.status,
      requires_review: true,
      submitted_at: step.submitted_at,
      reviewed_at: step.reviewed_at,
    }));

    const fallbackSubject = {
      id: subjectId,
      target: entry.target,
      name: entry.label,
      email: entry.email ?? null,
      tenant_name: entry.tenant_name ?? null,
      subjectKey: `${entry.target}:${subjectId}`,
      source: "queue",
      status: entry.status ?? "submitted",
      steps: fallbackSteps,
      current_step: fallbackSteps[0]?.id ?? null,
      progress: normalizeProgress(
        entry.progress ?? null,
        fallbackSteps.length > 0 ? fallbackSteps.length : 0
      ),
    };

    setSelectedSubject(fallbackSubject as any);
    setActiveStep(fallbackSubject.current_step);
  };

  const handleDecisionSubmit = () => {
    if (!selectedSubject || !activeStep) {
      ToastUtils.error("Select a subject and step before updating the status.");
      return;
    }

    if (!canDecide) {
      ToastUtils.error("This step has no submission to review yet.");
      return;
    }

    if (requiresMessage && !decisionMessage.trim()) {
      ToastUtils.error("A message is required for the selected status.");
      return;
    }

    updateStatusMutation.mutate(
      {
        target: selectedSubject.target,
        tenantId: selectedSubject.target === "tenant" ? selectedSubject.id : null,
        userId: selectedSubject.target === "tenant" ? null : selectedSubject.id,
        step: activeStep as any,
        status: decision,
        message: decisionMessage.trim() || undefined,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Submission status updated.");
          setDecisionMessage("");
          refetchState();
          refetchQueue();
          if (detailArgs) {
            refetchSubmission();
          }
        },
        onError: (error) => {
          ToastUtils.error(getErrorMessage(error, "Unable to update submission status."));
        },
      }
    );
  };

  const renderPayload = () => {
    if (!submissionDetail) {
      return <p className="text-sm text-gray-500">No submission for this step yet.</p>;
    }

    const entries = flattenPayload(submissionDetail.payload ?? {});

    if (entries.length === 0) {
      return <p className="text-sm text-gray-500">No data provided yet.</p>;
    }

    return (
      <div className="rounded-2xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <tbody>
            {entries.map(([key, value]: [string, unknown]) => (
              <tr key={key} className="border-b border-gray-100">
                <td className="w-1/3 px-4 py-3 font-medium text-gray-700">{key}</td>
                <td className="px-4 py-3 text-gray-700">{renderValue(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDocuments = () => {
    const documents = asArray<SubmissionDocument>(submissionDetail?.documents);

    if (!documents.length) {
      return <p className="text-sm text-gray-500">No documents uploaded yet.</p>;
    }

    return (
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-gray-800">{document.category ?? "Document"}</p>
              <p className="text-xs text-gray-500">
                Uploaded {formatDateTime(document.created_at)} • Version {document.version}
              </p>
            </div>
            <a
              href={document.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              <FileDown size={16} />
              Download
            </a>
          </div>
        ))}
      </div>
    );
  };

  const renderThreads = () => {
    const threads = asArray<SubmissionThread>(submissionDetail?.threads);

    if (!threads.length) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          No messages shared yet. Updates from our team will appear here.
        </div>
      );
    }

    return (
      <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
        {threads.map((thread) => (
          <div key={thread.id} className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">
                {thread.author?.name ?? thread.author?.type ?? "Reviewer"}
              </div>
              <span className="text-xs text-gray-500">
                {thread.created_at ? new Date(thread.created_at).toLocaleString() : ""}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-gray-700">{thread.message || "—"}</p>
            {thread.attachments?.length ? (
              <div className="mt-2 space-y-1">
                {thread.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.url}
                    className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FileDown size={14} />
                    {attachment.name ?? attachment.url}
                  </a>
                ))}
              </div>
            ) : null}
            {thread.action === "request_changes" && (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
                <AlertCircle size={14} /> Changes requested
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const stepStatus = selectedStepDefinition?.status ?? "not_started";

  return (
    <TenantPageShell customHeader={<></>} disableContentPadding contentClassName="p-6 md:p-8">
      <div ref={contentRef} className="overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Onboarding Review</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review pending submissions from your tenants and clients before approving them.
            </p>
          </div>
          <div className="hidden gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
              <CheckCircle2 size={14} className="text-emerald-500" />
              {tenantSubjects.filter((item) => item.status === "approved").length} tenants approved
            </div>
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
              <MessageCircle size={14} className="text-blue-500" />
              Conversations sync automatically
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <SectionHeading title="Backlog" count={reviewQueue.length} />
                {isQueueLoading && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                    Refreshing…
                  </div>
                )}
              </div>
              {isQueueLoading && reviewQueue.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  Loading pending submissions…
                </div>
              ) : reviewQueue.length === 0 ? (
                <p className="px-4 py-6 text-sm text-gray-500">
                  No submissions are waiting for review.
                </p>
              ) : (
                <>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-[640px] divide-y divide-gray-100 text-sm">
                      <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Subject</th>
                          <th className="hidden lg:table-cell px-4 py-3 text-left font-semibold">
                            Persona
                          </th>
                          <th className="px-4 py-3 text-left font-semibold">Pending Steps</th>
                          <th className="px-4 py-3 text-left font-semibold">Queued</th>
                          <th className="hidden xl:table-cell px-4 py-3 text-left font-semibold">
                            Last Activity
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {reviewQueue
                          .slice()
                          .sort((a, b) => {
                            const aTime = a.queued_since
                              ? new Date(String(a.queued_since)).getTime()
                              : Number.POSITIVE_INFINITY;
                            const bTime = b.queued_since
                              ? new Date(String(b.queued_since)).getTime()
                              : Number.POSITIVE_INFINITY;
                            return aTime - bTime;
                          })
                          .map((entry) => {
                            const entryKey = `${entry.target}:${entry.target === "tenant" ? entry.tenant_id : entry.user_id}`;
                            const isActive =
                              selectedSubject &&
                              `${selectedSubject.target}:${selectedSubject.id}` === entryKey;
                            const secondaryLine =
                              entry.subtitle || entry.email || entry.tenant_name || null;
                            const queuedSince = entry.queued_since
                              ? formatDateTime(entry.queued_since)
                              : "—";
                            const lastActivity = entry.last_activity_at
                              ? formatDateTime(entry.last_activity_at)
                              : "—";
                            const awaitingSteps = asArray<OnboardingStep>(entry.awaiting_steps);

                            return (
                              <tr
                                key={entry.key}
                                onClick={() => handleQueueSelect(entry)}
                                className={`cursor-pointer transition ${
                                  isActive ? "bg-blue-50/60" : "hover:bg-gray-50"
                                }`}
                              >
                                <td className="max-w-[180px] px-4 py-3 align-top">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-gray-900">{entry.label}</p>
                                    {secondaryLine && (
                                      <p className="text-xs text-gray-500">{secondaryLine}</p>
                                    )}
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
                                      awaitingSteps.slice(0, 3).map((step) => (
                                        <span
                                          key={`${entry.key}-${step.id}`}
                                          className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                        >
                                          {step.label}
                                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
                                            {step.status
                                              ? (STATUS_LABELS[step.status] ?? step.status)
                                              : "—"}
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
                                </td>
                                <td className="px-4 py-3 align-top text-xs text-gray-600">
                                  {queuedSince}
                                </td>
                                <td className="hidden xl:table-cell px-4 py-3 align-top text-xs text-gray-600">
                                  {lastActivity}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-3 px-4 py-4 md:hidden">
                    {reviewQueue
                      .slice()
                      .sort((a, b) => {
                        const aTime = a.queued_since
                          ? new Date(String(a.queued_since)).getTime()
                          : Number.POSITIVE_INFINITY;
                        const bTime = b.queued_since
                          ? new Date(String(b.queued_since)).getTime()
                          : Number.POSITIVE_INFINITY;
                        return aTime - bTime;
                      })
                      .map((entry) => {
                        const entryKey = `${entry.target}:${entry.target === "tenant" ? entry.tenant_id : entry.user_id}`;
                        const isActive =
                          selectedSubject &&
                          `${selectedSubject.target}:${selectedSubject.id}` === entryKey;
                        const secondaryLine =
                          entry.subtitle || entry.email || entry.tenant_name || null;
                        const awaitingSteps = asArray<OnboardingStep>(entry.awaiting_steps);
                        const queuedSince = entry.queued_since
                          ? formatDateTime(entry.queued_since)
                          : "—";
                        const lastActivity = entry.last_activity_at
                          ? formatDateTime(entry.last_activity_at)
                          : "—";

                        return (
                          <button
                            key={entry.key}
                            onClick={() => handleQueueSelect(entry)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                              isActive
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900">{entry.label}</p>
                                {secondaryLine && (
                                  <p className="text-xs text-gray-500">{secondaryLine}</p>
                                )}
                                <p className="text-[11px] uppercase tracking-wide text-gray-400">
                                  {entry.persona?.replace(/_/g, " ") ?? entry.target}
                                </p>
                              </div>
                              <StatusPill
                                label={`${entry.total_pending} ${
                                  entry.total_pending === 1 ? "step" : "steps"
                                }`}
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
                                {awaitingSteps.slice(0, 3).map((step) => (
                                  <span
                                    key={`${entry.key}-${step.id}-mobile`}
                                    className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {step.label}
                                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-600">
                                      {step.status
                                        ? (STATUS_LABELS[step.status] ?? step.status)
                                        : "—"}
                                    </span>
                                  </span>
                                ))}
                                {awaitingSteps.length > 3 && (
                                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-600">
                                    +{awaitingSteps.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>

            {isLoading || isFetching ? (
              <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <SubjectList
                  label="Sub Tenants"
                  items={tenantSubjects}
                  selectedKey={selectedSubject?.subjectKey ?? null}
                  onSelect={handleSelectSubject}
                />
                <SubjectList
                  label="Clients"
                  items={clientSubjects}
                  selectedKey={selectedSubject?.subjectKey ?? null}
                  onSelect={handleSelectSubject}
                />
              </>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              {!selectedSubject ? (
                <p className="text-sm text-gray-500">
                  Select a sub tenant or client to view their onboarding trail.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedSubject.name}
                      </h2>
                      {selectedSubject.email && (
                        <p className="text-sm text-gray-500">{selectedSubject.email}</p>
                      )}
                      {selectedSubject.tenant_name && selectedSubject.target === "client" && (
                        <p className="text-sm text-gray-500">
                          Tenant: {selectedSubject.tenant_name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-right text-sm text-gray-500">
                      <StatusPill
                        label={
                          STATUS_LABELS[selectedSubject.status] ??
                          selectedSubject.status.replace(/_/g, " ")
                        }
                        tone={STATUS_TONES[selectedSubject.status] ?? "neutral"}
                      />
                      <div>
                        Progress:{" "}
                        <span className="font-medium text-gray-700">
                          {selectedSubject.progress?.approved ?? 0}/
                          {selectedSubject.progress?.required ?? 0}
                        </span>{" "}
                        steps approved
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-800">Steps</h3>
                      <StepList
                        steps={selectedSubject.steps ?? []}
                        activeStepId={activeStep}
                        onSelectStep={setActiveStep}
                      />
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-800">
                            {selectedStepDefinition?.label ?? "Step Detail"}
                          </h3>
                          {selectedStepDefinition?.requires_review && (
                            <p className="text-xs text-gray-500">
                              Manual review required by our team.
                            </p>
                          )}
                        </div>
                        <StatusPill
                          label={STATUS_LABELS[stepStatus] ?? stepStatus.replace(/_/g, " ")}
                          tone={STATUS_TONES[stepStatus] ?? "neutral"}
                        />
                      </div>

                      {isDetailLoading || isDetailFetching ? (
                        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
                          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Submitted Data
                            </h4>
                            {renderPayload()}
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Documents
                            </h4>
                            {renderDocuments()}
                          </div>

                          <div className="space-y-3">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <MessageCircle size={14} />
                              Conversation
                            </h4>
                            {renderThreads()}
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Decision
                            </h4>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  onClick={() => setDecision(option.value)}
                                  className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    decision === option.value
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-gray-200 hover:border-gray-300"
                                  }`}
                                  disabled={!canDecide}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Message {requiresMessage && <span className="text-red-500">*</span>}
                              </label>
                              <textarea
                                value={decisionMessage}
                                onChange={(event) => setDecisionMessage(event.target.value)}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                                placeholder="Share guidance or next steps with the submitter."
                                disabled={!canDecide || updateStatusMutation.isPending}
                              />
                              <p className="text-xs text-gray-500">
                                Messages are visible to the submitter. Use them to clarify changes
                                or confirm approval details.
                              </p>
                              {!canDecide && (
                                <p className="text-xs text-amber-600">
                                  This step has not been submitted yet. Ask the submitter to provide
                                  the required details before approving.
                                </p>
                              )}
                            </div>
                            <button
                              onClick={handleDecisionSubmit}
                              disabled={!canDecide || updateStatusMutation.isPending}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                            >
                              {updateStatusMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                                </>
                              ) : (
                                <>
                                  <Send size={16} /> Submit decision
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </TenantPageShell>
  );
};

export default TenantOnboardingOverview;
