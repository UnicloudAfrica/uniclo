import { useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import ToastUtils from "../../../utils/toastUtil.ts";
import { useAssociateTenantRouteTable } from "../../../hooks/routeTable";
import { useFetchTenantSubnets } from "../../../hooks/subnetHooks";

const AssociateRouteTableModal = ({ isOpen, onClose, projectId, region = "", routeTable }) => {
  const [selectedSubnet, setSelectedSubnet] = useState("");
  const { mutate: associateRouteTable, isPending } = useAssociateTenantRouteTable();
  const { data: subnetRaw, isFetching } = useFetchTenantSubnets(projectId, region, {
    enabled: isOpen && !!projectId && !!region,
  });
  const subnets = useMemo(() => subnetRaw || [], [subnetRaw]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSubnet("");
    }
  }, [isOpen]);

  if (!isOpen || !routeTable) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!selectedSubnet) {
      ToastUtils.error("Select a subnet to associate.");
      return;
    }

    associateRouteTable(
      {
        project_id: projectId,
        region,
        route_table_id: routeTable.provider_resource_id || routeTable.id || routeTable.uuid,
        subnet_id: selectedSubnet,
      },
      {
        onSuccess: () => {
          ToastUtils.success("Route table associated.");
          onClose();
        },
        onError: (err) => {
          console.error("Failed to associate route table:", err);
          ToastUtils.error(err?.message || "Failed to associate route table.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[520px] w-full mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Associate Route Table</h2>
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
              Route Table:{" "}
              <span className="font-medium text-gray-900">
                {routeTable.name || routeTable.provider_resource_id || routeTable.id}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">Region: {region || "N/A"}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Subnet<span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSubnet}
              onChange={(e) => setSelectedSubnet(e.target.value)}
              className="w-full rounded-[10px] border px-3 py-2 text-sm input-field"
            >
              <option value="">{isFetching ? "Loading subnets..." : "Select subnet"}</option>
              {subnets.map((subnet) => {
                const value = subnet.provider_resource_id || subnet.id || subnet.uuid || "";
                return (
                  <option key={value} value={value}>
                    {subnet.name || value} ({subnet.cidr_block || subnet.cidr})
                  </option>
                );
              })}
            </select>
          </div>
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
            disabled={isPending || !selectedSubnet}
            className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Associate
            {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssociateRouteTableModal;
