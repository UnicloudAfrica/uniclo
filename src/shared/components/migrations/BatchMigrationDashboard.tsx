/**
 * BatchMigrationDashboard -- Top-level page for batch migration management.
 *
 * Shows stats cards, tab navigation, and a "New Batch Migration" CTA.
 * Fully responsive with dark mode support.
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Activity,
  CheckCircle2,
  XCircle,
  Plus,
} from "lucide-react";
import { ModernStatsCard } from "../ui";
import BatchMigrationsList from "./BatchMigrationsList";
import { useBatchMigrations } from "@/shared/hooks/resources";

type AnyRecord = Record<string, unknown>;

interface BatchMigrationDashboardProps {
  context: "admin" | "tenant" | "client";
  wizardPath: string;
}

type TabId = "batch-migrations";

const BatchMigrationDashboard: React.FC<BatchMigrationDashboardProps> = ({
  context,
  wizardPath,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("batch-migrations");

  const { data: raw } = useBatchMigrations();

  const batches = useMemo(() => {
    if (!raw) return [];
    const list = (raw as AnyRecord).data ?? raw;
    return Array.isArray(list) ? (list as AnyRecord[]) : [];
  }, [raw]);

  // Stats
  const totalBatches = batches.length;
  const inProgress = batches.filter(
    (b) => b.status === "in_progress",
  ).length;
  const completed = batches.filter(
    (b) => b.status === "completed",
  ).length;
  const failed = batches.filter(
    (b) => b.status === "failed" || b.status === "partial_failure",
  ).length;

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "batch-migrations", label: "Batch Migrations", count: totalBatches },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ModernStatsCard
          title="Total Batches"
          value={totalBatches}
          icon={<Layers size={18} />}
          color="primary"
          size="sm"
        />
        <ModernStatsCard
          title="In Progress"
          value={inProgress}
          icon={<Activity size={18} />}
          color="info"
          size="sm"
        />
        <ModernStatsCard
          title="Completed"
          value={completed}
          icon={<CheckCircle2 size={18} />}
          color="success"
          size="sm"
        />
        <ModernStatsCard
          title="Failed"
          value={failed}
          icon={<XCircle size={18} />}
          color="danger"
          size="sm"
        />
      </div>

      {/* Tab Navigation + CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              <Layers size={14} />
              {tab.label}
              <span
                className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                    : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(wizardPath)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus size={16} />
          New Batch Migration
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "batch-migrations" && (
        <BatchMigrationsList context={context} />
      )}
    </div>
  );
};

export default BatchMigrationDashboard;
