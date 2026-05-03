import React from "react";
import { LucideIcon } from "lucide-react";

interface DocStepProps {
  number: number;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  navigation?: string;
}

const DocStep: React.FC<DocStepProps> = ({ number, icon: Icon, title, children, navigation }) => (
  <div className="flex gap-4 py-5 border-b" style={{ borderColor: "var(--theme-border-color, #e5e7eb)" }}>
    <div
      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
      style={{ backgroundColor: "var(--theme-color, #288DD1)", color: "var(--theme-on-color, #fff)" }}
    >
      {number}
    </div>
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <Icon size={20} style={{ color: "var(--theme-color, #288DD1)" }} />
        <h3 className="text-lg font-semibold" style={{ color: "var(--theme-heading-color, #1f2937)" }}>
          {title}
        </h3>
      </div>
      {navigation && (
        <div
          className="text-sm px-3 py-1.5 rounded-md inline-flex items-center gap-1 font-mono"
          style={{
            backgroundColor: "var(--theme-surface-alt, #f3f4f6)",
            color: "var(--theme-text-color, #374151)",
          }}
        >
          {navigation}
        </div>
      )}
      <div className="text-base leading-relaxed" style={{ color: "var(--theme-text-color, #374151)" }}>
        {children}
      </div>
    </div>
  </div>
);

export default DocStep;
