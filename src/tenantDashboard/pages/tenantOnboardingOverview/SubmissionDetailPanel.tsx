import { Loader2, FileDown, AlertCircle, MessageCircle, Send } from "lucide-react";
import { StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS, STATUS_OPTIONS, STATUS_TONES } from "@/shared/constants/onboarding";
import type { TenantSubjectOnboardingDetail } from "@/hooks/tenantHooks/useTenantSubjectOnboarding";
import type {
  DecisionStatus,
  OnboardingStep,
  OnboardingSubject,
  SubmissionDocument,
  SubmissionThread,
} from "./types";
import { asArray, flattenPayload } from "./utils";
import StepList from "./StepList";

/* ------------------------------------------------------------------ */
/*  Value renderer                                                     */
/* ------------------------------------------------------------------ */

const renderValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-gray-400">{"\u2014"}</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-gray-400">{"\u2014"}</span>;
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

/* ------------------------------------------------------------------ */
/*  Payload table                                                      */
/* ------------------------------------------------------------------ */

const PayloadSection = ({
  submissionDetail,
}: {
  submissionDetail: TenantSubjectOnboardingDetail | null | undefined;
}) => {
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

/* ------------------------------------------------------------------ */
/*  Documents list                                                     */
/* ------------------------------------------------------------------ */

const DocumentsSection = ({
  submissionDetail,
}: {
  submissionDetail: TenantSubjectOnboardingDetail | null | undefined;
}) => {
  const documents = asArray<SubmissionDocument>(submissionDetail?.documents);

  if (!documents.length) {
    return <p className="text-sm text-gray-500">No documents uploaded yet.</p>;
  }

  const formatDateTime = (v: unknown) => (v ? new Date(String(v)).toLocaleString() : "\u2014");

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
              Uploaded {formatDateTime(document.created_at)} &bull; Version {document.version}
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

/* ------------------------------------------------------------------ */
/*  Conversation threads                                               */
/* ------------------------------------------------------------------ */

const ThreadsSection = ({
  submissionDetail,
}: {
  submissionDetail: TenantSubjectOnboardingDetail | null | undefined;
}) => {
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
          <p className="mt-2 whitespace-pre-line text-gray-700">{thread.message || "\u2014"}</p>
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

/* ------------------------------------------------------------------ */
/*  Decision form                                                      */
/* ------------------------------------------------------------------ */

interface DecisionFormProps {
  decision: DecisionStatus;
  setDecision: (value: DecisionStatus) => void;
  decisionMessage: string;
  setDecisionMessage: (value: string) => void;
  canDecide: boolean;
  requiresMessage: boolean;
  isPending: boolean;
  onSubmit: () => void;
}

const DecisionForm = ({
  decision,
  setDecision,
  decisionMessage,
  setDecisionMessage,
  canDecide,
  requiresMessage,
  isPending,
  onSubmit,
}: DecisionFormProps) => (
  <div className="space-y-3">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Decision</h4>
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
        disabled={!canDecide || isPending}
      />
      <p className="text-xs text-gray-500">
        Messages are visible to the submitter. Use them to clarify changes or confirm approval
        details.
      </p>
      {!canDecide && (
        <p className="text-xs text-amber-600">
          This step has not been submitted yet. Ask the submitter to provide the required details
          before approving.
        </p>
      )}
    </div>
    <button
      onClick={onSubmit}
      disabled={!canDecide || isPending}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Updating...
        </>
      ) : (
        <>
          <Send size={16} /> Submit decision
        </>
      )}
    </button>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export interface SubmissionDetailPanelProps {
  selectedSubject: OnboardingSubject;
  activeStep: OnboardingStep["id"] | null;
  setActiveStep: (stepId: OnboardingStep["id"]) => void;
  selectedStepDefinition: OnboardingStep | null;
  stepStatus: string;
  isDetailLoading: boolean;
  isDetailFetching: boolean;
  submissionDetail: TenantSubjectOnboardingDetail | null | undefined;
  decision: DecisionStatus;
  setDecision: (value: DecisionStatus) => void;
  decisionMessage: string;
  setDecisionMessage: (value: string) => void;
  canDecide: boolean;
  requiresMessage: boolean;
  isPending: boolean;
  onDecisionSubmit: () => void;
}

const SubmissionDetailPanel = ({
  selectedSubject,
  activeStep,
  setActiveStep,
  selectedStepDefinition,
  stepStatus,
  isDetailLoading,
  isDetailFetching,
  submissionDetail,
  decision,
  setDecision,
  decisionMessage,
  setDecisionMessage,
  canDecide,
  requiresMessage,
  isPending,
  onDecisionSubmit,
}: SubmissionDetailPanelProps) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{selectedSubject.name}</h2>
        {selectedSubject.email && <p className="text-sm text-gray-500">{selectedSubject.email}</p>}
        {selectedSubject.tenant_name && selectedSubject.target === "client" && (
          <p className="text-sm text-gray-500">Tenant: {selectedSubject.tenant_name}</p>
        )}
      </div>
      <div className="space-y-2 text-right text-sm text-gray-500">
        <StatusPill
          label={STATUS_LABELS[selectedSubject.status] ?? selectedSubject.status.replace(/_/g, " ")}
          tone={STATUS_TONES[selectedSubject.status] ?? "neutral"}
        />
        <div>
          Progress:{" "}
          <span className="font-medium text-gray-700">
            {selectedSubject.progress?.approved ?? 0}/{selectedSubject.progress?.required ?? 0}
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
              <p className="text-xs text-gray-500">Manual review required by our team.</p>
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
              <PayloadSection submissionDetail={submissionDetail} />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Documents
              </h4>
              <DocumentsSection submissionDetail={submissionDetail} />
            </div>

            <div className="space-y-3">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <MessageCircle size={14} />
                Conversation
              </h4>
              <ThreadsSection submissionDetail={submissionDetail} />
            </div>

            <DecisionForm
              decision={decision}
              setDecision={setDecision}
              decisionMessage={decisionMessage}
              setDecisionMessage={setDecisionMessage}
              canDecide={canDecide}
              requiresMessage={requiresMessage}
              isPending={isPending}
              onSubmit={onDecisionSubmit}
            />
          </>
        )}
      </div>
    </div>
  </div>
);

export default SubmissionDetailPanel;
