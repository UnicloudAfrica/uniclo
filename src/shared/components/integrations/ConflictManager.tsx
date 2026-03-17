/**
 * ConflictManager — Lists and resolves bidirectional replication conflicts.
 *
 * Shows file-level conflicts from AnyCloudFlow with status badges
 * and manual resolution action for detected conflicts.
 */
import React, { useState } from "react";
import { AlertTriangle, CheckCircle, FileText, ArrowRight } from "lucide-react";
import { ModernButton } from "../ui";
import { useConflicts, useResolveConflict } from "../../hooks/resources/integrationHooks";
import {
  ConflictStatus,
  CONFLICT_STATUS_LABELS,
} from "@/types/bidirectional";
import type { ReplicationConflict } from "@/types/bidirectional";

interface ConflictManagerProps {
  pairId: string;
  className?: string;
}

const statusColor: Record<string, string> = {
  [ConflictStatus.Detected]: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  [ConflictStatus.AutoResolved]: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  [ConflictStatus.ManuallyResolved]: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  [ConflictStatus.Skipped]: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const ConflictManager: React.FC<ConflictManagerProps> = ({ pairId, className = "" }) => {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: conflicts = [], isLoading } = useConflicts(pairId, statusFilter ? { status: statusFilter } : undefined);
  const resolveConflict = useResolveConflict();
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const handleResolve = (conflictId: string, winningSide: "a" | "b") => {
    setResolvingId(conflictId);
    resolveConflict.mutate(
      { pairId, conflictId, payload: { winning_side: winningSide } },
      { onSettled: () => setResolvingId(null) },
    );
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-orange-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Replication Conflicts
          </h3>
          {conflicts.length > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {conflicts.filter((c: ReplicationConflict) => c.status === ConflictStatus.Detected).length} unresolved
            </span>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          <option value="">All statuses</option>
          {Object.values(ConflictStatus).map((s) => (
            <option key={s} value={s}>{CONFLICT_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500">Loading conflicts...</div>
        ) : conflicts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-8">
            <CheckCircle size={24} className="text-green-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No conflicts found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["File", "Status", "Detected", "Actions"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conflicts.map((conflict: ReplicationConflict) => (
                <tr key={conflict.id} className="border-b border-gray-50 dark:border-gray-800/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="shrink-0 text-gray-400" />
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-gray-100" title={conflict.file_path}>
                        {conflict.file_path}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[conflict.status] ?? ""}`}>
                      {CONFLICT_STATUS_LABELS[conflict.status] ?? conflict.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400">
                    {conflict.detected_at ? new Date(conflict.detected_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {conflict.status === ConflictStatus.Detected ? (
                      <div className="flex items-center gap-1">
                        <ModernButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(conflict.id, "a")}
                          disabled={resolvingId === conflict.id}
                        >
                          Keep A <ArrowRight size={12} />
                        </ModernButton>
                        <ModernButton
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(conflict.id, "b")}
                          disabled={resolvingId === conflict.id}
                        >
                          Keep B <ArrowRight size={12} />
                        </ModernButton>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        {conflict.winning_side ? `Side ${conflict.winning_side.toUpperCase()} won` : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ConflictManager;
