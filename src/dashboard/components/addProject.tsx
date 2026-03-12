import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Loader2, Shield } from "lucide-react";
import {
  useCreateProject,
  useProjectMembershipSuggestions as useTenantProjectMembershipSuggestions,
} from "@/shared/hooks/resources/projectHooks";
import { useFetchGeneralRegions } from "@/hooks/resource";
import { useFetchClients } from "@/hooks/clientHooks";
import { useNavigate } from "react-router-dom";
import ToastUtils from "@/utils/toastUtil";
import NetworkPresetSelector, {
  DEFAULT_PRESETS,
} from "@/shared/components/network/NetworkPresetSelector";
import { useNetworkPresets } from "@/hooks/networkPresetHooks";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useCloudPolicies, type CloudPolicy } from "@/shared/hooks/resources/cloudPolicyHooks";

import { NormalizedRegion } from "@/shared/utils/regionApi";
import { Client } from "@/types/client";
import { ProjectUser } from "@/types/project";

interface FormState {
  name: string;
  description: string;
  region: string;
  type: string;
  assignment_scope: string;
  network_preset: string;
  client_id: string;
}

interface FormErrors {
  name?: string | undefined;
  description?: string | undefined;
  region?: string | undefined;
  type?: string | undefined;
  assignment_scope?: string | undefined;
  network_preset?: string | undefined;
  client_id?: string | undefined;
  member_user_ids?: string | undefined;
  general?: string | undefined;
}

interface CreateProjectModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: "modal" | "page";
}

const INITIAL_FORM_STATE: FormState = {
  name: "",
  description: "",
  region: "",
  type: "vpc",
  assignment_scope: "tenant",
  network_preset: "",
  client_id: "",
};

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen = false,
  onClose,
  mode = "modal",
}) => {
  const isPageMode = mode === "page";
  const navigate = useNavigate();
  const { mutateAsync: createProjectAsync } = useCreateProject();
  const {
    run: runAsyncAction,
    reset: resetAsyncAction,
    isPending: isSubmitting,
    errorMessage: submitErrorMessage,
  } = useAsyncAction();
  const { isFetching: isRegionsFetching, data: regions } = useFetchGeneralRegions();
  const { data: clients, isFetching: isClientsFetching } = useFetchClients();
  const { data: networkPresets = DEFAULT_PRESETS } = useNetworkPresets();
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedMembers, setSelectedMembers] = useState<ProjectUser[]>([]);
  const membersFetchKeyRef = useRef<{ key: string; defaultSignature: string | null } | null>(null);
  const presetCatalog = useMemo(
    () =>
      Array.isArray(networkPresets) && networkPresets.length > 0 ? networkPresets : DEFAULT_PRESETS,
    [networkPresets]
  );

  // Cloud policies
  const [userPolicies, setUserPolicies] = useState<Record<string, Array<string | number>>>({});
  const regionList = useMemo(
    () => (Array.isArray(regions) ? (regions as { code?: string; provider?: string }[]) : []),
    [regions]
  );
  const selectedRegionProvider = useMemo(() => {
    const match = regionList.find((r) => r.code === formData.region);
    return match?.provider || "";
  }, [formData.region, regionList]);

  const { data: cloudPoliciesData = [] } = useCloudPolicies(
    { region: formData.region, provider: selectedRegionProvider },
    { enabled: !!formData.region && !!selectedRegionProvider }
  );
  const cloudPolicies = useMemo<CloudPolicy[]>(
    () => (Array.isArray(cloudPoliciesData) ? cloudPoliciesData : []),
    [cloudPoliciesData]
  );
  const defaultPolicyIds = useMemo(
    () => cloudPolicies.filter((p) => p.is_default).map((p) => p.id),
    [cloudPolicies]
  );
  useEffect(() => {
    if (selectedMembers.length > 0 && cloudPolicies.length > 0) {
      setUserPolicies((prev) => {
        const next = { ...prev };
        selectedMembers.forEach((member) => {
          if (!next[member.id]) next[member.id] = [...defaultPolicyIds];
        });
        return next;
      });
    }
  }, [selectedMembers, defaultPolicyIds, cloudPolicies.length]);

  const handleTogglePolicy = (memberId: string | number, policyId: string | number) => {
    setUserPolicies((prev) => {
      const current = prev[memberId] || [];
      const next = current.includes(policyId)
        ? current.filter((id) => id !== policyId)
        : [...current, policyId];
      return { ...prev, [memberId]: next };
    });
  };

  const resetState = useCallback(() => {
    setFormData({ ...INITIAL_FORM_STATE });
    setErrors({});
    setSelectedMembers([]);
    setUserPolicies({});
    membersFetchKeyRef.current = null;
    resetAsyncAction();
  }, [resetAsyncAction]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    if (!isPageMode) {
      resetState();
    }
    onClose?.();
  };

  const resolveProjectIdentifier = (payload: any): string | number | null => {
    if (!payload || typeof payload !== "object") {
      return null;
    }
    if (payload.identifier) return payload.identifier;
    if (payload.project_identifier) return payload.project_identifier;
    if (payload.projectId) return payload.projectId;
    if (payload.id) return payload.id;
    if (payload.project) return resolveProjectIdentifier(payload.project);
    if (payload.data) return resolveProjectIdentifier(payload.data);
    if (payload.message && typeof payload.message === "object") {
      return resolveProjectIdentifier(payload.message);
    }
    return null;
  };

  const redirectToProjectDetails = (projectPayload: any) => {
    const identifier = resolveProjectIdentifier(projectPayload);
    if (!identifier) {
      ToastUtils.warning(
        "Project created but could not resolve the identifier. Please check your projects list."
      );
      handleClose();
      return;
    }
    const encodedId = encodeURIComponent(btoa(String(identifier)));
    handleClose();
    const newParam = formData.network_preset ? "&new=true" : "";
    navigate(`/dashboard/projects/details?id=${encodedId}${newParam}`);
  };

  useEffect(() => {
    if (!isPageMode && !isOpen) {
      resetState();
    }
  }, [isOpen, isPageMode, resetState]);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name) {
      newErrors.name = "Project Name is required";
    }
    if (!formData.region) newErrors.region = "Default Region is required";
    if (!formData.type) {
      newErrors.type = "Type is required";
    }
    if (formData.assignment_scope === "client" && !formData.client_id) {
      newErrors.client_id = "Select a client when assigning to a client workspace.";
    }
    if (shouldFetchMembers && !isMembersFetching && selectedMembers.length === 0) {
      newErrors.member_user_ids = "Select at least one project member.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateFormData = (field: keyof FormState, value: string) => {
    setFormData((prev) => {
      let next = { ...prev, [field]: value };

      if (field === "assignment_scope") {
        next = {
          ...next,
          assignment_scope: value,
          client_id: value === "client" ? prev.client_id : "",
        };
      }

      if (field === "type" && value !== "vpc") {
        next = { ...next, network_preset: "" };
      }

      if (field === "assignment_scope" || field === "client_id") {
        membersFetchKeyRef.current = null;
        setSelectedMembers([]);
      }

      return next;
    });

    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(field === "assignment_scope" ? { client_id: undefined, member_user_ids: undefined } : {}),
      ...(field === "client_id" ? { member_user_ids: undefined } : {}),
    }));
  };

  const scopeOptions = [
    {
      value: "internal",
      label: "Internal (admins)",
      description: "Share with internal users registered to this tenant workspace.",
    },
    {
      value: "tenant",
      label: "Tenant workspace",
      description: "Include members from your tenant workspace.",
    },
    {
      value: "client",
      label: "Client",
      description: "Attach to a client workspace you manage.",
    },
  ];

  const shouldFetchMembers = useMemo(() => {
    if (formData.assignment_scope === "client") {
      return Boolean(formData.client_id);
    }
    return true;
  }, [formData.assignment_scope, formData.client_id]);

  const membershipParams = useMemo(() => {
    if (!shouldFetchMembers) return null;
    return {
      scope: formData.assignment_scope,
      client_id: formData.client_id || undefined,
    };
  }, [shouldFetchMembers, formData.assignment_scope, formData.client_id]);

  const { data: suggestedMembers = [], isFetching: isMembersFetching } =
    useTenantProjectMembershipSuggestions(membershipParams ?? {}, {
      enabled: shouldFetchMembers && !!membershipParams,
    });

  useEffect(() => {
    if (!shouldFetchMembers) {
      setSelectedMembers([]);
      membersFetchKeyRef.current = null;
      return;
    }

    if (isMembersFetching) return;

    const scopeKey = JSON.stringify([formData.assignment_scope, formData.client_id || null]);

    const newDefaultSignature = (suggestedMembers as ProjectUser[])?.length
      ? JSON.stringify(
          suggestedMembers
            .map((member: ProjectUser) => Number(member.id))
            .sort((a: number, b: number) => a - b)
        )
      : null;

    const currentSignature = selectedMembers.length
      ? JSON.stringify(
          selectedMembers
            .map((member: ProjectUser) => Number(member.id))
            .sort((a: number, b: number) => a - b)
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
    formData.client_id,
  ]);

  const handleRestoreMembers = () => {
    if ((suggestedMembers as ProjectUser[])?.length) {
      setSelectedMembers(suggestedMembers);
      setErrors((prev) => ({ ...prev, member_user_ids: undefined }));
    }
  };

  const handleToggleMember = (member: ProjectUser) => {
    setSelectedMembers((prev) => {
      const exists = prev.some((item) => item.id === member.id);
      if (exists) {
        return prev.filter((item) => item.id !== member.id);
      }
      return [...prev, member];
    });

    setErrors((prev) => ({ ...prev, member_user_ids: undefined }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }
    if (!validateForm()) {
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      region: formData.region,
      assignment_scope: formData.assignment_scope,
      client_id: formData.assignment_scope === "client" ? formData.client_id || null : null,
      user_id: formData.assignment_scope === "client" ? formData.client_id || null : null,
      member_user_ids: selectedMembers.map((member) => Number(member.id)),
      user_policies: Object.keys(userPolicies).length > 0 ? userPolicies : undefined,
      metadata: formData.network_preset ? { network_preset: formData.network_preset } : undefined,
    };
    await runAsyncAction(() => createProjectAsync(payload), {
      successToast: false,
      errorToast: false,
      fallbackErrorMessage: "Failed to create project.",
      rethrow: false,
      onSuccess: (project: any) => {
        redirectToProjectDetails(project);
      },
      onError: () => {},
    });
  };

  if (!isPageMode && !isOpen) return null;

  const wrapperClasses = isPageMode
    ? "font-Outfit w-full"
    : "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit";

  const cardClasses = isPageMode
    ? "bg-white rounded-[24px] border border-slate-200 shadow-sm w-full max-w-4xl mx-auto my-6"
    : "bg-white rounded-[24px] max-w-[650px] mx-4 w-full";

  const bodyClasses = isPageMode
    ? "px-6 py-6 w-full flex flex-col"
    : "px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start";

  const headerBackgroundClass = isPageMode ? "bg-white" : "bg-[var(--theme-surface-alt)]";
  const showCloseButton = !isPageMode;
  const closeButtonLabel = isPageMode ? "Cancel" : "Close";

  const getClientLabel = (client: Client) => {
    const parts = [client.first_name, client.middle_name, client.last_name].filter(Boolean);
    const fullName = parts.join(" ").trim();
    return fullName || (client["name"] as string) || client.email || `Client ${client.id}`;
  };

  const renderSummaryPanel = () => {
    const selectedClientLabel = formData.client_id
      ? (() => {
          const match = (clients as Client[] | undefined)?.find(
            (client) => String(client.id) === String(formData.client_id)
          );
          return match ? getClientLabel(match) : formData.client_id;
        })()
      : "";

    const summaryItems = [
      { label: "Project name", value: formData.name || "Not set" },
      {
        label: "Region",
        value: formData.region ? formData.region.toUpperCase() : "Select a region",
      },
      {
        label: "Topology",
        value: formData.type ? formData.type.toUpperCase() : "Choose type",
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
            : formData.assignment_scope === "client"
              ? "Client"
              : "Tenant workspace",
      },
      {
        label: "Client link",
        value:
          formData.assignment_scope === "client" && formData.client_id
            ? selectedClientLabel || "Selected"
            : "Not attached",
      },
      {
        label: "Members selected",
        value: selectedMembers.length ? `${selectedMembers.length} member(s)` : "Using defaults",
      },
    ];

    const guidanceItems = [
      "Pick the default region tenants see when provisioning workloads.",
      "Select a network preset to fast-track infrastructure provisioning.",
      "Assignment scope controls which workspace members are auto-added.",
    ];

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Live summary</h3>
          <dl className="mt-4 space-y-3 text-sm">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">{item.label}</dt>
                <dd className="text-right font-semibold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="brand-hero rounded-2xl p-5 text-white shadow-lg">
          <p className="text-sm font-semibold">Launch checklist</p>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {guidanceItems.map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/70" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const sectionClasses = "rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm";

  const structuredForm = (
    <div className="space-y-6">
      <div className={sectionClasses}>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Project details
          </p>
          <h3 className="text-base font-semibold text-slate-900">
            Give the workspace a recognizable description
          </h3>
          <p className="text-sm text-slate-500">
            Share intent for teammates by filling in project name and summary.
          </p>
        </div>
        <div className="mt-5 space-y-4">
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
              className={`w-full input-field ${errors.name ? "border-red-500" : "border-gray-300"}`}
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
              className={`w-full input-field ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            ></textarea>
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description}</p>
            )}
          </div>
        </div>
      </div>
      <div className={sectionClasses}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Region & topology
        </p>
        <h3 className="text-base font-semibold text-slate-900 mt-1">
          Define where workloads launch
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="region" className="block text-sm font-medium text-gray-700">
              Default region<span className="text-red-500">*</span>
            </label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) => updateFormData("region", e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${
                errors.region ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isRegionsFetching}
            >
              <option value="" disabled>
                {isRegionsFetching ? "Loading regions..." : "Select a region"}
              </option>
              {(regions as NormalizedRegion[] | undefined)?.map((region) => (
                <option key={region.region} value={region.region}>
                  {region.label}
                </option>
              ))}
            </select>
            {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
          </div>
          <div className="space-y-2">
            <span className="block text-sm font-medium text-gray-700">
              Project type<span className="text-red-500">*</span>
            </span>
            <div className="grid grid-cols-2 gap-3" role="radiogroup">
              {["vpc", "dvs"].map((type) => (
                <label
                  key={type}
                  htmlFor={`type-${type}`}
                  className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 text-sm ${
                    formData.type === type
                      ? "border-[var(--theme-color)] bg-primary/5 text-primary-700"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  <input
                    id={`type-${type}`}
                    type="radio"
                    name="projectType"
                    value={type}
                    checked={formData.type === type}
                    onChange={(e) => updateFormData("type", e.target.value)}
                    className="hidden"
                  />
                  <span className="font-semibold uppercase">{type}</span>
                  <span className="text-xs text-slate-500">
                    {type === "vpc" ? "Standard network workspace" : "Dedicated virtual segment"}
                  </span>
                </label>
              ))}
            </div>
            {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
          </div>
        </div>
        {formData.type === "vpc" && (
          <div className="mt-5">
            <span className="block text-sm font-medium text-gray-700 mb-2">
              Network preset <span className="text-gray-400 text-xs">(optional)</span>
            </span>
            <p className="text-xs text-gray-500 mb-3">
              Pick a default network layout so provisioning starts immediately.
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
      </div>
      <div className={sectionClasses}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Assignment scope
        </p>
        <h3 className="text-base font-semibold text-slate-900 mt-1">
          Decide who should access this project
        </h3>
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row" role="radiogroup">
            {scopeOptions.map((option) => {
              const isActive = formData.assignment_scope === option.value;
              return (
                <label
                  key={option.value}
                  htmlFor={`scope-${option.value}`}
                  className={`flex-1 rounded-[12px] border transition-colors ${
                    isActive
                      ? "border-[var(--theme-color)] bg-[var(--theme-surface-alt)]"
                      : "border-gray-200 bg-white hover:border-[var(--theme-color)]"
                  }`}
                >
                  <input
                    id={`scope-${option.value}`}
                    type="radio"
                    name="assignmentScope"
                    value={option.value}
                    checked={isActive}
                    onChange={(e) => updateFormData("assignment_scope", e.target.value)}
                    className="sr-only"
                  />
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--theme-heading-color)]">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {formData.assignment_scope === "client" && (
            <div className="mt-2">
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-2">
                Client<span className="text-red-500">*</span>
              </label>
              <select
                id="client_id"
                value={formData.client_id}
                onChange={(e) => updateFormData("client_id", e.target.value)}
                className={`w-full rounded-xl border px-3 py-2 text-sm ${
                  errors.client_id ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isClientsFetching}
              >
                <option value="" disabled>
                  {isClientsFetching ? "Loading clients..." : "Select a client"}
                </option>
                {(clients as Client[] | undefined)?.map((client) => (
                  <option key={client.id} value={client.id}>
                    {getClientLabel(client)}
                  </option>
                ))}
              </select>
              {errors.client_id && <p className="text-red-500 text-xs mt-1">{errors.client_id}</p>}
            </div>
          )}
        </div>
      </div>
      <div className={sectionClasses}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Project members
          </p>
          {suggestedMembers.length > 0 && (
            <button
              type="button"
              onClick={handleRestoreMembers}
              className="text-xs text-[var(--theme-color)] hover:underline disabled:opacity-50"
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
                  Loading members...
                </div>
              ) : selectedMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <span
                      key={member.id}
                      className="inline-flex items-center bg-[var(--theme-color)] text-white text-xs px-3 py-1 rounded-full"
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
                  Fetching members...
                </div>
              ) : suggestedMembers.length > 0 ? (
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {(suggestedMembers as ProjectUser[]).map((member) => {
                    const isSelected = selectedMembers.some((item) => item.id === member.id);
                    return (
                      <label
                        key={member.id}
                        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-[var(--theme-color)] focus:ring-[var(--theme-color)]"
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
                  No suggested members for this scope yet.
                </p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Select a client to load member suggestions for this scope.
          </p>
        )}
      </div>

      {/* Cloud Policies Section */}
      {cloudPolicies.length > 0 && selectedMembers.length > 0 && (
        <div className={sectionClasses}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Cloud access policies
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Assign cloud permissions to project members. Default policies are pre-selected.
          </p>
          <div className="space-y-4">
            {selectedMembers.map((member) => {
              const memberPolicies = userPolicies[member.id] || [];
              return (
                <div key={member.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {member.name || member.email || `User #${member.id}`}
                    {member.role && (
                      <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-wide">
                        {member.role}
                      </span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cloudPolicies.map((policy) => {
                      const isSelected = memberPolicies.includes(policy.id);
                      return (
                        <button
                          key={policy.id}
                          type="button"
                          onClick={() => handleTogglePolicy(member.id, policy.id)}
                          title={policy.description || policy.name}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? "bg-[var(--theme-color)] text-white shadow-md shadow-[var(--theme-color-faint)]"
                              : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-gray-300"
                          }`}
                        >
                          {policy.name || "Unnamed Policy"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {errors.general && <p className="text-red-500 text-xs mt-1">{errors.general}</p>}
    </div>
  );

  if (isPageMode) {
    return (
      <div className="font-Outfit">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-xl shadow-slate-200/70">
          <div className="border-b border-slate-100 pb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Project configuration
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Define your new workspace blueprint
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Capture the essential context your team needs to start deploying workloads right away.
            </p>
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.8fr),minmax(260px,1fr)]">
            <div className="space-y-6">{structuredForm}</div>
            <aside className="space-y-4">{renderSummaryPanel()}</aside>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {submitErrorMessage && (
            <p className="text-sm font-medium text-red-600" role="alert">
              {submitErrorMessage}
            </p>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {closeButtonLabel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-full bg-[var(--theme-color)] px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSubmitting ? (
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
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <div className={cardClasses}>
        <div
          className={`flex justify-between items-center px-6 py-4 border-b rounded-t-[24px] w-full ${headerBackgroundClass}`}
        >
          <h2 className="text-lg font-semibold text-[var(--theme-text-color)]">
            Create New Project
          </h2>
          {showCloseButton && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-[rgb(var(--theme-neutral-900) / 0.7)] font-medium transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className={bodyClasses}>{structuredForm}</div>
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t rounded-b-[24px]">
          {submitErrorMessage ? (
            <p className="text-sm font-medium text-red-600" role="alert">
              {submitErrorMessage}
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-[var(--theme-text-color)] bg-[var(--theme-surface-alt)] border border-[var(--theme-surface-alt)] rounded-[30px] font-medium hover:text-gray-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {closeButtonLabel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 bg-[var(--theme-color)] text-white font-medium rounded-full hover:bg-[var(--theme-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Create Project
              {isSubmitting && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
