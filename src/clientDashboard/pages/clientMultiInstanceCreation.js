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

import Headbar from "../components/clientHeadbar";
import Sidebar from "../components/clientSidebar";
import ClientPageShell from "../components/ClientPageShell";
import ClientActiveTab from "../components/clientActiveTab";
import ModernCard from "../../components/modern/ModernCard";
import ModernButton from "../../components/modern/ModernButton";
import StatusPill from "../../adminDashboard/components/StatusPill";
import StepProgress from "../../dashboard/components/instancesubcomps/stepProgress";
import ToastUtils from "../../utils/toastUtil";
import { designTokens } from "../../styles/designTokens";
import {
  useFetchProductPricing,
  useFetchGeneralRegions
} from "../../hooks/resource";
import { useFetchClientProjects } from "../../hooks/clientHooks/projectHooks";
import { useFetchClientSecurityGroups } from "../../hooks/clientHooks/securityGroupHooks";
import { useFetchClientKeyPairs } from "../../hooks/clientHooks/keyPairsHook";
import { useFetchClientSubnets } from "../../hooks/clientHooks/subnetHooks";
import { useFetchClientVpcs } from "../../hooks/clientHooks/vpcHooks";
import useClientAuthStore from "../../stores/clientAuthStore";
import config from "../../config";
import { useLocation } from "react-router-dom";
import InstanceConfigCard from "../components/creation/InstanceConfigCard";
import InlinePaymentPanel from "../components/creation/InlinePaymentPanel";

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




// Main Component
export default function ClientMultiInstanceCreation() {
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

  useEffect(() => {
    const stateProject = location.state?.project;
    if (stateProject) {
      setConfigurations((prev) => {
        if (!prev.length) {
          return [
            {
              name: "",
              description: "",
              count: 1,
              region: stateProject.region || "",
              project_id: stateProject.identifier || "",
              product_id: "",
              os_image_id: "",
              months: 1,
              volume_types: [{ volume_type_id: "", storage_size_gb: 50 }],
              network_id: "",
              subnet_id: "",
              security_group_ids: [],
              keypair_name: "",
              floating_ip_count: 0,
              tags: [],
            },
          ];
        }
        const [first, ...rest] = prev;
        const updatedFirst = {
          ...first,
          region: stateProject.region || first.region || "",
          project_id: stateProject.identifier || first.project_id || "",
        };
        return [updatedFirst, ...rest];
      });
    }
  }, [location.state]);

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
  // Fetch projects for client (used as baseline; cards filter by region)
  const {
    data: projectsResponse,
    isFetching: isProjectsFetching,
  } = useFetchClientProjects({
    keepPreviousData: true,
  });
  const projects = projectsResponse || [];

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
      const currentRegion = prev[0]?.region;
      // If region is already set (and truthy), do nothing
      if (currentRegion) {
        return prev;
      }

      const defaultRegion = extractRegionCode(regions[0]);
      // If we can't determine a default, or if it's the same as current, do nothing
      if (!defaultRegion || currentRegion === defaultRegion) {
        return prev;
      }

      return [
        { ...prev[0], region: defaultRegion },
        ...prev.slice(1)
      ];
    });
  }, [regions]);

  const resources = useMemo(() => ({
    regions,
    projects,
    compute_instances: computeInstances || [],
    os_images: osImages || [],
    volume_types: volumeTypes || [],
  }), [regions, projects, computeInstances, osImages, volumeTypes]);

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
      const { token } = useClientAuthStore.getState();
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
            network_id: c.network_id || undefined,
            subnet_id: c.subnet_id || undefined,
            security_group_ids: (c.security_group_ids || []).length ? c.security_group_ids : undefined,
            keypair_name: c.keypair_name || undefined,
          })),
          fast_track: false,
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
      const { token } = useClientAuthStore.getState();
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
          network_id: c.network_id || undefined,
          subnet_id: c.subnet_id || undefined,
          security_group_ids: (c.security_group_ids || []).length ? c.security_group_ids : undefined,
          keypair_name: c.keypair_name || undefined,
        })),
        fast_track: false,
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

  const totalInstances = configurations.reduce(
    (sum, config) => sum + (config.count || 0),
    0
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

  const PAYMENT_STEP_INDEX = 2;
  const steps = ["Configurations", "Review & Launch", "Payment"];
  const stepDescriptions = [
    "Define compute, storage, and networking for each batch.",
    "Review pricing and launch the deployment.",
    "Complete payment to release provisioning.",
  ];
  const stepDescription =
    currentStep === 0 && !configurationStepReady
      ? "Complete required configuration details before continuing to review."
      : currentStep === PAYMENT_STEP_INDEX && !paymentTransactionData
        ? "Create an order from the review step to generate payment instructions."
        : stepDescriptions[currentStep] || stepDescriptions[0];

  const handleNextStep = () => {
    if (currentStep === 0) {
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

  const disableContinue = currentStep === 0 && !configurationStepReady;

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
            resources={resources}
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
        <div className="text-sm text-slate-600">
          Review your configurations, confirm pricing, and submit the order. Payment must be completed before provisioning starts.
        </div>
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
            onClick={() => (window.location.href = "/client-dashboard/instances")}
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
              background: `linear-gradient(135deg, ${designTokens.colors.primary[400]} 0%, ${designTokens.colors.primary[600]} 50%, ${designTokens.colors.primary[700]} 100%)`,
              boxShadow: `0 12px 35px -8px ${designTokens.colors.primary[500]}60`,
            }}
          >
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-30">
              <div className="h-full w-full bg-white/60" />
            </div>
            <div className="relative flex items-center gap-2">
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating order…</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Create order</span>
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
        return renderConfigurationsStep();
      case 1:
        return renderReviewStep();
      case PAYMENT_STEP_INDEX:
        return renderPaymentStep();
      default:
        return renderConfigurationsStep();
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
                <span>Step 1: Build the configurations for each workload you want to launch.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                <span>Step 2: Review pricing and kick off provisioning.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-primary-500" />
                <span>Step 3: Complete payment and monitor provisioning automatically.</span>
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
                Confirm who will be charged and submit the order to kick off provisioning.
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
        <Headbar onMenuClick={toggleMobileMenu} />
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={closeMobileMenu}
        />
        <ClientActiveTab />
        <ClientPageShell
          breadcrumbs={[
            { label: "Home", href: "/client-dashboard" },
            { label: "Instances", href: "/client-dashboard/instances" },
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
        </ClientPageShell>
      </>
    );
  }

  const sidebarContent = renderSidebarContent();
  const layoutClass = sidebarContent
    ? "grid gap-8 2xl:grid-cols-[minmax(0,1fr)_minmax(320px,360px)] 2xl:items-start"
    : "space-y-8";

  return (
    <>
      <Headbar onMenuClick={toggleMobileMenu} />
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={closeMobileMenu}
      />
      <ClientActiveTab />
      <ClientPageShell
        breadcrumbs={[
          { label: "Home", href: "/client-dashboard" },
          { label: "Instances", href: "/client-dashboard/instances" },
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
      </ClientPageShell>
    </>
  );
}
