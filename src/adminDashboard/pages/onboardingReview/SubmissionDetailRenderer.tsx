import React from "react";
import { AlertCircle, ClipboardList, Clock, FileDown, Loader2, MessageCircle } from "lucide-react";
import { ModernTable, StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS } from "@/shared/constants/onboarding";
import type {
  SubmissionDocument,
  SubmissionThread,
  SubmissionData,
} from "@/shared/types/onboarding";
import type { Founder } from "@/shared/types/onboarding";
import type { PayloadEntry, Step } from "./onboardingReviewTypes";
import { formatBoolean, formatDateTime, resolveStatusTone } from "./onboardingReviewHelpers";

// --- Value renderer ---

const renderValue = (value: unknown): React.ReactNode => {
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

  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj["document_id"]) {
      return (
        <a
          href={String(obj["url"] || "#")}
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

// --- Document link ---

const renderDocumentLink = (document: SubmissionDocument | undefined, label: string) => {
  if (!document || (!document.url && !document.path)) {
    return <span className="text-sm text-gray-400">{"\u2014"}</span>;
  }

  const href = document.url || document.path;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
    >
      <FileDown size={14} />
      {label}
      {document.version ? <span className="text-xs text-gray-400">v{document.version}</span> : null}
    </a>
  );
};

// --- Founders section ---

const FoundersSection: React.FC<{ founders: Founder[] }> = ({ founders }) => {
  if (!founders.length) {
    return null;
  }

  const InfoRow = ({
    label,
    value,
    full = false,
  }: {
    label: string;
    value: string | number | boolean | null | undefined;
    full?: boolean;
  }) => (
    <div className={full ? "sm:col-span-2" : ""}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
        {value && `${value}`.trim() !== "" ? (
          value
        ) : (
          <span className="text-gray-400">{"\u2014"}</span>
        )}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-800">Founders & Directors</h4>
      <div className="space-y-4">
        {founders.map((founder, index) => (
          <div
            key={founder.id ?? index}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm space-y-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900">
                  {founder.name && founder.name.trim() !== ""
                    ? founder.name
                    : `Founder ${index + 1}`}
                </p>
                {founder.role && <p className="text-xs text-gray-500">Role: {founder.role}</p>}
              </div>
              {founder.ownership && (
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  Ownership {founder.ownership}
                </span>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="Nationality" value={founder.nationality} />
              <InfoRow label="Identifier" value={founder.identifier} />
              <InfoRow label="Board director" value={formatBoolean(founder.is_board_director)} />
              <InfoRow label="National ID type" value={founder.national_id_type} />
              <InfoRow label="National ID number" value={founder.national_id_number} />
              <InfoRow label="Address" value={founder.address} full />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Utility bill
                </p>
                {renderDocumentLink(founder.utility_bill, "View utility bill")}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Supporting ID
                </p>
                {renderDocumentLink(founder.supporting_id, "View supporting ID")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Documents section ---

const DocumentsSection: React.FC<{ documents: SubmissionDocument[] }> = ({ documents }) => {
  if (!documents.length) {
    return <p className="text-sm text-gray-500">No documents uploaded for this step.</p>;
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
              Uploaded {formatDateTime(document.created_at)} {"\u2022"} Version {document.version}
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

// --- Threads section ---

const ThreadsSection: React.FC<{ threads: SubmissionThread[] }> = ({ threads }) => {
  if (!threads.length) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        No conversation yet. Send a message with your status update to start the thread.
      </div>
    );
  }

  return (
    <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
      {threads.map((thread: SubmissionThread) => (
        <div key={thread.id} className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium text-gray-900">
              {thread.author?.name ?? thread.author?.type ?? "Actor"}
            </div>
            <span className="text-xs text-gray-500">
              {thread.created_at ? new Date(thread.created_at).toLocaleString() : ""}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line text-gray-700">{thread.message || "\u2014"}</p>
          {thread.attachments?.length ? (
            <div className="mt-2 space-y-1">
              {thread.attachments.map(
                (
                  attachment: NonNullable<SubmissionThread["attachments"]>[number],
                  index: number
                ) => (
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
                )
              )}
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

// --- Main renderer ---

interface SubmissionDetailRendererProps {
  subjectSelected: boolean;
  subjectType: "tenant" | "client";
  activeStep: string | null;
  isDetailLoading: boolean;
  currentStatus: string;
  submission: SubmissionData | null;
  selectedStepDefinition: Step | null;
  founders: Founder[];
  payloadEntries: [string, unknown][];
  documents: SubmissionDocument[];
  threads: SubmissionThread[];
}

const SubmissionDetailRenderer: React.FC<SubmissionDetailRendererProps> = ({
  subjectSelected,
  subjectType,
  activeStep,
  isDetailLoading,
  currentStatus,
  submission,
  selectedStepDefinition,
  founders,
  payloadEntries,
  documents,
  threads,
}) => {
  if (!subjectSelected) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
        Select a persona and {subjectType === "tenant" ? "tenant" : "client"} to start reviewing
        submissions.
      </div>
    );
  }

  if (!activeStep) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
        Choose a step from the list to view submission details.
      </div>
    );
  }

  if (isDetailLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading submission detail...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          label={STATUS_LABELS[currentStatus] ?? currentStatus}
          tone={resolveStatusTone(currentStatus, "neutral")}
        />
        <div className="text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            Submitted: {formatDateTime(submission?.submitted_at)}
          </div>
          <div className="flex items-center gap-1">
            <ClipboardList size={12} />
            Reviewed: {formatDateTime(submission?.reviewed_at)}
          </div>
        </div>
      </div>

      {selectedStepDefinition && selectedStepDefinition.id === "founders_directors" && (
        <FoundersSection founders={founders} />
      )}

      {!(
        selectedStepDefinition &&
        selectedStepDefinition.id === "founders_directors" &&
        founders.length > 0
      ) && (
        <ModernTable<PayloadEntry>
          data={payloadEntries.map(([key, value], index) => ({
            id: `${key}-${index}`,
            fieldName: key,
            fieldValue: value,
          }))}
          columns={[
            {
              key: "fieldName",
              header: "Field",
              render: (val: unknown) => (
                <span className="font-medium text-gray-700">{val as string}</span>
              ),
            },
            {
              key: "fieldValue",
              header: "Value",
              render: (val: unknown) => renderValue(val),
            },
          ]}
          emptyMessage={
            !submission ? "No submission found for this step." : "No data provided yet."
          }
          paginated={false}
          searchable={false}
        />
      )}

      {selectedStepDefinition?.id !== "founders_directors" && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-800">Documents</h3>
          <DocumentsSection documents={documents} />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <MessageCircle size={16} />
          Conversation History
        </h3>
        <ThreadsSection threads={threads} />
      </div>
    </div>
  );
};

export default SubmissionDetailRenderer;
