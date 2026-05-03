import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Globe, Layers, ExternalLink } from "lucide-react";
import ModernModal, { type ModalAction } from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import { useFetchProjects } from "@/hooks/adminHooks/projectHooks";
import { useCreateLoadBalancer } from "@/hooks/adminHooks/loadBalancerHooks";
import { useRegionOptions } from "@/hooks/useRegionOptions";

/**
 * Admin "New Load Balancer" modal.
 *
 * Octavia LBs require a VPC + subnet + (usually) a security group, and the
 * full multi-step flow lives in the per-tenant LoadBalancerWizard. To keep
 * this admin-side modal focused, it captures the *minimum* an admin needs
 * to start an LB on a tenant's behalf — name, type, internet-facing flag,
 * and target VPC. For the rest (subnets, security groups, listeners,
 * pools), it offers a "continue in wizard" deep-link to the project view.
 *
 * The hook used (`useCreateLoadBalancer`) targets the same project-scoped
 * REST surface the tenant wizard uses — admin auth flows through the
 * `adminApi` client.
 */
interface AdminCreateLoadBalancerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRegion?: string;
}

interface ProjectLite {
  id: number | string;
  identifier: string;
  name: string;
  region?: string;
}

export default function AdminCreateLoadBalancerModal({
  isOpen,
  onClose,
  defaultRegion,
}: AdminCreateLoadBalancerModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [projectIdentifier, setProjectIdentifier] = useState("");
  const [region, setRegion] = useState(defaultRegion ?? "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lbType, setLbType] = useState<"application" | "network">("application");
  const [isExternal, setIsExternal] = useState(true);
  const [attempted, setAttempted] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useFetchProjects({
    per_page: 100,
  });
  const { options: regionOptions, isLoading: regionsLoading } = useRegionOptions();
  const { mutateAsync: createLb, isPending } = useCreateLoadBalancer();

  const projects = useMemo<ProjectLite[]>(() => {
    const raw = (projectsData as { data?: unknown })?.data;
    return Array.isArray(raw) ? (raw as ProjectLite[]) : [];
  }, [projectsData]);

  const projectOptions = useMemo(
    () => [
      { label: "Select a project…", value: "" },
      ...projects.map((p) => ({
        label: `${p.name} (${p.identifier})`,
        value: p.identifier,
      })),
    ],
    [projects]
  );

  // Resolve the numeric project id once the admin has picked a project —
  // the create endpoint takes the numeric id (not the identifier slug).
  const selectedProject = useMemo(
    () => projects.find((p) => p.identifier === projectIdentifier),
    [projects, projectIdentifier]
  );

  useEffect(() => {
    if (selectedProject?.region && !region) setRegion(selectedProject.region);
  }, [selectedProject, region]);

  const reset = () => {
    setProjectIdentifier("");
    setRegion(defaultRegion ?? "");
    setName("");
    setDescription("");
    setLbType("application");
    setIsExternal(true);
    setAttempted(false);
  };

  const handleClose = () => {
    if (isPending) return;
    reset();
    onClose();
  };

  const isValid = Boolean(projectIdentifier && region && name.trim() && selectedProject);

  const handleQuickCreate = async () => {
    setAttempted(true);
    if (!isValid || !selectedProject) return;
    // Admin LB controller does Project::findByIdentifier($projectId), so the
    // URL param must be the identifier slug, not the numeric primary key.
    await createLb({
      projectId: selectedProject.identifier,
      payload: {
        name: name.trim(),
        description: description.trim() || undefined,
        lb_type: lbType,
        is_external: isExternal,
        region,
      },
    });
    // The hook's own onSuccess invalidates ["load-balancers", projectId] —
    // also invalidate the admin inventory query so the table on
    // AdminLoadBalancers picks up the new row without a manual refresh.
    queryClient.invalidateQueries({ queryKey: ["admin", "load-balancers"] });
    reset();
    onClose();
  };

  const handleOpenWizard = () => {
    if (!selectedProject) return;
    // Hand off to the existing per-project wizard — same form fields, but
    // with subnet / security group / listener selection that we don't want
    // to inline here.
    navigate(
      `/admin-dashboard/infrastructure/load-balancers?project=${selectedProject.identifier}&region=${region}`
    );
    onClose();
  };

  const actions: ModalAction[] = [
    { label: "Cancel", variant: "ghost", onClick: handleClose, disabled: isPending },
    {
      label: isPending ? "Creating…" : "Quick Create",
      variant: "primary",
      onClick: handleQuickCreate,
      disabled: !isValid || isPending,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Load Balancer"
      subtitle="Provision an Octavia LB on behalf of a tenant project."
      actions={actions}
      size="md"
    >
      <div className="space-y-4">
        <ModernSelect
          label="Project"
          value={projectIdentifier}
          onChange={(e) => setProjectIdentifier(e.target.value)}
          options={projectOptions}
          disabled={projectsLoading}
          required
          error={attempted && !projectIdentifier ? "Project is required" : undefined}
        />

        <ModernSelect
          label="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          options={regionOptions}
          disabled={regionsLoading || !projectIdentifier}
          required
          error={attempted && !region ? "Region is required" : undefined}
        />

        <ModernInput
          label="Name"
          placeholder="prod-app-lb"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={attempted && !name.trim() ? "Name is required" : undefined}
        />

        <ModernInput
          label="Description (optional)"
          placeholder="Front-door for the production app"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLbType("application")}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                lbType === "application"
                  ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-500/10"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
            >
              <Globe
                className={`h-5 w-5 mb-1.5 ${
                  lbType === "application"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-400"
                }`}
              />
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Application
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                HTTP / HTTPS · Layer 7
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLbType("network")}
              className={`rounded-lg border-2 p-3 text-left transition-all ${
                lbType === "network"
                  ? "border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-500/10"
                  : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
            >
              <Layers
                className={`h-5 w-5 mb-1.5 ${
                  lbType === "network"
                    ? "text-primary-600 dark:text-primary-400"
                    : "text-slate-400"
                }`}
              />
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Network
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                TCP / UDP · Layer 4
              </div>
            </button>
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isExternal}
            onChange={(e) => setIsExternal(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
          />
          <span className="text-sm">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              Internet-facing
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Allocate a public VIP. Uncheck for an internal-only LB that's
              only reachable inside the tenant's VPC.
            </span>
          </span>
        </label>

        {selectedProject && (
          <button
            type="button"
            onClick={handleOpenWizard}
            disabled={isPending}
            className="flex w-full items-center justify-between rounded-lg border border-dashed border-slate-300 p-3 text-left text-xs text-slate-600 transition-colors hover:border-primary-300 hover:bg-primary-50/30 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-primary-700 dark:hover:bg-primary-500/5"
          >
            <span>
              Need to pick subnets, listeners, or security groups? Continue in
              the project's full LB wizard.
            </span>
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 ml-2" />
          </button>
        )}
      </div>
    </ModernModal>
  );
}
