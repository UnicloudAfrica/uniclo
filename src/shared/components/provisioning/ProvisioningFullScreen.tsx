import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import SetupProgressCard from "../projects/details/SetupProgressCard";

interface SetupStep {
  status?: string;
  label?: string;
  context?: {
    error?: string;
    attempt?: number;
    max_tries?: number;
    retry_at?: string;
    failed_at?: string;
  } & Record<string, unknown>;
  [key: string]: unknown;
}

// How long the pipeline may sit at zero forward progress (no completed
// steps, nothing actively running) before we stop reassuring the user and
// call it stuck. Comfortably longer than a normal queue pickup + first
// stage, so a freshly-dispatched job never trips it.
const STUCK_AFTER_MS = 90_000;

interface ProvisioningFullScreenProps {
  project: { name?: string; status?: string } | null;
  setupSteps: SetupStep[];
  onRefresh?: () => void;
  onViewProject?: () => void;
  /**
   * Called when the user clicks "Retry Provisioning" on a failed project.
   * Caller should fire `useRetryProjectProvisioning().mutate({ projectId })`
   * and refetch project state. Button is hidden when not provided.
   */
  onRetry?: () => void;
  /** True while the retry mutation is in flight; disables the button. */
  isRetrying?: boolean;
}

const ProvisioningFullScreen: React.FC<ProvisioningFullScreenProps> = ({
  project,
  setupSteps,
  onRefresh,
  onViewProject,
  onRetry,
  isRetrying = false,
}) => {
  const onRefreshRef = useRef(onRefresh);
  const hasRefreshHandler = Boolean(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Detect failure FIRST. The backend marks `project.status === "failed"`
  // only after the worker has truly given up (retries exhausted). A failed
  // *step* alongside an in-flight retry/in-progress step is mid-recovery,
  // NOT terminal — flashing "Provisioning Failed" + Retry button at the
  // user during an active backoff is a lie that scares them into a manual
  // retry on top of the queue's automatic one.
  //
  // Rule: trust project.status as the source of truth. Only fall back to
  // step-level inference when the backend hasn't shipped a status (very
  // old payloads) AND the pipeline has visibly stopped.
  const failedStep = setupSteps.find((s) => s.status === "failed");
  const hasActiveWork = setupSteps.some(
    (s) =>
      s.status === "in_progress" ||
      s.status === "pending" ||
      s.status === "retrying"
  );
  const hasFailed =
    project?.status === "failed" ||
    (project?.status == null && Boolean(failedStep) && !hasActiveWork);

  // Calculate progress percentage
  const totalSteps = setupSteps.length;
  const completedSteps = setupSteps.filter((s) => s.status === "completed").length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Find current active step
  const currentStep = setupSteps.find((s) => s.status === "pending" || s.status === "in_progress");

  // --- Stuck / timed-out detection -------------------------------------
  // Distinct from `hasFailed` (terminal, backend gave up) and from a
  // healthy in-flight pipeline. Two honest signals:
  //
  //  1. Retries exhausted: the queue pushed a `retrying` step whose
  //     attempt count has reached max_tries. The job is about to flip to
  //     `failed` but the project may still read `provisioning` for a beat;
  //     either way nothing more will happen automatically.
  //  2. No forward progress: status is provisioning/pending, steps exist,
  //     but none have completed and none are actively running — every step
  //     is `not_started` (job never picked up) or only a stale retry/failed
  //     remains. We gate this on a dwell timer so a just-dispatched job
  //     never trips it.
  const retryingStep = setupSteps.find((s) => s.status === "retrying");
  const retriesExhausted = Boolean(
    retryingStep?.context &&
      typeof retryingStep.context.attempt === "number" &&
      typeof retryingStep.context.max_tries === "number" &&
      retryingStep.context.attempt >= retryingStep.context.max_tries
  );

  const isProvisioningStatus =
    project?.status === "provisioning" || project?.status === "pending";
  const hasAnyCompleted = completedSteps > 0;
  const hasLiveWork = setupSteps.some(
    (s) => s.status === "in_progress" || s.status === "pending"
  );
  // Zero forward motion: provisioning, but nothing done and nothing
  // genuinely advancing — either every step is `not_started` or the
  // payload shipped no steps at all. (A `retrying` step alone is not
  // "live work".)
  const noForwardProgress =
    isProvisioningStatus && !hasAnyCompleted && !hasLiveWork;

  // Dwell timer for the no-forward-progress case. Reset whenever the
  // pipeline shows life again, so a recovering job clears the warning.
  const [dwellElapsed, setDwellElapsed] = useState(false);
  useEffect(() => {
    if (!noForwardProgress || hasFailed) {
      setDwellElapsed(false);
      return;
    }
    const t = setTimeout(() => setDwellElapsed(true), STUCK_AFTER_MS);
    return () => clearTimeout(t);
  }, [noForwardProgress, hasFailed]);

  // Stuck = the pipeline has stalled but the backend hasn't (yet) marked it
  // terminally failed. Never overrides the genuine failed state.
  const isStuck = !hasFailed && (retriesExhausted || (noForwardProgress && dwellElapsed));

  // The error/timeout reason to surface. Prefer the failed step's real
  // message; fall back to the retrying step's underlying error, then a
  // generic timeout line. Never a raw provider object, never silence.
  const failureReason =
    failedStep?.context?.error ??
    (isStuck ? retryingStep?.context?.error : undefined);

  // Keep polling while provisioning is active, then do one final refresh after 100%.
  // Stop polling on terminal failure — nothing more is going to happen until
  // the user clicks Retry, and continued polling just hammers the API.
  useEffect(() => {
    if (!hasRefreshHandler || hasFailed) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    if (progress >= 100) {
      timer = setTimeout(() => {
        onRefreshRef.current?.();
      }, 2000);
    } else {
      pollInterval = setInterval(() => {
        onRefreshRef.current?.();
      }, 5000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [progress, hasRefreshHandler, hasFailed]);

  // Show completion state when at 100% AND not failed
  const isComplete = !hasFailed && progress >= 100;

  return (
    <div
      className={`fixed inset-0 z-[100] ${isComplete ? "bg-green-50/95" : "bg-slate-50/95"} backdrop-blur-xl flex flex-col items-center justify-start py-20 p-6 overflow-y-auto animate-in fade-in duration-500`}
    >
      {/* Background decoration */}
      <div
        className="absolute top-0 left-0 w-full h-2/3 -z-10 opacity-70"
        style={{
          background: isComplete
            ? "radial-gradient(circle at 50% 0%, rgb(var(--theme-success-500) / 0.4), transparent 70%)"
            : "radial-gradient(circle at 50% 0%, var(--theme-color-10, rgba(40, 141, 209, 0.15)), transparent 70%)",
        }}
      />

      {/* Exit button */}
      <button
        onClick={() => {
          if (isComplete && onViewProject) {
            onViewProject();
          } else {
            globalThis.window.history.back();
          }
        }}
        className="absolute top-8 left-8 text-gray-400 hover:text-gray-600 flex items-center gap-2 text-sm font-medium transition-colors"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        {isComplete ? "Exit to Dashboard" : "Back to Projects"}
      </button>

      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-12">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-2xl ${isComplete ? "shadow-green-200" : "shadow-[--theme-color-10]"} mb-8 relative`}
          >
            {isComplete ? (
              <CheckCircle className="w-12 h-12 text-green-500" />
            ) : hasFailed ? (
              <AlertTriangle className="w-12 h-12 text-red-500" />
            ) : isStuck ? (
              <AlertTriangle className="w-12 h-12 text-amber-500" />
            ) : (
              <Loader2 className="w-12 h-12 text-[--theme-color] animate-spin" />
            )}
            {!isComplete && !hasFailed && !isStuck && (
              <div className="absolute -inset-1 rounded-full border-2 border-[--theme-color-20] animate-pulse" />
            )}
            {isComplete && (
              <div className="absolute -inset-4 rounded-full bg-green-500/10 animate-ping duration-1000" />
            )}
            {hasFailed && (
              <div className="absolute -inset-2 rounded-full border-2 border-red-200" />
            )}
            {isStuck && (
              <div className="absolute -inset-2 rounded-full border-2 border-amber-200" />
            )}
          </div>

          <h1
            className={`text-5xl font-black mb-4 tracking-tighter ${
              isComplete
                ? "text-green-600"
                : hasFailed
                  ? "text-red-600"
                  : isStuck
                    ? "text-amber-600"
                    : "text-gray-900"
            }`}
          >
            {isComplete
              ? "Setup Complete!"
              : hasFailed
                ? "Provisioning Failed"
                : isStuck
                  ? "Provisioning Stalled"
                  : `Provisioning ${project?.name || "Project"}`}
          </h1>
          <p
            className={`text-xl max-w-lg mx-auto leading-relaxed font-medium ${
              isComplete
                ? "text-green-700/60"
                : hasFailed
                  ? "text-red-700/70"
                  : isStuck
                    ? "text-amber-700/80"
                    : "text-gray-500"
            }`}
          >
            {isComplete
              ? "Your infrastructure is ready. You can now start deploying resources."
              : hasFailed
                ? `Stopped at: ${failedStep?.label || "an unknown step"}.`
                : isStuck
                  ? "Setup hasn't made progress in a while and may be stuck. You can retry it below."
                  : "Please wait while we set up your dedicated infrastructure."}
          </p>

          {/* Failure / stalled detail panel — surfaces the real error or
              timeout reason + retry CTA. Red for a terminal failure, amber
              for a stall the backend hasn't given up on yet. */}
          {(hasFailed || isStuck) && (
            <div
              className={`mt-6 mx-auto max-w-2xl rounded-2xl border px-6 py-5 text-left ${
                hasFailed ? "border-red-200 bg-red-50/80" : "border-amber-200 bg-amber-50/80"
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 shrink-0 ${hasFailed ? "text-red-500" : "text-amber-500"}`}
                />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${hasFailed ? "text-red-900" : "text-amber-900"}`}>
                    {hasFailed
                      ? failedStep?.label || "A provisioning step failed"
                      : retriesExhausted
                        ? `Automatic retries exhausted${retryingStep?.context?.max_tries ? ` (${retryingStep.context.max_tries} attempts)` : ""}.`
                        : "Setup hasn't progressed and looks stuck."}
                  </p>
                  {failureReason ? (
                    <p className={`mt-1 text-sm ${hasFailed ? "text-red-700" : "text-amber-700"}`}>
                      {String(failureReason)}
                    </p>
                  ) : (
                    isStuck && (
                      <p className="mt-1 text-sm text-amber-700">
                        No error was reported. The provisioning worker may not have picked the job
                        up. Retrying re-dispatches it.
                      </p>
                    )
                  )}
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      disabled={isRetrying}
                      className={`mt-4 inline-flex items-center gap-2 rounded-full disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 transition ${
                        hasFailed
                          ? "bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                          : "bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400"
                      }`}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
                      />
                      {isRetrying ? "Retrying…" : "Retry Provisioning"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar Container */}
        <div
          className={`mb-12 bg-white rounded-3xl p-8 border ${isComplete ? "border-green-100 shadow-green-100/50" : "border-white shadow-gray-200/50"} shadow-2xl relative overflow-hidden`}
        >
          <div className="flex justify-between text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">
            <span>Overall Progress</span>
            <span className={isComplete ? "text-green-500" : "text-[--theme-color]"}>
              {progress}%
            </span>
          </div>
          <div className="w-full h-5 bg-gray-100 rounded-full overflow-hidden border border-gray-50 shadow-inner">
            <div
              className={`h-full transition-all duration-1000 ease-out relative ${isComplete ? "bg-green-500 shadow-[0_0_20px_rgb(var(--theme-success-500)/0.4)]" : "bg-[--theme-color]"}`}
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
          </div>
          {currentStep && (
            <div className="flex flex-col items-center mt-6">
              <div
                className={`px-4 py-1.5 ${isComplete ? "bg-green-100 text-green-700" : "bg-[--theme-color-10] text-[--theme-color]"} rounded-full text-xs font-bold flex items-center gap-2 ${!isComplete && "animate-bounce"}`}
              >
                <RefreshCw className={`w-3 h-3 ${!isComplete && "animate-spin"}`} />
                {(currentStep as { label?: string })?.label}{" "}
                {isComplete ? "Successful" : "In progress..."}
              </div>
            </div>
          )}
        </div>

        {/* The heavy lifter.
            pipelineActive tells the child to render mid-retry steps
            as "Retrying…" (yellow spinner) instead of red FAILED X.
            The pipeline is "active" when it hasn't terminally failed
            AND it's not finished — i.e. while the worker is still
            trying. This is the same logic the page-level title uses
            to decide between "Provisioning…" and "Provisioning Failed". */}
        <div
          className={`overflow-hidden rounded-3xl border ${isComplete ? "border-green-100 shadow-green-100/30" : "border-gray-100 shadow-gray-200/50"} bg-white shadow-2xl`}
        >
          <SetupProgressCard
            steps={setupSteps as never}
            isLoading={false}
            pipelineActive={!hasFailed && !isStuck && !isComplete}
          />
        </div>

        {/* Action Buttons */}
        {isComplete && onViewProject && (
          <div className="mt-12 flex justify-center pb-20">
            <button
              onClick={onViewProject}
              className="inline-flex items-center gap-4 px-12 py-6 bg-green-600 hover:bg-green-700 text-white text-xl font-black rounded-3xl shadow-[0_20px_50px_rgb(var(--theme-success-500)/0.3)] transition-all duration-300 transform hover:scale-105 active:scale-95 group"
            >
              Go to Dashboard
              <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        <div className="text-center mt-12 space-y-3 pb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg text-[10px] text-gray-500 font-mono uppercase tracking-widest">
            Project ID:{" "}
            {(project as { identifier?: string; id?: string })?.identifier ||
              (project as { identifier?: string; id?: string })?.id ||
              "Loading..."}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProvisioningFullScreen;
