import React, { useState, useEffect, useCallback } from "react";
import { 
  Loader2, 
  AlertTriangle, 
  Copy, 
  Play, 
  Square, 
  RotateCw, 
  Pause, 
  Moon, 
  Terminal, 
  Camera, 
  Maximize, 
  Trash2,
  RefreshCw,
  Activity,
  Server,
  Network,
  HardDrive,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Settings,
  Eye,
  Download,
  Upload
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import EmbeddedConsole, { useConsoleManager } from "../../components/Console/EmbeddedConsole";
import ToastUtils from "../../utils/toastUtil";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";

// Enhanced Status Badge Component
const StatusBadge = ({ status, providerStatus, taskState }) => {
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

  return (
    <div className="flex flex-col space-y-1">
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusInfo.color}`}>
        <Icon className={`w-4 h-4 mr-2 ${statusInfo.icon === Loader2 ? 'animate-spin' : ''}`} />
        {statusInfo.label}
      </span>
      {providerStatus && providerStatus !== status && (
        <span className="text-xs text-gray-500">
          Provider: {providerStatus} {taskState && `(${taskState})`}
        </span>
      )}
    </div>
  );
};

// Action Button Component
const ActionButton = ({ 
  action, 
  icon: Icon, 
  label, 
  color = 'blue', 
  enabled = true, 
  loading = false,
  requiresConfirmation = false,
  onClick 
}) => {
  const [confirming, setConfirming] = useState(false);

  const colorClasses = {
    green: 'bg-green-600 hover:bg-green-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    cyan: 'bg-cyan-600 hover:bg-cyan-700 text-white',
    gray: 'bg-gray-600 hover:bg-gray-700 text-white',
  };

  const handleClick = () => {
    if (requiresConfirmation && !confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000); // Reset after 5 seconds
      return;
    }
    
    onClick();
    setConfirming(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!enabled || loading}
      className={`
        inline-flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200
        ${enabled ? colorClasses[color] : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
        ${confirming ? 'ring-2 ring-red-300 bg-red-600 text-white' : ''}
        ${loading ? 'opacity-75 cursor-wait' : ''}
      `}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Icon className="w-4 h-4 mr-2" />
      )}
      {confirming ? 'Confirm?' : label}
    </button>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, unit, trend, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {value}
              {unit && <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>}
            </p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span className="ml-1">{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced Instance Details Component
export default function InstanceDetails() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [instanceId, setInstanceId] = useState(null); // canonical instance identifier used for API calls
  const [instanceIdentifier, setInstanceIdentifier] = useState(null); // identifier to fetch (kept separately to trigger effects)
  const [instanceDetails, setInstanceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  const { consoles, openConsole, closeConsole } = useConsoleManager();

  const fetchInstanceDetails = useCallback(async (identifier) => {
    if (!identifier) {
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const { token } = useAdminAuthStore.getState() || {};

      if (!token) {
        throw new Error("Your admin session has expired. Please sign in again.");
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      };

      const fetchJson = async (path) => {
        const response = await fetch(path, { headers: authHeaders });
        const data = await response.json().catch(() => null);
        return { response, data };
      };

      // Try direct show endpoint first
      let url = `${config.adminURL}/instances/${encodeURIComponent(identifier)}`;
      let { response, data } = await fetchJson(url);

      if (!response.ok || !data?.success) {
        // Fallback to legacy filter endpoint when identifier lookup fails
        url = `${config.adminURL}/instances?identifier=${encodeURIComponent(identifier)}`;
        ({ response, data } = await fetchJson(url));
      }

      if (!response.ok || !data?.success) {
        const message =
          data?.error ||
          `Unable to load instance ${identifier} (HTTP ${response.status})`;
        throw new Error(message);
      }

      const detail = Array.isArray(data.data) ? data.data[0] : data.data;

      if (!detail) {
        throw new Error(
          "Instance details are unavailable. The instance may have been deleted."
        );
      }

      setInstanceDetails(detail);

      if (detail.identifier) {
        setInstanceId(detail.identifier);
        setInstanceIdentifier(detail.identifier);
      } else if (detail.id) {
        setInstanceId(String(detail.id));
      }
    } catch (err) {
      console.error("Failed to load instance details:", err);
      setIsError(true);
      setError(err.message || "Unknown error while loading instance.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Parse URL params, resolve identifier, trigger initial fetch
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const identifier = params.get("identifier");
    const encodedId = params.get("id");
    let resolvedIdentifier = null;

    if (identifier && identifier.trim()) {
      resolvedIdentifier = identifier.trim();
    } else if (encodedId) {
      try {
        resolvedIdentifier = atob(decodeURIComponent(encodedId));
      } catch (error) {
        console.error("Failed to decode instance ID:", error);
        setIsError(true);
        setError("Invalid instance reference");
        setIsLoading(false);
        return;
      }
    }

    if (!resolvedIdentifier) {
      setIsError(true);
      setError("We could not determine which instance to load.");
      setIsLoading(false);
      return;
    }


    setInstanceIdentifier(resolvedIdentifier);
    fetchInstanceDetails(resolvedIdentifier);
  }, [fetchInstanceDetails]);


  // Execute instance action
  const executeAction = async (action, params = {}) => {
    const targetIdentifier = instanceIdentifier || instanceId;
    if (!targetIdentifier) return;
    
    setActionLoading(prev => ({ ...prev, [action]: true }));
    
    try {
      const { token } = useAdminAuthStore.getState();
      // Note: Instance actions endpoint has been removed
      // Basic instance operations should be handled through standard CRUD endpoints
      ToastUtils.warning(`${action} action is no longer available - instance actions have been moved to standard instance management`);
      
      // For basic operations, redirect to appropriate endpoint
      if (action === 'destroy') {
        const confirmed = window.confirm('Are you sure you want to delete this instance? This action cannot be undone.');
        if (confirmed) {
          const response = await fetch(`${config.adminURL}/instances/${encodeURIComponent(targetIdentifier)}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          });
          
          const data = await response.json();
          
          if (data.success || response.ok) {
            ToastUtils.success('Instance deleted successfully');
            window.location.href = '/admin-dashboard/instances';
          } else {
            throw new Error(data.error || 'Failed to delete instance');
          }
        }
      } else {
        // For other actions, show informational message
        ToastUtils.info(`${action} functionality will be available in the updated instance management interface`);
      }
    } catch (err) {
      ToastUtils.error(err.message);
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  // Refresh status
  const refreshStatus = async () => {
    const reference = instanceIdentifier || instanceId;
    if (!reference) return;
    
    try {
      await fetchInstanceDetails(reference);
      ToastUtils.success('Status refreshed');
    } catch (err) {
      ToastUtils.error('Failed to refresh status');
    }
  };

  // Handle console access
  const handleConsoleAccess = () => {
    const reference = instanceIdentifier || instanceId;
    if (reference) {
      openConsole(reference);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  if (isLoading) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#288DD1] mx-auto mb-2" />
            <p className="text-gray-700">Loading instance details...</p>
          </div>
        </main>
      </>
    );
  }

  if (isError || !instanceDetails) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminActiveTab />
        <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-4">
            {error || "Instance couldn't be found"}
          </p>
          <button
            onClick={() => window.location.href = "/admin-dashboard/instances"}
            className="px-6 py-3 bg-[#288DD1] text-white font-medium rounded-full hover:bg-[#1976D2] transition-colors"
          >
            Go back to instances
          </button>
        </main>
      </>
    );
  }

  const { instance = {}, provider_details = {}, available_actions = {}, network_info = {}, monitoring_metrics = {} } = instanceDetails || {};
  const actions = available_actions;

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
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {instance?.name || `Instance ${instance?.identifier || instanceId || instanceIdentifier}`}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {(instance?.identifier || instanceId || instanceIdentifier)} • {(instance?.provider || 'N/A')} • {(instance?.region || 'N/A')}
                </p>
              </div>
              <StatusBadge 
                status={instance?.status} 
                providerStatus={provider_details?.provider_status}
                taskState={provider_details?.task_state}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshStatus}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Refresh Status"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-4">
          <div className="flex flex-wrap gap-3">
            {Object.entries(actions).map(([actionKey, actionConfig]) => {
              if (!actionConfig.enabled) return null;
              
              return (
                <ActionButton
                  key={actionKey}
                  action={actionKey}
                  icon={{
                    start: Play,
                    stop: Square,
                    reboot: RotateCw,
                    suspend: Pause,
                    hibernate: Moon,
                    resume: Play,
                    snapshot: Camera,
                    resize: Maximize,
                    console: Terminal,
                    destroy: Trash2,
                  }[actionKey] || Play}
                  label={actionConfig.label}
                  color={actionConfig.color}
                  enabled={actionConfig.enabled}
                  loading={actionLoading[actionKey]}
                  requiresConfirmation={actionConfig.requires_confirmation}
                  onClick={() => {
                    if (actionKey === 'console') {
                      handleConsoleAccess();
                    } else {
                      executeAction(actionKey);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'monitoring', label: 'Monitoring', icon: Activity },
              { id: 'network', label: 'Network', icon: Network },
              { id: 'storage', label: 'Storage', icon: HardDrive },
              { id: 'logs', label: 'Logs', icon: Terminal },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="CPU Usage"
                  value={monitoring_metrics?.cpu_usage || 'N/A'}
                  unit={monitoring_metrics?.cpu_usage ? '%' : ''}
                  icon={Server}
                  color="blue"
                />
                <MetricCard
                  title="Memory"
                  value={instance.compute?.memory_mb ? `${Math.round(instance.compute.memory_mb / 1024)}` : 'N/A'}
                  unit={instance.compute?.memory_mb ? 'GB' : ''}
                  icon={Activity}
                  color="green"
                />
                <MetricCard
                  title="Storage"
                  value={instance?.storage_size_gb || 'N/A'}
                  unit={instance?.storage_size_gb ? 'GB' : ''}
                  icon={HardDrive}
                  color="yellow"
                />
                <MetricCard
                  title="Uptime"
                  value={provider_details?.created ? 
                    Math.ceil((new Date() - new Date(provider_details.created)) / (1000 * 60 * 60 * 24)) 
                    : 'N/A'
                  }
                  unit={provider_details?.created ? 'days' : ''}
                  icon={Clock}
                  color="purple"
                />
              </div>

              {/* Instance Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Configuration</h3>
                  <dl className="space-y-3">
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Instance Type</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{instance.compute?.name || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">vCPUs</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{instance.compute?.vcpus || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Memory</dt>
                      <dd className="text-sm text-gray-900 col-span-2">
                        {instance.compute?.memory_mb ? `${Math.round(instance.compute.memory_mb / 1024)} GB` : 'N/A'}
                      </dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">OS Image</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{instance.os_image?.name || 'N/A'}</dd>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-sm font-medium text-gray-500">Key Pair</dt>
                      <dd className="text-sm text-gray-900 col-span-2">{provider_details?.key_name || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Network Information</h3>
                  <dl className="space-y-3">
                    {network_info?.networks?.map((network, index) => (
                      <div key={index}>
                        <div className="grid grid-cols-3 gap-4">
                          <dt className="text-sm font-medium text-gray-500">{network.name}</dt>
                          <dd className="text-sm text-gray-900 col-span-2">
                            {network.addresses?.map(addr => (
                              <div key={addr.addr} className="flex items-center">
                                <span>{addr.addr}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(addr.addr);
                                    ToastUtils.success('IP address copied to clipboard');
                                  }}
                                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            )) || 'No addresses'}
                          </dd>
                        </div>
                      </div>
                    ))}
                    {network_info?.floating_ip && (
                      <div className="grid grid-cols-3 gap-4">
                        <dt className="text-sm font-medium text-gray-500">Floating IP</dt>
                        <dd className="text-sm text-gray-900 col-span-2 flex items-center">
                          <span>{network_info.floating_ip}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(network_info.floating_ip);
                              ToastUtils.success('Floating IP copied to clipboard');
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'monitoring' && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Monitoring data will be available here</p>
                <p className="text-sm text-gray-400 mt-2">Real-time metrics integration coming soon</p>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Instance Logs</h3>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                    <Download className="w-4 h-4 mr-1 inline" />
                    Download
                  </button>
                  <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded">
                    <RefreshCw className="w-4 h-4 mr-1 inline" />
                    Refresh
                  </button>
                </div>
              </div>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                <div className="space-y-1">
                  <div>[2024-01-01 12:00:00] System initialized</div>
                  <div>[2024-01-01 12:00:01] Loading kernel modules...</div>
                  <div>[2024-01-01 12:00:02] Network interface configured</div>
                  <div>[2024-01-01 12:00:03] Services started successfully</div>
                  <div className="text-gray-500">• Log streaming will be implemented with real API integration •</div>
                </div>
              </div>
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
