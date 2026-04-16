/**
 * SyncPreviewPanel — Shows a dry-run preview of what a sync would transfer.
 *
 * Displays detection method, file count, total bytes, estimated duration,
 * and a list of the first 10 file paths from the preview result.
 */
import React from "react";
import { Eye } from "lucide-react";
import { useSyncPreview } from "../../hooks/resources/integrationHooks";

interface SyncPreviewPanelProps {
  pairId: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

const SyncPreviewPanel: React.FC<SyncPreviewPanelProps> = ({ pairId, className = "" }) => {
  const { data: preview, isLoading } = useSyncPreview(pairId);

  const files = (preview?.files as Array<{ path?: string }>) ?? [];
  const hasData = preview && (preview.files_count !== undefined || files.length > 0);

  return (
    <div className={`rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Eye size={18} className="text-blue-500" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Sync Preview</h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading sync preview...</p>
        ) : !hasData ? (
          <p className="text-sm text-gray-500">Run a preview to see what would sync</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              {preview?.detection_method && (
                <div className="col-span-2">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {String(preview.detection_method)}
                  </span>
                </div>
              )}
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Files</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {Number(preview?.files_count ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Total Size</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatBytes(Number(preview?.total_bytes ?? 0))}
                </p>
              </div>
              <div className="col-span-2 rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Duration</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatDuration(Number(preview?.estimated_duration_seconds ?? 0))}
                </p>
              </div>
            </div>

            {files.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Files {files.length > 10 ? "(first 10)" : ""}
                </p>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                  {files.slice(0, 10).map((file, idx) => (
                    <div
                      key={idx}
                      className="border-b border-gray-100 px-3 py-1.5 last:border-b-0 dark:border-gray-800"
                    >
                      <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                        {String(file?.path ?? file)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SyncPreviewPanel;
