import React, { useState } from "react";
import TenantPageShell from "../components/TenantPageShell";
import ProtectionOverview from "@/shared/components/integrations/ProtectionOverview";
import DrDashboard from "@/shared/components/integrations/DrDashboard";
import { designTokens } from "@/styles/designTokens";

const TABS = [
  { key: "overview", label: "Protection Overview" },
  { key: "dr-dashboard", label: "DR Dashboard" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const TenantProtection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <TenantPageShell
      title="Protection Services"
      description="Backup, replication, and disaster recovery services"
      contentClassName="space-y-6"
    >
      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", borderBottom: `1px solid ${designTokens.colors.neutral[200]}`, marginBottom: "24px" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "10px 20px",
              fontSize: designTokens.typography.fontSize.sm[0],
              fontWeight: activeTab === tab.key ? designTokens.typography.fontWeight.semibold : designTokens.typography.fontWeight.medium,
              color: activeTab === tab.key ? designTokens.colors.primary[600] : designTokens.colors.neutral[600],
              background: "none",
              border: "none",
              borderBottom: `2px solid ${activeTab === tab.key ? designTokens.colors.primary[600] : "transparent"}`,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <ProtectionOverview context="tenant" />}
      {activeTab === "dr-dashboard" && <DrDashboard />}
    </TenantPageShell>
  );
};

export default TenantProtection;
