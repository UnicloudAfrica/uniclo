import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";
import adminSilentApiforUser from "../../../index/admin/silentadminforuser";
import { useQueryClient } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";

const ENIs = ({ projectId = "", region = "" }) => {
  const { data: networkInterfaces, isFetching } = useFetchNetworkInterfaces(projectId, region);
  const queryClient = useQueryClient();

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Elastic Network Interfaces</h2>
          <p className="text-sm text-gray-500">Project: {projectId || "(select)"} {region && `• Region: ${region}`}</p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <p className="text-sm text-gray-500">Loading ENIs...</p>}
          <button
            onClick={async () => {
              try {
                if (!projectId || !region) return;
                const params = new URLSearchParams();
                params.append("project_id", projectId);
                params.append("region", region);
                params.append("refresh", "1");
                await adminSilentApiforUser("GET", `/business/network-interfaces?${params.toString()}`);
              } finally {
                queryClient.invalidateQueries({ queryKey: ["networkInterfaces"] });
              }
            }}
            className="flex items-center gap-2 rounded-[30px] py-1.5 px-3 bg-white border text-gray-700 text-xs hover:bg-gray-50"
            title="Refresh from provider"
          >
            <RotateCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {(networkInterfaces || []).map((eni) => (
          <div key={eni.id || eni.network_interface?.id}
               className="border rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{eni.id || eni.network_interface?.id}</h3>
                <p className="text-xs text-gray-500">State: {eni.state || eni.status || eni.network_interface?.state}</p>
              </div>
              <div className="text-xs text-gray-600">
                {(eni.attachment?.instance_id || eni.network_interface?.attachment?.instance_id) && (
                  <span>Instance: {eni.attachment?.instance_id || eni.network_interface?.attachment?.instance_id}</span>
                )}
              </div>
            </div>

            {/* Private IPs */}
            <div className="mt-3">
              <h4 className="text-sm font-semibold">Private IPs</h4>
              <ul className="text-sm list-disc ml-5">
                {((eni.private_ip_addresses || eni.network_interface?.private_ip_addresses) || []).length === 0 && (
                  <li className="text-gray-500">None</li>
                )}
                {((eni.private_ip_addresses || eni.network_interface?.private_ip_addresses) || []).map((p, i) => (
                  <li key={i}>{typeof p === 'string' ? p : (p.private_ip_address || p.address || JSON.stringify(p))}</li>
                ))}
              </ul>
            </div>

            {/* Security Groups */}
            <div className="mt-3">
              <h4 className="text-sm font-semibold">Security Groups</h4>
              <ul className="text-sm list-disc ml-5">
                {((eni.security_groups || eni.network_interface?.security_groups) || []).length === 0 && (
                  <li className="text-gray-500">None</li>
                )}
                {((eni.security_groups || eni.network_interface?.security_groups) || []).map((sg, i) => (
                  <li key={i}>{typeof sg === 'string' ? sg : (sg.id || sg.name || JSON.stringify(sg))}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {!isFetching && (!networkInterfaces || networkInterfaces.length === 0) && (
          <p className="text-sm text-gray-500">No Network Interfaces found for this project.</p>
        )}
      </div>
    </div>
  );
};

export default ENIs;
