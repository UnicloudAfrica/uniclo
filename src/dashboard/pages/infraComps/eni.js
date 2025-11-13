import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Shield, Trash2 } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantNetworkInterfaces,
  useSyncTenantNetworkInterfaces,
  useDeleteTenantNetworkInterface,
} from "../../../hooks/eni";
import AddEniModal from "../eniComps/addEni";
import DeleteEniModal from "../eniComps/deleteEni";
import ManageEniSecurityGroupsModal from "../eniComps/manageSecurityGroups";
import ResourceSection from "../../../adminDashboard/components/ResourceSection";
import ResourceEmptyState from "../../../adminDashboard/components/ResourceEmptyState";
import ResourceListCard from "../../../adminDashboard/components/ResourceListCard";
import ModernButton from "../../../adminDashboard/components/ModernButton";

const ITEMS_PER_PAGE = 6;

const getToneForStatus = (status = "") => {
  const normalized = status.toString().toLowerCase();
  if (["available", "active", "in-use", "inuse"].includes(normalized)) return "success";
  if (["pending", "attaching", "detaching"].includes(normalized)) return "warning";
  if (["failed", "error"].includes(normalized)) return "danger";
  return "neutral";
};

const ENIs = ({
  projectId = "",
  region = "",
  actionRequest,
  onActionHandled,
  onStatsUpdate,
}) => {
  const { data: enis, isFetching } = useFetchTenantNetworkInterfaces(projectId, region);
  const { mutate: syncEnis, isPending: isSyncing } = useSyncTenantNetworkInterfaces();
  const { mutate: deleteEni, isPending: isDeleting } = useDeleteTenantNetworkInterface();

  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [manageModal, setManageModal] = useState(null);

  const list = useMemo(() => (Array.isArray(enis) ? enis : []), [enis]);
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(Math.max(totalItems, 1) / ITEMS_PER_PAGE));
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return list.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [list, currentPage]);

  const stats = useMemo(() => {
    let totalIps = 0;
    let attachedCount = 0;
    list.forEach((eni) => {
      const record = eni.network_interface ?? eni;
      const ips = record?.private_ip_addresses ?? eni.private_ip_addresses ?? [];
      totalIps += ips.length;
      if (record?.attachment?.instance_id || record?.attachment?.id) {
        attachedCount += 1;
      }
    });
    const summary = [
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
      summary.push({ label: "Attached", value: attachedCount, tone: "success" });
    }
    if (region) {
      summary.push({ label: "Region", value: region, tone: "info" });
    }
    return summary;
  }, [list, region]);

  const lastActionToken = useRef(null);
  const lastCountRef = useRef(-1);

  useEffect(() => {
    if (!isFetching) {
      if (lastCountRef.current !== list.length) {
        lastCountRef.current = list.length;
        onStatsUpdate?.(list.length);
      }
    }
  }, [list, isFetching, onStatsUpdate]);

  useEffect(() => {
    if (!actionRequest || actionRequest.resource !== "enis") {
      return;
    }
    if (lastActionToken.current === actionRequest.token) {
      return;
    }
    lastActionToken.current = actionRequest.token;

    if (actionRequest.type === "sync") {
      handleSync();
    } else if (actionRequest.type === "create") {
      setCreateModalOpen(true);
    }

    onActionHandled?.(actionRequest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionRequest]);

  const handleSync = () => {
    if (!projectId) {
      ToastUtils.error("Project context is required to sync ENIs.");
      return;
    }

    syncEnis(
      { project_id: projectId, region },
      {
        onSuccess: () => ToastUtils.success("Network interfaces synced with provider."),
        onError: (err) => {
          console.error("Failed to sync network interfaces:", err);
          ToastUtils.error(err?.message || "Failed to sync network interfaces.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!deleteModal?.eni) return;
    const eni = deleteModal.eni;
    const id = eni.id ?? eni.provider_resource_id;

    deleteEni(
      {
        id,
        payload: {
          project_id: projectId,
          region,
        },
      },
      {
        onSuccess: () => {
          ToastUtils.success("Network interface deleted.");
          setDeleteModal(null);
        },
        onError: (err) => {
          console.error("Failed to delete network interface:", err);
          ToastUtils.error(err?.message || "Failed to delete network interface.");
          setDeleteModal(null);
        },
      }
    );
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const actions = [
    <ModernButton
      key="sync"
      variant="outline"
      size="sm"
      leftIcon={<RefreshCw size={16} />}
      onClick={handleSync}
      isDisabled={isSyncing || !projectId}
      isLoading={isSyncing}
    >
      {isSyncing ? "Syncing..." : "Sync ENIs"}
    </ModernButton>,
    <ModernButton
      key="add"
      variant="primary"
      size="sm"
      onClick={() => setCreateModalOpen(true)}
      isDisabled={!projectId}
    >
      Add ENI
    </ModernButton>,
  ];

  const paginationControls =
    totalItems > ITEMS_PER_PAGE ? (
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <ModernButton
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          isDisabled={currentPage === 1}
        >
          Previous
        </ModernButton>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <ModernButton
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          isDisabled={currentPage === totalPages}
        >
          Next
        </ModernButton>
      </div>
    ) : null;

  const emptyState = (
    <ResourceEmptyState
      title="No Network Interfaces"
      message="Sync from your provider or create a network interface to expand connectivity."
      action={
        <ModernButton
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          isDisabled={!projectId}
        >
          Create ENI
        </ModernButton>
      }
    />
  );

  const renderIps = (eniRecord) => {
    const ips = eniRecord?.private_ip_addresses ?? [];
    if (!ips.length) {
      return <p className="text-sm text-slate-500">No private addresses</p>;
    }
    return (
      <ul className="space-y-1 text-sm text-slate-600">
        {ips.map((ip, index) => {
          const value = typeof ip === "string" ? ip : ip?.private_ip_address;
          return (
            <li key={`${eniRecord.id}-ip-${index}`}>{value || "—"}</li>
          );
        })}
      </ul>
    );
  };

  const renderCard = (eni) => {
    const record = eni.network_interface ?? eni;
    const id = record?.id ?? eni.id;
    const attachment = record?.attachment ?? eni.attachment;
    const statusRaw = record?.state ?? record?.status ?? eni.state ?? eni.status ?? "unknown";
    const status = statusRaw || "unknown";
    const securityGroups = record?.security_groups ?? eni.security_groups ?? [];
    const primaryIp =
      record?.private_ip_address ||
      record?.private_ip ||
      securityGroups?.[0]?.private_ip_address ||
      record?.private_ip_addresses?.[0]?.private_ip_address ||
      "—";
    const macAddress = record?.mac_address || record?.mac || eni.mac_address || null;
    const zone = record?.availability_zone || eni.availability_zone || null;

    return (
      <ResourceListCard
        key={id}
        title={record?.name || id}
        subtitle={id}
        metadata={[
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
          zone ? { label: "Availability Zone", value: zone } : null,
        ].filter(Boolean)}
        statuses={[
          {
            label: status,
            tone: getToneForStatus(status),
          },
        ]}
        actions={[
          {
            key: "manage-sg",
            label: "Manage Security Groups",
            icon: <Shield size={16} />,
            onClick: () => setManageModal({ eni }),
            disabled: !projectId,
          },
          {
            key: "delete",
            label: "Delete",
            icon: <Trash2 size={16} />,
            variant: "danger",
            onClick: () => setDeleteModal({ eni }),
            disabled: isDeleting,
          },
        ]}
        footer={
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Private IP Addresses</h4>
              {renderIps(record)}
            </div>
            {Array.isArray(securityGroups) && securityGroups.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-700">
                  Attached Security Groups
                </h4>
                <div className="flex flex-wrap gap-2">
                  {securityGroups.map((sg) => {
                    const sgId = sg.id || sg.provider_resource_id;
                    return (
                      <span
                        key={`${id}-sg-${sgId}`}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {sg.name || sgId}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        }
      />
    );
  };

  return (
    <>
      <ResourceSection
        title="Elastic Network Interfaces"
        description="Provision additional network adapters for granular connectivity and IP management."
        actions={actions}
        meta={stats}
        isLoading={isFetching}
      >
        {currentItems.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {currentItems.map(renderCard)}
            </div>
            {paginationControls}
          </>
        ) : (
          emptyState
        )}
      </ResourceSection>

      <AddEniModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        projectId={projectId}
        region={region}
      />
      <DeleteEniModal
        isOpen={Boolean(deleteModal)}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        eniName={deleteModal?.eni?.provider_resource_id || deleteModal?.eni?.id || ""}
        isDeleting={isDeleting}
      />
      <ManageEniSecurityGroupsModal
        isOpen={Boolean(manageModal)}
        onClose={() => setManageModal(null)}
        projectId={projectId}
        region={region}
        eni={manageModal?.eni || null}
      />
    </>
  );
};

export default ENIs;
