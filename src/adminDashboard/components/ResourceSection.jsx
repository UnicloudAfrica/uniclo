import { Loader2 } from "lucide-react";
import ModernCard from "./ModernCard";
import { designTokens } from "../../styles/designTokens";

const chipToneStyles = {
  neutral: {
    background: designTokens.colors.neutral[100],
    color: designTokens.colors.neutral[600],
    border: `1px solid ${designTokens.colors.neutral[200]}`,
  },
  primary: {
    background: designTokens.colors.primary[50],
    color: designTokens.colors.primary[700],
    border: `1px solid ${designTokens.colors.primary[200]}`,
  },
  success: {
    background: designTokens.colors.success[50],
    color: designTokens.colors.success[700],
    border: `1px solid ${designTokens.colors.success[200]}`,
  },
  warning: {
    background: designTokens.colors.warning[50],
    color: designTokens.colors.warning[700],
    border: `1px solid ${designTokens.colors.warning[200]}`,
  },
  danger: {
    background: designTokens.colors.error[50],
    color: designTokens.colors.error[700],
    border: `1px solid ${designTokens.colors.error[200]}`,
  },
  info: {
    background: designTokens.colors.info[50],
    color: designTokens.colors.info[700],
    border: `1px solid ${designTokens.colors.info[200]}`,
  },
};

const ResourceSection = ({
  title,
  description,
  actions = [],
  meta = [],
  isLoading = false,
  children,
}) => {
  const hasActions = Array.isArray(actions)
    ? actions.length > 0
    : Boolean(actions);

  const hasMeta = Array.isArray(meta) && meta.length > 0;

  return (
    <ModernCard
      variant="outlined"
      padding="lg"
      className="w-full space-y-6 overflow-hidden"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          {title && (
            <h2
              className="break-words text-xl font-semibold"
              style={{ color: designTokens.colors.neutral[900] }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: designTokens.colors.neutral[500] }}
            >
              {description}
            </p>
          )}
        </div>
        {hasActions && (
          <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:justify-end">
            {Array.isArray(actions)
              ? actions.map((action, index) => (
                  <div key={action?.key || index} className="flex-shrink-0">
                    {action}
                  </div>
                ))
              : actions}
          </div>
        )}
      </header>

      {hasMeta && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          {meta.map(({ label, value, tone = "neutral", icon }, index) => {
            const toneStyles = chipToneStyles[tone] || chipToneStyles.neutral;
            return (
              <div
                key={`${label}-${index}`}
                className="flex min-w-0 flex-col rounded-2xl border px-5 py-4 shadow-sm"
                style={{
                  ...toneStyles,
                  boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
                }}
              >
                <span
                  className="truncate text-xs font-medium uppercase tracking-wide"
                  style={{ color: toneStyles.color }}
                >
                  {label}
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  {icon && <span className="text-sm">{icon}</span>}
                  <span
                    className="truncate text-lg font-semibold"
                    style={{ color: toneStyles.color }}
                  >
                    {value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-transparent border-t-current animate-spin"
            style={{ color: designTokens.colors.primary[500] }}
          >
            <Loader2 className="h-5 w-5" />
          </div>
          <p
            className="text-sm"
            style={{ color: designTokens.colors.neutral[500] }}
          >
            Loading resources...
          </p>
        </div>
      ) : (
        <div className="w-full space-y-5 overflow-hidden">{children}</div>
      )}
    </ModernCard>
  );
};

export default ResourceSection;
