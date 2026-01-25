import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Trash2, Save, Loader2, X } from "lucide-react";
import { Configuration, Option, AdditionalVolume } from "../../../types/InstanceConfiguration";
import { ModernButton, ModernCard, ModernSelect, SearchableSelect } from "../ui";
import { DEFAULT_PRESETS } from "../network/NetworkPresetSelector";
import TemplateSelector from "./TemplateSelector";
import { useApiContext } from "../../../hooks/useApiContext";
import { useNetworkPresets } from "../../../hooks/networkPresetHooks";
import { useProjectMembershipSuggestions } from "../../../hooks/adminHooks/projectHooks";
import adminApi from "../../../index/admin/api";
import tenantApi from "../../../index/tenant/tenantApi";
import clientApi from "../../../index/client/api";
import ToastUtils from "../../../utils/toastUtil";

const PROJECT_MODE_OPTIONS = [
  { value: "existing", label: "Use existing project" },
  { value: "new", label: "Create new project" },
];

const PROJECT_MEMBERSHIP_SCOPES = [
  {
    value: "internal",
    label: "Internal (admins)",
    description: "Share with all platform admins only.",
  },
  {
    value: "tenant",
    label: "Tenant workspace",
    description: "Attach to a tenant and their accepted members.",
  },
  {
    value: "client",
    label: "Client",
    description: "Attach to a client's workspace or tenant membership if available.",
  },
];

interface SectionWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, description, children }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
    <div className="space-y-1">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
    {children}
  </div>
);

interface TagsInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  dataFocusKey?: string;
}

const TagsInput: React.FC<TagsInputProps> = ({
  value,
  onChange,
  placeholder = "Add tags and press comma",
  dataFocusKey,
}) => {
  const [draft, setDraft] = useState("");
  const tags = useMemo(
    () =>
      (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [value]
  );

  const commitTags = (incoming: string[]) => {
    const cleaned = incoming.map((item) => item.trim()).filter(Boolean);
    if (!cleaned.length) return;
    const next = [...tags, ...cleaned];
    const seen = new Set<string>();
    const deduped: string[] = [];
    next.forEach((tag) => {
      const key = tag.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(tag);
      }
    });
    onChange(deduped.join(", "));
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue.includes(",")) {
      const parts = nextValue.split(",");
      const trailing = parts.pop() ?? "";
      commitTags(parts);
      setDraft(trailing);
      return;
    }
    setDraft(nextValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "," || event.key === "Enter") {
      event.preventDefault();
      if (draft.trim()) {
        commitTags([draft]);
        setDraft("");
      }
      return;
    }
    if (event.key === "Backspace" && !draft.trim() && tags.length > 0) {
      const next = tags.slice(0, -1);
      onChange(next.join(", "));
    }
  };

  const handleBlur = () => {
    if (draft.trim()) {
      commitTags([draft]);
      setDraft("");
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
          >
            {tag}
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={() => onChange(tags.filter((t) => t !== tag).join(", "))}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          data-focus-key={dataFocusKey}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm focus:outline-none"
          value={draft}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={tags.length === 0 ? placeholder : ""}
        />
      </div>
    </div>
  );
};

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
  securityGroups: any[]; // Raw objects for custom rendering

  // Flags
  isProjectScoped: boolean;
  isLoadingResources: boolean;
  showActionRow?: boolean;
  onAddConfiguration?: () => void;
  onBackToWorkflow?: () => void;
  onSubmitConfigurations?: () => void;
  isSubmitting?: boolean;
  onSaveTemplate?: (config: Configuration) => void;
  showTemplateSelector?: boolean;
  onTemplateSelect?: (template: any) => void;
  variant?: "classic" | "cube";
  showProjectMembership?: boolean;
  membershipTenantId?: string;
  membershipUserId?: string;
  lockAssignmentScope?: boolean;
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
  onSaveTemplate,
  showTemplateSelector = false,
  onTemplateSelect,
  variant = "classic",
  showProjectMembership = false,
  membershipTenantId,
  membershipUserId,
  lockAssignmentScope = false,
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

  const resolveProjectRegion = (project: any) => {
    if (!project) return "";
    return (
      project?.region ||
      project?.region_code ||
      project?.regionCode ||
      project?.region?.code ||
      project?.region?.slug ||
      ""
    );
  };

  const resolveProjectPreset = (project: any) => {
    if (!project) return "";
    return (
      project?.metadata?.network_preset ||
      project?.metadata?.networkPreset ||
      project?.network_preset ||
      project?.networkPreset ||
      ""
    );
  };

  const selectedProjectOption = useMemo(() => {
    if (!cfg.project_id) return null;
    return projectSelectOptions.find((option) => String(option.value) === String(cfg.project_id));
  }, [cfg.project_id, projectSelectOptions]);
  const selectedProject = selectedProjectOption?.raw;
  const selectedProjectPresetId = resolveProjectPreset(selectedProject);
  const selectedProjectPreset = presetDetails.find(
    (preset) => String(preset.value) === String(selectedProjectPresetId)
  )?.raw;
  const isSelectedProjectPresetPublic = publicPresetIds.has(String(selectedProjectPresetId));
  const effectivePresetId = isNewProject ? networkPresetValue : selectedProjectPresetId;
  const isPresetRequiresEip = requiredEipPresetIds.has(String(effectivePresetId));

  const handleExistingProjectSelect = (value: string) => {
    const selectedOption = projectSelectOptions.find(
      (option) => String(option.value) === String(value)
    );
    const project = selectedOption?.raw;
    const projectRegion = resolveProjectRegion(project);
    const resolvedRegion = projectRegion || cfg.region;
    const resolvedRegionLabel = resolveOptionLabel(resolvedRegion, regionOptions);
    const projectPreset = resolveProjectPreset(project);
    updateConfiguration(cfg.id, {
      project_id: value,
      project_mode: "existing",
      project_name: project?.name || selectedOption?.label || "",
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

  const resolveOptionLabel = useCallback((value: string, options: Option[]) => {
    const match = options.find((opt) => String(opt.value) === String(value));
    return match?.label || "";
  }, []);

  const templateComputeLabel = useMemo(() => {
    if (!isTemplateLocked || !cfg.compute_instance_id) return "";
    return resolveOptionLabel(cfg.compute_instance_id, computeOptions);
  }, [cfg.compute_instance_id, computeOptions, isTemplateLocked]);

  const templateImageLabel = useMemo(() => {
    if (!isTemplateLocked || !cfg.os_image_id) return "";
    return resolveOptionLabel(cfg.os_image_id, osImageOptions);
  }, [cfg.os_image_id, osImageOptions, isTemplateLocked]);

  const templateVolumeLabel = useMemo(() => {
    if (!isTemplateLocked || !cfg.volume_type_id) return "";
    return resolveOptionLabel(cfg.volume_type_id, volumeTypeOptions);
  }, [cfg.volume_type_id, volumeTypeOptions, isTemplateLocked]);

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
    return [
      ...base,
      {
        value: currentValue,
        label: cfg.keypair_label || currentValue,
      },
    ];
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
      const style = window.getComputedStyle(current);
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

    setIsCreatingKeypair(true);
    try {
      const payload: any = {
        name: trimmedName,
        project_id: cfg.project_id,
        region: selectedRegion,
      };
      if (keypairPublicKey.trim()) {
        payload.public_key = keypairPublicKey.trim();
      }

      const response = await apiClient("POST", keyPairEndpoint, payload);
      const data = response?.data || response;
      const resolvedName = data?.name || trimmedName;

      updateConfiguration(cfg.id, {
        keypair_name: resolvedName,
        keypair_label: resolvedName,
      });

      if (data?.material) {
        setKeypairMaterial(data.material);
      }

      ToastUtils.success("Key pair created successfully.");
    } catch (error: any) {
      ToastUtils.error(error?.message || "Failed to create key pair.");
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
    selectedRegion,
    updateConfiguration,
  ]);

  const focusKey = useCallback((field: string) => `${cfg.id}-${field}`, [cfg.id]);

  const preserveInputState = useCallback((action: () => void) => {
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
    const currentY = window.scrollY;
    action();
    requestAnimationFrame(() => {
      if (scrollContainer && scrollContainer.scrollTop !== currentScrollTop) {
        scrollContainer.scrollTop = currentScrollTop;
      }
      if (window.scrollY !== currentY) {
        window.scrollTo({ top: currentY });
      }
      if (activeKey) {
        const selector = `[data-focus-key="${activeKey}"]`;
        const next = document.querySelector(selector) as
          | HTMLInputElement
          | HTMLTextAreaElement
          | HTMLSelectElement
          | null;
        if (next && typeof next.focus === "function") {
          try {
            next.focus({ preventScroll: true });
          } catch (error) {
            next.focus();
          }
          if (
            selectionStart !== null &&
            selectionEnd !== null &&
            typeof next.setSelectionRange === "function"
          ) {
            next.setSelectionRange(selectionStart, selectionEnd);
          }
        }
      }
    });
  }, []);

  const updateConfigWithFocus = useCallback(
    (patch: Partial<Configuration>) => {
      preserveInputState(() => updateConfiguration(cfg.id, patch));
    },
    [cfg.id, preserveInputState, updateConfiguration]
  );

  const presetSyncRef = useRef<string | null>(null);
  const autoSwitchToastRef = useRef<string | null>(null);
  const previousEipEnabledRef = useRef<boolean>(hasFloatingIp);

  useEffect(() => {
    const presetId = isNewProject ? networkPresetValue : selectedProjectPresetId;
    if (!presetId) {
      return;
    }

    if (!isNewProject && !cfg.project_id) {
      return;
    }

    const key = `${cfg.id}:${presetId}:${cfg.project_id || ""}`;
    if (presetSyncRef.current === key) {
      return;
    }
    presetSyncRef.current = key;

    const shouldAttach = requiredEipPresetIds.has(String(presetId));
    const isEnabled = Number(cfg.floating_ip_count || 0) > 0;
    if (shouldAttach === isEnabled) {
      return;
    }

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

    if (!isNewProject || !hasFloatingIp) {
      return;
    }

    if (isPublicPreset) {
      return;
    }

    if (previous) {
      return;
    }

    const key = `${cfg.id}:${networkPresetValue}:${normalizedFloatingIpCount}:${isTemplateLocked}`;
    if (autoSwitchToastRef.current === key) {
      return;
    }
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
    if (checked) {
      next.add(String(value));
    } else {
      next.delete(String(value));
    }
    preserveInputState(() => updateConfiguration(cfg.id, { security_group_ids: Array.from(next) }));
  };

  const assignmentScope = cfg.assignment_scope || "internal";
  const assignmentScopeDetails =
    PROJECT_MEMBERSHIP_SCOPES.find((option) => option.value === assignmentScope) ||
    PROJECT_MEMBERSHIP_SCOPES[0];
  const shouldShowProjectMembership = Boolean(showProjectMembership && isNewProject);
  const shouldFetchMembers = useMemo(() => {
    if (!shouldShowProjectMembership) {
      return false;
    }

    if (assignmentScope === "internal") {
      return true;
    }

    if (assignmentScope === "tenant") {
      return Boolean(membershipTenantId);
    }

    if (assignmentScope === "client") {
      return Boolean(membershipUserId);
    }

    return false;
  }, [assignmentScope, membershipTenantId, membershipUserId, shouldShowProjectMembership]);

  const membershipParams = useMemo(() => {
    if (!shouldFetchMembers) {
      return null;
    }

    return {
      scope: assignmentScope,
      tenant_id: assignmentScope !== "internal" ? membershipTenantId || undefined : undefined,
      client_id: assignmentScope === "client" ? membershipUserId || undefined : undefined,
    };
  }, [assignmentScope, membershipTenantId, membershipUserId, shouldFetchMembers]);

  const { data: suggestedMembers = [], isFetching: isMembersFetching } =
    useProjectMembershipSuggestions(membershipParams ?? {}, {
      enabled: shouldFetchMembers && !!membershipParams,
    });

  const membersFetchKeyRef = useRef<any>(null);

  useEffect(() => {
    if (!shouldFetchMembers) {
      membersFetchKeyRef.current = null;
      return;
    }

    if (isMembersFetching) {
      return;
    }

    const scopeKey = JSON.stringify([
      assignmentScope,
      assignmentScope !== "internal" ? membershipTenantId || null : null,
      assignmentScope === "client" ? membershipUserId || null : null,
    ]);

    const newDefaultSignature = suggestedMembers?.length
      ? JSON.stringify(
          [...suggestedMembers.map((member: any) => Number(member.id))].sort((a, b) => a - b)
        )
      : null;

    const currentMemberIds = Array.isArray(cfg.member_user_ids)
      ? cfg.member_user_ids.map((memberId) => Number(memberId))
      : [];
    const currentSignature = currentMemberIds.length
      ? JSON.stringify([...currentMemberIds].sort((a, b) => a - b))
      : null;

    const lastState = membersFetchKeyRef.current;

    const shouldSyncFromSuggestions =
      !lastState ||
      lastState.key !== scopeKey ||
      (!!newDefaultSignature &&
        lastState.defaultSignature !== newDefaultSignature &&
        currentSignature === lastState.defaultSignature);

    if (shouldSyncFromSuggestions) {
      updateConfiguration(cfg.id, {
        member_user_ids: suggestedMembers.map((member: any) => Number(member.id)),
      });
    }

    membersFetchKeyRef.current = {
      key: scopeKey,
      defaultSignature: newDefaultSignature,
    };
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
    return new Set(ids.map((memberId) => Number(memberId)));
  }, [cfg.member_user_ids]);

  const selectedMembers = useMemo(() => {
    if (!Array.isArray(cfg.member_user_ids) || cfg.member_user_ids.length === 0) {
      return [];
    }

    const lookup = new Map(
      (suggestedMembers || []).map((member: any) => [Number(member.id), member])
    );

    return cfg.member_user_ids.map((memberId) => {
      const resolved = lookup.get(Number(memberId));
      if (resolved) {
        return resolved;
      }

      return { id: memberId, name: `User #${memberId}` };
    });
  }, [cfg.member_user_ids, suggestedMembers]);

  const defaultSelectionSignature = useMemo(() => {
    if (!suggestedMembers?.length) {
      return null;
    }

    return JSON.stringify(
      [...suggestedMembers.map((member: any) => Number(member.id))].sort((a, b) => a - b)
    );
  }, [suggestedMembers]);

  const currentSelectionSignature = useMemo(() => {
    if (!Array.isArray(cfg.member_user_ids) || cfg.member_user_ids.length === 0) {
      return null;
    }

    return JSON.stringify(
      [...cfg.member_user_ids.map((memberId) => Number(memberId))].sort((a, b) => a - b)
    );
  }, [cfg.member_user_ids]);

  const showRestoreMembers =
    Boolean(defaultSelectionSignature) && defaultSelectionSignature !== currentSelectionSignature;

  const handleRestoreMembers = useCallback(() => {
    if (suggestedMembers?.length) {
      updateConfiguration(cfg.id, {
        member_user_ids: suggestedMembers.map((member: any) => Number(member.id)),
      });
    }
  }, [cfg.id, suggestedMembers, updateConfiguration]);

  const handleAssignmentScopeChange = useCallback(
    (value: string) => {
      updateConfiguration(cfg.id, {
        assignment_scope: value,
        member_user_ids: [],
      });
    },
    [cfg.id, updateConfiguration]
  );

  const handleToggleMember = useCallback(
    (member: any) => {
      const current = Array.isArray(cfg.member_user_ids) ? cfg.member_user_ids : [];
      const next = new Set(current.map((memberId) => Number(memberId)));
      const memberId = Number(member.id);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      updateConfiguration(cfg.id, { member_user_ids: Array.from(next) });
    },
    [cfg.id, cfg.member_user_ids, updateConfiguration]
  );

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

  if (isCube) {
    return (
      <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-lg font-semibold text-gray-900">
              {configurationLabel} #{index + 1}: {cfg.name || "Untitled"}
            </p>
            <p className="text-sm text-gray-600">
              Build a cube-instance with region, size, image, storage, and networking.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {onSaveTemplate && (
              <button
                type="button"
                onClick={() => onSaveTemplate(cfg)}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100 hover:text-primary-700 focus:outline-none"
                title="Save as Template"
              >
                <Save className="h-4 w-4" />
                Save Template
              </button>
            )}
            {totalConfigurations > 1 && (
              <button
                type="button"
                onClick={() => removeConfiguration(cfg.id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>

        {showTemplateSelector && onTemplateSelect && (
          <TemplateSelector onSelect={onTemplateSelect} primaryActionLabel="Apply template" />
        )}

        <div className="space-y-5">
          <SectionWrapper
            title="1. Region & project"
            description="Select the region and decide whether to use an existing project or create a new one."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ModernSelect
                label="Region *"
                value={cfg.region || ""}
                onChange={(e) => {
                  const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                  updateConfigWithFocus({
                    region: e.target.value,
                    region_label: e.target.value ? selectedLabel : "",
                  });
                }}
                placeholder=""
                options={[{ value: "", label: "Select region" }, ...regionOptions]}
                helper="Region code used for pricing and provisioning."
                disabled={isLoadingResources}
              />
              <ModernSelect
                label="Project mode"
                value={effectiveProjectMode}
                onChange={(e) => handleProjectModeChange(e.target.value)}
                options={PROJECT_MODE_OPTIONS}
                helper={isTemplateLocked ? "Project mode is locked by the template." : ""}
                disabled={isTemplateLocked}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Duration (Months) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.months}
                  onChange={(e) => updateConfigWithFocus({ months: e.target.value })}
                />
              </div>
            </div>

            {effectiveProjectMode === "existing" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <SearchableSelect
                  label="Project *"
                  value={projectSelectValue}
                  onChange={(e) => handleProjectSelection(e.target.value)}
                  options={[{ value: "", label: "Select project" }, ...projectSelectOptions]}
                  helper="Choose an existing project for this configuration."
                  disabled={isTemplateLocked || !selectedRegion}
                />
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  {selectedProjectPreset ? (
                    <>
                      <p className="font-semibold text-gray-700">
                        Network preset: {selectedProjectPreset.name}
                      </p>
                      <p className="mt-1">{selectedProjectPreset.description}</p>
                      {Array.isArray(selectedProjectPreset.features) &&
                        selectedProjectPreset.features.length > 0 && (
                          <p className="mt-1 text-gray-500">
                            Includes: {selectedProjectPreset.features.join(", ")}
                          </p>
                        )}
                      {hasFloatingIp && !isSelectedProjectPresetPublic && (
                        <p className="mt-2 text-xs text-amber-600">
                          Elastic IPs require a public preset. This project is private and will be
                          upgraded during provisioning.
                        </p>
                      )}
                    </>
                  ) : selectedProject ? (
                    <p className="text-gray-500">
                      No preset recorded. This project will use its existing network resources.
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Select a project to view its network preset details.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Project name *
                    </label>
                    <input
                      type="text"
                      data-focus-key={focusKey("project_name")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      value={cfg.project_name || ""}
                      onChange={(e) => updateConfigWithFocus({ project_name: e.target.value })}
                      placeholder="Enter project name"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Project will be created after payment and uses the selected preset.
                    </p>
                  </div>
                  <ModernSelect
                    label="Network preset *"
                    value={networkPresetValue}
                    onChange={(e) => updateConfigWithFocus({ network_preset: e.target.value })}
                    options={[{ value: "", label: "Select network preset" }, ...presetOptions]}
                    helper="Choose the base network layout for this new project."
                    disabled={isSubmitting}
                  />
                </div>
                {selectedPreset ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                    <p className="font-semibold text-gray-700">{selectedPreset.name}</p>
                    <p className="mt-1">{selectedPreset.description}</p>
                    {Array.isArray(selectedPreset.features) &&
                      selectedPreset.features.length > 0 && (
                        <p className="mt-1 text-gray-500">
                          Includes: {selectedPreset.features.join(", ")}
                        </p>
                      )}
                    <p className="mt-2 text-xs text-gray-500">
                      {hasFloatingIp
                        ? `Elastic IPs: ${normalizedFloatingIpCount} will be allocated and attached during provisioning.`
                        : 'Elastic IPs: none requested. Enable "Attach EIP when provisioning" to attach one.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Select a preset to see the network layout that will be provisioned.
                  </p>
                )}
              </div>
            )}
          </SectionWrapper>

          {hasMembershipStep && (
            <SectionWrapper
              title={`${membershipStep}. Project membership`}
              description="Choose who should be granted access on this new project."
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Assignment Scope
                  </label>
                  {lockAssignmentScope ? (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {assignmentScopeDetails?.label || "Internal (admins)"}
                      </p>
                      {assignmentScopeDetails?.description ? (
                        <p className="mt-1 text-xs text-gray-500">
                          {assignmentScopeDetails.description}
                        </p>
                      ) : null}
                      <p className="mt-2 text-[11px] text-gray-400">
                        Controlled by Customer Context in the workflow step.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {PROJECT_MEMBERSHIP_SCOPES.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleAssignmentScopeChange(option.value)}
                          className={`rounded-2xl border p-4 text-left transition-all ${
                            assignmentScope === option.value
                              ? "border-primary-500 bg-primary-50 ring-1 ring-primary-200"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Project Members</label>
                    {showRestoreMembers && (
                      <button
                        type="button"
                        onClick={handleRestoreMembers}
                        className="text-xs text-primary-600 hover:underline"
                        disabled={isMembersFetching}
                      >
                        Restore default selection
                      </button>
                    )}
                  </div>

                  {shouldFetchMembers ? (
                    <>
                      <div className="min-h-[48px] rounded-2xl border border-gray-200 px-3 py-2 bg-white">
                        {isMembersFetching && selectedMembers.length === 0 ? (
                          <div className="flex items-center text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading members...
                          </div>
                        ) : selectedMembers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedMembers.map((member: any) => (
                              <span
                                key={member.id}
                                className="inline-flex items-center bg-primary-600 text-white text-xs px-3 py-1 rounded-full"
                              >
                                {member.name || member.email || `User #${member.id}`}
                                <button
                                  type="button"
                                  className="ml-2 text-white hover:text-gray-100"
                                  onClick={() => handleToggleMember(member)}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No members selected yet. Use the suggestions below to choose who should
                            join the project.
                          </p>
                        )}
                      </div>

                      <div className="mt-3 rounded-2xl border border-gray-200 bg-white">
                        <div className="px-4 py-2 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                          Suggested members
                        </div>
                        {isMembersFetching ? (
                          <div className="flex items-center px-4 py-3 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Fetching latest workspace members...
                          </div>
                        ) : suggestedMembers.length > 0 ? (
                          <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                            {suggestedMembers.map((member: any) => {
                              const isSelected = selectedMemberIds.has(Number(member.id));
                              return (
                                <label
                                  key={member.id}
                                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    checked={isSelected}
                                    onChange={() => handleToggleMember(member)}
                                  />
                                  <div>
                                    <p className="text-sm font-medium text-gray-700">
                                      {member.name || member.email || `User #${member.id}`}
                                    </p>
                                    {member.email && (
                                      <p className="text-xs text-gray-500">{member.email}</p>
                                    )}
                                    {member.role && (
                                      <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1">
                                        {member.role}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="px-4 py-3 text-sm text-gray-500">
                            No suggested members for this scope yet. Adjust the assignment settings
                            or choose a different customer context.
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Select a matching tenant or user to load membership suggestions.
                    </p>
                  )}
                </div>
              </div>
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
                const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                updateConfigWithFocus({
                  compute_instance_id: e.target.value,
                  compute_label: e.target.value ? selectedLabel : "",
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
                const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                updateConfigWithFocus({
                  os_image_id: e.target.value,
                  os_image_label: e.target.value ? selectedLabel : "",
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
            <div className="grid gap-4 md:grid-cols-3">
              <SearchableSelect
                label="Boot Volume Type *"
                value={cfg.volume_type_id}
                onChange={(e) => {
                  const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                  updateConfigWithFocus({
                    volume_type_id: e.target.value,
                    volume_type_label: e.target.value ? selectedLabel : "",
                  });
                }}
                options={[
                  {
                    value: "",
                    label: selectedRegion ? "Select volume type" : "Select region first",
                  },
                  ...volumeTypeOptions,
                ]}
                helper={
                  templateVolumeLabel
                    ? `Template: ${templateVolumeLabel}`
                    : "Choose the primary volume class."
                }
                disabled={!selectedRegion}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Size (GB) *</label>
                <input
                  type="number"
                  min="10"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.storage_size_gb}
                  onChange={(e) => updateConfigWithFocus({ storage_size_gb: e.target.value })}
                />
                {templateVolumeSize ? (
                  <p className="mt-1 text-xs text-gray-500">Template size: {templateVolumeSize}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">Additional data volumes</span>
                <ModernButton
                  variant="outline"
                  onClick={() => addAdditionalVolume(cfg.id)}
                  size="sm"
                >
                  Add data volume
                </ModernButton>
              </div>
              {(cfg.additional_volumes || []).length === 0 && (
                <p className="text-xs text-gray-500">
                  No extra data volumes. Click “Add data volume” to attach more storage.
                </p>
              )}
              {(cfg.additional_volumes || []).map((vol) => (
                <div
                  key={vol.id}
                  className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 md:grid-cols-3"
                >
                  <SearchableSelect
                    label="Volume type"
                    value={vol.volume_type_id}
                    onChange={(e) =>
                      updateAdditionalVolume(cfg.id, vol.id, { volume_type_id: e.target.value })
                    }
                    options={[
                      {
                        value: "",
                        label: selectedRegion ? "Select volume type" : "Select region first",
                      },
                      ...volumeTypeOptions,
                    ]}
                    helper="Data volume class."
                    disabled={!selectedRegion}
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Size (GB)
                    </label>
                    <input
                      type="number"
                      min="10"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      value={vol.storage_size_gb}
                      onChange={(e) =>
                        updateAdditionalVolume(cfg.id, vol.id, {
                          storage_size_gb: e.target.value,
                        })
                      }
                    />
                    <p className="mt-1 text-xs text-gray-500">Capacity for this data volume.</p>
                  </div>
                  <div className="flex items-end justify-end">
                    <ModernButton
                      variant="ghost"
                      onClick={() => removeAdditionalVolume(cfg.id, vol.id)}
                    >
                      Remove
                    </ModernButton>
                  </div>
                </div>
              ))}
            </div>
          </SectionWrapper>

          {effectiveProjectMode === "existing" && (
            <SectionWrapper
              title={`${networkingStep}. Networking`}
              description="Attach networks, bandwidth, and security groups."
            >
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
                    const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                    updateConfigWithFocus({
                      subnet_id: e.target.value,
                      subnet_label: e.target.value ? selectedLabel : "",
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
                    options={[
                      { value: "", label: "Select bandwidth (optional)" },
                      ...bandwidthOptions,
                    ]}
                    helper="Optional. Leave blank if not required."
                    disabled={isLoadingResources}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
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
                        updateConfigWithFocus({
                          floating_ip_count: e.target.checked ? 1 : 0,
                        })
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Security Groups (Optional)
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {isProjectScoped ? (
                      (Array.isArray(securityGroups) && securityGroups.length > 0
                        ? securityGroups
                        : []
                      ).map((sg: any) => {
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
            </SectionWrapper>
          )}

          <SectionWrapper
            title={`${accessKeysStep}. Access keys`}
            description="Choose an existing SSH key pair or create a new one."
          >
            {isNewProject ? (
              !hasRegion ? (
                <p className="text-xs text-gray-500">
                  Select a region to configure an SSH key pair for this new project.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                    Keypair will be created when the project is provisioned.
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Key pair name (optional)
                      </label>
                      <input
                        type="text"
                        data-focus-key={focusKey("keypair_name")}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={cfg.keypair_name || ""}
                        onChange={(e) => updateConfigWithFocus({ keypair_name: e.target.value })}
                        placeholder="e.g. cube-instance-key"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Public key (optional)
                      </label>
                      <input
                        type="text"
                        data-focus-key={focusKey("keypair_public_key")}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        value={cfg.keypair_public_key || ""}
                        onChange={(e) =>
                          updateConfigWithFocus({ keypair_public_key: e.target.value })
                        }
                        placeholder="ssh-rsa AAAA..."
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Leave blank to skip keypair creation. You can add keys later in the project.
                  </p>
                </div>
              )
            ) : !canManageKeypairs ? (
              <p className="text-xs text-gray-500">
                Key pairs require an existing project. Select a project to manage SSH keys.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={keypairModeName}
                      value="existing"
                      checked={keypairMode === "existing"}
                      onChange={() => {
                        preserveInputState(() => {
                          setKeypairMode("existing");
                          setKeypairMaterial(null);
                          setHasDownloadedKeypair(false);
                        });
                      }}
                    />
                    Use existing key pair
                  </label>
                  <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={keypairModeName}
                      value="create"
                      checked={keypairMode === "create"}
                      onChange={() => {
                        preserveInputState(() => {
                          setKeypairMode("create");
                          setKeypairMaterial(null);
                          setHasDownloadedKeypair(false);
                        });
                      }}
                    />
                    Create new key pair
                  </label>
                </div>

                {keypairMode === "existing" ? (
                  <SearchableSelect
                    label="Key pair"
                    value={cfg.keypair_name}
                    onChange={(e) => {
                      const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                      updateConfigWithFocus({
                        keypair_name: e.target.value,
                        keypair_label: e.target.value ? selectedLabel : "",
                      });
                    }}
                    options={[
                      { value: "", label: "Select key pair (optional)" },
                      ...resolvedKeyPairOptions,
                    ]}
                    helper="Select SSH key pair to authorize access."
                    disabled={!canSelectExistingKeypairs}
                  />
                ) : (
                  <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Key pair name *
                        </label>
                        <input
                          type="text"
                          data-focus-key={focusKey("keypair_name_create")}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          value={keypairNameInput}
                          onChange={(e) => setKeypairNameInput(e.target.value)}
                          placeholder="e.g. cube-instance-key"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Public key (optional)
                        </label>
                        <input
                          type="text"
                          data-focus-key={focusKey("keypair_public_create")}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                          value={keypairPublicKey}
                          onChange={(e) => setKeypairPublicKey(e.target.value)}
                          placeholder="ssh-rsa AAAA..."
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <ModernButton
                        variant="outline"
                        size="sm"
                        onClick={handleCreateKeypair}
                        isDisabled={isCreatingKeypair || !keypairNameInput.trim()}
                      >
                        {isCreatingKeypair ? "Creating..." : "Create key pair"}
                      </ModernButton>
                      {keypairMaterial && (
                        <ModernButton
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            downloadPrivateKey(keypairMaterial, keypairNameInput || "keypair")
                          }
                          isDisabled={hasDownloadedKeypair}
                        >
                          {hasDownloadedKeypair ? "Downloaded" : "Download private key"}
                        </ModernButton>
                      )}
                      {keypairMaterial && !hasDownloadedKeypair && (
                        <span className="text-xs text-amber-700">
                          Download the private key once and store it securely.
                        </span>
                      )}
                      {keypairMaterial && hasDownloadedKeypair && (
                        <span className="text-xs text-gray-500">
                          Key pair is selected for this instance.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </SectionWrapper>

          <SectionWrapper
            title={`${effectiveProjectMode === "existing" ? 7 : 6}. Finalize details`}
            description="Name, quantity, and optional tags for this cube-instance."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {resourceLabel} name *
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
                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity *</label>
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tags (Optional)
              </label>
              <TagsInput
                value={cfg.tags || ""}
                onChange={(next) => updateConfigWithFocus({ tags: next })}
                placeholder="Type a tag and press comma"
                dataFocusKey={focusKey("tags")}
              />
              <p className="mt-1 text-xs text-gray-500">
                Press comma or enter to create a tag pill.
              </p>
            </div>
          </SectionWrapper>
        </div>

        {showActionRow && (
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <ModernButton
              variant="outline"
              onClick={() => onAddConfiguration?.()}
              style={{
                borderRadius: "999px",
                padding: "12px 22px",
                fontSize: "15px",
                lineHeight: "22px",
                backgroundColor: "var(--theme-card-bg)",
                border: "1px solid rgb(var(--theme-color-300))",
                color: "var(--theme-color)",
                boxShadow: "0 1px 2px rgba(var(--theme-color-rgb), 0.15)",
              }}
            >
              <span className="mr-2 text-lg leading-none text-primary-600">+</span>
              {addConfigurationLabel}
            </ModernButton>
            <div className="flex flex-wrap items-center gap-3">
              <ModernButton
                variant="ghost"
                onClick={() => onBackToWorkflow?.()}
                style={{
                  borderRadius: "999px",
                  padding: "12px 26px",
                  fontSize: "15px",
                  lineHeight: "22px",
                  border: "1px solid var(--theme-border-color)",
                  backgroundColor: "var(--theme-card-bg)",
                  color: "var(--theme-heading-color)",
                }}
              >
                Back to workflow
              </ModernButton>
              <ModernButton
                variant="primary"
                onClick={() => onSubmitConfigurations?.()}
                isDisabled={isSubmitting}
                style={{
                  borderRadius: "999px",
                  padding: "14px 32px",
                  fontSize: "16px",
                  fontWeight: 600,
                  minWidth: "230px",
                  backgroundColor: "var(--theme-color)",
                  color: "#FFFFFF",
                  border: "1px solid var(--theme-color)",
                  boxShadow: "0 10px 20px rgba(var(--theme-color-rgb), 0.2)",
                }}
                className="shadow-md shadow-primary-500/25 hover:-trangray-y-0.5 transition-all"
              >
                {isSubmitting ? submittingLabel : submitLabel}
              </ModernButton>
            </div>
          </div>
        )}
      </ModernCard>
    );
  }

  return (
    <ModernCard variant="outlined" padding="lg" className="space-y-6" onClick={undefined}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">
            {configurationLabel} #{index + 1}: {cfg.name || "Untitled"}
          </p>
          <p className="text-sm text-gray-600">
            Define {resourceLabel.toLowerCase()}s, storage, and networking for this configuration.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onSaveTemplate && (
            <button
              type="button"
              onClick={() => onSaveTemplate(cfg)}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-100 hover:text-primary-700 focus:outline-none"
              title="Save as Template"
            >
              <Save className="h-4 w-4" />
              Save Template
            </button>
          )}
          {totalConfigurations > 1 && (
            <button
              type="button"
              onClick={() => removeConfiguration(cfg.id)}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      {showTemplateSelector && onTemplateSelect && (
        <TemplateSelector onSelect={onTemplateSelect} primaryActionLabel="Apply template" />
      )}

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
        <div className="grid gap-4 md:grid-cols-2">
          <ModernSelect
            label="Region *"
            value={cfg.region || ""}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfigWithFocus({
                region: e.target.value,
                region_label: e.target.value ? selectedLabel : "",
              });
            }}
            placeholder=""
            options={[{ value: "", label: "Select region" }, ...regionOptions]}
            helper="Region code used for pricing and provisioning."
            disabled={isLoadingResources}
          />
          <ModernSelect
            label="Project mode"
            value={effectiveProjectMode}
            onChange={(e) => handleProjectModeChange(e.target.value)}
            options={PROJECT_MODE_OPTIONS}
            helper={isTemplateLocked ? "Project mode is locked by the template." : ""}
            disabled={isTemplateLocked}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Duration (Months) *
            </label>
            <input
              type="number"
              min="1"
              max="36"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.months}
              onChange={(e) => updateConfigWithFocus({ months: e.target.value })}
            />
          </div>
        </div>
        {effectiveProjectMode === "existing" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SearchableSelect
              label="Project *"
              value={projectSelectValue}
              onChange={(e) => handleProjectSelection(e.target.value)}
              options={[{ value: "", label: "Select project" }, ...projectSelectOptions]}
              helper="Choose an existing project for this configuration."
              disabled={isTemplateLocked || !selectedRegion}
            />
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              {selectedProjectPreset ? (
                <>
                  <p className="font-semibold text-gray-700">
                    Network preset: {selectedProjectPreset.name}
                  </p>
                  <p className="mt-1">{selectedProjectPreset.description}</p>
                  {Array.isArray(selectedProjectPreset.features) &&
                    selectedProjectPreset.features.length > 0 && (
                      <p className="mt-1 text-gray-500">
                        Includes: {selectedProjectPreset.features.join(", ")}
                      </p>
                    )}
                  {hasFloatingIp && !isSelectedProjectPresetPublic && (
                    <p className="mt-2 text-xs text-amber-600">
                      Elastic IPs require a public preset. This project is private and will be
                      upgraded during provisioning.
                    </p>
                  )}
                </>
              ) : selectedProject ? (
                <p className="text-gray-500">
                  No preset recorded. This project will use its existing network resources.
                </p>
              ) : (
                <p className="text-gray-500">
                  Select a project to view its network preset details.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Project name *
                </label>
                <input
                  type="text"
                  data-focus-key={focusKey("project_name")}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  value={cfg.project_name || ""}
                  onChange={(e) => updateConfigWithFocus({ project_name: e.target.value })}
                  placeholder="Enter project name"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Project will be created after payment and uses the selected preset.
                </p>
              </div>
              <ModernSelect
                label="Network preset *"
                value={networkPresetValue}
                onChange={(e) => updateConfigWithFocus({ network_preset: e.target.value })}
                options={[{ value: "", label: "Select network preset" }, ...presetOptions]}
                helper="Choose the base network layout for this new project."
                disabled={isSubmitting}
              />
            </div>
            {selectedPreset ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-700">{selectedPreset.name}</p>
                <p className="mt-1">{selectedPreset.description}</p>
                {Array.isArray(selectedPreset.features) && selectedPreset.features.length > 0 && (
                  <p className="mt-1 text-gray-500">
                    Includes: {selectedPreset.features.join(", ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  {hasFloatingIp
                    ? `Elastic IPs: ${normalizedFloatingIpCount} will be allocated and attached during provisioning.`
                    : 'Elastic IPs: none requested. Enable "Attach EIP when provisioning" to attach one.'}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Select a preset to see the network layout that will be provisioned.
              </p>
            )}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <SearchableSelect
            label="Instance Type *"
            value={cfg.compute_instance_id}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfigWithFocus({
                compute_instance_id: e.target.value,
                compute_label: e.target.value ? selectedLabel : "",
              });
            }}
            options={[
              { value: "", label: selectedRegion ? "Select instance type" : "Select region first" },
              ...computeOptions,
            ]}
            helper={
              templateComputeLabel
                ? `Template: ${templateComputeLabel}`
                : "Select the compute flavor."
            }
            disabled={!selectedRegion}
          />
          <SearchableSelect
            label="OS Image *"
            value={cfg.os_image_id}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfigWithFocus({
                os_image_id: e.target.value,
                os_image_label: e.target.value ? selectedLabel : "",
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
                  updateConfigWithFocus({
                    floating_ip_count: e.target.checked ? 1 : 0,
                  })
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
        <div className="grid gap-4 md:grid-cols-3">
          <SearchableSelect
            label="Volume 1 (Boot Volume) Type *"
            value={cfg.volume_type_id}
            onChange={(e) => {
              const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
              updateConfigWithFocus({
                volume_type_id: e.target.value,
                volume_type_label: e.target.value ? selectedLabel : "",
              });
            }}
            options={[
              { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
              ...volumeTypeOptions,
            ]}
            helper={
              templateVolumeLabel
                ? `Template: ${templateVolumeLabel}`
                : "Choose the primary volume class."
            }
            disabled={!selectedRegion}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Size (GB) *</label>
            <input
              type="number"
              min="10"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              value={cfg.storage_size_gb}
              onChange={(e) => updateConfigWithFocus({ storage_size_gb: e.target.value })}
            />
            {templateVolumeSize ? (
              <p className="mt-1 text-xs text-gray-500">Template size: {templateVolumeSize}</p>
            ) : null}
          </div>
        </div>
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
                const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                updateConfigWithFocus({
                  subnet_id: e.target.value,
                  subnet_label: e.target.value ? selectedLabel : "",
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
                  ).map((sg: any) => {
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
        {isNewProject ? (
          !hasRegion ? (
            <p className="text-xs text-gray-500">
              Select a region to configure an SSH key pair for this new project.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                Keypair will be created when the project is provisioned.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Key pair name (optional)
                  </label>
                  <input
                    type="text"
                    data-focus-key={focusKey("keypair_name")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={cfg.keypair_name || ""}
                    onChange={(e) => updateConfigWithFocus({ keypair_name: e.target.value })}
                    placeholder="e.g. cube-instance-key"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Public key (optional)
                  </label>
                  <input
                    type="text"
                    data-focus-key={focusKey("keypair_public_key")}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                    value={cfg.keypair_public_key || ""}
                    onChange={(e) => updateConfigWithFocus({ keypair_public_key: e.target.value })}
                    placeholder="ssh-rsa AAAA..."
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Leave blank to skip keypair creation. You can add keys later in the project.
              </p>
            </div>
          )
        ) : !canManageKeypairs ? (
          <p className="text-xs text-gray-500">
            Key pairs require an existing project. Select a project to manage SSH keys.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name={keypairModeName}
                  value="existing"
                  checked={keypairMode === "existing"}
                  onChange={() => {
                    preserveInputState(() => {
                      setKeypairMode("existing");
                      setKeypairMaterial(null);
                      setHasDownloadedKeypair(false);
                    });
                  }}
                />
                Use existing key pair
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name={keypairModeName}
                  value="create"
                  checked={keypairMode === "create"}
                  onChange={() => {
                    preserveInputState(() => {
                      setKeypairMode("create");
                      setKeypairMaterial(null);
                      setHasDownloadedKeypair(false);
                    });
                  }}
                />
                Create new key pair
              </label>
            </div>
            {keypairMode === "existing" ? (
              <SearchableSelect
                label="Key pair"
                value={cfg.keypair_name}
                onChange={(e) => {
                  const selectedLabel = e.target.selectedOptions?.[0]?.text || "";
                  updateConfigWithFocus({
                    keypair_name: e.target.value,
                    keypair_label: e.target.value ? selectedLabel : "",
                  });
                }}
                options={[
                  { value: "", label: "Select key pair (optional)" },
                  ...resolvedKeyPairOptions,
                ]}
                helper="Select SSH key pair to authorize access."
                disabled={!canSelectExistingKeypairs}
              />
            ) : (
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Key pair name *
                    </label>
                    <input
                      type="text"
                      data-focus-key={focusKey("keypair_name_create")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      value={keypairNameInput}
                      onChange={(e) => setKeypairNameInput(e.target.value)}
                      placeholder="e.g. cube-instance-key"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Public key (optional)
                    </label>
                    <input
                      type="text"
                      data-focus-key={focusKey("keypair_public_create")}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                      value={keypairPublicKey}
                      onChange={(e) => setKeypairPublicKey(e.target.value)}
                      placeholder="ssh-rsa AAAA..."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <ModernButton
                    variant="outline"
                    size="sm"
                    onClick={handleCreateKeypair}
                    isDisabled={isCreatingKeypair || !keypairNameInput.trim()}
                  >
                    {isCreatingKeypair ? "Creating..." : "Create key pair"}
                  </ModernButton>
                  {keypairMaterial && (
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        downloadPrivateKey(keypairMaterial, keypairNameInput || "keypair")
                      }
                      isDisabled={hasDownloadedKeypair}
                    >
                      {hasDownloadedKeypair ? "Downloaded" : "Download private key"}
                    </ModernButton>
                  )}
                  {keypairMaterial && !hasDownloadedKeypair && (
                    <span className="text-xs text-amber-700">
                      Download the private key once and store it securely.
                    </span>
                  )}
                  {keypairMaterial && hasDownloadedKeypair && (
                    <span className="text-xs text-gray-500">
                      Key pair is selected for this instance.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Additional data volumes</span>
          <ModernButton variant="outline" onClick={() => addAdditionalVolume(cfg.id)} size="sm">
            Add data volume
          </ModernButton>
        </div>
        {(cfg.additional_volumes || []).length === 0 && (
          <p className="text-xs text-gray-500">
            No extra data volumes. Click “Add data volume” to attach more storage.
          </p>
        )}
        {(cfg.additional_volumes || []).map((vol) => (
          <div
            key={vol.id}
            className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 md:grid-cols-3"
          >
            <SearchableSelect
              label="Volume type"
              value={vol.volume_type_id}
              onChange={(e) =>
                updateAdditionalVolume(cfg.id, vol.id, { volume_type_id: e.target.value })
              }
              options={[
                { value: "", label: selectedRegion ? "Select volume type" : "Select region first" },
                ...volumeTypeOptions,
              ]}
              helper="Data volume class."
              disabled={!selectedRegion}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Size (GB)</label>
              <input
                type="number"
                min="10"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                value={vol.storage_size_gb}
                onChange={(e) =>
                  updateAdditionalVolume(cfg.id, vol.id, { storage_size_gb: e.target.value })
                }
              />
              <p className="mt-1 text-xs text-gray-500">Capacity for this data volume.</p>
            </div>
            <div className="flex items-end justify-end">
              <ModernButton variant="ghost" onClick={() => removeAdditionalVolume(cfg.id, vol.id)}>
                Remove
              </ModernButton>
            </div>
          </div>
        ))}
      </div>

      {showActionRow && (
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <ModernButton
            variant="outline"
            onClick={() => onAddConfiguration?.()}
            style={{
              borderRadius: "999px",
              padding: "12px 22px",
              fontSize: "15px",
              lineHeight: "22px",
              backgroundColor: "var(--theme-card-bg)",
              border: "1px solid rgb(var(--theme-color-300))",
              color: "var(--theme-color)",
              boxShadow: "0 1px 2px rgba(var(--theme-color-rgb), 0.15)",
            }}
          >
            <span className="mr-2 text-lg leading-none text-primary-600">+</span>
            Add configuration
          </ModernButton>
          <div className="flex flex-wrap items-center gap-3">
            <ModernButton
              variant="ghost"
              onClick={() => onBackToWorkflow?.()}
              style={{
                borderRadius: "999px",
                padding: "12px 26px",
                fontSize: "15px",
                lineHeight: "22px",
                border: "1px solid var(--theme-border-color)",
                backgroundColor: "var(--theme-card-bg)",
                color: "var(--theme-heading-color)",
              }}
            >
              Back to workflow
            </ModernButton>
            <ModernButton
              variant="primary"
              onClick={() => onSubmitConfigurations?.()}
              isDisabled={isSubmitting}
              style={{
                borderRadius: "999px",
                padding: "14px 32px",
                fontSize: "16px",
                fontWeight: 600,
                minWidth: "230px",
                backgroundColor: "var(--theme-color)",
                color: "#FFFFFF",
                border: "1px solid var(--theme-color)",
                boxShadow: "0 10px 20px rgba(var(--theme-color-rgb), 0.2)",
              }}
              className="shadow-md shadow-primary-500/25 hover:-trangray-y-0.5 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create and price"}
            </ModernButton>
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default InstanceConfigurationForm;
