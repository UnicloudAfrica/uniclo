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
      title={`Switch to backup${resourceLabel ? ` · ${resourceLabel}` : ""}`}
      aria-labelledby={titleId}
    >
      <div className="p-4 space-y-4">
        <ol
          className="flex items-center gap-2 text-xs"
          aria-label="Switch-over progress"
        >
          <StepPill n={1} label="Lock the source" current={step === "fence"} done={step !== "fence"} />
          <span aria-hidden="true">→</span>
          <StepPill n={2} label="Wait for last bytes" current={step === "drain"} done={step === "promote"} />
          <span aria-hidden="true">→</span>
          <StepPill n={3} label="Hand over to backup" current={step === "promote"} done={false} />
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
              className="p-3 rounded bg-danger-50 dark:bg-danger-900/20 text-xs text-danger-900 dark:text-danger-200"
            >
              <p className="font-semibold mb-1">🔒 Step 1 · Lock the source bucket</p>
              <p>
                We'll stop new writes to your source bucket so the backup can catch up.
                Apps that try to write to the source will get errors. You can still cancel
                until the next step finishes — after that, this becomes a one-way door.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <ModernButton variant="secondary" onClick={onClose}>
                Not yet
              </ModernButton>
              <ModernButton
                variant="danger"
                disabled={pending !== null}
                onClick={handleInitiate}
              >
                {pending === "fence" ? "Locking…" : "Lock the source"}
              </ModernButton>
            </div>
          </section>
        )}

        {step === "drain" && (
          <section className="space-y-3" aria-labelledby={`${titleId}-step2`}>
            <div
              id={`${titleId}-step2`}
              className="p-3 rounded bg-warning-50 dark:bg-warning-900/20 text-xs text-warning-900 dark:text-warning-200"
            >
              <p className="font-semibold mb-1">⏳ Step 2 · Waiting for the last bytes to land</p>
              <p>
                Files still copying:{" "}
                <strong className="font-mono tabular-nums">{state.queueDepth}</strong>
              </p>
              <p>
                We'll unlock the next button once the queue hits zero — that means the
                backup is fully caught up. Closing this modal is fine; the source stays
                locked and you can resume from this step anytime.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <ModernButton
                variant="secondary"
                onClick={handleCancel}
                disabled={pending !== null}
              >
                {pending === "cancel" ? "Cancelling…" : "Cancel and unlock source"}
              </ModernButton>
              <ModernButton
                disabled={state.queueDepth > 0 || pending !== null}
                onClick={handleProceedToPromote}
              >
                {state.queueDepth > 0
                  ? `Waiting (${state.queueDepth} files left)`
                  : "Ready to switch over"}
              </ModernButton>
            </div>
          </section>
        )}

        {step === "promote" && (
          <section className="space-y-3" aria-labelledby={`${titleId}-step3`}>
            <div
              id={`${titleId}-step3`}
              className="p-3 rounded bg-danger-50 dark:bg-danger-900/20 text-xs text-danger-900 dark:text-danger-200"
            >
              <p className="font-semibold mb-1">⚠️ Step 3 · Hand over to backup — point of no return</p>
              <p>
                Type the backup bucket name{" "}
                <code className="font-mono font-bold">{targetBucket}</code> below
                to confirm. Once we hand over, your apps should write to the backup —
                the source stays locked.
              </p>
              <p className="mt-2 italic opacity-80">
                We need to make sure you mean it — that's why you have to type it.
              </p>
            </div>
            <ModernInput
              label={`Type "${targetBucket}" exactly to confirm`}
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder={targetBucket}
              aria-describedby={`${titleId}-step3`}
              autoComplete="off"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <ModernButton variant="secondary" onClick={onClose}>
                Not yet — close this
              </ModernButton>
              <ModernButton
                variant="danger"
                disabled={!canPromote || pending !== null}
                onClick={handlePromote}
              >
                {pending === "drain" ? "Switching over…" : "Yes, hand over to backup"}
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
          ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
          : current
            ? "bg-primary-500 text-white"
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
