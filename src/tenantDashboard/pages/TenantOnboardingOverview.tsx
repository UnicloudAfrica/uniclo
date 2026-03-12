import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import TenantPageShell from "../components/TenantPageShell";
import { useTenantClientOnboardingState } from "@/hooks/tenantHooks/useTenantClientOnboardingState";
import {
  useTenantSubjectOnboarding,
  type TenantSubjectOnboardingArgs,
} from "@/hooks/tenantHooks/useTenantSubjectOnboarding";
import ToastUtils from "@/utils/toastUtil";
import { useOnboardingReviewQueue, useUpdateOnboardingStatus } from "@/hooks/onboardingReviewHooks";

import type {
  DecisionStatus,
  OnboardingSubject,
  OnboardingSubjectState,
  OnboardingStep,
  ReviewQueueEntry,
} from "./tenantOnboardingOverview/types";
import { asArray, getErrorMessage, normalizeProgress } from "./tenantOnboardingOverview/utils";
import SubjectList from "./tenantOnboardingOverview/SubjectList";
import ReviewQueuePanel from "./tenantOnboardingOverview/ReviewQueuePanel";
import SubmissionDetailPanel from "./tenantOnboardingOverview/SubmissionDetailPanel";

/* ------------------------------------------------------------------ */
/*  Main orchestrator component                                        */
/* ------------------------------------------------------------------ */

const TenantOnboardingOverview = () => {
  const [selectedSubject, setSelectedSubject] = useState<OnboardingSubject | null>(null);
  const [activeStep, setActiveStep] = useState<OnboardingStep["id"] | null>(null);
  const [decision, setDecision] = useState<DecisionStatus>("in_review");
  const [decisionMessage, setDecisionMessage] = useState("");
  const contentRef = useRef<HTMLDivElement | null>(null);

  /* ---- data fetching ---- */

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

  /* ---- derived subject lists ---- */

  const buildSubjects = (
    items: OnboardingSubjectState[],
    target: "tenant" | "client"
  ): OnboardingSubject[] =>
    (items ?? [])
      .map((item): OnboardingSubject | null => {
        if (item.id === null || item.id === undefined) return null;
        const steps = asArray<OnboardingStep>(item.steps);
        return {
          id: item.id,
          name: item.name,
          email: item.email,
          tenant_name: item.tenant_name,
          target,
          subjectKey: `${target}:${item.id}`,
          source: "state",
          status: item.status ?? "submitted",
          steps,
          current_step: item.current_step ?? steps[0]?.id ?? null,
          progress: normalizeProgress(item.progress, steps.length),
        };
      })
      .filter((item): item is OnboardingSubject => Boolean(item));

  const tenantSubjects = useMemo(
    () => buildSubjects(stateData.tenants, "tenant"),
    [stateData.tenants]
  );

  const clientSubjects = useMemo(
    () => buildSubjects(stateData.clients, "client"),
    [stateData.clients]
  );

  /* ---- sync effects ---- */

  useEffect(() => {
    if (!selectedSubject) return;

    if (selectedSubject.source === "queue") {
      const lookup =
        selectedSubject.target === "tenant"
          ? tenantSubjects.find((s) => String(s.id) === String(selectedSubject.id))
          : clientSubjects.find((s) => String(s.id) === String(selectedSubject.id));

      if (lookup) {
        setSelectedSubject(lookup);
        setActiveStep(lookup.current_step ?? lookup.steps[0]?.id ?? null);
      }
      return;
    }

    const exists =
      tenantSubjects.some((s) => s.subjectKey === selectedSubject.subjectKey) ||
      clientSubjects.some((s) => s.subjectKey === selectedSubject.subjectKey);

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

  /* ---- detail query ---- */

  const detailArgs = useMemo(() => {
    if (!selectedSubject || !activeStep) return null;
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

  /* ---- step / decision state ---- */

  const selectedStepDefinition = useMemo(() => {
    if (!selectedSubject || !activeStep) return null;
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

  /* ---- handlers ---- */

  const handleSelectSubject = (subject: OnboardingSubject) => {
    setSelectedSubject(subject);
    setActiveStep(subject.current_step ?? subject.steps[0]?.id ?? null);
  };

  const handleQueueSelect = (entry: ReviewQueueEntry) => {
    const isTenant = entry.target === "tenant";
    const subjectId = isTenant ? entry.tenant_id : entry.user_id;
    const match = isTenant
      ? tenantSubjects.find((s) => String(s.id) === String(subjectId))
      : clientSubjects.find((s) => String(s.id) === String(subjectId));

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

    setSelectedSubject(fallbackSubject as never);
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
        step: activeStep as never,
        status: decision,
        message: decisionMessage.trim() || undefined,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Submission status updated.");
          setDecisionMessage("");
          refetchState();
          refetchQueue();
          if (detailArgs) refetchSubmission();
        },
        onError: (error) => {
          ToastUtils.error(getErrorMessage(error, "Unable to update submission status."));
        },
      }
    );
  };

  const stepStatus = selectedStepDefinition?.status ?? "not_started";

  /* ---- render ---- */

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
          {/* Sidebar */}
          <div className="space-y-6">
            <ReviewQueuePanel
              reviewQueue={reviewQueue}
              isQueueLoading={isQueueLoading}
              selectedSubject={selectedSubject}
              onSelect={handleQueueSelect}
            />

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

          {/* Main content */}
          <div className="space-y-6">
            {!selectedSubject ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <p className="text-sm text-gray-500">
                  Select a sub tenant or client to view their onboarding trail.
                </p>
              </div>
            ) : (
              <SubmissionDetailPanel
                selectedSubject={selectedSubject}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
                selectedStepDefinition={selectedStepDefinition}
                stepStatus={stepStatus}
                isDetailLoading={isDetailLoading}
                isDetailFetching={isDetailFetching}
                submissionDetail={submissionDetail}
                decision={decision}
                setDecision={setDecision}
                decisionMessage={decisionMessage}
                setDecisionMessage={setDecisionMessage}
                canDecide={canDecide}
                requiresMessage={requiresMessage}
                isPending={updateStatusMutation.isPending}
                onDecisionSubmit={handleDecisionSubmit}
              />
            )}
          </div>
        </div>
      </div>
    </TenantPageShell>
  );
};

export default TenantOnboardingOverview;
