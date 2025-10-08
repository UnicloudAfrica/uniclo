import React from "react";
import { AlertTriangle } from "lucide-react";
import { useFetchProjectEdgeConfigTenant } from "../../hooks/edgeHooks";
import ToastUtils from "../../utils/toastUtil";

const Field = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-900 break-all">{value ?? "N/A"}</span>
  </div>
);

export default function EdgeConfigPanel({ projectId, region }) {
  const { data: edgeConfig, isFetching, error, refetch } =
    useFetchProjectEdgeConfigTenant(projectId, region, { enabled: !!projectId && !!region });

  return (
    <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[#575758]">Edge Configuration</h2>
        <button
          onClick={async () => {
            const r = await refetch();
            if (r?.error) {
              ToastUtils.error(r.error.message || "Failed to refresh edge configuration");
            } else {
              ToastUtils.success("Edge configuration refreshed");
            }
          }}
          disabled={isFetching || !projectId || !region}
          className="text-sm text-[#288DD1] hover:text-[#1976D2] disabled:opacity-50"
          title="Refresh edge configuration"
        >
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isFetching ? (
        <p className="text-sm text-gray-600">Loading edge configuration...</p>
      ) : error ? (
        <div className="text-sm text-red-600">
          Failed to load edge configuration.
        </div>
      ) : !edgeConfig || (!edgeConfig.edge_network_id && !edgeConfig.ip_pool_id) ? (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">No edge configuration assigned</p>
            <p>
              This project does not have an edge network and IP pool assigned yet.
              You may be unable to create subnets until this is configured.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Edge Network ID" value={edgeConfig.edge_network_id} />
          <Field label="IP Pool ID" value={edgeConfig.ip_pool_id} />
          <Field label="Flow Logs Enabled" value={edgeConfig.flowlogs_enabled ? "Yes" : "No"} />
          {edgeConfig.metadata && (
            <div className="md:col-span-2">
              <span className="font-medium text-gray-600">Metadata</span>
              <pre className="mt-1 text-gray-900 text-xs bg-gray-50 rounded p-3 overflow-auto">
                {JSON.stringify(edgeConfig.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
