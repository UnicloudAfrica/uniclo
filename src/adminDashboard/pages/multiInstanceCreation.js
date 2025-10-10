import React, { useState, useEffect } from "react";
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
  ChevronRight,
  Info
} from "lucide-react";

import AdminHeadbar from "../components/adminHeadbar";
import AdminSidebar from "../components/adminSidebar";
import AdminActiveTab from "../components/adminActiveTab";
import ToastUtils from "../../utils/toastUtil";
import { useFetchProductPricing, useFetchGeneralRegions } from "../../hooks/resource";
import { useFetchInstanceRequests } from "../../hooks/adminHooks/instancesHook";
import useAdminAuthStore from "../../stores/adminAuthStore";
import config from "../../config";

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
  const [localConfig, setLocalConfig] = useState(config);

  const updateConfig = (field, value) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onUpdate(index, updated);
  };

  const updateVolumeType = (volumeIndex, field, value) => {
    const volumeTypes = [...(localConfig.volume_types || [])];
    volumeTypes[volumeIndex] = { ...volumeTypes[volumeIndex], [field]: value };
    updateConfig('volume_types', volumeTypes);
  };

  const addVolumeType = () => {
    const volumeTypes = [...(localConfig.volume_types || [])];
    volumeTypes.push({ volume_type_id: '', storage_size_gb: 50 });
    updateConfig('volume_types', volumeTypes);
  };

  const removeVolumeType = (volumeIndex) => {
    const volumeTypes = [...(localConfig.volume_types || [])];
    volumeTypes.splice(volumeIndex, 1);
    updateConfig('volume_types', volumeTypes);
  };

  const getErrorForField = (field) => {
    return errors[`instances.${index}.${field}`]?.[0] || errors[field]?.[0];
  };

  const selectedProduct = resources?.compute_instances?.find(p => p.id === localConfig.product_id);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onToggleExpand(index)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Configuration #{index + 1}: {localConfig.name || 'Untitled'}
              </h3>
              <p className="text-sm text-gray-500">
                {localConfig.count || 1} instance(s) • {selectedProduct?.name || 'No product selected'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDuplicate(index)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="Duplicate Configuration"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(index)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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
                value={localConfig.name || ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder="Enter instance name"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  getErrorForField('name') ? 'border-red-300' : 'border-gray-300'
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
                value={localConfig.count || 1}
                onChange={(e) => updateConfig('count', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  getErrorForField('count') ? 'border-red-300' : 'border-gray-300'
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
              value={localConfig.description || ''}
              onChange={(e) => updateConfig('description', e.target.value)}
              placeholder="Enter instance description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Infrastructure Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <Server className="w-5 h-5 mr-2" />
              Infrastructure Configuration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region *
                </label>
                <select
                  value={localConfig.region || ''}
                  onChange={(e) => updateConfig('region', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('region') ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Region</option>
                  {resources?.regions?.map(region => (
                    <option key={region.id} value={region.code}>
                      {region.name} ({region.code})
                    </option>
                  ))}
                </select>
                {getErrorForField('region') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('region')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project *
                </label>
                <select
                  value={localConfig.project_id || ''}
                  onChange={(e) => updateConfig('project_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('project_id') ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Project</option>
                  {resources?.projects?.map(project => (
                    <option key={project.id} value={project.identifier}>
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
                  value={localConfig.months || 1}
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
                  value={localConfig.product_id || ''}
                  onChange={(e) => updateConfig('product_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('product_id') ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Instance Type</option>
                  {resources?.compute_instances?.map(instance => (
                    <option key={instance.id} value={instance.id}>
                      {instance.name} ({instance.vcpus} vCPUs, {Math.round(instance.memory_mb / 1024)} GB RAM) - ${instance.hourly_rate}/hr
                    </option>
                  ))}
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
                  value={localConfig.os_image_id || ''}
                  onChange={(e) => updateConfig('os_image_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('os_image_id') ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select OS Image</option>
                  {resources?.os_images?.map(image => (
                    <option key={image.id} value={image.id}>
                      {image.name} ({image.family})
                    </option>
                  ))}
                </select>
                {getErrorForField('os_image_id') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('os_image_id')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Storage Configuration */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 flex items-center">
              <HardDrive className="w-5 h-5 mr-2" />
              Storage Configuration
            </h4>

            {(localConfig.volume_types || []).map((volume, volumeIndex) => (
              <div key={volumeIndex} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">
                    Volume {volumeIndex + 1} {volumeIndex === 0 ? '(Boot Volume)' : ''}
                  </h5>
                  {volumeIndex > 0 && (
                    <button
                      onClick={() => removeVolumeType(volumeIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Volume Type</option>
                      {resources?.volume_types?.map(vt => (
                        <option key={vt.id} value={vt.id}>
                          {vt.name} ({vt.description})
                        </option>
                      ))}
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
              onClick={addVolumeType}
              className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
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
                  Network *
                </label>
                <select
                  value={localConfig.network_id || ''}
                  onChange={(e) => updateConfig('network_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('network_id') ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Network</option>
                  {resources?.networks?.map(network => (
                    <option key={network.id} value={network.id}>
                      {network.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subnet ID *
                </label>
                <input
                  type="text"
                  value={localConfig.subnet_id || ''}
                  onChange={(e) => updateConfig('subnet_id', e.target.value)}
                  placeholder="Enter subnet ID"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('subnet_id') ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floating IPs
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={localConfig.floating_ip_count || 0}
                  onChange={(e) => updateConfig('floating_ip_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Groups *
                </label>
                <select
                  multiple
                  value={localConfig.security_group_ids || []}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    updateConfig('security_group_ids', values);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 ${
                    getErrorForField('security_group_ids') ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {resources?.security_groups?.map(sg => (
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
                  value={localConfig.key_pair_id || ''}
                  onChange={(e) => updateConfig('key_pair_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Key Pair</option>
                  {resources?.key_pairs?.map(kp => (
                    <option key={kp.id} value={kp.id}>
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
              value={(localConfig.tags || []).join(', ')}
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
    key_pair_id: '',
    floating_ip_count: 0,
    tags: []
  }]);

  const [creating, setCreating] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedConfigs, setExpandedConfigs] = useState(new Set([0]));
  const [activeStep, setActiveStep] = useState(0);

  // Fetch regions from API
  const { data: regions = [] } = useFetchGeneralRegions();

  // Get the region from the first configuration to fetch resources dynamically
  const selectedRegion = configurations[0]?.region || (regions.length > 0 ? regions[0].code : '');

  // Use product-pricing API to fetch resources based on region
  const { data: computeInstances, isFetching: isComputeInstancesFetching } =
    useFetchProductPricing(selectedRegion, "compute_instance", {
      enabled: !!selectedRegion,
    });
  const { data: osImages, isFetching: isOsImagesFetching } =
    useFetchProductPricing(selectedRegion, "os_image", {
      enabled: !!selectedRegion,
    });
  const { data: volumeTypes, isFetching: isVolumeTypesFetching } =
    useFetchProductPricing(selectedRegion, "volume_type", {
      enabled: !!selectedRegion,
    });
  
  const projects = [
    { id: 1, identifier: "ED4E3B", name: "CRM LW2O", description: null, default_region: "lagos-1", default_provider: "zadara" }
  ];

  const loading = isComputeInstancesFetching || isOsImagesFetching || isVolumeTypesFetching;

  // Set default region when regions are loaded and no region is set
  useEffect(() => {
    if (regions.length > 0 && !configurations[0]?.region) {
      const defaultRegion = regions[0].code;
      setConfigurations(prev => [
        { ...prev[0], region: defaultRegion },
        ...prev.slice(1)
      ]);
    }
  }, [regions, configurations]);

  // Update configuration
  const updateConfiguration = (index, updatedConfig) => {
    const newConfigs = [...configurations];
    newConfigs[index] = updatedConfig;
    setConfigurations(newConfigs);
    setErrors({}); // Clear errors when user makes changes
  };

  // Add new configuration
  const addConfiguration = () => {
    const newConfig = {
      name: '',
      description: '',
      count: 1,
      region: regions.length > 0 ? regions[0].code : '', // Use first available region
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

  // Get pricing preview
  const getPricingPreview = async () => {
    setPricingLoading(true);
    
    try {
      const { token } = useAdminAuthStore.getState();
      const response = await fetch(`${config.baseURL}/business/multi-instances/preview-pricing`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          instances: configurations.map(config => ({
            count: config.count,
            region: config.region,
            product_id: config.product_id,
            months: config.months,
            volume_types: config.volume_types.filter(vt => vt.volume_type_id),
            bandwidth_id: config.bandwidth_id || null,
            bandwidth_count: config.bandwidth_count || null,
            floating_ip_count: config.floating_ip_count || 0,
          }))
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setPricing(data.data);
        ToastUtils.success('Pricing calculated successfully');
      } else {
        throw new Error(data.message);
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

    try {
      const { token } = useAdminAuthStore.getState();
      const response = await fetch(`${config.baseURL}/business/multi-instances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          instances: configurations,
          fast_track: false
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        ToastUtils.success(data.message);
        
        // Redirect to instances management or show success page
        setTimeout(() => {
          window.location.href = '/admin-dashboard/enhanced-instance-management';
        }, 2000);
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

  const totalInstances = configurations.reduce((sum, config) => sum + (config.count || 0), 0);

  if (loading) {
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-700">Loading resources...</p>
          </div>
        </main>
      </>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Multi-Instance Creation</h1>
              <p className="text-sm text-gray-500 mt-1">
                Create multiple instances with different configurations in a single request
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{totalInstances} Total Instances</p>
                <p className="text-xs text-gray-500">{configurations.length} Configurations</p>
              </div>
              
              {pricing && (
                <div className="text-right bg-green-50 px-3 py-2 rounded-lg">
                  <p className="text-sm font-semibold text-green-900">
                    {pricing.currency} {pricing.grand_total}
                  </p>
                  <p className="text-xs text-green-600">Total Cost</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 md:p-8">
          {/* Configuration Cards */}
          <div className="space-y-6 mb-8">
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
                  networks: [], // TODO: Replace with actual API call
                  subnets: [], // TODO: Replace with actual API call
                  security_groups: [], // TODO: Replace with actual API call
                  key_pairs: [] // TODO: Replace with actual API call
                }}
                errors={errors}
                isExpanded={expandedConfigs.has(index)}
                onToggleExpand={toggleConfigExpansion}
              />
            ))}
          </div>

          {/* Add Configuration Button */}
          <div className="mb-8">
            <button
              onClick={addConfiguration}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Another Configuration
            </button>
          </div>

          {/* Pricing Section */}
          {pricing && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Breakdown</h3>
              
              <div className="space-y-4">
                {pricing.previews.map((preview, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Configuration #{preview.index + 1}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {preview.count} × {preview.product_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {preview.currency} {preview.total_price}
                      </p>
                      <p className="text-sm text-gray-500">
                        {preview.currency} {preview.unit_price} per instance
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Grand Total</h4>
                      <p className="text-sm text-gray-500">
                        {pricing.total_instances} instances across {pricing.total_configurations} configurations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {pricing.currency} {pricing.grand_total}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={getPricingPreview}
                disabled={pricingLoading || totalInstances === 0}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {pricingLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                Calculate Pricing
              </button>

              <div className="text-sm text-gray-600">
                <span className="flex items-center">
                  <Info className="w-4 h-4 mr-1" />
                  {totalInstances > 0 ? `Ready to create ${totalInstances} instances` : 'Configure at least one instance'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.href = '/admin-dashboard/enhanced-instance-management'}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              
              <button
                onClick={createInstances}
                disabled={creating || totalInstances === 0 || !pricing}
                className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Create {totalInstances} Instance{totalInstances !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}