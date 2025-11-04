import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Calculator,
  Server,
  HardDrive,
  Network,
  Key,
  Shield,
  Globe,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Download,
  Save,
  Play,
  Eye,
  Settings,
  RefreshCw,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  CreditCard
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminPageShell from "../components/AdminPageShell";
import ModernCard from "../components/ModernCard";
import ModernButton from "../components/ModernButton";
import ModernInput from "../components/ModernInput";
import StatusPill from "../components/StatusPill";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import ToastUtils from "../../utils/toastUtil";
import { designTokens } from "../../styles/designTokens";
import { useFetchProductPricing, useFetchGeneralRegions } from "../../hooks/resource";
import { useFetchProjects } from "../../hooks/adminHooks/projectHooks";
import { useFetchSecurityGroups } from "../../hooks/adminHooks/securityGroupHooks";
import { useFetchKeyPairs } from "../../hooks/adminHooks/keyPairHooks";
import { useFetchSubnets } from "../../hooks/adminHooks/subnetHooks";
import { useFetchNetworks } from "../../hooks/adminHooks/networkHooks";
import { useFetchTenants, useFetchSubTenantByTenantID } from "../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../hooks/adminHooks/clientHooks";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";
import { useLocation } from "react-router-dom";

const extractRegionCode = (region) => {
  if (!region) return "";
  if (typeof region === "string") return region;
  return (
    region.code ||
    region.region ||
    region.slug ||
    region.id ||
    region.identifier ||
    ""
  );
};

// Configuration Card Component
const InstanceConfigCard = ({
  config,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  resources,
  errors = {},
  isExpanded,
  onToggleExpand
}) => {
  const isEqualValue = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, idx) => item === b[idx]);
    }
    if (typeof a === "object" && typeof b === "object" && a && b) {
      try {
        return JSON.stringify(a) === JSON.stringify(b);
      } catch (err) {
        return false;
      }
    }
    return a === b;
  };

  const updateConfig = (field, value) => {
    if (isEqualValue(config[field], value)) {
      return;
    }

    const updated = { ...config, [field]: value };
    onUpdate(index, updated);
  };

  const updateVolumeType = (volumeIndex, field, value) => {
    const volumeTypes = [...(config.volume_types || [])];
    volumeTypes[volumeIndex] = { ...volumeTypes[volumeIndex], [field]: value };
    updateConfig('volume_types', volumeTypes);
  };

  const addVolumeType = () => {
    const volumeTypes = [...(config.volume_types || [])];
    volumeTypes.push({ volume_type_id: '', storage_size_gb: 50 });
    updateConfig('volume_types', volumeTypes);
  };

  const removeVolumeType = (volumeIndex) => {
    const volumeTypes = [...(config.volume_types || [])];
    volumeTypes.splice(volumeIndex, 1);
    updateConfig('volume_types', volumeTypes);
  };

  const getErrorForField = (field) => {
    return errors[`instances.${index}.${field}`]?.[0] || errors[field]?.[0];
  };

  const selectedProduct = resources?.compute_instances?.find(p => p.id === config.product_id);

  // Use the project identifier string directly (stored in project_id)
  const projectIdentifier = config.project_id || '';
  const selectedRegion = config.region;
  const { data: securityGroups } = useFetchSecurityGroups(projectIdentifier, selectedRegion, { enabled: !!projectIdentifier && !!selectedRegion });
  const { data: keyPairs } = useFetchKeyPairs(projectIdentifier, selectedRegion, { enabled: !!projectIdentifier && !!selectedRegion });
  const { data: subnets } = useFetchSubnets(projectIdentifier, selectedRegion, { enabled: !!projectIdentifier && !!selectedRegion });
  const { data: networksResponse } = useFetchNetworks(projectIdentifier, selectedRegion, { enabled: !!projectIdentifier && !!selectedRegion });
  const networkOptions = useMemo(() => {
    if (!networksResponse) return [];
    if (Array.isArray(networksResponse)) return networksResponse;
    if (Array.isArray(networksResponse.data)) return networksResponse.data;
    return [];
  }, [networksResponse]);

  // Fetch region-scoped products for this specific configuration
  const { data: computeInstancesByRegion } = useFetchProductPricing(selectedRegion, "compute_instance", { enabled: !!selectedRegion, keepPreviousData: true });
  const { data: osImagesByRegion } = useFetchProductPricing(selectedRegion, "os_image", { enabled: !!selectedRegion, keepPreviousData: true });
  const { data: volumeTypesByRegion } = useFetchProductPricing(selectedRegion, "volume_type", { enabled: !!selectedRegion, keepPreviousData: true });

  // Fetch projects filtered by selected region
  const { data: projectsRespForRegion } = useFetchProjects(
    { per_page: 100, region: selectedRegion },
    { enabled: !!selectedRegion, keepPreviousData: true }
  );
  const unfilteredProjects = projectsRespForRegion?.data || resources?.projects || [];
  const projectsForRegion = (unfilteredProjects || []).filter((project) => {
    if (!selectedRegion) return true;
    const projectRegion =
      extractRegionCode(project?.region) ||
      project?.region_code ||
      project?.region ||
      "";
    return !projectRegion || String(projectRegion) === String(selectedRegion);
  });

  // Reset dependent selections when region or project changes
  useEffect(() => {
    // If region changes and there is no project yet, clear infra-dependent fields
    if (selectedRegion && !projectIdentifier) {
      updateConfig('project_id', '');
      updateConfig('network_id', '');
      updateConfig('subnet_id', '');
      updateConfig('security_group_ids', []);
      updateConfig('keypair_name', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRegion]);

  useEffect(() => {
    if (projectIdentifier) {
      updateConfig('network_id', '');
      updateConfig('subnet_id', '');
      updateConfig('security_group_ids', []);
      updateConfig('keypair_name', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdentifier]);

  return (
    <ModernCard className="transition-all duration-200 hover:shadow-md">
      <div className="p-6 border-b" style={{ borderColor: designTokens.colors.neutral[200] }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onToggleExpand(index)}
              className="modern-button btn-icon transition-colors"
              style={{
                '--btn-bg': 'transparent',
                '--btn-color': designTokens.colors.neutral[500],
                '--btn-border': '1px solid transparent',
                '--btn-shadow': 'none',
                '--btn-hover-bg': designTokens.colors.neutral[100],
                '--btn-hover-color': designTokens.colors.primary[600],
                '--btn-hover-border': '1px solid transparent',
                '--btn-active-bg': designTokens.colors.neutral[200],
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" style={{ color: designTokens.colors.neutral[600] }} />
              ) : (
                <ChevronRight className="w-4 h-4" style={{ color: designTokens.colors.neutral[600] }} />
              )}
            </button>
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                Configuration #{index + 1}: {config.name || 'Untitled'}
              </h3>
              <p
                className="text-sm"
                style={{ color: designTokens.colors.neutral[500] }}
              >
                {config.count || 1} instance(s) • {selectedProduct?.name || 'No product selected'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onDuplicate(index)}
              className="modern-button btn-icon transition-colors"
              style={{
                '--btn-bg': 'transparent',
                '--btn-color': designTokens.colors.neutral[400],
                '--btn-border': '1px solid transparent',
                '--btn-shadow': 'none',
                '--btn-hover-bg': designTokens.colors.primary[50],
                '--btn-hover-color': designTokens.colors.primary[600],
                '--btn-hover-border': '1px solid transparent',
                '--btn-active-bg': designTokens.colors.primary[100],
              }}
              title="Duplicate Configuration"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(index)}
              className="modern-button btn-icon transition-colors"
              style={{
                '--btn-bg': 'transparent',
                '--btn-color': designTokens.colors.neutral[400],
                '--btn-border': '1px solid transparent',
                '--btn-shadow': 'none',
                '--btn-hover-bg': designTokens.colors.error[50],
                '--btn-hover-color': designTokens.colors.error[600],
                '--btn-hover-border': '1px solid transparent',
                '--btn-active-bg': designTokens.colors.error[100],
              }}
              title="Delete Configuration"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instance Name *
              </label>
              <input
                type="text"
                value={config.name || ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder="Enter instance name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('name') ? 'border-red-300' : 'border-gray-300'
                  }`}
              />
              {getErrorForField('name') && (
                <p className="text-sm text-red-600 mt-1">{getErrorForField('name')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Instances *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={config.count || 1}
                onChange={(e) => updateConfig('count', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('count') ? 'border-red-300' : 'border-gray-300'
                  }`}
              />
              {getErrorForField('count') && (
                <p className="text-sm text-red-600 mt-1">{getErrorForField('count')}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={config.description || ''}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="Enter instance description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Infrastructure Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold flex items-center" style={{ color: designTokens.colors.neutral[900] }}>
              <Server className="w-5 h-5 mr-2" style={{ color: designTokens.colors.primary[500] }} />
              Infrastructure Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region *
                </label>
                <select
                  value={config.region || ''}
                  onChange={(e) => updateConfig('region', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('region') ? 'border-red-300' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select Region</option>
                  {(resources?.regions || []).map((region) => {
                    const code = typeof region === 'string'
                      ? region
                      : (region.code || region.region || region.slug || region.id || '');
                    const name = typeof region === 'string'
                      ? region
                      : (region.name || region.display_name || code || 'Region');
                    if (!code) return null;
                    return (
                      <option key={code} value={code}>
                        {name} ({code})
                      </option>
                    );
                  })}
                </select>
                {getErrorForField('region') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('region')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={config.project_id || ''}
                  onChange={(e) => updateConfig('project_id', e.target.value)}
                  disabled={!selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('project_id') ? 'border-red-300' : 'border-gray-300'
                    } ${!selectedRegion ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">{selectedRegion ? 'Select Project' : 'Select region first'}</option>
                  {projectsForRegion?.map(project => (
                    <option key={project.identifier} value={project.identifier}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {getErrorForField('project_id') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('project_id')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Months) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={config.months || 1}
                  onChange={(e) => updateConfig('months', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instance Type *
                </label>
                <select
                  value={config.compute_instance_id || ''}
                  onChange={(e) => updateConfig('compute_instance_id', e.target.value)}
                  disabled={!selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('compute_instance_id') ? 'border-red-300' : 'border-gray-300'
                    } ${!selectedRegion ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Instance Type</option>
                  {(computeInstancesByRegion || []).map((item, optionIdx) => {
                    const value = item?.product?.productable_id || '';
                    const label = item?.product?.name || 'Compute';
                    return (
                      <option key={`${value}-${optionIdx}`} value={value}>{label}</option>
                    );
                  })}
                </select>
                {getErrorForField('product_id') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('product_id')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OS Image *
                </label>
                <select
                  value={config.os_image_id || ''}
                  onChange={(e) => updateConfig('os_image_id', e.target.value)}
                  disabled={!selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('os_image_id') ? 'border-red-300' : 'border-gray-300'
                    } ${!selectedRegion ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select OS Image</option>
                  {(osImagesByRegion || []).map((item, optionIdx) => {
                    const value = item?.product?.productable_id || '';
                    const label = item?.product?.name || 'OS Image';
                    return (
                      <option key={`${value}-${optionIdx}`} value={value}>{label}</option>
                    );
                  })}
                </select>
                {getErrorForField('os_image_id') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('os_image_id')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Storage Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold flex items-center" style={{ color: designTokens.colors.neutral[900] }}>
              <HardDrive className="w-5 h-5 mr-2" style={{ color: designTokens.colors.primary[500] }} />
              Storage Configuration
            </h4>

            {(config.volume_types || []).map((volume, volumeIndex) => (
              <div key={volumeIndex} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    Volume {volumeIndex + 1} {volumeIndex === 0 ? '(Boot Volume)' : ''}
                  </h5>
                  {volumeIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => removeVolumeType(volumeIndex)}
                      className="modern-button btn-icon"
                      style={{
                        '--btn-bg': 'transparent',
                        '--btn-color': designTokens.colors.error[600],
                        '--btn-border': '1px solid transparent',
                        '--btn-shadow': 'none',
                        '--btn-hover-bg': designTokens.colors.error[50],
                        '--btn-hover-color': designTokens.colors.error[600],
                        '--btn-hover-border': '1px solid transparent',
                        '--btn-active-bg': designTokens.colors.error[100],
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume Type *
                    </label>
                    <select
                      value={volume.volume_type_id || ''}
                      onChange={(e) => updateVolumeType(volumeIndex, 'volume_type_id', e.target.value)}
                      disabled={!selectedRegion}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!selectedRegion ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select Volume Type</option>
                      {(volumeTypesByRegion || []).map((item, optionIdx) => {
                        const value = item?.product?.productable_id || '';
                        const label = item?.product?.name || 'Volume Type';
                        return (
                          <option key={`${value}-${optionIdx}`} value={value}>{label}</option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size (GB) *
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="2000"
                      value={volume.storage_size_gb || 50}
                      onChange={(e) => updateVolumeType(volumeIndex, 'storage_size_gb', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addVolumeType}
              className="modern-button btn-compact inline-flex items-center px-3 py-2"
              style={{
                '--btn-bg': '#f3f4f6',
                '--btn-color': '#ffffff',
                '--btn-border': '1px solid transparent',
                '--btn-shadow': 'none',
                '--btn-hover-bg': '#e5e7eb',
                '--btn-hover-color': '#111827',
                '--btn-active-bg': '#d1d5db',
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Additional Volume
            </button>
          </div>

          {/* Network Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <Network className="w-5 h-5 mr-2" />
              Network Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network (Optional)
                </label>
                <select
                  value={config.network_id || ''}
                  onChange={(e) => updateConfig('network_id', e.target.value)}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('network_id') ? 'border-red-300' : 'border-gray-300'
                    } ${(!projectIdentifier || !selectedRegion) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">None (use default)</option>
                  {networkOptions.map((network) => {
                    const value =
                      network?.id ??
                      network?.network_id ??
                      network?.uuid ??
                      network?.identifier ??
                      "";
                    if (!value) return null;
                    const label =
                      network?.name ??
                      network?.display_name ??
                      network?.network_name ??
                      network?.label ??
                      value;
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subnet (Optional)
                </label>
                <select
                  value={config.subnet_id || ''}
                  onChange={(e) => updateConfig('subnet_id', e.target.value)}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${getErrorForField('subnet_id') ? 'border-red-300' : 'border-gray-300'
                    } ${(!projectIdentifier || !selectedRegion) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">None (use default)</option>
                  {(subnets || []).map(subnet => (
                    <option key={subnet.id} value={subnet.id}>
                      {subnet.name || subnet.cidr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floating IPs
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={config.floating_ip_count || 0}
                  onChange={(e) => updateConfig('floating_ip_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Groups (Optional)
                </label>
                <select
                  multiple
                  value={config.security_group_ids || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    updateConfig('security_group_ids', values);
                  }}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 ${getErrorForField('security_group_ids') ? 'border-red-300' : 'border-gray-300'
                    } ${(!projectIdentifier || !selectedRegion) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  {(securityGroups || []).map(sg => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Pair
                </label>
                <select
                  value={config.keypair_name || ''}
                  onChange={(e) => updateConfig('keypair_name', e.target.value)}
                  disabled={!projectIdentifier || !selectedRegion}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${(!projectIdentifier || !selectedRegion) ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Key Pair</option>
                  {(keyPairs || []).map(kp => (
                    <option key={kp.id} value={kp.name}>
                      {kp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            <input
              type="text"
              value={(config.tags || []).join(', ')}
              onChange={(e) => {
                const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
                updateConfig('tags', tags);
              }}
              placeholder="Enter tags separated by commas"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
          </div>
        </div>
      )}
    </ModernCard>
  );
};

const InlinePaymentPanel = ({
  transactionData,
  onPaymentComplete,
  onModifyOrder,
}) => {
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState(null);

  const {
    transaction,
    instances,
    payment,
    order,
    order_items: orderItems = [],
    pricing_breakdown: pricingBreakdown = [],
  } = transactionData?.data || {};
  const paymentGatewayOptions = payment?.payment_gateway_options || [];

  useEffect(() => {
    setPaymentStatus("pending");
    setTimeRemaining(null);
  }, [transactionData]);

  useEffect(() => {
    if (paymentGatewayOptions.length > 0) {
      const paystackCardOption = paymentGatewayOptions.find(
        (option) =>
          option.name?.toLowerCase().includes("paystack") &&
          option.payment_type?.toLowerCase() === "card"
      );
      setSelectedPaymentOption(paystackCardOption || paymentGatewayOptions[0]);
    } else {
      setSelectedPaymentOption(null);
    }
  }, [paymentGatewayOptions]);

  useEffect(() => {
    if (!payment?.expires_at) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(payment.expires_at).getTime();
      const remaining = expiry - now;

      if (remaining > 0) {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor(
          (remaining % (1000 * 60 * 60)) / (1000 * 60)
        );
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        setTimeRemaining({ hours, minutes, seconds });
      } else {
        setTimeRemaining(null);
        setPaymentStatus("expired");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [payment?.expires_at]);

  const pollTransactionStatus = async () => {
    if (!transaction?.id || isPolling) return;

    setIsPolling(true);
    try {
      const { token } = useAdminAuthStore.getState();
      const response = await fetch(
        `${config.baseURL}/business/transactions/${transaction.id}/status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      const data = await response.json();

      if (data.success && data.data) {
        if (data.data.status === "successful") {
          setPaymentStatus("completed");
          onPaymentComplete?.(data.data);
        } else if (data.data.status === "failed") {
          setPaymentStatus("failed");
        }
      }
    } catch (error) {
      console.error("Failed to poll transaction status:", error);
    } finally {
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (
      (paymentStatus === "pending" || paymentStatus === "transfer_pending") &&
      transaction?.id
    ) {
      const interval = setInterval(pollTransactionStatus, 10000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [paymentStatus, transaction?.id]);

  useEffect(() => {
    if (!window.PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
    return undefined;
  }, []);

  const handlePaymentOptionChange = (optionId) => {
    const option = paymentGatewayOptions.find(
      (opt) => String(opt.id) === String(optionId)
    );
    setSelectedPaymentOption(option || null);
  };

  const handlePayNow = () => {
    if (!selectedPaymentOption) return;

    if (selectedPaymentOption.payment_type?.toLowerCase() === "card") {
      if (!selectedPaymentOption.transaction_reference) {
        ToastUtils.error(
          "Payment reference not ready yet. Please try again in a moment."
        );
        return;
      }

      const paystackKey = process.env.REACT_APP_PAYSTACK_KEY;
      if (!paystackKey) {
        ToastUtils.error("Paystack public key missing. Contact support.");
        return;
      }

      if (!window.PaystackPop || typeof window.PaystackPop.setup !== "function") {
        ToastUtils.error(
          "Unable to initialize Paystack. Please refresh the page and try again."
        );
        return;
      }

      try {
        const amountMinorUnits = Math.round(
          Number(selectedPaymentOption.total || 0) * 100
        );

        if (!Number.isFinite(amountMinorUnits) || amountMinorUnits <= 0) {
          ToastUtils.error("Invalid payment amount; please regenerate the order.");
          console.error("Invalid Paystack amount", selectedPaymentOption.total);
          return;
        }

        const popup = window.PaystackPop.setup({
          key: paystackKey,
          email: transaction?.user?.email || "user@example.com",
          amount: amountMinorUnits,
          reference: selectedPaymentOption.transaction_reference,
          channels: ["card"],
          onSuccess: (response) => {
            setPaymentStatus("completed");
            onPaymentComplete?.(response);
          },
          onCancel: () => {
            console.log("Payment cancelled");
          },
          onError: (error) => {
            console.error("Payment failed:", error);
            setPaymentStatus("failed");
            ToastUtils.error("Card payment failed. Please try again or use another method.");
          },
        });

        if (popup && typeof popup.openIframe === "function") {
          popup.openIframe();
        } else {
          throw new Error("Paystack popup unavailable");
        }
      } catch (error) {
        console.error("Failed to launch Paystack:", error);
        ToastUtils.error("Could not launch Paystack payment window. Please retry.");
      }
    } else if (
      selectedPaymentOption.payment_type?.toLowerCase().includes("transfer")
    ) {
      setPaymentStatus("transfer_pending");
      ToastUtils.info(
        "Bank transfer details generated. Complete the transfer and refresh status."
      );
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case "completed":
        return <CheckCircle className="h-8 w-8 text-emerald-500" />;
      case "failed":
      case "expired":
        return <AlertCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Clock className="h-8 w-8 text-amber-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case "completed":
        return "Payment completed! Your instances are being provisioned and will be available shortly.";
      case "failed":
        return "Payment failed. Please try again or contact support.";
      case "expired":
        return "Payment link has expired. Please create a new order.";
      case "transfer_pending":
        return "Bank transfer initiated. Your order will update once the transfer is confirmed.";
      default:
        return "Complete your payment to proceed with instance provisioning.";
    }
  };

  if (!transactionData) {
    return null;
  }

  const statusLabel =
    paymentStatus === "pending"
      ? "Pending"
      : paymentStatus
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

  const statusTone =
    paymentStatus === "completed"
      ? "success"
      : paymentStatus === "failed"
        ? "warning"
        : paymentStatus === "expired"
          ? "warning"
          : "info";

  const currencyCode = transaction?.currency || order?.currency || "NGN";
  const formatCurrency = (value, overrideCurrency) => {
    const numeric = Number(value);
    const currency = overrideCurrency || currencyCode;
    if (!Number.isFinite(numeric)) {
      return `${currency} 0.00`;
    }
    try {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric);
    } catch (err) {
      return `${currency} ${numeric.toFixed(2)}`;
    }
  };

  const breakdown = selectedPaymentOption?.charge_breakdown || {};
  const breakdownCurrency = breakdown.currency || currencyCode;
  const baseAmount = Number(
    breakdown.base_amount ?? transaction?.amount ?? order?.total ?? 0
  );
  const selectedTotal = Number(
    breakdown.grand_total ?? selectedPaymentOption?.total ?? baseAmount
  );
  const gatewayFee = Number(
    breakdown.total_fees ?? Math.max(selectedTotal - baseAmount, 0)
  );
  const percentageFee = Number(breakdown.percentage_fee ?? 0);
  const flatFee = Number(breakdown.flat_fee ?? 0);

  return (
    <div className="space-y-6">
      <ModernCard
        padding="lg"
        className="overflow-hidden border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-100 shadow-sm"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white p-2 shadow-sm">
              {getStatusIcon()}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">
                Complete payment
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm">
                Transaction #{transaction?.identifier || transaction?.id || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill label={statusLabel} tone={statusTone} />
            <ModernButton variant="ghost" onClick={pollTransactionStatus}>
              Refresh status
            </ModernButton>
            <ModernButton variant="ghost" onClick={onModifyOrder}>
              Modify order
            </ModernButton>
          </div>
        </div>
        <div
          className="mt-4 rounded-2xl border px-4 py-3"
          style={{
            backgroundColor:
              paymentStatus === "completed"
                ? designTokens.colors.success[50]
                : designTokens.colors.neutral[50],
            borderColor: designTokens.colors.neutral[200],
          }}
        >
          <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span
              className="font-medium"
              style={{
                color:
                  paymentStatus === "completed"
                    ? designTokens.colors.success[800]
                    : designTokens.colors.neutral[700],
              }}
            >
              {getStatusMessage()}
            </span>
            {timeRemaining && paymentStatus === "pending" && (
              <span
                className="font-medium"
                style={{ color: designTokens.colors.warning[600] }}
              >
                Expires in {timeRemaining.hours}h {timeRemaining.minutes}m{" "}
                {timeRemaining.seconds}s
              </span>
            )}
          </div>
        </div>
      </ModernCard>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h4
                className="flex items-center font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Payment Details
              </h4>
              <div className="space-y-4 text-sm">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Order amount</span>
                    <span className="font-semibold text-slate-900">
                      {formatCurrency(baseAmount, breakdownCurrency)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-500">Gateway fees</span>
                    <span className="font-medium text-amber-600">
                      {gatewayFee > 0
                        ? formatCurrency(gatewayFee, breakdownCurrency)
                        : `${breakdownCurrency} 0.00`}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-slate-500">Total due</span>
                    <span className="text-lg font-semibold text-slate-900">
                      {formatCurrency(selectedTotal, breakdownCurrency)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 rounded-xl bg-white px-3 py-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Percentage fee</span>
                      <span>{formatCurrency(percentageFee, breakdownCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Flat fee</span>
                      <span>{formatCurrency(flatFee, breakdownCurrency)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total fees</span>
                      <span>{formatCurrency(gatewayFee, breakdownCurrency)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
                    <span>Gateway</span>
                    <span>Reference</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded px-2 py-1 text-xs font-medium capitalize"
                      style={{
                        backgroundColor: designTokens.colors.primary[100],
                        color: designTokens.colors.primary[800],
                      }}
                    >
                      {selectedPaymentOption?.name || "—"} ·{" "}
                      {selectedPaymentOption?.payment_type || "—"}
                    </span>
                    <span
                      className="rounded px-2 py-1 font-mono text-xs"
                      style={{
                        backgroundColor: designTokens.colors.neutral[100],
                        color: designTokens.colors.neutral[700],
                      }}
                    >
                      {selectedPaymentOption?.transaction_reference || "—"}
                    </span>
                  </div>
                </div>

                {paymentGatewayOptions.length > 1 && (
                  <div className="col-span-full space-y-2">
                    <label
                      className="block text-xs font-medium"
                      style={{ color: designTokens.colors.neutral[700] }}
                    >
                      Payment method
                    </label>
                    <select
                      value={selectedPaymentOption?.id || ""}
                      onChange={(e) => handlePaymentOptionChange(e.target.value)}
                      className="w-full rounded border px-2 py-1 text-xs"
                      style={{
                        borderColor: designTokens.colors.neutral[300],
                        backgroundColor: designTokens.colors.neutral[0],
                      }}
                    >
                      {paymentGatewayOptions.map((option) => {
                        const optionBreakdown = option.charge_breakdown || {};
                        const optionCurrency =
                          optionBreakdown.currency || breakdownCurrency;
                        const optionTotal = Number(
                          optionBreakdown.grand_total ?? option.total ?? 0
                        );
                        const optionFee = Number(
                          optionBreakdown.total_fees ??
                          Math.max(optionTotal - baseAmount, 0)
                        );
                        return (
                          <option key={option.id} value={option.id}>
                            {`${option.name} (${option.payment_type}) • ${formatCurrency(
                              optionTotal,
                              optionCurrency
                            )} – fees ${formatCurrency(optionFee, optionCurrency)}`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4
                className="flex items-center font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                <Server className="mr-2 h-5 w-5" />
                Instances ({instances?.length || 0})
              </h4>
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {instances?.map((instance, index) => {
                  const config = instance.configuration || {};
                  const compute = config.compute || {};
                  const osImage = config.os_image || {};
                  const primaryVolume = config.primary_volume || {};
                  const additionalVolumes = Array.isArray(config.additional_volumes)
                    ? config.additional_volumes
                    : [];
                  const pricingInfo = instance.pricing || {};
                  const project = config.project || {};

                  return (
                    <div
                      key={instance.id}
                      className="rounded-lg p-3 text-sm"
                      style={{ backgroundColor: designTokens.colors.neutral[50] }}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className="font-medium"
                          style={{ color: designTokens.colors.neutral[900] }}
                        >
                          {instance.name || `Instance ${index + 1}`}
                        </span>
                        <span
                          className="rounded px-2 py-1 text-xs"
                          style={{
                            backgroundColor: designTokens.colors.primary[100],
                            color: designTokens.colors.primary[800],
                          }}
                        >
                          {instance.provider} • {instance.region}
                        </span>
                      </div>
                      <div
                        className="text-xs"
                        style={{ color: designTokens.colors.neutral[600] }}
                      >
                        Status: <span className="font-medium">{instance.status}</span>
                      </div>
                      {instance.months && (
                        <div className="text-xs text-slate-500">
                          Term: {instance.months} month{instance.months === 1 ? "" : "s"}
                        </div>
                      )}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        {compute?.name && (
                          <div>
                            <span className="font-medium text-slate-700">Compute:</span>{" "}
                            {compute.name}
                            {compute.vcpu ? ` · ${compute.vcpu} vCPU` : ""}
                            {compute.ram_mb
                              ? ` • ${Math.round(Number(compute.ram_mb) / 1024)} GB RAM`
                              : ""}
                          </div>
                        )}
                        {osImage?.name && (
                          <div>
                            <span className="font-medium text-slate-700">OS:</span>{" "}
                            {osImage.name}
                          </div>
                        )}
                        {(primaryVolume?.name || primaryVolume?.size_gb) && (
                          <div>
                            <span className="font-medium text-slate-700">
                              Primary volume:
                            </span>{" "}
                            {(primaryVolume.name || "Volume").trim()} •{" "}
                            {primaryVolume.size_gb} GB
                          </div>
                        )}
                        {additionalVolumes.length > 0 && (
                          <div>
                            <span className="font-medium text-slate-700">
                              Additional volumes:
                            </span>{" "}
                            {additionalVolumes
                              .map((vol) => {
                                const label = vol.volume_type_id
                                  ? `#${vol.volume_type_id}`
                                  : "Volume";
                                return `${label} (${vol.size_gb} GB)`;
                              })
                              .join(", ")}
                          </div>
                        )}
                        {config.security_groups?.length > 0 && (
                          <div>
                            <span className="font-medium text-slate-700">
                              Security groups:
                            </span>{" "}
                            {config.security_groups.join(", ")}
                          </div>
                        )}
                        {config.network && (
                          <div>
                            <span className="font-medium text-slate-700">Network:</span>{" "}
                            {config.network}
                          </div>
                        )}
                        {config.key_name && (
                          <div>
                            <span className="font-medium text-slate-700">SSH key:</span>{" "}
                            {config.key_name}
                          </div>
                        )}
                        {project?.name && (
                          <div>
                            <span className="font-medium text-slate-700">Project:</span>{" "}
                            {project.name}
                          </div>
                        )}
                        {config.tags?.length > 0 && (
                          <div>
                            <span className="font-medium text-slate-700">Tags:</span>{" "}
                            {config.tags.join(", ")}
                          </div>
                        )}
                      </div>
                      {pricingInfo.subtotal !== undefined && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
                          <span className="text-slate-500">Instance total</span>
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(
                              pricingInfo.subtotal,
                              pricingInfo.currency || currencyCode
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {pricingBreakdown.length > 0 && (
            <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
              <h4
                className="flex items-center font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                <Info className="mr-2 h-5 w-5 text-primary-500" />
                Order breakdown
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {pricingBreakdown.map((bundle, index) => (
                  <div
                    key={`pricing-${index}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Configuration {index + 1} • {bundle.instance_count} instance
                          {bundle.instance_count === 1 ? "" : "s"}
                        </p>
                        <p className="text-[11px] uppercase tracking-wide text-slate-400">
                          {bundle.months} month{bundle.months === 1 ? "" : "s"} term
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">Total</p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(bundle.total, bundle.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 rounded-xl bg-white px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(bundle.subtotal, bundle.currency)}</span>
                      </div>
                      {bundle.discount > 0 && (
                        <div className="flex items-center justify-between text-amber-600">
                          <span>
                            Discount
                            {bundle.discount_label ? ` (${bundle.discount_label})` : ""}
                          </span>
                          <span>-{formatCurrency(bundle.discount, bundle.currency)}</span>
                        </div>
                      )}
                      {Number(bundle.tax) > 0 && (
                        <div className="flex items-center justify-between">
                          <span>Tax</span>
                          <span>{formatCurrency(bundle.tax, bundle.currency)}</span>
                        </div>
                      )}
                    </div>
                    {Array.isArray(bundle.lines) && bundle.lines.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-[11px] font-medium text-primary-600">
                          View line items
                        </summary>
                        <div className="mt-2 space-y-1 rounded-xl border border-slate-100 bg-white px-3 py-2">
                          {bundle.lines.map((line, lineIdx) => (
                            <div
                              key={`line-${index}-${lineIdx}`}
                              className="flex items-center justify-between"
                            >
                              <span className="max-w-[60%] text-slate-600">
                                {line.name} · {line.quantity}×
                              </span>
                              <span className="font-semibold text-slate-800">
                                {formatCurrency(line.total, line.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderItems.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-slate-200 pt-4">
              <h4
                className="flex items-center font-semibold"
                style={{ color: designTokens.colors.neutral[900] }}
              >
                <Server className="mr-2 h-5 w-5" />
                Order items
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                {orderItems.map((item) => (
                  <div
                    key={`order-item-${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800">
                        {item.description ||
                          (item.instance?.name
                            ? `${item.instance.name}`
                            : `Line ${item.id}`)}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-slate-400">
                        Qty {item.quantity} · {item.itemable_type?.split("\\").pop()}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-slate-500">Unit</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.unit_price, item.currency)}
                      </p>
                      <p className="text-[11px] text-slate-500">Subtotal</p>
                      <p className="font-semibold text-slate-900">
                        {formatCurrency(item.subtotal, item.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Info className="h-4 w-4 text-primary-500" />
              {paymentStatus === "completed"
                ? "Payment completed. Provisioning underway."
                : "Verify payment information and proceed to finalize your order."}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {paymentStatus === "pending" && selectedPaymentOption && (
                <ModernButton
                  variant="secondary"
                  onClick={handlePayNow}
                  leftIcon={
                    selectedPaymentOption.payment_type?.toLowerCase() === "card" ? (
                      <CreditCard className="h-4 w-4" />
                    ) : (
                      <Server className="h-4 w-4" />
                    )
                  }
                >
                  {selectedPaymentOption.payment_type?.toLowerCase() === "card"
                    ? "Pay with card"
                    : "Bank transfer"}
                </ModernButton>
              )}
              <ModernButton
                variant="outline"
                onClick={pollTransactionStatus}
                isDisabled={isPolling}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                {isPolling ? "Checking..." : "Check status"}
              </ModernButton>
            </div>
          </div>

          {paymentStatus === "pending" &&
            selectedPaymentOption?.payment_type
              ?.toLowerCase()
              .includes("transfer") &&
            selectedPaymentOption?.details && (
              <div
                className="mt-6 rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: designTokens.colors.warning[50],
                  borderColor: designTokens.colors.warning[200],
                }}
              >
                <h5
                  className="mb-3 flex items-center font-semibold"
                  style={{ color: designTokens.colors.warning[800] }}
                >
                  <Server className="mr-2 h-4 w-4" />
                  Bank transfer details
                </h5>
                <div className="space-y-2 text-sm">
                  {selectedPaymentOption.details.account_name && (
                    <div className="flex justify-between">
                      <span style={{ color: designTokens.colors.warning[700] }}>
                        Account name:
                      </span>
                      <span
                        className="font-mono font-medium"
                        style={{ color: designTokens.colors.neutral[900] }}
                      >
                        {selectedPaymentOption.details.account_name}
                      </span>
                    </div>
                  )}
                  {selectedPaymentOption.details.account_number && (
                    <div className="flex justify-between">
                      <span style={{ color: designTokens.colors.warning[700] }}>
                        Account number:
                      </span>
                      <span
                        className="font-mono font-medium"
                        style={{ color: designTokens.colors.neutral[900] }}
                      >
                        {selectedPaymentOption.details.account_number}
                      </span>
                    </div>
                  )}
                  {selectedPaymentOption.details.bank_name && (
                    <div className="flex justify-between">
                      <span style={{ color: designTokens.colors.warning[700] }}>
                        Bank:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: designTokens.colors.neutral[900] }}
                      >
                        {selectedPaymentOption.details.bank_name}
                      </span>
                    </div>
                  )}
                  <div
                    className="flex items-center justify-between border-t border-dashed pt-2"
                    style={{ borderColor: designTokens.colors.warning[200] }}
                  >
                    <span style={{ color: designTokens.colors.warning[700] }}>
                      Amount to transfer:
                    </span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: designTokens.colors.success[700] }}
                    >
                      ₦{selectedPaymentOption.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

          {paymentStatus === "pending" && (
            <div
              className="mt-4 rounded-xl border px-4 py-3 text-sm"
              style={{
                backgroundColor: designTokens.colors.info[50],
                borderColor: designTokens.colors.info[200],
                color: designTokens.colors.info[700],
              }}
            >
              <p className="flex items-start">
                <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                {selectedPaymentOption?.payment_type?.toLowerCase().includes(
                  "transfer"
                )
                  ? 'After making the bank transfer, click "Check status" or wait for automatic verification. Your instances will be provisioned once payment is confirmed.'
                  : 'After completing payment, your instances will be automatically provisioned on Zadara. This card will update automatically, or you can click "Check status" to refresh.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
export default function MultiInstanceCreation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [configurations, setConfigurations] = useState([{
    name: '',
    description: '',
    count: 1,
    region: '', // Will be set by useEffect when regions are loaded
    project_id: '',
    product_id: '',
    os_image_id: '',
    months: 1,
    volume_types: [{ volume_type_id: '', storage_size_gb: 50 }],
    network_id: '',
    subnet_id: '',
    security_group_ids: [],
    keypair_name: '',
    floating_ip_count: 0,
    tags: []
  }]);

  const [creating, setCreating] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedConfigs, setExpandedConfigs] = useState(new Set([0]));
  const [currentStep, setCurrentStep] = useState(0);
  const [fastTrack, setFastTrack] = useState(false);
  // Admin assignment (optional)
  const [assignType, setAssignType] = useState(''); // '', 'tenant', 'user'
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Payment state
  const [paymentTransactionData, setPaymentTransactionData] = useState(null);

  // Fetch regions from API
  const { data: regions = [] } = useFetchGeneralRegions();

  // Read region/project from query params (from quote context)
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const regionParam = params.get('region');
    const projectParam = params.get('project') || params.get('project_id');
    if (regionParam) {
      setConfigurations(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], region: regionParam, project_id: projectParam || '' };
        return updated;
      });
    }
  }, [location.search]);

  // Admin lists for assignment (tenants and users)
  const { data: tenants = [] } = useFetchTenants();
  const { data: clients = [] } = useFetchClients();
  const { data: subTenantClientsResp } = useFetchSubTenantByTenantID(selectedTenantId || null, { enabled: !!selectedTenantId });
  const subTenantClients = subTenantClientsResp || [];

  // For top-level loading indicator only; per-card fetches will handle region variations
  const firstRegion = regions && regions.length > 0 ? regions[0] : null;
  const firstRegionCode = extractRegionCode(firstRegion);
  const selectedRegion = configurations[0]?.region || firstRegionCode;

  // Use product-pricing API to fetch resources based on region (for first config as baseline)
  const { data: computeInstances, isFetching: isComputeInstancesFetching } =
    useFetchProductPricing(selectedRegion, "compute_instance", {
      enabled: !!selectedRegion,
      keepPreviousData: true,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(selectedRegion, "os_image", {
      enabled: !!selectedRegion,
      keepPreviousData: true,
    });
  const { data: volumeTypes, isFetching: isVolumeTypesFetching } =
    useFetchProductPricing(selectedRegion, "volume_type", {
      enabled: !!selectedRegion,
      keepPreviousData: true,
    });
  // Fetch projects for admin filtered by region (used as baseline; cards fetch per-region too)
  const { data: projectsResponse, isFetching: isProjectsFetching } = useFetchProjects(
    { per_page: 100, region: selectedRegion },
    { keepPreviousData: true }
  );
  const projects = projectsResponse?.data || [];

  const loading = isProjectsFetching || isComputeInstancesFetching || isOsImagesFetching || isVolumeTypesFetching;
  const isInitialLoading =
    loading &&
    !computeInstances &&
    !osImages &&
    !volumeTypes &&
    projects.length === 0;

  // Set default region when regions are loaded and no region is set
  useEffect(() => {
    if (regions.length === 0) {
      return;
    }

    setConfigurations(prev => {
      if (prev[0]?.region) {
        return prev;
      }

      const defaultRegion = extractRegionCode(regions[0]);
      if (!defaultRegion) {
        return prev;
      }
      return [
        { ...prev[0], region: defaultRegion },
        ...prev.slice(1)
      ];
    });
  }, [regions]);

  // Update configuration
  const updateConfiguration = (index, updatedConfig) => {
    const newConfigs = [...configurations];
    newConfigs[index] = updatedConfig;
    setConfigurations(newConfigs);
    setErrors({}); // Clear errors when user makes changes
  };

  // Add new configuration
  const addConfiguration = () => {
    const first = regions && regions.length > 0 ? regions[0] : null;
    const defaultRegionCode = extractRegionCode(first);
    const newConfig = {
      name: '',
      description: '',
      count: 1,
      region: defaultRegionCode || '',
      project_id: '',
      product_id: '',
      os_image_id: '',
      months: 1,
      volume_types: [{ volume_type_id: '', storage_size_gb: 50 }],
      network_id: '',
      subnet_id: '',
      security_group_ids: [],
      key_pair_id: '',
      floating_ip_count: 0,
      tags: []
    };

    const newConfigurations = [...configurations, newConfig];
    setConfigurations(newConfigurations);
    setExpandedConfigs(new Set([...expandedConfigs, newConfigurations.length - 1]));
  };

  // Delete configuration
  const deleteConfiguration = (index) => {
    if (configurations.length === 1) {
      ToastUtils.warning('You must have at least one configuration');
      return;
    }

    const newConfigs = configurations.filter((_, i) => i !== index);
    setConfigurations(newConfigs);

    // Update expanded configs
    const newExpanded = new Set();
    expandedConfigs.forEach(i => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedConfigs(newExpanded);
  };

  // Duplicate configuration
  const duplicateConfiguration = (index) => {
    const configToDuplicate = { ...configurations[index] };
    configToDuplicate.name = configToDuplicate.name + ' (Copy)';

    const newConfigurations = [...configurations];
    newConfigurations.splice(index + 1, 0, configToDuplicate);
    setConfigurations(newConfigurations);

    setExpandedConfigs(new Set([...expandedConfigs, index + 1]));
  };

  // Toggle configuration expansion
  const toggleConfigExpansion = (index) => {
    const newExpanded = new Set(expandedConfigs);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedConfigs(newExpanded);
  };

  // Validate configurations before preview/create
  const validateForPricing = () => {
    const newErrors = {};
    if (!configurations.length) {
      newErrors.instances = ["Add at least one configuration before continuing."];
      setErrors(newErrors);
      ToastUtils.warning("Add at least one configuration before continuing.");
      return false;
    }

    configurations.forEach((c, i) => {
      // region or project_id (identifier) must exist
      if (!c.region && !c.project_id) {
        newErrors[`instances.${i}.region`] = ["Region or Project is required."];
        newErrors[`instances.${i}.project_id`] = ["Region or Project is required."];
      }
      if (!c.compute_instance_id) {
        newErrors[`instances.${i}.compute_instance_id`] = ["Instance Type is required."];
      }
      if (!c.os_image_id) {
        newErrors[`instances.${i}.os_image_id`] = ["OS Image is required."];
      }
      if (!c.months || Number(c.months) < 1) {
        newErrors[`instances.${i}.months`] = ["Months must be at least 1."];
      }
      if (!c.count || Number(c.count) < 1) {
        newErrors[`instances.${i}.count`] = ["Number of instances must be at least 1."];
      }
      if (Array.isArray(c.volume_types) && c.volume_types.length > 0) {
        c.volume_types.forEach((v, vi) => {
          if (!v.volume_type_id) {
            newErrors[`instances.${i}.volume_types.${vi}.volume_type_id`] = ["Volume Type is required."];
          }
          if (!v.storage_size_gb || Number(v.storage_size_gb) < 1) {
            newErrors[`instances.${i}.volume_types.${vi}.storage_size_gb`] = ["Size must be at least 1 GiB."];
          }
        });
      } else {
        newErrors[`instances.${i}.volume_types`] = ["At least one volume definition is required."];
      }
      if (c.bandwidth_id && (!c.bandwidth_count || Number(c.bandwidth_count) < 1)) {
        newErrors[`instances.${i}.bandwidth_count`] = ["Bandwidth count must be at least 1 when bandwidth is selected."];
      }
      if (c.cross_connect_id && (!c.cross_connect_count || Number(c.cross_connect_count) < 1)) {
        newErrors[`instances.${i}.cross_connect_count`] = ["Cross connect count must be at least 1 when cross connect is selected."];
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      ToastUtils.warning("Please fill the required fields before calculating pricing.");
      return false;
    }
    return true;
  };

  // Get pricing preview
  const getPricingPreview = async () => {
    // Local validation before calling API
    if (!validateForPricing()) return;
    // Auto-fill region for any config missing it
    setConfigurations(prev => prev.map(c => ({ ...c, region: c.region || selectedRegion || firstRegionCode || c.region })));

    setPricingLoading(true);

    try {
      const { token } = useAdminAuthStore.getState();
      const response = await fetch(`${config.baseURL}/business/instances/preview-pricing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          pricing_requests: configurations.map(c => ({
            region: c.region || selectedRegion || firstRegionCode || undefined,
            project_id: c.project_id || undefined,
            compute_instance_id: c.compute_instance_id ? Number(c.compute_instance_id) : undefined,
            os_image_id: c.os_image_id ? Number(c.os_image_id) : undefined,
            months: Number(c.months),
            number_of_instances: Number(c.count || 1),
            volume_types: (c.volume_types || []).filter(v => v.volume_type_id).map(v => ({
              volume_type_id: Number(v.volume_type_id),
              storage_size_gb: Number(v.storage_size_gb),
            })),
            bandwidth_id: c.bandwidth_id ? Number(c.bandwidth_id) : undefined,
            bandwidth_count: c.bandwidth_id ? Number(c.bandwidth_count || 1) : undefined,
            ...(c.floating_ip_count > 0 ? { floating_ip_count: Number(c.floating_ip_count) } : {}),
            network_id: c.network_id ? Number(c.network_id) : undefined,
            subnet_id: c.subnet_id ? Number(c.subnet_id) : undefined,
            security_group_ids: (c.security_group_ids || []).length ? c.security_group_ids.map(Number) : undefined,
            keypair_name: c.keypair_name || undefined,
          })),
          fast_track: fastTrack,
          ...(assignType === 'tenant' && selectedTenantId ? { tenant_id: Number(selectedTenantId) } : {}),
          ...(assignType === 'user' && selectedUserId ? { user_id: Number(selectedUserId) } : {}),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPricing(data.data);
        ToastUtils.success('Pricing calculated successfully');
      } else {
        if (data.errors) {
          setErrors(data.errors);
          const first = Object.values(data.errors)[0];
          const msg = Array.isArray(first) ? first[0] : (data.message || 'Validation failed');
          throw new Error(msg);
        }
        throw new Error(data.message || 'Validation failed');
      }
    } catch (err) {
      ToastUtils.error('Failed to calculate pricing: ' + err.message);
      setPricing(null);
    } finally {
      setPricingLoading(false);
    }
  };

  // Create instances
  const createInstances = async () => {
    setCreating(true);
    setErrors({});
    setPaymentTransactionData(null);

    try {
      const { token } = useAdminAuthStore.getState();
      const payload = {
        pricing_requests: configurations.map(c => ({
          region: c.region || selectedRegion || firstRegionCode || undefined,
          project_id: c.project_id || undefined,
          compute_instance_id: c.compute_instance_id ? Number(c.compute_instance_id) : undefined,
          os_image_id: c.os_image_id ? Number(c.os_image_id) : undefined,
          months: Number(c.months),
          number_of_instances: Number(c.count || 1),
          volume_types: (c.volume_types || []).filter(v => v.volume_type_id).map(v => ({
            volume_type_id: Number(v.volume_type_id),
            storage_size_gb: Number(v.storage_size_gb),
          })),
          bandwidth_id: c.bandwidth_id ? Number(c.bandwidth_id) : undefined,
          bandwidth_count: c.bandwidth_id ? Number(c.bandwidth_count || 1) : undefined,
          ...(c.floating_ip_count > 0 ? { floating_ip_count: Number(c.floating_ip_count) } : {}),
          cross_connect_id: c.cross_connect_id ? Number(c.cross_connect_id) : undefined,
          cross_connect_count: c.cross_connect_id ? Number(c.cross_connect_count || 1) : undefined,
          network_id: c.network_id ? Number(c.network_id) : undefined,
          subnet_id: c.subnet_id ? Number(c.subnet_id) : undefined,
          security_group_ids: (c.security_group_ids || []).length ? c.security_group_ids.map(Number) : undefined,
          keypair_name: c.keypair_name || undefined,
        })),
        fast_track: fastTrack,
        ...(assignType === 'tenant' && selectedTenantId ? { tenant_id: Number(selectedTenantId) } : {}),
        ...(assignType === 'user' && selectedUserId ? { user_id: Number(selectedUserId) } : {}),
        ...(configurations.some(c => (c.tags || []).length) ? { tags: Array.from(new Set((configurations.flatMap(c => c.tags || [])))) } : {})
      };
      const idempotencyKey = `multi-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const response = await fetch(`${config.baseURL}/business/instances/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data?.payment?.required && !data.data?.fast_track_completed) {
          setPaymentTransactionData(data);
          setCurrentStep(PAYMENT_STEP_INDEX);
          ToastUtils.info('Payment required. Please complete payment to proceed.');
        } else {
          // Fast-track completed - redirect to instances page to see details
          ToastUtils.success(data.message || 'Instances created successfully!');

          // Redirect to instances page
          setTimeout(() => {
            window.location.href = '/admin-dashboard/instances';
          }, 2000);
        }
      } else {
        if (data.errors) {
          setErrors(data.errors);
          ToastUtils.error('Please fix the validation errors');
        } else {
          throw new Error(data.message);
        }
      }
    } catch (err) {
      ToastUtils.error('Failed to create instances: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle payment completion
  const handlePaymentComplete = (_completedTransaction) => {
    ToastUtils.success('Payment completed! Your instances are being provisioned.');

    setTimeout(() => {
      window.location.href = '/admin-dashboard/instances';
    }, 2000);
  };

  const totalInstances = configurations.reduce((sum, config) => sum + (config.count || 0), 0);
  const selectedTenant = tenants?.find(
    (tenant) => String(tenant.id) === String(selectedTenantId)
  );
  const scopedClients = selectedTenantId ? subTenantClients : clients;
  const selectedUser = scopedClients?.find(
    (client) => String(client.id) === String(selectedUserId)
  );

  const configurationStepReady = useMemo(() => {
    if (!configurations.length) {
      return false;
    }

    return configurations.every((config) => {
      const hasLocation = Boolean(config.region || config.project_id);
      const hasCompute = Boolean(config.compute_instance_id);
      const hasImage = Boolean(config.os_image_id);
      const validCount = Number(config.count) > 0;
      const validMonths = Number(config.months) > 0;
      const volumesValid =
        Array.isArray(config.volume_types) &&
        config.volume_types.length > 0 &&
        config.volume_types.every(
          (volume) =>
            Boolean(volume.volume_type_id) &&
            Number(volume.storage_size_gb) > 0
        );

      return (
        hasLocation && hasCompute && hasImage && validCount && validMonths && volumesValid
      );
    });
  }, [configurations]);

  const PAYMENT_STEP_INDEX = 3;
  const steps = ["Assignment", "Configurations", "Review & Launch", "Payment"];
  const stepDescriptions = [
    "Connect this deployment to the right owner and optional recipients.",
    "Define compute, storage, and networking for each batch.",
    "Verify pricing, toggle fast track, and launch the deployment.",
    "Complete payment to release provisioning.",
  ];
  const stepDescription =
    currentStep === 1 && !configurationStepReady
      ? "Complete required configuration details before continuing to review."
      : currentStep === PAYMENT_STEP_INDEX && !paymentTransactionData
        ? "Create an order from the review step to generate payment instructions."
        : stepDescriptions[currentStep] || stepDescriptions[0];

  const handleNextStep = () => {
    if (currentStep === 1) {
      const isValid = validateForPricing();
      if (!configurationStepReady || !isValid) {
        return;
      }
    }
    if (currentStep === PAYMENT_STEP_INDEX - 1) {
      if (!paymentTransactionData) {
        ToastUtils.info("Launch an order first to generate payment instructions.");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBackStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const disableContinue =
    (currentStep === 1 && !configurationStepReady) ||
    currentStep === PAYMENT_STEP_INDEX - 1;

  const renderAssignmentCard = () => (
    <ModernCard padding="lg" className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Assignment (admin only)
          </h3>
          <p className="text-xs text-slate-500">
            Route this deployment to a tenant or client workspace for easier follow-up.
          </p>
        </div>
        <StatusPill
          label={
            assignType
              ? `${assignType === "tenant" ? "Tenant" : "User"} assignment`
              : "Optional"
          }
          tone={assignType ? "info" : "neutral"}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: "", label: "Unassigned" },
          { value: "tenant", label: "Tenant" },
          { value: "user", label: "User" },
        ].map((option) => (
          <button
            key={option.value || "none"}
            type="button"
            onClick={() => {
              setAssignType(option.value);
              setSelectedTenantId("");
              setSelectedUserId("");
            }}
            className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${assignType === option.value
                ? "border-primary-400 bg-primary-50 text-primary-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
              }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Assign to
          </label>
          <select
            value={assignType}
            onChange={(e) => {
              const value = e.target.value;
              setAssignType(value);
              setSelectedTenantId("");
              setSelectedUserId("");
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
          >
            <option value="">None</option>
            <option value="tenant">Tenant</option>
            <option value="user">User (Client)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            Tenant
          </label>
          <select
            value={selectedTenantId}
            onChange={(e) => {
              setSelectedTenantId(e.target.value);
              setSelectedUserId("");
            }}
            disabled={assignType !== "tenant" && assignType !== "user"}
            className={`w-full rounded-2xl border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ${assignType ? "bg-white" : "bg-slate-50 text-slate-400"
              }`}
          >
            <option value="">
              {assignType ? "Select tenant" : "Choose assignment type"}
            </option>
            {tenants?.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name || tenant.company_name || `Tenant ${tenant.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-slate-500">
            User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={assignType !== "user"}
            className={`w-full rounded-2xl border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 ${assignType === "user" ? "bg-white" : "bg-slate-50 text-slate-400"
              }`}
          >
            <option value="">
              {assignType === "user" ? "Select user" : "Choose user assignment"}
            </option>
            {scopedClients?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name ||
                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  user.email ||
                  `User ${user.id}`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        Current assignment:{" "}
        <span className="font-medium text-slate-700">
          {assignType === "tenant" && selectedTenant
            ? selectedTenant.name || selectedTenant.company_name
            : assignType === "user" && selectedUser
              ? selectedUser.name ||
              `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() ||
              selectedUser.email
              : "Not assigned"}
        </span>
      </div>
    </ModernCard>
  );

  const renderConfigurationsStep = () => (
    <>
      <ModernCard padding="lg" className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-900">
          Build configurations
        </h3>
        <p className="text-xs text-slate-500">
          Configure compute, storage, networking, and optional add-ons for each batch. Duplicate an existing configuration to accelerate similar builds.
        </p>
      </ModernCard>
      <div className="space-y-6">
        {configurations.map((config, index) => (
          <InstanceConfigCard
            key={index}
            config={config}
            index={index}
            onUpdate={updateConfiguration}
            onDelete={deleteConfiguration}
            onDuplicate={duplicateConfiguration}
            resources={{
              compute_instances: computeInstances || [],
              os_images: osImages || [],
              volume_types: volumeTypes || [],
              regions: regions,
              projects: projects,
            }}
            errors={errors}
            isExpanded={expandedConfigs.has(index)}
            onToggleExpand={toggleConfigExpansion}
          />
        ))}
      </div>
      <ModernButton
        variant="primary"
        onClick={addConfiguration}
        leftIcon={<Plus className="h-4 w-4" />}
      >
        Add another configuration
      </ModernButton>
    </>
  );

  const renderReviewStep = () => (
    <ModernCard padding="lg" className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <button
          type="button"
          onClick={() => setFastTrack(!fastTrack)}
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${fastTrack
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
            }`}
        >
          <div
            className={`relative h-5 w-10 rounded-full transition ${fastTrack ? "bg-emerald-500/80" : "bg-slate-200"
              }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${fastTrack ? "right-1" : "left-1"
                }`}
            />
          </div>
          <div>
            <p className="font-medium">
              {fastTrack ? "Fast track enabled" : "Enable fast track"}
            </p>
            <p className="text-xs">
              {fastTrack
                ? "Instances begin provisioning immediately after payment."
                : "Keep this off to review the order before provisioning."}
            </p>
          </div>
        </button>
        <div className="flex flex-wrap gap-3">
          <ModernButton
            variant="outline"
            onClick={getPricingPreview}
            isDisabled={pricingLoading || totalInstances === 0}
            isLoading={pricingLoading}
            leftIcon={<Calculator className="h-4 w-4" />}
          >
            Calculate pricing
          </ModernButton>
          <ModernButton
            variant="ghost"
            onClick={() => (window.location.href = "/admin-dashboard/projects")}
          >
            Cancel
          </ModernButton>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Info className="h-4 w-4 text-primary-500" />
          {totalInstances > 0
            ? `Ready to create ${totalInstances} instance${totalInstances === 1 ? "" : "s"}`
            : "Configure at least one instance to continue."}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ModernButton
            variant="secondary"
            onClick={() => {
              if (!paymentTransactionData) {
                ToastUtils.info("Launch an order first to generate payment instructions.");
                return;
              }
              setCurrentStep(PAYMENT_STEP_INDEX);
            }}
            isDisabled={!paymentTransactionData || creating}
            leftIcon={<CreditCard className="h-4 w-4" />}
          >
            Go to payment
          </ModernButton>
          <button
            onClick={() => {
              if (!pricing) {
                ToastUtils.warning("Please calculate pricing before launching.");
                return;
              }
              createInstances();
            }}
            disabled={creating || totalInstances === 0}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-2xl px-6 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-4 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: fastTrack
                ? `linear-gradient(135deg, ${designTokens.colors.success[400]} 0%, ${designTokens.colors.success[600]} 50%, ${designTokens.colors.success[700]} 100%)`
                : `linear-gradient(135deg, ${designTokens.colors.primary[400]} 0%, ${designTokens.colors.primary[600]} 50%, ${designTokens.colors.primary[700]} 100%)`,
              boxShadow: fastTrack
                ? `0 12px 35px -8px ${designTokens.colors.success[500]}60`
                : `0 12px 35px -8px ${designTokens.colors.primary[500]}60`,
            }}
          >
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-30">
              <div className="h-full w-full bg-white/60" />
            </div>
            <div className="relative flex items-center gap-2">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {fastTrack ? "Launching instances…" : "Creating order…"}
                  </span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>{fastTrack ? "Launch now" : "Create order"}</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </ModernCard>
  );

  const renderPaymentStep = () => {
    if (!paymentTransactionData) {
      return (
        <ModernCard padding="lg" className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Payment pending
          </h3>
          <p className="text-xs text-slate-500">
            Generate an order from the review step to unlock payment instructions. Once an order is created, your payment summary will appear here.
          </p>
          <ModernButton
            variant="primary"
            onClick={() => setCurrentStep(PAYMENT_STEP_INDEX - 1)}
            leftIcon={<ChevronLeft className="h-4 w-4" />}
          >
            Back to review
          </ModernButton>
        </ModernCard>
      );
    }

    return (
      <InlinePaymentPanel
        transactionData={paymentTransactionData}
        onPaymentComplete={handlePaymentComplete}
        onModifyOrder={() => setCurrentStep(PAYMENT_STEP_INDEX - 1)}
      />
    );
  };

  const renderPrimaryContent = () => {
    switch (currentStep) {
      case 0:
        return renderAssignmentCard();
      case 1:
        return renderConfigurationsStep();
      case 2:
        return renderReviewStep();
      case PAYMENT_STEP_INDEX:
        return renderPaymentStep();
      default:
        return renderAssignmentCard();
    }
  };

  const renderSidebarContent = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-6 2xl:sticky 2xl:top-24">
          <ModernCard padding="lg" className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Deployment guide
            </h3>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                <span>Step 1: Assign the deployment so billing and notifications go to the right workspace.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                <span>Step 2: Build configurations for each workload you want to launch.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                <span>Step 3: Review pricing, optionally fast-track, and kick off provisioning.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                <span>Step 4: Complete payment and monitor provisioning automatically.</span>
              </li>
            </ul>
          </ModernCard>
        </div>
      );
    }
    if (currentStep === PAYMENT_STEP_INDEX) {
      const transaction = paymentTransactionData?.data?.transaction;
      const paymentMeta = paymentTransactionData?.data?.payment;

      return (
        <div className="space-y-6 2xl:sticky 2xl:top-24">
          <ModernCard padding="lg" className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Payment summary
            </h3>
            <dl className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt>Amount</dt>
                <dd className="font-semibold text-slate-900">
                  {transaction?.currency} {transaction?.amount?.toLocaleString()}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Transaction ID</dt>
                <dd className="font-mono text-xs text-slate-500">
                  {transaction?.identifier || transaction?.id || "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Expires</dt>
                <dd className="text-sm text-slate-500">
                  {paymentMeta?.expires_at
                    ? new Date(paymentMeta.expires_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
          </ModernCard>
          <ModernCard padding="lg" className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Need help?
            </h3>
            <p className="text-xs text-slate-500">
              Payments verify automatically. If a transfer is delayed, click “Check Status” below the payment details or contact billing support with your transaction reference.
            </p>
          </ModernCard>
        </div>
      );
    }

    return (
      <div className="space-y-6 2xl:sticky 2xl:top-24">
        <ModernCard padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Pricing snapshot
            </h3>
            <StatusPill
              label={pricing ? "Preview ready" : "Action needed"}
              tone={pricing ? "success" : "warning"}
            />
          </div>
          {pricing ? (
            <div className="space-y-3 text-sm text-slate-600">
              {Array.isArray(pricing.previews) &&
                pricing.previews.map((preview) => (
                  <div
                    key={preview.index}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <p className="font-semibold text-slate-800">
                      Config {preview.index + 1} • {preview.count} item
                      {preview.count === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs">
                      {preview.currency} {preview.total_price} total • {preview.currency}{" "}
                      {preview.unit_price} / instance
                    </p>
                  </div>
                ))}
              <div className="rounded-xl bg-white px-3 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  Grand total
                </p>
                <p className="text-lg font-semibold text-slate-900">
                  {pricing.currency} {pricing.grand_total}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Run a pricing preview to unlock cost projections and payment options.
            </p>
          )}
        </ModernCard>

        <ModernCard padding="lg" className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Assignment summary
          </h3>
          <dl className="space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <dt>Scope</dt>
              <dd className="font-medium text-slate-900">
                {assignType ? assignType.toUpperCase() : "Not assigned"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Tenant</dt>
              <dd className="font-medium text-slate-900">
                {selectedTenant
                  ? selectedTenant.name || selectedTenant.company_name
                  : "—"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>User</dt>
              <dd className="font-medium text-slate-900">
                {selectedUser
                  ? selectedUser.name ||
                  `${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() ||
                  selectedUser.email
                  : "—"}
              </dd>
            </div>
          </dl>
        </ModernCard>

        <ModernCard padding="lg" className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Launch checklist
          </h3>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>
                Confirm each configuration has region, compute type, and OS image defined.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>
                Run a pricing preview to confirm estimated spend before issuing the order.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span>
                Decide whether to enable fast track to start provisioning immediately.
              </span>
            </li>
          </ul>
        </ModernCard>
      </div>
    );
  };

  const renderNavigationCard = () => {
    if (currentStep === PAYMENT_STEP_INDEX) {
      return null;
    }

    const nextStepMessage =
      currentStep === steps.length - 1
        ? "Review totals and use the actions below to launch."
        : currentStep === 1 && !configurationStepReady
          ? "Fill in the required configuration details to unlock the review step."
          : stepDescriptions[currentStep + 1];

    const showContinue =
      currentStep < steps.length - 1 && currentStep !== PAYMENT_STEP_INDEX - 1;

    return (
      <ModernCard
        padding="lg"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-sm text-slate-600">{nextStepMessage}</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {currentStep > 0 && (
            <ModernButton variant="ghost" onClick={handleBackStep}>
              Back
            </ModernButton>
          )}
          {showContinue && (
            <ModernButton
              variant="primary"
              onClick={handleNextStep}
              isDisabled={disableContinue}
            >
              Continue
            </ModernButton>
          )}
        </div>
      </ModernCard>
    );
  };

  const headerMeta = (
    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
      <StatusPill
        label={`Step ${currentStep + 1} of ${steps.length}`}
        tone={currentStep + 1 === steps.length ? "success" : "info"}
      />
      <span>{steps[currentStep]}</span>
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>
        {totalInstances} instance{totalInstances === 1 ? "" : "s"}
      </span>
      <span className="hidden sm:inline text-gray-300">•</span>
      <span>
        {configurations.length} configuration
        {configurations.length === 1 ? "" : "s"}
      </span>
      {currentStep === PAYMENT_STEP_INDEX && paymentTransactionData && (
        <>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span>
            Payment{" "}
            {(paymentTransactionData?.data?.transaction?.status || "pending")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (char) => char.toUpperCase())}
          </span>
        </>
      )}
    </div>
  );

  if (isInitialLoading) {
    return (
      <>
        <AdminHeadbar onMenuClick={toggleMobileMenu} />
        <AdminSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <AdminPageShell
          breadcrumbs={[
            { label: "Home", href: "/admin-dashboard" },
            { label: "Instances", href: "/admin-dashboard/instances" },
            { label: "Multi Instance Creation" },
          ]}
          title="Multi-Instance Creation"
          description="Create multiple instances with different configurations in a single request."
          subHeaderContent={headerMeta}
          contentClassName="flex min-h-[60vh] items-center justify-center"
        >
          <div className="text-center space-y-2">
            <Loader2
              className="w-8 h-8 animate-spin mx-auto"
              style={{ color: designTokens.colors.primary[500] }}
            />
            <p style={{ color: designTokens.colors.neutral[700] }}>
              Loading resources...
            </p>
          </div>
        </AdminPageShell>
      </>
    );
  }

  const sidebarContent = renderSidebarContent();
  const layoutClass = sidebarContent
    ? "grid gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] 2xl:items-start"
    : "space-y-8";

  return (
    <>
      <AdminHeadbar onMenuClick={toggleMobileMenu} />
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <AdminPageShell
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Instances", href: "/admin-dashboard/instances" },
          { label: "Multi Instance Creation" },
        ]}
        title="Multi-Instance Creation"
        description="Create multiple instances with different configurations in a single request."
        subHeaderContent={headerMeta}
        contentClassName="space-y-8"
      >
        <ModernCard
          padding="lg"
          className="overflow-hidden border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-100 shadow-sm"
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-primary-700">
                <StatusPill
                  label={`Step ${currentStep + 1} of ${steps.length}`}
                  tone={currentStep + 1 === steps.length ? "success" : "info"}
                />
                <span className="text-sm font-medium text-primary-700">
                  {steps[currentStep]}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                Multi-instance launch console
              </h2>
              <p className="max-w-2xl text-sm text-primary-700 md:text-base">
                {stepDescription}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-primary-700 sm:text-sm">
                <StatusPill
                  label={`${totalInstances} instance${totalInstances === 1 ? "" : "s"}`}
                  tone="info"
                />
                <StatusPill
                  label={`${configurations.length} configuration${configurations.length === 1 ? "" : "s"}`}
                  tone="neutral"
                />
              </div>
            </div>
            <div className="w-full max-w-xl rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur">
              <StepProgress currentStep={currentStep} steps={steps} />
            </div>
          </div>
        </ModernCard>

        <div className={layoutClass}>
          <div className="space-y-6">
            {renderPrimaryContent()}
            {renderNavigationCard()}
          </div>
          {sidebarContent}
        </div>
      </AdminPageShell>
    </>
  );
}
