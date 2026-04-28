import React, { memo } from "react";
import { Loader2 } from "lucide-react";
import { useUiMessages } from "./messages";

/**
 * LoadingState — full-section loading indicator with optional message.
 *
 * Two layouts:
 *   default → centered spinner + optional message in a soft surface
 *   inline  → small inline spinner row (no surface)
 *
 * Accessibility: announces via role="status" + aria-live="polite".
 * Spinner respects prefers-reduced-motion (Tailwind motion-safe variant).
 */
export interface LoadingStateProps {
  message?: string;
  variant?: "default" | "inline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SPINNER_SIZE: Record<NonNullable<LoadingStateProps["size"]>, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  variant = "default",
  size = "md",
  className = "",
}) => {
  const messages = useUiMessages();
  const fallback = messages.loadingDefault;
  if (variant === "inline") {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 text-sm text-gray-500 font-outfit ${className}`}
      >
        <Loader2
          className={`${SPINNER_SIZE[size]} text-primary-500 motion-safe:animate-spin`}
          aria-hidden="true"
        />
        {message && <span>{message}</span>}
        {!message && <span className="sr-only">{fallback}</span>}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`db-surface-soft flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-xl px-6 py-10 text-center font-outfit ${className}`}
    >
      <Loader2
        className={`${SPINNER_SIZE[size]} text-primary-500 motion-safe:animate-spin`}
        aria-hidden="true"
      />
      <p className="text-sm text-gray-500">{message ?? fallback}</p>
    </div>
  );
};

export default memo(LoadingState);
