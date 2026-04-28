import React, { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Layers,
  Rocket,
  Server as ServerIcon,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import ModernModal from "@/shared/components/ui/ModernModal";
import ModernCard from "@/shared/components/ui/ModernCard";
import ModernButton from "@/shared/components/ui/ModernButton";
import {
  useFlowApi,
  type FlowServer,
  type FlowSite,
  type FlowDeployment,
  type FlowCertificate,
  type FlowDatabase,
} from "@/shared/hooks/useFlowApi";

export interface FlowSiteArchitectureModalProps {
  open: boolean;
  onClose: () => void;
  server: FlowServer;
  site: FlowSite;
}

type NodeKind = "source" | "deployment" | "service" | "domain" | "database" | "host";
type NodeStatus = "healthy" | "warning" | "error" | "unknown";

interface ArchNode {
  id: NodeKind;
  /** Short uppercase tag, e.g. "SOURCE". */
  kindLabel: string;
  label: string;
  sublabel?: string;
  icon: typeof GitBranch;
  status: NodeStatus;
  /** Pixel coordinates inside the fixed canvas viewport. */
  x: number;
  y: number;
}

interface ArchEdge {
  from: NodeKind;
  to: NodeKind;
}

const NODE_W = 220;
const NODE_H = 92;
const CANVAS_W = 880;
const CANVAS_H = 460;

/**
 * UniCloud Flow (SlimDeploy) — Architecture canvas for a Flow Site.
 *
 * Same visual model as the LeanPloy Architecture tab: a 6-node graph
 * (Source → Deployment → App Service → {Domain, Database, Host}) with
 * cubic-bezier edges, status dots that roll up live, and a click-to-inspect
 * inspector pane below the canvas.
 *
 * Renders inside `ModernModal` size=xl since Flow Sites are listed inline on
 * the FlowDashboard's Sites tab — there's no per-site detail page yet, so
 * the modal IS the detail view.
 */
const FlowSiteArchitectureModal: React.FC<FlowSiteArchitectureModalProps> = ({
  open,
  onClose,
  server,
  site,
}) => {
  const api = useFlowApi();

  // Data fetched lazily on open. Keep these as plain state so we can show a
  // "loading" placeholder while the three calls resolve in parallel.
  const [deployments, setDeployments] = useState<FlowDeployment[]>([]);
  const [certificates, setCertificates] = useState<FlowCertificate[]>([]);
  const [databases, setDatabases] = useState<FlowDatabase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    Promise.all([
      api.getDeployments(server.id, site.id).catch(() => [] as FlowDeployment[]),
      api
        .getCertificates(server.id, site.id)
        .catch(() => [] as unknown as FlowCertificate[]),
      api.getDatabases(server.id).catch(() => [] as unknown as FlowDatabase[]),
    ]).then(([d, c, db]) => {
      if (cancelled) return;
      setDeployments(Array.isArray(d) ? (d as FlowDeployment[]) : []);
      setCertificates(Array.isArray(c) ? (c as FlowCertificate[]) : []);
      setDatabases(Array.isArray(db) ? (db as FlowDatabase[]) : []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open, api, server.id, site.id]);

  const latestDeployment = deployments.length > 0 ? deployments[0] : undefined;

  // SSL: a Flow certificate carries `domains: string[]` rather than a single
  // domain field (different from LeanPloy's per-cert single domain) — match
  // against site.domain or any temporary-domain alias.
  const sslActive = useMemo(() => {
    return certificates.some(
      (c) =>
        c.status === "active" &&
        Array.isArray(c.domains) &&
        c.domains.includes(site.domain),
    );
  }, [certificates, site.domain]);

  const repository = site.repository ?? "";
  const repoShort = repository
    ? repository.split("/").slice(-2).join("/").replace(/\.git$/, "")
    : "—";

  const deploymentStatus = latestDeployment?.status ?? "unknown";
  const deploymentNodeStatus: NodeStatus =
    deploymentStatus === "success"
      ? "healthy"
      : deploymentStatus === "failed"
        ? "error"
        : deploymentStatus === "running" || deploymentStatus === "queued"
          ? "warning"
          : "unknown";

  const siteNodeStatus: NodeStatus =
    site.status === "active"
      ? "healthy"
      : site.status === "failed"
        ? "error"
        : site.status === "deploying" || site.status === "installing"
          ? "warning"
          : "unknown";

  const hostStatus: NodeStatus =
    server.status === "active"
      ? "healthy"
      : server.status === "failed"
        ? "error"
        : "warning";

  const nodes: ArchNode[] = useMemo(() => {
    return [
      {
        id: "source",
        kindLabel: "SOURCE",
        label: repoShort || "No repo",
        sublabel: site.branch || "main",
        icon: GitBranch,
        status: repository ? "healthy" : "warning",
        x: 40,
        y: 60,
      },
      {
        id: "deployment",
        kindLabel: "DEPLOYMENT",
        label: latestDeployment ? "Latest deployment" : "No deployments yet",
        sublabel: latestDeployment
          ? `${deploymentStatus} · ${latestDeployment.commit_hash?.slice(0, 7) ?? "—"}`
          : "Trigger one with Deploy",
        icon: Rocket,
        status: deploymentNodeStatus,
        x: 330,
        y: 60,
      },
      {
        id: "service",
        kindLabel: "APP SERVICE",
        label: site.domain,
        sublabel: `${site.project_type ?? "unknown"} · ${site.directory || "/public"}`,
        icon: Layers,
        status: siteNodeStatus,
        x: 330,
        y: 200,
      },
      {
        id: "domain",
        kindLabel: "DOMAIN",
        label: site.domain,
        sublabel: site.temporary_domain
          ? `Temp: ${site.temporary_domain.domain}${sslActive ? " · SSL" : ""}`
          : sslActive
            ? "SSL active"
            : "No SSL",
        icon: Globe,
        status: sslActive ? "healthy" : "warning",
        x: 40,
        y: 340,
      },
      {
        id: "database",
        kindLabel: "DATABASE",
        label: databases.length > 0 ? `${databases.length} on host` : "No database attached",
        sublabel:
          databases.length > 0
            ? `Latest: ${databases[0]?.name ?? "—"}`
            : "Attach one when the app needs persistence",
        icon: Database,
        status: databases.length > 0 ? "healthy" : "unknown",
        x: 330,
        y: 340,
      },
      {
        id: "host",
        kindLabel: "HOST",
        label: server.name,
        sublabel: server.ip_address || "Hosted on UniCloud",
        icon: ServerIcon,
        status: hostStatus,
        x: 620,
        y: 200,
      },
    ];
  }, [
    repoShort,
    repository,
    site.branch,
    site.domain,
    site.project_type,
    site.directory,
    site.temporary_domain,
    latestDeployment,
    deploymentStatus,
    deploymentNodeStatus,
    siteNodeStatus,
    sslActive,
    databases,
    server.name,
    server.ip_address,
    hostStatus,
  ]);

  const edges: ArchEdge[] = [
    { from: "source", to: "deployment" },
    { from: "deployment", to: "service" },
    { from: "service", to: "domain" },
    { from: "service", to: "database" },
    { from: "service", to: "host" },
  ];

  const [selected, setSelected] = useState<NodeKind | null>(null);
  const selectedNode = nodes.find((n) => n.id === selected) ?? null;

  // Reset selection each time the modal re-opens, so the inspector doesn't
  // show a stale node from the last viewing.
  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  return (
    <ModernModal
      isOpen={open}
      onClose={onClose}
      title="Project Architecture"
      subtitle={`${site.domain} on ${server.name}`}
      size="xl"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <ModernCard>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Project Architecture
              </p>
              <p className="truncate text-xs text-slate-500">
                Click a card to inspect. Status dots reflect live state from your last fetch.
              </p>
            </div>
          </div>

          <div
            className="relative overflow-x-auto overflow-y-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40"
            style={{ minHeight: CANVAS_H + 32 }}
            role="figure"
            aria-label="Flow site architecture diagram"
          >
            <div className="relative" style={{ width: CANVAS_W, height: CANVAS_H }}>
              {/* Edges */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                aria-hidden="true"
              >
                <defs>
                  <pattern
                    id="flow-arch-grid"
                    x="0"
                    y="0"
                    width="24"
                    height="24"
                    patternUnits="userSpaceOnUse"
                  >
                    <circle cx="1" cy="1" r="1" className="fill-slate-200 dark:fill-slate-700" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#flow-arch-grid)" opacity="0.5" />
                {edges.map((e) => {
                  const a = nodes.find((n) => n.id === e.from);
                  const b = nodes.find((n) => n.id === e.to);
                  if (!a || !b) return null;
                  const ax = a.x + NODE_W / 2;
                  const ay = a.y + NODE_H / 2;
                  const bx = b.x + NODE_W / 2;
                  const by = b.y + NODE_H / 2;
                  const cx1 = ax + (bx - ax) * 0.5;
                  const cx2 = bx - (bx - ax) * 0.5;
                  const isActive = selected === e.from || selected === e.to;
                  return (
                    <path
                      key={`${e.from}-${e.to}`}
                      d={`M ${ax} ${ay} C ${cx1} ${ay}, ${cx2} ${by}, ${bx} ${by}`}
                      fill="none"
                      strokeWidth={isActive ? 2 : 1.25}
                      strokeDasharray={isActive ? "0" : "4 4"}
                      className={
                        isActive ? "stroke-emerald-500" : "stroke-slate-300 dark:stroke-slate-600"
                      }
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {nodes.map((n) => (
                <NodeCard
                  key={n.id}
                  node={n}
                  selected={selected === n.id}
                  onClick={() => setSelected(selected === n.id ? null : n.id)}
                />
              ))}

              {loading && (
                <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-white/80 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-500 backdrop-blur-sm dark:bg-slate-900/80">
                  Loading…
                </div>
              )}
            </div>
          </div>
        </ModernCard>

        {/* Inspector */}
        <ModernCard>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {selectedNode ? selectedNode.kindLabel : "INSPECTOR"}
            </p>
            {selectedNode && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Close inspector"
                className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!selectedNode ? (
            <p className="text-sm text-slate-500">
              Click any card on the canvas to see its details and shortcuts.
            </p>
          ) : (
            <Inspector
              node={selectedNode}
              site={site}
              sslActive={sslActive}
              databases={databases}
              server={server}
              latestDeployment={latestDeployment}
            />
          )}
        </ModernCard>
      </div>
    </ModernModal>
  );
};

// ── Node card ──────────────────────────────────────────────────────────────

const statusDotClass: Record<NodeStatus, string> = {
  healthy: "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]",
  warning: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]",
  error: "bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.15)]",
  unknown: "bg-slate-400 shadow-[0_0_0_4px_rgba(148,163,184,0.15)]",
};

interface NodeCardProps {
  node: ArchNode;
  selected: boolean;
  onClick: () => void;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, selected, onClick }) => {
  const Icon = node.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`${node.kindLabel}: ${node.label}`}
      className={[
        "group absolute flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 text-left shadow-sm transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
        "dark:bg-slate-800",
        selected
          ? "border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/40"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
      ].join(" ")}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
    >
      <div
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          selected
            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            : "bg-slate-100 text-slate-500 group-hover:text-slate-700 dark:bg-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200",
        ].join(" ")}
        aria-hidden="true"
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {node.kindLabel}
        </p>
        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
          {node.label}
        </p>
        {node.sublabel && (
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
            {node.sublabel}
          </p>
        )}
      </div>
      <span
        className={`absolute right-3 top-3 inline-flex h-2 w-2 rounded-full ${statusDotClass[node.status]}`}
        role="status"
        aria-label={`Status: ${node.status}`}
      />
    </button>
  );
};

// ── Inspector ──────────────────────────────────────────────────────────────

interface InspectorProps {
  node: ArchNode;
  site: FlowSite;
  sslActive: boolean;
  databases: FlowDatabase[];
  server: FlowServer;
  latestDeployment: FlowDeployment | undefined;
}

const Inspector: React.FC<InspectorProps> = ({
  node,
  site,
  sslActive,
  databases,
  server,
  latestDeployment,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-base font-semibold text-slate-900 dark:text-white">{node.label}</p>
        {node.sublabel && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{node.sublabel}</p>
        )}
      </div>

      {node.id === "source" && (
        <>
          <Field label="Repository">
            {site.repository ? (
              <a
                href={site.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-sm text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {site.repository}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            ) : (
              <span className="text-sm text-slate-500">Not connected</span>
            )}
          </Field>
          <Field label="Branch">
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {site.branch || "main"}
            </span>
          </Field>
        </>
      )}

      {node.id === "deployment" && latestDeployment && (
        <>
          <Field label="Status">
            <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
              {String(latestDeployment.status)}
            </span>
          </Field>
          <Field label="Commit">
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {latestDeployment.commit_hash?.slice(0, 12) ?? "—"}
            </span>
          </Field>
          <Field label="Created">
            <span className="text-xs text-slate-500">
              {new Date(latestDeployment.created_at).toLocaleString()}
            </span>
          </Field>
        </>
      )}

      {node.id === "service" && (
        <>
          <Field label="Framework">
            <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
              {site.project_type ?? "—"}
            </span>
          </Field>
          <Field label="Web directory">
            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
              {site.directory || "/public"}
            </span>
          </Field>
        </>
      )}

      {node.id === "domain" && (
        <>
          <Field label="Primary">
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 break-all text-sm text-emerald-600 hover:underline dark:text-emerald-400"
            >
              {site.domain}
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          </Field>
          {site.temporary_domain && (
            <Field label="Temporary domain">
              <a
                href={`${site.temporary_domain.https ? "https" : "http"}://${site.temporary_domain.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-sm text-emerald-600 hover:underline dark:text-emerald-400"
              >
                {site.temporary_domain.domain}
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
              </a>
            </Field>
          )}
          <Field label="SSL">
            <span
              className={`inline-flex items-center gap-1 text-sm ${sslActive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
            >
              {sslActive ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Active
                </>
              ) : (
                <>
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" /> Not provisioned
                </>
              )}
            </span>
          </Field>
        </>
      )}

      {node.id === "database" && (
        <>
          {databases.length === 0 ? (
            <p className="text-sm text-slate-500">
              No database attached on this host. Use the Databases tab on the dashboard to create
              one.
            </p>
          ) : (
            <Field label="Databases on host">
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {databases.slice(0, 6).map((d, i) => (
                  <li key={d.id ?? i}>
                    <span className="font-medium">{d.name ?? `db-${i}`}</span>
                    {d.type && (
                      <span className="ml-2 text-xs text-slate-500">{d.type}</span>
                    )}
                  </li>
                ))}
                {databases.length > 6 && (
                  <li className="text-xs text-slate-500">+{databases.length - 6} more</li>
                )}
              </ul>
            </Field>
          )}
        </>
      )}

      {node.id === "host" && (
        <>
          <Field label="Status">
            <span className="text-sm capitalize text-slate-700 dark:text-slate-300">
              {server.status}
            </span>
          </Field>
          {server.ip_address && (
            <Field label="IP">
              <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                {server.ip_address}
              </span>
            </Field>
          )}
          {server.php_version && (
            <Field label="PHP">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {server.php_version}
              </span>
            </Field>
          )}
          {server.ubuntu_version && (
            <Field label="OS">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Ubuntu {server.ubuntu_version}
              </span>
            </Field>
          )}
        </>
      )}

      <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
        <ModernButton
          variant="primary"
          size="sm"
          onClick={() =>
            window.open(`https://${site.domain}`, "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          Visit app
        </ModernButton>
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    <div className="mt-0.5">{children}</div>
  </div>
);

export default FlowSiteArchitectureModal;
