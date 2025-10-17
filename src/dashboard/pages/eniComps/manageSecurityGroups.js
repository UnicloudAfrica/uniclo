import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import {
  useFetchTenantSecurityGroups,
} from "../../../hooks/securityGroupHooks";
import {
  useAttachTenantSecurityGroup,
  useDetachTenantSecurityGroup,
} from "../../../hooks/eni";

const ManageEniSecurityGroupsModal = ({
  isOpen,
  onClose,
  projectId,
  region,
  eni,
}) => {
  const [selectedAttach, setSelectedAttach] = useState("");
  const { data: securityGroupsRaw, isFetching } = useFetchTenantSecurityGroups(
    projectId,
    region,
    { enabled: isOpen && !!projectId && !!region }
  );
  const securityGroups = useMemo(
    () => securityGroupsRaw || [],
    [securityGroupsRaw]
  );

  const attachedIds = useMemo(() => {
    const raw = eni?.security_groups || [];
    return new Set(
      raw.map((sg) =>
        String(sg.provider_resource_id || sg.id || sg.uuid || sg)
      )
    );
  }, [eni]);

  const { mutate: attachSecurityGroup, isPending: isAttaching } =
    useAttachTenantSecurityGroup();
  const { mutate: detachSecurityGroup, isPending: isDetaching } =
    useDetachTenantSecurityGroup();

  if (!isOpen || !eni) return null;

  const eniId = eni.provider_resource_id || eni.id;

  const handleAttach = () => {
    if (!selectedAttach) {
      ToastUtils.error("Select a security group to attach.");
      return;
    }

    attachSecurityGroup(
      {
        network_interface_id: eniId,
        security_group_ids: [selectedAttach],
      },
      {
        onSuccess: () => {
          ToastUtils.success("Security group attached.");
          setSelectedAttach("");
        },
        onError: (err) => {
          console.error("Failed to attach security group:", err);
          ToastUtils.error(err?.message || "Failed to attach security group.");
        },
      }
    );
  };

  const handleDetach = (securityGroupId) => {
    detachSecurityGroup(
      {
        network_interface_id: eniId,
        security_group_ids: [securityGroupId],
      },
      {
        onSuccess: () => {
          ToastUtils.success("Security group detached.");
        },
        onError: (err) => {
          console.error("Failed to detach security group:", err);
          ToastUtils.error(err?.message || "Failed to detach security group.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[560px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Manage Security Groups
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600">
              ENI: {eni.provider_resource_id || eni.id}
            </p>
            <p className="text-xs text-gray-500">Region: {region || "N/A"}</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Attach Security Group
            </label>
            <div className="flex gap-2">
              <select
                value={selectedAttach}
                onChange={(e) => setSelectedAttach(e.target.value)}
                className="flex-1 rounded-[10px] border px-3 py-2 text-sm input-field"
              >
                <option value="">
                  {isFetching ? "Loading security groups..." : "Select group"}
                </option>
                {securityGroups
                  .filter((sg) => {
                    const id =
                      sg.provider_resource_id || sg.id || sg.uuid || sg.name;
                    return !attachedIds.has(String(id));
                  })
                  .map((sg) => {
                    const id =
                      sg.provider_resource_id || sg.id || sg.uuid || sg.name;
                    return (
                      <option key={id} value={id}>
                        {sg.name || id}
                      </option>
                    );
                  })}
              </select>
              <button
                onClick={handleAttach}
                disabled={isAttaching}
                className="px-4 py-2 rounded-full bg-[#288DD1] text-white text-sm hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Attach
                {isAttaching && (
                  <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Attached Security Groups
            </p>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {Array.isArray(eni.security_groups) && eni.security_groups.length > 0 ? (
                eni.security_groups.map((sg) => {
                  const id =
                    sg.provider_resource_id || sg.id || sg.uuid || sg.name;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700"
                    >
                      <span>{sg.name || id}</span>
                      <button
                        onClick={() => handleDetach(String(id))}
                        disabled={isDetaching}
                        className="text-red-500 hover:text-red-600 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">No security groups</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageEniSecurityGroupsModal;
