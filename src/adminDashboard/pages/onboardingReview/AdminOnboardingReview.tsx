import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import AdminPageShell from "../../components/AdminPageShell";
import { ModernCard, StatusPill } from "@/shared/components/ui";
import { STATUS_LABELS } from "@/shared/constants/onboarding";
import type { QueueEntry, SubmissionData, SubmissionThread } from "@/shared/types/onboarding";
import ToastUtils from "@/utils/toastUtil";
import { useFetchTenants } from "@/hooks/adminHooks/tenantHooks";
import { useFetchClients } from "@/hooks/adminHooks/clientHooks";
import {
  fetchAdminOnboardingSubmission,
  useAdminOnboardingQueue,
  useAdminOnboardingSubmission,
  useAdminUpdateOnboardingStatus,
} from "@/hooks/adminHooks/onboardingReviewHooks";
import { getStepsForTarget } from "../../../dashboard/onboarding/stepConfig";

import type {
  OnboardingReviewPageProps,
  PersonaOption,
  Step,
  StepSummary,
  TenantOptionItem,
  ProgressSnapshot,
  StepItem,
} from "./onboardingReviewTypes";
import {
  ADMIN_PERSONA_OPTIONS,
  flattenPayload,
  formatDateTime,
  resolveStatusTone,
} from "./onboardingReviewHelpers";
import OnboardingQueueList from "./OnboardingQueueList";
import OnboardingStepPanel from "./OnboardingStepPanel";
import SubmissionDetailRenderer from "./SubmissionDetailRenderer";
import OnboardingDecisionPanel from "./OnboardingDecisionPanel";
import { PersonaSelector, SubjectSelector } from "./OnboardingFilters";

const OnboardingReviewPage: React.FC<OnboardingReviewPageProps> = ({
  personaOptions = ADMIN_PERSONA_OPTIONS,
  useQueueHook = useAdminOnboardingQueue,
  fetchSubmissionFn = fetchAdminOnboardingSubmission,
  useSubmissionHook = useAdminOnboardingSubmission,
  useUpdateStatusHook = useAdminUpdateOnboardingStatus,
  title = "Onboarding Review",
  description = "Review submissions, view uploaded documents, and collaborate with tenants and clients during onboarding.",
  queueRefreshMs = 60_000,
}) => {
  const defaultPersona = personaOptions[0]?.value ?? null;
  const [persona, setPersona] = useState<string | null>(defaultPersona);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [stepSummaries, setStepSummaries] = useState<Record<string, StepSummary>>({});
  const [loadingSummaries, setLoadingSummaries] = useState<boolean>(false);
  const [decision, setDecision] = useState<string>("in_review");
  const [decisionMessage, setDecisionMessage] = useState<string>("");

  const queueSelectionRef = useRef<QueueEntry | null>(null);

  const { data: tenantsData = [], isFetching: isTenantsLoading } = useFetchTenants();
  const { data: clients = [], isFetching: isClientsLoading } = useFetchClients();
  const tenants = useMemo<TenantOptionItem[]>(
    () => (Array.isArray(tenantsData) ? (tenantsData as TenantOptionItem[]) : []),
    [tenantsData]
  );
  const queueQueryOptions = useMemo<Record<string, unknown>>(
    () => ({ refetchInterval: queueRefreshMs }),
    [queueRefreshMs]
  );
  const { data: reviewQueue = [], isFetching: isQueueLoading } = useQueueHook(
    undefined,
    queueQueryOptions
  );
  const personaOptionMap = useMemo(() => {
    const map = new Map<string, PersonaOption>();
    personaOptions.forEach((option: PersonaOption) => {
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

    const fallbackPersona = personaOptions[0]?.value ?? null;
    if (persona && fallbackPersona && !personaOptions.some((option) => option.value === persona)) {
      setPersona(fallbackPersona);
    }
  }, [personaOptions, persona]);

  const personaConfig = useMemo(
    () => personaOptions.find((option) => option.value === persona) ?? null,
    [personaOptions, persona]
  );

  const steps: Step[] = useMemo(() => (persona ? getStepsForTarget(persona) : []), [persona]);

  const target = personaConfig?.target ?? "tenant";
  const subjectType = personaConfig?.subjectType ?? "tenant";

  const tenantId = target === "tenant" ? selectedTenantId || null : null;
  const userId = target === "tenant" ? null : selectedClientId || null;

  const subjectSelected = Boolean(target === "tenant" ? tenantId : userId);

  const stepIds = useMemo(() => steps.map((step) => step.id), [steps]);

  const tenantsOptions = useMemo(() => {
    return tenants.map((tenant) => ({
      value: tenant.id ?? "",
      label:
        tenant.name ||
        tenant.company_name ||
        tenant.identifier ||
        tenant.slug ||
        tenant.email ||
        tenant.id ||
        "Unknown tenant",
    }));
  }, [tenants]);

  const filteredClients = useMemo(() => {
    const items = Array.isArray(clients) ? clients : [];
    return items
      .filter((client: Record<string, unknown>) => {
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
      .map((client: Record<string, unknown>) => {
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
          label: tenantLabel ? `${nameCandidate} \u2022 ${tenantLabel}` : nameCandidate,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clients, persona]);

  useEffect(() => {
    const queued = queueSelectionRef.current;

    if (queued && queued.persona === persona) {
      if (queued.target === "tenant") {
        setSelectedTenantId(queued.tenant_id ?? "");
        setSelectedClientId("");
      } else {
        setSelectedClientId(queued.user_id ?? "");
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
      const matches = (queued.tenant_id ?? "") === tenantKey && (queued.user_id ?? "") === userKey;

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
            status: submission?.status ?? (meta?.["status"] as string) ?? "not_started",
            submitted_at: submission?.submitted_at ?? null,
            reviewed_at: submission?.reviewed_at ?? null,
          };
        })
      );
      const summaryMap = results.reduce((acc: Record<string, StepSummary>, item) => {
        acc[item.stepId] = {
          status: item.status,
          submitted_at: item.submitted_at,
          reviewed_at: item.reviewed_at,
        };
        return acc;
      }, {});

      setStepSummaries(summaryMap);
      setActiveStep((prev) => (prev && stepIds.includes(prev) ? prev : (steps[0]?.id ?? null)));
    } catch (error) {
      const err = error as Error;
      ToastUtils.error(err?.message ?? "Failed to load onboarding submissions.");
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
  } = useSubmissionHook(detailArgs as unknown, {
    enabled: Boolean(detailArgs),
  });

  const selectedStepDefinition = useMemo(() => {
    if (!activeStep) return null;
    return steps.find((step) => step.id === activeStep) ?? null;
  }, [steps, activeStep]);

  const submission: SubmissionData | null = submissionResponse?.submission ?? null;
  const submissionMeta = submissionResponse?.meta ?? {};
  const currentStatus =
    submission?.status ?? (submissionMeta?.["status"] as string) ?? "not_started";

  useEffect(() => {
    if (!activeStep) return;

    setStepSummaries((prev) => ({
      ...prev,
      [activeStep]: {
        status: currentStatus,
        submitted_at: submission?.submitted_at ?? prev[activeStep]?.submitted_at ?? null,
        reviewed_at: submission?.reviewed_at ?? prev[activeStep]?.reviewed_at ?? null,
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
      ["in_review", "changes_requested", "approved", "rejected"].includes(currentStatus)
        ? currentStatus
        : "in_review"
    );
    setDecisionMessage("");
  }, [activeStep, currentStatus, submission]);

  const updateStatusMutation = useUpdateStatusHook();

  const subjectLabel = useMemo(() => {
    if (!subjectSelected) return "\u2014";
    if (target === "tenant") {
      return (
        tenantsOptions.find((option) => option.value === tenantId)?.label ?? tenantId ?? "\u2014"
      );
    }

    return filteredClients.find((option) => option.value === userId)?.label ?? userId ?? "\u2014";
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
  const threads = useMemo(() => submission?.threads ?? [], [submission]);

  const handleQueueSelection = useCallback(
    (entry: QueueEntry) => {
      if (!entry) {
        return;
      }

      const primaryStep = entry.awaiting_steps?.[0]?.id ?? null;

      const nextSelection: QueueEntry = {
        key: entry.key,
        persona: entry.persona,
        target: entry.target,
        tenant_id: entry.tenant_id ?? "",
        user_id: entry.user_id ?? "",
        label: entry.label,
      };
      if (primaryStep) {
        nextSelection.stepId = primaryStep;
      }

      queueSelectionRef.current = nextSelection;
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

  const progressSnapshot = useMemo<ProgressSnapshot>(() => {
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

    const percent = Math.min(100, Math.round((completed / steps.length) * 100));

    return {
      completed,
      inFlight,
      pending,
      percent,
    };
  }, [steps, stepSummaries]);

  const pendingSteps = useMemo<StepItem[]>(() => {
    if (!steps.length) {
      return [];
    }

    return steps
      .filter((step) => {
        const status = stepSummaries[step.id]?.status ?? "not_started";
        return !["approved", "submitted", "in_review", "changes_requested"].includes(status);
      })
      .map((step) => ({
        id: step.id,
        label: step.label,
        status: stepSummaries[step.id]?.status ?? "not_started",
      }));
  }, [steps, stepSummaries]);

  const awaitingReviewSteps = useMemo<StepItem[]>(() => {
    if (!steps.length) {
      return [];
    }

    const reviewStatuses = new Set(["submitted", "in_review", "changes_requested"]);

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

    return threads.reduce(
      (latest, thread) => {
        if (!thread?.created_at) {
          return latest ?? thread;
        }

        if (!latest?.created_at) {
          return thread;
        }

        return new Date(thread.created_at) > new Date(latest.created_at) ? thread : latest;
      },
      null as SubmissionThread | null
    );
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
        onError: (error: unknown) => {
          const msg =
            error instanceof Error ? error.message : "Unable to update submission status.";
          ToastUtils.error(msg);
        },
      }
    );
  };

  const isDetailLoading = (detailArgs && isSubmissionLoading) || isSubmissionFetching;

  return (
    <AdminPageShell
      title={title}
      description={description}
      contentClassName="space-y-8"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={personaConfig?.label ?? "Persona"} tone="info" />
          {subjectSelected && <StatusPill label={subjectLabel as unknown} tone="neutral" />}
        </div>
      }
    >
      <div className="space-y-6">
        {/* --- Hero Banner --- */}
        <div className="brand-hero rounded-[32px] text-white shadow-2xl">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl space-y-6">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">
                  <span className="rounded-full bg-white/15 px-3 py-1">Onboarding Review</span>
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
                  <p className="text-sm text-white/80 sm:text-base">{heroSubtitle}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Active Step card */}
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
                          tone={resolveStatusTone(currentStatus, "neutral")}
                        />
                        <span className="text-[11px] text-white/70">
                          Updated {formatDateTime(submission?.reviewed_at)}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Progress card */}
                  <div className="rounded-3xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs font-medium uppercase tracking-wide text-white/70">
                      Review Progress
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <p className="text-3xl font-semibold">{progressSnapshot.percent}%</p>
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
                        <p className="text-sm font-semibold">{progressSnapshot.completed}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-white/70">
                          In Motion
                        </p>
                        <p className="text-sm font-semibold">{progressSnapshot.inFlight}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-white/70">Pending</p>
                        <p className="text-sm font-semibold">{progressSnapshot.pending}</p>
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
                                    label={
                                      STATUS_LABELS[step.status as keyof typeof STATUS_LABELS] ??
                                      step.status
                                    }
                                    tone={resolveStatusTone(step.status, "info")}
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
                                    label={
                                      STATUS_LABELS[step.status as keyof typeof STATUS_LABELS] ??
                                      step.status
                                    }
                                    tone={resolveStatusTone(step.status, "neutral")}
                                  />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-white/70">All steps have been initiated.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Collaboration sidebar */}
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
                        {latestThread.author?.name ?? latestThread.author?.type ?? "Actor"}
                      </p>
                      <p className="text-xs text-white/80">
                        {formatDateTime(latestThread.created_at)}
                      </p>
                      <p className="max-h-24 overflow-hidden whitespace-pre-line text-sm text-white/90">
                        {latestThread.message || "\u2014"}
                      </p>
                    </div>
                  ) : (
                    <p>No messages yet {"\u2014"} send a decision to start the thread.</p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-white/80">
                  <Users size={16} className="shrink-0 text-white/90" />
                  <span>
                    {subjectSelected ? `Reviewing ${subjectLabel}` : "Awaiting selection"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- Main two-column layout --- */}
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <div className="space-y-6 xl:sticky xl:top-24">
            <ModernCard title="Awaiting Review" className="space-y-3">
              <OnboardingQueueList
                isQueueLoading={isQueueLoading}
                reviewQueue={reviewQueue}
                personaOptionMap={personaOptionMap}
                persona={persona}
                tenantId={tenantId}
                userId={userId}
                onSelect={handleQueueSelection}
              />
            </ModernCard>

            <ModernCard title="Select Persona" className="space-y-3">
              <PersonaSelector
                personaOptions={personaOptions}
                persona={persona}
                onPersonaChange={setPersona}
              />
            </ModernCard>

            <ModernCard title={subjectType === "tenant" ? "Select Tenant" : "Select Client"}>
              <SubjectSelector
                subjectType={subjectType}
                tenantsOptions={tenantsOptions}
                selectedTenantId={selectedTenantId}
                onTenantChange={setSelectedTenantId}
                isTenantsLoading={isTenantsLoading}
                filteredClients={filteredClients}
                selectedClientId={selectedClientId}
                onClientChange={setSelectedClientId}
                isClientsLoading={isClientsLoading}
              />
            </ModernCard>

            <ModernCard title="Steps" className="space-y-3">
              <OnboardingStepPanel
                subjectSelected={subjectSelected}
                subjectType={subjectType}
                loadingSummaries={loadingSummaries}
                steps={steps}
                activeStep={activeStep}
                stepSummaries={stepSummaries}
                onStepSelect={setActiveStep}
              />
            </ModernCard>
          </div>

          <div className="space-y-6">
            <ModernCard
              title={
                activeStep
                  ? (steps.find((step) => step.id === activeStep)?.label ?? "Submission Detail")
                  : "Submission Detail"
              }
            >
              <p className="mb-4 text-sm text-gray-500">
                {activeStep
                  ? (steps.find((step) => step.id === activeStep)?.description ?? "")
                  : "Choose a step to review the submitted information."}
              </p>
              <SubmissionDetailRenderer
                subjectSelected={subjectSelected}
                subjectType={subjectType}
                activeStep={activeStep}
                isDetailLoading={Boolean(isDetailLoading)}
                currentStatus={currentStatus}
                submission={submission}
                selectedStepDefinition={selectedStepDefinition}
                founders={founders}
                payloadEntries={payloadEntries}
                documents={documents}
                threads={threads}
              />
            </ModernCard>

            <ModernCard title="Decision" className="space-y-4">
              <OnboardingDecisionPanel
                decision={decision}
                decisionMessage={decisionMessage}
                onDecisionChange={setDecision}
                onMessageChange={setDecisionMessage}
                onSubmit={handleDecisionSubmit}
                isPending={updateStatusMutation.isPending}
                isDisabled={!detailArgs || updateStatusMutation.isPending}
              />
            </ModernCard>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
};

export { OnboardingReviewPage, ADMIN_PERSONA_OPTIONS };
export default OnboardingReviewPage;
