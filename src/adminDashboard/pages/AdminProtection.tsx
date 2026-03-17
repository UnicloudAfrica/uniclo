import React, { useState } from "react";
import AdminPageShell from "../components/AdminPageShell";
import ProtectionOverview from "@/shared/components/integrations/ProtectionOverview";
import DrDashboard from "@/shared/components/integrations/DrDashboard";
import { designTokens } from "@/styles/designTokens";

const TABS = [
  { key: "overview", label: "Protection Overview" },
  { key: "dr-dashboard", label: "DR Dashboard" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function AdminProtection() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  return (
    <AdminPageShell
      title="Protection Services"
      description="Manage backup, replication, and DR services across all tenants"
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

      {activeTab === "overview" && <ProtectionOverview context="admin" />}
      {activeTab === "dr-dashboard" && <DrDashboard />}
    </AdminPageShell>
  );
}
