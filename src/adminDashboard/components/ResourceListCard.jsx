import ModernButton from "./ModernButton";
import StatusPill from "./StatusPill";
import { designTokens } from "../../styles/designTokens";

const buttonVariantMap = {
  primary: "primary",
  secondary: "secondary",
  ghost: "ghost",
  outline: "outline",
  danger: "danger",
};

const ResourceListCard = ({
  title,
  subtitle,
  metadata = [],
  statuses = [],
  actions = [],
  footer,
  className = "",
}) => {
  return (
    <div
      className={`resource-list-card flex h-full min-w-0 flex-col gap-5 rounded-3xl border px-6 py-6 shadow-sm ${className}`}
      style={{
        borderColor: designTokens.colors.neutral[200],
        background:
          "linear-gradient(180deg, rgba(249, 250, 251, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)",
        boxShadow: "0 16px 32px rgba(15, 23, 42, 0.04)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          {title && (
            <h3
              className="truncate text-lg font-semibold"
              style={{ color: designTokens.colors.neutral[900] }}
              title={title}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              className="break-all text-xs font-medium uppercase tracking-wide"
              style={{ color: designTokens.colors.neutral[400] }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {statuses.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {statuses.map(({ label, tone = "neutral" }, index) => (
              <StatusPill key={`${label}-${index}`} label={label} tone={tone} />
            ))}
          </div>
        )}
      </div>

      {metadata.length > 0 && (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          }}
        >
          {metadata.map(({ label, value }, index) => (
            <div
              key={`${label}-${index}`}
              className="rounded-2xl border px-4 py-3"
              style={{
                borderColor: designTokens.colors.neutral[200],
                backgroundColor: designTokens.colors.neutral[0],
              }}
            >
              <p
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                {label}
              </p>
              <p
                className="mt-1 break-words text-sm font-semibold"
                style={{ color: designTokens.colors.neutral[800] }}
              >
                {value ?? "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {(actions.length > 0 || footer) && (
        <div className="flex flex-col gap-3">
          {actions.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {actions.map(
                (
                  {
                    key,
                    label,
                    onClick,
                    icon,
                    variant = "outline",
                    disabled = false,
                  },
                  index
                ) => (
                  <ModernButton
                    key={key || index}
                    variant={buttonVariantMap[variant] || "outline"}
                    size="sm"
                    leftIcon={icon}
                    onClick={onClick}
                    isDisabled={disabled}
                  >
                    {label}
                  </ModernButton>
                )
              )}
            </div>
          )}
          {footer}
        </div>
      )}
    </div>
  );
};

export default ResourceListCard;
