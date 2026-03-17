/**
 * TrafficControlPanel — Shows per-node traffic pool status and driver config.
 *
 * Displays traffic status for both nodes and allows configuring the
 * traffic control driver (webhook, DNS, or Cloudflare).
 */
import React, { useState } from "react";
import { Globe, Settings, ArrowUpDown } from "lucide-react";
import { ModernButton } from "../ui";
import { useTrafficStatus, useConfigureTrafficControl } from "../../hooks/resources/integrationHooks";
import {
  TrafficPoolStatus,
  TRAFFIC_POOL_LABELS,
} from "@/types/bidirectional";

interface TrafficControlPanelProps {
  pairId: string;
  className?: string;
}

const poolStatusStyles: Record<string, string> = {
  [TrafficPoolStatus.InRotation]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  [TrafficPoolStatus.Draining]: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  [TrafficPoolStatus.Removed]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  [TrafficPoolStatus.Standby]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const TrafficControlPanel: React.FC<TrafficControlPanelProps> = ({ pairId, className = "" }) => {
  const { data: traffic, isLoading } = useTrafficStatus(pairId);
  const configureTraffic = useConfigureTrafficControl();
  const [showConfig, setShowConfig] = useState(false);
  const [driver, setDriver] = useState<"webhook" | "dns" | "cloudflare">("webhook");
  const [configEndpoint, setConfigEndpoint] = useState("");

  const handleSubmit = () => {
    const config: Record<string, string> = {};
    if (driver === "webhook") {
      config.endpoint = configEndpoint;
    } else if (driver === "cloudflare") {
      config.zone_id = configEndpoint;
    } else {
      config.dns_zone = configEndpoint;
    }

    configureTraffic.mutate(
      { pairId, payload: { driver, config } },
      { onSuccess: () => setShowConfig(false) },
    );
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Traffic Control</h3>
        </div>
        {traffic?.driver && (
          <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {traffic.driver}
          </span>
        )}
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading traffic status...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {(["node_a", "node_b"] as const).map((node) => {
                const status = traffic?.[node] ?? TrafficPoolStatus.Standby;
                const label = node === "node_a" ? "Node A" : "Node B";
                return (
                  <div key={node} className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${poolStatusStyles[status] ?? poolStatusStyles[TrafficPoolStatus.Standby]}`}>
                        {TRAFFIC_POOL_LABELS[status as TrafficPoolStatus] ?? status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {!showConfig ? (
              <ModernButton variant="outline" size="sm" onClick={() => setShowConfig(true)}>
                <Settings size={14} /> Configure Driver
              </ModernButton>
            ) : (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Driver</label>
                  <select
                    value={driver}
                    onChange={(e) => setDriver(e.target.value as "webhook" | "dns" | "cloudflare")}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="webhook">Webhook</option>
                    <option value="dns">DNS</option>
                    <option value="cloudflare">Cloudflare</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                    {driver === "webhook" ? "Webhook Endpoint" : driver === "cloudflare" ? "Zone ID" : "DNS Zone"}
                  </label>
                  <input
                    type="text"
                    value={configEndpoint}
                    onChange={(e) => setConfigEndpoint(e.target.value)}
                    placeholder={driver === "webhook" ? "https://..." : ""}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-2">
                  <ModernButton variant="primary" size="sm" onClick={handleSubmit} disabled={configureTraffic.isPending}>
                    {configureTraffic.isPending ? "Saving..." : "Save"}
                  </ModernButton>
                  <ModernButton variant="outline" size="sm" onClick={() => setShowConfig(false)}>
                    Cancel
                  </ModernButton>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TrafficControlPanel;
