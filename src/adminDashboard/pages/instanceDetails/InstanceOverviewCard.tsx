import React, { useMemo } from "react";
import { ArrowLeft, Copy, Globe, HardDrive, Layers, Network, Shield } from "lucide-react";
import { ModernCard } from "@/shared/components/ui";
import { encodeProjectId } from "@/shared/domains/projects/utils/projectHelpers";

import type { DisplayInstance, GenericRecord, ResourceVolume } from "./instanceDetailsTypes";
import { formatDateTime } from "./instanceDetailsUtils";

interface InstanceOverviewCardProps {
  displayInstance: DisplayInstance;
  effectiveMetadata: GenericRecord;
}

type RelatedResource = {
  key: string;
  label: string;
  value?: string;
  href?: string | null;
  icon?: React.ComponentType<{ className?: string }>;
  copyable?: boolean;
  chips?: string[];
  volumes?: ResourceVolume[];
  extraCount?: number;
};

const InstanceOverviewCard: React.FC<InstanceOverviewCardProps> = ({
  displayInstance,
  effectiveMetadata,
}) => {
  const relatedResources = useMemo<RelatedResource[]>(() => {
    if (!displayInstance) return [];

    const resources: RelatedResource[] = [];

    if (displayInstance.project?.name) {
      const projectIdentifier =
        displayInstance.project.identifier || displayInstance.project.id || "";
      const projectHref = projectIdentifier
        ? `/admin-dashboard/projects/details?id=${encodeProjectId(String(projectIdentifier))}`
        : null;

      resources.push({
        key: "project",
        label: "Project",
        value: displayInstance.project.name,
        href: projectHref,
        icon: Layers,
      });
    }

    if (displayInstance.provider || displayInstance.region) {
      const combined = [displayInstance.provider, displayInstance.region]
        .filter(Boolean)
        .join(" \u00b7 ");

      resources.push({
        key: "provider-region",
        label: "Provider & Region",
        value: combined || "\u2014",
        icon: Globe,
      });
    }

    const floatingIp = displayInstance.floating_ip?.ip_address;
    const privateIp = displayInstance.private_ip;
    if (floatingIp) {
      resources.push({
        key: "floating-ip",
        label: "Floating IP",
        value: floatingIp,
        copyable: true,
        icon: Network,
      });
    } else if (privateIp) {
      resources.push({
        key: "private-ip",
        label: "Private IP",
        value: privateIp,
        copyable: true,
        icon: Network,
      });
    }

    const securityGroupsChips = (effectiveMetadata?.["security_groups"] as string[]) || [];
    if (securityGroupsChips.length) {
      resources.push({
        key: "security-groups",
        label: "Security Groups",
        chips: securityGroupsChips,
        icon: Shield,
      });
    }

    const dataVolumesRaw = (effectiveMetadata?.["data_volumes"] as Record<string, unknown>[]) || [];
    if (dataVolumesRaw.length) {
      const volumes = dataVolumesRaw.slice(0, 3).map((vol: GenericRecord) => ({
        id: (vol?.["id"] || vol?.["name"] || vol?.["volume_label"]) as string | undefined,
        name: (vol?.["name"] || vol?.["volume_label"] || "Volume") as string,
        size: (vol?.["size_gb"] ||
          vol?.["volume_size_gb"] ||
          vol?.["storage_size_gb"] ||
          vol?.["capacity_gb"]) as string | number | undefined,
      }));

      resources.push({
        key: "data-volumes",
        label: "Data Volumes",
        volumes,
        extraCount:
          dataVolumesRaw.length > volumes.length ? dataVolumesRaw.length - volumes.length : 0,
        icon: HardDrive,
      });
    }

    return resources;
  }, [displayInstance, effectiveMetadata]);

  return (
    <ModernCard padding="xl" className="space-y-6">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Instance Overview</h2>
        <p className="text-sm text-slate-500">
          Core configuration, ownership, and related resources for this workload.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Provider</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {displayInstance.provider || "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Region</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {displayInstance.region || "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">OS Image</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {displayInstance.os_image?.name || "N/A"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {displayInstance.created_at ? formatDateTime(displayInstance.created_at) : "N/A"}
          </p>
        </div>
      </div>

      {relatedResources.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Related Resources</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {relatedResources.map((resource) => {
              const ResourceIcon = resource.icon;
              return (
                <div
                  key={resource.key}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    {ResourceIcon && <ResourceIcon className="h-4 w-4 text-slate-400" />}
                    {resource.label}
                  </div>
                  {resource.value ? (
                    resource.href ? (
                      <a
                        href={resource.href}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--theme-color)] transition hover:text-[var(--theme-color)]"
                      >
                        {resource.value}
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-slate-700">{resource.value}</p>
                    )
                  ) : null}
                  {resource.copyable && resource.value && (
                    <button
                      onClick={() => navigator.clipboard.writeText(resource.value!)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500 transition hover:text-slate-700"
                    >
                      <Copy className="h-3 w-3" />
                      Copy value
                    </button>
                  )}
                  {resource.chips?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {resource.chips.map((chip) => (
                        <span
                          key={chip}
                          className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {resource.volumes?.length ? (
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      {resource.volumes.map((vol: ResourceVolume) => (
                        <div
                          key={vol.id || vol.name}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                        >
                          <span className="font-medium text-slate-800">{vol.name}</span>
                          <span className="text-xs uppercase tracking-wide text-slate-500">
                            {vol.size !== undefined && vol.size !== null
                              ? typeof vol.size === "string"
                                ? vol.size
                                : `${vol.size} GiB`
                              : "\u2014"}
                          </span>
                        </div>
                      ))}
                      {resource.extraCount ? (
                        <p className="text-xs text-slate-500">
                          +{resource.extraCount} more volume
                          {resource.extraCount > 1 ? "s" : ""}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </ModernCard>
  );
};

export default InstanceOverviewCard;
