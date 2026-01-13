// @ts-nocheck
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Play,
  Square,
  RotateCw,
  Pause,
  Moon,
  Terminal,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  HardDrive,
  Network,
  Copy,
  Sparkles,
  Zap,
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
// @ts-ignore
import { useConsoleManager } from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import { useFetchPurchasedInstances } from "../../hooks/adminHooks/instancesHook";
import AdminPageShell from "../components/AdminPageShell";
import { ModernCard } from "../../shared/components/ui";
import { ModernButton } from "../../shared/components/ui";
import ModernStatsCard from "../../shared/components/ui/ModernStatsCard";
import ModernTable from "../../shared/components/ui/ModernTable";

// Enhanced Status Badge Component
const StatusBadge = ({ status, size = "sm" }: { status: string; size?: "xs" | "sm" }) => {
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, any> = {
      active: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Active",
      },
      running: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
        label: "Running",
      },
      stopped: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: Square,
        label: "Stopped",
      },
      shutoff: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: Square,
        label: "Shut Off",
      },
      paused: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Pause,
        label: "Paused",
      },
      suspended: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: Pause,
        label: "Suspended",
      },
      hibernated: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Moon,
        label: "Hibernated",
      },
      reboot: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: RotateCw,
        label: "Rebooting",
      },
      hard_reboot: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: RotateCw,
        label: "Rebooting",
      },
      provisioning: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Loader2,
        label: "Provisioning",
      },
      building: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Loader2,
        label: "Building",
      },
      error: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: AlertCircle,
        label: "Error",
      },
      deleted: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Trash2,
        label: "Deleted",
      },
    };
    return (
      statusMap[status?.toLowerCase()] || {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: AlertCircle,
        label: status || "Unknown",
      }
    );
  };
  const statusInfo = getStatusInfo(status);
  const Icon = statusInfo.icon;
  const iconSize = size === "xs" ? "w-3 h-3" : "w-4 h-4";
  const textSize = size === "xs" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full ${textSize} font-medium border ${statusInfo.color}`}
    >
      <Icon className={`${iconSize} mr-1 ${statusInfo.icon === Loader2 ? "animate-spin" : ""}`} />
      {statusInfo.label}
    </span>
  );
};

export default function AdminInstances() {
  const navigate = useNavigate();
  const {
    isFetching: isInstancesFetching,
    data: instancesResponse,
    refetch,
  } = useFetchPurchasedInstances();

  const emptyInstances = useMemo(() => [], []);
  const instances = instancesResponse?.data || emptyInstances;
  const { consoles, openConsole } = useConsoleManager();

  // Execute instance action - REMOVED: Instance management endpoints no longer available
  const executeInstanceAction = async (instanceId: string, action: string) => {
    ToastUtils.warning(
      `Instance actions (${action}) have been removed. Please use the instance details page for basic operations.`
    );
  };

  // Handle bulk actions - REMOVED: Bulk action endpoints no longer available
  const executeBulkAction = async (action: string) => {
    ToastUtils.warning(
      `Bulk actions (${action}) have been removed. Please manage instances individually.`
    );
  };

  // Navigate to instance details
  const navigateToInstanceDetails = (instanceId: string) => {
    navigate(
      `/admin-dashboard/instances/details?identifier=${encodeURIComponent(instanceId)}`
    );
  };

  // Handle console access
  const handleConsoleAccess = (instanceId: string) => {
    openConsole(instanceId);
  };

  const totalInstancesCount = instances.length;
  const runningCount = instances.filter((i: any) =>
    ["running", "active"].includes((i.status || "").toLowerCase())
  ).length;
  const stoppedCount = instances.filter((i: any) =>
    ["stopped", "shutoff", "paused", "suspended"].includes((i.status || "").toLowerCase())
  ).length;
  const provisioningCount = instances.filter((i: any) =>
    ["provisioning", "building", "reboot", "hard_reboot"].includes((i.status || "").toLowerCase())
  ).length;

  const fleetStats = [
    {
      key: "total",
      title: "Total Instances",
      value: totalInstancesCount.toLocaleString(),
      description: `${runningCount} running`,
      icon: <Server size={24} />,
      color: "info",
    },
    {
      key: "running",
      title: "Active",
      value: runningCount.toLocaleString(),
      description: provisioningCount ? `${provisioningCount} provisioning` : "All healthy",
      icon: <Play size={24} />,
      color: "success",
    },
    {
      key: "idle",
      title: "Idle / Stopped",
      value: stoppedCount.toLocaleString(),
      description:
        stoppedCount > 0
          ? `${Math.round((stoppedCount / Math.max(totalInstancesCount, 1)) * 100)}% of fleet`
          : "No idle instances",
      icon: <Square size={24} />,
      color: "warning",
    },
    {
      key: "bandwidth",
      title: "Bandwidth Ready",
      value: instances
        .filter((i: any) => Number(i.bandwidth_count || 0) > 0)
        .length.toLocaleString(),
      description: "Floating IP or dedicated bandwidth attached",
      icon: <Network size={24} />,
      color: "info",
    },
  ];

  const headerActions = (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        isDisabled={isInstancesFetching}
        leftIcon={<RefreshCw className={`h-4 w-4 ${isInstancesFetching ? "animate-spin" : ""}`} />}
      >
        Refresh
      </ModernButton>
      <ModernButton
        variant="primary"
        size="sm"
        onClick={() => navigate("/admin-dashboard/create-instance")}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        New Instance
      </ModernButton>
    </div>
  );

  const columns = [
    {
      key: "name",
      header: "Instance",
      sortable: true,
      render: (_: any, instance: any) => (
        <div className="flex items-center gap-3">
          <div className="hidden rounded-lg bg-slate-100 p-2 text-slate-500 md:block">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <button
              onClick={() => navigateToInstanceDetails(instance.identifier)}
              className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
            >
              {instance.name || `Instance-${instance.identifier?.slice(-8)}`}
            </button>
            <p className="font-mono text-xs text-slate-400">{instance.identifier}</p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: string) => <StatusBadge status={value} size="xs" />,
    },
    {
      key: "compute",
      header: "Type",
      sortable: true,
      render: (compute: any) => (
        <div className="flex items-center text-sm text-slate-800">
          <Server className="mr-2 h-4 w-4 text-slate-400" />
          <span>{compute?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "resources",
      header: "Resources",
      render: (_: any, instance: any) => (
        <div className="space-y-1.5 text-sm text-slate-800">
          <div className="flex items-center">
            <Zap className="mr-1 h-3 w-3 text-blue-500" />
            <span>{instance.compute?.vcpus || 0} vCPU</span>
          </div>
          <div className="flex items-center">
            <HardDrive className="mr-1 h-3 w-3 text-emerald-500" />
            <span>
              {instance.compute?.memory_mb ? Math.round(instance.compute.memory_mb / 1024) : 0} GB
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "ip_address",
      header: "IP Address",
      render: (_: any, instance: any) => (
        <div className="flex items-center text-sm text-slate-800">
          <Network className="mr-2 h-4 w-4 text-slate-400" />
          <span>{instance.floating_ip?.ip_address || instance.private_ip || "N/A"}</span>
          {(instance.floating_ip?.ip_address || instance.private_ip) && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  instance.floating_ip?.ip_address || instance.private_ip
                );
                ToastUtils.success("IP copied to clipboard");
              }}
              className="ml-2 rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-blue-500"
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Created",
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center text-sm text-slate-500">
          <Clock className="mr-2 h-4 w-4 text-slate-300" />
          {value ? new Date(value).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (_: any, instance: any) => {
        const quickActions = [
          {
            key: "start",
            label: "Start",
            icon: Play,
            condition: instance.status === "stopped",
          },
          {
            key: "stop",
            label: "Stop",
            icon: Square,
            condition: instance.status === "running",
          },
          {
            key: "reboot",
            label: "Reboot",
            icon: RotateCw,
            condition: instance.status === "running",
          },
          { key: "console", label: "Console", icon: Terminal, condition: true },
        ];
        const availableActions = quickActions.filter((action: any) => action.condition);

        return (
          <div className="flex items-center gap-2">
            {availableActions.slice(0, 3).map((action: any) => (
              <button
                key={action.key}
                onClick={() => {
                  if (action.key === "console") {
                    handleConsoleAccess(instance.id);
                  } else {
                    executeInstanceAction(instance.id, action.key);
                  }
                }}
                className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-blue-200 hover:text-blue-500"
                title={action.label}
              >
                <action.icon className="h-4 w-4" />
              </button>
            ))}
            <div className="relative group">
              <button className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-blue-200 hover:text-blue-500">
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <div className="absolute right-0 mt-2 w-48 hidden group-hover:block z-10 rounded-xl border border-slate-100 bg-white p-2 shadow-xl">
                <div className="space-y-1 text-sm text-slate-600">
                  <button
                    onClick={() => navigateToInstanceDetails(instance.identifier)}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
                    View Details
                  </button>
                  <button
                    onClick={() => executeInstanceAction(instance.id, "suspend")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-slate-50"
                  >
                    <Pause className="h-4 w-4 text-amber-500" />
                    Suspend
                  </button>
                  <button
                    onClick={() => executeInstanceAction(instance.id, "hibernate")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 transition hover:bg-slate-50"
                  >
                    <Moon className="h-4 w-4 text-violet-500" />
                    Hibernate
                  </button>
                  <div className="h-px bg-slate-100" />
                  <button
                    onClick={() => executeInstanceAction(instance.id, "destroy")}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Destroy
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  const bulkActions = [
    { label: "Start", onClick: () => executeBulkAction("start"), icon: <Play size={14} /> },
    { label: "Stop", onClick: () => executeBulkAction("stop"), icon: <Square size={14} /> },
    { label: "Reboot", onClick: () => executeBulkAction("reboot"), icon: <RotateCw size={14} /> },
    {
      label: "Destroy",
      onClick: () => executeBulkAction("destroy"),
      icon: <Trash2 size={14} />,
      variant: "danger" as const,
    },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />

      <AdminPageShell
        title="Instance Management"
        description="Manage and monitor your cloud instances"
        actions={headerActions}
        contentClassName="space-y-6 lg:space-y-8"
      >
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1D4ED8] text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_55%)]" />
          <div className="relative flex flex-col gap-8 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                <Sparkles size={14} />
                Fleet Control
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Orchestrate every workload with confidence
                </h2>
                <p className="max-w-2xl text-sm text-white/80 sm:text-base">
                  Stay responsive with live health indicators, instant lifecycle actions, and deep
                  visibility into utilisation across your entire compute fleet.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Live consoles
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {consoles.length
                    ? `${consoles.length} session${consoles.length === 1 ? "" : "s"} active`
                    : "Ready for on-demand access"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/40 bg-white/15 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  Provisioning Pulse
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  {provisioningCount ? `${provisioningCount} in flight` : "No builds running"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fleetStats.map((stat: any) => (
            <ModernStatsCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              color={stat.color as any}
            />
          ))}
        </div>

        <ModernTable
          data={instances}
          columns={columns as any}
          title="Instances Fleet"
          searchable
          searchKeys={["name", "identifier", "floating_ip.ip_address", "private_ip"]}
          selectable
          bulkActions={bulkActions}
          loading={isInstancesFetching}
          emptyMessage="No instances match the current view"
        />
      </AdminPageShell>
    </>
  );
}
