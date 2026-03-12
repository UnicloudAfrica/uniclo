import React, { useMemo } from "react";
import { Copy } from "lucide-react";
import { ModernCard } from "@/shared/components/ui";

import type { DisplayInstance, GenericRecord, ResourceVolume } from "./instanceDetailsTypes";
import { formatDateTime, formatStatusText, safeParseJson } from "./instanceDetailsUtils";

interface NetworkSecurityCardProps {
  displayInstance: DisplayInstance;
  effectiveMetadata: GenericRecord;
  networkInfo: GenericRecord | undefined;
  securityInfo: GenericRecord | undefined;
  providerDetails: unknown;
}

const NetworkSecurityCard: React.FC<NetworkSecurityCardProps> = ({
  displayInstance,
  effectiveMetadata,
  networkInfo,
  securityInfo,
  providerDetails,
}) => {
  const providerVm = useMemo<GenericRecord | null>(() => {
    if (providerDetails && typeof providerDetails === "object") {
      return providerDetails as GenericRecord;
    }
    const raw =
      effectiveMetadata?.["provider_vm"] ?? effectiveMetadata?.["provider_vm_snapshot"] ?? null;
    return (safeParseJson(raw, raw) as GenericRecord | null) || null;
  }, [effectiveMetadata, providerDetails]);

  const providerSnapshot = useMemo(() => {
    if (!providerVm || typeof providerVm !== "object") return null;
    const vm = providerVm as GenericRecord;
    return {
      providerStatus: vm["status"],
      vmState: vm["vm_state"] ?? vm["vmState"],
      powerState: vm["power_state"] ?? vm["powerState"],
      taskState: vm["task_state"] ?? vm["taskState"],
      host: vm["host"],
      providerVmId: vm["id"],
      providerVmName: vm["name"],
      createdAt: vm["created"],
      updatedAt: vm["updated"],
    };
  }, [providerVm]);

  const networkTopologySummary = useMemo(() => {
    if (networkInfo && typeof networkInfo === "object") {
      const info = networkInfo as GenericRecord;
      const normalizedNetworks: Record<string, unknown> = {};
      const networks = info["networks"];
      if (Array.isArray(networks)) {
        networks.forEach((network: { name?: string; addresses?: unknown[] }) => {
          const name = network?.name || `Network ${Object.keys(normalizedNetworks).length + 1}`;
          normalizedNetworks[name] = network?.addresses || [];
        });
      }
      return {
        networks: normalizedNetworks,
        flatAddresses: (info["flat_addresses"] || info["flatAddresses"] || []) as unknown[],
        publicIps: (info["public_ips"] || info["publicIps"] || []) as unknown[],
        privateIps: (info["private_ips"] || info["privateIps"] || []) as unknown[],
        primaryIp: (info["primary_ip"] || info["primaryIp"]) as string | undefined,
      };
    }
    if (!providerVm || typeof providerVm !== "object") return null;
    const vm = providerVm as GenericRecord;
    return {
      networks: (vm["addresses"] as Record<string, unknown>) || {},
      flatAddresses: (vm["flat_addresses"] as unknown[]) || [],
      publicIps: (vm["public_ips"] as unknown[]) || [],
      privateIps: (vm["private_ips"] as unknown[]) || [],
      primaryIp: vm["primary_ip"] as string | undefined,
    };
  }, [networkInfo, providerVm]);

  const hasNetworkTopology = useMemo(() => {
    if (!networkTopologySummary) return false;
    const { primaryIp, publicIps = [], privateIps = [], networks = {} } = networkTopologySummary;
    return (
      !!primaryIp ||
      publicIps.length > 0 ||
      privateIps.length > 0 ||
      Object.keys(networks).length > 0
    );
  }, [networkTopologySummary]);

  const securitySummary = useMemo(() => {
    if (securityInfo && typeof securityInfo === "object") {
      return {
        keyPair: securityInfo["key_pair"] || securityInfo["keyPair"] || null,
        securityGroups: securityInfo["security_groups"] || securityInfo["securityGroups"] || [],
        attachedVolumes: securityInfo["volumes"] || securityInfo["volumes_attached"] || [],
        createdVolumeIds: securityInfo["created_volume_ids"] || [],
        createdElasticIps: securityInfo["created_eip_ids"] || [],
      };
    }
    const vm = providerVm as GenericRecord | null;
    return {
      keyPair:
        (vm?.["key_name"] as string | undefined) ??
        (effectiveMetadata?.["key_name"] as string | undefined) ??
        ((displayInstance?.["key_pair"] as GenericRecord | undefined)?.["name"] as
          | string
          | undefined) ??
        null,
      securityGroups:
        (vm?.["security_groups"] as unknown[]) ??
        (effectiveMetadata?.["security_groups"] as unknown[]) ??
        (displayInstance?.["security_group_ids"] as string[] | undefined) ??
        [],
      attachedVolumes: (vm?.["volumes_attached"] as unknown[]) || [],
      createdVolumeIds: (effectiveMetadata?.["created_volume_ids"] as unknown[]) || [],
      createdElasticIps: (effectiveMetadata?.["created_eip_ids"] as unknown[]) || [],
    };
  }, [displayInstance, effectiveMetadata, providerVm, securityInfo]);

  const securitySummaryEntries = useMemo(() => {
    if (!securitySummary) return [];
    return [
      {
        label: "Key Pair",
        value: securitySummary.keyPair || "N/A",
      },
      {
        label: "Security Groups",
        chips: Array.isArray(securitySummary.securityGroups) ? securitySummary.securityGroups : [],
      },
      {
        label: "Attached Volumes",
        volumes: Array.isArray(securitySummary.attachedVolumes)
          ? securitySummary.attachedVolumes
          : [],
      },
      {
        label: "Provisioned Elastic IPs",
        value: Array.isArray(securitySummary.createdElasticIps)
          ? securitySummary.createdElasticIps.length
            ? securitySummary.createdElasticIps.join(", ")
            : "None"
          : "None",
      },
      {
        label: "Provisioned Data Volumes",
        value: Array.isArray(securitySummary.createdVolumeIds)
          ? securitySummary.createdVolumeIds.length
            ? securitySummary.createdVolumeIds.join(", ")
            : "None"
          : "None",
      },
    ];
  }, [securitySummary]);

  const hasSecurityDetails = useMemo(
    () =>
      securitySummaryEntries.some(
        (entry) =>
          (typeof entry.value === "string" && entry.value !== "N/A" && entry.value !== "None") ||
          (Array.isArray(entry.chips) && entry.chips.length > 0) ||
          (Array.isArray(entry.volumes) && entry.volumes.length > 0)
      ),
    [securitySummaryEntries]
  );

  const providerSnapshotEntries = useMemo(() => {
    if (!providerSnapshot) return [];
    return [
      {
        label: "Provider Status",
        value: formatStatusText(providerSnapshot.providerStatus),
      },
      {
        label: "VM State",
        value: formatStatusText(providerSnapshot.vmState),
      },
      {
        label: "Power State",
        value: providerSnapshot.powerState ?? "N/A",
      },
      {
        label: "Task State",
        value: providerSnapshot.taskState ?? "N/A",
      },
      { label: "Host", value: providerSnapshot.host || "N/A" },
      {
        label: "Provider VM ID",
        value: providerSnapshot.providerVmId || "N/A",
        copyable: !!providerSnapshot.providerVmId,
      },
      {
        label: "Provider VM Name",
        value: providerSnapshot.providerVmName || "N/A",
      },
      {
        label: "Created",
        value: providerSnapshot.createdAt ? formatDateTime(providerSnapshot.createdAt) : "N/A",
      },
      {
        label: "Last Updated",
        value: providerSnapshot.updatedAt ? formatDateTime(providerSnapshot.updatedAt) : "N/A",
      },
    ];
  }, [providerSnapshot]);

  return (
    <div className="space-y-6">
      <ModernCard padding="xl" className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Network &amp; Security</h2>
          <p className="text-sm text-slate-500">
            Connectivity and access controls synchronised from the provider.
          </p>
        </div>

        {hasNetworkTopology ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Primary IP
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {networkTopologySummary?.primaryIp || "N/A"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Public IPs
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {networkTopologySummary?.publicIps?.length ? (
                  networkTopologySummary.publicIps.map((ip: any) => (
                    <span
                      key={`public-${ip}`}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {ip}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">None</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Private IPs
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {networkTopologySummary?.privateIps?.length ? (
                  networkTopologySummary.privateIps.map((ip: any) => (
                    <span
                      key={`private-${ip}`}
                      className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {ip}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">None</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Network topology is not available for this provider yet.
          </p>
        )}

        {hasSecurityDetails ? (
          <div className="space-y-3">
            {securitySummaryEntries.map((entry: any) => (
              <div
                key={entry.label}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {entry.label}
                </p>
                {entry.value && (
                  <p className="mt-1 text-sm font-semibold text-slate-900">{entry.value}</p>
                )}
                {entry.chips?.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.chips.map((chip: any) => (
                      <span
                        key={chip}
                        className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
                {entry.volumes?.length ? (
                  <ul className="mt-2 space-y-2 text-xs text-slate-600">
                    {entry.volumes.map((vol: ResourceVolume, index: number) => (
                      <li
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                        key={`${vol?.id || vol?.name || index}`}
                      >
                        <span className="font-medium text-slate-800">
                          {vol?.name || vol?.volume_label || "Volume"}
                        </span>
                        {vol?.size_gb ? (
                          <span className="ml-2 text-slate-500">{vol.size_gb} GiB</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </ModernCard>

      {providerSnapshotEntries.length > 0 && (
        <ModernCard padding="xl" className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Provider Snapshot</h2>
            <p className="text-sm text-slate-500">
              Real-time state synchronised from the underlying infrastructure.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {providerSnapshotEntries.map((entry: any) => (
              <div
                key={entry.label}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {entry.label}
                  </p>
                  {entry.copyable && entry.value && entry.value !== "N/A" ? (
                    <button
                      onClick={() => navigator.clipboard.writeText(entry.value)}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                      title={`Copy ${entry.label}`}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-900">{entry.value}</p>
              </div>
            ))}
          </div>
        </ModernCard>
      )}
    </div>
  );
};

export default NetworkSecurityCard;
