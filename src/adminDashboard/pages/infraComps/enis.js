import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useFetchNetworkInterfaces,
  syncNetworkInterfacesFromProvider,
} from "../../../hooks/adminHooks/networkHooks";
import AddEni from "../eniComps/addEni";
import { AttachSgModal, DetachSgModal } from "../eniComps/sgModals";
import ToastUtils from "../../../utils/toastUtil";
import ResourceSection from "../../components/ResourceSection";
import ResourceEmptyState from "../../components/ResourceEmptyState";

const StatusBadge = ({ text }) => {
  const map = {
    available: "bg-green-100 text-green-800",
    active: "bg-green-100 text-green-800",
    inuse: "bg-blue-100 text-blue-800",
    pending: "bg-yellow-100 text-yellow-800",
    unknown: "bg-gray-100 text-gray-800",
  };
  const key = (text || "unknown").toLowerCase();
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${map[key] || map.unknown}`}>
      {text || "Unknown"}
    </span>
  );
};

const ENIs = ({ projectId = "", region = "" }) => {
  const { data: enis, isFetching } = useFetchNetworkInterfaces(projectId, region);
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setCreateModal] = useState(false);
  const [attachModal, setAttachModal] = useState({ open: false, eniId: "" });
  const [detachModal, setDetachModal] = useState({ open: false, eniId: "" });
  const [isSyncing, setIsSyncing] = useState(false);

  const list = Array.isArray(enis) ? enis : [];

  const handleSync = async () => {
    if (!projectId || !region) {
      ToastUtils.error("Project and region are required to sync ENIs");
      return;
    }

    setIsSyncing(true);
    try {
      await syncNetworkInterfacesFromProvider({ project_id: projectId, region });
      await queryClient.invalidateQueries({ queryKey: ["networkInterfaces", { projectId, region }] });
      ToastUtils.success("Network interfaces synced successfully!");
    } catch (error) {
      console.error("Failed to sync network interfaces:", error);
      ToastUtils.error(error?.message || "Failed to sync network interfaces.");
    } finally {
      setIsSyncing(false);
    }
  };

  const syncButton = (
    <button
      onClick={handleSync}
      disabled={isSyncing || !projectId || !region}
      className="flex items-center gap-2 rounded-full py-2.5 px-5 bg-white border border-[#288DD1] text-[#288DD1] text-sm hover:bg-[#288DD1] hover:text-white transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
      {isSyncing ? "Syncing..." : "Sync ENIs"}
    </button>
  );

  const createButton = (
    <button
      onClick={() => setCreateModal(true)}
      className="rounded-full py-3 px-9 bg-[#288DD1] text-white font-medium text-sm hover:bg-[#1976D2] transition-colors"
    >
      Create ENI
    </button>
  );

  return (
    <ResourceSection
      title="Elastic Network Interfaces"
      description="Provision additional network adapters for granular connectivity and IP management."
      actions={[syncButton, createButton]}
      isLoading={Boolean(region && isFetching)}
    >
      {list.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((eni) => {
            const record = eni.network_interface ?? eni;
            const id = record?.id ?? eni.id;
            const attachment = record?.attachment ?? eni.attachment;
            const status = record?.state ?? record?.status ?? eni.state ?? eni.status ?? "Unknown";
            const ips = record?.private_ip_addresses ?? [];
            const securityGroups = record?.security_groups ?? eni.security_groups ?? [];
            const primaryIp =
              ips[0]?.private_ip_address ||
              record?.private_ip ||
              record?.private_ip_address ||
              "—";

            return (
              <div key={id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate" title={id}>
                      {id}
                    </h3>
                    <p className="text-xs text-gray-500">Primary IP: {primaryIp}</p>
                    <p className="text-xs text-gray-500">
                      Attachment: {attachment?.instance_id || attachment?.id || "None"}
                    </p>
                  </div>
                  <StatusBadge text={status} />
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase mb-1">IP Addresses</p>
                    {ips.length === 0 ? (
                      <p className="text-gray-500">None</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {ips.map((ip, idx) => {
                          const value = typeof ip === "string" ? ip : ip.private_ip_address || JSON.stringify(ip);
                          return <li key={`${id}-ip-${idx}`}>{value}</li>;
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 uppercase">Security Groups</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setAttachModal({ open: true, eniId: id })}
                          className="rounded-full px-3 py-1 bg-[#288DD1] text-white text-xs"
                        >
                          Attach SG
                        </button>
                        <button
                          onClick={() => setDetachModal({ open: true, eniId: id })}
                          className="rounded-full px-3 py-1 border text-xs"
                        >
                          Detach SG
                        </button>
                      </div>
                    </div>
                    {securityGroups.length === 0 ? (
                      <p className="text-gray-500">None</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {securityGroups.map((sg, idx) => {
                          const label = typeof sg === "string" ? sg : sg.id || sg.name || JSON.stringify(sg);
                          return (
                            <span
                              key={`${id}-sg-${idx}`}
                              className="px-2 py-0.5 text-xs rounded-full bg-white border text-gray-600"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <ResourceEmptyState
          title="No Network Interfaces"
          message="Sync from the provider or create an ENI to attach additional IPs to your workloads."
          action={createButton}
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
