/**
 * Client-facing monitoring page.
 *
 * Surfaces THE CALLER'S OWN VMs — scoped server-side via the
 * `/business/monitoring/instances` endpoint. Never shows other clients'
 * VMs. For each VM, renders status, last-seen, latest CPU/mem/disk
 * snapshot if known. When a VM is in "pending operator install" state,
 * exposes the persisted command via a modal so the customer can
 * copy/paste it onto their host as root.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Terminal, Copy, CheckCircle } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import {
  LoadingState,
  ResourceListCard,
  ResourceEmptyState,
  ModernButton,
  ModernModal,
  InfoCallout,
} from "@/shared/components/ui";
import {
  useClientMonitoring,
  type ClientMonitoringInstance,
} from "@/hooks/clientHooks/clientMonitoringHooks";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary" | "secondary";

const statusTone = (status: string | null | undefined): Tone => {
  const s = (status ?? "").toLowerCase();
  if (s === "active" || s === "healthy" || s === "running" || s === "ok") return "success";
  if (s === "pending" || s === "installing" || s === "pending_install") return "warning";
  if (s === "error" || s === "failed" || s === "unreachable") return "danger";
  return "neutral";
};

const friendlyStatus = (status: string | null | undefined): string => {
  if (!status) return "Unknown";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatRelative = (iso: string | null): string => {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const diffSec = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.round(diffSec / 60)}m ago`;
  if (diffSec < 86_400) return `${Math.round(diffSec / 3600)}h ago`;
  return `${Math.round(diffSec / 86_400)}d ago`;
};

const formatPct = (n: number | null | undefined): string =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : `${Math.round(n)}%`;

const ClientMonitoring = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useClientMonitoring();
  const [activeInstance, setActiveInstance] = useState<ClientMonitoringInstance | null>(null);
  const [copied, setCopied] = useState(false);

  const monitoredInstances = useMemo(
    () => (data?.instances ?? []).filter((i): i is ClientMonitoringInstance => i.monitoring !== null),
    [data]
  );

  const handleCopy = async (command: string | null) => {
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — silently no-op.
    }
  };

  return (
    <ClientPageShell
      title="Monitoring"
      description="Live status and metrics for the VMs you've enabled monitoring on."
      contentClassName="space-y-6"
      breadcrumbs={[{ label: "Home", href: "/client-dashboard" }, { label: "Monitoring" }]}
    >
      {isLoading ? (
        <LoadingState message="Loading your monitored VMs…" />
      ) : monitoredInstances.length === 0 ? (
        <ResourceEmptyState
          icon={<Activity size={20} />}
          title="No monitored VMs"
          message="You don't have monitoring enabled on any VMs. Enable it from your instance's settings."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {monitoredInstances.map((instance) => {
            const m = instance.monitoring!; // non-null by filter above
            const metrics = m.latest_metrics;
            const pending = m.requires_operator_install;

            const statuses = [
              { label: friendlyStatus(m.status), tone: statusTone(m.status) },
            ];
            if (pending) {
              statuses.push({ label: "Install pending", tone: "warning" as Tone });
            }

            const metadata = [
              { label: "IP Address", value: instance.ip_address || "—" },
              { label: "Last seen", value: formatRelative(m.last_seen_at) },
              { label: "CPU", value: formatPct(metrics?.cpu_pct ?? null) },
              { label: "Memory", value: formatPct(metrics?.memory_pct ?? null) },
              { label: "Disk", value: formatPct(metrics?.disk_pct ?? null) },
            ];

            type ActionVariant = "primary" | "outline";
            const actions: Array<{
              key: string;
              label: string;
              onClick: () => void;
              variant: ActionVariant;
            }> = [
              {
                key: "details",
                label: "View details",
                onClick: () =>
                  navigate(`/client-dashboard/cube-instances/details?id=${instance.id}`),
                variant: "outline",
              },
            ];
            if (pending && m.install_command) {
              actions.unshift({
                key: "install",
                label: "Show install command",
                onClick: () => setActiveInstance(instance),
                variant: "primary",
              });
            }

            return (
              <ResourceListCard
                key={String(instance.id)}
                title={instance.name}
                subtitle={`Instance #${instance.id}`}
                statuses={statuses}
                metadata={metadata}
                actions={actions}
              />
            );
          })}
        </div>
      )}

      {activeInstance && activeInstance.monitoring && (
        <ModernModal
          isOpen={!!activeInstance}
          onClose={() => {
            setActiveInstance(null);
            setCopied(false);
          }}
          title="Install monitoring agent"
          subtitle={activeInstance.name}
          size="lg"
        >
          <InfoCallout tone="warning" title="Run this on your VM as root">
            Open an SSH session to <strong>{activeInstance.ip_address || activeInstance.name}</strong>{" "}
            and paste the command below. The agent will register itself and start
            reporting metrics within a minute.
          </InfoCallout>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
                Install command
              </span>
              <ModernButton
                variant="outline"
                size="sm"
                leftIcon={copied ? <CheckCircle className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                onClick={() => handleCopy(activeInstance.monitoring?.install_command ?? null)}
              >
                {copied ? "Copied" : "Copy"}
              </ModernButton>
            </div>
            <pre
              className="overflow-x-auto rounded-lg p-4 text-xs font-mono leading-relaxed"
              style={{
                backgroundColor: "rgb(15 23 42)",
                color: "rgb(226 232 240)",
              }}
            >
              {activeInstance.monitoring.install_command ?? ""}
            </pre>
          </div>
        </ModernModal>
      )}
    </ClientPageShell>
  );
};

export default ClientMonitoring;
