import React, { memo, useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import ModernButton from "./ModernButton";
import { useUiMessages } from "./messages";

/**
 * ErrorState — full-section error display with optional retry CTA.
 *
 * A11y:
 *   - role="alert", aria-live="assertive" so the message is announced.
 *   - The retry button auto-focuses on mount so keyboard users can press
 *     Enter immediately. Set `autoFocusRetry={false}` to opt out for
 *     in-flow errors where stealing focus would be disruptive.
 */
export interface ErrorStateProps {
  title?: string;
  message?: React.ReactNode;
  /** Internal error code/id for support diagnostics. */
  code?: string;
  onRetry?: () => void;
  retryLabel?: string;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  /** Auto-focus the retry button on mount (default true when `onRetry` is set). */
  autoFocusRetry?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  code,
  onRetry,
  retryLabel,
  actions,
  icon,
  className = "",
  autoFocusRetry,
}) => {
  const messages = useUiMessages();
  const resolvedTitle = title ?? messages.errorTitle;
  const resolvedMessage = message ?? messages.errorMessage;
  const resolvedRetryLabel = retryLabel ?? messages.retry;
  const retryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const shouldFocus = autoFocusRetry !== false && Boolean(onRetry);
    if (shouldFocus) {
      // Defer to next tick so the alert role is announced first, then
      // focus moves so the user can act.
      const timer = window.setTimeout(() => {
        retryRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [autoFocusRetry, onRetry]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border px-6 py-10 text-center font-outfit ${className}`}
      style={{
        borderColor: "rgb(var(--theme-danger-500) / 0.30)",
        background: "rgb(var(--theme-danger-500) / 0.06)",
      }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full"
        style={{
          background: "rgb(var(--theme-danger-500) / 0.15)",
          color: "rgb(var(--theme-danger-700))",
        }}
        aria-hidden="true"
      >
        {icon ?? <AlertTriangle className="h-5 w-5" />}
      </span>
      <div>
        <p className="text-sm font-semibold" style={{ color: "rgb(var(--theme-danger-700))" }}>
          {resolvedTitle}
        </p>
        {resolvedMessage && (
          <p className="mt-1 max-w-md text-xs text-gray-600">{resolvedMessage}</p>
        )}
      </div>
      {(onRetry || actions) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry && (
            <ModernButton
              ref={retryRef}
              variant="outline"
              size="sm"
              onClick={onRetry}
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
            >
              {resolvedRetryLabel}
            </ModernButton>
          )}
          {actions}
        </div>
      )}
      {code && (
        <p className="mt-1 text-[10px] font-mono text-gray-400">ref: {code}</p>
      )}
    </div>
  );
};

export default memo(ErrorState);
