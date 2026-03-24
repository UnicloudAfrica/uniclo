import { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useCreateProject, useProjectMembershipSuggestions } from "@/hooks/adminHooks/projectHooks";
import { useNavigate } from "react-router-dom";
import ToastUtils from "@/utils/toastUtil";
import { useFetchTenants } from "@/hooks/adminHooks/tenantHooks";
import { useFetchClients } from "@/hooks/adminHooks/clientHooks";
import { DropdownSelect } from "./dropdownSelect"; // Ensure this path is correct
import { useFetchAvailabilityZones, useFetchRegions } from "@/hooks/adminHooks/regionHooks";
import NetworkPresetSelector, {
  DEFAULT_PRESETS,
  type NetworkPreset,
} from "@/shared/components/network/NetworkPresetSelector";
import { useNetworkPresets } from "@/hooks/networkPresetHooks";
import { useCloudPolicies } from "@/hooks/adminHooks/cloudPolicyHooks";
const MAX_ATTEMPTS = 10;

type AssignmentScope = "internal" | "tenant" | "client";
type ProjectType = "vpc" | "dvs";

type CreateProjectFormData = {
  name: string;
  description: string;
  type: ProjectType;
  provider: string;
  availability_zone: string;
  tenant_id: string;
  client_id: string;
  region: string;
  assignment_scope: AssignmentScope;
  network_preset: string;
};

type CreateProjectErrorKey = keyof CreateProjectFormData | "member_user_ids";

type TenantOption = {
  id?: string | number;
  name?: string;
};

type ClientOption = {
  id?: string | number;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  email?: string;
  name?: string;
  displayLabel?: string;
};

type MemberOption = {
  id: string | number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
};

type CloudPolicy = {
  id: string | number;
  name?: string;
  description?: string;
  is_default?: boolean;
  is_compulsory?: boolean;
};

type MembersFetchKey = {
  key: string;
  defaultSignature: string | null;
  currentMemberIds: string;
} | null;

type RegionOption = {
  code?: string;
  name?: string;
  provider?: string;
  is_active?: boolean;
  is_verified?: boolean;
};

type AvailabilityZoneOption = {
  id?: string | number;
  code?: string;
  name?: string | null;
  provider?: string;
  is_active?: boolean;
  is_verified?: boolean;
  priority?: number;
};

type ScopeOption = {
  value: AssignmentScope;
  label: string;
  description: string;
};

type ProjectCreatePayload = {
  name: string;
  description: string;
  type: ProjectType;
  provider: string | null;
  availability_zone: string | null;
  tenant_id: string | null;
  client_id: string | null;
  user_id: string | null;
  region: string;
  assignment_scope: AssignmentScope;
  member_user_ids: number[];
  user_policies: Record<string, Array<string | number>>;
  metadata?:
    | {
        network_preset: string;
      }
    | undefined;
};

const INITIAL_FORM_STATE: CreateProjectFormData = {
  name: "",
  description: "",
  type: "vpc",
  provider: "",
  availability_zone: "",
  tenant_id: "",
  client_id: "",
  region: "",
  assignment_scope: "internal",
  network_preset: "", // Optional: standard, private, multi-tier, database
};

interface CreateProjectModalProps {
  onClose?: () => void;
  mode?: "modal" | "page";
}

const CreateProjectModal = ({ onClose, mode = "modal" }: CreateProjectModalProps) => {
  const isPageMode = mode === "page";
  const { mutate: createProject, isPending } = useCreateProject();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateProjectFormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Partial<Record<CreateProjectErrorKey, string | undefined>>>(
    {}
  );
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const { isFetching: isRegionsFetching, data: regionsData } = useFetchRegions();
  const { data: availabilityZonesData = [], isFetching: isAvailabilityZonesFetching } =
    useFetchAvailabilityZones(formData.region || null);
  const { data: tenantsData, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clientsData, isFetching: isClientsFetching } = useFetchClients();
  const { data: networkPresets = DEFAULT_PRESETS } = useNetworkPresets();
  const [selectedMembers, setSelectedMembers] = useState<MemberOption[]>([]);
  const [userPolicies, setUserPolicies] = useState<Record<string, Array<string | number>>>({});
  const regionList = useMemo<RegionOption[]>(() => {
    if (!Array.isArray(regionsData)) return [];
    return (regionsData as RegionOption[]).filter(
      (r) => r.name && r.name !== r.code && r.is_active !== false
    );
  }, [regionsData]);
  const availabilityZoneOptions = useMemo<AvailabilityZoneOption[]>(() => {
    if (!Array.isArray(availabilityZonesData)) return [];
    return [...(availabilityZonesData as AvailabilityZoneOption[])]
      .filter((zone) => zone.code && zone.is_active !== false)
      .sort((left, right) => {
        const verifiedSort = Number(right.is_verified ?? false) - Number(left.is_verified ?? false);
        if (verifiedSort !== 0) return verifiedSort;
        return Number(right.priority ?? 0) - Number(left.priority ?? 0);
      });
  }, [availabilityZonesData]);
  const selectedAvailabilityZone = useMemo(() => {
    if (!formData.availability_zone) return null;
    return (
      availabilityZoneOptions.find((zone) => zone.code === formData.availability_zone) ?? null
    );
  }, [availabilityZoneOptions, formData.availability_zone]);
  const selectedRegionProvider = useMemo(() => {
    if (selectedAvailabilityZone?.provider) {
      return selectedAvailabilityZone.provider;
    }
    if (formData.provider) {
      return formData.provider;
    }
    if (!formData.region || !regionList.length) return "";
    const match = regionList.find((r) => r.code === formData.region);
    return (match as any)?.provider || "";
  }, [formData.provider, formData.region, regionList, selectedAvailabilityZone]);

  const { data: cloudPoliciesData = [] } = useCloudPolicies(
    {
      region: formData.region,
      provider: selectedRegionProvider,
      active_only: true,
    },
    {
      enabled: !!formData.region,
    }
  );
  const tenantList = useMemo<TenantOption[]>(() => {
    if (Array.isArray(tenantsData)) return tenantsData as TenantOption[];
    if (tenantsData && typeof tenantsData === "object" && "data" in tenantsData) {
      const payload = tenantsData as { data?: unknown };
      return Array.isArray(payload.data) ? (payload.data as TenantOption[]) : [];
    }
    return [];
  }, [tenantsData]);
  const clientsList = useMemo<ClientOption[]>(
    () => (Array.isArray(clientsData) ? (clientsData as ClientOption[]) : []),
    [clientsData]
  );
  const cloudPolicies = useMemo<CloudPolicy[]>(
    () => (Array.isArray(cloudPoliciesData) ? (cloudPoliciesData as CloudPolicy[]) : []),
    [cloudPoliciesData]
  );
  const membersFetchKeyRef = useRef<MembersFetchKey>(null);
  const presetCatalog = useMemo<NetworkPreset[]>(
    () =>
      Array.isArray(networkPresets) && networkPresets.length > 0 ? networkPresets : DEFAULT_PRESETS,
    [networkPresets]
  );

  const shouldFetchMembers = useMemo(() => {
    if (formData.assignment_scope === "internal") {
      return true;
    }

    if (formData.assignment_scope === "tenant") {
      return Boolean(formData.tenant_id);
    }

    if (formData.assignment_scope === "client") {
      return Boolean(formData.client_id) || Boolean(formData.tenant_id);
    }

    return false;
  }, [formData.assignment_scope, formData.tenant_id, formData.client_id]);

  const membershipParams = useMemo<{
    scope: AssignmentScope;
    tenant_id?: string | undefined;
    client_id?: string | undefined;
  } | null>(() => {
    if (!shouldFetchMembers) {
      return null;
    }

    return {
      scope: formData.assignment_scope,
      tenant_id:
        formData.assignment_scope === "internal" ? undefined : formData.tenant_id || undefined,
      client_id: formData.client_id || undefined,
    };
  }, [shouldFetchMembers, formData.assignment_scope, formData.tenant_id, formData.client_id]);

  const { data: suggestedMembersData = [], isFetching: isMembersFetching } =
    useProjectMembershipSuggestions(membershipParams ?? {}, {
      enabled: shouldFetchMembers && !!membershipParams,
    });
  const suggestedMembers = useMemo<MemberOption[]>(
    () => (Array.isArray(suggestedMembersData) ? (suggestedMembersData as MemberOption[]) : []),
    [suggestedMembersData]
  );

  useEffect(() => {
    if (!formData.region) {
      return;
    }

    if (availabilityZoneOptions.length === 0) {
      setFormData((prev) => {
        if (!prev.availability_zone && !prev.provider) {
          return prev;
        }

        return {
          ...prev,
          availability_zone: "",
          provider: "",
        };
      });
      return;
    }

    setFormData((prev) => {
      const currentZone = availabilityZoneOptions.find((zone) => zone.code === prev.availability_zone);

      if (currentZone) {
        const resolvedProvider = currentZone.provider || "";
        if (prev.provider === resolvedProvider) {
          return prev;
        }

        return {
          ...prev,
          provider: resolvedProvider,
        };
      }

      const preferredZone =
        availabilityZoneOptions.find((zone) => zone.provider === "zadara") ??
        availabilityZoneOptions[0];

      if (!preferredZone?.code) {
        return prev;
      }

      return {
        ...prev,
        availability_zone: preferredZone.code,
        provider: preferredZone.provider || "",
      };
    });
  }, [availabilityZoneOptions, formData.region]);

  useEffect(() => {
    if (!shouldFetchMembers) {
      setSelectedMembers([]);
      membersFetchKeyRef.current = null;
      return;
    }

    if (isMembersFetching) {
      return;
    }

    const scopeKey = JSON.stringify([
      formData.assignment_scope,
      formData.assignment_scope === "internal" ? null : formData.tenant_id || null,
      formData.client_id || null,
    ]);

    const suggestedMemberIds = suggestedMembers
      .map((member) => Number(member.id))
      .sort((a, b) => a - b);
    const newDefaultSignature = suggestedMembers.length ? JSON.stringify(suggestedMemberIds) : null;
    const currentMemberIds = selectedMembers
      .map((member) => Number(member.id))
      .sort((a, b) => a - b);
    const currentSignatureStr = selectedMembers.length ? JSON.stringify(currentMemberIds) : null;

    const lastState = membersFetchKeyRef.current;

    const shouldSyncFromSuggestions =
      lastState?.key !== scopeKey ||
      (!!newDefaultSignature &&
        lastState.defaultSignature !== newDefaultSignature &&
        currentSignatureStr === lastState.defaultSignature);

    if (shouldSyncFromSuggestions) {
      setSelectedMembers(suggestedMembers || []);
    }

    membersFetchKeyRef.current = {
      key: scopeKey,
      defaultSignature: newDefaultSignature,
      currentMemberIds: JSON.stringify(currentMemberIds),
    };
  }, [
    shouldFetchMembers,
    isMembersFetching,
    suggestedMembers,
    selectedMembers,
    formData.assignment_scope,
    formData.tenant_id,
    formData.client_id,
  ]);

  const handleRestoreMembers = () => {
    if (suggestedMembers.length) {
      setSelectedMembers(suggestedMembers);
      setErrors((prev) => ({
        ...prev,
        member_user_ids: undefined,
      }));
    }
  };

  const handleToggleMember = (member: MemberOption) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((item) => item.id === member.id);
      if (exists) {
        return prev.filter((item) => item.id !== member.id);
      }
      return [...prev, member];
    });

    setErrors((prev) => ({
      ...prev,
      member_user_ids: undefined,
    }));
  };

  const handleTogglePolicy = (userId: string | number, policyId: string | number) => {
    setUserPolicies((prev) => {
      const key = String(userId);
      const current = prev[key] || [];
      if (current.includes(policyId)) {
        return { ...prev, [key]: current.filter((id) => id !== policyId) };
      }
      return { ...prev, [key]: [...current, policyId] };
    });
  };

  const compulsoryPolicyIds = useMemo(() => {
    return cloudPolicies.filter((policy) => policy.is_default).map((policy) => policy.id);
  }, [cloudPolicies]);

  useEffect(() => {
    if (selectedMembers.length > 0 && cloudPolicies.length > 0) {
      setUserPolicies((prev) => {
        const next = { ...prev };
        selectedMembers.forEach((member) => {
          next[member.id] ??= [...compulsoryPolicyIds];
        });
        return next;
      });
    }
  }, [selectedMembers, compulsoryPolicyIds, cloudPolicies.length]);

  const clientOptions = useMemo<ClientOption[]>(() => {
    return clientsList.map((client) => {
      const fullName = [client.first_name, client.middle_name, client.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        ...client,
        displayLabel: fullName || client.email || "Unnamed client",
      };
    });
  }, [clientsList]);

  const scopeOptions = useMemo<ScopeOption[]>(
    () => [
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
        description: "Attach to a client’s workspace or tenant membership if available.",
      },
    ],
    []
  );

  const defaultSelectionSignature = useMemo(() => {
    if (!suggestedMembers?.length) {
      return null;
    }
    return JSON.stringify(
      suggestedMembers.map((member) => Number(member.id)).sort((a, b) => a - b)
    );
  }, [suggestedMembers]);

  const currentSelectionSignature = useMemo(() => {
    if (!selectedMembers.length) {
      return null;
    }
    return JSON.stringify(selectedMembers.map((member) => Number(member.id)).sort((a, b) => a - b));
  }, [selectedMembers]);

  const showRestoreMembers =
    Boolean(defaultSelectionSignature) && defaultSelectionSignature !== currentSelectionSignature;

  const validateForm = () => {
    const newErrors: Partial<Record<CreateProjectErrorKey, string | undefined>> = {};
    if (!formData.name.trim()) {
      newErrors["name"] = "Project Name is required";
    }
    if (!formData.type) {
      newErrors["type"] = "Type is required";
    }
    if (!formData.region) {
      newErrors["region"] = "Default Region is required";
    }
    if (formData.region && availabilityZoneOptions.length > 0 && !formData.availability_zone) {
      newErrors["availability_zone"] = "Availability zone is required";
    }
    if (formData.assignment_scope === "tenant" && !formData.tenant_id) {
      newErrors["tenant_id"] = "Select a tenant when assigning the project to a tenant.";
    }
    if (formData.assignment_scope === "client" && !formData.client_id) {
      newErrors["client_id"] = "Select a client to assign this project.";
    }
    if (shouldFetchMembers && !isMembersFetching && selectedMembers.length === 0) {
      newErrors["member_user_ids"] = "Select at least one project member.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = <K extends keyof CreateProjectFormData>(
    field: K,
    value: CreateProjectFormData[K]
  ) => {
    setFormData((prev) => {
      let next = { ...prev, [field]: value };

      if (field === "assignment_scope") {
        const scope = value as AssignmentScope;
        next = {
          ...next,
          assignment_scope: scope,
          tenant_id: scope === "internal" ? "" : prev.tenant_id,
          client_id: scope === "internal" || scope === "tenant" ? "" : prev.client_id,
        };
      }

      if (field === "region") {
        next = {
          ...next,
          region: value as string,
          availability_zone: "",
          provider: "",
        };
      }

      if (field === "availability_zone") {
        const selectedZone = availabilityZoneOptions.find((zone) => zone.code === value);
        next = {
          ...next,
          availability_zone: value as string,
          provider: selectedZone?.provider || "",
        };
      }

      if (field === "tenant_id" || field === "client_id" || field === "assignment_scope") {
        membersFetchKeyRef.current = null;
      }

      return next;
    });

    if (field === "tenant_id" || field === "client_id" || field === "assignment_scope") {
      setSelectedMembers([]);
    }

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(field === "assignment_scope"
        ? { tenant_id: undefined, client_id: undefined, member_user_ids: undefined }
        : {}),
      ...(field === "region" ? { availability_zone: undefined, provider: undefined } : {}),
      ...(field === "availability_zone" ? { provider: undefined } : {}),
      ...(field === "tenant_id" || field === "client_id" ? { member_user_ids: undefined } : {}),
    }));
  };

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === "string") {
        return maybeMessage;
      }
    }
    return "Unknown error";
  };

  const getProjectIdentifier = (project: unknown): string | number | null => {
    if (!project || typeof project !== "object") {
      return null;
    }

    const record = project as Record<string, unknown>;
    const nested = record["data"];
    const data =
      nested && typeof nested === "object" ? (nested as Record<string, unknown>) : record;
    const identifier = data["identifier"] ?? data["id"];

    if (typeof identifier === "string" || typeof identifier === "number") {
      return identifier;
    }

    return null;
  };

  const normalizeSelectValue = (value: string | number | Array<string | number>): string => {
    if (Array.isArray(value)) {
      return value.length > 0 ? String(value[0]) : "";
    }
    return value === undefined || value === null ? "" : String(value);
  };

  const handleSubmit = () => {
    if (submitAttempts >= MAX_ATTEMPTS) {
      ToastUtils.error(
        "Maximum retry attempts reached. Please contact support if the issue persists."
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    const baseName = formData.name;
    const isRetry = submitAttempts > 0;
    const nextAttempt = submitAttempts + 1;
    const projectName = isRetry ? `${baseName}_${Date.now()}` : baseName;

    setSubmitAttempts(nextAttempt);
    setProgressMessage("Creating project...");

    const payload: ProjectCreatePayload = {
      name: projectName,
      description: formData.description,
      type: formData.type,
      provider: formData.provider || null,
      availability_zone: formData.availability_zone || null,
      tenant_id: formData.assignment_scope === "internal" ? null : formData.tenant_id || null,
      client_id: formData.client_id || null,
      user_id: formData.client_id || null,
      region: formData.region,
      assignment_scope: formData.assignment_scope,
      member_user_ids: selectedMembers.map((member) => Number(member.id)),
      user_policies: userPolicies,
      metadata: formData.network_preset ? { network_preset: formData.network_preset } : undefined,
    };

    // logger.log("Submitting Project Payload (Attempt ", nextAttempt, "):", payload);

    createProject(payload as any, {
      onSuccess: (project) => {
        // logger.log("Project creation response:", project);
        ToastUtils.success("Project created successfully!");
        redirectToProjectDetails(project);
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error);
        // logger.error(`Error creating project (Attempt ${nextAttempt}):`, errorMessage);
        setProgressMessage("");

        if (errorMessage.toLowerCase().includes("timeout")) {
          ToastUtils.error(
            "The project creation is taking longer than expected. This might be due to heavy server load. Please try again or contact support if the issue persists."
          );
        } else if (errorMessage.toLowerCase().includes("network")) {
          ToastUtils.error(
            "Network connection issue. Please check your internet connection and try again."
          );
        } else {
          ToastUtils.error(`Failed to create project: ${errorMessage}`);
        }
      },
    });
  };

  const handleSuccess = () => {
    setSubmitAttempts(0);
    setProgressMessage("");
    if (!isPageMode) {
      onClose?.();
    }
    setFormData(INITIAL_FORM_STATE);
    setSelectedMembers([]);
    membersFetchKeyRef.current = null;
  };

  const handleCancel = () => {
    if (isPageMode) {
      setFormData(INITIAL_FORM_STATE);
      setSelectedMembers([]);
      membersFetchKeyRef.current = null;
    }
    onClose?.();
  };

  const redirectToProjectDetails = (project: unknown) => {
    const identifier = getProjectIdentifier(project);

    if (!identifier) {
      // logger.error("Missing identifier in project response:", project);
      ToastUtils.warning(
        "Project created but identifier is missing. Please check the projects list."
      );
      handleSuccess();
      return;
    }

    const newParam = formData.network_preset ? "&new=true" : "";
    navigate(`/admin-dashboard/projects/details?identifier=${identifier}${newParam}`);
    handleSuccess();
  };

  const MemberCard = ({ member }: { member: MemberOption }) => {
    return (
      <div className="bg-white border border-gray-100 rounded-[12px] p-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--theme-surface-alt)] flex items-center justify-center text-[var(--theme-color)] font-medium text-xs">
              {(member.first_name?.[0] || member.email?.[0] || "?").toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {member.first_name
                  ? `${member.first_name} ${member.last_name || ""}`
                  : member.email}
              </p>
              <p className="text-xs text-gray-500">{member.role || "Member"}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleMember(member)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="pl-10">
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Cloud Policies
          </p>
          <div className="flex flex-wrap gap-2">
            {cloudPolicies.length > 0 ? (
              cloudPolicies.map((policy) => {
                const isSelected = (userPolicies[member.id] || []).includes(policy.id);
                return (
                  <button
                    key={policy.id}
                    type="button"
                    onClick={() => handleTogglePolicy(member.id, policy.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color-faint)]"
                        : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-300"
                    }`}
                  >
                    {policy.name || "Unnamed Policy"}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 italic">
                {formData.region ? "No policies available" : "Select a region first"}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderFormFields = () => (
    <div className="space-y-4 w-full">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Project Name<span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateFormData("name", e.target.value)}
          placeholder="Enter project name"
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.name ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Project Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder="Enter project description (optional)"
          rows={3}
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.description ? "border-red-500" : "border-gray-300"}`}
        ></textarea>
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      <div>
        <label id="project-type-label" className="block text-sm font-medium text-gray-700 mb-2">
          Type<span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-4" role="radiogroup" aria-labelledby="project-type-label">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="projectType"
              id="type-vpc"
              value="vpc"
              checked={formData.type === "vpc"}
              onChange={() => updateFormData("type", "vpc")}
              className="h-4 w-4 text-[var(--theme-color)] border-gray-300 focus:ring-[var(--theme-color)]"
            />
            <span className="ml-2 text-sm text-gray-700">VPC</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="projectType"
              id="type-dvs"
              value="dvs"
              checked={formData.type === "dvs"}
              onChange={() => updateFormData("type", "dvs")}
              className="h-4 w-4 text-[var(--theme-color)] border-gray-300 focus:ring-[var(--theme-color)]"
            />
            <span className="ml-2 text-sm text-gray-700">DVS</span>
          </label>
        </div>
        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
      </div>

      {formData.type === "vpc" && (
        <div className="space-y-4">
          <label id="network-preset-label" className="block text-sm font-medium text-gray-700 mb-2">
            Network Preset <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3" id="network-preset-desc">
            Choose a default network configuration. If not selected, you'll pick one when creating
            instances.
          </p>
          <div aria-labelledby="network-preset-label" aria-describedby="network-preset-desc">
            <NetworkPresetSelector
              value={formData.network_preset || null}
              onChange={(preset) => updateFormData("network_preset", preset)}
              presets={presetCatalog}
              showAdvancedOption={false}
            />
          </div>
          {formData.network_preset && (
            <button
              type="button"
              onClick={() => updateFormData("network_preset", "")}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2"
            >
              Clear preset selection
            </button>
          )}
        </div>
      )}

      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
          Default Region<span className="text-red-500">*</span>
        </label>
        <select
          id="region"
          value={formData.region}
          onChange={(e) => updateFormData("region", e.target.value)}
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.region ? "border-red-500" : "border-gray-300"}`}
          disabled={isRegionsFetching}
        >
          <option value="" disabled>
            {isRegionsFetching ? "Loading regions..." : "Select a region"}
          </option>
          {regionList.map((region, index) => (
            <option key={region.code ?? region.name ?? index} value={region.code ?? ""}>
              {region.name || region.code || "Unnamed region"}
            </option>
          ))}
        </select>
        {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
      </div>

      <div>
        <label htmlFor="availability_zone" className="block text-sm font-medium text-gray-700 mb-2">
          Availability Zone
          {availabilityZoneOptions.length > 0 && <span className="text-red-500">*</span>}
        </label>
        <select
          id="availability_zone"
          value={formData.availability_zone}
          onChange={(e) => updateFormData("availability_zone", e.target.value)}
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${errors.availability_zone ? "border-red-500" : "border-gray-300"}`}
          disabled={!formData.region || isAvailabilityZonesFetching || availabilityZoneOptions.length === 0}
        >
          <option value="" disabled>
            {!formData.region
              ? "Select a region first"
              : isAvailabilityZonesFetching
                ? "Loading availability zones..."
                : availabilityZoneOptions.length > 0
                  ? "Select an availability zone"
                  : "No active availability zones"}
          </option>
          {availabilityZoneOptions.map((zone, index) => (
            <option key={zone.code ?? zone.id ?? index} value={zone.code ?? ""}>
              {zone.name || zone.code || "Unnamed zone"}
            </option>
          ))}
        </select>
        {formData.provider && (
          <p className="text-xs text-gray-500 mt-1">
            Selected zone will determine the infrastructure provider.
          </p>
        )}
        {errors.availability_zone && (
          <p className="text-red-500 text-xs mt-1">{errors.availability_zone}</p>
        )}
      </div>

      <div>
        <label id="assignment-scope-label" className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Scope<span className="text-red-500">*</span>
        </label>
        <div
          className="flex flex-col gap-2 sm:flex-row"
          role="radiogroup"
          aria-labelledby="assignment-scope-label"
        >
          {scopeOptions.map((option) => {
            const isActive = formData.assignment_scope === option.value;
            return (
              <label
                key={option.value}
                className={`flex-1 rounded-[12px] border transition-colors cursor-pointer ${
                  isActive
                    ? "border-[var(--theme-color)] bg-[var(--theme-surface-alt)]"
                    : "border-gray-200 bg-white hover:border-[var(--theme-color)]"
                }`}
              >
                <input
                  type="radio"
                  name="assignmentScope"
                  value={option.value}
                  checked={isActive}
                  onChange={() => updateFormData("assignment_scope", option.value)}
                  className="sr-only"
                />
                <div className="px-4 py-3">
                  <span className="text-sm font-medium text-[var(--theme-heading-color)] block">
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 block">{option.description}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700 mb-2">
          Tenant {formData.assignment_scope === "tenant" && <span className="text-red-500">*</span>}
        </label>
        <DropdownSelect
          options={tenantList}
          value={formData.tenant_id || ""}
          onChange={(value) => updateFormData("tenant_id", normalizeSelectValue(value))}
          placeholder={
            formData.assignment_scope === "tenant" ? "Select tenant" : "Select tenant (optional)"
          }
          isFetching={isTenantsFetching}
          displayKey="name"
          valueKey="id"
          searchKeys={["name"]}
          disabled={formData.assignment_scope === "internal"}
          error={errors.tenant_id}
        />
        {errors.tenant_id && <p className="text-red-500 text-xs mt-1">{errors.tenant_id}</p>}
      </div>

      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
          Client {formData.assignment_scope === "client" && <span className="text-red-500">*</span>}
        </label>
        <DropdownSelect
          options={clientOptions}
          value={formData.client_id || ""}
          onChange={(value) => updateFormData("client_id", normalizeSelectValue(value))}
          placeholder={
            formData.assignment_scope === "client" ? "Select client" : "Select client (optional)"
          }
          isFetching={isClientsFetching}
          displayKey="displayLabel"
          valueKey="id"
          searchKeys={["displayLabel", "email"]}
          disabled={formData.assignment_scope === "internal"}
          error={errors.client_id}
        />
        {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700" id="project-members-label">
            Project Members<span className="text-red-500">*</span>
          </label>
          {showRestoreMembers && (
            <button
              type="button"
              onClick={handleRestoreMembers}
              className="text-xs text-[var(--theme-color)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isMembersFetching}
            >
              Restore default members
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1" aria-labelledby="project-members-label">
            <DropdownSelect
              options={suggestedMembers}
              value={selectedMembers.map((m) => m.id)}
              onChange={(value) => {
                const ids = Array.isArray(value) ? value : [value];
                const newSelection = suggestedMembers.filter((m) => ids.includes(m.id));
                setSelectedMembers(newSelection);
                setErrors((prev) => ({ ...prev, member_user_ids: undefined }));
              }}
              placeholder="Search and add members..."
              isFetching={isMembersFetching}
              displayKey="email"
              valueKey="id"
              searchKeys={["email", "first_name", "last_name"]}
              isMultiSelect={true}
              disabled={!shouldFetchMembers}
              error={errors.member_user_ids}
            />
          </div>
        </div>

        <div className="space-y-4 max-h-[300px] overflow-y-auto p-1">
          {selectedMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}

          {selectedMembers.length === 0 && !isMembersFetching && (
            <div className="text-center py-6 bg-gray-50 rounded-[12px] border border-dashed border-gray-200">
              <p className="text-sm text-gray-500">No members selected yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                {shouldFetchMembers
                  ? "Search for members above to add them to this project."
                  : formData.assignment_scope === "tenant"
                    ? "Select a tenant to view suggested members."
                    : "Select assignment scope to add members."}
              </p>
            </div>
          )}
        </div>
        {errors.member_user_ids && (
          <p className="text-red-500 text-xs mt-1">{errors.member_user_ids}</p>
        )}
      </div>
    </div>
  );

  if (isPageMode) {
    return (
      <div className="bg-white rounded-[20px] shadow-sm p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 font-primary">Create New Project</h1>
        <div className="mb-8">{renderFormFields()}</div>
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-[12px] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-8 py-2.5 text-sm font-medium text-white bg-[var(--theme-color)] hover:opacity-90 rounded-[12px] transition-all flex items-center gap-2 shadow-lg shadow-[var(--theme-color-faint)]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progressMessage || "Creating..."}
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl my-8 relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{renderFormFields()}</div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-[12px] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="px-8 py-2.5 text-sm font-medium text-white bg-[var(--theme-color)] hover:opacity-90 rounded-[12px] transition-all flex items-center gap-2 shadow-lg shadow-[var(--theme-color-faint)]"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progressMessage || "Creating..."}
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
