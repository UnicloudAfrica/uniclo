import { useEffect, useMemo, useState } from "react";
import { Database, Server, HardDrive } from "lucide-react";
import { useFetchAvailablePlans } from "@/shared/hooks/resources/managedDatabaseHooks";
import ResourceDataExplorer from "../../components/ResourceDataExplorer";

type PlanItem = {
  id?: string | number;
  name?: string;
  engine?: string;
  plan_size?: string;
  vcpu?: number;
  memory_mb?: number;
  storage_gb?: number;
  provider?: string;
  region?: string;
  is_active?: boolean;
};

type ExplorerColumn = {
  header: string;
  key?: string;
  align?: "left" | "center" | "right";
  render?: (row: Record<string, unknown>) => React.ReactNode;
};

const ENGINE_LABELS: Record<string, string> = {
  mongodb: "MongoDB",
  postgresql: "PostgreSQL",
  mysql: "MySQL",
  redis: "Redis",
};

const ManagedDatabaseInventory = ({
  selectedRegion,
  onMetricsChange,
}: {
  selectedRegion: string;
  selectedProvider?: string;
  onMetricsChange?: (payload: { description?: string; metrics?: any[] }) => void;
}) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
    setSearch("");
  }, [selectedRegion]);

  const { data, isFetching } = useFetchAvailablePlans(undefined, {
    enabled: Boolean(selectedRegion),
  });

  const allPlans = useMemo<PlanItem[]>(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray((data as any)?.data)) return (data as any).data;
    if (Array.isArray((data as any)?.plans)) return (data as any).plans;
    return [];
  }, [data]);

  const filteredPlans = useMemo(() => {
    let plans = allPlans;

    if (selectedRegion) {
      plans = plans.filter((p) => !p.region || p.region === selectedRegion);
    }

    if (search) {
      const q = search.toLowerCase();
      plans = plans.filter(
        (p) =>
          (p.name?.toLowerCase() || "").includes(q) ||
          (p.engine?.toLowerCase() || "").includes(q) ||
          (p.plan_size?.toLowerCase() || "").includes(q)
      );
    }

    return plans;
  }, [allPlans, selectedRegion, search]);

  const paginatedPlans = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredPlans.slice(start, start + perPage);
  }, [filteredPlans, page, perPage]);

  const engineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredPlans.forEach((p) => {
      const engine = p.engine || "unknown";
      counts[engine] = (counts[engine] || 0) + 1;
    });
    return counts;
  }, [filteredPlans]);

  useEffect(() => {
    if (!onMetricsChange) return;
    const activeCount = filteredPlans.filter((p) => p.is_active !== false).length;
    const engineCount = Object.keys(engineCounts).length;

    onMetricsChange({
      description:
        "Manage database plan inventory across engines. Ensure plans are available for tenant provisioning.",
      metrics: [
        {
          label: "Database plans",
          value: String(filteredPlans.length),
          description: "Total plans",
        },
        { label: "Active", value: String(activeCount), description: "Available for provisioning" },
        { label: "Engines", value: String(engineCount), description: "Supported DB engines" },
      ],
    });
  }, [filteredPlans, engineCounts, onMetricsChange]);

  const columns = useMemo<ExplorerColumn[]>(
    () => [
      {
        header: "Plan",
        key: "name",
        render: (row: Record<string, unknown>) => (
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
              <Database className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {(row.name as string) || "Unnamed"}
              </p>
              <p className="text-xs text-slate-500">{(row.plan_size as string) || ""}</p>
            </div>
          </div>
        ),
      },
      {
        header: "Engine",
        key: "engine",
        align: "center",
        render: (row: Record<string, unknown>) => (
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {ENGINE_LABELS[(row.engine as string) || ""] || (row.engine as string) || "—"}
          </span>
        ),
      },
      {
        header: "vCPU",
        key: "vcpu",
        align: "center",
        render: (row: Record<string, unknown>) => (
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700">
            <Server className="h-3.5 w-3.5 text-slate-400" />
            {(row.vcpu as number) || "—"}
          </div>
        ),
      },
      {
        header: "Memory",
        key: "memory_mb",
        align: "center",
        render: (row: Record<string, unknown>) => {
          const mb = row.memory_mb as number;
          const display = mb ? (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`) : "—";
          return <span className="text-sm text-slate-700">{display}</span>;
        },
      },
      {
        header: "Storage",
        key: "storage_gb",
        align: "center",
        render: (row: Record<string, unknown>) => (
          <div className="flex items-center justify-center gap-1.5 text-sm text-slate-700">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            {(row.storage_gb as number) ? `${row.storage_gb} GB` : "—"}
          </div>
        ),
      },
      {
        header: "Status",
        key: "is_active",
        align: "center",
        render: (row: Record<string, unknown>) => {
          const active = row.is_active !== false;
          return (
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {active ? "Active" : "Inactive"}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <ResourceDataExplorer
      title="Managed database plans"
      description="Database plan inventory available for provisioning in this region."
      columns={columns}
      rows={paginatedPlans as Record<string, unknown>[]}
      loading={isFetching}
      page={page}
      perPage={perPage}
      total={filteredPlans.length}
      onPageChange={setPage}
      onPerPageChange={(next: number) => {
        setPerPage(next);
        setPage(1);
      }}
      searchValue={search}
      onSearch={(value: string) => {
        setSearch(value);
        setPage(1);
      }}
      emptyState={{
        icon: (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
            <Database className="h-5 w-5" />
          </span>
        ),
        title: "No database plans",
        description: "Database plans will appear here once configured via the pricing seeder.",
      }}
    />
  );
};

export default ManagedDatabaseInventory;
