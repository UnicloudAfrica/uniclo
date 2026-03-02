import { useMemo, useState, type ReactNode } from "react";
import { RefreshCw, Shield } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useFetchNetworkInterfaces,
  syncNetworkInterfacesFromProvider,
} from "../../../hooks/adminHooks/networkHooks";
import AddEni from "../eniComps/addEni";
import { AttachSgModal, DetachSgModal } from "../eniComps/sgModals";
import ToastUtils from "../../../utils/toastUtil";
import { ResourceSection } from "../../../shared/components/ui";
import { ResourceEmptyState } from "../../../shared/components/ui";
import { ResourceListCard } from "../../../shared/components/ui";
import { ModernButton } from "../../../shared/components/ui";
import type { MetaItem, Tone } from "../../../shared/components/ui/ResourceSection";
import logger from "../../../utils/logger";

type IpEntry = string | { private_ip_address?: string } | Record<string, unknown>;
type SecurityGroupEntry = string | { id?: string; name?: string } | Record<string, unknown>;

const getToneForStatus = (status = ""): Tone => {
  const normalized = status.toString().toLowerCase();
  if (["available", "active", "in-use", "inuse"].includes(normalized)) return "success";
  if (["pending", "attaching", "detaching"].includes(normalized)) return "warning";
  if (["failed", "error"].includes(normalized)) return "danger";
  return "neutral";
};

const ENIs = ({ projectId = "", region = "" }: any) => {
  const { data: enis, isFetching } = useFetchNetworkInterfaces(projectId, region);
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [attachModal, setAttachModal] = useState({ open: false, eniId: "" });
  const [detachModal, setDetachModal] = useState({ open: false, eniId: "" });
  const [isSyncing, setIsSyncing] = useState(false);

  const list = Array.isArray(enis) ? enis : [];
  const stats = useMemo<MetaItem[]>(() => {
    let totalIps = 0;
    let attachedCount = 0;
    list.forEach((eni: any) => {
      const record = eni.network_interface ?? eni;
      const ips = record?.private_ip_addresses ?? eni.private_ip_addresses ?? [];
      totalIps += ips.length;
      if (record?.attachment?.instance_id || record?.attachment?.id) {
        attachedCount += 1;
      }
    });
    const summary: MetaItem[] = [
      {
        label: "Network Interfaces",
        value: list.length,
        tone: list.length ? "primary" : "neutral",
      },
      {
        label: "IP Addresses",
        value: totalIps,
        tone: totalIps ? "info" : "neutral",
      },
    ];
    if (attachedCount) {
      summary.push({
        label: "Attached",
        value: attachedCount,
        tone: "success",
      });
    }
    if (region) {
      summary.push({
        label: "Region",
        value: region,
        tone: "info",
      });
    }
    return summary;
  }, [list, region]);

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Project and region are required to sync ENIs");
      return;
    }

    setIsSyncing(true);
    try {
      await syncNetworkInterfacesFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({
        queryKey: ["networkInterfaces", { projectId, region }],
      });
      ToastUtils.success("Network interfaces synced successfully!");
    } catch (error) {
      logger.error("Failed to sync network interfaces:", error);
      ToastUtils.error(
        error instanceof Error ? error.message : "Failed to sync network interfaces."
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const syncButton = (
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={isSyncing || !projectId || !region}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync ENIs"}
    </ModernButton>
  );

  const createButton = (
    <ModernButton key="add" variant="primary" size="sm" onClick={() => setCreateModal(true)}>
      Create ENI
    </ModernButton>
  );

  return (
    <ResourceSection
      title="Elastic Network Interfaces"
      description="Provision additional network adapters for granular connectivity and IP management."
      actions={[syncButton, createButton]}
      meta={stats}
      isLoading={Boolean(region && isFetching)}
    >
      {list.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((eni: any, index: number) => {
            const record = eni.network_interface ?? eni;
            const idValue = record?.id ?? eni.id;
            const idLabel = idValue != null ? String(idValue) : "";
            const cardKey = idLabel || `eni-${index}`;
            const attachment = record?.attachment ?? eni.attachment;
            const statusRaw =
              record?.state ?? record?.status ?? eni.state ?? eni.status ?? "unknown";
            const status = statusRaw || "unknown";
            const ips: IpEntry[] = record?.private_ip_addresses ?? [];
            const securityGroups: SecurityGroupEntry[] =
              record?.security_groups ?? eni.security_groups ?? [];
            const firstIp = ips[0];
            const primaryIp =
              (typeof firstIp === "string" ? firstIp : firstIp?.private_ip_address) ||
              record?.private_ip ||
              record?.private_ip_address ||
              "—";
            const macAddress = record?.mac_address || record?.mac || eni.mac_address || null;
            const zone = record?.availability_zone || eni.availability_zone || null;
            const metadata = [
              { label: "Primary IP", value: primaryIp },
              {
                label: "Attachment",
                value: attachment?.instance_id || attachment?.id || "None",
              },
              {
                label: "Security Groups",
                value: securityGroups.length,
              },
              macAddress ? { label: "MAC Address", value: macAddress } : null,
              zone
                ? {
                    label: "Availability Zone",
                    value: zone,
                  }
                : null,
            ].filter((item): item is { label: string; value: ReactNode } => Boolean(item));

            return (
              <ResourceListCard
                key={cardKey}
                title={record?.name || idLabel || "Network Interface"}
                subtitle={idLabel || "—"}
                metadata={metadata}
                statuses={[
                  {
                    label: status,
                    tone: getToneForStatus(status),
                  },
                ]}
                footer={
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">IP Addresses</h4>
                      {ips.length === 0 ? (
                        <p className="text-sm text-slate-500">None</p>
                      ) : (
                        <ul className="space-y-1">
                          {ips.map((ip, idx) => {
                            const value =
                              typeof ip === "string"
                                ? ip
                                : "private_ip_address" in ip &&
                                    typeof ip.private_ip_address === "string"
                                  ? ip.private_ip_address
                                  : JSON.stringify(ip);
                            return (
                              <li
                                key={`${cardKey}-ip-${idx}`}
                                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                              >
                                {value}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-700">Security Groups</h4>
                        <div className="flex flex-wrap gap-2">
                          <ModernButton
                            variant="outline"
                            size="xs"
                            leftIcon={<Shield size={14} />}
                            onClick={() => setAttachModal({ open: true, eniId: idLabel })}
                            isDisabled={!idLabel}
                          >
                            Attach
                          </ModernButton>
                          <ModernButton
                            variant="ghost"
                            size="xs"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => setDetachModal({ open: true, eniId: idLabel })}
                            isDisabled={securityGroups.length === 0 || !idLabel}
                          >
                            Detach
                          </ModernButton>
                        </div>
                      </div>
                      {securityGroups.length === 0 ? (
                        <p className="text-sm text-slate-500">None assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {securityGroups.map((sg, idx) => {
                            const label = (() => {
                              if (typeof sg === "string") return sg;
                              if (typeof sg === "number") return String(sg);
                              if (sg && typeof sg === "object") {
                                const record = sg as Record<string, unknown>;
                                const idValue = record["id"];
                                const nameValue = record["name"];
                                const nameText =
                                  typeof nameValue === "string" || typeof nameValue === "number"
                                    ? String(nameValue)
                                    : "";
                                const idText =
                                  typeof idValue === "string" || typeof idValue === "number"
                                    ? String(idValue)
                                    : "";
                                return nameText || idText || JSON.stringify(record) || "—";
                              }
                              return "—";
                            })();
                            return (
                              <span
                                key={`${cardKey}-sg-${idx}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            );
          })}
        </div>
      ) : (
        <ResourceEmptyState
          title="No Network Interfaces"
          message="Sync from your cloud account or create an ENI to attach additional IPs to your workloads."
          action={
            <ModernButton variant="primary" onClick={() => setCreateModal(true)}>
              Create ENI
            </ModernButton>
          }
        />
      )}

      <AddEni
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModal(false)}
        projectId={projectId}
        region={region}
      />
      <AttachSgModal
        isOpen={attachModal.open}
        onClose={() => setAttachModal({ open: false, eniId: "" })}
        projectId={projectId}
        region={region}
        networkInterfaceId={attachModal.eniId}
      />
      <DetachSgModal
        isOpen={detachModal.open}
        onClose={() => setDetachModal({ open: false, eniId: "" })}
        projectId={projectId}
        region={region}
        networkInterfaceId={detachModal.eniId}
      />
    </ResourceSection>
  );
};

export default ENIs;
