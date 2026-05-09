import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import AdminActiveTab from "../components/adminActiveTab";
import AdminPageShell from "../components/AdminPageShell";
import { ModernButton } from "@/shared/components/ui";
import PaymentModal from "@/shared/components/ui/PaymentModal";
import config from "../../config";
import {
  useFetchProjectById,
  useProjectStatus,
  useProjectMembershipSuggestions,
  useUpdateProjectMembers,
  useInviteProjectMember,
  useRevokeProjectUserPolicy,
  useAssignProjectUserPolicy,
  ProjectStatusResponse,
} from "@/hooks/adminHooks/projectHooks";
import { useCloudPolicies } from "@/hooks/adminHooks/cloudPolicyHooks";
import {
  useProjectInfrastructureStatus,
  useRetryProjectProvisioning,
  useSyncProjectInfrastructure,
} from "@/shared/hooks/resources/projectInfrastructureHooks";
import { useFetchProjectEdgeConfigAdmin } from "@/hooks/adminHooks/edgeHooks";

import AssignEdgeConfigModal from "./projectComps/assignEdgeConfig";
import ToastUtils from "@/utils/toastUtil";

import api from "../../index/admin/api";

import InfrastructureSetupWizard from "../components/provisioning/InfrastructureSetupWizard";
import ProvisioningFullScreen from "@/shared/components/provisioning/ProvisioningFullScreen";

import ProjectMemberManagerModal from "@/shared/components/projects/ProjectMemberManagerModal";
import ProjectDetailsShell from "./projectDetails/ProjectDetailsShell";

import { ProjectUser, SummaryItem, SummaryAction } from "@/types/project";

import { InfraStatusData } from "@/shared/components/projects/details/projectDetailsResourceCounts";

import { ApiResponse } from "@/shared/types/resource";
import logger from "@/utils/logger";

import {
  useResourceDataFetching,
  useInfrastructureStatus,
  useProjectProvisioning,
} from "./projectDetails/hooks";

import CredentialHealthAlert from "@/shared/components/alerts/CredentialHealthAlert";

// Infrastructure status component shape
interface InfraComponent {
  count?: number;
  status?: string;
}

// Provisioning step shape from API
interface ProvisioningStep {
  id?: string;
  label?: string;
  status?: string;
  updated_at?: string;
}

// Types
interface User extends Omit<ProjectUser, "actions"> {
  actions?: Record<string, unknown>;
}

interface InviteForm {
  name: string;
  email: string;
  role: string;
  note: string;
}

const decodeId = (encodedId: string | null): string | null => {
  if (!encodedId) return null;
  try {
    const decoded = atob(decodeURIComponent(encodedId));
    // Sanity check: ensure no control characters (like null byte)
    if (/\p{Cc}/u.test(decoded)) {
      return null;
    }
    return decoded;
  } catch (error_) {
    logger.error("Failed to decode project ID", error_);
    return null;
  }
};

export const formatMemberName = (user: User | null): string => {
  if (!user) return "User";
  if (user?.["name"]) return String(user["name"]);
  if (user?.["full_name"]) return String(user["full_name"]);

  const firstName = user?.["first_name"] || user?.["firstName"] || "";
  const middleName = user?.["middle_name"] || user?.["middleName"] || "";
  const lastName = user?.["last_name"] || user?.["lastName"] || "";

  const name = [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  return name || String(user?.["email"] || "") || String(user?.["id"]) || "User";
};

const isTenantAdmin = (user: User | null): boolean => {
  if (!user) return false;
  if (
    Array.isArray(user?.["roles"]) &&
    user["roles"].some((role: string) => role === "tenant_admin" || role === "tenant-admin")
  ) {
    return true;
  }
  if (typeof user?.["role"] === "string") {
    const role = user["role"].toLowerCase();
    if (role.includes("tenant_admin") || role.includes("tenant-admin")) return true;
  }
  if ((user?.["status"] as Record<string, unknown>)?.["tenant_admin"]) return true;
  return false;
};

const INVITE_FORM_DEFAULT: InviteForm = {
  name: "",
  email: "",
  role: "member",
  note: "",
};

export default function AdminProjectDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  const [isAssignEdgeOpen, setIsAssignEdgeOpen] = useState(false);
  const [activePaymentPayload, setActivePaymentPayload] = useState<Record<string, unknown> | null>(
    null
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(new Set());
  const [membershipError, setMembershipError] = useState("");

  const [inviteForm, setInviteForm] = useState<InviteForm>(INVITE_FORM_DEFAULT);

  const [inviteSuccessMessage, setInviteSuccessMessage] = useState("");

  const queryParams = new URLSearchParams(location.search);
  const identifierParam = queryParams.get("identifier");
  const encodedProjectId = queryParams.get("id");
  // Check if this is a newly created project (navigated from create form)
  const isNewProject = queryParams.get("new") === "true";
  const decodedProjectId = encodedProjectId ? decodeId(encodedProjectId) : null;
  const projectId = identifierParam || decodedProjectId;

  const {
    data: projectStatusData,
    isFetching: isProjectStatusFetching,
    refetch: refetchProjectStatus,
  } = useProjectStatus(projectId ?? "", {
    refetchInterval: (query: { state: { data?: ProjectStatusResponse } }) => {
      const data = query.state.data;
      const status = data?.["project"]?.["status"];
      return status === "provisioning" || status === "pending" ? 3000 : false;
    },
  });

  const { data: projectDetailsResponse, refetch: refetchProjectDetails } = useFetchProjectById(
    projectId as string,
    {
      enabled: Boolean(projectId),
      refetchInterval: (query: { state: { data?: { data?: { status?: string } } } }) => {
        const status = query?.state?.data?.data?.status;
        return status === "provisioning" || status === "pending" ? 3000 : false;
      },
    }
  ) as unknown as { data: Record<string, unknown> | undefined; refetch: () => void };

  const { data: infraStatusData } = useProjectInfrastructureStatus(projectId, {
    enabled: Boolean(projectId),
  }) as { data: InfraStatusData | undefined };

  // Typed accessor for infrastructure component data
  const infraComponents = (infraStatusData?.data?.components ?? {}) as Record<
    string,
    InfraComponent
  >;
  const getInfraCount = (key: string): number | undefined => infraComponents[key]?.count;

  const project = projectStatusData?.project as Record<string, unknown> | undefined;
  const resolvedProjectId = project?.identifier || projectId;

  // --- Extracted hooks ---
  const provisioning = useProjectProvisioning({
    project,
    projectId: projectId as string | null,
    resolvedProjectId: resolvedProjectId as string | undefined,
    isNewProject,
    refetchProjectStatus,
    refetchProjectDetails,
  });

  const { resourceCounts } = useResourceDataFetching({
    project,
    infraComponents,
    getInfraCount,
  });

  const { data: edgeConfig, refetch: refetchEdgeConfig } = useFetchProjectEdgeConfigAdmin(
    String(resolvedProjectId ?? ""),
    typeof project?.region === "string" ? project.region : "",
    {
      enabled: Boolean(resolvedProjectId && project?.region),
    }
  ) as unknown as { data: Record<string, unknown> | undefined; refetch: () => void };
  const edgePayload = (edgeConfig as { data?: unknown } | undefined)?.data ?? edgeConfig;
  const projectDetailsPayload = projectDetailsResponse?.data ?? projectDetailsResponse;
  const projectDetails = (projectDetailsPayload || project) as Record<string, unknown> | undefined;

  const infraStatus = useInfrastructureStatus({
    project,
    projectDetails,
    infraStatusData,
    infraComponents,
    getInfraCount,
    resourceCounts,
    edgePayload,
  });

  const allProjectUsers = useMemo(() => {
    const details = projectDetailsResponse as ApiResponse<{ users?: User[] }> | undefined;
    const detailsUsers = details?.data?.users;
    if (Array.isArray(detailsUsers)) return detailsUsers;
    if (Array.isArray(projectStatusData?.project?.["users"]))
      return projectStatusData.project["users"] as User[];

    const statusUsers = projectStatusData?.project?.["users"] as
      | Record<string, unknown>
      | undefined;
    if (Array.isArray(statusUsers?.["local"])) return statusUsers["local"] as User[];
    return [];
  }, [projectDetailsResponse, projectStatusData]);

  const { mutateAsync: inviteProjectMember, isPending: _isInviting } = useInviteProjectMember();

  const handleInviteSubmit = async (_e: React.FormEvent) => {
    _e.preventDefault();
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
      ToastUtils.error("Please provide both name and email.");
      return;
    }
    if (!project?.identifier) return;
    try {
      await inviteProjectMember({
        identifier: String(project.identifier),
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
      });
      setInviteForm(INVITE_FORM_DEFAULT);
      setInviteSuccessMessage("Invitation sent successfully!");
      await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
    } catch {
      // Error toast handled by toastApi
    }
  };

  useEffect(() => {
    if (!inviteSuccessMessage) return;
    const timer = setTimeout(() => setInviteSuccessMessage(""), 4000);
    return () => clearTimeout(timer);
  }, [inviteSuccessMessage]);

  const { mutateAsync: updateProjectMembers, isPending: isMembershipUpdating } =
    useUpdateProjectMembers();

  const { mutateAsync: syncInfrastructure, isPending: isSyncingInfrastructure } =
    useSyncProjectInfrastructure();
  const retryProvisioning = useRetryProjectProvisioning();
  const { mutateAsync: revokePolicy, isPending: isRevokingPolicy } = useRevokeProjectUserPolicy();
  const { mutateAsync: assignPolicy, isPending: isAssigningPolicy } = useAssignProjectUserPolicy();

  const { data: cloudPoliciesResponse } = useCloudPolicies(
    {
      region: project?.["region"] as string | undefined,
      active_only: true,
      provider: (project?.["provider"] as string | undefined) || "",
    },
    { enabled: Boolean(project?.["region"]) }
  );

  const cloudPolicies = Array.isArray(cloudPoliciesResponse) ? cloudPoliciesResponse : [];

  const summary = useMemo(() => (project?.["summary"] ?? []) as SummaryItem[], [project]);
  const requiredActions = useMemo(
    () => summary.filter((item) => !item?.["completed"] && item?.["action"]),
    [summary]
  );

  const projectTenantId = useMemo(() => {
    const p = project as Record<string, unknown> | undefined;
    const pd = projectDetails as Record<string, unknown> | undefined;
    const pt = p?.tenant as { id?: string | number } | undefined;
    const pdt = pd?.tenant as { id?: string | number } | undefined;
    return p?.tenant_id || pd?.tenant_id || pt?.id || pdt?.id || null;
  }, [project, projectDetails]);

  const projectClientId = useMemo(() => {
    const p = project as Record<string, unknown> | undefined;
    const pd = projectDetails as Record<string, unknown> | undefined;
    if (pd?.client_id) return pd.client_id;
    if (p?.client_id) return p.client_id;
    const pdClients = pd?.clients as Array<{ id?: string | number }> | undefined;
    const pClients = p?.clients as Array<{ id?: string | number }> | undefined;
    if (Array.isArray(pdClients) && pdClients.length) {
      return pdClients[0]?.id ?? null;
    }
    if (Array.isArray(pClients) && pClients.length) {
      return pClients[0]?.id ?? null;
    }
    return null;
  }, [project, projectDetails]);

  const assignmentScope = (() => {
    const p = project as Record<string, unknown> | undefined;
    const pd = projectDetails as Record<string, unknown> | undefined;
    if (pd?.assignment_scope) return pd.assignment_scope;
    if (p?.assignment_scope) return p.assignment_scope;
    if (projectClientId) return "client";
    if (projectTenantId) return "tenant";
    return "internal";
  })();

  const membershipParams = useMemo(() => {
    if (!assignmentScope && !projectTenantId && !projectClientId) {
      return null;
    }
    return {
      scope: assignmentScope || undefined,
      tenant_id: projectTenantId || undefined,
      client_id: projectClientId || undefined,
    };
  }, [assignmentScope, projectTenantId, projectClientId]);

  const { data: membershipSuggestions = [], isFetching: isMembershipFetching } =
    useProjectMembershipSuggestions(membershipParams ?? {}, {
      enabled: isMemberModalOpen && Boolean(membershipParams),
    });

  useEffect(() => {
    if (!isMemberModalOpen) return;
    setSelectedMemberIds(new Set(infraStatus.projectUserIdSet));
    setMembershipError("");
  }, [isMemberModalOpen, infraStatus.projectUserIdSet]);

  const normalizedMembershipOptions = useMemo(() => {
    const entries = Array.isArray(membershipSuggestions) ? membershipSuggestions : [];
    const map = new Map();
    type MemberUser = {
      id?: string | number;
      email?: string;
      roles?: string[];
      role?: string;
      status?: { role?: string };
    };
    const upsertMember = (user: MemberUser, { isCurrent = false, isOwner = false } = {}) => {
      if (!user || user.id === undefined || user.id === null) return;
      const id = Number(user.id);
      if (!Number.isFinite(id)) return;
      const existing = map.get(id) || {};
      map.set(id, {
        id,
        name: existing.name || formatMemberName(user as never),
        email: existing.email || user.email || "",
        role:
          existing.role ||
          (Array.isArray(user.roles)
            ? user.roles.join(", ")
            : user.role || user.status?.role || ""),
        isCurrent: existing.isCurrent || isCurrent,
        isOwner: existing.isOwner || isOwner,
      });
    };

    entries.forEach((user: MemberUser) => {
      const numericId = Number(user?.id);
      upsertMember(user, {
        isCurrent: infraStatus.projectUserIdSet.has(numericId),
        isOwner: infraStatus.tenantAdminUsers.some((admin: { id?: string | number }) => Number(admin.id) === numericId),
      });
    });

    infraStatus.projectUsers.forEach((user: unknown) => {
      upsertMember(user, {
        isCurrent: true,
        isOwner: isTenantAdmin(user),
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [
    membershipSuggestions,
    infraStatus.projectUsers,
    infraStatus.projectUserIdSet,
    infraStatus.tenantAdminUsers,
  ]);

  const pendingOwnerCount = useMemo(() => {
    if (!selectedMemberIds || selectedMemberIds.size === 0) return 0;
    return infraStatus.tenantAdminUsers.reduce((count: number, user: unknown) => {
      const id = Number(user.id);
      if (!Number.isFinite(id)) {
        return count;
      }
      return selectedMemberIds.has(id) ? count + 1 : count;
    }, 0);
  }, [selectedMemberIds, infraStatus.tenantAdminUsers]);

  const ownerWarningMessage =
    infraStatus.tenantAdminCount > 0 && isMemberModalOpen && pendingOwnerCount === 0
      ? "Add another owner before removing the last one."
      : "";

  const projectInstances = useMemo(() => {
    if (Array.isArray(projectDetails?.instances)) {
      return projectDetails.instances;
    }
    if (Array.isArray(project?.instances)) {
      return project.instances;
    }
    if (Array.isArray(projectDetails?.pending_instances)) {
      return projectDetails.pending_instances;
    }
    return [];
  }, [projectDetails, project]);

  const areAllSummaryItemsComplete = summary.every(
    (item: unknown) => item.completed === true || item.complete === true
  );

  const canCreateInstances =
    areAllSummaryItemsComplete && infraStatus.hasTenantAdmin && infraStatus.setupConditionsMet;

  const instanceStats = useMemo(() => {
    const base = { total: projectInstances.length, running: 0, provisioning: 0, paymentPending: 0 };
    projectInstances.forEach((instance: unknown) => {
      const normalized = (instance.status || "").toLowerCase();
      if (["running", "active", "ready"].includes(normalized)) base.running += 1;
      else if (
        ["pending", "processing", "provisioning", "initializing", "creating"].some((token) =>
          normalized.includes(token)
        )
      )
        base.provisioning += 1;
      else if (
        ["payment_pending", "awaiting_payment", "payment_required"].some((token) =>
          normalized.includes(token)
        )
      )
        base.paymentPending += 1;
    });
    return base;
  }, [projectInstances]);

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setActivePaymentPayload(null);
  };
  const handlePaymentComplete = async () => {
    closePaymentModal();
    await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
  };

  const handleToggleMember = (id: number) => {
    setSelectedMemberIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenericAction = async ({ method, endpoint, label, payload = {} }: { method: string; endpoint: string; label: string; payload?: Record<string, unknown> }) => {
    try {
      const toastId = `project-action-${endpoint}`;
      ToastUtils.info(`Executing ${label}...`, { id: toastId });
      const res = await api(method.toUpperCase(), endpoint, payload);
      ToastUtils.success(`${label} completed successfully!`, { id: toastId });
      await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
      return res;
    } catch (error: unknown) {
      logger.error(`Action error [${label}]:`, error);
      ToastUtils.error((error instanceof Error ? error.message : String(error)) || `Failed to execute ${label}`, {
        id: `project-action-err-${label}`,
      });
      throw error;
    }
  };

  const handleUserAction = async (user: User, actionKey: string) => {
    const action = user?.actions?.[actionKey];
    if (!action) return;

    await handleGenericAction({
      method: action.method || "POST",
      endpoint: action.endpoint,
      label: action.label || actionKey,
      payload: action.payload_defaults || {},
    });
  };

  const handleSaveMembers = async () => {
    if (!project?.identifier) return;
    setMembershipError("");
    try {
      await updateProjectMembers({
        identifier: project.identifier,
        user_ids: Array.from(selectedMemberIds),
      });
      setIsMemberModalOpen(false);
      // Refresh project data to show updated members
      await Promise.all([refetchProjectStatus(), refetchProjectDetails()]);
    } catch (err: unknown) {
      setMembershipError((err instanceof Error ? err.message : undefined) || "Failed to update project members");
    }
  };

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <ModernButton
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => navigate("/admin-dashboard/projects")}
      >
        Projects
      </ModernButton>
      <ModernButton
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => syncInfrastructure({ projectId: resolvedProjectId })}
        disabled={isProjectStatusFetching || isSyncingInfrastructure}
      >
        <RefreshCw
          size={14}
          className={isProjectStatusFetching || isSyncingInfrastructure ? "animate-spin" : ""}
        />
        Refresh
      </ModernButton>
      <ModernButton
        size="sm"
        className="flex items-center gap-2"
        onClick={() => setIsAssignEdgeOpen(true)}
      >
        Manage edge config
      </ModernButton>
    </div>
  );

  // Phase 8: Dedicated Provisioning Screen
  if (
    (provisioning.isInProvisioningMode ||
      (project?.["status"] === "provisioning" && !provisioning.allStepsComplete) ||
      project?.["status"] === "failed") &&
    !provisioning.forceHideProvisioning
  ) {
    return (
      <ProvisioningFullScreen
        project={project as { name?: string; status?: string } | null}
        setupSteps={provisioning.setupSteps || []}
        onRefresh={() => {
          refetchProjectStatus();
          refetchProjectDetails();
        }}
        onViewProject={() => {
          provisioning.setForceHideProvisioning(true);
          globalThis.window.location.reload();
        }}
        onRetry={() => {
          retryProvisioning.mutate(
            { projectId: project?.["identifier"] as string },
            {
              onSuccess: () => {
                refetchProjectStatus();
                refetchProjectDetails();
              },
            }
          );
        }}
        isRetrying={retryProvisioning.isPending}
      />
    );
  }

  // Infra Studio: Project created but not provisioned
  if (
    project?.["status"] === "created" ||
    (project as Record<string, unknown> | undefined)?.["provisioning_status"] === "created"
  ) {
    return (
      <>
        <AdminActiveTab />
        <AdminPageShell
          title="Infrastructure Setup"
          description={`Initialize infrastructure for ${project?.["name"] || projectId}`}
          breadcrumbs={[
            { label: "Home", href: "/admin-dashboard" },
            { label: "Projects", href: "/admin-dashboard/projects" },
            {
              label: project ? `${project["name"]} - ${project["identifier"]}` : "Project Details",
              href: "/admin-dashboard/projects",
            },
            { label: "Setup" },
          ]}
        >
          <InfrastructureSetupWizard
            project={project as unknown as import("@/types/project").Project}
          />
        </AdminPageShell>
      </>
    );
  }

  return (
    <>
      <AdminActiveTab />
      <AdminPageShell
        title={project?.["name"] || "Project Overview"}
        description={
          project
            ? `${project?.["identifier"] || projectId} • ${project?.["provider"] || "Provider"} • ${project?.["region"] || "Region"}`
            : "Loading project context..."
        }
        breadcrumbs={[
          { label: "Home", href: "/admin-dashboard" },
          { label: "Projects", href: "/admin-dashboard/projects" },
          {
            label: project ? `${project["name"]} - ${project["identifier"]}` : "Project Details",
          },
        ]}
        actions={headerActions}
        disableContentPadding={true}
        contentClassName=""
      >
        <div className="px-6 pt-4">
          <CredentialHealthAlert
            provider={project?.["provider"]}
            regionCode={project?.["region"]}
          />
        </div>
        <ProjectDetailsShell
          project={project as unknown as import("@/types/project").Project}
          projectInstances={projectInstances}
          allProjectUsers={allProjectUsers}
          cloudPolicies={cloudPolicies}
          resourceCounts={{
            vcpus: instanceStats.total * 2,
            volumes: resourceCounts["volumes"] || 0,
            images: resourceCounts["images"] || 0,
            snapshots: resourceCounts["snapshots"] || 0,
            vpcs: getInfraCount("vpc") ?? resourceCounts["vpcs"] ?? 0,
            subnets: getInfraCount("subnets") ?? resourceCounts["subnets"] ?? 0,
            security_groups:
              getInfraCount("security_groups") ?? resourceCounts["security_groups"] ?? 0,
            key_pairs: getInfraCount("keypairs") ?? resourceCounts["key_pairs"] ?? 0,
            route_tables: getInfraCount("route_tables") ?? resourceCounts["route_tables"] ?? 0,
            elastic_ips: getInfraCount("elastic_ips") ?? resourceCounts["elastic_ips"] ?? 0,
            network_interfaces:
              getInfraCount("network_interfaces") ?? resourceCounts["network_interfaces"] ?? 0,
            nat_gateways: resourceCounts["nat_gateways"] ?? 0,
            network_acls: resourceCounts["network_acls"] ?? 0,
            vpc_peering: resourceCounts["vpc_peering"] ?? 0,
            internet_gateways:
              getInfraCount("internet_gateways") ?? resourceCounts["internet_gateways"] ?? 0,
            load_balancers:
              getInfraCount("load_balancers") ?? resourceCounts["load_balancers"] ?? 0,
            users: allProjectUsers.length,
          }}
          infraStatusData={infraStatusData ?? null}
          networkData={provisioning.networkData}
          canCreateInstances={canCreateInstances}
          setupSteps={
            Array.isArray(project?.["provisioning_progress"])
              ? (project["provisioning_progress"] as ProvisioningStep[]).map((step) => ({
                  id: step.id || step.label?.toLowerCase()?.replaceAll(/\s+/g, "_") || "step",
                  label: step.label || "Step",
                  status: step.status as "pending" | "in_progress" | "completed" | "failed",
                  description: step.status === "completed" ? "Completed" : "Action in progress",
                  updated_at: step.updated_at,
                })) as unknown as Array<{ id: string; label: string; status: "completed" | "pending" | "not_started" | "failed"; description?: string; updated_at?: string; }>
              : []
          }
          setupProgressPercent={infraStatus.healthPercent}
          isProjectStatusFetching={isProjectStatusFetching}
          isSyncingInfrastructure={isSyncingInfrastructure}
          syncInfrastructure={syncInfrastructure}
          assignPolicy={assignPolicy}
          revokePolicy={revokePolicy}
          handleUserAction={handleUserAction}
          refetchProjectDetails={refetchProjectDetails as unknown as () => Promise<unknown>}
          refetchProjectStatus={refetchProjectStatus}
          isAssigningPolicy={isAssigningPolicy}
          isRevokingPolicy={isRevokingPolicy}
          setIsMemberModalOpen={setIsMemberModalOpen}
          handleInviteSubmit={handleInviteSubmit}
          inviteForm={inviteForm}
          setInviteForm={setInviteForm}
          formatMemberName={formatMemberName}
          requiredActions={requiredActions}
          onRequiredAction={(action: SummaryAction) =>
            handleGenericAction({
              method: action?.method || "POST",
              endpoint: action?.endpoint,
              label: action?.label,
            })
          }
        />
      </AdminPageShell>

      <ProjectMemberManagerModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={
          normalizedMembershipOptions as {
            id: number;
            name?: string;
            email?: string;
            role?: string | string[];
            isOwner?: boolean;
            isCurrent?: boolean;
          }[]
        }
        selectedIds={selectedMemberIds}
        onToggleMember={handleToggleMember}
        onSave={handleSaveMembers}
        isLoading={isMembershipFetching}
        isSaving={isMembershipUpdating}
        ownerWarning={ownerWarningMessage}
        errorMessage={membershipError}
      />

      {activePaymentPayload && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          transactionData={activePaymentPayload}
          onPaymentComplete={handlePaymentComplete}
          apiBaseUrl={config.adminURL}
        />
      )}

      <AssignEdgeConfigModal
        isOpen={isAssignEdgeOpen}
        onClose={() => setIsAssignEdgeOpen(false)}
        projectId={resolvedProjectId as string | number | null}
        region={project?.["region"]}
        onSuccess={async () => {
          await refetchProjectStatus();
          await (refetchEdgeConfig as unknown as () => Promise<unknown>)();
        }}
      />
    </>
  );
}
