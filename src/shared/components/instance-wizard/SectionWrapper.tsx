import React from "react";

export interface SectionWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, description, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div className="space-y-1">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    {children}
  </div>
);

export default SectionWrapper;
