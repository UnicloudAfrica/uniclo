/**
 * MigrationProgressStep — Step 7 (success step): Live progress tracking.
 *
 * Auto-polls the migration progress endpoint when status is in_progress.
 */
import React from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Clock,
} from "lucide-react";
import { usePollMigrationProgress } from "@/shared/hooks/resources";
import { ModernButton } from "../ui";

interface MigrationProgressStepProps {
  migrationId: string | undefined;
  migrationIdentifier?: string;
  onDone?: () => void;
}

const MigrationProgressStep: React.FC<MigrationProgressStepProps> = ({
  migrationId,
  migrationIdentifier,
  onDone,
}) => {
  const { data: progress } = usePollMigrationProgress(migrationId);

  const status = progress?.status ?? "pending";
  const percent = progress?.progress_percent ?? 0;

  const isComplete = status === "completed";
  const isFailed = status === "failed";
  const isActive =
    status === "in_progress" ||
    status === "confirmed" ||
    status === "pending";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Status Icon */}
      <div className="flex flex-col items-center text-center">
        {isComplete && (
          <CheckCircle2 size={48} className="mb-3 text-emerald-500" />
        )}
        {isFailed && <XCircle size={48} className="mb-3 text-red-500" />}
        {isActive && (
          <Loader2
            size={48}
            className="mb-3 animate-spin text-blue-500"
          />
        )}

        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {isComplete && "Migration Complete!"}
          {isFailed && "Migration Failed"}
          {isActive && "Migration In Progress..."}
        </h3>

        {migrationIdentifier && (
          <p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">
            {migrationIdentifier}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {percent}%
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {progress && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          {progress.estimated_data_gb != null && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estimated Data
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                {Number(progress.estimated_data_gb).toFixed(1)} GB
              </p>
            </div>
          )}
          {progress.actual_data_gb != null && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Transferred
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                {Number(progress.actual_data_gb).toFixed(1)} GB
              </p>
            </div>
          )}
          {progress.estimated_cost_usd != null && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estimated Cost
              </p>
              <p className="mt-0.5 text-sm font-medium text-gray-900 dark:text-gray-100">
                ${Number(progress.estimated_cost_usd).toFixed(2)}
              </p>
            </div>
          )}
          {progress.actual_cost_usd != null && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Actual Cost
              </p>
              <p className="mt-0.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ${Number(progress.actual_cost_usd).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {isFailed && progress?.error_message && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            {progress.error_message}
          </p>
        </div>
      )}

      {/* Done Button */}
      {(isComplete || isFailed) && onDone && (
        <div className="flex justify-center">
          <ModernButton variant="primary" onClick={onDone}>
            <ArrowRight size={16} className="mr-2" />
            Back to Migrations
          </ModernButton>
        </div>
      )}
    </div>
  );
};

export default MigrationProgressStep;
