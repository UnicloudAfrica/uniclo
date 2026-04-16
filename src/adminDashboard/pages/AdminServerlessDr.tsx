import { Info, CloudOff, DollarSign, Zap } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ServerlessDrPoliciesList from "@/shared/components/integrations/serverless-dr/ServerlessDrPoliciesList";

export default function AdminServerlessDr() {
  return (
    <AdminPageShell
      title="Serverless DR"
      description="Backup servers stay powered off until needed — customers pay only for storage"
      contentClassName="space-y-6"
    >
      {/* Plain English Explanation */}
      <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 p-5 dark:border-purple-900/40 dark:from-purple-950/30 dark:to-violet-950/30">
        <div className="flex items-start gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-purple-600 dark:text-purple-400" />
          <div>
            <h4 className="mb-1 text-sm font-semibold text-purple-900 dark:text-purple-200">What is Serverless DR?</h4>
            <p className="text-sm leading-relaxed text-purple-800 dark:text-purple-300">
              Traditional disaster recovery requires running a second server 24/7 — even though you only need it during a
              disaster. <strong>Serverless DR</strong> keeps a copy of your data synced to storage, but the backup server stays
              <strong> powered off</strong>. When a disaster strikes, the backup server boots up automatically and takes over.
              You only pay for storage while things are normal — the compute cost only kicks in during an actual failover.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                <CloudOff size={13} /> Server off until needed
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                <DollarSign size={13} /> Pay only for storage
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-purple-700 dark:text-purple-400">
                <Zap size={13} /> Auto-boots on failure
              </span>
            </div>
          </div>
        </div>
      </div>

      <ServerlessDrPoliciesList
        context="admin"
        detailBasePath="/admin-dashboard/serverless-dr"
        createPath="/admin-dashboard/serverless-dr/new"
      />
    </AdminPageShell>
  );
}
