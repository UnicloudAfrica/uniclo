// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  ChevronDown,
  Play,
  Square,
  RotateCw,
  Pause,
  Moon,
  Terminal,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Server,
  HardDrive,
  Network,
  Copy,
  Zap,
  AlertCircle,
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/AdminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import EmbeddedConsole, { useConsoleManager } from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";
import AdminPageShell from "../components/AdminPageShell.tsx";
import ModernTable from "../../shared/components/ui/ModernTable";

// Enhanced Status Badge Component
const StatusBadge = ({ status, size = "sm" }: any) => {
  const getStatusInfo = (status: any) => {
    const statusMap = {
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
      stopped: { color: "bg-red-100 text-red-800 border-red-200", icon: Square, label: "Stopped" },
      shutoff: { color: "bg-red-100 text-red-800 border-red-200", icon: Square, label: "Shut Off" },
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
      error: { color: "bg-red-100 text-red-800 border-red-200", icon: AlertCircle, label: "Error" },
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

export default function InstanceManagement() {
  const [instances, setInstances] = useState([]);
  const [filteredInstances, setFilteredInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Track which dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const { consoles, openConsole, closeConsole } = useConsoleManager();

  // Fetch instances
  const fetchInstances = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const adminState = useAdminAuthStore.getState();
      const response = await fetch(`${config.baseURL}/business/instances`, {
        headers: adminState?.getAuthHeaders
          ? adminState.getAuthHeaders()
          : { Accept: "application/json" },
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setInstances(data.data || []);
      } else {
        throw new Error(data.error || "Failed to fetch instances");
      }
    } catch (err) {
      ToastUtils.error(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Filter and sort instances
  useEffect(() => {
    let filtered = [...instances];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (instance) =>
          (instance.name && instance.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (instance.identifier &&
            instance.identifier.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (instance.floating_ip?.ip_address &&
            instance.floating_ip.ip_address.includes(searchTerm)) ||
          (instance.private_ip && instance.private_ip.includes(searchTerm))
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((instance) => instance.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "created_at") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredInstances(filtered);
  }, [instances, searchTerm, statusFilter, sortBy, sortOrder]);

  // Load instances on mount
  useEffect(() => {
    fetchInstances();

    // Click outside to close dropdowns
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [fetchInstances]);

  // Handle instance selection
  const handleSelectionChange = (selectedIds: any) => {
    setSelectedInstances(new Set(selectedIds));
  };

  // Execute instance action
  const executeInstanceAction = async (instanceId, action) => {
    ToastUtils.warning(
      `Instance actions (${action}) have been removed. Please use the instance details page for basic operations.`
    );
  };

  // Execute bulk action
  const executeBulkAction = (action: any, selectedItems: any) => {
    ToastUtils.warning(
      `Bulk actions (${action}) have been removed. Please manage instances individually.`
    );
    setSelectedInstances(new Set()); // Clear selection
  };

  // Navigate to instance details
  const navigateToInstanceDetails = (instanceId: any) => {
    window.location.href = `/admin-dashboard/instances/details?identifier=${encodeURIComponent(instanceId)}`;
  };

  // Handle console access
  const handleConsoleAccess = (instanceId: any) => {
    openConsole(instanceId);
  };

  const uniqueStatuses = [...new Set(instances.map((i) => i.status))].filter(Boolean);

  const headerActions = (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
      <button
        onClick={() => fetchInstances(false)}
        disabled={refreshing}
        className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );

  const columns = [
    {
      key: "name",
      header: "INSTANCE",
      render: (_, instance) => (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigateToInstanceDetails(instance.identifier);
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {instance.name || `Instance-${instance.identifier?.slice(-8)}`}
          </button>
          <p className="text-xs text-gray-500 font-mono">{instance.identifier}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      render: (val) => <StatusBadge status={val} size="xs" />,
    },
    {
      key: "type",
      header: "TYPE",
      render: (_, instance) => (
        <div className="flex items-center">
          <Server className="w-4 h-4 mr-2 text-gray-400" />
          <span>{instance.compute?.name || "N/A"}</span>
        </div>
      ),
    },
    {
      key: "resources",
      header: "RESOURCES",
      render: (_, instance) => (
        <div className="space-y-1">
          <div className="flex items-center">
            <Zap className="w-3 h-3 mr-1 text-blue-500" />
            <span>{instance.compute?.vcpus || 0} vCPU</span>
          </div>
          <div className="flex items-center">
            <HardDrive className="w-3 h-3 mr-1 text-green-500" />
            <span>
              {instance.compute?.memory_mb ? Math.round(instance.compute.memory_mb / 1024) : 0} GB
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "ip",
      header: "IP ADDRESS",
      render: (_, instance) => (
        <div className="flex items-center">
          <Network className="w-4 h-4 mr-2 text-gray-400" />
          <span>{instance.floating_ip?.ip_address || instance.private_ip || "N/A"}</span>
          {(instance.floating_ip?.ip_address || instance.private_ip) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(
                  instance.floating_ip?.ip_address || instance.private_ip
                );
                ToastUtils.success("IP copied to clipboard");
              }}
              className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <Copy className="w-3 h-3" />
            </button>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "CREATED",
      render: (val) => (
        <div className="flex items-center">
          <Clock className="w-4 h-4 mr-2 text-gray-400" />
          {val ? new Date(val).toLocaleDateString() : "N/A"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "ACTIONS",
      render: (_, instance) => {
        const quickActions = [
          {
            key: "start",
            label: "Start",
            icon: Play,
            color: "text-green-600",
            condition: instance.status === "stopped",
          },
          {
            key: "stop",
            label: "Stop",
            icon: Square,
            color: "text-red-600",
            condition: instance.status === "running",
          },
          {
            key: "reboot",
            label: "Reboot",
            icon: RotateCw,
            color: "text-blue-600",
            condition: instance.status === "running",
          },
          {
            key: "console",
            label: "Console",
            icon: Terminal,
            color: "text-indigo-600",
            condition: true,
          },
        ];
        const availableActions = quickActions.filter((action) => action.condition);

        return (
          <div className="flex items-center space-x-2 relative">
            {availableActions.slice(0, 3).map((action) => (
              <button
                key={action.key}
                onClick={(e) => {
                  e.stopPropagation();
                  if (action.key === "console") {
                    handleConsoleAccess(instance.id);
                  } else {
                    executeInstanceAction(instance.id, action.key);
                  }
                }}
                disabled={actionLoading[instance.id]?.[action.key]}
                className={`p-1 rounded hover:bg-gray-100 ${action.color} disabled:opacity-50`}
                title={action.label}
              >
                {actionLoading[instance.id]?.[action.key] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <action.icon className="w-4 h-4" />
                )}
              </button>
            ))}

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdownId(openDropdownId === instance.id ? null : instance.id);
                }}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {openDropdownId === instance.id && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateToInstanceDetails(instance.identifier);
                        setOpenDropdownId(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeInstanceAction(instance.id, "suspend");
                        setOpenDropdownId(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Suspend
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeInstanceAction(instance.id, "hibernate");
                        setOpenDropdownId(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Hibernate
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeInstanceAction(instance.id, "destroy");
                        setOpenDropdownId(null);
                      }}
                      className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Destroy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const bulkActions = [
    {
      label: "Start All",
      onClick: (ids, rows) => executeBulkAction("start", rows),
      icon: <Play className="w-4 h-4 mr-2" />,
    },
    {
      label: "Stop All",
      onClick: (ids, rows) => executeBulkAction("stop", rows),
      icon: <Square className="w-4 h-4 mr-2" />,
    },
    {
      label: "Reboot All",
      onClick: (ids, rows) => executeBulkAction("reboot", rows),
      icon: <RotateCw className="w-4 h-4 mr-2" />,
    },
    {
      label: "Destroy All",
      onClick: (ids, rows) => executeBulkAction("destroy", rows),
      variant: "danger",
      icon: <Trash2 className="w-4 h-4 mr-2" />,
    },
  ];

  return (
    <>
      <AdminHeadbar />
      <AdminSidebar />
      <AdminActiveTab />

      <AdminPageShell
        title="Instance Management"
        description="Manage and monitor your cloud instances"
        actions={headerActions}
      >
        {/* Search and Filters */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search instances..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {/* Instance Table */}
        <div className="m-6 md:m-8">
          <ModernTable
            data={filteredInstances}
            columns={columns}
            loading={loading}
            selectable={true}
            onSelectionChange={(ids) => handleSelectionChange(ids)}
            bulkActions={bulkActions}
            expandable={true}
            renderExpandedRow={(instance) => (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Instance Details</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Region:</dt>
                      <dd className="text-xs text-gray-900">{instance.region || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Provider:</dt>
                      <dd className="text-xs text-gray-900">{instance.provider || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">OS Image:</dt>
                      <dd className="text-xs text-gray-900">{instance.os_image?.name || "N/A"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Network</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Private IP:</dt>
                      <dd className="text-xs text-gray-900">{instance.private_ip || "N/A"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Floating IP:</dt>
                      <dd className="text-xs text-gray-900">
                        {instance.floating_ip?.ip_address || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Security Group:</dt>
                      <dd className="text-xs text-gray-900">{instance.security_group || "N/A"}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Storage</h4>
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Storage Size:</dt>
                      <dd className="text-xs text-gray-900">
                        {instance.storage_size_gb || "N/A"} GB
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Volume Type:</dt>
                      <dd className="text-xs text-gray-900">
                        {instance.volume_type?.name || "N/A"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-xs text-gray-500">Boot From:</dt>
                      <dd className="text-xs text-gray-900">
                        {instance.boot_from_volume ? "Volume" : "Image"}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
            emptyMessage={
              <div className="p-12 text-center">
                <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No instances found</p>
                <p className="text-gray-400 mt-2">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first instance to get started"}
                </p>
              </div>
            }
          />
        </div>

        {/* Console Windows */}
        {consoles.map((console) => (
          <EmbeddedConsole
            key={console.id}
            instanceId={console.instanceId}
            isVisible={true}
            onClose={() => closeConsole(console.instanceId)}
            initialPosition={console.position}
            initialSize={console.size}
          />
        ))}
      </AdminPageShell>
    </>
  );
}
