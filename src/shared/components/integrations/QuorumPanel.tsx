/**
 * QuorumPanel — Displays quorum state, witness config, and lease status.
 *
 * Color-coded state badge (green/yellow/red/gray) and witness
 * configuration form for bidirectional replication pairs.
 */
import React, { useState } from "react";
import { Shield, Wifi, WifiOff, Settings } from "lucide-react";
import { ModernButton } from "../ui";
import { useQuorumStatus, useConfigureWitness } from "../../hooks/resources/integrationHooks";
import {
  QuorumState,
  QUORUM_STATE_LABELS,
  QUORUM_STATE_COLORS,
} from "@/types/bidirectional";

interface QuorumPanelProps {
  pairId: string;
  witnessConfigured: boolean;
  className?: string;
}

const stateStyles: Record<string, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const QuorumPanel: React.FC<QuorumPanelProps> = ({ pairId, witnessConfigured, className = "" }) => {
  const { data: quorum, isLoading } = useQuorumStatus(pairId);
  const configureWitness = useConfigureWitness();
  const [showConfig, setShowConfig] = useState(false);
  const [witnessHost, setWitnessHost] = useState("");
  const [witnessPort, setWitnessPort] = useState(7946);
  const [leaseTtl, setLeaseTtl] = useState(30);

  const state = quorum?.state ?? quorum?.local_quorum_state ?? QuorumState.Healthy;
  const color = QUORUM_STATE_COLORS[state as QuorumState] ?? "gray";

  const handleSubmitWitness = () => {
    if (!witnessHost.trim()) return;
    configureWitness.mutate(
      { pairId, payload: { witness_host: witnessHost, witness_port: witnessPort, lease_ttl_seconds: leaseTtl } },
      { onSuccess: () => setShowConfig(false) },
    );
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Quorum & Witness</h3>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stateStyles[color]}`}>
          {QUORUM_STATE_LABELS[state as QuorumState] ?? state}
        </span>
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading quorum status...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  {quorum?.node_a_lease_active ? (
                    <Wifi size={14} className="text-green-500" />
                  ) : (
                    <WifiOff size={14} className="text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Node A</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Lease: {quorum?.node_a_lease_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  {quorum?.node_b_lease_active ? (
                    <Wifi size={14} className="text-green-500" />
                  ) : (
                    <WifiOff size={14} className="text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Node B</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Lease: {quorum?.node_b_lease_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            {quorum?.witness_host && (
              <div className="rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Witness: <span className="font-medium">{quorum.witness_host}</span>
                  {quorum.lease_ttl_seconds && ` (TTL: ${quorum.lease_ttl_seconds}s)`}
                </p>
              </div>
            )}

            {!witnessConfigured && !showConfig && (
              <ModernButton
                variant="outline"
                size="sm"
                onClick={() => setShowConfig(true)}
              >
                <Settings size={14} /> Configure Witness
              </ModernButton>
            )}

            {showConfig && (
              <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Witness Host</label>
                  <input
                    type="text"
                    value={witnessHost}
                    onChange={(e) => setWitnessHost(e.target.value)}
                    placeholder="witness.example.com"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Port</label>
                    <input
                      type="number"
                      value={witnessPort}
                      onChange={(e) => setWitnessPort(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Lease TTL (s)</label>
                    <input
                      type="number"
                      value={leaseTtl}
                      onChange={(e) => setLeaseTtl(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <ModernButton variant="primary" size="sm" onClick={handleSubmitWitness} disabled={configureWitness.isPending}>
                    {configureWitness.isPending ? "Saving..." : "Save"}
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

export default QuorumPanel;
