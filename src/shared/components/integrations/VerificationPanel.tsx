/**
 * VerificationPanel — Displays sync integrity verification history.
 *
 * "Verify Now" button triggers an on-demand integrity check.
 * Table shows recent verifications with status, score, and mismatch count.
 */
import React from "react";
import { CheckCircle } from "lucide-react";
import { ModernButton } from "../ui";
import { useVerificationHistory, useVerifySyncIntegrity } from "../../hooks/resources/integrationHooks";

interface VerificationPanelProps {
  pairId: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  passed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  partial: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const VerificationPanel: React.FC<VerificationPanelProps> = ({ pairId, className = "" }) => {
  const { data: verifications, isLoading } = useVerificationHistory(pairId);
  const verifyMutation = useVerifySyncIntegrity();

  const items = (verifications as Array<Record<string, unknown>>) ?? [];

  const handleVerify = () => {
    verifyMutation.mutate({ pairId });
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Integrity Verification</h3>
        </div>
        <ModernButton variant="primary" size="sm" onClick={handleVerify} disabled={verifyMutation.isPending}>
          {verifyMutation.isPending ? "Verifying..." : "Verify Now"}
        </ModernButton>
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading verifications...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">No verifications have been run yet</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Started At</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Score</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Verified</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Mismatched</th>
                  <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Duration</th>
                </tr>
              </thead>
              <tbody>
                {items.map((v, idx) => {
                  const status = String(v.status ?? "");
                  const badge = statusStyles[status] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
                  return (
                    <tr key={idx} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {String(v.started_at ?? "")}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge}`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {v.overall_score != null ? `${Number(v.overall_score).toFixed(1)}%` : "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {Number(v.files_verified ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {Number(v.files_mismatched ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {v.duration_seconds != null ? `${Number(v.duration_seconds)}s` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationPanel;
