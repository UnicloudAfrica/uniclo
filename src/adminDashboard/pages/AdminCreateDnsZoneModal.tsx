import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Globe2 } from "lucide-react";
import ModernModal, { type ModalAction } from "@/shared/components/ui/ModernModal";
import ModernInput from "@/shared/components/ui/ModernInput";
import ModernSelect from "@/shared/components/ui/ModernSelect";
import { useFetchProjects } from "@/hooks/adminHooks/projectHooks";
import { useCreateDnsZone } from "@/hooks/dnsHooks";
import { useRegionOptions } from "@/hooks/useRegionOptions";

/**
 * Admin-side "New DNS Zone" modal.
 *
 * Designate (and the legacy Route53-shim Zadara DNS) is project-scoped, so
 * an admin needs to act on behalf of one of a tenant's projects when
 * creating a zone here. This modal wraps the existing customer-facing
 * `useCreateDnsZone` hook (which routes through the same controller) and
 * adds project + region pickers on top.
 *
 * Wiring is intentionally minimal: name + comment + private_zone are the
 * only Designate-required fields. Records are added separately via the
 * project's DNS management view.
 */
interface AdminCreateDnsZoneModalProps {
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

export default function AdminCreateDnsZoneModal({
  isOpen,
  onClose,
  defaultRegion,
}: AdminCreateDnsZoneModalProps) {
  const queryClient = useQueryClient();

  const [projectIdentifier, setProjectIdentifier] = useState("");
  const [region, setRegion] = useState(defaultRegion ?? "");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const { data: projectsData, isLoading: projectsLoading } = useFetchProjects({
    per_page: 100,
  });
  const { options: regionOptions, isLoading: regionsLoading } = useRegionOptions();
  const { mutate: createZone, isPending } = useCreateDnsZone();

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

  // Auto-fill region when admin picks a project — the project's home region
  // is the right default 99% of the time.
  useEffect(() => {
    if (!projectIdentifier) return;
    const found = projects.find((p) => p.identifier === projectIdentifier);
    if (found?.region && !region) setRegion(found.region);
  }, [projectIdentifier, projects, region]);

  const reset = () => {
    setProjectIdentifier("");
    setRegion(defaultRegion ?? "");
    setName("");
    setComment("");
    setIsPrivate(false);
    setAttempted(false);
  };

  const handleClose = () => {
    if (isPending) return;
    reset();
    onClose();
  };

  const isValid = Boolean(projectIdentifier && region && name.trim());

  const handleSubmit = () => {
    setAttempted(true);
    if (!isValid) return;
    // Designate / Route53 expect FQDNs ending with a dot — match the
    // customer-side normalization in DnsManagementContainer.
    const fqdn = name.trim().endsWith(".") ? name.trim() : `${name.trim()}.`;
    createZone(
      {
        project_id: projectIdentifier,
        region,
        name: fqdn,
        comment: comment || undefined,
        private_zone: isPrivate,
      },
      {
        onSuccess: () => {
          // Hook invalidates ["dns-zones"] (customer-side); also invalidate
          // the admin inventory query so AdminDnsZones table refreshes.
          queryClient.invalidateQueries({ queryKey: ["admin", "dns-zones"] });
          reset();
          onClose();
        },
      }
    );
  };

  const actions: ModalAction[] = [
    { label: "Cancel", variant: "ghost", onClick: handleClose, disabled: isPending },
    {
      label: isPending ? "Creating…" : "Create Zone",
      variant: "primary",
      onClick: handleSubmit,
      disabled: !isValid || isPending,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create DNS Zone"
      subtitle="Provision an authoritative zone on behalf of a tenant project."
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
          helper="The tenant project that will own this zone."
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
          label="Domain Name"
          placeholder="example.com"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          error={attempted && !name.trim() ? "Domain is required" : undefined}
          helper="A trailing dot is added automatically if missing (RFC 1035)."
        />

        <ModernInput
          label="Comment (optional)"
          placeholder="e.g. Production traffic"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="mt-1 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
          />
          <span className="text-sm">
            <span className="font-medium text-slate-900 dark:text-slate-100">
              Private zone
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">
              Only resolvable from inside the tenant's VPC. Public zones answer
              queries from the open internet.
            </span>
          </span>
        </label>

        <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          <Globe2 className="h-4 w-4 flex-shrink-0 text-slate-400" />
          <p>
            Records (A, AAAA, CNAME, etc.) are added from the project's DNS
            management view after the zone is created.
          </p>
        </div>
      </div>
    </ModernModal>
  );
}
