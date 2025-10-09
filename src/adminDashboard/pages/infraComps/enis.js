import { useFetchNetworkInterfaces } from "../../../hooks/adminHooks/networkHooks";

const ENIs = ({ projectId = "", region = "" }) => {
  const { data: networkInterfaces, isFetching } = useFetchNetworkInterfaces(projectId, region);

  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Elastic Network Interfaces</h2>
          <p className="text-sm text-gray-500">Project: {projectId || "(select)"} {region && `• Region: ${region}`}</p>
        </div>
        {isFetching && <p className="text-sm text-gray-500">Loading ENIs...</p>}
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
