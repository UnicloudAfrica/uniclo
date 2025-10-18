import React, { useState, useEffect, useCallback } from "react";
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
  Download,
  Upload,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  HardDrive,
  Network,
  Copy,
  ExternalLink,
  Zap
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import EmbeddedConsole, { useConsoleManager } from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";

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
    { key: 'start', label: 'Start', icon: Play, color: 'text-green-600', condition: instance.status === 'stopped' },
    { key: 'stop', label: 'Stop', icon: Square, color: 'text-red-600', condition: instance.status === 'running' },
    { key: 'reboot', label: 'Reboot', icon: RotateCw, color: 'text-blue-600', condition: instance.status === 'running' },
    { key: 'console', label: 'Console', icon: Terminal, color: 'text-indigo-600', condition: true },
  ];

  const availableActions = quickActions.filter(action => action.condition);

  return (
    <>
      <tr className="hover:bg-gray-50 border-b border-gray-200">
        {/* Selection Checkbox */}
        <td className="px-6 py-4">
          <button
            onClick={() => onSelect(instance.id)}
            className="text-gray-400 hover:text-gray-600"
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600" />
            ) : (
              <UncheckedSquare className="w-5 h-5" />
            )}
          </button>
        </td>

        {/* Expand/Collapse */}
        <td className="px-2 py-4">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </td>

        {/* Instance Name & ID */}
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div>
              <button
                onClick={() => onNavigateToDetails(instance.identifier)}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {instance.name || `Instance-${instance.identifier?.slice(-8)}`}
              </button>
              <p className="text-xs text-gray-500 font-mono">{instance.identifier}</p>
            </div>
          </div>
        </td>

        {/* Status */}
        <td className="px-6 py-4">
          <StatusBadge status={instance.status} size="xs" />
        </td>

        {/* Instance Type */}
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="flex items-center">
            <Server className="w-4 h-4 mr-2 text-gray-400" />
            <span>{instance.compute?.name || 'N/A'}</span>
          </div>
        </td>

        {/* Resources */}
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="space-y-1">
            <div className="flex items-center">
              <Zap className="w-3 h-3 mr-1 text-blue-500" />
              <span>{instance.compute?.vcpus || 0} vCPU</span>
            </div>
            <div className="flex items-center">
              <HardDrive className="w-3 h-3 mr-1 text-green-500" />
              <span>{instance.compute?.memory_mb ? Math.round(instance.compute.memory_mb / 1024) : 0} GB</span>
            </div>
          </div>
        </td>

        {/* IP Address */}
        <td className="px-6 py-4 text-sm text-gray-900">
          <div className="flex items-center">
            <Network className="w-4 h-4 mr-2 text-gray-400" />
            <span>{instance.floating_ip?.ip_address || instance.private_ip || 'N/A'}</span>
            {(instance.floating_ip?.ip_address || instance.private_ip) && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(instance.floating_ip?.ip_address || instance.private_ip);
                  ToastUtils.success('IP copied to clipboard');
                }}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>

        {/* Created */}
        <td className="px-6 py-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-gray-400" />
            {instance.created_at ? new Date(instance.created_at).toLocaleDateString() : 'N/A'}
          </div>
        </td>

        {/* Quick Actions */}
        <td className="px-6 py-4">
          <div className="flex items-center space-x-2">
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
                onClick={() => setShowActions(!showActions)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showActions && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => onNavigateToDetails(instance.identifier)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleAction('suspend')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Suspend
                    </button>
                    <button
                      onClick={() => handleAction('hibernate')}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Hibernate
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={() => handleAction('destroy')}
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
        </td>
      </tr>

      {/* Expanded Row Details */}
      {expanded && (
        <tr className="bg-gray-50">
          <td colSpan="9" className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Instance Details</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Region:</dt>
                    <dd className="text-xs text-gray-900">{instance.region || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Provider:</dt>
                    <dd className="text-xs text-gray-900">{instance.provider || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">OS Image:</dt>
                    <dd className="text-xs text-gray-900">{instance.os_image?.name || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Network</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Private IP:</dt>
                    <dd className="text-xs text-gray-900">{instance.private_ip || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Floating IP:</dt>
                    <dd className="text-xs text-gray-900">{instance.floating_ip?.ip_address || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Security Group:</dt>
                    <dd className="text-xs text-gray-900">{instance.security_group || 'N/A'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Storage</h4>
                <dl className="space-y-1">
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Storage Size:</dt>
                    <dd className="text-xs text-gray-900">{instance.storage_size_gb || 'N/A'} GB</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Volume Type:</dt>
                    <dd className="text-xs text-gray-900">{instance.volume_type?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-xs text-gray-500">Boot From:</dt>
                    <dd className="text-xs text-gray-900">{instance.boot_from_volume ? 'Volume' : 'Image'}</dd>
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
  const [instances, setInstances] = useState([]);
  const [filteredInstances, setFilteredInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInstances, setSelectedInstances] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { consoles, openConsole, closeConsole } = useConsoleManager();

  // Fetch instances
  const fetchInstances = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    try {
      const { token } = useAdminAuthStore.getState();
      const response = await fetch(`${config.baseURL}/business/instances`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setInstances(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch instances');
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

  // Load instances on mount
  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

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

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminActiveTab />

      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Instance Management</h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage and monitor your cloud instances
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => fetchInstances(false)}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={() => window.location.href = '/admin-dashboard/multi-instance-creation'}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Instance
              </button>
            </div>
          </div>
        </div>

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
                {uniqueStatuses.map(status => (
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

            {/* Bulk Actions */}
            {selectedInstances.size > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedInstances.size} selected
                </span>
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Bulk Actions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>

                  {showBulkActions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="py-1">
                        <button
                          onClick={() => executeBulkAction('start')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Start All
                        </button>
                        <button
                          onClick={() => executeBulkAction('stop')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <Square className="w-4 h-4 mr-2" />
                          Stop All
                        </button>
                        <button
                          onClick={() => executeBulkAction('reboot')}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                        >
                          <RotateCw className="w-4 h-4 mr-2" />
                          Reboot All
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={() => executeBulkAction('destroy')}
                          className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Destroy All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instance Table */}
        <div className="bg-white m-6 md:m-8 rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-500">Loading instances...</p>
            </div>
          ) : filteredInstances.length === 0 ? (
            <div className="p-12 text-center">
              <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium">No instances found</p>
              <p className="text-gray-400 mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first instance to get started'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={handleSelectAll}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {selectedInstances.size === filteredInstances.length ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <UncheckedSquare className="w-5 h-5" />
                        )}
                      </button>
                    </th>
                    <th className="px-2 py-3"></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resources
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredInstances.map((instance) => (
                    <InstanceRow
                      key={instance.id}
                      instance={instance}
                      isSelected={selectedInstances.has(instance.id)}
                      onSelect={handleInstanceSelect}
                      onAction={executeInstanceAction}
                      onConsoleAccess={handleConsoleAccess}
onNavigateToDetails={(idOrIdentifier) => navigateToInstanceDetails(idOrIdentifier)}
                      actionLoading={actionLoading}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Console Windows */}
        {consoles.map(console => (
          <EmbeddedConsole
            key={console.id}
            instanceId={console.instanceId}
            isVisible={true}
            onClose={() => closeConsole(console.instanceId)}
            initialPosition={console.position}
            initialSize={console.size}
          />
        ))}
      </main>
    </>
  );
}