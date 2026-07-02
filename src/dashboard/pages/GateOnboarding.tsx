import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import config from "@/config";
import TenantPageShell from "../components/TenantPageShell";

/**
 * Gate-driven onboarding (Part B2, dual-run). Reads the onboarding steps that were
 * migrated onto the Dynamic Input Gate (placement `onboarding-steps`) and shows a
 * live checklist of their status. Additive: the legacy /dashboard/onboarding stays
 * as the fallback; nothing here is enforced (B4 deferred).
 */
interface ChecklistItem {
  id: number;
  key: string;
  title: string;
  description?: string;
  satisfied: boolean;
}

const GateOnboarding = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const load = useCallback(async () => {
    try {
      // SEC-027: cookie-based auth — credentials: "include" carries the
      // httpOnly session cookie; no Bearer token is held client-side.
      const res = await fetch(`${config.baseURL}/requirements/checklist?placement=onboarding-steps`, {
        headers: { Accept: "application/json" },
        credentials: "include",
      });
      const json = (await res.json().catch(() => ({}))) as { data?: ChecklistItem[] };
      setItems(Array.isArray(json?.data) ? json.data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const done = items.filter((i) => i.satisfied).length;

  return (
    <TenantPageShell
      title="Onboarding"
      description="Complete the steps below to finish setting up. We verify your business automatically where supported."
      contentClassName="space-y-6"
    >
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-500">
          {done}/{items.length} complete
        </div>
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            {i.satisfied ? (
              <CheckCircle2 className="flex-none text-green-600" size={20} />
            ) : (
              <Circle className="flex-none text-slate-300" size={20} />
            )}
            <div>
              <div className="font-medium text-slate-800">{i.title}</div>
              {i.description && <div className="text-xs text-slate-500">{i.description}</div>}
            </div>
            <span
              className={`ml-auto flex-none text-xs font-medium ${i.satisfied ? "text-green-600" : "text-slate-400"}`}
            >
              {i.satisfied ? "Done" : "To do"}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-slate-400">No onboarding steps for your account.</p>
        )}
      </div>
    </TenantPageShell>
  );
};

export default GateOnboarding;
