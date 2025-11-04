import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FileDown,
  Loader2,
  MessageCircle,
  Send,
  Users,
} from "lucide-react";
import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";
import ToastUtils from "../../utils/toastUtil";
import { useFetchTenants } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import {
  fetchAdminOnboardingSubmission,
  useAdminOnboardingQueue,
  useAdminOnboardingSubmission,
  useAdminUpdateOnboardingStatus,
} from "../../hooks/adminHooks/onboardingReviewHooks";
import { getStepsForTarget } from "../../dashboard/onboarding/stepConfig";

const ADMIN_PERSONA_OPTIONS = [
  {
    value: "tenant_business",
    label: "Tenant / Partner (Business)",
    description: "Primary tenant onboarding including partner qualification.",
    target: "tenant",
    subjectType: "tenant",
  },
  {
    value: "tenant_client_business",
    label: "Tenant Client (Business)",
    description: "Business clients onboarded under a tenant.",
    target: "client",
    subjectType: "client",
  },
  {
    value: "tenant_client_individual",
    label: "Tenant Client (Individual)",
    description: "Individual accounts registered under a tenant.",
    target: "client",
    subjectType: "client",
  },
  {
    value: "internal_client_business",
    label: "Internal CRM Account",
    description: "Direct CRM-managed customers without a tenant.",
    target: "client",
    subjectType: "client",
  },
];

const STATUS_LABELS = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_TONES = {
  not_started: "info",
  draft: "neutral",
  submitted: "info",
  in_review: "info",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_OPTIONS = [
  { value: "in_review", label: "Keep in review" },
  { value: "changes_requested", label: "Request changes" },
  { value: "approved", label: "Approve submission" },
  { value: "rejected", label: "Reject submission" },
];

const DEFAULT_QUERY_ARGS = {
  target: "tenant",
  tenantId: null,
  userId: null,
  step: null,
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "—";

const flattenPayload = (payload, prefix = "") => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  return Object.entries(payload).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !("document_id" in value)
    ) {
      return flattenPayload(value, path);
    }

    return [[path, value]];
  });
};

const renderValue = (value) => {
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
    if (value.document_id) {
      return (
        <a
          href={value.url}
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

const OnboardingReviewPage = ({
  personaOptions = ADMIN_PERSONA_OPTIONS,
  useQueueHook = useAdminOnboardingQueue,
  fetchSubmissionFn = fetchAdminOnboardingSubmission,
  useSubmissionHook = useAdminOnboardingSubmission,
  useUpdateStatusHook = useAdminUpdateOnboardingStatus,
  title = "Onboarding Review",
  description = "Review submissions, view uploaded documents, and collaborate with tenants and clients during onboarding.",
  queueRefreshMs = 60_000,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const defaultPersona = personaOptions[0]?.value ?? null;
  const [persona, setPersona] = useState(defaultPersona);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [activeStep, setActiveStep] = useState(null);
  const [stepSummaries, setStepSummaries] = useState({});
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [decision, setDecision] = useState("in_review");
  const [decisionMessage, setDecisionMessage] = useState("");

  const queueSelectionRef = useRef(null);

  const { data: tenants = [], isFetching: isTenantsLoading } = useFetchTenants();
  const { data: clients = [], isFetching: isClientsLoading } = useFetchClients();
  const queueQueryOptions = useMemo(
    () => ({ refetchInterval: queueRefreshMs }),
    [queueRefreshMs]
  );
  const {
    data: reviewQueue = [],
    isFetching: isQueueLoading,
  } = useQueueHook(null, queueQueryOptions);
  const personaOptionMap = useMemo(() => {
    const map = new Map();
    personaOptions.forEach((option) => {
      map.set(option.value, option);
    });
    return map;
  }, [personaOptions]);

  useEffect(() => {
    if (!personaOptions.length) {
      if (persona !== null) {
        setPersona(null);
      }
      return;
    }

    if (!personaOptions.some((option) => option.value === persona)) {
      setPersona(personaOptions[0].value);
    }
  }, [personaOptions, persona]);

  const personaConfig = useMemo(
    () => personaOptions.find((option) => option.value === persona) ?? null,
    [personaOptions, persona]
  );

  const steps = useMemo(
    () => (persona ? getStepsForTarget(persona) : []),
    [persona]
  );

  const target = personaConfig?.target ?? "tenant";
  const subjectType = personaConfig?.subjectType ?? "tenant";

  const tenantId = target === "tenant" ? selectedTenantId || null : null;
  const userId = target === "tenant" ? null : selectedClientId || null;

  const subjectSelected = Boolean(target === "tenant" ? tenantId : userId);

  const stepIds = useMemo(() => steps.map((step) => step.id), [steps]);

  const tenantsOptions = useMemo(() => {
    return tenants.map((tenant) => ({
      value: tenant.id,
      label:
        tenant.name ||
        tenant.company_name ||
        tenant.identifier ||
        tenant.slug ||
        tenant.email ||
        tenant.id,
    }));
  }, [tenants]);

  const filteredClients = useMemo(() => {
    const items = Array.isArray(clients) ? clients : [];
    return items
      .filter((client) => {
        if (!client) return false;
        const entity = (client.entity || "").toLowerCase();
        const hasTenant = Boolean(client.tenant_id);

        switch (persona) {
          case "tenant_client_business":
            return hasTenant && entity !== "individual";
          case "tenant_client_individual":
            return hasTenant && entity === "individual";
          case "internal_client_business":
            return !hasTenant;
          default:
            return true;
        }
      })
      .map((client) => {
        const nameCandidate =
          client.company_name ||
          client.full_name ||
          client.name ||
          `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() ||
          client.email ||
          client.identifier ||
          client.id;

        const tenantLabel = client.tenant_name || client.tenant?.name;

        return {
          value: client.id,
          label: tenantLabel
            ? `${nameCandidate} • ${tenantLabel}`
            : nameCandidate,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clients, persona]);

  useEffect(() => {
    const queued = queueSelectionRef.current;

    if (queued && queued.persona === persona) {
      if (queued.target === "tenant") {
        setSelectedTenantId(queued.tenantId ?? "");
        setSelectedClientId("");
      } else {
        setSelectedClientId(queued.userId ?? "");
        setSelectedTenantId("");
      }
      setActiveStep(queued.stepId ?? null);
      setStepSummaries({});
      setDecision("in_review");
      setDecisionMessage("");
      return;
    }

    setSelectedTenantId("");
    setSelectedClientId("");
    setActiveStep(null);
    setStepSummaries({});
    setDecision("in_review");
    setDecisionMessage("");
  }, [persona]);

  useEffect(() => {
    const queued = queueSelectionRef.current;
    const tenantKey = tenantId ?? "";
    const userKey = userId ?? "";

    if (queued) {
      const matches =
        (queued.tenantId ?? "") === tenantKey &&
        (queued.userId ?? "") === userKey;

      if (matches) {
        setActiveStep(queued.stepId ?? null);
        setStepSummaries({});
        setDecision("in_review");
        setDecisionMessage("");
        queueSelectionRef.current = null;
        return;
      }
    }

    if (!tenantKey && !userKey) {
      setActiveStep(null);
      setStepSummaries({});
      setDecision("in_review");
      setDecisionMessage("");
      return;
    }

    if (!queued) {
      setActiveStep(null);
      setStepSummaries({});
      setDecision("in_review");
      setDecisionMessage("");
    }
  }, [tenantId, userId]);

  const loadStepSummaries = useCallback(async () => {
    if (!subjectSelected) {
      setStepSummaries({});
      setActiveStep(null);
      return;
    }

    setLoadingSummaries(true);
    try {
      const results = await Promise.all(
        steps.map(async (step) => {
          const { submission, meta } = await fetchSubmissionFn({
            target,
            tenantId,
            userId,
            step: step.id,
          });

          return {
            stepId: step.id,
            status: submission?.status ?? meta?.status ?? "not_started",
            submitted_at: submission?.submitted_at ?? null,
            reviewed_at: submission?.reviewed_at ?? null,
          };
        })
      );

      const summaryMap = results.reduce((acc, item) => {
        acc[item.stepId] = {
          status: item.status,
          submitted_at: item.submitted_at,
          reviewed_at: item.reviewed_at,
        };
        return acc;
      }, {});

      setStepSummaries(summaryMap);
      setActiveStep((prev) =>
        prev && stepIds.includes(prev) ? prev : steps[0]?.id ?? null
      );
    } catch (error) {
      ToastUtils.error(
        error?.message ?? "Failed to load onboarding submissions."
      );
    } finally {
      setLoadingSummaries(false);
    }
  }, [subjectSelected, steps, stepIds, target, tenantId, userId, fetchSubmissionFn]);

  useEffect(() => {
    if (subjectSelected) {
      loadStepSummaries();
    } else {
      setStepSummaries({});
      setActiveStep(null);
    }
  }, [subjectSelected, loadStepSummaries]);

  const detailArgs = useMemo(() => {
    if (!subjectSelected || !activeStep) {
      return null;
    }

    return {
      target,
      tenantId,
      userId,
      step: activeStep,
    };
  }, [subjectSelected, activeStep, target, tenantId, userId]);

  const {
    data: submissionResponse,
    isLoading: isSubmissionLoading,
    isFetching: isSubmissionFetching,
    refetch: refetchSubmission,
  } = useSubmissionHook(detailArgs ?? DEFAULT_QUERY_ARGS, {
    enabled: Boolean(detailArgs),
  });

  const selectedStepDefinition = useMemo(() => {
    if (!activeStep) return null;
    return steps.find((step) => step.id === activeStep) ?? null;
  }, [steps, activeStep]);

  const submission = submissionResponse?.submission ?? null;
  const submissionMeta = submissionResponse?.meta ?? {};
  const currentStatus =
    submission?.status ?? submissionMeta?.status ?? "not_started";

  useEffect(() => {
    if (!activeStep) return;

    setStepSummaries((prev) => ({
      ...prev,
      [activeStep]: {
        status: currentStatus,
        submitted_at:
          submission?.submitted_at ?? prev[activeStep]?.submitted_at ?? null,
        reviewed_at:
          submission?.reviewed_at ?? prev[activeStep]?.reviewed_at ?? null,
      },
    }));
  }, [activeStep, currentStatus, submission]);

  useEffect(() => {
    if (!activeStep) return;

    if (!submission && currentStatus === "not_started") {
      setDecision("in_review");
      setDecisionMessage("");
      return;
    }

    setDecision(
      ["in_review", "changes_requested", "approved", "rejected"].includes(
        currentStatus
      )
        ? currentStatus
        : "in_review"
    );
    setDecisionMessage("");
  }, [activeStep, currentStatus, submission]);

  const updateStatusMutation = useUpdateStatusHook();

  const subjectLabel = useMemo(() => {
    if (!subjectSelected) return "—";
    if (target === "tenant") {
      return (
        tenantsOptions.find((option) => option.value === tenantId)?.label ??
        tenantId ??
        "—"
      );
    }

    return (
      filteredClients.find((option) => option.value === userId)?.label ??
      userId ??
      "—"
    );
  }, [subjectSelected, target, tenantsOptions, filteredClients, tenantId, userId]);

  const requiresMessage = ["changes_requested", "rejected"].includes(decision);
  const founders = useMemo(() => {
    const data = submission?.payload?.founders;
    return Array.isArray(data) ? data : [];
  }, [submission]);
  const payloadEntries = useMemo(() => {
    const entries = flattenPayload(submission?.payload ?? {});
    if (!founders.length) {
      return entries;
    }

    return entries.filter(([key]) => !key.startsWith("founders"));
  }, [submission, founders]);
  const documents = submission?.documents ?? [];
  const threads = submission?.threads ?? [];

  const handleQueueSelection = useCallback(
    (entry) => {
      if (!entry) {
        return;
      }

      const primaryStep =
        entry.awaiting_steps?.[0]?.id ??
        (Array.isArray(entry.awaiting_steps) && entry.awaiting_steps.length > 0
          ? entry.awaiting_steps[0].id
          : null);

      queueSelectionRef.current = {
        persona: entry.persona,
        target: entry.target,
        tenantId: entry.tenant_id ?? "",
        userId: entry.user_id ?? "",
        stepId: primaryStep,
      };

      if (persona !== entry.persona) {
        setPersona(entry.persona);
        return;
      }

      if (entry.target === "tenant") {
        setSelectedTenantId(entry.tenant_id ?? "");
        setSelectedClientId("");
      } else {
        setSelectedClientId(entry.user_id ?? "");
        setSelectedTenantId("");
      }

      setStepSummaries({});
      setDecision("in_review");
      setDecisionMessage("");
    },
    [
      persona,
      setPersona,
      setSelectedTenantId,
      setSelectedClientId,
      setStepSummaries,
      setDecision,
      setDecisionMessage,
    ]
  );

  const progressSnapshot = useMemo(() => {
    if (!steps.length) {
      return {
        completed: 0,
        inFlight: 0,
        pending: 0,
        percent: 0,
      };
    }

    let completed = 0;
    let inFlight = 0;
    let pending = 0;

    steps.forEach((step) => {
      const status = stepSummaries[step.id]?.status ?? "not_started";
      if (status === "approved") {
        completed += 1;
      } else if (
        status === "submitted" ||
        status === "in_review" ||
        status === "changes_requested"
      ) {
        inFlight += 1;
      } else {
        pending += 1;
      }
    });

    const percent = Math.min(
      100,
      Math.round((completed / steps.length) * 100)
    );

    return {
      completed,
      inFlight,
      pending,
      percent,
    };
  }, [steps, stepSummaries]);

  const pendingSteps = useMemo(() => {
    if (!steps.length) {
      return [];
    }

    return steps
      .filter((step) => {
        const status = stepSummaries[step.id]?.status ?? "not_started";
        return !["approved", "submitted", "in_review", "changes_requested"].includes(
          status
        );
      })
      .map((step) => ({
        id: step.id,
        label: step.label,
        status: stepSummaries[step.id]?.status ?? "not_started",
      }));
  }, [steps, stepSummaries]);

  const awaitingReviewSteps = useMemo(() => {
    if (!steps.length) {
      return [];
    }

    const reviewStatuses = new Set([
      "submitted",
      "in_review",
      "changes_requested",
    ]);

    return steps
      .filter((step) => {
        const status = stepSummaries[step.id]?.status ?? "not_started";
        return reviewStatuses.has(status);
      })
      .map((step) => ({
        id: step.id,
        label: step.label,
        status: stepSummaries[step.id]?.status ?? "submitted",
      }));
  }, [steps, stepSummaries]);

  const activeStepIndex = useMemo(() => {
    if (!activeStep) {
      return -1;
    }

    return steps.findIndex((step) => step.id === activeStep);
  }, [steps, activeStep]);

  const heroSubjectTitle = subjectSelected ? subjectLabel : "No record selected";
  const heroSubtitle = subjectSelected
    ? "Review the submitted onboarding data and keep the conversation moving."
    : "Choose a persona and record to unlock onboarding submissions.";

  const latestThread = useMemo(() => {
    if (!Array.isArray(threads) || !threads.length) {
      return null;
    }

    return threads.reduce((latest, thread) => {
      if (!thread?.created_at) {
        return latest ?? thread;
      }

      if (!latest?.created_at) {
        return thread;
      }

      return new Date(thread.created_at) > new Date(latest.created_at)
        ? thread
        : latest;
    }, null);
  }, [threads]);

  const handleDecisionSubmit = () => {
    if (!detailArgs) {
      ToastUtils.error("Select a step before updating the status.");
      return;
    }

    if (requiresMessage && !decisionMessage.trim()) {
      ToastUtils.error("A message is required for the selected status.");
      return;
    }

    updateStatusMutation.mutate(
      {
        target: detailArgs.target,
        tenantId: detailArgs.tenantId,
        userId: detailArgs.userId,
        step: detailArgs.step,
        status: decision,
        message: decisionMessage.trim() || undefined,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Submission status updated.");
          setDecisionMessage("");
          loadStepSummaries();
          refetchSubmission();
        },
        onError: (error) => {
          ToastUtils.error(
            error?.message ?? "Unable to update submission status."
          );
        },
      }
  );
};

  const isDetailLoading =
    (detailArgs && isSubmissionLoading) || isSubmissionFetching;

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const renderPersonaOption = (option) => {
    const isActive = persona === option.value;

    return (
      <button
        key={option.value}
        onClick={() => setPersona(option.value)}
        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
          isActive
            ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
            : "border-gray-200 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-sm font-semibold ${
                isActive ? "text-blue-700" : "text-gray-800"
              }`}
            >
              {option.label}
            </p>
            <p className="mt-1 text-xs text-gray-500">{option.description}</p>
          </div>
          {isActive && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
        </div>
      </button>
    );
  };

  const renderStepStatus = (stepId) => {
    const summary = stepSummaries[stepId] ?? {
      status: "not_started",
      submitted_at: null,
      reviewed_at: null,
    };

    const tone = STATUS_TONES[summary.status] ?? "neutral";
    const label = STATUS_LABELS[summary.status] ?? summary.status;

    return (
      <div className="flex flex-col gap-1">
        <StatusPill label={label} tone={tone} />
        <div className="text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Submitted: {formatDateTime(summary.submitted_at)}
          </div>
          <div className="flex items-center gap-1">
            <ClipboardList className="h-3 w-3" />
            Reviewed: {formatDateTime(summary.reviewed_at)}
          </div>
        </div>
      </div>
    );
  };

  const renderPayloadRows = () => {
    if (!submission) {
      return (
        <tr>
          <td colSpan={2} className="py-4 text-center text-sm text-gray-500">
            No submission found for this step.
          </td>
        </tr>
      );
    }

    if (payloadEntries.length === 0) {
      return (
        <tr>
          <td colSpan={2} className="py-4 text-center text-sm text-gray-500">
            No data provided yet.
          </td>
        </tr>
      );
    }

    return payloadEntries.map(([key, value]) => (
      <tr key={key} className="border-b border-gray-100">
        <td className="w-1/3 px-4 py-3 text-sm font-medium text-gray-700">
          {key}
        </td>
        <td className="px-4 py-3 text-sm text-gray-700">
          {renderValue(value)}
        </td>
      </tr>
    ));
  };

  const renderDocumentLink = (document, label) => {
    if (!document || (!document.url && !document.path)) {
      return <span className="text-sm text-gray-400">—</span>;
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
        {document.version ? (
          <span className="text-xs text-gray-400">v{document.version}</span>
        ) : null}
      </a>
    );
  };

  const formatBoolean = (value) => {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    const normalized = value.toString().trim().toLowerCase();
    if (["yes", "y", "true"].includes(normalized)) {
      return "Yes";
    }
    if (["no", "n", "false"].includes(normalized)) {
      return "No";
    }

    return value;
  };

  const renderFounders = () => {
    if (!founders.length) {
      return null;
    }

    const InfoRow = ({ label, value, full = false }) => (
      <div className={full ? "sm:col-span-2" : ""}>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
          {value && `${value}`.trim() !== "" ? value : <span className="text-gray-400">—</span>}
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
                  {founder.role && (
                    <p className="text-xs text-gray-500">Role: {founder.role}</p>
                  )}
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
                <InfoRow
                  label="Board director"
                  value={formatBoolean(founder.is_board_director)}
                />
                <InfoRow label="National ID type" value={founder.national_id_type} />
                <InfoRow
                  label="National ID number"
                  value={founder.national_id_number}
                />
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

  const renderDocuments = () => {
    if (!documents.length) {
      return (
        <p className="text-sm text-gray-500">
          No documents uploaded for this step.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-semibold text-gray-800">
                {document.category ?? "Document"}
              </p>
              <p className="text-xs text-gray-500">
                Uploaded {formatDateTime(document.created_at)} • Version{" "}
                {document.version}
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
    if (!threads.length) {
      return (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          No conversation yet. Send a message with your status update to start the thread.
        </div>
      );
    }

    return (
      <div className="max-h-64 space-y-3 overflow-y-auto pr-2">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className="rounded-lg border border-gray-200 bg-white p-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">
                {thread.author?.name ?? thread.author?.type ?? "Actor"}
              </div>
              <span className="text-xs text-gray-500">
                {thread.created_at
                  ? new Date(thread.created_at).toLocaleString()
                  : ""}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line text-gray-700">
              {thread.message || "—"}
            </p>
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

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        title={title}
        description={description}
        contentClassName="space-y-8"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={personaConfig?.label ?? "Persona"} tone="info" />
            {subjectSelected && <StatusPill label={subjectLabel} tone="neutral" />}
          </div>
        }
      >
        <div className="space-y-6">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#2563EB] text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%)]" />
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl space-y-6">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                    <span className="rounded-full bg-white/15 px-3 py-1">
                      Onboarding Review
                    </span>
                    {personaConfig?.label ? (
                      <span className="rounded-full bg-white/10 px-3 py-1">
                        {personaConfig.label}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {heroSubjectTitle}
                    </h1>
                    <p className="text-sm text-white/80 sm:text-base">
                      {heroSubtitle}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                        Active Step
                      </p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {selectedStepDefinition?.label ?? "Select a step"}
                          </p>
                          <p className="mt-1 text-xs text-white/70">
                            {selectedStepDefinition?.description ??
                              "Pick a submission step from the list to view details."}
                          </p>
                        </div>
                        {activeStepIndex >= 0 && (
                          <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                            Step {activeStepIndex + 1} of {steps.length}
                          </span>
                        )}
                      </div>
                      {subjectSelected && activeStep && (
                        <div className="mt-3 inline-flex items-center gap-2">
                          <StatusPill
                            label={STATUS_LABELS[currentStatus] ?? currentStatus}
                            tone={STATUS_TONES[currentStatus] ?? "neutral"}
                          />
                          <span className="text-[11px] text-white/70">
                            Updated {formatDateTime(submission?.reviewed_at)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                      <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                        Review Progress
                      </p>
                      <div className="mt-2 flex items-end justify-between">
                        <p className="text-3xl font-semibold">
                          {progressSnapshot.percent}%
                        </p>
                        <p className="text-xs text-white/70">
                          {progressSnapshot.completed} / {steps.length} steps approved
                        </p>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-white transition-all"
                          style={{ width: `${progressSnapshot.percent}%` }}
                        />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-white/70">
                            Approved
                          </p>
                          <p className="text-sm font-semibold">
                            {progressSnapshot.completed}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-white/70">
                            In Motion
                          </p>
                          <p className="text-sm font-semibold">
                            {progressSnapshot.inFlight}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-white/70">
                            Pending
                          </p>
                          <p className="text-sm font-semibold">
                            {progressSnapshot.pending}
                          </p>
                        </div>
                      </div>
                      {subjectSelected && (
                        <div className="mt-4 space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-white/70">
                              Awaiting Review ({awaitingReviewSteps.length})
                            </p>
                            {awaitingReviewSteps.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {awaitingReviewSteps.map((step) => (
                                  <button
                                    key={step.id}
                                    onClick={() => setActiveStep(step.id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/25"
                                  >
                                    <span>{step.label}</span>
                                    <StatusPill
                                      label={STATUS_LABELS[step.status] ?? step.status}
                                      tone={STATUS_TONES[step.status] ?? "info"}
                                    />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-white/70">
                                Nothing is queued for review right now.
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-white/70">
                              Not Started ({pendingSteps.length})
                            </p>
                            {pendingSteps.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {pendingSteps.map((step) => (
                                  <button
                                    key={step.id}
                                    onClick={() => setActiveStep(step.id)}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                                  >
                                    <span>{step.label}</span>
                                    <StatusPill
                                      label={STATUS_LABELS[step.status] ?? step.status}
                                      tone={STATUS_TONES[step.status] ?? "neutral"}
                                    />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-white/70">
                                All steps have been initiated.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-full max-w-sm space-y-4 rounded-[28px] bg-white/10 p-5 backdrop-blur">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Collaboration
                    </p>
                    <p className="mt-2 text-sm text-white/90">
                      Keep the conversation visible for tenants and internal reviewers.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/20 px-4 py-3 text-sm text-white/90">
                    {!subjectSelected ? (
                      <p>Select a record to preview conversations.</p>
                    ) : latestThread ? (
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {latestThread.author?.name ??
                            latestThread.author?.type ??
                            "Actor"}
                        </p>
                        <p className="text-xs text-white/80">
                          {formatDateTime(latestThread.created_at)}
                        </p>
                        <p className="max-h-24 overflow-hidden whitespace-pre-line text-sm text-white/90">
                          {latestThread.message || "—"}
                        </p>
                      </div>
                    ) : (
                      <p>No messages yet — send a decision to start the thread.</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <Users size={16} className="shrink-0 text-white/90" />
                    <span>
                      {subjectSelected
                        ? `Reviewing ${subjectLabel}`
                        : "Awaiting selection"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6 xl:sticky xl:top-24">
              <ModernCard title="Awaiting Review" className="space-y-3">
                {isQueueLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading review queue…
                  </div>
                ) : reviewQueue.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nothing is waiting for review right now.
                  </p>
                ) : (
                  <>
                    <div className="hidden rounded-2xl border border-gray-200 md:block">
                      <div className="w-full overflow-x-auto">
                        <table className="min-w-[700px] divide-y divide-gray-100 text-sm">
                          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">Subject</th>
                              <th className="hidden md:table-cell px-4 py-3 text-left font-semibold">
                                Persona
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">Pending Steps</th>
                              <th className="px-4 py-3 text-left font-semibold">Queued</th>
                              <th className="hidden lg:table-cell px-4 py-3 text-left font-semibold">
                                Last Activity
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {reviewQueue
                              .slice()
                              .sort((a, b) => {
                                const aTime = a.queued_since ? new Date(a.queued_since).getTime() : Number.POSITIVE_INFINITY;
                                const bTime = b.queued_since ? new Date(b.queued_since).getTime() : Number.POSITIVE_INFINITY;
                                return aTime - bTime;
                              })
                              .map((entry) => {
                                const personaMeta = personaOptionMap.get(entry.persona);
                                const personaLabel = personaMeta?.label ?? entry.persona;
                                const tenantKey = tenantId ? String(tenantId) : "";
                                const userKey = userId ? String(userId) : "";
                                const entryTenantId = entry.tenant_id ?? "";
                                const entryUserId = entry.user_id ?? "";
                                const secondaryLine =
                                  entry.subtitle || entry.email || entry.tenant_name || null;
                                const queuedSince = entry.queued_since
                                  ? formatDateTime(entry.queued_since)
                                  : "—";
                                const lastActivity = entry.last_activity_at
                                  ? formatDateTime(entry.last_activity_at)
                                  : "—";
                                const awaitingSteps = Array.isArray(entry.awaiting_steps)
                                  ? entry.awaiting_steps
                                  : [];
                                const isActive =
                                  persona === entry.persona &&
                                  ((entry.target === "tenant" && tenantKey === entryTenantId) ||
                                    (entry.target !== "tenant" && userKey === entryUserId));

                                return (
                                  <tr
                                    key={entry.key}
                                    onClick={() => handleQueueSelection(entry)}
                                    className={`cursor-pointer transition ${
                                      isActive ? "bg-blue-50/60" : "hover:bg-gray-50"
                                    }`}
                                  >
                                    <td className="max-w-[200px] px-4 py-3 align-top">
                                      <div className="space-y-1">
                                        <p className="font-semibold text-gray-900">{entry.label}</p>
                                        {secondaryLine && (
                                          <p className="text-xs text-gray-500">{secondaryLine}</p>
                                        )}
                                      </div>
                                    </td>
                                    <td className="hidden md:table-cell px-4 py-3 align-top text-xs text-gray-600">
                                      {personaLabel}
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
                                    </td>
                                    <td className="px-4 py-3 align-top text-xs text-gray-600">
                                      {queuedSince}
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-3 align-top text-xs text-gray-600">
                                      {lastActivity}
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="space-y-3 md:hidden">
                      {reviewQueue
                        .slice()
                        .sort((a, b) => {
                          const aTime = a.queued_since ? new Date(a.queued_since).getTime() : Number.POSITIVE_INFINITY;
                          const bTime = b.queued_since ? new Date(b.queued_since).getTime() : Number.POSITIVE_INFINITY;
                          return aTime - bTime;
                        })
                        .map((entry) => {
                          const personaMeta = personaOptionMap.get(entry.persona);
                          const personaLabel = personaMeta?.label ?? entry.persona;
                          const secondaryLine =
                            entry.subtitle || entry.email || entry.tenant_name || null;
                          const awaitingSteps = Array.isArray(entry.awaiting_steps)
                            ? entry.awaiting_steps
                            : [];
                          const queuedSince = entry.queued_since
                            ? formatDateTime(entry.queued_since)
                            : "—";
                          const lastActivity = entry.last_activity_at
                            ? formatDateTime(entry.last_activity_at)
                            : "—";
                          const isActive =
                            persona === entry.persona &&
                            ((entry.target === "tenant" &&
                              (tenantId ? String(tenantId) : "") === (entry.tenant_id ?? "")) ||
                              (entry.target !== "tenant" &&
                                (userId ? String(userId) : "") === (entry.user_id ?? "")));

                          return (
                            <button
                              key={entry.key}
                              onClick={() => handleQueueSelection(entry)}
                              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                isActive
                                  ? "border-blue-500 bg-blue-50 shadow-sm"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {entry.label}
                                  </p>
                                  {secondaryLine && (
                                    <p className="text-xs text-gray-500">{secondaryLine}</p>
                                  )}
                                  <p className="text-[11px] uppercase tracking-wide text-gray-400">
                                    {personaLabel}
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
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock size={12} />
                                  <span>Queued {queuedSince}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
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
                                        {STATUS_LABELS[step.status] ?? step.status}
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
              </ModernCard>

              <ModernCard title="Select Persona" className="space-y-3">
                <div className="space-y-3">
                  {personaOptions.map(renderPersonaOption)}
                </div>
              </ModernCard>

              <ModernCard
                title={subjectType === "tenant" ? "Select Tenant" : "Select Client"}
              >
                <div className="space-y-4">
                  {subjectType === "tenant" ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700">
                        Tenant
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTenantId}
                          onChange={(event) => setSelectedTenantId(event.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            {isTenantsLoading ? "Loading tenants..." : "Select a tenant"}
                          </option>
                          {tenantsOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700">
                        Client
                      </label>
                      <div className="relative">
                        <select
                          value={selectedClientId}
                          onChange={(event) => setSelectedClientId(event.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">
                            {isClientsLoading ? "Loading clients..." : "Select a client"}
                          </option>
                          {filteredClients.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <p className="flex items-center gap-2 text-xs text-gray-500">
                    <Users size={14} />
                    Choose who you are reviewing to view their onboarding trail.
                  </p>
                </div>
              </ModernCard>

              <ModernCard title="Steps" className="space-y-3">
                {!subjectSelected ? (
                  <p className="text-sm text-gray-500">
                    Select a {subjectType === "tenant" ? "tenant" : "client"} above to load onboarding steps.
                  </p>
                ) : loadingSummaries ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading submissions…
                  </div>
                ) : (
                  <div className="space-y-3">
                    {steps.map((step) => {
                      const isActive = activeStep === step.id;
                      return (
                        <button
                          key={step.id}
                          onClick={() => setActiveStep(step.id)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                            isActive
                              ? "border-blue-500 bg-blue-50 shadow-sm"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {step.label}
                              </p>
                              {step.description && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {step.description}
                                </p>
                              )}
                            </div>
                            <ChevronRight
                              className={`h-4 w-4 text-gray-400 transition ${
                                isActive ? "translate-x-1 text-blue-500" : ""
                              }`}
                            />
                          </div>
                          <div className="mt-3">{renderStepStatus(step.id)}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ModernCard>
            </div>

            <div className="space-y-6">
              <ModernCard
                title={activeStep ? steps.find((step) => step.id === activeStep)?.label ?? "Submission Detail" : "Submission Detail"}
                description={
                  activeStep
                    ? steps.find((step) => step.id === activeStep)?.description ?? ""
                    : "Choose a step to review the submitted information."
                }
              >
                {!subjectSelected ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                    Select a persona and {subjectType === "tenant" ? "tenant" : "client"} to start reviewing submissions.
                  </div>
                ) : !activeStep ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
                    Choose a step from the list to view submission details.
                  </div>
                ) : isDetailLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading submission detail…
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill
                        label={STATUS_LABELS[currentStatus] ?? currentStatus}
                        tone={STATUS_TONES[currentStatus] ?? "neutral"}
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

                    {selectedStepDefinition && selectedStepDefinition.id === "founders_directors" &&
                      renderFounders()}

                    {!(selectedStepDefinition && selectedStepDefinition.id === "founders_directors" && founders.length > 0) && (
                      <div className="rounded-2xl border border-gray-200">
                        <table className="w-full text-left text-sm">
                          <tbody>{renderPayloadRows()}</tbody>
                        </table>
                      </div>
                    )}

                    {selectedStepDefinition?.id !== "founders_directors" && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-800">
                          Documents
                        </h3>
                        {renderDocuments()}
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <MessageCircle size={16} />
                        Conversation History
                      </h3>
                      {renderThreads()}
                    </div>
                  </div>
                )}
              </ModernCard>

              <ModernCard title="Decision" className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDecision(option.value)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                        decision === option.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
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
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Share guidance or next steps with the submitter."
                  />
                  <p className="text-xs text-gray-500">
                    Messages are visible to the submitter. Use them to clarify changes or confirm approval details.
                  </p>
                </div>
                <ModernButton
                  onClick={handleDecisionSubmit}
                  isLoading={updateStatusMutation.isPending}
                  isDisabled={!detailArgs || updateStatusMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Send size={16} />
                  {updateStatusMutation.isPending ? "Updating…" : "Send decision"}
                </ModernButton>
              </ModernCard>
            </div>
          </div>
        </div>
      </AdminPageShell>
    </>
  );
};

const AdminOnboardingReview = () => <OnboardingReviewPage />;

export {
  OnboardingReviewPage,
  ADMIN_PERSONA_OPTIONS,
  STATUS_LABELS,
  STATUS_TONES,
  STATUS_OPTIONS,
};

export default AdminOnboardingReview;
