import { X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil";
import { useDisassociateTenantElasticIp } from "../../../hooks/elasticIPHooks";

const DisassociateEipModal = ({
  isOpen,
  onClose,
  projectId,
  region,
  elasticIp,
}) => {
  const { mutate: disassociateEip, isPending } =
    useDisassociateTenantElasticIp();

  if (!isOpen || !elasticIp) return null;

  const allocationId =
    elasticIp.provider_resource_id || elasticIp.public_ip || elasticIp.id;

  const handleConfirm = () => {
    if (!allocationId) {
      ToastUtils.error("Missing Elastic IP identifier.");
      return;
    }

    disassociateEip(
      {
        project_id: projectId,
        region,
        allocation_id: allocationId,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Elastic IP disassociated.");
          onClose();
        },
        onError: (err) => {
          console.error("Failed to disassociate Elastic IP:", err);
          ToastUtils.error(err?.message || "Failed to disassociate Elastic IP.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[520px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">
            Disassociate Elastic IP
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-3 text-sm text-gray-700">
          <p>
            Are you sure you want to disassociate
            {" "}
            <span className="font-semibold text-gray-900">{allocationId}</span>
            ?
          </p>
          <p>This will release the Elastic IP from its current resource.</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-[24px]">
          <button
            onClick={onClose}
            className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium hover:text-gray-800 transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="px-8 py-3 bg-red-500 text-white font-medium rounded-[30px] hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Removing..." : "Disassociate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DisassociateEipModal;
