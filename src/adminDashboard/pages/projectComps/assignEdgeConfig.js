import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { useFetchEdgeNetworks, useFetchIpPools, useAssignProjectEdge, useFetchProjectEdgeConfigAdmin } from "../../../hooks/adminHooks/edgeHooks";
import { useFetchGeneralRegions } from "../../../hooks/resource";

const AssignEdgeConfigModal = ({ isOpen, onClose, projectId, region }) => {
  const [selectedRegion, setSelectedRegion] = useState(region || "");
  const [formData, setFormData] = useState({
    edge_network_id: "",
    ip_pool_id: "",
    flowlogs_enabled: false,
  });

  const { data: regions, isFetching: isFetchingRegions } = useFetchGeneralRegions();

  const { data: currentConfig } = useFetchProjectEdgeConfigAdmin(projectId, selectedRegion, { enabled: isOpen && !!selectedRegion });
  const { data: edgeNetworks, isFetching: isFetchingNetworks } = useFetchEdgeNetworks(projectId, selectedRegion, { enabled: isOpen && !!selectedRegion });
  const { data: ipPools, isFetching: isFetchingPools } = useFetchIpPools(projectId, selectedRegion, formData.edge_network_id, { enabled: isOpen && !!selectedRegion && !!formData.edge_network_id });
  const { mutate: assignEdge, isPending } = useAssignProjectEdge();

  const updateForm = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const handleAssign = () => {
    const payload = {
      project_id: projectId,
      region: selectedRegion,
      edge_network_id: formData.edge_network_id,
      edge_ip_pool_id: formData.ip_pool_id,
      flowlogs_enabled: !!formData.flowlogs_enabled,
    };

    assignEdge(
      { payload },
      {
        onSuccess: () => onClose(),
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1100] flex items-center justify-center font-Outfit">
      <div className="bg-white rounded-[24px] max-w-[650px] mx-4 w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b bg-[#F2F2F2] rounded-t-[24px]">
          <h2 className="text-lg font-semibold text-[#575758]">Assign Edge Configuration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-[#1E1E1EB2]" disabled={isPending}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-6 w-full overflow-y-auto flex flex-col items-center max-h-[400px] justify-start">
          {currentConfig && (
            <div className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 mb-4">
              <div className="font-medium mb-2">Current Configuration</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>Edge Network ID: {currentConfig.edge_network_id || "-"}</div>
                <div>IP Pool ID: {currentConfig.ip_pool_id || "-"}</div>
                <div>Flow Logs: {currentConfig.flowlogs_enabled ? "Enabled" : "Disabled"}</div>
              </div>
            </div>
          )}

          <div className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Region<span className="text-red-500">*</span></label>
              <select
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${isFetchingRegions ? "opacity-60" : ""}`}
                disabled={isFetchingRegions}
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  // reset selections when region changes
                  setFormData({ edge_network_id: "", ip_pool_id: "", flowlogs_enabled: formData.flowlogs_enabled });
                }}
              >
                <option value="">{isFetchingRegions ? "Loading regions..." : "Select a region"}</option>
                {(regions || []).map((r) => (
                  <option key={r.region} value={r.region}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Edge Network<span className="text-red-500">*</span></label>
              <select
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${isFetchingNetworks ? "opacity-60" : ""}`}
                disabled={isFetchingNetworks || !selectedRegion}
                value={formData.edge_network_id}
                onChange={(e) => updateForm("edge_network_id", e.target.value)}
              >
                <option value="">{isFetchingNetworks ? "Loading networks..." : "Select an edge network"}</option>
                {(edgeNetworks || []).map((n) => (
                  <option key={n.id || n.uuid || n.identifier} value={n.id || n.uuid || n.identifier}>
                    {n.name || n.label || n.id}
                  </option>
                ))}
              </select>
              {!isFetchingNetworks && selectedRegion && (edgeNetworks || []).length === 0 && (
                <p className="text-xs text-yellow-700 mt-1">No edge networks found for this region. Ensure provider credentials are configured and networks exist.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IP Pool<span className="text-red-500">*</span></label>
              <select
                className={`w-full rounded-[10px] border px-3 py-2 text-sm input-field ${isFetchingPools ? "opacity-60" : ""}`}
                disabled={isFetchingPools || !formData.edge_network_id}
                value={formData.ip_pool_id}
                onChange={(e) => updateForm("ip_pool_id", e.target.value)}
              >
                <option value="">{isFetchingPools ? "Loading IP pools..." : "Select an IP pool"}</option>
                {(ipPools || []).map((p) => (
                  <option key={p.id || p.uuid || p.identifier} value={p.id || p.uuid || p.identifier}>
                    {p.name || p.label || p.id}
                  </option>
                ))}
              </select>
              {!isFetchingPools && formData.edge_network_id && (ipPools || []).length === 0 && (
                <p className="text-xs text-yellow-700 mt-1">No IP pools found for the selected edge network.</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                id="flowlogs_enabled"
                type="checkbox"
                checked={formData.flowlogs_enabled}
                onChange={(e) => updateForm("flowlogs_enabled", e.target.checked)}
              />
              <label htmlFor="flowlogs_enabled" className="text-sm text-gray-700">Enable flow logs</label>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end px-6 py-4 border-t rounded-b-[24px]">
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 text-[#676767] bg-[#FAFAFA] border border-[#ECEDF0] rounded-[30px] font-medium">Cancel</button>
            <button
              onClick={handleAssign}
              disabled={isPending || !selectedRegion || !formData.edge_network_id || !formData.ip_pool_id}
              className="px-8 py-3 bg-[#288DD1] text-white font-medium rounded-[30px] hover:bg-[#1976D2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Assign
              {isPending && <Loader2 className="w-4 h-4 ml-2 text-white animate-spin" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignEdgeConfigModal;
