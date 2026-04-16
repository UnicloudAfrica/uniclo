/**
 * ShieldDomainDetail — Shared detail component for a Shield protected domain.
 *
 * Tab-based layout: Overview, DNS, SSL, Firewall, Analytics.
 */
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Globe,
  Lock,
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Flame,
} from "lucide-react";
import StatusPill from "@/shared/components/ui/StatusPill";
import {
  useFetchShieldDomainById,
  useFetchProtectionStatus,
  useVerifyShieldDomain,
  useActivateShieldDomain,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldDomain } from "@/shared/hooks/resources/shieldHooks";
import ProtectionModeCard from "./ProtectionModeCard";
import DnsRecordTable from "./DnsRecordTable";
import SslPanel from "./SslPanel";
import FirewallRulesTable from "./FirewallRulesTable";
import IpAccessList from "./IpAccessList";
import GeoFilterPanel from "./GeoFilterPanel";
import TrafficChart from "./TrafficChart";
import AttackHistoryTable from "./AttackHistoryTable";

type Tab = "overview" | "dns" | "ssl" | "firewall" | "analytics";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Shield size={16} /> },
  { id: "dns", label: "DNS", icon: <Network size={16} /> },
  { id: "ssl", label: "SSL", icon: <Lock size={16} /> },
  { id: "firewall", label: "Firewall", icon: <ShieldCheck size={16} /> },
  { id: "analytics", label: "Analytics", icon: <Activity size={16} /> },
];

interface ShieldDomainDetailProps {
  identifier: string;
  backPath: string;
  context: "admin" | "tenant" | "client";
}

const STATUS_TONE_MAP: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  active: "success",
  pending: "warning",
  provisioning: "info",
  verifying: "info",
  suspended: "danger",
  error: "danger",
};

const ShieldDomainDetail: React.FC<ShieldDomainDetailProps> = ({
  identifier,
  backPath,
  context,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { data: rawDomain, isLoading } = useFetchShieldDomainById(identifier, {
    refetchInterval: 15_000,
  });

  const domain = rawDomain as ShieldDomain | undefined;

  const verifyDomain = useVerifyShieldDomain();
  const activateDomain = useActivateShieldDomain();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--theme-color)] border-t-transparent" />
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="py-16 text-center text-[var(--theme-muted-color)]">
        Domain not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="mb-4 flex items-center gap-1 text-sm text-[var(--theme-muted-color)] hover:text-[var(--theme-color)]"
        >
          <ArrowLeft size={14} /> Back to domains
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Globe
                size={28}
                className="text-[var(--theme-color)]"
              />
              <h1 className="text-2xl font-semibold text-[var(--theme-heading-color)]">
                {domain.domain}
              </h1>
              <StatusPill
                status={domain.status}
                tone={STATUS_TONE_MAP[domain.status] ?? "neutral"}
              />
            </div>
            <p className="mt-1 text-sm text-[var(--theme-muted-color)]">
              Origin: {domain.origin_ip}:{domain.origin_port}
              {domain.dns_configured && " \u00B7 DNS configured"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {domain.status === "pending" && (
              <button
                type="button"
                onClick={() => verifyDomain.mutate(domain.uuid)}
                disabled={verifyDomain.isPending}
                className="rounded-xl border border-[rgb(var(--theme-color-200))] bg-white px-4 py-2 text-sm font-medium text-[var(--theme-color)] transition hover:bg-[var(--theme-color-10)]"
              >
                Verify DNS
              </button>
            )}
            {domain.status === "verifying" && (
              <button
                type="button"
                onClick={() => activateDomain.mutate(domain.uuid)}
                disabled={activateDomain.isPending}
                className="rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                Activate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="db-surface-card rounded-2xl border px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            Protection
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium capitalize text-[var(--theme-heading-color)]">
            {domain.protection_mode === "under_attack" ? (
              <ShieldAlert size={14} className="text-red-500" />
            ) : (
              <ShieldCheck size={14} className="text-emerald-500" />
            )}
            {domain.protection_mode.replace("_", " ")}
          </div>
        </div>
        <div className="db-surface-card rounded-2xl border px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            SSL
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-[var(--theme-heading-color)]">
            <Lock size={14} className={domain.ssl_status === "active" ? "text-emerald-500" : "text-amber-500"} />
            {domain.ssl_status} ({domain.ssl_type.replace("_", " ")})
          </div>
        </div>
        <div className="db-surface-card rounded-2xl border px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            DNS
          </div>
          <div className="mt-1 text-sm font-medium text-[var(--theme-heading-color)]">
            {domain.dns_configured ? "Configured" : "Pending"}
          </div>
        </div>
        <div className="db-surface-card rounded-2xl border px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            Added
          </div>
          <div className="mt-1 text-sm font-medium text-[var(--theme-heading-color)]">
            {new Date(domain.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[rgb(var(--theme-color-100))]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-[var(--theme-color)] text-[var(--theme-color)]"
                : "border-transparent text-[var(--theme-muted-color)] hover:text-[var(--theme-heading-color)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <ProtectionModeCard domainId={domain.uuid} currentMode={domain.protection_mode} />
          <TrafficChart domainId={domain.uuid} />
        </div>
      )}

      {activeTab === "dns" && <DnsRecordTable domainId={domain.uuid} />}

      {activeTab === "ssl" && <SslPanel domainId={domain.uuid} />}

      {activeTab === "firewall" && (
        <div className="space-y-6">
          <FirewallRulesTable domainId={domain.uuid} />
          <IpAccessList domainId={domain.uuid} />
          <GeoFilterPanel domainId={domain.uuid} />
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6">
          <TrafficChart domainId={domain.uuid} />
          <AttackHistoryTable domainId={domain.uuid} />
        </div>
      )}
    </div>
  );
};

export default ShieldDomainDetail;
