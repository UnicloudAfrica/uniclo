// @ts-nocheck
import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  useAttachTenantInternetGateway,
  useDetachTenantInternetGateway,
} from "../../../hooks/internetGatewayHooks";
import { useFetchTenantVpcs } from "../../../hooks/vpcHooks";
import ToastUtils from "../../../utils/toastUtil";

const AttachIgwModal = ({ isOpen, onClose, projectId, region = "", igw, mode = "attach" }) => {
  const [selectedVpc, setSelectedVpc] = useState("");
  const isAttach = mode === "attach";
  const actionLabel = isAttach ? "Attach" : "Detach";
  const igwId = igw?.provider_resource_id || igw?.id || igw?.uuid || igw?.name || "";

  const { data: vpcRaw, isFetching } = useFetchTenantVpcs(projectId, region, {
    enabled: isOpen && !!projectId && !!region,
  });
  const vpcs = useMemo(() => {
    if (Array.isArray(vpcRaw?.data)) return vpcRaw.data;
    if (Array.isArray(vpcRaw)) return vpcRaw;
    return [];
  }, [vpcRaw]);

  const { mutate: attachIgw, isPending: isAttaching } = useAttachTenantInternetGateway();
  const { mutate: detachIgw, isPending: isDetaching } = useDetachTenantInternetGateway();

  if (!isOpen) return null;

  const handleSubmit = (e: any) => {
    if (e) e.preventDefault();
    if (!igwId) {
      ToastUtils.error("Missing internet gateway identifier.");
      return;
    }
    if (isAttach && !selectedVpc) {
      ToastUtils.error("Select a VPC to attach.");
      return;
    }

    const payload = {
      project_id: projectId,
      region,
      internet_gateway_id: igwId,
      ...(isAttach ? { vpc_id: selectedVpc } : { vpc_id: igw?.attached_vpc_id }),
    };

    const mutate = isAttach ? attachIgw : detachIgw;
    mutate(payload, {
      onSuccess: () => {
        ToastUtils.success(
          isAttach ? "Internet Gateway attached to VPC." : "Internet Gateway detached."
        );
        onClose();
        setSelectedVpc("");
      },
      onError: (err) => {
        console.error(`Failed to ${mode} IGW:`, err);
        ToastUtils.error(err?.message || `Failed to ${mode} IGW.`);
      },
    });
  };

  const busy = isAttaching || isDetaching;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[520px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">{actionLabel} Internet Gateway</h2>
          <button
            onClick={() => {
              setSelectedVpc("");
              onClose();
            }}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              IGW: <span className="font-medium text-gray-900">{igw?.name || igwId}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Region: {region || "N/A"}</p>
          </div>

          {isAttach ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select VPC<span className="text-red-500">*</span>
              </label>
              <select
                value={selectedVpc}
                onChange={(e) => setSelectedVpc(e.target.value)}
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field"
                disabled={isFetching}
              >
                <option value="">{isFetching ? "Loading VPCs..." : "Select VPC"}</option>
                {vpcs.map((vpc: any) => {
                  const value = String(vpc.provider_resource_id || vpc.id || vpc.uuid || "");
                  return (
                    <option key={value} value={value}>
                      {vpc.name || value} ({vpc.region || "unknown"})
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>
                Current attachment:{" "}
                <span className="font-medium text-gray-900">{igw?.attached_vpc_id || "None"}</span>
              </p>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={() => {
              setSelectedVpc("");
              onClose();
            }}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            type="button"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy || (isAttach && !selectedVpc)}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {busy ? (
              <>
                {actionLabel}ing...
                <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
              </>
            ) : (
              actionLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttachIgwModal;
