import { Copy } from "lucide-react";
import ModernModal from "../../../shared/components/ui/ModernModal";
import ToastUtils from "../../../utils/toastUtil";
import { designTokens } from "../../../styles/designTokens";
import StatusPill, { type StatusTone } from "../../../shared/components/ui/StatusPill";

const copyButtonStyles = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px",
  borderRadius: designTokens.borderRadius.lg,
  border: `1px solid ${designTokens.colors.neutral[200]}`,
  backgroundColor: designTokens.colors.neutral[0],
  color: designTokens.colors.neutral[400],
  transition: "all 0.2s ease",
};

type VpcCidrAssociation = {
  cidr_assoc_id?: string;
  cidr_block?: string;
  state?: string;
};

type VpcServiceVm = {
  id?: string | number;
  vm_type?: string;
  status?: string;
};

type VpcMetadata = {
  enable_dns_support?: boolean;
  enable_dns_hostnames?: boolean;
  dhcp_options_id?: string;
  cidr_assocs_set?: VpcCidrAssociation[];
  service_vms?: VpcServiceVm[];
};

type VpcDetails = {
  id?: string | number;
  uuid?: string;
  name?: string;
  provider?: string;
  region?: string;
  cidr_block?: string;
  is_default?: boolean;
  state?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  metadata?: VpcMetadata | null;
};

type DetailRowProps = {
  label: string;
  value?: string | number | null | undefined;
  copyable?: boolean;
};

type ViewVpcModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vpc?: VpcDetails | null;
};

const getToneForStatus = (status?: string | null): StatusTone => {
  if (!status) return "neutral";
  const normalized = String(status).toLowerCase();
  if (["available", "active", "attached", "ready", "synced"].includes(normalized)) {
    return "success";
  }
  if (["pending", "associating", "updating", "syncing"].includes(normalized)) {
    return "warning";
  }
  if (["error", "failed", "detached", "inactive"].includes(normalized)) {
    return "danger";
  }
  return "neutral";
};

const DetailRow = ({ label, value, copyable }: DetailRowProps) => {
  const displayValue = value ?? "—";
  const handleCopy = async () => {
    const text = value === null || value === undefined ? "" : String(value);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      ToastUtils.success("Copied to clipboard");
    } catch {
      ToastUtils.error("Copy failed");
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span
        className="text-xs font-semibold uppercase tracking-wide"
        style={{ color: designTokens.colors.neutral[500] }}
      >
        {label}
      </span>
      <div className="flex items-center justify-between gap-3">
        <span
          className="flex-1 break-words text-sm"
          style={{ color: designTokens.colors.neutral[800] }}
        >
          {displayValue}
        </span>
        {copyable && value !== null && value !== undefined && String(value).length > 0 && (
          <button
            type="button"
            onClick={handleCopy}
            style={copyButtonStyles}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = designTokens.colors.primary[500];
              event.currentTarget.style.borderColor = designTokens.colors.primary[200];
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = designTokens.colors.neutral[400];
              event.currentTarget.style.borderColor = designTokens.colors.neutral[200];
            }}
          >
            <Copy size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

const ViewVpcModal = ({ isOpen, onClose, vpc }: ViewVpcModalProps) => {
  const actions = [
    {
      label: "Close",
      variant: "ghost" as const,
      onClick: onClose,
    },
  ];

  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={vpc ? `VPC • ${vpc.name}` : "VPC details"}
      size="xl"
      actions={actions}
      contentClassName="space-y-8 overflow-y-auto"
    >
      {vpc ? (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border p-5">
              <h3
                className="text-sm font-semibold"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Overview
              </h3>
              <div className="space-y-4">
                <DetailRow label="VPC Name" value={vpc.name} />
                <DetailRow label="Identifier" value={vpc.id} copyable />
                <DetailRow label="UUID" value={vpc.uuid} copyable />
                <DetailRow label="Provider" value={vpc.provider?.toUpperCase?.()} />
                <DetailRow label="Region" value={vpc.region} />
                <DetailRow label="CIDR Block" value={vpc.cidr_block} copyable />
                <DetailRow label="Default VPC" value={vpc.is_default ? "Yes" : "No"} />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border p-5">
              <h3
                className="text-sm font-semibold"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Status
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium"
                    style={{ color: designTokens.colors.neutral[600] }}
                  >
                    Provisioning State
                  </span>
                  <StatusPill label={vpc.state || "unknown"} tone={getToneForStatus(vpc.state)} />
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium"
                    style={{ color: designTokens.colors.neutral[600] }}
                  >
                    Lifecycle Status
                  </span>
                  <StatusPill label={vpc.status || "unknown"} tone={getToneForStatus(vpc.status)} />
                </div>
                <DetailRow
                  label="Created"
                  value={vpc.created_at ? new Date(vpc.created_at).toLocaleString() : "—"}
                />
                <DetailRow
                  label="Last Updated"
                  value={vpc.updated_at ? new Date(vpc.updated_at).toLocaleString() : "—"}
                />
              </div>
            </div>
          </section>

          {vpc.metadata && (
            <section className="space-y-4 rounded-2xl border p-5">
              <h3
                className="text-sm font-semibold"
                style={{ color: designTokens.colors.neutral[700] }}
              >
                Provider Metadata
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailRow
                  label="DNS Support"
                  value={vpc.metadata.enable_dns_support ? "Enabled" : "Disabled"}
                />
                <DetailRow
                  label="DNS Hostnames"
                  value={vpc.metadata.enable_dns_hostnames ? "Enabled" : "Disabled"}
                />
                <DetailRow label="DHCP Options ID" value={vpc.metadata.dhcp_options_id} copyable />
              </div>

              {Array.isArray(vpc.metadata.cidr_assocs_set) &&
                vpc.metadata.cidr_assocs_set.length > 0 && (
                  <div className="space-y-3">
                    <h4
                      className="text-xs font-semibold uppercase tracking-wide"
                      style={{ color: designTokens.colors.neutral[500] }}
                    >
                      CIDR Associations
                    </h4>
                    <div className="space-y-2 rounded-xl border border-dashed p-4">
                      {vpc.metadata.cidr_assocs_set.map((assoc, index) => (
                        <div
                          key={assoc.cidr_assoc_id ?? assoc.cidr_block ?? index}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span
                            className="text-sm font-medium"
                            style={{ color: designTokens.colors.neutral[700] }}
                          >
                            {assoc.cidr_block ?? "—"}
                          </span>
                          <StatusPill label={assoc.state} tone={getToneForStatus(assoc.state)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(vpc.metadata.service_vms) && vpc.metadata.service_vms.length > 0 && (
                <div className="space-y-3">
                  <h4
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: designTokens.colors.neutral[500] }}
                  >
                    Service VMs
                  </h4>
                  <div className="space-y-2 rounded-xl border border-dashed p-4">
                    {vpc.metadata.service_vms.map((vm, index) => (
                      <div
                        key={vm.id ?? vm.vm_type ?? index}
                        className="flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <p
                            className="text-sm font-medium"
                            style={{ color: designTokens.colors.neutral[700] }}
                          >
                            {vm.vm_type ?? "—"}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: designTokens.colors.neutral[500] }}
                          >
                            {vm.id ?? "—"}
                          </p>
                        </div>
                        <StatusPill label={vm.status} tone={getToneForStatus(vm.status)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <p className="text-sm" style={{ color: designTokens.colors.neutral[500] }}>
          VPC details are not available.
        </p>
      )}
    </ModernModal>
  );
};

export default ViewVpcModal;
