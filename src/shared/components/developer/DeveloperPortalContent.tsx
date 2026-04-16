import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { KeyRound, Webhook, BarChart3, Code2 } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import ApiKeysTab from "./ApiKeysTab";
import WebhooksTab from "./WebhooksTab";
import UsageTab from "./UsageTab";

interface DeveloperPortalContentProps {
  context: "admin" | "tenant" | "client";
}

const tabs = [
  { id: "api-keys" as const, label: "API Keys", icon: KeyRound, description: "Manage programmatic access" },
  { id: "webhooks" as const, label: "Webhooks", icon: Webhook, description: "Event notifications" },
  { id: "usage" as const, label: "Usage", icon: BarChart3, description: "Analytics & metrics" },
];

type TabId = (typeof tabs)[number]["id"];

const CONTEXT_BASE: Record<string, string> = {
  admin: "/admin-dashboard/developer",
  tenant: "/dashboard/developer",
  client: "/client-dashboard/developer",
};

const DeveloperPortalContent = ({ context }: DeveloperPortalContentProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const basePath = CONTEXT_BASE[context] ?? "/dashboard/developer";

  // Derive active tab from URL path
  const activeTab = useMemo<TabId>(() => {
    const path = location.pathname;
    if (path.includes("/webhooks")) return "webhooks";
    if (path.includes("/usage")) return "usage";
    return "api-keys";
  }, [location.pathname]);

  const setActiveTab = (tabId: TabId) => {
    navigate(`${basePath}/${tabId}`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden rounded-2xl px-8 py-8"
        style={{
          background: `linear-gradient(135deg, ${designTokens.colors.neutral[900]} 0%, ${designTokens.colors.primary[900]} 50%, ${designTokens.colors.neutral[800]} 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-10 left-20 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>
        <div className="relative flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                <Code2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Developer Portal</h1>
            </div>
            <p className="max-w-lg text-sm text-white/70">
              Build integrations with UniCloud APIs. Create API keys for programmatic access,
              configure webhooks for real-time events, and monitor your API usage.
            </p>
          </div>
          <div className="hidden items-center gap-4 text-white/50 sm:flex">
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-white/40">API Version</div>
              <div className="font-mono text-sm text-white/80">v1</div>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-white/40">Base URL</div>
              <div className="font-mono text-sm text-white/80">/api/v1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b" style={{ borderColor: designTokens.colors.neutral[200] }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative flex items-center gap-2.5 px-5 py-3 text-sm font-medium transition-all ${
                isActive ? "" : "hover:text-primary-600"
              }`}
              style={{
                color: isActive ? designTokens.colors.primary[700] : designTokens.colors.neutral[500],
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{
                  color: isActive ? designTokens.colors.primary[600] : designTokens.colors.neutral[400],
                }}
              />
              <span>{tab.label}</span>
              <span
                className="hidden text-[11px] font-normal sm:inline"
                style={{ color: designTokens.colors.neutral[400] }}
              >
                {tab.description}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: designTokens.colors.primary[600] }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "api-keys" && <ApiKeysTab context={context} />}
        {activeTab === "webhooks" && <WebhooksTab context={context} />}
        {activeTab === "usage" && <UsageTab />}
      </div>
    </div>
  );
};

export default DeveloperPortalContent;
