import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Configuration, Option, AdditionalVolume } from "@/types/InstanceConfiguration";
import { ModernCard, SearchableSelect } from "../ui";
import { DEFAULT_PRESETS } from "../network/NetworkPresetSelector";
import SectionWrapper from "./SectionWrapper";
import TagsInput from "./TagsInput";
import VolumesSection from "./VolumesSection";
import ProjectMembershipSelector from "./ProjectMembershipSelector";
import ConfigurationHeader from "./ConfigurationHeader";
import RegionProjectSection from "./RegionProjectSection";
import NetworkingSection from "./NetworkingSection";
import AccessKeysSection from "./AccessKeysSection";
import ActionRow from "./ActionRow";
import StorageSection from "./StorageSection";
import ComputeImageSection from "./ComputeImageSection";
import FinalizeDetailsSection from "./FinalizeDetailsSection";
import { useApiContext } from "@/hooks/useApiContext";
import { useNetworkPresets } from "@/hooks/networkPresetHooks";
import { useProjectMembershipSuggestions } from "@/hooks/adminHooks/projectHooks";
import adminApi from "../../../index/admin/api";
import tenantApi from "../../../index/tenant/tenantApi";
import clientApi from "../../../index/client/api";
import ToastUtils from "@/utils/toastUtil";

const PROJECT_MODE_OPTIONS = [
  { value: "existing", label: "Use existing project" },
  { value: "new", label: "Create new project" },
];

interface Props {
  cfg: Configuration;
  index: number;
  totalConfigurations: number;

  // Actions
  updateConfiguration: (id: string, patch: Partial<Configuration>) => void;
  removeConfiguration: (id: string) => void;
  addAdditionalVolume: (configId: string) => void;
  updateAdditionalVolume: (
    configId: string,
    volumeId: string,
    patch: Partial<AdditionalVolume>
  ) => void;
  removeAdditionalVolume: (configId: string, volumeId: string) => void;

  // Options
  regionOptions: Option[];
  projectOptions: Option[];
  computeOptions: Option[];
  osImageOptions: Option[];
  volumeTypeOptions: Option[];
  networkOptions: Option[];
  subnetOptions: Option[];
  bandwidthOptions: Option[];
  keyPairOptions: Option[];
  securityGroups: unknown;

  // Flags
  isProjectScoped: boolean;
  isLoadingResources: boolean;
  showActionRow?: boolean;
  onAddConfiguration?: () => void;
  onBackToWorkflow?: () => void;
  onSubmitConfigurations?: () => void;
  isSubmitting?: boolean;
  submitErrorMessage?: string | null;
  onSaveTemplate?: (config: Configuration) => void;
  showTemplateSelector?: boolean;
  onTemplateSelect?: (template: Record<string, unknown>) => void;
  variant?: "classic" | "cube";
  showProjectMembership?: boolean;
  membershipTenantId?: string;
  membershipUserId?: string;
  lockAssignmentScope?: boolean;
  useProjectMembershipSuggestionsHook?: (
    params?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => {
    data?: Record<string, unknown>[];
    isFetching?: boolean;
    isLoading?: boolean;
  };
  azSelectionMode?: "auto" | "user_selectable" | "disabled";
  availabilityZoneOptions?: Option[];
}

const InstanceConfigurationForm: React.FC<Props> = ({
  cfg,
  index,
  totalConfigurations,
  updateConfiguration,
  removeConfiguration,
  addAdditionalVolume,
  updateAdditionalVolume,
  removeAdditionalVolume,

  regionOptions,
  projectOptions,
  computeOptions,
  osImageOptions,
  volumeTypeOptions,
  networkOptions,
  subnetOptions,
  bandwidthOptions,
  keyPairOptions,
  securityGroups,

  isProjectScoped,
  isLoadingResources,
  showActionRow = false,
  onAddConfiguration,
  onBackToWorkflow,
  onSubmitConfigurations,
  isSubmitting = false,
  submitErrorMessage,
  onSaveTemplate,
  showTemplateSelector = false,
  onTemplateSelect,
  variant = "classic",
  showProjectMembership = false,
  membershipTenantId,
  membershipUserId,
  lockAssignmentScope = false,
  useProjectMembershipSuggestionsHook,
  azSelectionMode,
  availabilityZoneOptions,
}) => {
  const { context } = useApiContext();
  const { data: networkPresets = DEFAULT_PRESETS } = useNetworkPresets();
  const selectedRegion = cfg.region;
  const projectMode = cfg.project_mode === "new" ? "new" : "existing";
  const isTemplateLocked = Boolean(cfg.template_locked || cfg.template_id);
  const effectiveProjectMode = isTemplateLocked ? "new" : projectMode;
  const isNewProject = effectiveProjectMode === "new";
  const networkPresetValue = cfg.network_preset || "standard";
  const floatingIpCount = Number(cfg.floating_ip_count ?? 0);
  const normalizedFloatingIpCount = Number.isFinite(floatingIpCount) ? floatingIpCount : 0;
  const hasFloatingIp = normalizedFloatingIpCount > 0;
  const presetCatalog = useMemo(
    () =>
      Array.isArray(networkPresets) && networkPresets.length > 0 ? networkPresets : DEFAULT_PRESETS,
    [networkPresets]
  );
  const publicPresetIds = useMemo(
    () => new Set(presetCatalog.filter((preset) => preset.isPublic).map((preset) => preset.id)),
    [presetCatalog]
  );
  const requiredEipPresetIds = useMemo(
    () => new Set(presetCatalog.filter((preset) => preset.requiresEip).map((preset) => preset.id)),
    [presetCatalog]
  );
  const isPublicPreset = publicPresetIds.has(String(networkPresetValue));
  const isCube = variant === "cube";
  const resourceLabel = isCube ? "Cube-Instance" : "Instance";
  const configurationLabel = isCube ? "Cube-Instance" : "Configuration";
  const presetOptions = useMemo(
    () =>
      presetCatalog
        .filter((preset) => preset.id !== "empty")
        .map((preset) => ({
          value: preset.id,
          label: preset.name,
          raw: preset,
        })),
    [presetCatalog]
  );
  const presetDetails = useMemo(
    () =>
      presetCatalog.map((preset) => ({
        value: preset.id,
        label: preset.name,
        raw: preset,
      })),
    [presetCatalog]
  );
  const selectedPreset = presetOptions.find(
    (preset) => String(preset.value) === String(networkPresetValue)
  )?.raw;
  const projectSelectOptions = useMemo(
    () => (Array.isArray(projectOptions) ? projectOptions : []),
    [projectOptions]
  );
  const projectSelectValue = effectiveProjectMode === "existing" ? cfg.project_id || "" : "";

  const resolveProjectRegion = (project: Record<string, unknown> | null | undefined): string => {
    if (!project) return "";
    const region = project.region as Record<string, unknown> | string | undefined;
    if (typeof region === "string") return region;
    return String(
      project.region_code ||
      project.regionCode ||
      region?.code ||
      region?.slug ||
      ""
    );
  };

  const resolveProjectPreset = (project: Record<string, unknown> | null | undefined): string => {
    if (!project) return "";
    const metadata = project.metadata as Record<string, unknown> | undefined;
    return String(
      metadata?.network_preset ||
      metadata?.networkPreset ||
      project.network_preset ||
      project.networkPreset ||
      ""
    );
  };

  const selectedProjectOption = useMemo(() => {
    if (!cfg.project_id) return null;
    return projectSelectOptions.find((option) => String(option.value) === String(cfg.project_id));
  }, [cfg.project_id, projectSelectOptions]);
  const selectedProject = selectedProjectOption?.raw as Record<string, unknown> | undefined;
  const selectedProjectPresetId = resolveProjectPreset(selectedProject);
  const selectedProjectPreset = presetDetails.find(
    (preset) => String(preset.value) === String(selectedProjectPresetId)
  )?.raw;
  const isSelectedProjectPresetPublic = publicPresetIds.has(String(selectedProjectPresetId));
  const effectivePresetId = isNewProject ? networkPresetValue : selectedProjectPresetId;
  const isPresetRequiresEip = requiredEipPresetIds.has(String(effectivePresetId));

  const resolveOptionLabel = useCallback((value: string, options: Option[]) => {
    const match = options.find((opt) => String(opt.value) === String(value));
    return match?.label || "";
  }, []);

  const handleExistingProjectSelect = (value: string) => {
    const selectedOption = projectSelectOptions.find(
      (option) => String(option.value) === String(value)
    );
    const project = selectedOption?.raw as Record<string, unknown> | undefined;
    const projectRegion = resolveProjectRegion(project);
    const resolvedRegion = projectRegion || cfg.region;
    const resolvedRegionLabel = resolveOptionLabel(resolvedRegion, regionOptions);
    const projectPreset = resolveProjectPreset(project);
    updateConfiguration(cfg.id, {
      project_id: value,
      project_mode: "existing",
      project_name:
        ((project as Record<string, unknown>)?.name as string) || selectedOption?.label || "",
      network_preset: projectPreset || cfg.network_preset || "standard",
      region: resolvedRegion,
      region_label: resolvedRegionLabel || cfg.region_label || "",
      keypair_name: "",
      keypair_label: "",
      keypair_public_key: "",
    });
  };

  const handleProjectSelection = (value: string) => {
    if (!value) {
      updateConfiguration(cfg.id, {
        project_mode: "existing",
        project_id: "",
        project_name: "",
      });
      return;
    }
    handleExistingProjectSelect(value);
  };

  const handleProjectModeChange = (value: string) => {
    if (value === "new") {
      updateConfiguration(cfg.id, {
        project_mode: "new",
        project_id: "",
        project_name: cfg.project_name || "",
        network_preset: cfg.network_preset || "standard",
        network_id: "",
        subnet_id: "",
        subnet_label: "",
        security_group_ids: [],
        keypair_name: "",
        keypair_label: "",
        keypair_public_key: "",
      });
      return;
    }
    updateConfiguration(cfg.id, {
      project_mode: "existing",
      project_id: "",
      project_name: "",
      network_id: "",
      subnet_id: "",
      subnet_label: "",
      security_group_ids: [],
      keypair_name: "",
      keypair_label: "",
      keypair_public_key: "",
    });
  };

  const templateComputeLabel = useMemo(() => {
    if (!isTemplateLocked || !cfg.compute_instance_id) return "";
    return resolveOptionLabel(cfg.compute_instance_id, computeOptions);
  }, [cfg.compute_instance_id, computeOptions, isTemplateLocked, resolveOptionLabel]);

  const templateImageLabel = useMemo(() => {
    if (!isTemplateLocked || !cfg.os_image_id) return "";
    return resolveOptionLabel(cfg.os_image_id, osImageOptions);
  }, [cfg.os_image_id, isTemplateLocked, osImageOptions, resolveOptionLabel]);

  const templateVolumeLabel = useMemo(() => {
    if (!isTemplateLocked || !cfg.volume_type_id) return "";
    return resolveOptionLabel(cfg.volume_type_id, volumeTypeOptions);
  }, [cfg.volume_type_id, isTemplateLocked, resolveOptionLabel, volumeTypeOptions]);

  const templateVolumeSize = useMemo(() => {
    if (!isTemplateLocked || !cfg.storage_size_gb) return "";
    return `${cfg.storage_size_gb} GB`;
  }, [cfg.storage_size_gb, isTemplateLocked]);

  const resolvedKeyPairOptions = useMemo(() => {
    const base = Array.isArray(keyPairOptions) ? keyPairOptions : [];
    const currentValue = cfg.keypair_name ? String(cfg.keypair_name) : "";
    if (!currentValue) return base;
    const exists = base.some((opt) => String(opt.value) === currentValue);
    if (exists) return base;
    return [...base, { value: currentValue, label: cfg.keypair_label || currentValue }];
  }, [cfg.keypair_name, cfg.keypair_label, keyPairOptions]);

  const [keypairMode, setKeypairMode] = useState<"existing" | "create">("existing");
  const [keypairNameInput, setKeypairNameInput] = useState("");
  const [keypairPublicKey, setKeypairPublicKey] = useState("");
  const [keypairMaterial, setKeypairMaterial] = useState<string | null>(null);
  const [isCreatingKeypair, setIsCreatingKeypair] = useState(false);
  const [hasDownloadedKeypair, setHasDownloadedKeypair] = useState(false);
  const keypairModeName = `keypair-mode-${cfg.id}`;

  useEffect(() => {
    const nextMode: "existing" | "create" = isNewProject ? "create" : "existing";
    setKeypairMode(nextMode);
    setKeypairNameInput("");
    setKeypairPublicKey("");
    setKeypairMaterial(null);
    setHasDownloadedKeypair(false);
  }, [cfg.id, cfg.project_id, isNewProject]);

  useEffect(() => {
    const patch: Partial<Configuration> = {};
    if (cfg.region && !cfg.region_label) {
      const label = resolveOptionLabel(cfg.region, regionOptions);
      if (label) patch.region_label = label;
    }
    if (cfg.compute_instance_id && !cfg.compute_label) {
      const label = resolveOptionLabel(cfg.compute_instance_id, computeOptions);
      if (label) patch.compute_label = label;
    }
    if (cfg.os_image_id && !cfg.os_image_label) {
      const label = resolveOptionLabel(cfg.os_image_id, osImageOptions);
      if (label) patch.os_image_label = label;
    }
    if (cfg.volume_type_id && !cfg.volume_type_label) {
      const label = resolveOptionLabel(cfg.volume_type_id, volumeTypeOptions);
      if (label) patch.volume_type_label = label;
    }
    if (Object.keys(patch).length > 0) {
      updateConfiguration(cfg.id, patch);
    }
  }, [
    cfg.id,
    cfg.region,
    cfg.region_label,
    cfg.compute_instance_id,
    cfg.compute_label,
    cfg.os_image_id,
    cfg.os_image_label,
    cfg.volume_type_id,
    cfg.volume_type_label,
    regionOptions,
    computeOptions,
    osImageOptions,
    volumeTypeOptions,
    resolveOptionLabel,
    updateConfiguration,
  ]);

  const apiClient = useMemo(() => {
    if (context === "admin") return adminApi;
    if (context === "tenant") return tenantApi;
    return clientApi;
  }, [context]);

  const keyPairEndpoint = useMemo(() => {
    if (context === "tenant") return "/admin/key-pairs";
    if (context === "client") return "/business/key-pairs";
    return "/key-pairs";
  }, [context]);

  const hasRegion = Boolean(selectedRegion);
  const canSelectExistingKeypairs = Boolean(cfg.project_id && hasRegion);
  const canCreateKeypairNow = Boolean(cfg.project_id && hasRegion);
  const canStageKeypair = Boolean(hasRegion && isNewProject);
  const canManageKeypairs = isNewProject ? canStageKeypair : canCreateKeypairNow;

  const getScrollContainer = useCallback((element: HTMLElement | null) => {
    if (typeof window === "undefined") return null;
    let current = element?.parentElement || null;
    while (current) {
      const style = globalThis.window.getComputedStyle(current);
      const overflowY = style.overflowY;
      if (
        (overflowY === "auto" || overflowY === "scroll") &&
        current.scrollHeight > current.clientHeight
      ) {
        return current;
      }
      current = current.parentElement;
    }
    return (document.scrollingElement as HTMLElement) || null;
  }, []);

  const downloadPrivateKey = useCallback((material: string, name: string) => {
    const blob = new Blob([material], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/[^a-zA-Z0-9-_]/g, "_") || "keypair"}.pem`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    setHasDownloadedKeypair(true);
  }, []);

  const handleCreateKeypair = useCallback(async () => {
    if (!canCreateKeypairNow) {
      ToastUtils.error("Select an existing project and region before creating a key pair.");
      return;
    }
    const trimmedName = keypairNameInput.trim();
    if (!trimmedName) {
      ToastUtils.error("Key pair name is required.");
      return;
    }
    // Check for duplicate keypair name
    const nameExists = resolvedKeyPairOptions.some(
      (kp) => kp.label?.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      ToastUtils.error(`A key pair named "${trimmedName}" already exists in this project.`);
      return;
    }
    // Validate SSH public key format if provided
    const trimmedPubKey = keypairPublicKey.trim();
    if (trimmedPubKey) {
      const validPrefixes = ["ssh-rsa ", "ssh-ed25519 ", "ecdsa-sha2-", "ssh-dss "];
      const isValidFormat = validPrefixes.some((prefix) => trimmedPubKey.startsWith(prefix));
      if (!isValidFormat) {
        ToastUtils.error("Invalid SSH public key format. Must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2-.");
        return;
      }
    }
    setIsCreatingKeypair(true);
    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        project_id: cfg.project_id,
        region: selectedRegion,
      };
      if (trimmedPubKey) payload.public_key = trimmedPubKey;
      const response = await apiClient("POST", keyPairEndpoint, payload);
      const data = (response as Record<string, unknown>)?.data || response;
      const resolvedName = (data as Record<string, unknown>)?.name || trimmedName;
      updateConfiguration(cfg.id, {
        keypair_name: resolvedName as string,
        keypair_label: resolvedName as string,
      });
      if ((data as Record<string, unknown>)?.material)
        setKeypairMaterial((data as Record<string, unknown>).material as string);
      ToastUtils.success("Key pair created successfully.");
    } catch (error) {
      ToastUtils.error((error as Error)?.message || "Failed to create key pair.");
    } finally {
      setIsCreatingKeypair(false);
    }
  }, [
    apiClient,
    canCreateKeypairNow,
    cfg.id,
    cfg.project_id,
    keyPairEndpoint,
    keypairNameInput,
    keypairPublicKey,
    resolvedKeyPairOptions,
    selectedRegion,
    updateConfiguration,
  ]);

  const focusKey = useCallback((field: string) => `${cfg.id}-${field}`, [cfg.id]);

  const preserveInputState = useCallback(
    (action: () => void) => {
      if (typeof window === "undefined") {
        action();
        return;
      }
      const active = document.activeElement as
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        | null;
      const activeKey = active?.getAttribute("data-focus-key") || "";
      const selectionStart = active && "selectionStart" in active ? active.selectionStart : null;
      const selectionEnd = active && "selectionEnd" in active ? active.selectionEnd : null;
      const scrollContainer = getScrollContainer(active);
      const currentScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      const currentY = globalThis.window.scrollY;
      action();
      requestAnimationFrame(() => {
        if (scrollContainer && scrollContainer.scrollTop !== currentScrollTop)
          scrollContainer.scrollTop = currentScrollTop;
        if (globalThis.window.scrollY !== currentY) globalThis.window.scrollTo({ top: currentY });
        if (activeKey) {
          const next = document.querySelector(`[data-focus-key="${activeKey}"]`) as
            | HTMLInputElement
            | HTMLTextAreaElement
            | HTMLSelectElement
            | null;
          if (next && typeof next.focus === "function") {
            try {
              next.focus({ preventScroll: true });
            } catch {
              next.focus();
            }
            if (
              selectionStart !== null &&
              selectionEnd !== null &&
              "setSelectionRange" in next &&
              typeof (next as HTMLInputElement | HTMLTextAreaElement).setSelectionRange === "function"
            ) {
              (next as HTMLInputElement | HTMLTextAreaElement).setSelectionRange(selectionStart, selectionEnd);
            }
          }
        }
      });
    },
    [getScrollContainer]
  );

  const updateConfigWithFocus = useCallback(
    (patch: Partial<Configuration>) => {
      preserveInputState(() => updateConfiguration(cfg.id, patch));
    },
    [cfg.id, preserveInputState, updateConfiguration]
  );

  /* ---------- EIP / preset sync effects ---------- */
  const presetSyncRef = useRef<string | null>(null);
  const autoSwitchToastRef = useRef<string | null>(null);
  const previousEipEnabledRef = useRef<boolean>(hasFloatingIp);

  useEffect(() => {
    const presetId = isNewProject ? networkPresetValue : selectedProjectPresetId;
    if (!presetId) return;
    if (!isNewProject && !cfg.project_id) return;
    const key = `${cfg.id}:${presetId}:${cfg.project_id || ""}`;
    if (presetSyncRef.current === key) return;
    presetSyncRef.current = key;
    const shouldAttach = requiredEipPresetIds.has(String(presetId));
    const isEnabled = Number(cfg.floating_ip_count || 0) > 0;
    if (shouldAttach === isEnabled) return;
    updateConfigWithFocus({ floating_ip_count: shouldAttach ? 1 : 0 });
  }, [
    cfg.floating_ip_count,
    cfg.id,
    cfg.project_id,
    isNewProject,
    networkPresetValue,
    requiredEipPresetIds,
    selectedProjectPresetId,
    updateConfigWithFocus,
  ]);

  useEffect(() => {
    const previous = previousEipEnabledRef.current;
    previousEipEnabledRef.current = hasFloatingIp;
    if (!isNewProject || !hasFloatingIp) return;
    if (isPublicPreset) return;
    if (previous) return;
    const key = `${cfg.id}:${networkPresetValue}:${normalizedFloatingIpCount}:${isTemplateLocked}`;
    if (autoSwitchToastRef.current === key) return;
    autoSwitchToastRef.current = key;
    if (isTemplateLocked) {
      ToastUtils.warning("Elastic IPs require a public network preset.", {
        description: "Update the preset or remove Elastic IPs to continue.",
      });
      return;
    }
    updateConfigWithFocus({ network_preset: "standard" });
    ToastUtils.warning("Elastic IPs require a public network preset.", {
      description: "Switched to Standard to support Elastic IPs.",
    });
  }, [
    cfg.id,
    hasFloatingIp,
    isNewProject,
    isPublicPreset,
    isTemplateLocked,
    networkPresetValue,
    normalizedFloatingIpCount,
    updateConfigWithFocus,
  ]);

  const handleSecurityGroupToggle = (value: string, checked: boolean) => {
    const current = Array.isArray(cfg.security_group_ids) ? cfg.security_group_ids : [];
    const next = new Set(current.map((v) => String(v)));
    if (checked) next.add(String(value));
    else next.delete(String(value));
    preserveInputState(() => updateConfiguration(cfg.id, { security_group_ids: Array.from(next) }));
  };

  /* ---------- Membership logic ---------- */
  const assignmentScope = cfg.assignment_scope || "internal";
  const shouldShowProjectMembership = Boolean(showProjectMembership && isNewProject);
  const shouldFetchMembers = useMemo(() => {
    if (!shouldShowProjectMembership) return false;
    if (assignmentScope === "internal") return true;
    if (assignmentScope === "tenant") return Boolean(membershipTenantId);
    if (assignmentScope === "client") return Boolean(membershipUserId);
    return false;
  }, [assignmentScope, membershipTenantId, membershipUserId, shouldShowProjectMembership]);

  const membershipParams = useMemo(() => {
    if (!shouldFetchMembers) return null;
    return {
      scope: assignmentScope,
      tenant_id: assignmentScope !== "internal" ? membershipTenantId || undefined : undefined,
      client_id: assignmentScope === "client" ? membershipUserId || undefined : undefined,
    };
  }, [assignmentScope, membershipTenantId, membershipUserId, shouldFetchMembers]);

  const membershipSuggestionsHook =
    useProjectMembershipSuggestionsHook || useProjectMembershipSuggestions;
  const { data: suggestedMembers = [], isFetching: isMembersFetching } = membershipSuggestionsHook(
    membershipParams ?? {},
    { enabled: shouldFetchMembers && !!membershipParams }
  );

  const membersFetchKeyRef = useRef<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!shouldFetchMembers) {
      membersFetchKeyRef.current = null;
      return;
    }
    if (isMembersFetching) return;
    const scopeKey = JSON.stringify([
      assignmentScope,
      assignmentScope !== "internal" ? membershipTenantId || null : null,
      assignmentScope === "client" ? membershipUserId || null : null,
    ]);
    const newDefaultSignature = suggestedMembers?.length
      ? JSON.stringify(
          [...suggestedMembers.map((m: Record<string, unknown>) => Number(m.id))].sort(
            (a, b) => a - b
          )
        )
      : null;
    const currentMemberIds = Array.isArray(cfg.member_user_ids)
      ? cfg.member_user_ids.map((id) => Number(id))
      : [];
    const currentSignature = currentMemberIds.length
      ? JSON.stringify([...currentMemberIds].sort((a, b) => a - b))
      : null;
    const lastState = membersFetchKeyRef.current;
    const shouldSync =
      !lastState ||
      lastState.key !== scopeKey ||
      (!!newDefaultSignature &&
        lastState.defaultSignature !== newDefaultSignature &&
        currentSignature === lastState.defaultSignature);
    if (shouldSync)
      updateConfiguration(cfg.id, {
        member_user_ids: suggestedMembers.map((m: Record<string, unknown>) => Number(m.id)),
      });
    membersFetchKeyRef.current = { key: scopeKey, defaultSignature: newDefaultSignature };
  }, [
    assignmentScope,
    cfg.id,
    cfg.member_user_ids,
    isMembersFetching,
    membershipTenantId,
    membershipUserId,
    shouldFetchMembers,
    suggestedMembers,
    updateConfiguration,
  ]);

  const selectedMemberIds = useMemo(() => {
    const ids = Array.isArray(cfg.member_user_ids) ? cfg.member_user_ids : [];
    return new Set(ids.map((id) => Number(id)));
  }, [cfg.member_user_ids]);

  const selectedMembers = useMemo(() => {
    if (!Array.isArray(cfg.member_user_ids) || cfg.member_user_ids.length === 0) return [];
    const lookup = new Map(
      (suggestedMembers || []).map((m: Record<string, unknown>) => [Number(m.id), m])
    );
    return cfg.member_user_ids.map((id) => lookup.get(Number(id)) || { id, name: `User #${id}` });
  }, [cfg.member_user_ids, suggestedMembers]);

  const defaultSelectionSignature = useMemo(() => {
    if (!suggestedMembers?.length) return null;
    return JSON.stringify(
      [...suggestedMembers.map((m: Record<string, unknown>) => Number(m.id))].sort((a, b) => a - b)
    );
  }, [suggestedMembers]);

  const currentSelectionSignature = useMemo(() => {
    if (!Array.isArray(cfg.member_user_ids) || cfg.member_user_ids.length === 0) return null;
    return JSON.stringify([...cfg.member_user_ids.map((id) => Number(id))].sort((a, b) => a - b));
  }, [cfg.member_user_ids]);

  const showRestoreMembers =
    Boolean(defaultSelectionSignature) && defaultSelectionSignature !== currentSelectionSignature;

  const handleRestoreMembers = useCallback(() => {
    if (suggestedMembers?.length)
      updateConfiguration(cfg.id, {
        member_user_ids: suggestedMembers.map((m: Record<string, unknown>) => Number(m.id)),
      });
  }, [cfg.id, suggestedMembers, updateConfiguration]);

  const handleAssignmentScopeChange = useCallback(
    (value: string) => {
      updateConfiguration(cfg.id, {
        assignment_scope: value as "internal" | "tenant" | "client",
        member_user_ids: [],
      });
    },
    [cfg.id, updateConfiguration]
  );

  const handleToggleMember = useCallback(
    (member: Record<string, unknown>) => {
      const current = Array.isArray(cfg.member_user_ids) ? cfg.member_user_ids : [];
      const next = new Set(current.map((id) => Number(id)));
      const memberId = Number(member.id);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      updateConfiguration(cfg.id, { member_user_ids: Array.from(next) });
    },
    [cfg.id, cfg.member_user_ids, updateConfiguration]
  );

  /* ---------- Step numbers ---------- */
  const hasMembershipStep = shouldShowProjectMembership;
  const membershipStep = 2;
  const sizeStep = hasMembershipStep ? 3 : 2;
  const imageStep = sizeStep + 1;
  const storageStep = imageStep + 1;
  const networkingStep = storageStep + 1;
  const accessKeysStep = storageStep + (effectiveProjectMode === "existing" ? 2 : 1);

  const addConfigurationLabel = isCube ? "Add cube-instance configuration" : "Add configuration";
  const submitLabel = isCube ? "Create cube-instance and price" : "Create and price";
  const submittingLabel = isCube ? "Creating cube-instance..." : "Creating...";

  /* ---------- Shared prop bundles ---------- */
  const headerProps = {
    cfg,
    index,
    totalConfigurations,
    configurationLabel,
    resourceLabel,
    variant: variant as "classic" | "cube",
    removeConfiguration,
    onSaveTemplate,
    showTemplateSelector,
    onTemplateSelect,
  };

  const regionProjectProps = {
    cfg,
    regionOptions,
    projectSelectOptions,
    projectSelectValue,
    effectiveProjectMode,
    isTemplateLocked,
    selectedRegion,
    networkPresetValue,
    presetOptions,
    selectedPreset,
    selectedProjectPreset,
    selectedProject,
    isSelectedProjectPresetPublic,
    hasFloatingIp,
    normalizedFloatingIpCount,
    isLoadingResources,
    isSubmitting,
    focusKey,
    updateConfigWithFocus,
    handleProjectModeChange,
    handleProjectSelection,
    projectModeOptions: PROJECT_MODE_OPTIONS,
    azSelectionMode,
    availabilityZoneOptions,
  };

  const accessKeysProps = {
    cfg,
    isNewProject,
    hasRegion,
    canManageKeypairs,
    canSelectExistingKeypairs,
    resolvedKeyPairOptions,
    keypairMode,
    keypairModeName,
    keypairNameInput,
    keypairPublicKey,
    keypairMaterial,
    isCreatingKeypair,
    hasDownloadedKeypair,
    focusKey,
    updateConfigWithFocus,
    preserveInputState,
    setKeypairMode,
    setKeypairNameInput,
    setKeypairPublicKey,
    setKeypairMaterial,
    setHasDownloadedKeypair,
    handleCreateKeypair,
    downloadPrivateKey,
  };

  const storageProps = {
    cfg,
    volumeTypeOptions,
    selectedRegion,
    templateVolumeLabel,
    templateVolumeSize,
    updateConfigWithFocus,
  };

  const computeImageProps = {
    cfg,
    computeOptions,
    osImageOptions,
    selectedRegion,
    templateComputeLabel,
    templateImageLabel,
    updateConfigWithFocus,
  };

  const actionRowProps = {
    addConfigurationLabel,
    submitLabel,
    submittingLabel,
    isSubmitting,
    submitErrorMessage,
    onAddConfiguration,
    onBackToWorkflow,
    onSubmitConfigurations,
  };

  /* ========== Cube variant ========== */
  if (isCube) {
    return (
      <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
        <ConfigurationHeader {...headerProps} />
        <div className="space-y-5">
          <SectionWrapper
            title="1. Region & project"
            description="Select the region and decide whether to use an existing project or create a new one."
          >
            <RegionProjectSection {...regionProjectProps} />
          </SectionWrapper>

          {hasMembershipStep && (
            <SectionWrapper
              title={`${membershipStep}. Project membership`}
              description="Choose who should be granted access on this new project."
            >
              <ProjectMembershipSelector
                assignmentScope={assignmentScope}
                lockAssignmentScope={lockAssignmentScope}
                shouldFetchMembers={shouldFetchMembers}
                isMembersFetching={isMembersFetching}
                selectedMembers={selectedMembers}
                selectedMemberIds={selectedMemberIds}
                suggestedMembers={suggestedMembers}
                showRestoreMembers={showRestoreMembers}
                onAssignmentScopeChange={handleAssignmentScopeChange}
                onToggleMember={handleToggleMember}
                onRestoreMembers={handleRestoreMembers}
              />
            </SectionWrapper>
          )}

          <SectionWrapper
            title={`${sizeStep}. Choose size`}
            description="Pick the compute profile for this cube-instance."
          >
            <SearchableSelect
              label="Instance Type *"
              value={cfg.compute_instance_id}
              onChange={(e) => {
                const l = e.target.selectedOptions?.[0]?.text || "";
                updateConfigWithFocus({
                  compute_instance_id: e.target.value,
                  compute_label: e.target.value ? l : "",
                });
              }}
              options={[
                {
                  value: "",
                  label: selectedRegion ? "Select instance type" : "Select region first",
                },
                ...computeOptions,
              ]}
              helper={
                templateComputeLabel
                  ? `Template: ${templateComputeLabel}`
                  : "Select the compute flavor."
              }
              disabled={!selectedRegion}
            />
          </SectionWrapper>

          <SectionWrapper
            title={`${imageStep}. Choose image`}
            description="Select the operating system image to boot from."
          >
            <SearchableSelect
              label="OS Image *"
              value={cfg.os_image_id}
              onChange={(e) => {
                const l = e.target.selectedOptions?.[0]?.text || "";
                updateConfigWithFocus({
                  os_image_id: e.target.value,
                  os_image_label: e.target.value ? l : "",
                });
              }}
              options={[
                { value: "", label: selectedRegion ? "Select OS image" : "Select region first" },
                ...osImageOptions,
              ]}
              helper={
                templateImageLabel ? `Template: ${templateImageLabel}` : "Choose the base image."
              }
              disabled={!selectedRegion}
            />
          </SectionWrapper>

          <SectionWrapper
            title={`${storageStep}. Storage`}
            description="Configure the boot volume and attach any extra data disks."
          >
            <StorageSection {...storageProps} />
            <VolumesSection
              configId={cfg.id}
              additionalVolumes={cfg.additional_volumes || []}
              volumeTypeOptions={volumeTypeOptions}
              selectedRegion={selectedRegion}
              addAdditionalVolume={addAdditionalVolume}
              updateAdditionalVolume={updateAdditionalVolume}
              removeAdditionalVolume={removeAdditionalVolume}
            />
          </SectionWrapper>

          {effectiveProjectMode === "existing" && (
            <SectionWrapper
              title={`${networkingStep}. Networking`}
              description="Attach networks, bandwidth, and security groups."
            >
              <NetworkingSection
                cfg={cfg}
                networkOptions={networkOptions}
                subnetOptions={subnetOptions}
                bandwidthOptions={bandwidthOptions}
                isProjectScoped={isProjectScoped}
                isLoadingResources={isLoadingResources}
                hasFloatingIp={hasFloatingIp}
                isPresetRequiresEip={isPresetRequiresEip}
                securityGroups={securityGroups}
                updateConfigWithFocus={updateConfigWithFocus}
                handleSecurityGroupToggle={handleSecurityGroupToggle}
              />
            </SectionWrapper>
          )}

          <SectionWrapper
            title={`${accessKeysStep}. Access keys`}
            description="Choose an existing SSH key pair or create a new one."
          >
            <AccessKeysSection {...accessKeysProps} />
          </SectionWrapper>

          <SectionWrapper
            title={`${effectiveProjectMode === "existing" ? 7 : 6}. Finalize details`}
            description="Name, quantity, and optional tags for this cube-instance."
          >
            <FinalizeDetailsSection
              cfg={cfg}
              resourceLabel={resourceLabel}
              focusKey={focusKey}
              updateConfigWithFocus={updateConfigWithFocus}
            />
          </SectionWrapper>
        </div>
        {showActionRow && <ActionRow {...actionRowProps} />}
      </ModernCard>
    );
  }

  /* ========== Classic variant ========== */
  return (
    <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
      <ConfigurationHeader {...headerProps} />

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Cube-Instance name *
          </label>
          <input
            type="text"
            data-focus-key={focusKey("instance_name")}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.name}
            onChange={(e) => updateConfigWithFocus({ name: e.target.value })}
            placeholder="Enter cube-instance name"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Number of instances *
          </label>
          <input
            type="number"
            min="1"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
            value={cfg.instance_count}
            onChange={(e) => updateConfigWithFocus({ instance_count: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          data-focus-key={focusKey("instance_description")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
          rows={2}
          value={cfg.description}
          onChange={(e) => updateConfigWithFocus({ description: e.target.value })}
          placeholder="Optional description"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-sm font-semibold">Infrastructure Configuration</span>
        </div>
        <RegionProjectSection {...regionProjectProps} />
        <div className="grid gap-4 md:grid-cols-3">
          <ComputeImageSection {...computeImageProps} />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Attach EIP when provisioning
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                checked={hasFloatingIp}
                disabled={isPresetRequiresEip}
                onChange={(e) =>
                  updateConfigWithFocus({ floating_ip_count: e.target.checked ? 1 : 0 })
                }
              />
              <span>Allocate and attach one Elastic IP.</span>
              {isPresetRequiresEip && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Required by preset
                </span>
              )}
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {isPresetRequiresEip
                ? "This preset requires an EIP; this is locked on."
                : "When enabled, one EIP is reserved and attached during provisioning."}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-sm font-semibold">Storage Configuration</span>
        </div>
        <StorageSection {...storageProps} />
      </div>

      {effectiveProjectMode === "existing" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-700">
            <span className="text-sm font-semibold">Network Configuration</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <SearchableSelect
              label="Network (Optional)"
              value={cfg.network_id}
              onChange={(e) => updateConfigWithFocus({ network_id: e.target.value })}
              options={[{ value: "", label: "None (use default)" }, ...networkOptions]}
              helper="Select a network when targeting a project."
              disabled={!isProjectScoped}
            />
            <SearchableSelect
              label="Subnet (Optional)"
              value={cfg.subnet_id}
              onChange={(e) => {
                const l = e.target.selectedOptions?.[0]?.text || "";
                updateConfigWithFocus({
                  subnet_id: e.target.value,
                  subnet_label: e.target.value ? l : "",
                });
              }}
              options={[{ value: "", label: "None (use default)" }, ...subnetOptions]}
              helper="Select a subnet from the chosen network."
              disabled={!isProjectScoped}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Bandwidth</label>
              <SearchableSelect
                label=""
                value={cfg.bandwidth_id}
                onChange={(e) =>
                  updateConfigWithFocus({
                    bandwidth_id: e.target.value,
                    bandwidth_count: e.target.value ? 1 : 0,
                  })
                }
                options={[{ value: "", label: "Select bandwidth (optional)" }, ...bandwidthOptions]}
                helper="Optional. Leave blank if not required."
                disabled={isLoadingResources}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Security Groups (Optional)
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {isProjectScoped ? (
                  (Array.isArray(securityGroups) && securityGroups.length > 0
                    ? securityGroups
                    : []
                  ).map((sg: Record<string, unknown>) => {
                    const id = sg.id || sg.identifier || sg.name;
                    if (!id) return null;
                    const label = sg.name || sg.label || `SG ${id}`;
                    const checked = Array.isArray(cfg.security_group_ids)
                      ? cfg.security_group_ids.includes(String(id))
                      : false;
                    return (
                      <label
                        key={id}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={checked}
                          onChange={(e) => handleSecurityGroupToggle(id, e.target.checked)}
                        />
                        <span>{label}</span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500">
                    Select a region and project to view available security groups.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tags (Optional)</label>
            <TagsInput
              value={cfg.tags || ""}
              onChange={(next) => updateConfigWithFocus({ tags: next })}
              placeholder="Type a tag and press comma"
              dataFocusKey={focusKey("tags")}
            />
            <p className="mt-1 text-xs text-gray-500">Press comma or enter to create a tag pill.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-700">
          <span className="text-sm font-semibold">Access Keys</span>
        </div>
        <AccessKeysSection {...accessKeysProps} />
      </div>

      <VolumesSection
        configId={cfg.id}
        additionalVolumes={cfg.additional_volumes || []}
        volumeTypeOptions={volumeTypeOptions}
        selectedRegion={selectedRegion}
        addAdditionalVolume={addAdditionalVolume}
        updateAdditionalVolume={updateAdditionalVolume}
        removeAdditionalVolume={removeAdditionalVolume}
      />

      {showActionRow && <ActionRow {...actionRowProps} />}
    </ModernCard>
  );
};

export default InstanceConfigurationForm;
