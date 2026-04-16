import React from "react";
import { useNavigate } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import DrillSchedulePanel from "@/shared/components/integrations/DrillSchedulePanel";
import SlaCompliancePanel from "@/shared/components/integrations/SlaCompliancePanel";
import { useReplicationPairs } from "@/shared/hooks/resources/integrationHooks";
import { CalendarClock, ShieldCheck, ArrowRight, FlaskConical, Plus, Info } from "lucide-react";

export default function AdminDrDrills() {
  const navigate = useNavigate();
  const { data: replicationPairs = [], isLoading } = useReplicationPairs({});
  const [selectedPairId, setSelectedPairId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedPairId && replicationPairs.length > 0) {
      setSelectedPairId(replicationPairs[0].identifier);
    }
  }, [selectedPairId, replicationPairs]);

  return (
    <AdminPageShell
      title="DR Drills"
      description="Test your disaster recovery plan to make sure it actually works when you need it"
      contentClassName="space-y-6"
    >
      {/* Plain English Explanation */}
      <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50 p-5 dark:border-amber-900/40 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <h4 className="mb-1 text-sm font-semibold text-amber-900 dark:text-amber-200">What are DR Drills?</h4>
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              A DR (Disaster Recovery) Drill is like a <strong>fire drill for your servers</strong>. It tests whether your
              backup systems can actually take over if your main systems fail. During a drill, we simulate a failure and
              check that your replica can handle traffic — without affecting your real production systems. This gives you
              confidence that when a real disaster happens, your recovery plan will work.
            </p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-3 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Policy selector */}
      {!isLoading && replicationPairs.length > 0 && (
        <>
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
              <ShieldCheck size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Select Replication Policy to Test
              </label>
              <select
                value={selectedPairId ?? ""}
                onChange={(e) => setSelectedPairId(e.target.value)}
                className="w-full max-w-lg rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-blue-900/40"
              >
                {replicationPairs.map((pair) => (
                  <option key={pair.identifier} value={pair.identifier}>
                    {pair.identifier} — {pair.resource_a_provider}/{pair.resource_a_region} → {pair.resource_b_provider}/{pair.resource_b_region}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden text-right sm:block">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-400/20">
                {replicationPairs.length} {replicationPairs.length === 1 ? "policy" : "policies"}
              </span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DrillSchedulePanel drillId={selectedPairId!} />
            <SlaCompliancePanel pairId={selectedPairId!} />
          </div>
        </>
      )}

      {/* Empty state — with button to set up replication */}
      {!isLoading && replicationPairs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 py-20 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30">
              <FlaskConical size={36} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white dark:bg-gray-800 dark:ring-gray-800">
              <CalendarClock size={16} className="text-indigo-500" />
            </div>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
            No DR Drills Available Yet
          </h3>
          <p className="mb-2 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
            Before you can run a DR drill, you need to set up a <strong>replication policy</strong> first.
            A replication policy tells the system which server to copy data from, and where to copy it to.
          </p>
          <p className="mb-6 max-w-md text-center text-xs text-gray-400 dark:text-gray-500">
            Once a replication policy is active, you can schedule drills to test that everything works.
          </p>

          <button
            onClick={() => navigate("/admin-dashboard/protection")}
            className="mb-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.98]"
          >
            <Plus size={16} strokeWidth={2.5} />
            Set Up Replication Policy
          </button>

          <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: <CalendarClock size={16} />, label: "Automated scheduling", desc: "Run drills weekly, monthly, or quarterly" },
              { icon: <ShieldCheck size={16} />, label: "SLA compliance", desc: "Track your recovery time goals" },
              { icon: <FlaskConical size={16} />, label: "Safe testing", desc: "Test failover without affecting production" },
              { icon: <ArrowRight size={16} />, label: "Failover validation", desc: "Prove your DR plan actually works" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30"
              >
                <div className="mt-0.5 text-blue-500">{f.icon}</div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{f.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
