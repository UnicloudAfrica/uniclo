import { designTokens } from "../../styles/designTokens";

const toneMap = {
  neutral: {
    background: designTokens.colors.neutral[100],
    color: designTokens.colors.neutral[600],
    dot: designTokens.colors.neutral[400],
  },
  info: {
    background: designTokens.colors.info[50],
    color: designTokens.colors.info[700],
    dot: designTokens.colors.info[500],
  },
  success: {
    background: designTokens.colors.success[50],
    color: designTokens.colors.success[700],
    dot: designTokens.colors.success[500],
  },
  warning: {
    background: designTokens.colors.warning[50],
    color: designTokens.colors.warning[700],
    dot: designTokens.colors.warning[500],
  },
  danger: {
    background: designTokens.colors.error[50],
    color: designTokens.colors.error[700],
    dot: designTokens.colors.error[500],
  },
};

const StatusPill = ({ label, tone = "neutral" }) => {
  const styles = toneMap[tone] || toneMap.neutral;

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        backgroundColor: styles.background,
        color: styles.color,
      }}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: styles.dot }}
      />
      <span className="capitalize">{label}</span>
    </span>
  );
};

export default StatusPill;
