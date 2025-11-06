import React, { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useFetchGeneralRegions } from "../../hooks/resource";
import { useFetchProjectEdgeConfigTenant } from "../../hooks/edgeHooks";
import {
  useAssignTenantProjectEdge,
  useFetchTenantEdgeNetworks,
  useFetchTenantIpPools,
} from "../../hooks/tenantHooks/edgeHooks";

const ClientAssignEdgeConfigModal = ({
  isOpen,
  onClose,
  onAssigned,
  projectId,
  region,
}) => {
  const [selectedRegion, setSelectedRegion] = useState(region || "");
  const [formData, setFormData] = useState({
    edge_network_id: "",
    ip_pool_id: "",
    flowlogs_enabled: false,
  });
  const [manualMode, setManualMode] = useState(false);

  const { data: regions, isFetching: isFetchingRegions } = useFetchGeneralRegions();

  const {
    data: currentConfig,
    isFetching: isFetchingConfig,
  } = useFetchProjectEdgeConfigTenant(projectId, selectedRegion, {
    enabled: isOpen && !!selectedRegion,
  });

  const {
    data: edgeNetworks,
    isFetching: isFetchingNetworks,
    error: networksError,
    refetch: refetchNetworks,
  } = useFetchTenantEdgeNetworks(projectId, selectedRegion, {
    enabled: isOpen && !!selectedRegion,
  });

  const {
    data: ipPools,
    isFetching: isFetchingPools,
    error: poolsError,
    refetch: refetchPools,
  } = useFetchTenantIpPools(
    projectId,
    selectedRegion,
    formData.edge_network_id,
    {
      enabled: isOpen && !!selectedRegion && !!formData.edge_network_id,
    }
  );

  const { mutate: assignEdge, isPending } = useAssignTenantProjectEdge();

  useEffect(() => {
    if (!isOpen) return;
    if (region && selectedRegion === "") {
      setSelectedRegion(region);
    }
  }, [region, selectedRegion, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!currentConfig) return;
    setFormData((prev) => ({
      ...prev,
      edge_network_id: currentConfig.edge_network_id || "",
      ip_pool_id:
        currentConfig.edge_network_ip_pool_id ||
        currentConfig.ip_pool_id ||
        "",
      flowlogs_enabled: Boolean(currentConfig.flowlogs_enabled),
    }));
  }, [currentConfig, isOpen]);

  const updateForm = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleRefreshFromProvider = async () => {
    try {
      await refetchNetworks();
      if (formData.edge_network_id) {
        await refetchPools();
      }
    } catch (err) {
      console.warn("Failed to refresh edge data from provider", err);
    }
  };

  const handleAssign = () => {
    if (
      !projectId ||
      !selectedRegion ||
      !formData.edge_network_id ||
      !formData.ip_pool_id
    ) {
      return;
    }

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
        onSuccess: () => {
          if (typeof onAssigned === "function") {
            onAssigned();
          } else {
            onClose();
          }
        },
      }
    );
  };

  const handleAutoAssign = () => {
    if (!projectId || !selectedRegion) return;

    const payload = {
      project_id: projectId,
      region: selectedRegion,
      auto_assign: true,
    };

    assignEdge(
      { payload },
      {
        onSuccess: () => {
          if (typeof onAssigned === "function") {
            onAssigned();
          } else {
            onClose();
          }
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 font-Outfit">
      <div className="mx-4 w-full max-w-[650px] rounded-[24px] bg-white">
        <div className="flex items-center justify-between rounded-t-[24px] bg-[#F2F2F2] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#575758]">
            Assign Edge Configuration
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-[#1E1E1EB2]"
            disabled={isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex max-h-[400px] w-full flex-col items-center overflow-y-auto px-6 py-6">
          {isFetchingConfig ? (
            <div className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              Loading current configuration...
            </div>
          ) : currentConfig ? (
            <div className="mb-4 w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
              <div className="mb-2 font-medium">Current Configuration</div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>Edge Network ID: {currentConfig.edge_network_id || "-"}</div>
                <div>
                  IP Pool ID:{" "}
                  {currentConfig.edge_network_ip_pool_id ||
                    currentConfig.ip_pool_id ||
                    "-"}
                </div>
                <div>
                  Flow Logs: {currentConfig.flowlogs_enabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </div>
          ) : null}

          <div className="w-full space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Region<span className="text-red-500">*</span>
              </label>
              <select
                className={`input-field w-full rounded-[10px] border px-3 py-2 text-sm ${
                  isFetchingRegions ? "opacity-60" : ""
                }`}
                disabled={isFetchingRegions}
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setFormData({
                    edge_network_id: "",
                    ip_pool_id: "",
                    flowlogs_enabled: formData.flowlogs_enabled,
                  });
                }}
              >
                <option value="">
                  {isFetchingRegions ? "Loading regions..." : "Select a region"}
                </option>
                {(regions || []).map((r) => (
                  <option key={r.region} value={r.region}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Edge Network<span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  {!isFetchingNetworks &&
                    selectedRegion &&
                    (edgeNetworks || []).length === 0 && (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => setManualMode((value) => !value)}
                      >
                        {manualMode ? "Use list" : "Enter IDs manually"}
                      </button>
                    )}
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                    onClick={handleRefreshFromProvider}
                    disabled={
                      isFetchingNetworks || isFetchingPools || !selectedRegion
                    }
                    title="Refresh from provider"
                  >
                    {isFetchingNetworks || isFetchingPools
                      ? "Refreshing..."
                      : "Refresh from provider"}
                  </button>
                </div>
              </div>

              {!manualMode ? (
                <>
                  <select
                    className={`input-field w-full rounded-[10px] border px-3 py-2 text-sm ${
                      isFetchingNetworks ? "opacity-60" : ""
                    }`}
                    disabled={isFetchingNetworks || !selectedRegion}
                    value={formData.edge_network_id}
                    onChange={(e) =>
                      updateForm("edge_network_id", e.target.value)
                    }
                  >
                    <option value="">
                      {isFetchingNetworks
                        ? "Loading networks..."
                        : "Select an edge network"}
                    </option>
                    {(edgeNetworks || []).map((network) => (
                      <option
                        key={
                          network.id || network.uuid || network.identifier || network.value
                        }
                        value={
                          network.id || network.uuid || network.identifier || network.value
                        }
                      >
                        {network.name || network.label || network.id || network.value}
                      </option>
                    ))}
                  </select>
                  {networksError && (
                    <p className="mt-1 text-xs text-red-600">
                      {networksError.message ||
                        "Failed to load edge networks."}
                    </p>
                  )}
                  {!isFetchingNetworks &&
                    selectedRegion &&
                    (edgeNetworks || []).length === 0 &&
                    !networksError && (
                      <p className="mt-1 text-xs text-yellow-700">
                        No edge networks found for this region. Ensure networks exist before assigning.
                      </p>
                    )}
                </>
              ) : (
                <input
                  className="input-field w-full rounded-[10px] border px-3 py-2 text-sm"
                  placeholder="Enter edge network ID"
                  value={formData.edge_network_id}
                  onChange={(e) => updateForm("edge_network_id", e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                IP Pool<span className="text-red-500">*</span>
              </label>
              {manualMode ? (
                <input
                  className="input-field w-full rounded-[10px] border px-3 py-2 text-sm"
                  placeholder="Enter IP pool ID"
                  value={formData.ip_pool_id}
                  onChange={(e) => updateForm("ip_pool_id", e.target.value)}
                />
              ) : (
                <select
                  className={`input-field w-full rounded-[10px] border px-3 py-2 text-sm ${
                    isFetchingPools ? "opacity-60" : ""
                  }`}
                  disabled={isFetchingPools || !formData.edge_network_id}
                  value={formData.ip_pool_id}
                  onChange={(e) => updateForm("ip_pool_id", e.target.value)}
                >
                  <option value="">
                    {isFetchingPools ? "Loading IP pools..." : "Select an IP pool"}
                  </option>
                  {(ipPools || []).map((pool) => (
                    <option
                      key={
                        pool.id ||
                        pool.edge_network_ip_pool_id ||
                        pool.identifier ||
                        pool.value
                      }
                      value={
                        pool.id ||
                        pool.edge_network_ip_pool_id ||
                        pool.identifier ||
                        pool.value
                      }
                    >
                      {pool.name || pool.label || pool.id || pool.value}
                    </option>
                  ))}
                </select>
              )}
              {poolsError && (
                <p className="mt-1 text-xs text-red-600">
                  {poolsError.message || "Failed to load IP pools."}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-[10px] border border-gray-200 bg-gray-50 px-3 py-2">
              <input
                id="flowlogs"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-[--theme-color] focus:ring-[--theme-color]"
                checked={formData.flowlogs_enabled}
                onChange={(e) =>
                  updateForm("flowlogs_enabled", e.target.checked)
                }
              />
              <label htmlFor="flowlogs" className="text-sm text-gray-700">
                Enable flow logs
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={handleAutoAssign}
                disabled={!selectedRegion || isPending}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Auto-assign for me
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isPending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={
                    isPending ||
                    !selectedRegion ||
                    !formData.edge_network_id ||
                    !formData.ip_pool_id
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[--theme-color] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[--secondary-color] disabled:opacity-60"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Assign edge configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientAssignEdgeConfigModal;
