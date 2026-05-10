import React, { ReactNode, useState, forwardRef } from "react";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { usePrefersReducedMotion, orbitTransition } from "./motion";

/**
 * AsyncButton — a button that handles its own loading + success + error
 * states based on the promise its onClick returns.
 *
 * Replaces the recurring boilerplate:
 *   const [pending, setPending] = useState(false);
 *   const onClick = async () => { setPending(true); try { ... } finally { setPending(false); } };
 *   <Button disabled={pending}>{pending ? <Spinner/> : 'Save'}</Button>
 *
 * with:
 *   <AsyncButton onClick={async () => await save()}>Save</AsyncButton>
 *
 * Accessibility:
 *   - aria-busy=true while loading
 *   - aria-live="polite" announcement when state transitions to success or error
 *   - Disabled while pending (prevents double-submit)
 *   - Focus ring respects theme
 *
 * Variants:
 *   - "primary"   : full gradient, used for the main CTA on a page
 *   - "secondary" : outlined, used for less-emphasized actions
 *   - "ghost"     : no background, used for tertiary actions
 *   - "danger"    : red, for destructive actions (delete, cancel a job)
 *
 * @example
 *   <AsyncButton
 *     variant="primary"
 *     onClick={async () => execute.mutateAsync(id)}
 *     loadingLabel="Starting recovery…"
 *     successLabel="On its way!"
 *     icon={<Rocket className="h-4 w-4" />}
 *   >
 *     Start recovery
 *   </AsyncButton>
 */

export type AsyncButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type AsyncButtonSize = "sm" | "md" | "lg";

export interface AsyncButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  /** Button label, typically a short verb phrase. */
  children: ReactNode;
  /**
   * Click handler. Can return a Promise; the button manages its own
   * pending/success/error state based on resolution.
   */
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<unknown>;
  variant?: AsyncButtonVariant;
  size?: AsyncButtonSize;
  /** Optional leading icon. */
  icon?: ReactNode;
  /** Label shown while the promise is pending. Defaults to children. */
  loadingLabel?: string;
  /** Label flashed briefly after a successful resolve. */
  successLabel?: string;
  /** Manually controlled loading state (overrides internal state). */
  loading?: boolean;
  /** When true, button takes full width of its container. */
  fullWidth?: boolean;
}

const variantClasses: Record<AsyncButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02] focus:ring-primary-500",
  secondary:
    "border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
  ghost:
    "text-gray-700 hover:bg-gray-100 focus:ring-blue-500 dark:text-gray-200 dark:hover:bg-gray-800",
  danger:
    "bg-red-600 text-white shadow-md hover:bg-red-700 hover:scale-[1.02] focus:ring-red-500",
};

const sizeClasses: Record<AsyncButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2 text-sm gap-2 rounded-lg",
  lg: "px-5 py-2.5 text-sm gap-2 rounded-xl",
};

type AsyncStatus = "idle" | "pending" | "success" | "error";

export const AsyncButton = forwardRef<HTMLButtonElement, AsyncButtonProps>(function AsyncButton(
  {
    children,
    onClick,
    variant = "primary",
    size = "md",
    icon,
    loadingLabel,
    successLabel,
    loading: loadingProp,
    fullWidth = false,
    className = "",
    disabled,
    ...rest
  },
  ref
) {
  const reduced = usePrefersReducedMotion();
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const pending = loadingProp ?? status === "pending";
  const showSuccess = status === "success" && successLabel;
  const showError = status === "error";

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (pending || disabled) return;
    try {
      const result = onClick(e);
      if (result instanceof Promise) {
        setStatus("pending");
        await result;
        setStatus("success");
        // Reset after a brief moment so the button returns to normal
        setTimeout(() => setStatus("idle"), 1600);
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
      setTimeout(() => setStatus("idle"), 2400);
    }
  };

  const resolvedLabel = pending ? loadingLabel ?? children : showSuccess ? successLabel : children;

  return (
    <>
      <button
        ref={ref}
        type="button"
        {...rest}
        disabled={disabled || pending}
        aria-busy={pending}
        onClick={handleClick}
        className={[
          "inline-flex items-center justify-center font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-md",
          "motion-reduce:hover:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? "w-full" : "",
          showError && "ring-2 ring-red-400 ring-offset-2",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ transition: orbitTransition(reduced, "all", "fast", "spring") }}
      >
        {/* Leading icon swap: idle icon → loader → check → alert */}
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : showSuccess ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : showError ? (
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        ) : (
          icon
        )}
        <span>{resolvedLabel}</span>
      </button>

      {/* Live-region announcement for state transitions — screen-reader only */}
      <span role="status" aria-live="polite" className="sr-only">
        {pending && "Working on it"}
        {showSuccess && "Done"}
        {showError && (errorMessage || "Something went wrong")}
      </span>
    </>
  );
});

export default AsyncButton;
