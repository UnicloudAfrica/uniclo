/**
 * ShieldDomainList — Shared list component for Shield protected domains.
 *
 * Used across admin, tenant, and client dashboards via page wrappers.
 */
import React, { useMemo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import StatusPill from "@/shared/components/ui/StatusPill";
import {
  useFetchShieldDomains,
  useDeleteShieldDomain,
} from "@/shared/hooks/resources/shieldHooks";
import type { ShieldDomain } from "@/shared/hooks/resources/shieldHooks";
import AddDomainModal from "./AddDomainModal";

interface ShieldDomainListProps {
  context: "admin" | "tenant" | "client";
  detailBasePath?: string;
}

const STATUS_TONE_MAP: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  active: "success",
  pending: "warning",
  provisioning: "info",
  verifying: "info",
  suspended: "danger",
  error: "danger",
};

const PROTECTION_ICON_MAP: Record<string, React.ReactNode> = {
  standard: <Shield size={14} />,
  enhanced: <ShieldCheck size={14} />,
  under_attack: <ShieldAlert size={14} />,
};

const ShieldDomainList: React.FC<ShieldDomainListProps> = ({
  context,
  detailBasePath,
}) => {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const { data: domains = [], isLoading, refetch } = useFetchShieldDomains();
  const deleteDomain = useDeleteShieldDomain();

  const domainList = useMemo(
    () => (Array.isArray(domains) ? domains : []) as ShieldDomain[],
    [domains]
  );

  const activeDomains = useMemo(
    () => domainList.filter((d) => d.status === "active").length,
    [domainList]
  );

  const handleRowClick = useCallback(
    (row: ShieldDomain) => {
      const base = detailBasePath ?? `/${context}/shield/domains`;
      navigate(`${base}/${row.uuid}`);
    },
    [navigate, detailBasePath, context]
  );

  const columns: Column<ShieldDomain>[] = useMemo(
    () => [
      {
        key: "domain",
        header: "Domain",
        sortable: true,
        render: (_, row) => (
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-[var(--theme-color)]" />
            <span className="font-medium text-[var(--theme-heading-color)]">
              {row.domain}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => (
          <StatusPill
            status={row.status}
            tone={STATUS_TONE_MAP[row.status] ?? "neutral"}
          />
        ),
      },
      {
        key: "protection_mode",
        header: "Protection",
        render: (_, row) => (
          <div className="flex items-center gap-1.5 text-sm capitalize">
            {PROTECTION_ICON_MAP[row.protection_mode] ?? <Shield size={14} />}
            {row.protection_mode.replace("_", " ")}
          </div>
        ),
      },
      {
        key: "ssl_status",
        header: "SSL",
        render: (_, row) => (
          <StatusPill
            status={row.ssl_status}
            tone={row.ssl_status === "active" ? "success" : "neutral"}
          />
        ),
      },
      {
        key: "origin_ip",
        header: "Origin",
        render: (_, row) => (
          <span className="font-mono text-xs text-[var(--theme-muted-color)]">
            {row.origin_ip}:{row.origin_port}
          </span>
        ),
      },
      {
        key: "created_at",
        header: "Added",
        sortable: true,
        render: (_, row) =>
          new Date(row.created_at).toLocaleDateString(),
      },
    ],
    []
  );

  const actions: Action<ShieldDomain>[] = useMemo(
    () => [
      {
        label: "View",
        onClick: handleRowClick,
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (confirm(`Remove ${row.domain} from protection?`)) {
            deleteDomain.mutate({ id: row.uuid });
          }
        },
      },
    ],
    [handleRowClick, deleteDomain]
  );

  return (
    <div className="space-y-6">
      {/* Fleet Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="db-surface-card rounded-2xl border px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--theme-muted-color)]">
            <Shield size={14} /> Total Domains
          </div>
          <div className="mt-2 text-3xl font-semibold text-[var(--theme-heading-color)]">
            {domainList.length}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            <ShieldCheck size={14} /> Active
          </div>
          <div className="mt-2 text-3xl font-semibold text-emerald-950">
            {activeDomains}
          </div>
        </div>
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
            <Zap size={14} /> Pending
          </div>
          <div className="mt-2 text-3xl font-semibold text-amber-950">
            {domainList.length - activeDomains}
          </div>
        </div>
      </div>

      {/* Table */}
      <ModernTable<ShieldDomain>
        columns={columns}
        data={domainList}
        loading={isLoading}
        searchKeys={["domain", "origin_ip"]}
        searchPlaceholder="Search domains..."
        onRowClick={handleRowClick}
        actions={actions}
        emptyState={{
          icon: <Shield size={48} className="text-[var(--theme-color)]" />,
          title: "No protected domains",
          description: "Add a domain to start protecting it against DDoS attacks.",
          action: {
            label: "Add Domain",
            onClick: () => setShowAddModal(true),
          },
        }}
        headerActions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refetch()}
              className="rounded-xl border border-[rgb(var(--theme-color-200))] bg-white px-3 py-2 text-sm text-[var(--theme-color)] transition hover:bg-[var(--theme-color-10)]"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-color)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Plus size={14} /> Add Domain
            </button>
          </div>
        }
      />

      {showAddModal && (
        <AddDomainModal
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default ShieldDomainList;
