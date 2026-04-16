/**
 * AuditLogPanel — Filterable, paginated audit log for a replication pair.
 *
 * Provides action dropdown, file path search, direction filter,
 * and paginated table of audit entries.
 */
import React, { useState } from "react";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { ModernButton } from "../ui";
import { useAuditLog } from "../../hooks/resources/integrationHooks";

interface AuditLogPanelProps {
  pairId: string;
  className?: string;
}

const actionBadgeStyles: Record<string, string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  modified: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  deleted: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function truncatePath(path: string, max = 40): string {
  if (path.length <= max) return path;
  return "..." + path.slice(path.length - max + 3);
}

const AuditLogPanel: React.FC<AuditLogPanelProps> = ({ pairId, className = "" }) => {
  const [action, setAction] = useState<string>("");
  const [filePath, setFilePath] = useState("");
  const [direction, setDirection] = useState<string>("");
  const [page, setPage] = useState(1);

  const { data: audit, isLoading } = useAuditLog(pairId, {
    action: action || undefined,
    file_path: filePath || undefined,
    direction: direction || undefined,
    page,
    per_page: 15,
  });

  const entries = (audit?.data as Array<Record<string, unknown>>) ?? [];
  const currentPage = Number(audit?.current_page ?? 1);
  const lastPage = Number(audit?.last_page ?? 1);

  const selectClasses =
    "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Audit Log</h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className={selectClasses}
          >
            <option value="">All Actions</option>
            <option value="created">Created</option>
            <option value="modified">Modified</option>
            <option value="deleted">Deleted</option>
          </select>
          <input
            type="text"
            value={filePath}
            onChange={(e) => { setFilePath(e.target.value); setPage(1); }}
            placeholder="Search file path..."
            className="w-48 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <select
            value={direction}
            onChange={(e) => { setDirection(e.target.value); setPage(1); }}
            className={selectClasses}
          >
            <option value="">All Directions</option>
            <option value="push">Push</option>
            <option value="pull">Pull</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-gray-500">Loading audit log...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-gray-500">No audit entries found</p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Recorded At</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">File Path</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Action</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Size</th>
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, idx) => {
                    const act = String(entry.action ?? "");
                    const badgeStyle = actionBadgeStyles[act] ?? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
                    return (
                      <tr key={idx} className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {String(entry.recorded_at ?? "")}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-400" title={String(entry.file_path ?? "")}>
                          {truncatePath(String(entry.file_path ?? ""))}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyle}`}>
                            {act}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {entry.size_bytes != null ? `${Number(entry.size_bytes).toLocaleString()} B` : "-"}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                          {String(entry.direction ?? "")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Page {currentPage} of {lastPage}
              </p>
              <div className="flex gap-2">
                <ModernButton variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={14} /> Prev
                </ModernButton>
                <ModernButton variant="outline" size="sm" disabled={currentPage >= lastPage} onClick={() => setPage((p) => p + 1)}>
                  Next <ChevronRight size={14} />
                </ModernButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuditLogPanel;
