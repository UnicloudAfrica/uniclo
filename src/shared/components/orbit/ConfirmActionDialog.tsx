import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { createPortal } from "react-dom";

/**
 * ConfirmActionDialog — accessible confirmation dialog for destructive or
 * irreversible operations. Used everywhere a tenant or admin clicks
 * "Execute BMR", "Cancel cutover", "Resolve split-brain", "Delete recovery
 * plan", etc.
 *
 * Why this exists:
 *   - Native window.confirm() isn't styleable, fails dark-mode, and ignores
 *     focus management
 *   - Each page rolling its own modal led to inconsistent ESC handling,
 *     focus trapping, scroll locking, and ARIA wiring
 *
 * Accessibility:
 *   - role="alertdialog", aria-modal="true"
 *   - aria-labelledby + aria-describedby auto-wired
 *   - Focus trapped inside the dialog while open; first focus on Cancel
 *     by default (least destructive) — pass `focusOn="confirm"` to flip
 *   - ESC closes (when not pending); body scroll locked
 *   - Returns focus to the trigger element on close
 *
 * Severity:
 *   - "warning" (default): yellow chrome, used for reversible actions
 *   - "danger": red chrome, used for irreversible/destructive actions;
 *     adds optional `requireTypeToConfirm` for high-stakes ops
 *
 * @example
 *   <ConfirmActionDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={() => execute.mutateAsync(id)}
 *     title="Execute BMR recovery?"
 *     description="This will provision a fresh target machine and stream the
 *                  source image onto it. The operation cannot be paused once
 *                  the partitioning phase begins."
 *     severity="danger"
 *     confirmLabel="Execute recovery"
 *     requireTypeToConfirm="EXECUTE"
 *   />
 */

export interface ConfirmActionDialogProps {
  /** Controls visibility. */
  open: boolean;
  /** Called when user clicks Cancel, presses ESC, or clicks the backdrop. */
  onClose: () => void;
  /**
   * Called when user clicks Confirm. Returning a promise causes the dialog
   * to show a loading state on the confirm button until it resolves; the
   * dialog auto-closes on resolve and stays open on reject (so the
   * consumer can show a toast and let the user retry).
   */
  onConfirm: () => void | Promise<unknown>;
  /** Dialog title — short, sentence-case, ends with "?" for confirmation. */
  title: string;
  /** Body copy — explain consequences. */
  description: string;
  /** Optional richer body (lists, callouts) rendered below `description`. */
  children?: React.ReactNode;
  /** Severity tier. Defaults to "warning". */
  severity?: "warning" | "danger";
  /** Confirm-button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel-button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * For high-stakes actions: require user to type this exact string before
   * the Confirm button enables. Example: "DELETE", "EXECUTE", the resource
   * name. Disables the requirement when undefined.
   */
  requireTypeToConfirm?: string;
  /** Where focus lands when dialog opens. Defaults to "cancel". */
  focusOn?: "cancel" | "confirm";
}

export function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  severity = "warning",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  requireTypeToConfirm,
  focusOn = "cancel",
}: ConfirmActionDialogProps): React.JSX.Element | null {
  const titleId = useId();
  const descId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [pending, setPending] = useState(false);
  const [typed, setTyped] = useState("");

  const typeToConfirmSatisfied = !requireTypeToConfirm || typed === requireTypeToConfirm;
  const confirmDisabled = pending || !typeToConfirmSatisfied;

  // Capture the previously-focused element so we can restore on close
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null;
      // Focus the requested element after the dialog mounts
      const target = focusOn === "confirm" ? confirmRef : cancelRef;
      requestAnimationFrame(() => target.current?.focus());
      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else {
      // Restore focus to whatever opened the dialog
      triggerRef.current?.focus?.();
      setTyped("");
      setPending(false);
    }
  }, [open, focusOn]);

  // ESC to close (unless pending)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onClose]);

  // Focus trap — Tab loops between cancel and confirm
  const handleTabTrap = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "Tab") return;
      const focusables = [cancelRef.current, confirmRef.current].filter(
        Boolean
      ) as HTMLButtonElement[];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    []
  );

  const handleConfirm = async () => {
    if (confirmDisabled) return;
    try {
      const result = onConfirm();
      if (result instanceof Promise) {
        setPending(true);
        await result;
        setPending(false);
        onClose();
      } else {
        onClose();
      }
    } catch {
      // Consumer is responsible for surfacing the error (toast, etc.).
      // We just stop the spinner so the user can retry from this dialog.
      setPending(false);
    }
  };

  if (!open) return null;

  const severityChrome = {
    warning: {
      icon: "text-yellow-500",
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      confirmBtn:
        "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-400 disabled:bg-yellow-300",
    },
    danger: {
      icon: "text-red-500",
      iconBg: "bg-red-100 dark:bg-red-900/30",
      confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-400 disabled:bg-red-300",
    },
  }[severity];

  return createPortal(
    <div
      // Backdrop — click outside closes (when not pending)
      role="presentation"
      onClick={pending ? undefined : onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleTabTrap}
        className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-900"
      >
        {/* Close (X) — keyboard-reachable, ESC-equivalent */}
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-4">
          <div
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${severityChrome.iconBg}`}
          >
            <AlertTriangle className={`h-5 w-5 ${severityChrome.icon}`} />
          </div>
          <div className="flex-1 pt-0.5">
            <h2
              id={titleId}
              className="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
            <p id={descId} className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>
            {children && <div className="mt-3">{children}</div>}

            {requireTypeToConfirm && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Type{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs dark:bg-gray-800">
                    {requireTypeToConfirm}
                  </code>{" "}
                  to confirm
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  disabled={pending}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Type ${requireTypeToConfirm} to enable confirm`}
                  className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:ring-offset-gray-900"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            aria-disabled={confirmDisabled}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900 ${severityChrome.confirmBtn}`}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ConfirmActionDialog;
