import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Loader2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  Play,
  Square,
  RotateCw,
  Pause,
  Moon,
  Terminal,
  Trash2,
  Eye,
  CheckSquare,
  Square as UncheckedSquare,
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
import AdminSidebar from "../components/adminSidebar";
import EmbeddedConsole, { useConsoleManager } from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import useAdminAuthStore from "../../stores/adminAuthStore";
import { useFetchPurchasedInstances } from "../../hooks/adminHooks/instancesHook";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import StatusPill from "../components/StatusPill";
import ModernInput from "../components/ModernInput";
import ModernStatsCard from "../components/ModernStatsCard";

// Enhanced Status Badge Component
const StatusBadge = ({ status, size = 'sm' }) => {
  const getStatusInfo = (status) => {
    const statusMap = {
      'active': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Active' },
      'running': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Running' },
      'stopped': { color: 'bg-red-100 text-red-800 border-red-200', icon: Square, label: 'Stopped' },
      'shutoff': { color: 'bg-red-100 text-red-800 border-red-200', icon: Square, label: 'Shut Off' },
      'paused': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Pause, label: 'Paused' },
      'suspended': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Pause, label: 'Suspended' },
      'hibernated': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Moon, label: 'Hibernated' },
      'reboot': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RotateCw, label: 'Rebooting' },
      'hard_reboot': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RotateCw, label: 'Rebooting' },
      'provisioning': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2, label: 'Provisioning' },
      'building': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2, label: 'Building' },
      'error': { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, label: 'Error' },
      'deleted': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Trash2, label: 'Deleted' },
    };
    
    return statusMap[status?.toLowerCase()] || { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: AlertCircle, 
      label: status || 'Unknown' 
    };
  };

  const statusInfo = getStatusInfo(status);
  const Icon = statusInfo.icon;
  const iconSize = size === 'xs' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'xs' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full ${textSize} font-medium border ${statusInfo.color}`}>
      <Icon className={`${iconSize} mr-1 ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} />
      {statusInfo.label}
    </span>
  );
};

// Instance Row Component
const InstanceRow = ({ 
  instance, 
  isSelected, 
  onSelect, 
  onAction, 
  onConsoleAccess, 
  onNavigateToDetails,
  actionLoading 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAction = (action) => {
    setShowActions(false);
    onAction(instance.id, action);
  };

  const quickActions = [
    { key: 'start', label: 'Start', icon: Play, condition: instance.status === 'stopped' },
    { key: 'stop', label: 'Stop', icon: Square, condition: instance.status === 'running' },
    { key: 'reboot', label: 'Reboot', icon: RotateCw, condition: instance.status === 'running' },
    { key: 'console', label: 'Console', icon: Terminal, condition: true },
  ];

  const availableActions = quickActions.filter(action => action.condition);

  return (
    <>
      <tr className="transition-colors hover:bg-slate-50/70">
        {/* Selection Checkbox */}
        <td className="px-5 py-4">
          <button
            onClick={() => onSelect(instance.id)}
            className="text-slate-300 transition hover:text-primary-500"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-primary-500" />
            ) : (
              <UncheckedSquare className="h-5 w-5" />
            )}
          </button>
        </td>

        {/* Expand/Collapse */}
        <td className="px-3 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-300 transition hover:text-primary-500"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>

        {/* Instance Name & ID */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="hidden rounded-lg bg-slate-100 p-2 text-slate-500 md:block">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <button
                onClick={() => onNavigateToDetails(instance.identifier)}
                className="text-sm font-semibold text-primary-600 transition hover:text-primary-700"
              >
                {instance.name || `Instance-${instance.identifier?.slice(-8)}`}
              </button>
              <p className="font-mono text-xs text-slate-400">
                {instance.identifier}
              </p>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-5 py-4">
          <StatusBadge status={instance.status} size="xs" />
        </td>

        {/* Instance Type */}
        <td className="px-5 py-4 text-sm text-slate-800">
          <div className="flex items-center">
            <Server className="mr-2 h-4 w-4 text-slate-400" />
            <span>{instance.compute?.name || 'N/A'}</span>
          </div>
        </td>

        {/* Resources */}
        <td className="px-5 py-4 text-sm text-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center">
              <Zap className="mr-1 h-3 w-3 text-primary-500" />
              <span>{instance.compute?.vcpus || 0} vCPU</span>
            </div>
            <div className="flex items-center">
              <HardDrive className="mr-1 h-3 w-3 text-emerald-500" />
              <span>
                {instance.compute?.memory_mb
                  ? Math.round(instance.compute.memory_mb / 1024)
                  : 0}{" "}
                GB
              </span>
            </div>
          </div>
        </td>

        {/* IP Address */}
        <td className="px-5 py-4 text-sm text-slate-800">
          <div className="flex items-center">
            <Network className="mr-2 h-4 w-4 text-slate-400" />
            <span>
              {instance.floating_ip?.ip_address || instance.private_ip || 'N/A'}
            </span>
            {(instance.floating_ip?.ip_address || instance.private_ip) && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(instance.floating_ip?.ip_address || instance.private_ip);
                  ToastUtils.success('IP copied to clipboard');
                }}
                className="ml-2 rounded-full p-1 text-slate-300 transition hover:bg-slate-100 hover:text-primary-500"
              >
                <Copy className="h-3 w-3" />
              </button>
            )}
          </div>
        </td>

        {/* Created */}
        <td className="px-5 py-4 text-sm text-slate-500">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-slate-300" />
            {instance.created_at ? new Date(instance.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </td>

        {/* Quick Actions */}
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            {availableActions.slice(0, 3).map(action => (
              <button
                key={action.key}
                onClick={() => {
                  if (action.key === 'console') {
                    onConsoleAccess(instance.id);
                  } else {
                    handleAction(action.key);
                  }
                }}
                disabled={actionLoading[instance.id]?.[action.key]}
                className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-primary-200 hover:text-primary-500 disabled:cursor-not-allowed disabled:opacity-40"
                title={action.label}
              >
                {actionLoading[instance.id]?.[action.key] ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <action.icon className="h-4 w-4" />
                )}
              </button>
            ))}

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="rounded-full border border-slate-200 p-1.5 text-slate-400 transition hover:border-primary-200 hover:text-primary-500"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                  <div className="space-y-1 text-sm text-slate-600">
                    <button
                      onClick={() => onNavigateToDetails(instance.identifier)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                    >
                      <Eye className="h-4 w-4 text-primary-500" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleAction('suspend')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                    >
                      <Pause className="h-4 w-4 text-amber-500" />
                      Suspend
                    </button>
                    <button
                      onClick={() => handleAction('hibernate')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-50"
                    >
                      <Moon className="h-4 w-4 text-violet-500" />
                      Hibernate
                    </button>
                    <div className="h-px bg-slate-100" />
                    <button
                      onClick={() => handleAction('destroy')}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Destroy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </td>
      </tr>

      {/* Expanded Row Details */}
      {expanded && (
        <tr className="bg-slate-50/60">
          <td colSpan="9" className="px-5 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800">
                  Instance details
                </h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Region:</dt>
                    <dd className="text-xs text-slate-800">{instance.region || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Provider:</dt>
                    <dd className="text-xs text-slate-800">{instance.provider || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">OS image:</dt>
                    <dd className="text-xs text-slate-800">{instance.os_image?.name || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800">Network</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Private IP:</dt>
                    <dd className="text-xs text-slate-800">{instance.private_ip || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Floating IP:</dt>
                    <dd className="text-xs text-slate-800">{instance.floating_ip?.ip_address || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Security group:</dt>
                    <dd className="text-xs text-slate-800">{instance.security_group || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-800">Storage</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Storage size:</dt>
                    <dd className="text-xs text-slate-800">{instance.storage_size_gb || 'N/A'} GB</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Volume type:</dt>
                    <dd className="text-xs text-slate-800">{instance.volume_type?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-slate-500">Boot from:</dt>
                    <dd className="text-xs text-slate-800">{instance.boot_from_volume ? 'Volume' : 'Image'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// Main Component
export default function AdminInstances() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    isFetching: isInstancesFetching,
    data: instancesResponse,
    refetch,
  } = useFetchPurchasedInstances();

  const emptyInstances = useMemo(() => [], []);
  const instances = instancesResponse?.data || emptyInstances;
  const [filteredInstances, setFilteredInstances] = useState([]);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort instances
  useEffect(() => {
    let filtered = [...instances];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(instance =>
        (instance.name && instance.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (instance.identifier && instance.identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (instance.floating_ip?.ip_address && instance.floating_ip.ip_address.includes(searchTerm)) ||
        (instance.private_ip && instance.private_ip.includes(searchTerm))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(instance => instance.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInstances(filtered);
  }, [instances, searchTerm, statusFilter, sortBy, sortOrder]);

  const { consoles, openConsole, closeConsole } = useConsoleManager();



  // Handle instance selection
  const handleInstanceSelect = (instanceId) => {
    const newSelected = new Set(selectedInstances);
    if (newSelected.has(instanceId)) {
      newSelected.delete(instanceId);
    } else {
      newSelected.add(instanceId);
    }
    setSelectedInstances(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedInstances.size === filteredInstances.length) {
      setSelectedInstances(new Set());
    } else {
      setSelectedInstances(new Set(filteredInstances.map(i => i.id)));
    }
  };

  // Execute instance action - REMOVED: Instance management endpoints no longer available
  const executeInstanceAction = async (instanceId, action) => {
    ToastUtils.warning(`Instance actions (${action}) have been removed. Please use the instance details page for basic operations.`);
  };

  // Handle bulk actions - REMOVED: Bulk action endpoints no longer available
  const executeBulkAction = async (action) => {
    if (selectedInstances.size === 0) {
      ToastUtils.warning('Please select instances first');
      return;
    }

    ToastUtils.warning(`Bulk actions (${action}) have been removed. Please manage instances individually.`);
    setSelectedInstances(new Set()); // Clear selection
  };

  // Navigate to instance details
  const navigateToInstanceDetails = (instanceId) => {
    const identifier = instanceId; // instanceId variable here holds the id passed; prefer using instance.identifier below.
    // Navigate to standard instance details page
    window.location.href = `/admin-dashboard/instances/details?identifier=${encodeURIComponent(instanceId)}`;
  };

  // Handle console access
  const handleConsoleAccess = (instanceId) => {
    openConsole(instanceId);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const uniqueStatuses = [...new Set(instances.map(i => i.status))].filter(Boolean);
  const totalInstancesCount = instances.length;
  const runningCount = instances.filter(
    (i) => ["running", "active"].includes((i.status || "").toLowerCase())
  ).length;
  const stoppedCount = instances.filter(
    (i) => ["stopped", "shutoff", "paused", "suspended"].includes(
      (i.status || "").toLowerCase()
    )
  ).length;
  const provisioningCount = instances.filter((i) =>
    ["provisioning", "building", "reboot", "hard_reboot"].includes(
      (i.status || "").toLowerCase()
    )
  ).length;
  const statusBreakdown = uniqueStatuses
    .map((status) => ({
      status,
      count: instances.filter((i) => i.status === status).length,
    }))
    .sort((a, b) => b.count - a.count);
  const recentInstances = instances
    .slice()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4);
  const actionLoading = useMemo(() => ({}), []);
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
      description: provisioningCount
        ? `${provisioningCount} provisioning`
        : "All healthy",
      icon: <Play size={24} />,
      color: "success",
    },
    {
      key: "idle",
      title: "Idle / Stopped",
      value: stoppedCount.toLocaleString(),
      description:
        stoppedCount > 0
          ? `${Math.round(
              (stoppedCount / Math.max(totalInstancesCount, 1)) * 100
            )}% of fleet`
          : "No idle instances",
      icon: <Square size={24} />,
      color: "warning",
    },
    {
      key: "bandwidth",
      title: "Bandwidth Ready",
      value: instances
        .filter((i) => Number(i.bandwidth_count || 0) > 0)
        .length.toLocaleString(),
      description: "Floating IP or dedicated bandwidth attached",
      icon: <Network size={24} />,
      color: "info",
    },
  ];
  const selectedInstanceList = filteredInstances.filter((instance) =>
    selectedInstances.has(instance.id)
  );

  const headerActions = (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <ModernButton
        variant="ghost"
        size="sm"
        onClick={() => refetch()}
        isDisabled={isInstancesFetching}
        leftIcon={
          <RefreshCw className={`h-4 w-4 ${isInstancesFetching ? "animate-spin" : ""}`} />
        }
      >
        Refresh
      </ModernButton>
      <ModernButton
        variant="primary"
        size="sm"
        onClick={() =>
          (window.location.href = "/admin-dashboard/create-instance")
        }
        leftIcon={<Plus className="h-4 w-4" />}
      >
        New Instance
      </ModernButton>
    </div>
  );

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />

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
                  Stay responsive with live health indicators, instant lifecycle actions, and deep visibility
                  into utilisation across your entire compute fleet.
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
                  {provisioningCount
                    ? `${provisioningCount} in flight`
                    : "No builds running"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {fleetStats.map((stat) => (
            <ModernStatsCard
              key={stat.key}
              title={stat.title}
              value={stat.value}
              description={stat.description}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] 2xl:items-start">
          <ModernCard padding="lg" className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="w-full max-w-xl">
                <ModernInput
                  label="Search fleet"
                  placeholder="Search by name, identifier, or IP"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="all">All</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Sort by
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-36 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="created_at">Created date</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-500">
                    Direction
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </div>
                <ModernButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters((prev) => !prev)}
                  leftIcon={<Filter className="h-4 w-4" />}
                >
                  {showFilters ? "Hide filters" : "More filters"}
                </ModernButton>
              </div>
            </div>

            {showFilters && (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">
                    Quick status focus
                  </p>
                  <ModernButton
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setStatusFilter("all");
                      setSearchTerm("");
                    }}
                  >
                    Reset filters
                  </ModernButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusBreakdown.slice(0, 6).map((item) => (
                    <button
                      key={item.status}
                      type="button"
                      onClick={() => setStatusFilter(item.status)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        statusFilter === item.status
                          ? "border-primary-400 bg-primary-50 text-primary-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
                      }`}
                    >
                      {item.status} • {item.count}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Use advanced filters to target lifecycle states quickly and keep medium-sized screens clutter free.
                </p>
              </div>
            )}

            {selectedInstanceList.length > 0 && (
              <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50/60 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <StatusPill
                    label={`${selectedInstanceList.length} selected`}
                    tone="info"
                  />
                  <p className="text-sm font-medium text-primary-700">
                    Choose a bulk action to apply across the highlighted instances.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { action: "start", label: "Start", icon: Play },
                    { action: "stop", label: "Stop", icon: Square },
                    { action: "reboot", label: "Reboot", icon: RotateCw },
                    { action: "destroy", label: "Destroy", icon: Trash2 },
                  ].map(({ action, label, icon: Icon }) => (
                    <ModernButton
                      key={action}
                      variant={action === "destroy" ? "danger" : "outline"}
                      size="sm"
                      onClick={() => executeBulkAction(action)}
                      leftIcon={<Icon className="h-4 w-4" />}
                    >
                      {label}
                    </ModernButton>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-100 shadow-sm">
              {isInstancesFetching ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  <p className="text-sm text-slate-500">
                    Pulling latest instance telemetry…
                  </p>
                </div>
              ) : filteredInstances.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <Server className="h-10 w-10 text-slate-400" />
                  <p className="text-base font-semibold text-slate-700">
                    No instances match the current view
                  </p>
                  <p className="text-sm text-slate-500">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "Spin up a new instance to see it appear instantly."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 text-left">
                          <button
                            onClick={handleSelectAll}
                            className="text-slate-400 hover:text-primary-500"
                          >
                            {selectedInstances.size === filteredInstances.length &&
                            filteredInstances.length > 0 ? (
                              <CheckSquare className="h-5 w-5 text-primary-500" />
                            ) : (
                              <UncheckedSquare className="h-5 w-5" />
                            )}
                          </button>
                        </th>
                        <th className="px-3 py-3" />
                        <th className="px-5 py-3 text-left">Instance</th>
                        <th className="px-5 py-3 text-left">Status</th>
                        <th className="px-5 py-3 text-left">Type</th>
                        <th className="px-5 py-3 text-left">Resources</th>
                        <th className="px-5 py-3 text-left">IP</th>
                        <th className="px-5 py-3 text-left">Created</th>
                        <th className="px-5 py-3 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                      {filteredInstances.map((instance) => (
                        <InstanceRow
                          key={instance.id}
                          instance={instance}
                          isSelected={selectedInstances.has(instance.id)}
                          onSelect={handleInstanceSelect}
                          onAction={executeInstanceAction}
                          onConsoleAccess={handleConsoleAccess}
                          onNavigateToDetails={(identifier) =>
                            navigateToInstanceDetails(identifier)
                          }
                          actionLoading={actionLoading}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </ModernCard>

          <div className="space-y-6">
            <ModernCard padding="lg" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Fleet breakdown
                </h3>
                <StatusPill
                  label={`${totalInstancesCount} total`}
                  tone="neutral"
                />
              </div>
              <div className="space-y-3">
                {statusBreakdown.slice(0, 6).map((item) => {
                  const percentage = totalInstancesCount
                    ? Math.round((item.count / totalInstancesCount) * 100)
                    : 0;
                  return (
                    <div key={item.status} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {item.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.count} • {percentage}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-primary-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ModernCard>

            {recentInstances.length > 0 && (
              <ModernCard padding="lg" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Recent activity
                  </h3>
                  <StatusPill
                    label="Last 4 events"
                    tone="info"
                  />
                </div>
                <ul className="space-y-3 text-sm">
                  {recentInstances.map((instance) => (
                    <li
                      key={instance.id}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-slate-400" />
                          <span className="font-semibold text-slate-800">
                            {instance.name ||
                              `Instance-${instance.identifier?.slice(-6)}`}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {instance.created_at
                            ? new Date(instance.created_at).toLocaleString()
                            : "Unknown"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {instance.region || "Any region"} • {instance.status}
                      </p>
                    </li>
                  ))}
                </ul>
              </ModernCard>
            )}

            <ModernCard padding="lg" className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Smart shortcuts
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <button
                  type="button"
                  onClick={() =>
                    (window.location.href =
                      "/admin-dashboard/create-instance")
                  }
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-primary-200 hover:bg-primary-50"
                >
                  <span>Launch instance creation</span>
                  <ChevronRight className="h-4 w-4 text-primary-500" />
                </button>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-primary-200 hover:bg-primary-50"
                >
                  <span>Force refresh metrics</span>
                  <RotateCw className="h-4 w-4 text-primary-500" />
                </button>
                <p className="text-xs text-slate-500">
                  Need deeper visibility? Export instance metadata or jump into a console session directly from the actions column.
                </p>
              </div>
            </ModernCard>
          </div>
        </div>

        {consoles.map((console) => (
          <EmbeddedConsole
            key={console.id}
            instanceId={console.instanceId}
            isVisible
            onClose={() => closeConsole(console.instanceId)}
            initialPosition={console.position}
            initialSize={console.size}
          />
        ))}
      </AdminPageShell>
    </>
  );
}
