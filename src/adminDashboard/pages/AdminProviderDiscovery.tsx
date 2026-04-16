import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  CloudDownload,
  RefreshCw,
  Search,
  Link2,
  AlertTriangle,
  Download,
  History,
  Users,
  FolderSync,
  Info,
} from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ModernTable from "@/shared/components/ui/ModernTable";
import { ModernButton, ModernCard, StatusPill } from "@/shared/components/ui";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import { useFetchRegions } from "@/hooks/adminHooks/regionHooks";
import {
  useFetchProviderDiscoveryProjects,
  useImportProviderDiscoveryProjects,
  useSyncProviderDiscoveryProjects,
  useFetchProviderDiscoveryUsers,
  useLinkProviderDiscoveryUser,
  useFetchProviderDiscoveryRuns,
  useFetchProviderDiscoveryDrift,
} from "@/hooks/adminHooks/providerDiscoveryHooks";
import { useFetchTenants } from "@/hooks/adminHooks/tenantHooks";
import { useFetchClients } from "@/hooks/adminHooks/clientHooks";
import ToastUtils from "@/utils/toastUtil";
import type { Region } from "@/shared/types/resource";
import type { Tenant } from "@/shared/types/tenant";
import type { Client } from "@/shared/types/client";

// ─── Types ───────────────────────────────────────────────────

type TabId = "projects" | "users" | "runs";

interface DiscoveredProject {
  id: string;
  name: string;
  description?: string;
  domain_id?: string;
  status?: string;
  matching_status?: string;
  matching_notes?: string[];
  linked_project?: {
    id: number;
    identifier: string;
    name: string;
    tenant_id: number;
    tenant_name: string;
  } | null;
  cloud_link_id?: number | null;
  suggested_tenant?: { id: number; name: string } | null;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
}

interface DiscoveredUser {
  id: string;
  name?: string;
  username?: string;
  email?: string;
  domain_id?: string;
  [key: string]: unknown;
}

interface DiscoveryRun {
  id: string;
  uuid?: string;
  action: string;
  status: string;
  provider: string;
  region: string;
  queued_jobs_count: number;
  processed_jobs_count: number;
  total_items: number;
  message?: string;
  meta?: Record<string, unknown>;
  started_at?: string;
  finished_at?: string;
  created_at: string;
  actor?: { id: number; name: string; email: string } | null;
  [key: string]: unknown;
}

interface DriftReport {
  missing_remote?: unknown[];
  unlinked_remote?: unknown[];
  infra?: { summary?: unknown[] };
}

// ─── Tab Config ──────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "projects", label: "Projects", icon: FolderSync },
  { id: "users", label: "Users", icon: Users },
  { id: "runs", label: "Sync History", icon: History },
];

// ─── Helpers ─────────────────────────────────────────────────

const extractArray = <T,>(response: unknown, key?: string): T[] => {
  if (!response || typeof response !== "object") return [];
  const res = response as Record<string, unknown>;
  if (key && Array.isArray(res[key])) return res[key] as T[];
  if (Array.isArray(res.data)) {
    const inner = res.data as unknown;
    if (key && typeof inner === "object" && inner !== null && Array.isArray((inner as Record<string, unknown>)[key])) {
      return (inner as Record<string, unknown>)[key] as T[];
    }
    if (Array.isArray(inner)) return inner as T[];
  }
  if (key) {
    const nested = res.data as Record<string, unknown> | undefined;
    if (nested && Array.isArray(nested[key])) return nested[key] as T[];
  }
  return [];
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (start?: string | null, end?: string | null): string => {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const diffSec = Math.round((e - s) / 1000);
  if (diffSec < 60) return `${diffSec}s`;
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return `${min}m ${sec}s`;
};

const matchingStatusTone = (status?: string): "success" | "warning" | "danger" | "neutral" => {
  switch (status) {
    case "linked":
      return "success";
    case "tenant_suggested":
    case "domain_matched":
      return "warning";
    case "unmatched":
    case "missing_domain":
      return "danger";
    default:
      return "neutral";
  }
};

// ─── Component ───────────────────────────────────────────────

const AdminProviderDiscovery: React.FC = () => {
  // Shared state
  const [activeTab, setActiveTab] = useState<TabId>("projects");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedAZ, setSelectedAZ] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Project-specific
  const [showOnlyUnlinked, setShowOnlyUnlinked] = useState(false);
  const [driftReport, setDriftReport] = useState<DriftReport | null>(null);
  const [showDriftPanel, setShowDriftPanel] = useState(false);

  // User-specific
  const [linkingUser, setLinkingUser] = useState<DiscoveredUser | null>(null);
  const [localUserId, setLocalUserId] = useState("");

  // Confirm dialog
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
    isLoading?: boolean;
  }>({ open: false, title: "", message: "", onConfirm: () => {} });

  // Data hooks
  const { data: regionsRaw } = useFetchRegions();
  const regions = useMemo(() => (Array.isArray(regionsRaw) ? regionsRaw : []) as Region[], [regionsRaw]);

  // Derived: AZs for the selected region
  const availableAZs = useMemo(() => {
    if (!selectedRegion) return [];
    const region = regions.find((r) => (r.code || String(r.id)) === selectedRegion);
    return region?.availability_zones ?? [];
  }, [regions, selectedRegion]);

  // Derived: provider from the selected AZ, or from the region's first AZ
  const selectedProvider = useMemo(() => {
    if (selectedAZ) {
      const az = availableAZs.find((a) => a.code === selectedAZ);
      return az?.provider || "";
    }
    // If no AZ selected, resolve from region
    if (!selectedRegion) return "";
    const region = regions.find((r) => (r.code || String(r.id)) === selectedRegion);
    if (region?.provider) return region.provider;
    // Use first AZ's provider as fallback
    const firstAz = availableAZs[0];
    return firstAz?.provider || "";
  }, [availableAZs, selectedAZ, selectedRegion, regions]);

  // Project detail & linking state
  const [viewingProject, setViewingProject] = useState<DiscoveredProject | null>(null);
  const [linkingProject, setLinkingProject] = useState<DiscoveredProject | null>(null);
  const [linkContext, setLinkContext] = useState<"admin" | "tenant" | "client">("admin");
  const [linkTenantId, setLinkTenantId] = useState("");
  const [linkUserId, setLinkUserId] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const tenantDropdownRef = useRef<HTMLDivElement>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (tenantDropdownOpen && tenantDropdownRef.current && !tenantDropdownRef.current.contains(e.target as Node)) {
        setTenantDropdownOpen(false);
      }
      if (clientDropdownOpen && clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [tenantDropdownOpen, clientDropdownOpen]);

  // Tenant & client data for searchable selects
  const { data: tenantsRaw } = useFetchTenants({ enabled: linkContext !== "admin" && !!linkingProject });
  const tenants = useMemo(() => (Array.isArray(tenantsRaw) ? tenantsRaw : []) as Tenant[], [tenantsRaw]);

  const { data: clientsRaw } = useFetchClients({ enabled: linkContext === "client" && !!linkingProject });
  const allClients = useMemo(() => (Array.isArray(clientsRaw) ? clientsRaw : []) as Client[], [clientsRaw]);

  // Filter tenants by search
  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants;
    const q = tenantSearch.toLowerCase();
    return tenants.filter((t) =>
      (t.name || "").toLowerCase().includes(q) ||
      (t.company_name || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      String(t.id).includes(q)
    );
  }, [tenants, tenantSearch]);

  // Filter clients by selected tenant and search
  const filteredClients = useMemo(() => {
    let pool = allClients;
    if (linkTenantId) pool = pool.filter((c) => String(c.tenant_id) === linkTenantId);
    if (!clientSearch.trim()) return pool;
    const q = clientSearch.toLowerCase();
    return pool.filter((c) =>
      (c.name || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      String(c.id).includes(q)
    );
  }, [allClients, linkTenantId, clientSearch]);

  // Selected display labels
  const selectedTenant = useMemo(
    () => tenants.find((t) => String(t.id) === linkTenantId),
    [tenants, linkTenantId]
  );
  const selectedClient = useMemo(
    () => allClients.find((c) => String(c.id) === linkUserId),
    [allClients, linkUserId]
  );

  const canDiscover = Boolean(selectedRegion && selectedAZ);

  const projectFilters = useMemo(
    () => ({
      provider: selectedProvider,
      region: selectedRegion,
      availability_zone: selectedAZ || undefined,
      only_unlinked: showOnlyUnlinked || undefined,
    }),
    [selectedProvider, selectedRegion, selectedAZ, showOnlyUnlinked]
  );

  const {
    data: projectsRaw,
    isFetching: projectsLoading,
    refetch: refetchProjects,
  } = useFetchProviderDiscoveryProjects(projectFilters, { enabled: canDiscover });

  const projects = useMemo(
    () => extractArray<DiscoveredProject>(projectsRaw, "projects"),
    [projectsRaw]
  );

  const userFilters = useMemo(
    () => ({ provider: selectedProvider, region: selectedRegion, availability_zone: selectedAZ || undefined }),
    [selectedProvider, selectedRegion, selectedAZ]
  );

  const {
    data: usersRaw,
    isFetching: usersLoading,
    refetch: refetchUsers,
  } = useFetchProviderDiscoveryUsers(userFilters);

  const users = useMemo(() => extractArray<DiscoveredUser>(usersRaw, "users"), [usersRaw]);

  const runFilters = useMemo(
    () => ({ per_page: 50 }),
    []
  );

  const {
    data: runsRaw,
    isFetching: runsLoading,
    refetch: refetchRuns,
  } = useFetchProviderDiscoveryRuns(runFilters);

  const runs = useMemo(() => {
    const data = extractArray<DiscoveryRun>(runsRaw, "data");
    return data.length > 0 ? data : extractArray<DiscoveryRun>(runsRaw);
  }, [runsRaw]);

  const {
    refetch: fetchDrift,
    isFetching: driftLoading,
  } = useFetchProviderDiscoveryDrift({ provider: selectedProvider, region: selectedRegion });

  // Mutations
  const importMutation = useImportProviderDiscoveryProjects();
  const syncMutation = useSyncProviderDiscoveryProjects();
  const linkUserMutation = useLinkProviderDiscoveryUser();

  // ─── Actions ─────────────────────────────────────────────

  const handleImportSelected = useCallback(() => {
    if (!selectedProjectIds.length || !selectedAZ) return;
    const projectsToImport = selectedProjectIds.map((id) => {
      const project = projects.find((p) => p.id === id);
      return {
        external_id: id,
        name: project?.name,
        domain_id: project?.domain_id,
      };
    });

    setConfirmState({
      open: true,
      title: "Import Selected Projects",
      message: `Import ${selectedProjectIds.length} project(s) from ${selectedAZ}? This will create local project records and link them to the cloud provider.`,
      variant: "warning",
      onConfirm: () => {
        importMutation.mutate(
          {
            provider: selectedProvider,
            region: selectedRegion,
            availability_zone: selectedAZ,
            ensure_link: true,
            projects: projectsToImport,
          },
          {
            onSuccess: (data: unknown) => {
              const result = data as Record<string, unknown>;
              const results = (result?.results as unknown[]) || [];
              ToastUtils.success(`Imported ${results.length} project(s) successfully`);
              setSelectedProjectIds([]);
              setConfirmState((prev) => ({ ...prev, open: false }));
              refetchProjects();
            },
            onError: (error: unknown) => {
              const err = error as Record<string, unknown>;
              const responseData = (err?.response as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
              const message = (responseData?.message as string) || "Failed to import projects";
              ToastUtils.error(message);
              setConfirmState((prev) => ({ ...prev, open: false }));
            },
          }
        );
      },
      isLoading: importMutation.isPending,
    });
  }, [selectedProjectIds, selectedAZ, selectedRegion, selectedProvider, projects, importMutation, refetchProjects]);

  const handleLinkProject = useCallback((project: DiscoveredProject) => {
    setLinkingProject(project);
    setLinkContext("admin");
    setLinkTenantId("");
    setLinkUserId("");
    setTenantSearch("");
    setClientSearch("");
    setTenantDropdownOpen(false);
    setClientDropdownOpen(false);
  }, []);

  const handleConfirmLinkProject = useCallback(() => {
    if (!linkingProject || !selectedAZ) return;

    const projectPayload: Record<string, unknown> = {
      external_id: linkingProject.id,
      name: linkingProject.name,
      domain_id: linkingProject.domain_id,
    };

    if (linkContext === "tenant" && linkTenantId) {
      projectPayload.tenant_id = Number(linkTenantId);
    }
    if (linkContext === "client" && linkUserId) {
      projectPayload.user_id = Number(linkUserId);
      if (linkTenantId) projectPayload.tenant_id = Number(linkTenantId);
    }

    importMutation.mutate(
      {
        provider: selectedProvider,
        region: selectedRegion,
        availability_zone: selectedAZ,
        ensure_link: true,
        customer_context: linkContext,
        tenant_id: linkTenantId ? Number(linkTenantId) : undefined,
        user_id: linkUserId ? Number(linkUserId) : undefined,
        projects: [projectPayload],
      },
      {
        onSuccess: (data: unknown) => {
          const result = data as Record<string, unknown>;
          const results = (result?.results as unknown[]) || [];
          const first = results[0] as Record<string, unknown> | undefined;
          ToastUtils.success(
            first?.status === "linked"
              ? `Project "${linkingProject.name}" linked successfully`
              : `Project processed: ${first?.status || "done"}`
          );
          setLinkingProject(null);
          refetchProjects();
        },
        onError: (error: unknown) => {
          const err = error as Record<string, unknown>;
          const responseData = (err?.response as Record<string, unknown>)?.data as Record<string, unknown> | undefined;
          const message = (responseData?.message as string) || "Failed to link project";
          ToastUtils.error(message);
        },
      }
    );
  }, [linkingProject, selectedAZ, selectedRegion, selectedProvider, linkContext, linkTenantId, linkUserId, importMutation, refetchProjects]);

  const handleSyncAll = useCallback(() => {
    if (!selectedAZ) return;
    setConfirmState({
      open: true,
      title: "Sync All Projects",
      message: `This will discover and import all projects from the selected availability zone in the background. Infrastructure resources will also be synced. Continue?`,
      variant: "warning",
      onConfirm: () => {
        syncMutation.mutate(
          {
            provider: selectedProvider,
            region: selectedRegion,
            availability_zone: selectedAZ,
            queue: true,
            skip_infra: false,
          },
          {
            onSuccess: (data: unknown) => {
              const result = data as Record<string, unknown>;
              ToastUtils.success(
                `Sync started — ${result?.queued || 0} job(s) queued. Check the Sync History tab for progress.`
              );
              setConfirmState((prev) => ({ ...prev, open: false }));
              setActiveTab("runs");
              refetchRuns();
            },
            onError: () => {
              ToastUtils.error("Failed to start sync");
              setConfirmState((prev) => ({ ...prev, open: false }));
            },
          }
        );
      },
      isLoading: syncMutation.isPending,
    });
  }, [selectedAZ, selectedRegion, selectedProvider, syncMutation, refetchRuns]);

  const handleDetectDrift = useCallback(async () => {
    if (!selectedAZ) return;
    try {
      const result = await fetchDrift();
      const report = (result?.data as Record<string, unknown>)?.report ??
        ((result?.data as Record<string, unknown>)?.data as Record<string, unknown>)?.report;
      if (report) {
        setDriftReport(report as DriftReport);
        setShowDriftPanel(true);
      } else {
        ToastUtils.info("No drift data available");
      }
    } catch {
      ToastUtils.error("Failed to detect drift");
    }
  }, [selectedAZ, fetchDrift]);

  const handleLinkUser = useCallback(() => {
    if (!linkingUser || !localUserId || !selectedRegion) return;
    linkUserMutation.mutate(
      {
        provider: selectedProvider,
        region: selectedRegion,
        user_id: Number(localUserId),
        provider_user_id: linkingUser.id,
      },
      {
        onSuccess: () => {
          ToastUtils.success(`Linked user "${linkingUser.name || linkingUser.username}" successfully`);
          setLinkingUser(null);
          setLocalUserId("");
          refetchUsers();
        },
        onError: () => {
          ToastUtils.error("Failed to link user");
        },
      }
    );
  }, [linkingUser, localUserId, selectedRegion, selectedProvider, linkUserMutation, refetchUsers]);

  // ─── Columns ─────────────────────────────────────────────

  const projectColumns = useMemo(
    () => [
      {
        key: "name",
        header: "Project",
        sortable: true,
        render: (value: unknown, row: DiscoveredProject) => (
          <div className="min-w-0">
            <span className="font-medium text-gray-900 block truncate">{String(value || "Unnamed")}</span>
            <span className="font-mono text-[10px] text-gray-400 block truncate max-w-[180px]" title={row.id}>
              {row.id}
            </span>
            {row.description && (
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{row.description}</p>
            )}
          </div>
        ),
      },
      {
        key: "domain_id",
        header: "Domain",
        hideOnMobile: true,
        render: (value: unknown) => (
          <span className="font-mono text-xs text-gray-500 block truncate max-w-[160px]" title={String(value || "")}>
            {String(value || "—")}
          </span>
        ),
      },
      {
        key: "matching_status",
        header: "Status",
        sortable: true,
        render: (value: unknown) => {
          const status = String(value || "unknown");
          return (
            <StatusPill
              status={status}
              tone={matchingStatusTone(status)}
              label={status.replace(/_/g, " ")}
            />
          );
        },
      },
      {
        key: "linked_project",
        header: "Linked",
        render: (_value: unknown, row: DiscoveredProject) => {
          if (!row.linked_project) {
            if (row.suggested_tenant) {
              return (
                <span className="text-xs text-amber-600 block truncate max-w-[120px]">
                  Suggested: {row.suggested_tenant.name}
                </span>
              );
            }
            return <span className="text-xs text-gray-400">Not linked</span>;
          }
          return (
            <div className="min-w-0">
              <span className="text-sm font-medium text-blue-600 block truncate">
                {row.linked_project.identifier}
              </span>
              <p className="text-xs text-gray-500 truncate">{row.linked_project.name}</p>
            </div>
          );
        },
      },
    ],
    []
  );

  const userColumns = useMemo(
    () => [
      {
        key: "username",
        header: "Username",
        sortable: true,
        render: (value: unknown) => (
          <span className="font-medium text-gray-900">{String(value || "—")}</span>
        ),
      },
      {
        key: "name",
        header: "Name",
        render: (value: unknown) => <span className="text-sm">{String(value || "—")}</span>,
      },
      {
        key: "email",
        header: "Email",
        render: (value: unknown) => (
          <span className="text-sm text-gray-600">{String(value || "—")}</span>
        ),
      },
      {
        key: "id",
        header: "Provider User ID",
        render: (value: unknown) => (
          <span className="font-mono text-xs text-gray-500">{String(value || "—")}</span>
        ),
      },
      {
        key: "domain_id",
        header: "Domain",
        render: (value: unknown) => (
          <span className="font-mono text-xs text-gray-500">{String(value || "—")}</span>
        ),
      },
    ],
    []
  );

  const runColumns = useMemo(
    () => [
      {
        key: "action",
        header: "Action",
        sortable: true,
        render: (value: unknown) => {
          const action = String(value || "unknown");
          const toneMap: Record<string, "info" | "success" | "warning" | "neutral"> = {
            sync: "info",
            import: "success",
            drift: "warning",
            sync_dry_run: "neutral",
            sync_cli: "info",
          };
          return <StatusPill status={action} tone={toneMap[action] || "neutral"} label={action} />;
        },
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        render: (value: unknown) => {
          const status = String(value || "unknown");
          return <StatusPill status={status} />;
        },
      },
      {
        key: "provider",
        header: "Provider",
        render: (value: unknown) => (
          <span className="text-sm capitalize">{String(value || "—")}</span>
        ),
      },
      {
        key: "region",
        header: "Region",
        render: (value: unknown) => (
          <span className="text-sm font-mono">{String(value || "—")}</span>
        ),
      },
      {
        key: "processed_jobs_count",
        header: "Progress",
        render: (_value: unknown, row: DiscoveryRun) => {
          const total = row.total_items || row.queued_jobs_count + row.processed_jobs_count;
          if (!total) return <span className="text-xs text-gray-400">—</span>;
          const pct = Math.round((row.processed_jobs_count / total) * 100);
          return (
            <div className="flex items-center gap-2 min-w-[120px]">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    pct >= 100 ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-gray-600 whitespace-nowrap">
                {row.processed_jobs_count}/{total}
              </span>
            </div>
          );
        },
      },
      {
        key: "started_at",
        header: "Started",
        sortable: true,
        render: (value: unknown) => (
          <span className="text-xs text-gray-600">{formatDateTime(value as string)}</span>
        ),
      },
      {
        key: "finished_at",
        header: "Duration",
        render: (_value: unknown, row: DiscoveryRun) => (
          <span className="text-xs font-mono text-gray-600">
            {formatDuration(row.started_at, row.finished_at)}
          </span>
        ),
      },
      {
        key: "actor",
        header: "Triggered By",
        render: (value: unknown) => {
          const actor = value as DiscoveryRun["actor"];
          if (!actor) return <span className="text-xs text-gray-400">System</span>;
          return <span className="text-xs text-gray-600">{actor.name}</span>;
        },
      },
    ],
    []
  );

  // ─── Region Selector ─────────────────────────────────────

  const renderRegionSelector = () => (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
        <select
          value={selectedRegion}
          onChange={(e) => {
            setSelectedRegion(e.target.value);
            setSelectedAZ("");
            setSelectedProjectIds([]);
            setDriftReport(null);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[200px]"
        >
          <option value="">Select region...</option>
          {regions.map((r) => (
            <option key={r.code || String(r.id)} value={r.code || ""}>
              {r.name || r.code || String(r.id)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Availability Zone</label>
        <select
          value={selectedAZ}
          onChange={(e) => {
            setSelectedAZ(e.target.value);
            setSelectedProjectIds([]);
            setDriftReport(null);
          }}
          disabled={!selectedRegion || availableAZs.length === 0}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-w-[220px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select availability zone...</option>
          {availableAZs.map((az) => (
            <option key={az.code} value={az.code}>
              {az.name || az.code}
            </option>
          ))}
        </select>
      </div>
      {selectedAZ && (
        <div className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
          <Info className="w-4 h-4 shrink-0" />
          <span>Ready to discover</span>
        </div>
      )}
      {selectedRegion && !selectedAZ && (
        <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          <Info className="w-4 h-4 shrink-0" />
          <span>Select an availability zone to discover resources</span>
        </div>
      )}
      {!selectedRegion && (
        <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
          <Info className="w-4 h-4 shrink-0" />
          <span>Select a region and availability zone to discover resources</span>
        </div>
      )}
    </div>
  );

  // ─── Projects Tab ─────────────────────────────────────────

  const renderProjectsTab = () => (
    <div className="space-y-4">
      {renderRegionSelector()}

      {canDiscover && (
        <div className="flex flex-wrap items-center gap-2">
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => refetchProjects()}
            disabled={projectsLoading}
          >
            <Search className="w-4 h-4" />
            {projectsLoading ? "Discovering..." : "Discover Projects"}
          </ModernButton>

          <ModernButton
            variant="secondary"
            size="sm"
            onClick={handleSyncAll}
            disabled={syncMutation.isPending}
          >
            <FolderSync className="w-4 h-4" />
            Sync All
          </ModernButton>

          <ModernButton
            variant="outline"
            size="sm"
            onClick={handleDetectDrift}
            disabled={driftLoading}
          >
            <AlertTriangle className="w-4 h-4" />
            {driftLoading ? "Detecting..." : "Detect Drift"}
          </ModernButton>

          {selectedProjectIds.length > 0 && (
            <ModernButton variant="success" size="sm" onClick={handleImportSelected}>
              <Download className="w-4 h-4" />
              Import Selected ({selectedProjectIds.length})
            </ModernButton>
          )}

          <label className="ml-auto flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnlyUnlinked}
              onChange={(e) => setShowOnlyUnlinked(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show only unlinked
          </label>
        </div>
      )}

      {/* Drift Report Panel */}
      {showDriftPanel && driftReport && (
        <ModernCard className="border-amber-200 bg-amber-50/50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Drift Report
              </h3>
              <button
                onClick={() => setShowDriftPanel(false)}
                className="text-xs text-amber-600 hover:text-amber-800"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-amber-200 p-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Missing from Remote</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {driftReport.missing_remote?.length ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Projects in local DB but not found in provider
                </p>
              </div>
              <div className="rounded-lg bg-white border border-amber-200 p-3">
                <p className="text-xs font-medium text-gray-500 uppercase">Unlinked Remote</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {driftReport.unlinked_remote?.length ?? 0}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Projects in provider but not linked locally
                </p>
              </div>
            </div>
            {driftReport.infra?.summary && Array.isArray(driftReport.infra.summary) && (
              <div className="mt-3 border-t border-amber-200 pt-3">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Infrastructure Drift
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(driftReport.infra.summary as Record<string, unknown>[]).map(
                    (item, idx: number) => (
                      <div key={idx} className="text-xs bg-white border border-amber-200 rounded p-2">
                        <span className="font-medium capitalize">
                          {String(item.resource_type || "—").replace(/_/g, " ")}
                        </span>
                        <div className="text-gray-500 mt-0.5">
                          Missing: {String(item.missing_remote ?? 0)} / Unlinked:{" "}
                          {String(item.unlinked_remote ?? 0)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </ModernCard>
      )}

      <ModernTable
        data={projects}
        columns={projectColumns}
        loading={projectsLoading}
        searchable
        searchKeys={["name", "id", "domain_id"]}
        searchPlaceholder="Search projects by name or ID..."
        sortable
        paginated
        pageSize={20}
        selectable
        selectedIds={selectedProjectIds}
        onSelectionChange={setSelectedProjectIds}
        onRowClick={(row: DiscoveredProject) => setViewingProject(row)}
        emptyMessage={
          canDiscover
            ? "No projects discovered. Click \"Discover Projects\" to fetch from the provider."
            : "Select a region and availability zone to discover projects."
        }
      />
    </div>
  );

  // ─── Users Tab ────────────────────────────────────────────

  const renderUsersTab = () => (
    <div className="space-y-4">
      {renderRegionSelector()}

      {canDiscover && (
        <div className="flex items-center gap-2">
          <ModernButton
            variant="primary"
            size="sm"
            onClick={() => refetchUsers()}
            disabled={usersLoading}
          >
            <Search className="w-4 h-4" />
            {usersLoading ? "Discovering..." : "Discover Users"}
          </ModernButton>
        </div>
      )}

      <ModernTable
        data={users}
        columns={userColumns}
        loading={usersLoading}
        searchable
        searchKeys={["username", "name", "email"]}
        searchPlaceholder="Search by username, name, or email..."
        sortable
        paginated
        pageSize={20}
        actions={[
          {
            label: "Link to Local User",
            icon: <Link2 className="w-4 h-4" />,
            onClick: (row: DiscoveredUser) => {
              setLinkingUser(row);
              setLocalUserId("");
            },
            tone: "primary" as const,
          },
        ]}
        emptyMessage={
          canDiscover
            ? "No users discovered. Click \"Discover Users\" to fetch from the cloud provider."
            : "Select a region and availability zone to discover users."
        }
      />

      {/* Link User Modal */}
      {linkingUser && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Link Provider User</h3>
            <p className="text-sm text-gray-500 mb-4">
              Link <strong>{linkingUser.username || linkingUser.name}</strong> from{" "}
              {selectedProvider} to a local user account.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Provider User
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <span className="font-medium">{linkingUser.username || linkingUser.name}</span>
                  {linkingUser.email && (
                    <span className="text-gray-500 ml-2">({linkingUser.email})</span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Local User ID
                </label>
                <input
                  type="number"
                  value={localUserId}
                  onChange={(e) => setLocalUserId(e.target.value)}
                  placeholder="Enter the local user ID to link..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <ModernButton variant="outline" size="sm" onClick={() => setLinkingUser(null)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleLinkUser}
                disabled={!localUserId || linkUserMutation.isPending}
              >
                {linkUserMutation.isPending ? "Linking..." : "Link User"}
              </ModernButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Runs Tab ─────────────────────────────────────────────

  const renderRunsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing the history of all discovery and sync operations.
        </p>
        <ModernButton variant="outline" size="sm" onClick={() => refetchRuns()} disabled={runsLoading}>
          <RefreshCw className={`w-4 h-4 ${runsLoading ? "animate-spin" : ""}`} />
          Refresh
        </ModernButton>
      </div>

      <ModernTable
        data={runs}
        columns={runColumns}
        loading={runsLoading}
        searchable
        searchKeys={["action", "status", "provider", "region"]}
        searchPlaceholder="Search runs..."
        sortable
        paginated
        pageSize={15}
        expandable
        renderExpandedRow={(row: DiscoveryRun) => (
          <div className="p-4 bg-gray-50 space-y-3">
            {row.message && (
              <div className="text-sm text-gray-700">
                <span className="font-medium text-gray-500 mr-1">Message:</span>
                {row.message}
              </div>
            )}
            {row.meta && Object.keys(row.meta).length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-500 font-medium hover:text-gray-700">
                  View run details (meta)
                </summary>
                <pre className="mt-2 bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-64 text-gray-700">
                  {JSON.stringify(row.meta, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
        emptyMessage="No sync runs recorded yet."
      />
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────

  const headerActions = (
    <div className="flex items-center gap-2">
      {canDiscover && activeTab === "projects" && (
        <ModernButton
          variant="primary"
          size="sm"
          onClick={handleSyncAll}
          disabled={syncMutation.isPending}
        >
          <CloudDownload className="w-4 h-4" />
          {syncMutation.isPending ? "Starting..." : "Full Sync"}
        </ModernButton>
      )}
    </div>
  );

  return (
    <AdminPageShell
      title="Provider Discovery"
      description="Discover and import projects, users, and resources from cloud providers"
      actions={headerActions}
      icon={<CloudDownload className="w-5 h-5" />}
    >
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Discovered Projects
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Linked</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {projects.filter((p) => p.matching_status === "linked").length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Unlinked</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {projects.filter((p) => p.matching_status !== "linked").length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recent Sync Runs
          </p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{runs.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-1">
        {activeTab === "projects" && renderProjectsTab()}
        {activeTab === "users" && renderUsersTab()}
        {activeTab === "runs" && renderRunsTab()}
      </div>

      {/* Project Detail Drawer */}
      {viewingProject && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20" onClick={() => setViewingProject(null)} />
          <div className="relative w-full max-w-md bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
              <h3 className="text-base font-semibold text-gray-900">Project Details</h3>
              <button
                onClick={() => setViewingProject(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Name & Status */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{viewingProject.name || "Unnamed"}</h4>
                {viewingProject.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{viewingProject.description}</p>
                )}
                <div className="mt-2">
                  <StatusPill
                    status={viewingProject.matching_status || "unknown"}
                    tone={matchingStatusTone(viewingProject.matching_status)}
                    label={(viewingProject.matching_status || "unknown").replace(/_/g, " ")}
                  />
                </div>
              </div>

              {/* IDs */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 divide-y divide-gray-200">
                <div className="px-3 py-2.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">External ID</span>
                  <p className="font-mono text-xs text-gray-700 mt-0.5 break-all select-all">{viewingProject.id}</p>
                </div>
                {viewingProject.domain_id && (
                  <div className="px-3 py-2.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Domain ID</span>
                    <p className="font-mono text-xs text-gray-700 mt-0.5 break-all select-all">{viewingProject.domain_id}</p>
                  </div>
                )}
              </div>

              {/* Matching Info */}
              {viewingProject.matching_notes && viewingProject.matching_notes.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Matching Notes</span>
                  <ul className="mt-1 space-y-1">
                    {viewingProject.matching_notes.map((note, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <Info className="w-3 h-3 text-gray-400 mt-0.5 shrink-0" />
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Linked Project */}
              {viewingProject.linked_project && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-green-600">Linked To</span>
                  <p className="font-semibold text-green-800 mt-1">
                    {viewingProject.linked_project.identifier}
                  </p>
                  <p className="text-xs text-green-700">{viewingProject.linked_project.name}</p>
                  {viewingProject.linked_project.tenant_name && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Tenant: {viewingProject.linked_project.tenant_name}
                    </p>
                  )}
                </div>
              )}

              {/* Suggested Tenant */}
              {!viewingProject.linked_project && viewingProject.suggested_tenant && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600">Suggested Tenant</span>
                  <p className="text-sm font-medium text-amber-800 mt-1">
                    {viewingProject.suggested_tenant.name}
                  </p>
                  <p className="text-xs text-amber-600">ID: {viewingProject.suggested_tenant.id}</p>
                </div>
              )}

              {/* Raw Data */}
              {viewingProject.raw && Object.keys(viewingProject.raw).length > 0 && (
                <details className="group">
                  <summary className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 cursor-pointer hover:text-gray-600 select-none">
                    Raw Provider Data
                  </summary>
                  <pre className="mt-2 text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto">
                    {JSON.stringify(viewingProject.raw, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            {/* Footer Action */}
            {viewingProject.matching_status !== "linked" && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <ModernButton
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => {
                    handleLinkProject(viewingProject);
                    setViewingProject(null);
                  }}
                >
                  <Link2 className="w-4 h-4" />
                  Link This Project
                </ModernButton>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Project Modal */}
      {linkingProject && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Link Project</h3>
            <p className="text-sm text-gray-500 mb-4">
              Link <strong>{linkingProject.name || linkingProject.id}</strong> to a customer context.
              This will create a project in the database and pull all related resources.
            </p>

            <div className="space-y-4">
              {/* Project Info */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500">Project Name</span>
                    <p className="font-medium text-gray-900 truncate">{linkingProject.name || "Unnamed"}</p>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs text-gray-500">External ID</span>
                    <p className="font-mono text-xs text-gray-600 truncate">{linkingProject.id}</p>
                  </div>
                </div>
              </div>

              {/* Customer Context */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Assign To
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["admin", "tenant", "client"] as const).map((ctx) => (
                    <button
                      key={ctx}
                      type="button"
                      onClick={() => {
                        setLinkContext(ctx);
                        if (ctx === "admin") { setLinkTenantId(""); setLinkUserId(""); }
                        if (ctx === "tenant") { setLinkUserId(""); setClientSearch(""); }
                        setTenantSearch("");
                        setClientSearch("");
                        setTenantDropdownOpen(false);
                        setClientDropdownOpen(false);
                      }}
                      className={`rounded-lg border-2 px-3 py-2 sm:px-4 sm:py-2.5 text-sm font-medium capitalize transition-all ${
                        linkContext === ctx
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {ctx}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-gray-400">
                  {linkContext === "admin" && "Project will be owned by the platform admin."}
                  {linkContext === "tenant" && "Project will be assigned to a specific tenant (reseller)."}
                  {linkContext === "client" && "Project will be assigned to a specific end-user under a tenant."}
                </p>
              </div>

              {/* Tenant Selector (for tenant & client context) */}
              {(linkContext === "tenant" || linkContext === "client") && (
                <div className="relative" ref={tenantDropdownRef}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tenant</label>
                  <button
                    type="button"
                    onClick={() => { setTenantDropdownOpen(!tenantDropdownOpen); setClientDropdownOpen(false); }}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {selectedTenant ? (
                      <span className="truncate">
                        <span className="font-medium">{selectedTenant.name || selectedTenant.company_name}</span>
                        <span className="text-gray-400 ml-1">#{selectedTenant.id}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">Search and select a tenant...</span>
                    )}
                    <Search className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  </button>

                  {tenantDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          autoFocus
                          type="text"
                          value={tenantSearch}
                          onChange={(e) => setTenantSearch(e.target.value)}
                          placeholder="Search by name, email, or ID..."
                          className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto py-1">
                        {filteredTenants.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-gray-400 text-center">No tenants found</li>
                        ) : (
                          filteredTenants.slice(0, 50).map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLinkTenantId(String(t.id));
                                  setTenantSearch("");
                                  setTenantDropdownOpen(false);
                                  // Reset client when tenant changes
                                  setLinkUserId("");
                                  setClientSearch("");
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                  String(t.id) === linkTenantId ? "bg-blue-50 text-blue-700" : "text-gray-700"
                                }`}
                              >
                                <span className="font-medium">{t.name || t.company_name || "Unnamed"}</span>
                                <span className="text-gray-400 text-xs ml-1.5">#{t.id}</span>
                                {t.email && <span className="block text-xs text-gray-400 truncate">{t.email}</span>}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}

                  {linkingProject.suggested_tenant && !linkTenantId && (
                    <button
                      type="button"
                      onClick={() => {
                        setLinkTenantId(String(linkingProject.suggested_tenant!.id));
                        setTenantDropdownOpen(false);
                      }}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
                    >
                      <Info className="w-3 h-3" />
                      Suggested: {linkingProject.suggested_tenant.name}
                    </button>
                  )}
                </div>
              )}

              {/* Client Selector (for client context) */}
              {linkContext === "client" && (
                <div className="relative" ref={clientDropdownRef}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Client (User)</label>
                  <button
                    type="button"
                    onClick={() => { setClientDropdownOpen(!clientDropdownOpen); setTenantDropdownOpen(false); }}
                    disabled={!linkTenantId}
                    className="w-full flex items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-left hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedClient ? (
                      <span className="truncate">
                        <span className="font-medium">{selectedClient.name || selectedClient.email}</span>
                        <span className="text-gray-400 ml-1">#{selectedClient.id}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">
                        {linkTenantId ? "Search and select a client..." : "Select a tenant first"}
                      </span>
                    )}
                    <Search className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                  </button>

                  {clientDropdownOpen && linkTenantId && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          autoFocus
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Search by name, email, or ID..."
                          className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <ul className="max-h-48 overflow-y-auto py-1">
                        {filteredClients.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-gray-400 text-center">
                            {allClients.length === 0 ? "Loading clients..." : "No clients found for this tenant"}
                          </li>
                        ) : (
                          filteredClients.slice(0, 50).map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLinkUserId(String(c.id));
                                  setClientSearch("");
                                  setClientDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                                  String(c.id) === linkUserId ? "bg-blue-50 text-blue-700" : "text-gray-700"
                                }`}
                              >
                                <span className="font-medium">{c.name || c.full_name || "Unnamed"}</span>
                                <span className="text-gray-400 text-xs ml-1.5">#{c.id}</span>
                                {c.email && <span className="block text-xs text-gray-400 truncate">{c.email}</span>}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5 border-t border-gray-100 pt-4">
              <ModernButton variant="outline" size="sm" onClick={() => setLinkingProject(null)}>
                Cancel
              </ModernButton>
              <ModernButton
                variant="primary"
                size="sm"
                onClick={handleConfirmLinkProject}
                disabled={
                  importMutation.isPending ||
                  (linkContext === "tenant" && !linkTenantId) ||
                  (linkContext === "client" && (!linkTenantId || !linkUserId))
                }
              >
                {importMutation.isPending ? "Linking..." : "Link & Import Resources"}
              </ModernButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel="Continue"
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        isLoading={importMutation.isPending || syncMutation.isPending}
      />
    </AdminPageShell>
  );
};

export default AdminProviderDiscovery;
