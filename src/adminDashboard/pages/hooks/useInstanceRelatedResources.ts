import { useMemo } from "react";
import { Layers, Globe, Network, Shield, HardDrive } from "lucide-react";
import { encodeProjectId } from "@/shared/domains/projects/utils/projectHelpers";
import { DisplayInstance, GenericRecord } from "../adminInstancesDetails";

// Implied imports from main file context, but for extraction we assume they are available or passed.
// Since we are editing the same file, we just add the function definition.

// We need to know types.
// DisplayInstance, GenericRecord are defined in the file.
// We should check if we can pass them or if we need to export them or move them.
// They are defined in the file, so we can use them if we place the hook below them.

export const useInstanceRelatedResources = (
  displayInstance: DisplayInstance | undefined,
  effectiveMetadata: GenericRecord | null
) => {
  return useMemo(() => {
    if (!displayInstance) return [];

    const resources = [];

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
        .join(" · ");

      resources.push({
        key: "provider-region",
        label: "Provider & Region",
        value: combined || "—",
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
};
