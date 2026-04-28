import React, { memo } from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { useUiMessages } from "./messages";

/**
 * InfoCallout — semantic banner for inline messaging.
 *
 * Tones:
 *   info     — brand color tint
 *   success  — green tint
 *   warning  — amber tint
 *   danger   — red tint
 *
 * Accessibility:
 *   - role="status" (polite) by default; danger tone uses role="alert"
 *     (assertive) so error states are announced immediately. Override
 *     with the `role` prop if you need different semantics.
 *   - The dismiss button has a localised `dismissLabel` for screen readers.
 */

export type InfoCalloutTone = "info" | "success" | "warning" | "danger";

export interface InfoCalloutProps {
  tone?: InfoCalloutTone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** Override the default icon for the tone. */
  icon?: React.ReactNode;
  /** Right-aligned actions inside the body. */
  actions?: React.ReactNode;
  /** Override default ARIA role (status vs alert). */
  role?: "status" | "alert";
  /** When provided, renders a top-right close button that calls this handler. */
  onDismiss?: () => void;
  /** Accessible label for the dismiss button. Defaults to "Dismiss". */
  dismissLabel?: string;
  className?: string;
}

const TONE_STYLE: Record<
  InfoCalloutTone,
  { wrapper: React.CSSProperties; icon: React.ReactNode; closeHover: string }
> = {
  info: {
    wrapper: {
      borderColor: "rgb(var(--theme-color-200))",
      background: "var(--theme-color-10)",
      color: "rgb(var(--theme-color-700))",
    },
    icon: <Info className="h-4 w-4" />,
    closeHover: "hover:bg-primary-500/15",
  },
  success: {
    wrapper: {
      borderColor: "rgb(var(--theme-success-500) / 0.30)",
      background: "rgb(var(--theme-success-500) / 0.10)",
      color: "rgb(var(--theme-success-700))",
    },
    icon: <CheckCircle2 className="h-4 w-4" />,
    closeHover: "hover:bg-success-500/15",
  },
  warning: {
    wrapper: {
      borderColor: "rgb(var(--theme-warning-500) / 0.30)",
      background: "rgb(var(--theme-warning-500) / 0.10)",
      color: "rgb(var(--theme-warning-700))",
    },
    icon: <AlertCircle className="h-4 w-4" />,
    closeHover: "hover:bg-warning-500/15",
  },
  danger: {
    wrapper: {
      borderColor: "rgb(var(--theme-danger-500) / 0.30)",
      background: "rgb(var(--theme-danger-500) / 0.10)",
      color: "rgb(var(--theme-danger-700))",
    },
    icon: <AlertTriangle className="h-4 w-4" />,
    closeHover: "hover:bg-danger-500/15",
  },
};

const InfoCallout: React.FC<InfoCalloutProps> = ({
  tone = "info",
  title,
  children,
  icon,
  actions,
  role,
  onDismiss,
  dismissLabel,
  className = "",
}) => {
  const messages = useUiMessages();
  const resolvedDismissLabel = dismissLabel ?? messages.dismiss;
  const style = TONE_STYLE[tone];
  const inferredRole = role ?? (tone === "danger" ? "alert" : "status");
  const liveness = inferredRole === "alert" ? "assertive" : "polite";

  return (
    <div
      role={inferredRole}
      aria-live={liveness}
      className={`relative rounded-xl border p-4 font-outfit ${className}`}
      style={style.wrapper}
    >
      <div className={`flex items-start gap-3 ${onDismiss ? "pr-8" : ""}`}>
        <span className="shrink-0 mt-0.5" aria-hidden="true">
          {icon ?? style.icon}
        </span>
        <div className="flex-1 min-w-0">
          {title && <div className="text-sm font-semibold">{title}</div>}
          {children && (
            <div className={`text-xs ${title ? "mt-1" : ""}`}>{children}</div>
          )}
          {actions && (
            <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={resolvedDismissLabel}
          className={`absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current/40 ${style.closeHover}`}
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default memo(InfoCallout);
