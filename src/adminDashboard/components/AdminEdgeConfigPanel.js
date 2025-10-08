import React from "react";
import { AlertTriangle } from "lucide-react";
import { useFetchProjectEdgeConfigAdmin } from "../../hooks/adminHooks/edgeHooks";

const Field = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-900 break-all">{value ?? "N/A"}</span>
  </div>
);

export default function AdminEdgeConfigPanel({ projectId, region }) {
  const { data: edgeConfig, isFetching, error } =
    useFetchProjectEdgeConfigAdmin(projectId, region, { enabled: !!projectId && !!region });

  return (
    <div className="bg-white rounded-[12px] p-6 shadow-sm mb-8">
      <h2 className="text-xl font-semibold text-[#575758] mb-4">
        Edge Configuration
      </h2>

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
              Use the "Configure Edge" button to assign one.
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
