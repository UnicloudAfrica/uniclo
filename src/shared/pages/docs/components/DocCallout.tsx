import React from "react";
import { Lightbulb, AlertTriangle, Info } from "lucide-react";

type CalloutType = "tip" | "warning" | "info";

interface DocCalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const config: Record<CalloutType, { icon: typeof Info; bg: string; border: string; iconColor: string; defaultTitle: string }> = {
  tip: { icon: Lightbulb, bg: "#f0fdf4", border: "#22c55e", iconColor: "#16a34a", defaultTitle: "Tip" },
  warning: { icon: AlertTriangle, bg: "#fffbeb", border: "#f59e0b", iconColor: "#d97706", defaultTitle: "Warning" },
  info: { icon: Info, bg: "#eff6ff", border: "#3b82f6", iconColor: "#2563eb", defaultTitle: "Good to know" },
};

const DocCallout: React.FC<DocCalloutProps> = ({ type = "tip", title, children }) => {
  const c = config[type];
  const Icon = c.icon;

  return (
    <div
      className="my-6 rounded-lg border-l-4 p-4"
      style={{ backgroundColor: c.bg, borderLeftColor: c.border }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon size={18} style={{ color: c.iconColor }} />
        <span className="font-semibold text-sm" style={{ color: c.iconColor }}>
          {title || c.defaultTitle}
        </span>
      </div>
      <div className="text-sm leading-relaxed" style={{ color: "#374151" }}>
        {children}
      </div>
    </div>
  );
};

export default DocCallout;
