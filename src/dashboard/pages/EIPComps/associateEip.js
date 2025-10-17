import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useAssociateTenantElasticIp } from "../../../hooks/elasticIPHooks";
import { useFetchTenantNetworkInterfaces } from "../../../hooks/eni";

const AssociateEipModal = ({
  isOpen,
  onClose,
  projectId,
  region,
  elasticIp,
}) => {
  const [targetType, setTargetType] = useState("eni");
  const [eniId, setEniId] = useState("");
  const [instanceId, setInstanceId] = useState("");
  const { mutate: associateEip, isPending } = useAssociateTenantElasticIp();

  const { data: enisRaw, isFetching } = useFetchTenantNetworkInterfaces(
    projectId,
    region,
    { enabled: isOpen && !!projectId && !!region }
  );
  const enis = useMemo(() => (Array.isArray(enisRaw) ? enisRaw : []), [enisRaw]);

  if (!isOpen || !elasticIp) return null;

  const allocationId =
    elasticIp.provider_resource_id || elasticIp.public_ip || elasticIp.id;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!allocationId) {
      ToastUtils.error("Missing Elastic IP identifier.");
      return;
    }

    if (targetType === "eni" && !eniId) {
      ToastUtils.error("Select a network interface to associate.");
      return;
    }

    if (targetType === "instance" && !instanceId.trim()) {
      ToastUtils.error("Provide an instance ID to associate.");
      return;
    }

    const payload = {
      project_id: projectId,
      region,
      allocation_id: allocationId,
    };

    if (targetType === "eni") {
      payload.eni_id = eniId;
    } else {
      payload.instance_id = instanceId.trim();
    }

    associateEip(payload, {
      onSuccess: () => {
        ToastUtils.success("Elastic IP associated.");
        setEniId("");
        setInstanceId("");
        onClose();
      },
      onError: (err) => {
        console.error("Failed to associate Elastic IP:", err);
        ToastUtils.error(err?.message || "Failed to associate Elastic IP.");
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[540px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Associate Elastic IP
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              Elastic IP: {allocationId}
            </p>
            <p className="text-xs text-gray-500">Region: {region || "N/A"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Type
            </label>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
              className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
            >
              <option value="eni">Network Interface</option>
              <option value="instance">Instance</option>
            </select>
          </div>

          {targetType === "eni" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select ENI
              </label>
              <select
                value={eniId}
                onChange={(e) => setEniId(e.target.value)}
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
              >
                <option value="">
                  {isFetching ? "Loading ENIs..." : "Select network interface"}
                </option>
                {enis.map((eni) => {
                  const value =
                    eni.provider_resource_id || eni.id || eni.uuid || "";
                  return (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instance ID
              </label>
              <input
                type="text"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="i-1234567890"
                className="w-full rounded-[10px] border px-3 py-2 text-sm input-field border-gray-300"
              />
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            type="button"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Associate
            {isPending && (
              <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssociateEipModal;
