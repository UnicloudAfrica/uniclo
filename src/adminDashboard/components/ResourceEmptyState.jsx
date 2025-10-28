import { designTokens } from "../../styles/designTokens";
import { CloudSnow } from "lucide-react";

const ResourceEmptyState = ({
  title,
  message,
  action,
  icon = <CloudSnow size={20} />,
}) => {
  return (
    <div
      className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-16 text-center"
      style={{
        borderColor: designTokens.colors.neutral[200],
        backgroundColor: designTokens.colors.neutral[50],
        color: designTokens.colors.neutral[500],
      }}
    >
      <div
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: designTokens.colors.primary[50],
          color: designTokens.colors.primary[500],
        }}
      >
        {icon}
      </div>
      {title && (
        <p
          className="text-base font-semibold"
          style={{ color: designTokens.colors.neutral[800] }}
        >
          {title}
        </p>
      )}
      {message && (
        <p
          className="mt-2 max-w-xl text-sm leading-relaxed"
          style={{ color: designTokens.colors.neutral[500] }}
        >
          {message}
        </p>
      )}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
};

export default ResourceEmptyState;
