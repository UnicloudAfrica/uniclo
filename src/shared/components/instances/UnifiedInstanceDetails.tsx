import React, { useState, useMemo } from "react";
import {
  Play,
  Square,
  RotateCw,
  Terminal,
  Settings,
  Activity,
  Database,
  Network,
  Shield,
  History,
  Copy,
  Globe,
  RefreshCw,
  AlertCircle,
  Trash2,
  Zap,
  Camera,
  Pause,
  Moon,
  Maximize,
  Server,
  Wallet,
  Clock,
  LayoutDashboard,
  Cpu,
  HardDrive,
  Layers,
  ChevronRight,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import {
  ModernCard,
  ModernButton,
  StatusPill,
  ModernTable,
  ModernStatsCard,
  ModernInput,
} from "../ui";
import { useInstanceDetails } from "../../hooks/useInstanceDetails";
import { useInstanceBroadcasting } from "../../../hooks/useInstanceBroadcasting";
import ToastUtils from "../../../utils/toastUtil";

// --- Types ---

interface ActionConfig {
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  disableOnStatus?: (status: string) => boolean;
  requiresConfirmation?: boolean;
}

interface Transaction {
  id?: string;
  status: string;
  description?: string;
  action?: string;
  created_at: string;
}

// NetworkAddress interface removed as it was causing unused-vars warning.
// Using inline types for network stability.

interface VolumeInfo {
  id: string;
  name?: string;
  size: number;
  device: string;
  bootable: boolean;
}

// --- Action Library (Refined Colors) ---

const ACTION_LIBRARY: Record<string, ActionConfig> = {
  start: {
    label: "Start",
    description: "Power on instance",
    icon: Play,
    color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
    disableOnStatus: (status: string) =>
      ["running", "active", "spawning"].includes((status || "").toLowerCase()),
  },
  stop: {
    label: "Stop",
    description: "Shutdown VM",
    icon: Square,
    color: "text-amber-600 bg-amber-50 hover:bg-amber-100",
    disableOnStatus: (status: string) =>
      !["running", "active"].includes((status || "").toLowerCase()),
    requiresConfirmation: true,
  },
  reboot: {
    label: "Reboot",
    description: "Restart VM",
    icon: RotateCw,
    color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
    disableOnStatus: (status: string) =>
      !["running", "active"].includes((status || "").toLowerCase()),
    requiresConfirmation: true,
  },
  suspend: {
    label: "Suspend",
    description: "Pause workloads",
    icon: Pause,
    color: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100",
    disableOnStatus: (status: string) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  hibernate: {
    label: "Hibernate",
    description: "Save state to disk",
    icon: Moon,
    color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
    disableOnStatus: (status: string) =>
      !["running", "active"].includes((status || "").toLowerCase()),
  },
  resume: {
    label: "Resume",
    description: "Wake from sleep",
    icon: Play,
    color: "text-emerald-600 bg-emerald-50 hover:bg-emerald-100",
    disableOnStatus: (status: string) =>
      !["suspended", "paused", "hibernated"].includes((status || "").toLowerCase()),
  },
  snapshot: {
    label: "Snapshot",
    description: "Create recovery point",
    icon: Camera,
    color: "text-cyan-600 bg-cyan-50 hover:bg-cyan-100",
  },
  resize: {
    label: "Resize",
    description: "Modify resources",
    icon: Maximize,
    color: "text-slate-600 bg-slate-50 hover:bg-slate-100",
  },
  destroy: {
    label: "Destroy",
    description: "Permanent deletion",
    icon: Trash2,
    color: "text-rose-600 bg-rose-50 hover:bg-rose-100",
    requiresConfirmation: true,
  },
};

// --- Helpers ---

const formatStatusText = (value: string | null | undefined) => {
  if (!value) return "N/A";
  return value
    .toString()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateTime = (value: string | number | Date | null | undefined) => {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  return parsed.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const UnifiedInstanceDetails: React.FC<{ identifier: string }> = ({ identifier }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const {
    details,
    isLoading,
    isError,
    error,
    executeAction,
    refreshStatus,
    isRefreshing,
    refetch,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useInstanceDetails(identifier) as any;

  // Real-time status updates integration
  useInstanceBroadcasting([details?.instance?.id, identifier], () => {
    refetch();
  });

  const [activeTab, setActiveTab] = useState("overview");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const instance = details?.instance;
  const status = instance?.status || "unknown";

  const handleAction = async (actionKey: string) => {
    const actionConfig = ACTION_LIBRARY[actionKey];
    if (!actionConfig) return;

    if (actionConfig.requiresConfirmation) {
      if (!globalThis.confirm(`Are you sure you want to ${actionConfig.label} this instance?`))
        return;
    }

    setPendingAction(actionKey);
    try {
      await executeAction({ action: actionKey });
      ToastUtils.success(`${actionConfig.label} initiated.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      ToastUtils.error(message || `Failed to ${actionConfig.label}`);
    } finally {
      setPendingAction(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    ToastUtils.success("Copied to clipboard");
  };

  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      time: `${i * 5}m`,
      cpu: Math.floor(Math.random() * 30) + 10,
      ram: Math.floor(Math.random() * 20) + 40,
      disk: Math.floor(Math.random() * 20) + 5,
    }));
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">Loading Instance Workspace...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto mt-20">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Sync Failed</h2>
        <p className="text-slate-500 text-sm mb-6">
          {error?.message || "Internal connection error with provider."}
        </p>
        <ModernButton onClick={() => globalThis.window.location.reload()}>
          Retry Connection
        </ModernButton>
      </div>
    );
  }

  return (
    <div className="w-full bg-transparent p-4 lg:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-hidden">
      {/* --- TOP HEADER --- */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
            <Server className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{instance?.name || identifier}</h1>
              <StatusPill status={status} />
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> {instance?.region || "Region-01"}
              </span>
              <span
                className="cursor-pointer hover:text-indigo-500 transition-colors flex items-center gap-1.5"
                onClick={() => copyToClipboard(identifier)}
              >
                <Copy className="w-3.5 h-3.5" /> {identifier}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 px-6 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <TopStat
            label="Provider Status"
            value={formatStatusText(details?.provider_details?.provider_status)}
            icon={Database}
            color="text-indigo-500"
          />
          <div className="w-px h-6 bg-slate-200" />
          <TopStat
            label="IPv4 Address"
            value={instance?.private_ip || "0.0.0.0"}
            icon={Globe}
            color="text-blue-500"
          />
        </div>
      </div>

      {/* --- ACTION TOOLBAR (Sleek) --- */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          {Object.entries(ACTION_LIBRARY).map(([key, cfg]) => {
            const isDisabled = cfg.disableOnStatus?.(status) || pendingAction !== null;
            return (
              <button
                key={key}
                disabled={isDisabled}
                onClick={() => handleAction(key)}
                title={cfg.description}
                className={`p-2.5 rounded-lg transition-all flex items-center gap-2 border border-transparent ${isDisabled ? "opacity-20 grayscale cursor-not-allowed" : cfg.color + " border-slate-100 active:scale-95 shadow-sm"}`}
              >
                {pendingAction === key ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <cfg.icon className="w-4 h-4" />
                )}
                <span className="text-[11px] font-bold uppercase tracking-wider hidden lg:inline">
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => refreshStatus()}
          disabled={isRefreshing}
          className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-slate-600"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* --- SIDEBAR NAV --- */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <NavButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={LayoutDashboard}
              label="Overview"
            />
            <NavButton
              active={activeTab === "monitoring"}
              onClick={() => setActiveTab("monitoring")}
              icon={Activity}
              label="Telemetry"
            />
            <NavButton
              active={activeTab === "networking"}
              onClick={() => setActiveTab("networking")}
              icon={Network}
              label="Networking"
            />
            <NavButton
              active={activeTab === "storage"}
              onClick={() => setActiveTab("storage")}
              icon={HardDrive}
              label="Storage"
            />
            <NavButton
              active={activeTab === "history"}
              onClick={() => setActiveTab("history")}
              icon={History}
              label="History"
            />
            <NavButton
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
              icon={Settings}
              label="Settings"
            />
          </div>

          <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100 relative overflow-hidden group">
            <Zap className="absolute -right-2 -bottom-2 w-20 h-20 text-white/10" />
            <h3 className="text-sm font-bold mb-1">Zadara Shield</h3>
            <p className="text-[11px] text-indigo-100 opacity-80 leading-snug">
              Enterprise-grade protection active for this workload.
            </p>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ModernCard title="Compute Resources">
                    <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                      <Cpu className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Resources
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <InfoBox
                        label="vCPUs"
                        value={instance?.specs?.cpu || instance?.compute?.vcpus || "1 Core"}
                      />
                      <InfoBox
                        label="Memory"
                        value={
                          instance?.specs?.ram ||
                          (instance?.compute?.ram ? `${instance.compute.ram / 1024} GiB` : "2 GiB")
                        }
                      />
                      <InfoBox
                        label="Flavor"
                        value={instance?.type || instance?.compute?.name || "Standard"}
                      />
                    </div>
                  </ModernCard>

                  <ModernCard title="Operating Environment">
                    <div className="flex items-center gap-3 mb-4 p-2 bg-slate-50/50 rounded-lg border border-slate-100">
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Environment
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <InfoBox
                        label="OS Image"
                        value={instance?.image_name || "Linux Distribution"}
                      />
                      <InfoBox
                        label="Provisioned"
                        value={formatDateTime(instance?.provisioned_at)}
                      />
                    </div>
                  </ModernCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ModernStatsCard
                    title="Uptime Days"
                    value="210"
                    icon={<Clock size={18} />}
                    color="info"
                  />
                  <ModernStatsCard
                    title="Estimated Monthly"
                    value="$12.50"
                    icon={<Wallet size={18} />}
                    color="warning"
                  />
                  <ModernStatsCard
                    title="Firewall"
                    value="Active"
                    icon={<Shield size={18} />}
                    color="success"
                  />
                </div>

                <ModernCard title="Real-time Performance (CPU %)">
                  <div className="h-[240px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="rgb(var(--theme-color-500))"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="rgb(var(--theme-color-500))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="var(--theme-surface-alt)"
                        />
                        <XAxis dataKey="time" hide />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: "var(--theme-muted-color)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(var(--theme-neutral-900) / 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cpu"
                          stroke="rgb(var(--theme-color-500))"
                          strokeWidth={2}
                          fill="url(#colorCpu)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ModernCard>
              </motion.div>
            )}

            {activeTab === "monitoring" && (
              <motion.div
                key="monitoring"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                <MonitoringChart
                  title="CPU Load"
                  data={chartData}
                  dataKey="cpu"
                  color="rgb(var(--theme-color-500))"
                />
                <MonitoringChart
                  title="Memory Usage"
                  data={chartData}
                  dataKey="ram"
                  color="rgb(var(--theme-color-500))"
                />
                <MonitoringChart
                  title="Disk Activity"
                  data={chartData}
                  dataKey="disk"
                  color="rgb(var(--theme-warning-500))"
                />
                <MonitoringChart
                  title="Network Delay"
                  data={chartData}
                  dataKey="cpu"
                  color="rgb(var(--theme-success-500))"
                />
              </motion.div>
            )}

            {activeTab === "networking" && (
              <motion.div key="networking" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ModernTable
                  title="Network Interfaces"
                  columns={[
                    {
                      header: "Interface",
                      key: "network",
                      render: ((val: string) => (
                        <span className="font-bold text-slate-800">{val}</span>
                      )) as any,
                    },
                    {
                      header: "IP Address",
                      key: "addr",
                      render: ((val: string) => (
                        <span className="font-mono text-sm text-indigo-500">{val}</span>
                      )) as any,
                    },
                    {
                      header: "Stack",
                      key: "version",
                      render: ((val: number) => (
                        <span className="text-xs text-slate-400">IPv{val}</span>
                      )) as any,
                    },
                    {
                      header: "Type",
                      key: "type",
                      render: ((val: string) => (
                        <span className="capitalize text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-500">
                          {val || "Public"}
                        </span>
                      )) as any,
                    },
                  ]}
                  data={
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (details?.network_info?.flat_addresses as any[]) || [
                      {
                        network: "primary",
                        addr: instance?.private_ip || "N/A",
                        version: 4,
                        type: "fixed",
                      },
                    ]
                  }
                />
              </motion.div>
            )}

            {activeTab === "storage" && (
              <motion.div key="storage" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ModernTable
                  title="Attached Block Volumes"
                  columns={[
                    {
                      header: "Volume ID",
                      key: "id",
                      render: ((val: string) => (
                        <span className="font-mono text-[11px] text-slate-400">{val}</span>
                      )) as any,
                    },
                    {
                      header: "Mount",
                      key: "device",
                      render: ((val: string) => (
                        <code className="bg-slate-50 px-1.5 py-0.5 border border-slate-100 rounded text-[11px] font-mono">
                          {val}
                        </code>
                      )) as any,
                    },
                    {
                      header: "Size",
                      key: "size",
                      render: ((val: number) => (
                        <span className="font-bold text-slate-800">{val} GiB</span>
                      )) as any,
                    },
                    {
                      header: "Label",
                      key: "bootable",
                      render: ((val: boolean) => (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${val ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"}`}
                        >
                          {val ? "System" : "Storage"}
                        </span>
                      )) as any,
                    },
                  ]}
                  data={(details?.security_info?.volumes as VolumeInfo[]) || []}
                />
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ModernTable
                  title="Lifecycle Events"
                  columns={[
                    {
                      header: "Activity",
                      key: "description",
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      render: ((val: string, row: any) => (
                        <div>
                          <div className="font-bold text-slate-800 text-sm">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {val || (row as any).action}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {(row as any).id || "TXN-ID"}
                          </div>
                        </div>
                      )) as any,
                    },
                    {
                      header: "Status",
                      key: "status",
                      render: ((val: string) => <StatusPill status={val} />) as any,
                    },
                    {
                      header: "Logged At",
                      key: "created_at",
                      render: ((val: string) => (
                        <span className="text-slate-400 text-xs">{formatDateTime(val)}</span>
                      )) as any,
                    },
                  ]}
                  data={(instance?.transactions as Transaction[]) || []}
                />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <ModernCard title="Identification">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        Hostname
                      </label>
                      <ModernInput value={instance?.name} disabled />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                        UUID
                      </label>
                      <div className="flex gap-2">
                        <ModernInput value={identifier} disabled className="font-mono text-xs" />
                        <button
                          onClick={() => copyToClipboard(identifier)}
                          className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                          <Copy size={16} className="text-slate-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </ModernCard>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <Lock size={16} className="text-indigo-500" />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Key Pair</div>
                      <div className="text-xs font-bold">
                        {details?.security_info?.key_pair || "Not Linked"}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Shield size={16} className="text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Security</div>
                      <div className="text-xs font-bold">Default Policy</div>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Terminal size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Access</div>
                      <div className="text-xs font-bold">Serial Console</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Components ---

const TopStat: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
}> = ({ label, value, icon: Icon, color }) => (
  <div className="flex items-center gap-3">
    <Icon className={`w-4 h-4 ${color}`} />
    <div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
        {label}
      </div>
      <div className="text-xs font-bold text-slate-800 leading-none">{value}</div>
    </div>
  </div>
);

const NavButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}
  >
    <div className="flex items-center gap-3">
      <Icon className={`w-4 h-4 ${active ? "text-indigo-500" : "text-slate-400"}`} />
      <span className="text-[13px] font-bold tracking-tight">{label}</span>
    </div>
    {active && <ChevronRight className="w-3.5 h-3.5" />}
  </button>
);

const InfoBox: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
      {label}
    </div>
    <div className="text-xs font-bold text-slate-800 truncate">{value}</div>
  </div>
);

const MonitoringChart: React.FC<{
  title: string;
  data: Array<{ time: string; [key: string]: string | number }>;
  dataKey: string;
  color: string;
}> = ({ title, data, dataKey, color }) => (
  <ModernCard title={title}>
    <div className="h-[180px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.1} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--theme-surface-alt)" />
          <XAxis dataKey="time" hide />
          <Tooltip
            contentStyle={{
              borderRadius: "10px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(var(--theme-neutral-900) / 0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            fill={`url(#grad-${dataKey})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </ModernCard>
);

export default UnifiedInstanceDetails;
