/**
 * ManagedDatabaseList — Shared list component for managed databases.
 *
 * Used across admin, tenant, and client dashboards via page wrappers.
 */
import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Database,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Workflow,
} from "lucide-react";
import ModernTable from "@/shared/components/ui/ModernTable/ModernTable";
import type { Column, Action } from "@/shared/components/ui/ModernTable/types";
import EngineIcon, { getEngineLabel } from "./EngineIcon";
import DatabaseStatusBadge from "./DatabaseStatusBadge";
import {
  useFetchManagedDatabases,
  useDatabaseAction,
  useDeleteManagedDatabase,
} from "@/shared/hooks/resources/managedDatabaseHooks";
import type { ManagedDatabase, ProvisioningStep } from "@/types/managedDatabase";

interface ManagedDatabaseListProps {
  context: "admin" | "tenant" | "client";
  createPath?: string;
  detailBasePath?: string;
}

interface FleetMetricCardProps {
  label: string;
  value: string;
  hint: string;
  tone: "slate" | "emerald" | "amber" | "sky";
  icon: React.ReactNode;
}

interface SpotlightCardProps {
  db: ManagedDatabase;
  onOpen: (row: ManagedDatabase) => void;
}

const ACTIVE_PROGRESS_STATUSES = new Set(["pending", "processing", "in_progress", "queued", "running"]);
const COMPLETED_PROGRESS_STATUSES = new Set(["completed"]);

const formatCurrency = (value: number | string | undefined): string => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "—";
  }

  return `$${numeric.toFixed(2)}`;
};

const getStepCounts = (steps: ProvisioningStep[] | null | undefined) => {
  const list = Array.isArray(steps) ? steps : [];

  return {
    total: list.length,
    completed: list.filter((step) => COMPLETED_PROGRESS_STATUSES.has(step.status)).length,
    active: list.find((step) => ACTIVE_PROGRESS_STATUSES.has(step.status)) ?? null,
  };
};

const getAccessEndpoint = (db: ManagedDatabase): string =>
  db.dns_record_name || db.private_ip || "Endpoint pending";

const getEngineVersionLabel = (db: ManagedDatabase): string =>
  `${getEngineLabel(db.engine)} ${db.engine_version ? `v${db.engine_version}` : ""}`.trim();

const FleetMetricCard: React.FC<FleetMetricCardProps> = ({ label, value, hint, tone, icon }) => {
  const toneClasses = {
    slate: "db-surface-card text-[var(--theme-heading-color)]",
    emerald: "border-emerald-200/80 bg-emerald-50/90 text-emerald-950",
    amber: "border-amber-200/80 bg-amber-50/90 text-amber-950",
    sky: "border-[rgb(var(--theme-color-200))] bg-[var(--theme-color-10)] text-[var(--theme-heading-color)]",
  } as const;

  const iconToneClasses = {
    slate: "bg-[var(--theme-color-10)] text-[var(--theme-color)]",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    sky: "bg-[var(--theme-color-10)] text-[var(--theme-color)]",
  } as const;

  return (
    <div
      className={`rounded-[24px] border px-4 py-4 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur ${toneClasses[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className={`rounded-2xl p-2 ${iconToneClasses[tone]}`}>{icon}</div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--theme-muted-color)]">
          {label}
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{value}</div>
      <p className="mt-2 text-sm text-[var(--theme-text-color)]">{hint}</p>
    </div>
  );
};

const SpotlightCard: React.FC<SpotlightCardProps> = ({ db, onOpen }) => {
  const progress = getStepCounts(db.provisioning_progress);
  const statusLabel = db.status === "provisioning" && progress.active
    ? progress.active.label
    : db.status.replace("_", " ");

  return (
    <button
      type="button"
      onClick={() => onOpen(db)}
      className="group db-surface-card rounded-[26px] p-5 text-left backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[rgb(var(--theme-color-300))] hover:shadow-[0_24px_60px_-34px_rgb(var(--theme-color-rgb)_/_0.28)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <EngineIcon engine={db.engine} size={18} />
          <div>
            <p className="text-sm font-semibold text-[var(--theme-heading-color)]">{db.name}</p>
            <p className="text-xs text-[var(--theme-muted-color)]">{db.identifier}</p>
          </div>
        </div>
        <ArrowUpRight
          size={16}
          className="text-[var(--theme-muted-color)] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--theme-color)]"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <DatabaseStatusBadge status={db.status} />
        {db.dr_region && (
          <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-700">
            DR Enabled
          </span>
        )}
      </div>

      <dl className="mt-5 grid gap-3 text-sm text-[var(--theme-text-color)] sm:grid-cols-2">
        <div className="db-surface-soft rounded-2xl px-3 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
            Engine
          </dt>
          <dd className="mt-1 font-medium text-[var(--theme-heading-color)]">{getEngineVersionLabel(db)}</dd>
        </div>
        <div className="db-surface-soft rounded-2xl px-3 py-3">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--theme-muted-color)]">
            Endpoint
          </dt>
          <dd className="mt-1 break-all font-medium text-[var(--theme-heading-color)]">{getAccessEndpoint(db)}</dd>
        </div>
      </dl>

      <div className="db-signal-panel mt-4 rounded-2xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            Runtime Signal
          </span>
          <span className="text-xs text-white/60">
            {progress.total > 0 ? `${progress.completed}/${progress.total} complete` : "Fresh state"}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-white/90">{statusLabel}</p>
      </div>
    </button>
  );
};

const ManagedDatabaseList: React.FC<ManagedDatabaseListProps> = ({
  context: _context,
  createPath = "databases/create",
  detailBasePath = "databases",
}) => {
  const navigate = useNavigate();
  const { data: databases, isLoading, refetch } = useFetchManagedDatabases();
  const actionMutation = useDatabaseAction();
  const deleteMutation = useDeleteManagedDatabase();

  const dataList = useMemo(() => {
    if (!databases) return [];
    return Array.isArray(databases) ? databases : [];
  }, [databases]);

  const fleetStats = useMemo(() => {
    const total = dataList.length;
    const active = dataList.filter((db) => db.status === "active").length;
    const provisioning = dataList.filter((db) => db.status === "provisioning").length;
    const protectedCount = dataList.filter((db) => Boolean(db.dr_region)).length;
    const monthly = dataList.reduce((sum, db) => sum + Number(db.monthly_cost || 0), 0);

    return {
      total,
      active,
      provisioning,
      protectedCount,
      monthly,
    };
  }, [dataList]);

  const spotlightDatabases = useMemo(() => {
    const ranked = [...dataList].sort((left, right) => {
      const score = (db: ManagedDatabase) => {
        if (db.status === "provisioning") return 0;
        if (db.status === "active") return 1;
        if (db.status === "error") return 2;
        return 3;
      };

      return score(left) - score(right);
    });

    return ranked.slice(0, 3);
  }, [dataList]);

  const handleRowClick = useCallback(
    (row: ManagedDatabase) => {
      navigate(`${detailBasePath}/${row.identifier}`);
    },
    [navigate, detailBasePath]
  );

  const columns: Column<ManagedDatabase>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Database",
        sortable: true,
        render: (_, row) => {
          const progress = getStepCounts(row.provisioning_progress);

          return (
            <div className="flex min-w-[220px] items-start gap-3">
              <EngineIcon engine={row.engine} size={18} />
              <div className="min-w-0">
                <div className="font-medium text-[var(--theme-heading-color)]">{row.name}</div>
                <div className="text-xs text-[var(--theme-muted-color)]">{row.identifier}</div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[var(--theme-muted-color)]">
                  <span className="db-muted-pill rounded-full px-2 py-0.5">
                    {getEngineVersionLabel(row)}
                  </span>
                  {progress.total > 0 && row.status === "provisioning" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                      {progress.completed}/{progress.total} steps
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (_, row) => {
          const progress = getStepCounts(row.provisioning_progress);

          return (
            <div className="space-y-2">
              <DatabaseStatusBadge status={row.status} />
              {row.status === "provisioning" && progress.active && (
                <p className="text-xs text-[var(--theme-muted-color)]">{progress.active.label}</p>
              )}
            </div>
          );
        },
      },
      {
        key: "plan_size",
        header: "Shape",
        sortable: true,
        render: (_, row) => (
          <div>
            <div className="font-medium capitalize text-[var(--theme-heading-color)]">
              {row.plan_size}
            </div>
            <div className="text-xs text-[var(--theme-muted-color)]">
              {row.vcpu_count} vCPU · {Math.round(row.memory_mb / 1024)} GB RAM · {row.storage_gb} GB
            </div>
          </div>
        ),
      },
      {
        key: "region",
        header: "Access",
        sortable: true,
        render: (_, row) => (
          <div className="min-w-[160px]">
            <div className="break-all font-medium text-[var(--theme-heading-color)]">
              {getAccessEndpoint(row)}
            </div>
            <div className="text-xs text-[var(--theme-muted-color)]">
              {row.region}
              {row.dr_region ? ` · DR ${row.dr_region}` : ""}
            </div>
          </div>
        ),
      },
      {
        key: "monthly_cost",
        header: "Monthly Cost",
        align: "right" as const,
        sortable: true,
        render: (_, row) => (
          <div className="text-right">
            <div className="text-sm font-semibold text-[var(--theme-heading-color)]">
              {formatCurrency(row.monthly_cost)}
            </div>
            <div className="text-xs text-[var(--theme-muted-color)]">Dedicated VM service</div>
          </div>
        ),
      },
    ],
    []
  );

  const actions: Action<ManagedDatabase>[] = useMemo(
    () => [
      {
        label: "View",
        onClick: handleRowClick,
      },
      {
        label: "Pause",
        icon: <Pause size={14} />,
        onClick: (row) => {
          if (row.status === "active") {
            actionMutation.mutate({ identifier: row.identifier, action: "pause" });
          }
        },
      },
      {
        label: "Resume",
        icon: <Play size={14} />,
        onClick: (row) => {
          if (row.status === "paused") {
            actionMutation.mutate({ identifier: row.identifier, action: "resume" });
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 size={14} />,
        tone: "danger" as const,
        onClick: (row) => {
          if (confirm(`Delete database "${row.name}"? This cannot be undone.`)) {
            deleteMutation.mutate({ id: row.identifier });
          }
        },
      },
    ],
    [handleRowClick, actionMutation, deleteMutation]
  );

  return (
    <div className="space-y-6">
      <section className="db-surface-hero rounded-[32px] p-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
          <div className="space-y-5">
            <div className="db-brand-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] shadow-sm">
              <Database size={14} />
              Lattice Database Control
            </div>

            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-[var(--theme-heading-color)] sm:text-4xl">
                A sharper operating surface for every managed database you run.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-[var(--theme-text-color)]">
                Monitor live provisioning, inspect topology, and jump straight into the databases that
                need attention without hunting through generic tables.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => navigate(createPath)}
                className="db-primary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <Plus size={16} />
                Create Database
              </button>
              <button
                onClick={() => refetch()}
                className="db-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
              >
                <RefreshCw size={16} />
                Refresh Fleet
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FleetMetricCard
              label="Fleet"
              value={String(fleetStats.total)}
              hint="Managed database environments currently tracked."
              tone="slate"
              icon={<Database size={18} />}
            />
            <FleetMetricCard
              label="Healthy"
              value={String(fleetStats.active)}
              hint="Active clusters ready to accept application traffic."
              tone="emerald"
              icon={<ShieldCheck size={18} />}
            />
            <FleetMetricCard
              label="Live Ops"
              value={String(fleetStats.provisioning)}
              hint="Provisioning runs and transitions happening right now."
              tone="amber"
              icon={<Workflow size={18} />}
            />
            <FleetMetricCard
              label="Monthly"
              value={formatCurrency(fleetStats.monthly)}
              hint={`Estimated monthly cost across ${fleetStats.total} active database${fleetStats.total !== 1 ? "s" : ""}.`}
              tone="sky"
              icon={<Activity size={18} />}
            />
          </div>
        </div>

        {spotlightDatabases.length > 0 && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 min-[1500px]:grid-cols-3">
            {spotlightDatabases.map((db) => (
              <SpotlightCard key={db.identifier} db={db} onOpen={handleRowClick} />
            ))}
          </div>
        )}
      </section>

      <section className="db-surface-card rounded-[28px] p-4">
        <div className="flex flex-col gap-3 border-b border-[var(--theme-border-color)] px-3 pb-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-heading-color)]">Database Fleet</h3>
            <p className="text-sm text-[var(--theme-muted-color)]">
              Jump from portfolio view into any cluster with richer runtime and access signals.
            </p>
          </div>
          <div className="db-muted-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium">
            <ArrowUpRight size={14} />
            Click any row for the full operational view
          </div>
        </div>

        <div className="pt-4">
          <ModernTable<ManagedDatabase>
            data={dataList}
            columns={columns}
            loading={isLoading}
            searchable
            searchKeys={["name", "identifier", "engine", "region"]}
            searchPlaceholder="Search databases..."
            paginated
            pageSize={10}
            onRowClick={handleRowClick}
            actions={actions}
            emptyMessage={
              <div className="db-surface-soft rounded-[24px] border-dashed px-6 py-14 text-center">
                <div className="db-surface-inset mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm">
                  <Database size={24} className="text-[var(--theme-color)]" />
                </div>
                <p className="mt-4 text-base font-semibold text-[var(--theme-heading-color)]">
                  No databases yet
                </p>
                <p className="mt-2 text-sm text-[var(--theme-muted-color)]">
                  Launch your first managed database to start building a live fleet.
                </p>
                <button
                  onClick={() => navigate(createPath)}
                  className="db-primary-button mt-5 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition"
                >
                  <Plus size={16} />
                  Create your first database
                </button>
              </div>
            }
          />
        </div>
      </section>
    </div>
  );
};

export default ManagedDatabaseList;
