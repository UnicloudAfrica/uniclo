/**
 * MigrationDashboard — Top-level page for Migration-as-a-Service.
 *
 * Shows stats cards, internal tab navigation (Migrations / Endpoints),
 * and a "New Migration" CTA. Fully responsive.
 */
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Server,
  CheckCircle2,
  Activity,
  DollarSign,
  Plus,
} from "lucide-react";
import { ModernStatsCard } from "../ui";
import MigrationsList from "./MigrationsList";
import EndpointsList from "./EndpointsList";
import {
  useFetchExternalMigrations,
  useFetchExternalEndpoints,
} from "@/shared/hooks/resources";

interface MigrationDashboardProps {
  context: "admin" | "tenant" | "client";
  wizardPath?: string;
}

type TabId = "migrations" | "endpoints";

const MigrationDashboard: React.FC<MigrationDashboardProps> = ({
  context,
  wizardPath = "migrations/new",
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("migrations");

  const { data: migrations } = useFetchExternalMigrations();
  const { data: endpoints } = useFetchExternalEndpoints();

  const migrationList = useMemo(
    () => (Array.isArray(migrations) ? migrations : []),
    [migrations],
  );
  const endpointList = useMemo(
    () => (Array.isArray(endpoints) ? endpoints : []),
    [endpoints],
  );

  // Stats
  const totalMigrations = migrationList.length;
  const activeMigrations = migrationList.filter(
    (m) => m.status === "in_progress" || m.status === "confirmed",
  ).length;
  const completedMigrations = migrationList.filter(
    (m) => m.status === "completed",
  ).length;
  const totalSpend = migrationList.reduce(
    (sum, m) =>
      sum + Number(m.actual_cost_usd ?? m.estimated_cost_usd ?? 0),
    0,
  );

  const tabs: Array<{ id: TabId; label: string; count: number }> = [
    { id: "migrations", label: "Migrations", count: totalMigrations },
    { id: "endpoints", label: "Endpoints", count: endpointList.length },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <ModernStatsCard
          title="Total Migrations"
          value={totalMigrations}
          icon={<ArrowLeftRight size={18} />}
          color="primary"
          size="sm"
        />
        <ModernStatsCard
          title="Active"
          value={activeMigrations}
          icon={<Activity size={18} />}
          color="info"
          size="sm"
        />
        <ModernStatsCard
          title="Completed"
          value={completedMigrations}
          icon={<CheckCircle2 size={18} />}
          color="success"
          size="sm"
        />
        <ModernStatsCard
          title="Total Spend"
          value={`$${totalSpend.toFixed(2)}`}
          icon={<DollarSign size={18} />}
          color="primary"
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
              {tab.id === "migrations" ? (
                <ArrowLeftRight size={14} />
              ) : (
                <Server size={14} />
              )}
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
          New Migration
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "migrations" && <MigrationsList context={context} />}
      {activeTab === "endpoints" && (
        <EndpointsList context={context} />
      )}
    </div>
  );
};

export default MigrationDashboard;
