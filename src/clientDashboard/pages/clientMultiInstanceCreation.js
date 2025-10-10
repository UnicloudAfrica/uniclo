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
  Info,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import ClientHeadbar from "../components/clientHeadbar";
import ClientSidebar from "../components/clientSidebar";
import ClientActiveTab from "../components/clientActiveTab";
import ToastUtils from "../../utils/toastUtil";
import { useFetchClientProjects } from "../../hooks/clientHooks/projectHooks";
import { useFetchProductPricing } from "../../hooks/resource";
import { useFetchClientSubnets } from "../../hooks/clientHooks/subnetHooks";
import { useFetchClientSecurityGroups } from "../../hooks/clientHooks/securityGroupHooks";
import { useFetchClientKeyPairs } from "../../hooks/clientHooks/keyPairsHook";

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

  const selectedProduct = resources?.products?.find(p => p.product?.id === localConfig.product_id);
  const selectedProject = resources?.projects?.find(p => p.id === localConfig.project_id);

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
                {localConfig.count || 1} instance(s) • {selectedProduct?.product?.productable_name || 'No product selected'}
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
                    <option key={project.id} value={project.id}>
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
                  Region *
                </label>
                <input
                  type="text"
                  value={selectedProject?.default_region || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  placeholder="Select project first"
                />
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
                  disabled={!selectedProject?.default_region}
                >
                  <option value="">Select Instance Type</option>
                  {resources?.products?.map(product => (
                    <option key={product.product.id} value={product.product.id}>
                      {product.product.productable_name} ({product.product.productable?.vcpus || 'N/A'} vCPUs, {product.product.productable?.memory_mb ? Math.round(product.product.productable.memory_mb / 1024) : 'N/A'} GB RAM) - {product.pricing?.effective?.currency} {product.pricing?.effective?.price_local}
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
                  disabled={!selectedProject?.default_region}
                >
                  <option value="">Select OS Image</option>
                  {resources?.os_images?.map(image => (
                    <option key={image.product.id} value={image.product.id}>
                      {image.product.productable_name} - {image.pricing?.effective?.currency} {image.pricing?.effective?.price_local}
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
                      disabled={!selectedProject?.default_region}
                    >
                      <option value="">Select Volume Type</option>
                      {resources?.volume_types?.map(vt => (
                        <option key={vt.product.id} value={vt.product.id}>
                          {vt.product.productable_name} - {vt.pricing?.effective?.currency} {vt.pricing?.effective?.price_local}/GB
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
                  Subnet *
                </label>
                <select
                  value={localConfig.subnet_id || ''}
                  onChange={(e) => updateConfig('subnet_id', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    getErrorForField('subnet_id') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={!localConfig.project_id}
                >
                  <option value="">Select Subnet</option>
                  {resources?.subnets?.map(subnet => (
                    <option key={subnet.id} value={subnet.id}>
                      {subnet.name} ({subnet.cidr})
                    </option>
                  ))}
                </select>
                {getErrorForField('subnet_id') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('subnet_id')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Pair
                </label>
                <select
                  value={localConfig.key_pair_id || ''}
                  onChange={(e) => updateConfig('key_pair_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!localConfig.project_id}
                >
                  <option value="">Select Key Pair</option>
                  {resources?.key_pairs?.map(kp => (
                    <option key={kp.id} value={kp.id}>
                      {kp.name}
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
                  value={localConfig.floating_ip_count || 0}
                  onChange={(e) => updateConfig('floating_ip_count', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                  disabled={!localConfig.project_id}
                >
                  {resources?.security_groups?.map(sg => (
                    <option key={sg.id} value={sg.id}>
                      {sg.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                {getErrorForField('security_group_ids') && (
                  <p className="text-sm text-red-600 mt-1">{getErrorForField('security_group_ids')}</p>
                )}
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
export default function ClientMultiInstanceCreation() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [configurations, setConfigurations] = useState([{
    name: '',
    description: '',
    count: 1,
    project_id: '',
    product_id: '',
    os_image_id: '',
    months: 1,
    volume_types: [{ volume_type_id: '', storage_size_gb: 50 }],
    subnet_id: '',
    security_group_ids: [],
    key_pair_id: '',
    floating_ip_count: 0,
    tags: []
  }]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [pricing, setPricing] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [expandedConfigs, setExpandedConfigs] = useState(new Set([0]));
  
  // Dynamic resource loading based on selected configuration
  const [resources, setResources] = useState({
    projects: [],
    products: [],
    os_images: [],
    volume_types: [],
    subnets: [],
    security_groups: [],
    key_pairs: []
  });

  // Get the region from the first configuration's project
  const selectedRegion = resources.projects.find(p => p.id === configurations[0]?.project_id)?.default_region;
  const selectedProjectId = configurations[0]?.project_id;

  // Fetch projects
  const { data: projects, isFetching: isProjectsFetching } = useFetchClientProjects();
  
  // Fetch products based on selected region
  const { data: computeInstances, isFetching: isComputeInstancesFetching } = useFetchProductPricing(selectedRegion, "compute_instance", {
    enabled: !!selectedRegion,
  });
  
  const { data: osImages, isFetching: isOsImagesFetching } = useFetchProductPricing(selectedRegion, "os_image", {
    enabled: !!selectedRegion,
  });
  
  const { data: volumeTypes, isFetching: isVolumeTypesFetching } = useFetchProductPricing(selectedRegion, "volume_type", {
    enabled: !!selectedRegion,
  });

  // Fetch project-specific resources
  const { data: subnets, isFetching: isSubnetsFetching } = useFetchClientSubnets(selectedProjectId, selectedRegion, {
    enabled: !!selectedProjectId && !!selectedRegion,
  });
  
  const { data: securityGroups, isFetching: isSecurityGroupsFetching } = useFetchClientSecurityGroups(selectedProjectId, selectedRegion, {
    enabled: !!selectedProjectId && !!selectedRegion,
  });
  
  const { data: keyPairs, isFetching: isKeyPairsFetching } = useFetchClientKeyPairs(selectedProjectId, selectedRegion, {
    enabled: !!selectedProjectId && !!selectedRegion,
  });

  // Update resources when data is fetched
  useEffect(() => {
    setResources(prev => ({
      ...prev,
      projects: projects?.data || [],
      products: computeInstances?.data || [],
      os_images: osImages?.data || [],
      volume_types: volumeTypes?.data || [],
      subnets: subnets?.data || [],
      security_groups: securityGroups?.data || [],
      key_pairs: keyPairs?.data || []
    }));
  }, [projects, computeInstances, osImages, volumeTypes, subnets, securityGroups, keyPairs]);

  // Set loading state
  useEffect(() => {
    const isAnyFetching = isProjectsFetching || isComputeInstancesFetching || isOsImagesFetching || 
                         isVolumeTypesFetching || isSubnetsFetching || isSecurityGroupsFetching || 
                         isKeyPairsFetching;
    setLoading(isAnyFetching);
  }, [isProjectsFetching, isComputeInstancesFetching, isOsImagesFetching, isVolumeTypesFetching, 
      isSubnetsFetching, isSecurityGroupsFetching, isKeyPairsFetching]);

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
      project_id: '',
      product_id: '',
      os_image_id: '',
      months: 1,
      volume_types: [{ volume_type_id: '', storage_size_gb: 50 }],
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
      const response = await fetch('/api/v1/multi-initiations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          pricing_requests: configurations.map(config => ({
            name: config.name,
            project_id: resources.projects.find(p => p.id === config.project_id)?.id,
            region: resources.projects.find(p => p.id === config.project_id)?.default_region,
            os_image_id: resources.os_images.find(img => img.product.id === config.os_image_id)?.product?.productable_id,
            compute_instance_id: resources.products.find(p => p.product.id === config.product_id)?.product?.productable_id,
            months: config.months,
            number_of_instances: config.count,
            volume_types: config.volume_types.filter(vt => vt.volume_type_id).map(vt => ({
              volume_type_id: resources.volume_types.find(v => v.product.id === vt.volume_type_id)?.product?.productable_id,
              storage_size_gb: vt.storage_size_gb
            })),
            subnet_id: config.subnet_id || null,
            security_group_ids: config.security_group_ids || [],
            key_pair_id: config.key_pair_id || null,
            floating_ip_count: config.floating_ip_count || 0,
          })),
          tags: configurations[0]?.tags || [],
          fast_track: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Handle HTML error responses (404 pages)
        if (errorText.startsWith('<!DOCTYPE')) {
          throw new Error('API endpoint not found. Please check the URL configuration.');
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success || data.data) {
        setPricing(data.data);
        ToastUtils.success('Pricing calculated successfully');
      } else {
        throw new Error(data.message || 'Failed to calculate pricing');
      }
    } catch (err) {
      console.error('Pricing preview error:', err);
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
      const response = await fetch('/api/v1/multi-initiations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          pricing_requests: configurations.map(config => ({
            name: config.name,
            project_id: resources.projects.find(p => p.id === config.project_id)?.id,
            region: resources.projects.find(p => p.id === config.project_id)?.default_region,
            os_image_id: resources.os_images.find(img => img.product.id === config.os_image_id)?.product?.productable_id,
            compute_instance_id: resources.products.find(p => p.product.id === config.product_id)?.product?.productable_id,
            months: config.months,
            number_of_instances: config.count,
            volume_types: config.volume_types.filter(vt => vt.volume_type_id).map(vt => ({
              volume_type_id: resources.volume_types.find(v => v.product.id === vt.volume_type_id)?.product?.productable_id,
              storage_size_gb: vt.storage_size_gb
            })),
            subnet_id: config.subnet_id || null,
            security_group_ids: config.security_group_ids || [],
            key_pair_id: config.key_pair_id || null,
            floating_ip_count: config.floating_ip_count || 0,
          })),
          tags: configurations[0]?.tags || [],
          fast_track: false
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.startsWith('<!DOCTYPE')) {
          throw new Error('API endpoint not found. Please check the URL configuration.');
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (data.success || data.data) {
        ToastUtils.success(data.message || 'Instances created successfully!');
        
        // Redirect to instances page
        setTimeout(() => {
          navigate('/client-dashboard/instances');
        }, 2000);
      } else {
        if (data.errors) {
          setErrors(data.errors);
          ToastUtils.error('Please fix the validation errors');
        } else {
          throw new Error(data.message || 'Failed to create instances');
        }
      }
    } catch (err) {
      console.error('Create instances error:', err);
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
        <ClientHeadbar onMenuClick={toggleMobileMenu} />
        <ClientSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ClientActiveTab />
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
      <ClientHeadbar onMenuClick={toggleMobileMenu} />
      <ClientSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />

      <main className="absolute top-[126px] left-0 md:left-20 lg:left-[20%] font-Outfit w-full md:w-[calc(100%-5rem)] lg:w-[80%] bg-[#FAFAFA] min-h-full">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/client-dashboard/instances')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Instances
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create Instances</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Create multiple instances with different configurations
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{totalInstances} Total Instances</p>
                <p className="text-xs text-gray-500">{configurations.length} Configurations</p>
              </div>
              
              {pricing && (
                <div className="text-right bg-green-50 px-3 py-2 rounded-lg">
                  <p className="text-sm font-semibold text-green-900">
                    {pricing.currency} {pricing.total_amount}
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
                resources={resources}
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
                {pricing.pricing_requests?.map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Configuration #{index + 1}: {configurations[index]?.name || 'Untitled'}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {configurations[index]?.count} instances
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {pricing.currency} {request.total_amount}
                      </p>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Grand Total</h4>
                      <p className="text-sm text-gray-500">
                        {totalInstances} total instances
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {pricing.currency} {pricing.total_amount}
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
                onClick={() => navigate('/client-dashboard/instances')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              
              <button
                onClick={createInstances}
                disabled={creating || totalInstances === 0}
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