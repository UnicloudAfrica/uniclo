import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  MoreHorizontal,
  Pause,
  Play,
  Power,
  RotateCw,
  Terminal,
  Pencil,
  Maximize,
  Camera,
  Trash2,
  RefreshCw,
  Moon,
  ZapOff,
  Move,
  Globe,
} from "lucide-react";
import StatusPill from "@/shared/components/ui/StatusPill";

import { formatStatusText, getStatusTone } from "./instanceDetailsUtils";

interface InstanceHeaderProps {
  // Identity
  name: string | undefined;
  identifier: string | undefined;
  status: string | undefined;
  provider: string | undefined;

  // Info section
  instanceType: string | undefined;
  availabilityZone: string | undefined;
  providerVmId: string | undefined;
  projectName: string | undefined;

  // Subnets / IP
  primaryIp: string | undefined;
  elasticIp: string | undefined;
  subnetName: string | undefined;

  // Activity
  cpuUsage: string | null;
  memoryUsage: string | null;
  networkRx: string | null;
  networkTx: string | null;

  // Resources
  vcpus: number;
  memoryGb: number;
  storageGb: number;

  // Tags
  tags: string[];

  // Actions
  availableActions: Record<string, unknown>;
  supportsInstanceActions: boolean;
  pendingAction: string | null;
  isConsoleLoading: boolean;

  // Handlers
  onGoBack: () => void;
  onAction: (action: string) => void;
  onOpenConsole: () => void;
  onRefreshStatus: () => void;
  onCopyIdentifier: () => void;
}

const ACTION_BUTTONS = [
  { key: "start", label: "Start", icon: Play },
  { key: "stop", label: "Stop", icon: Power },
  { key: "reboot", label: "Reboot", icon: RotateCw },
  { key: "console", label: "Connect", icon: Terminal },
  { key: "resize", label: "Modify", icon: Pencil },
  { key: "extend", label: "Extend", icon: Maximize },
];

const MORE_ACTIONS = [
  { key: "force_stop", label: "Force Stop", icon: ZapOff },
  { key: "guest_reboot", label: "Guest Reboot (ACPI)", icon: RotateCw },
  { key: "suspend", label: "Suspend", icon: Pause },
  { key: "hibernate", label: "Hibernate", icon: Moon },
  { key: "resume", label: "Resume", icon: Play },
  { key: "migrate", label: "Live Migration", icon: Move },
  { key: "snapshot", label: "Snapshot", icon: Camera },
  { key: "attach_elastic_ip", label: "Attach Elastic IP", icon: Globe },
  { key: "sync_provisioning", label: "Sync Provisioning", icon: RefreshCw },
  { key: "retry_provisioning", label: "Retry Provisioning", icon: RotateCw },
  { key: "destroy", label: "Destroy", icon: Trash2 },
];

const InstanceHeroBanner: React.FC<InstanceHeaderProps> = ({
  _name,
  identifier,
  status,
  _provider,
  instanceType,
  availabilityZone,
  providerVmId,
  projectName,
  primaryIp,
  elasticIp,
  subnetName,
  cpuUsage,
  memoryUsage,
  networkRx,
  networkTx,
  vcpus,
  memoryGb,
  storageGb,
  tags,
  availableActions,
  supportsInstanceActions,
  pendingAction,
  isConsoleLoading,
  onGoBack,
  onAction,
  onOpenConsole,
  onRefreshStatus,
  onCopyIdentifier,
}) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const normalizedStatus = (status || "").toLowerCase();

  // Status-aware disable rules: disable actions that don't make sense for current state
  const isDisabledByStatus = (key: string): boolean => {
    const runningStates = ["running", "active"];
    const _stoppedStates = ["stopped", "shutoff", "shutdown"];
    switch (key) {
      case "start":
      case "resume":
        return runningStates.includes(normalizedStatus) || normalizedStatus === "spawning";
      case "stop":
      case "force_stop":
      case "reboot":
      case "guest_reboot":
      case "suspend":
      case "hibernate":
        return !runningStates.includes(normalizedStatus);
      default:
        return false;
    }
  };

  const isActionAvailable = (key: string) => {
    if (key === "console") return true;
    if (key === "refresh") return true;
    // Platform-level actions always available (don't depend on provider)
    if (key === "attach_elastic_ip" || key === "sync_provisioning" || key === "retry_provisioning") {
      return !isDisabledByStatus(key);
    }
    if (!supportsInstanceActions) return false;
    if (isDisabledByStatus(key)) return false;
    return !!availableActions[key];
  };

  const handleActionClick = (key: string) => {
    if (key === "console") {
      onOpenConsole();
    } else if (key === "refresh") {
      onRefreshStatus();
    } else {
      onAction(key);
    }
  };

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Action Toolbar */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-4 py-2">
        <button
          onClick={onGoBack}
          className="mr-2 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          title="Back to Instances"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-1 border-r border-slate-300 pr-3">
          {ACTION_BUTTONS.map(({ key, label, icon: Icon }) => {
            const available = isActionAvailable(key);
            const isPending = pendingAction === key || (key === "console" && isConsoleLoading);
            return (
              <button
                key={key}
                onClick={() => handleActionClick(key)}
                disabled={!available || !!isPending}
                className={`flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs transition ${
                  available && !isPending
                    ? "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                    : "cursor-not-allowed text-slate-300"
                }`}
                title={label}
              >
                <Icon className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
        </div>

        {/* More dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex flex-col items-center gap-0.5 rounded-md px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="text-[10px] font-medium">More</span>
          </button>
          {showMoreMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMoreMenu(false)} />
              <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {MORE_ACTIONS.map(({ key, label, icon: Icon }) => {
                  const available = isActionAvailable(key);
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        if (available) handleActionClick(key);
                        setShowMoreMenu(false);
                      }}
                      disabled={!available}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                        available
                          ? key === "destroy"
                            ? "text-red-600 hover:bg-red-50"
                            : "text-slate-700 hover:bg-slate-50"
                          : "cursor-not-allowed text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Refresh button on the right */}
        <div className="ml-auto">
          <button
            onClick={onRefreshStatus}
            disabled={pendingAction === "refresh"}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
            title="Refresh Status"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pendingAction === "refresh" ? "animate-spin" : ""}`} />
            <span className="font-medium">Sync</span>
          </button>
        </div>
      </div>

      {/* Info Strip — 4 columns like Zadara */}
      <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-4">
        {/* Col 1: Info */}
        <div className="bg-white px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Info</span>
            {status && (
              <StatusPill label={formatStatusText(status)} tone={getStatusTone(status)} />
            )}
          </div>
          <dl className="space-y-1.5 text-sm">
            {instanceType && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Instance Type</dt>
                <dd className="font-medium text-slate-900">{instanceType}</dd>
              </div>
            )}
            {availabilityZone && (
              <div className="flex justify-between">
                <dt className="text-slate-500">AZ</dt>
                <dd className="font-medium text-slate-900">{availabilityZone}</dd>
              </div>
            )}
            {projectName && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Project</dt>
                <dd className="font-medium text-slate-900">{projectName}</dd>
              </div>
            )}
            {identifier && (
              <div className="flex items-center justify-between gap-2">
                <dt className="text-slate-500">ID</dt>
                <dd className="flex items-center gap-1 font-mono text-xs text-slate-700">
                  <span className="max-w-[160px] truncate">{providerVmId || identifier}</span>
                  <button
                    onClick={onCopyIdentifier}
                    className="rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                    title="Copy ID"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Col 2: Subnets */}
        <div className="bg-white px-5 py-4">
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Subnets</span>
          </div>
          {primaryIp ? (
            <div className="space-y-2">
              {elasticIp && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2.5 py-1 font-mono text-sm text-green-800">
                    {elasticIp}
                    <button
                      onClick={() => navigator.clipboard.writeText(elasticIp)}
                      className="rounded p-0.5 text-green-500 transition hover:text-green-700"
                      title="Copy Elastic IP"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {subnetName && (
                  <span className="text-sm text-blue-600 hover:underline">{subnetName}</span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 font-mono text-sm text-slate-800">
                  {primaryIp}
                  <button
                    onClick={() => navigator.clipboard.writeText(primaryIp)}
                    className="rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                    title="Copy IP"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No subnets attached</p>
          )}
        </div>

        {/* Col 3: Activity */}
        <div className="bg-white px-5 py-4">
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Activity</span>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <dt className="w-16 text-slate-500">CPU</dt>
              <dd className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Usage</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: cpuUsage ? `${parseFloat(cpuUsage)}%` : "0%" }}
                  />
                </div>
                <span className="font-medium text-slate-800">{cpuUsage || "—"}</span>
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="w-16 text-slate-500">Memory</dt>
              <dd className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Usage</span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all"
                    style={{ width: memoryUsage ? `${Math.min(parseFloat(memoryUsage) || 0, 100)}%` : "0%" }}
                  />
                </div>
                <span className="font-medium text-slate-800">{memoryUsage || "—"}</span>
              </dd>
            </div>
            <div className="flex items-center gap-3">
              <dt className="w-16 text-slate-500">Network</dt>
              <dd className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Rx</span>
                <span className="font-medium text-slate-800">{networkRx || "0 kb/s"}</span>
                <span className="text-slate-400">Tx</span>
                <span className="font-medium text-slate-800">{networkTx || "0 kb/s"}</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Col 4: Resources */}
        <div className="bg-white px-5 py-4">
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resources</span>
          </div>
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">CPU</dt>
              <dd className="font-medium text-slate-900">{vcpus > 0 ? `${vcpus} VCores` : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Disk</dt>
              <dd className="font-medium text-slate-900">{storageGb > 0 ? `${storageGb} GiB` : "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">RAM</dt>
              <dd className="font-medium text-slate-900">{memoryGb > 0 ? `${memoryGb} GiB` : "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Tags row */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-2.5">
          <span className="text-xs font-semibold text-slate-500">Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
              >
                {tag}
                <button className="text-slate-400 hover:text-slate-600">&times;</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceHeroBanner;
