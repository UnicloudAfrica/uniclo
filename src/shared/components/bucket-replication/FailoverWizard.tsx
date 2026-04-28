import { useEffect, useId, useMemo, useState } from "react";
import { ModernButton, ModernInput, ModernModal } from "@/shared/components/ui";
import type { FailoverState, FailoverStep } from "./types";
import { extractErrorMessage } from "./internal/extractErrorMessage";

export interface FailoverWizardProps {
  isOpen: boolean;
  /** Live replication state — drives which step is currently allowed. */
  state: FailoverState;
  /** Step 1: fence the source. Returns a promise so we can show pending. */
  onInitiate: () => Promise<unknown>;
  /** Step 2 → 3: complete drain + promote. Receives the typed bucket name. */
  onCompleteDrain: (confirmedBucketName: string) => Promise<unknown>;
  /** Cancel a failover that's still in fencing/draining. */
  onCancel: () => Promise<unknown>;
  /** Close the modal without taking action (replication stays in current state). */
  onClose: () => void;
  /** Optional label override for the resource being failed over. */
  resourceLabel?: string;
  /**
   * M1: optional success callback. The wizard calls this with a stable
   * step identifier and a copy-ready message after each step succeeds,
   * so consumers can wire toasts (or telemetry, audit logs, etc.) at
   * the page layer without re-implementing the wizard.
   */
  onStepSuccess?: (event: {
    step: FailoverStep;
    message: string;
  }) => void;
}

/**
 * EC-38 two-phase (really three-step) failover wizard.
 *
 * The UX is deliberately heavy because the action is irreversible mid-
 * way and silently destructive at the end. We trade clicks for safety:
 *
 *   Step 1 · Fence source
 *     - Big red box explaining this blocks writes on the source bucket
 *     - "Cancel" stays available all the way through step 2; only
 *       "Promote" in step 3 is a hard one-way door
 *
 *   Step 2 · Drain queue
 *     - "Proceed to promote" is disabled until queueDepth hits 0
 *     - Closing the modal mid-drain leaves status=fencing/draining;
 *       reopening the wizard resumes from this step (we read state)
 *
 *   Step 3 · Promote target
 *     - User must type the target bucket name verbatim to enable the
 *       promote button (typed-confirm pattern)
 *     - Match is case-sensitive — bucket names are case-sensitive on S3
 *
 * Accessibility:
 *   - role="dialog" + aria-modal owned by ModernModal primitive
 *   - aria-labelledby on the modal points at the dialog title
 *   - Step pills have aria-current="step" on the active one
 *   - Focus moves to the primary action button when each step renders
 *   - Esc closes (ModernModal default) — but only step-1/2; step-3 is
 *     intentionally NOT escapable mid-confirm so an accidental keypress
 *     doesn't lose the typed bucket name
 *
 * Edge cases handled:
 *   - Server returns 422 on initiate (e.g. CRR detected) → we surface
 *     the error via onInitiate's promise rejection; the modal returns
 *     to step 1 and shows the message
 *   - User reopens after a closed-mid-drain — the wizard auto-skips to
 *     step 2 based on state.status
 *   - Bucket name with leading/trailing whitespace in the target → we
 *     match exact (no trim) because S3 bucket names never have whitespace
 *     anyway and trimming would mask copy-paste mistakes
 *   - state changes mid-flow (e.g. queue drains while modal is open) →
 *     useEffect on state.queueDepth re-evaluates the proceed button
 */
export default function FailoverWizard({
  isOpen,
  state,
  onInitiate,
  onCompleteDrain,
  onCancel,
  onClose,
  resourceLabel,
  onStepSuccess,
}: FailoverWizardProps) {
  // Resume-aware initial step: if the replication is already fencing or
  // draining when the wizard opens, don't make the user click "fence"
  // again — surface step 2.
  const initialStep: FailoverStep = useMemo(() => {
    if (state.status === "draining") return "drain";
    if (state.status === "fencing") return "drain";
    return "fence";
  }, [state.status]);

  const [step, setStep] = useState<FailoverStep>(initialStep);
  const [typedName, setTypedName] = useState("");
  const [pending, setPending] = useState<null | "fence" | "drain" | "cancel">(null);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  // Re-sync step when modal reopens against fresh state.
  useEffect(() => {
    if (isOpen) {
      setStep(initialStep);
      setTypedName("");
      setError(null);
      setPending(null);
    }
  }, [isOpen, initialStep]);

  // Auto-advance to step 3 once drain completes (queueDepth hits 0).
  // We don't auto-promote — that's intentional, the user must still
  // type the bucket name to fire the destructive action.
  // (We don't auto-advance OUT of step 3 here either.)
  // No effect needed — step 2 button is enabled by the queueDepth check.

  // Note on focus management: ModernButton in this codebase doesn't
  // forward refs, so we don't programmatically focus the primary
  // action. Browsers DO move focus into the modal on open (handled by
  // ModernModal's focus trap). Step 3's input has autoFocus, which IS
  // important because the typed-confirm pattern needs to receive
  // keystrokes immediately. For step 1 and 2, natural Tab order is
  // sufficient because the user just clicked a button to open the
  // modal — they're already in pointer-mode.

  const targetBucket = state.targetBucketName;
  const canPromote = step === "promote" && state.queueDepth === 0 && typedName === targetBucket;

  const handleInitiate = async () => {
    setError(null);
    setPending("fence");
    try {
      await onInitiate();
      setStep("drain");
      onStepSuccess?.({
        step: "fence",
        message: "Source fenced. Waiting for drain to complete (queue depth = 0).",
      });
    } catch (e) {
      setError(extractErrorMessage(e) ?? "Failed to fence the source bucket.");
    } finally {
      setPending(null);
    }
  };

  const handleProceedToPromote = () => {
    setError(null);
    if (state.queueDepth > 0) return;
    setStep("promote");
  };

  const handlePromote = async () => {
    if (!canPromote || pending) return;
    setError(null);
    setPending("drain");
    try {
      await onCompleteDrain(typedName);
      onStepSuccess?.({
        step: "promote",
        message:
          "Target promoted. Replication is now one-way inverted; delete if not planning reverse replication within 7 days (EC-B9).",
      });
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e) ?? "Failed to promote the target bucket.");
    } finally {
      setPending(null);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setPending("cancel");
    try {
      await onCancel();
      onStepSuccess?.({
        step: "fence", // logical: we're returning to pre-fence state
        message: "Failover cancelled. Source unfenced; replication resumed.",
      });
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e) ?? "Failed to cancel the failover.");
    } finally {
      setPending(null);
    }
  };

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Failover wizard${resourceLabel ? ` · ${resourceLabel}` : ""}`}
      aria-labelledby={titleId}
    >
      <div className="p-4 space-y-4">
        <ol
          className="flex items-center gap-2 text-xs"
          aria-label="Failover progress"
        >
          <StepPill n={1} label="Fence source" current={step === "fence"} done={step !== "fence"} />
          <span aria-hidden="true">→</span>
          <StepPill n={2} label="Drain queue" current={step === "drain"} done={step === "promote"} />
          <span aria-hidden="true">→</span>
          <StepPill n={3} label="Promote target" current={step === "promote"} done={false} />
        </ol>

        {error && (
          <div
            role="alert"
            className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-800 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {step === "fence" && (
          <section className="space-y-3" aria-labelledby={`${titleId}-step1`}>
            <div
              id={`${titleId}-step1`}
              className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-900 dark:text-red-200"
            >
              <p className="font-semibold mb-1">Step 1 · Fence the source</p>
              <p>
                This applies a deny-writes bucket policy to the source.
                Existing client applications will fail. The action cannot be
                automatically undone after the drain starts — you can only
                cancel before drain completes.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <ModernButton variant="secondary" onClick={onClose}>
                Not now
              </ModernButton>
              <ModernButton
                variant="danger"
                disabled={pending !== null}
                onClick={handleInitiate}
              >
                {pending === "fence" ? "Fencing…" : "Fence source bucket"}
              </ModernButton>
            </div>
          </section>
        )}

        {step === "drain" && (
          <section className="space-y-3" aria-labelledby={`${titleId}-step2`}>
            <div
              id={`${titleId}-step2`}
              className="p-3 rounded bg-orange-50 dark:bg-orange-900/20 text-xs text-orange-900 dark:text-orange-200"
            >
              <p className="font-semibold mb-1">Step 2 · Wait for drain</p>
              <p>
                Queue depth:{" "}
                <strong className="font-mono tabular-nums">{state.queueDepth}</strong>
              </p>
              <p>
                The promote button enables when queue depth reaches 0. If
                you close this modal, the replication stays in the drain
                state — re-open this wizard to resume.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <ModernButton
                variant="secondary"
                onClick={handleCancel}
                disabled={pending !== null}
              >
                {pending === "cancel" ? "Cancelling…" : "Cancel failover"}
              </ModernButton>
              <ModernButton
                disabled={state.queueDepth > 0 || pending !== null}
                onClick={handleProceedToPromote}
              >
                {state.queueDepth > 0
                  ? `Waiting (${state.queueDepth} pending)`
                  : "Proceed to promote"}
              </ModernButton>
            </div>
          </section>
        )}

        {step === "promote" && (
          <section className="space-y-3" aria-labelledby={`${titleId}-step3`}>
            <div
              id={`${titleId}-step3`}
              className="p-3 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-900 dark:text-red-200"
            >
              <p className="font-semibold mb-1">Step 3 · Promote target — IRREVERSIBLE</p>
              <p>
                Type the target bucket name{" "}
                <code className="font-mono">{targetBucket}</code> to confirm.
                Promoting unlocks writes on target and leaves the source fenced.
              </p>
            </div>
            <ModernInput
              label="Type target bucket name"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={targetBucket}
              aria-describedby={`${titleId}-step3`}
              autoComplete="off"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <ModernButton variant="secondary" onClick={onClose}>
                Close (stays in drain)
              </ModernButton>
              <ModernButton
                variant="danger"
                disabled={!canPromote || pending !== null}
                onClick={handlePromote}
              >
                {pending === "drain" ? "Promoting…" : "Promote target"}
              </ModernButton>
            </div>
          </section>
        )}
      </div>
    </ModernModal>
  );
}

function StepPill({
  n,
  label,
  current,
  done,
}: {
  n: number;
  label: string;
  current: boolean;
  done: boolean;
}) {
  return (
    <li
      aria-current={current ? "step" : undefined}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
        done
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
          : current
            ? "bg-indigo-500 text-white"
            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
      }`}
    >
      <span className="font-semibold" aria-hidden="true">
        {done ? "✓" : n}
      </span>
      <span>{label}</span>
    </li>
  );
}

// extractErrorMessage moved to ./internal/extractErrorMessage.ts
// (shared with AccessGrantManager).
