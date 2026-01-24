// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import {
  useCreateProject,
  useProjectMembershipSuggestions,
} from "../../../hooks/adminHooks/projectHooks";
import { useNavigate } from "react-router-dom";
import ToastUtils from "../../../utils/toastUtil";
import { useFetchTenants } from "../../../hooks/adminHooks/tenantHooks";
import { useFetchClients } from "../../../hooks/adminHooks/clientHooks";
import { DropdownSelect } from "./dropdownSelect"; // Ensure this path is correct
import { useFetchRegions } from "../../../hooks/adminHooks/regionHooks";
import NetworkPresetSelector, {
  DEFAULT_PRESETS,
} from "../../../shared/components/network/NetworkPresetSelector";
import { useNetworkPresets } from "../../../hooks/networkPresetHooks";
import { useCloudPolicies } from "../../../hooks/adminHooks/cloudPolicyHooks";
const MAX_ATTEMPTS = 10;

const INITIAL_FORM_STATE = {
  name: "",
  description: "",
  type: "vpc",
  tenant_id: "",
  client_id: "",
  region: "",
  assignment_scope: "internal",
  network_preset: "", // Optional: standard, private, multi-tier, database
};

const CreateProjectModal = ({ isOpen = false, onClose, mode = "modal" }: any) => {
  const isPageMode = mode === "page";
  const { mutate: createProject, isPending } = useCreateProject();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const { isFetching: isRegionsFetching, data: regions } = useFetchRegions();
  const { data: tenants, isFetching: isTenantsFetching } = useFetchTenants();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();
  const { data: networkPresets = DEFAULT_PRESETS } = useNetworkPresets();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [userPolicies, setUserPolicies] = useState({}); // { userId: [policyIds] }
  const { data: cloudPolicies = [], isFetching: isPoliciesFetching } = useCloudPolicies(
    {
      region: formData.region,
      provider: "zadara",
      active_only: true,
    },
    {
      enabled: !!formData.region,
    }
  );
  const membersFetchKeyRef = useRef(null);
  const presetCatalog = useMemo(
    () =>
      Array.isArray(networkPresets) && networkPresets.length > 0 ? networkPresets : DEFAULT_PRESETS,
    [networkPresets]
  );

  // Provider derived server-side; no UI binding

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

  const membershipParams = useMemo(() => {
    if (!shouldFetchMembers) {
      return null;
    }

    return {
      scope: formData.assignment_scope,
      tenant_id:
        formData.assignment_scope !== "internal" && formData.tenant_id
          ? formData.tenant_id
          : undefined,
      client_id: formData.client_id || undefined,
    };
  }, [shouldFetchMembers, formData.assignment_scope, formData.tenant_id, formData.client_id]);

  const { data: suggestedMembers = [], isFetching: isMembersFetching } =
    useProjectMembershipSuggestions(membershipParams ?? {}, {
      enabled: shouldFetchMembers && !!membershipParams,
    });

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
      formData.assignment_scope !== "internal" ? formData.tenant_id || null : null,
      formData.client_id || null,
    ]);

    const newDefaultSignature = suggestedMembers?.length
      ? JSON.stringify(
          [...suggestedMembers.map((member: any) => Number(member.id))].sort((a, b) => a - b)
        )
      : null;

    const currentSignature = selectedMembers.length
      ? JSON.stringify(
          [...selectedMembers.map((member: any) => Number(member.id))].sort((a, b) => a - b)
        )
      : null;

    const lastState = membersFetchKeyRef.current;

    const shouldSyncFromSuggestions =
      !lastState ||
      lastState.key !== scopeKey ||
      (!!newDefaultSignature &&
        lastState.defaultSignature !== newDefaultSignature &&
        currentSignature === lastState.defaultSignature);

    if (shouldSyncFromSuggestions) {
      setSelectedMembers(suggestedMembers || []);
    }

    membersFetchKeyRef.current = {
      key: scopeKey,
      defaultSignature: newDefaultSignature,
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
    if (suggestedMembers?.length) {
      setSelectedMembers(suggestedMembers);
      setErrors((prev) => ({
        ...prev,
        member_user_ids: null,
      }));
    }
  };

  const handleToggleMember = (member: any) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((item) => item.id === member.id);
      if (exists) {
        return prev.filter((item: any) => item.id !== member.id);
      }
      return [...prev, member];
    });

    setErrors((prev) => ({
      ...prev,
      member_user_ids: null,
    }));
  };

  const handleTogglePolicy = (userId, policyId) => {
    setUserPolicies((prev) => {
      const current = prev[userId] || [];
      if (current.includes(policyId)) {
        return { ...prev, [userId]: current.filter((id) => id !== policyId) };
      }
      return { ...prev, [userId]: [...current, policyId] };
    });
  };

  const compulsoryPolicyIds = useMemo(() => {
    return cloudPolicies
      .filter((p) => p.is_default) // Using is_default as a proxy for compulsory
      .map((p) => p.id);
  }, [cloudPolicies]);

  useEffect(() => {
    if (selectedMembers.length > 0 && cloudPolicies.length > 0) {
      setUserPolicies((prev) => {
        const next = { ...prev };
        selectedMembers.forEach((member) => {
          if (!next[member.id]) {
            next[member.id] = [...compulsoryPolicyIds];
          }
        });
        return next;
      });
    }
  }, [selectedMembers, compulsoryPolicyIds]);

  const clientOptions = useMemo(() => {
    return (clients || []).map((client: any) => {
      const fullName = [client.first_name, client.middle_name, client.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        ...client,
        displayLabel: fullName || client.email || "Unnamed client",
      };
    });
  }, [clients]);

  const scopeOptions = useMemo(
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

  const selectedMemberIds = useMemo(
    () => new Set(selectedMembers.map((member: any) => member.id)),
    [selectedMembers]
  );

  const resolveTenantName = useMemo(() => {
    if (!formData.tenant_id) return "";
    const list = Array.isArray(tenants)
      ? tenants
      : Array.isArray(tenants?.data)
        ? tenants.data
        : [];
    const match = list.find((tenant) => String(tenant.id) === String(formData.tenant_id));
    return match?.name || "";
  }, [formData.tenant_id, tenants]);

  const resolveClientName = useMemo(() => {
    if (!formData.client_id) return "";
    const match = clientOptions.find((client) => String(client.id) === String(formData.client_id));
    return match?.displayLabel || "";
  }, [formData.client_id, clientOptions]);

  const defaultSelectionSignature = useMemo(() => {
    if (!suggestedMembers?.length) {
      return null;
    }
    return JSON.stringify(
      [...suggestedMembers.map((member: any) => member.id)].sort((a, b) => a - b)
    );
  }, [suggestedMembers]);

  const currentSelectionSignature = useMemo(() => {
    if (!selectedMembers.length) {
      return null;
    }
    return JSON.stringify(
      [...selectedMembers.map((member: any) => member.id)].sort((a, b) => a - b)
    );
  }, [selectedMembers]);

  const showRestoreMembers =
    Boolean(defaultSelectionSignature) && defaultSelectionSignature !== currentSelectionSignature;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    if (!formData.region) {
      newErrors.region = "Default Region is required";
    }
    if (formData.assignment_scope === "tenant" && !formData.tenant_id) {
      newErrors.tenant_id = "Select a tenant when assigning the project to a tenant.";
    }
    if (formData.assignment_scope === "client" && !formData.client_id) {
      newErrors.client_id = "Select a client to assign this project.";
    }
    if (shouldFetchMembers && !isMembersFetching && selectedMembers.length === 0) {
      newErrors.member_user_ids = "Select at least one project member.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: any, value: any) => {
    setFormData((prev) => {
      let next = { ...prev, [field]: value };

      if (field === "assignment_scope") {
        next = {
          ...next,
          assignment_scope: value,
          tenant_id: value === "internal" ? "" : prev.tenant_id,
          client_id: value === "internal" ? "" : value === "tenant" ? "" : prev.client_id,
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
      [field]: null,
      ...(field === "assignment_scope"
        ? { tenant_id: null, client_id: null, member_user_ids: null }
        : {}),
      ...(field === "tenant_id" || field === "client_id" ? { member_user_ids: null } : {}),
    }));
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

    const payload = {
      name: projectName,
      description: formData.description,
      type: formData.type,
      tenant_id: formData.assignment_scope === "internal" ? null : formData.tenant_id || null,
      client_id: formData.client_id || null,
      user_id: formData.client_id || null,
      region: formData.region,
      assignment_scope: formData.assignment_scope,
      member_user_ids: selectedMembers.map((member: any) => Number(member.id)),
      user_policies: userPolicies,
      // Optional network preset - stored in metadata
      metadata: formData.network_preset ? { network_preset: formData.network_preset } : undefined,
      // provider omitted; derived server-side
    };

    console.log("Submitting Project Payload (Attempt ", nextAttempt, "):", payload);

    createProject(payload, {
      onSuccess: (project) => {
        console.log("Project creation response:", project);
        ToastUtils.success("Project created successfully!");
        redirectToProjectDetails(project);
      },
      onError: (error) => {
        console.error(`Error creating project (Attempt ${nextAttempt}):`, error.message);
        setProgressMessage("");

        if (error.message.includes("timeout")) {
          ToastUtils.error(
            "The project creation is taking longer than expected. This might be due to heavy server load. Please try again or contact support if the issue persists."
          );
        } else if (error.message.includes("Network error")) {
          ToastUtils.error(
            "Network connection issue. Please check your internet connection and try again."
          );
        } else {
          ToastUtils.error(`Failed to create project: ${error.message}`);
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

  const redirectToProjectDetails = (project: any) => {
    const identifier = project?.identifier || project?.id;
    if (!identifier) {
      ToastUtils.warning(
        "Project created but identifier is missing. Please check the projects list."
      );
      handleSuccess();
      return;
    }

    const encodedId = encodeURIComponent(btoa(identifier));
    // Add new=true if a network preset was selected (triggering auto-provisioning)
    const newParam = formData.network_preset ? "&new=true" : "";
    navigate(`/admin-dashboard/projects/details?id=${encodedId}${newParam}`);
    handleSuccess();
  };

  const renderFormFields = () => (
    <div className="space-y-4 w-full">
      {/* Project Name */}
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
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
            errors.name ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Project Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Project Description
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          placeholder="Enter project description (optional)"
          rows="3"
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
        ></textarea>
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </div>

      {/* Project Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type<span className="text-red-500">*</span>
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="projectType"
              value="vpc"
              checked={formData.type === "vpc"}
              onChange={(e) => updateFormData("type", e.target.value)}
              className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
            />
            <span className="ml-2 text-sm text-gray-700">VPC</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="projectType"
              value="dvs"
              checked={formData.type === "dvs"}
              onChange={(e) => updateFormData("type", e.target.value)}
              className="h-4 w-4 text-[#288DD1] border-gray-300 focus:ring-[#288DD1]"
            />
            <span className="ml-2 text-sm text-gray-700">DVS</span>
          </label>
        </div>
        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
      </div>

      {/* Network Preset (Optional) - Only show for VPC type */}
      {formData.type === "vpc" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network Preset <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Choose a default network configuration. If not selected, you'll pick one when creating
            instances.
          </p>
          <NetworkPresetSelector
            value={formData.network_preset || null}
            onChange={(preset) => updateFormData("network_preset", preset)}
            presets={presetCatalog}
            showAdvancedOption={false}
          />
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

      {/* Default Region */}
      <div>
        <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
          Default Region<span className="text-red-500">*</span>
        </label>
        <select
          id="region"
          value={formData.region}
          onChange={(e) => updateFormData("region", e.target.value)}
          className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${
            errors.region ? "border-red-500" : "border-gray-300"
          }`}
          disabled={isRegionsFetching}
        >
          <option value="" disabled>
            {isRegionsFetching ? "Loading regions..." : "Select a region"}
          </option>
          {regions?.map((region: any) => (
            <option key={region.code} value={region.code}>
              {region.name}
            </option>
          ))}
        </select>
        {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
        {formData.provider && (
          <p className="text-sm text-gray-500 mt-1">
            Provider:{" "}
            {typeof formData.provider === "string" && formData.provider.trim() !== ""
              ? formData.provider.toUpperCase()
              : "N/A"}
          </p>
        )}
      </div>

      {/* Assignment Scope */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignment Scope<span className="text-red-500">*</span>
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          {scopeOptions.map((option: any) => {
            const isActive = formData.assignment_scope === option.value;
            return (
              <label
                key={option.value}
                className={`flex-1 rounded-[12px] border transition-colors ${
                  isActive
                    ? "border-[#288DD1] bg-[#E6F4FB]"
                    : "border-gray-200 bg-white hover:border-[#288DD1]"
                }`}
              >
                <input
                  type="radio"
                  name="assignmentScope"
                  value={option.value}
                  checked={isActive}
                  onChange={(e) => updateFormData("assignment_scope", e.target.value)}
                  className="sr-only"
                />
                <div className="px-4 py-3">
                  <p className="text-sm font-medium text-[#1F2937]">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Tenant Selection */}
      <div>
        <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700 mb-2">
          Tenant {formData.assignment_scope === "tenant" && <span className="text-red-500">*</span>}
        </label>
        <DropdownSelect
          options={tenants || []}
          value={formData.tenant_id || ""}
          onChange={(value) => updateFormData("tenant_id", value)}
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
        {formData.assignment_scope !== "internal" && (
          <p className="text-xs text-gray-500 mt-1">
            {formData.assignment_scope === "tenant"
              ? "Required – all accepted tenant members will be included by default."
              : "Optional – choose a tenant if this client belongs to a workspace."}
          </p>
        )}
        {errors.tenant_id && <p className="text-red-500 text-xs mt-1">{errors.tenant_id}</p>}
      </div>

      {/* Client Selection */}
      <div>
        <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
          Client {formData.assignment_scope === "client" && <span className="text-red-500">*</span>}
        </label>
        <DropdownSelect
          options={clientOptions}
          value={formData.client_id || ""}
          onChange={(value) => updateFormData("client_id", value)}
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
        <p className="text-xs text-gray-500 mt-1">
          Choose a client when this project should inherit their workspace members.
        </p>
        {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>}
      </div>

      {/* Project Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Project Members<span className="text-red-500">*</span>
          </label>
          {showRestoreMembers && (
            <button
              type="button"
              onClick={handleRestoreMembers}
              className="text-xs text-[#288DD1] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isMembersFetching}
            >
              Restore default selection
            </button>
          )}
        </div>

        {shouldFetchMembers ? (
          <>
            <div className="min-h-[48px] rounded-[10px] border border-gray-200 px-3 py-2 bg-white">
              {isMembersFetching && selectedMembers.length === 0 ? (
                <div className="flex items-center text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading members&hellip;
                </div>
              ) : selectedMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member: any) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center bg-[#288DD1] text-white text-xs px-3 py-1 rounded-full"
                    >
                      {member.name || member.email || `User #${member.id}`}
                      <button
                        type="button"
                        className="ml-2 text-white hover:text-gray-200"
                        onClick={() => handleToggleMember(member)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No members selected yet. Use the suggestions below to choose who should join the
                  project.
                </p>
              )}
            </div>
            {errors.member_user_ids && (
              <p className="text-red-500 text-xs mt-1">{errors.member_user_ids}</p>
            )}
            <div className="mt-3 rounded-[12px] border border-gray-200 bg-white">
              <div className="px-4 py-2 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Suggested members
              </div>
              {isMembersFetching ? (
                <div className="flex items-center px-4 py-3 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Fetching latest workspace members&hellip;
                </div>
              ) : suggestedMembers.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {suggestedMembers.map((member: any) => {
                    const isSelected = selectedMemberIds.has(member.id);
                    return (
                      <label
                        key={member.id}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-[#288DD1] focus:ring-[#288DD1]"
                          checked={isSelected}
                          onChange={() => handleToggleMember(member)}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {member.name || member.email || `User #${member.id}`}
                          </p>
                          {member.email && <p className="text-xs text-gray-500">{member.email}</p>}
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
                  No suggested members for this scope yet. Add members manually or adjust the
                  assignment settings.
                </p>
              )}
            </div>

            {/* Per-User Policy Management Section */}
            {selectedMembers.length > 0 && cloudPolicies.length > 0 && (
              <div className="mt-4 rounded-[12px] border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 flex justify-between items-center">
                  <span>Policy Assignment Per Member</span>
                  <span className="text-[10px] normal-case font-normal">
                    Default policies are pre-selected
                  </span>
                </div>
                <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                  {selectedMembers.map((member) => (
                    <div key={member.id} className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                          {(member.name || member.email || "U").charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {member.name || member.email}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {cloudPolicies.map((policy) => {
                          const isCompulsory = policy.is_compulsory;
                          const isSelected =
                            (userPolicies[member.id] || []).includes(policy.id) || isCompulsory;
                          return (
                            <button
                              key={policy.id}
                              type="button"
                              disabled={isCompulsory}
                              onClick={() => handleTogglePolicy(member.id, policy.id)}
                              className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                                isSelected
                                  ? "bg-blue-50 border-blue-200 text-blue-700"
                                  : "bg-white border-gray-200 text-gray-500 hover:border-blue-200"
                              } ${isCompulsory ? "opacity-75 cursor-not-allowed font-semibold" : ""}`}
                              title={policy.description}
                            >
                              {policy.name}
                              {isCompulsory && " (Required)"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Select an assignment scope, tenant, or client to load member suggestions.
          </p>
        )}
      </div>
    </div>
  );

  function renderSummaryPanel() {
    const summaryItems = [
      { label: "Project name", value: formData.name || "Not set" },
      {
        label: "Default region",
        value: formData.region ? formData.region.toUpperCase() : "Select region",
      },
      {
        label: "Network preset",
        value: formData.network_preset
          ? formData.network_preset.charAt(0).toUpperCase() + formData.network_preset.slice(1)
          : "Choose during instance creation",
      },
      {
        label: "Assignment scope",
        value:
          formData.assignment_scope === "internal"
            ? "Internal"
            : formData.assignment_scope === "tenant"
              ? "Tenant workspace"
              : "Client",
      },
      {
        label: "Tenant link",
        value: resolveTenantName || formData.tenant_id || "Not attached",
      },
      {
        label: "Client link",
        value: resolveClientName || formData.client_id || "Optional",
      },
      {
        label: "Members selected",
        value: selectedMembers.length
          ? `${selectedMembers.length} team member(s)`
          : "Using defaults",
      },
    ];

    const guidanceItems = [
      "Scope controls which directory the project belongs to and who can access it.",
      "Attach tenants or clients to auto-populate members and accelerate onboarding.",
      "Curate a core response team before provisioning to keep activity auditable.",
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Live summary</p>
          <dl className="mt-3 space-y-3 text-sm">
            {summaryItems.map((item: any) => (
              <div key={item.label} className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="text-right font-semibold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg">
          <p className="text-sm font-semibold">Admin tips</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-100/80">
            {guidanceItems.map((tip: any) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  const wrapperClasses = isPageMode
    ? "font-Outfit w-full"
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit";

  const cardClasses = isPageMode
    ? "bg-white rounded-[24px] border border-slate-200 shadow-sm w-full max-w-4xl mx-auto my-6"
    : "bg-white rounded-[24px] max-w-[650px] mx-4 w-full";

  const bodyClasses = isPageMode
    ? "px-6 py-6 w-full flex flex-col"
    : "px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start";

  const headerBackgroundClass = isPageMode ? "bg-white" : "bg-[#F2F2F2]";
  const showCloseButton = !isPageMode;
  const closeButtonLabel = isPageMode ? "Cancel" : "Close";

  if (isPageMode) {
    return (
      <div className="font-Outfit">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Admin project creation
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Shape the workspace, assign owners, and pre-stage members
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure scope, link the right tenant or client, and confirm who will receive
              immediate access.
            </p>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.8fr),minmax(280px,1fr)]">
            <div className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm">
              {renderFormFields()}
            </div>
            <aside>{renderSummaryPanel()}</aside>
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={handleCancel}
            className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 sm:w-auto"
          >
            {closeButtonLabel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isPending ||
              isRegionsFetching ||
              isTenantsFetching ||
              isClientsFetching ||
              (shouldFetchMembers && isMembersFetching)
            }
            className="w-full rounded-full bg-[#1E3A8A] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#192f70] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                Creating
                <Loader2 className="h-4 w-4 animate-spin" />
              </span>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <div className={cardClasses}>
        {/* Header */}
        <div
          className={`flex justify-between items-center px-6 py-4 border-b rounded-t-[24px] w-full ${headerBackgroundClass}`}
        >
          <h2 className="text-lg font-semibold text-[#575758]">Create New Project</h2>
          {showCloseButton && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-[#1E1E1EB2] font-medium transition-colors"
              disabled={isPending}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {/* Content */}
        <div className={bodyClasses}>
          {renderFormFields()}
          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
                disabled={isPending}
              >
                {closeButtonLabel}
              </button>
              {isPending ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center px-6 py-3 bg-blue-50 text-blue-700 rounded-[30px]">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="text-sm font-medium">
                      {progressMessage || "Creating project..."}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Attempt {submitAttempts}/{MAX_ATTEMPTS}
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={
                    isRegionsFetching ||
                    isTenantsFetching ||
                    isClientsFetching ||
                    (shouldFetchMembers && isMembersFetching)
                  }
                  className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitAttempts > 0 && submitAttempts < MAX_ATTEMPTS
                    ? `Retry (${submitAttempts}/${MAX_ATTEMPTS})`
                    : "Create Project"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminCreateProjectForm = CreateProjectModal;
export default CreateProjectModal;
