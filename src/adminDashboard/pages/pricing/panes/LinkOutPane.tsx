import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { ModernCard, ModernButton } from "@/shared/components/ui";

interface LinkOutPaneProps {
  title: string;
  caption?: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
  to: string;
}

/**
 * Pane that points the operator at a full-screen tool that lives outside
 * the unified pricing shell (FX rates editor, calculator wizard, provider
 * unit costs editor). Avoids cramming heavy multi-step UIs into the right
 * pane while still letting the side menu act as the canonical entry point
 * to every pricing surface.
 */
const LinkOutPane: React.FC<LinkOutPaneProps> = ({ title, caption, icon: Icon, cta, to }) => {
  const navigate = useNavigate();

  return (
    <ModernCard padding="default" className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {caption && <p className="text-sm text-slate-500">{caption}</p>}
        </div>
      </div>

      <p className="text-sm text-slate-600">
        This surface lives on its own page because the editor is multi-step or page-spanning. Open
        it to manage the full workflow.
      </p>

      <ModernButton
        variant="primary"
        onClick={() => navigate(to)}
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        {cta}
      </ModernButton>
    </ModernCard>
  );
};

export default LinkOutPane;
