import { useState, type ReactNode } from "react";
import { RefreshCw, Loader2, PlugZap, ShieldCheck, CreditCard, Cloud } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import ModernButton from "@/shared/components/ui/ModernButton";
import useAuthStore from "@/stores/authStore";
import {
  useGateways,
  useTestGateway,
  useUpdateGateway,
  useClearGatewayField,
  type Gateway,
  type GatewayField,
  type GatewayTestResult,
} from "@/shared/hooks/resources/gatewayHooks";

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  healthy: { label: "Healthy", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  reachable: { label: "Reachable", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  auth_failed: { label: "Auth failed", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  degraded: { label: "Degraded", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  unreachable: { label: "Unreachable", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  not_configured: { label: "Not configured", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  not_testable: { label: "No test", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  unknown: { label: "Unknown", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const SOURCE_STYLES: Record<string, string> = {
  override: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  env: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  missing: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function FieldRow({
  gatewayKey,
  field,
  canEdit,
  draft,
  onDraft,
}: {
  gatewayKey: string;
  field: GatewayField;
  canEdit: boolean;
  draft: string | undefined;
  onDraft: (v: string) => void;
}) {
  const clear = useClearGatewayField();
  return (
    <div className="flex flex-col gap-1.5 border-t border-[--theme-border-color] py-2.5 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{field.label}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${SOURCE_STYLES[field.source]}`}>
          {field.source === "override" ? "Override" : field.source === "env" ? "Env" : "Missing"}
        </span>
      </div>
      <div className="font-mono text-xs text-[--theme-muted-color]">
        {field.present ? field.display : <span className="italic">not set</span>}
        {field.env_var ? <span className="ml-2 opacity-60">· {field.env_var}</span> : null}
      </div>
      {canEdit && (
        <div className="flex items-center gap-2">
          <input
            type={field.secret ? "password" : "text"}
            value={draft ?? ""}
            onChange={(e) => onDraft(e.target.value)}
            placeholder={field.present ? "Enter a new value to override…" : "Set a value…"}
            autoComplete="off"
            className="w-full rounded-md border border-[--theme-border-color] bg-transparent px-2 py-1 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[--theme-color]"
          />
          {field.source === "override" && (
            <button
              type="button"
              onClick={() => clear.mutate({ key: gatewayKey, field: field.field })}
              disabled={clear.isPending}
              className="whitespace-nowrap text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Reset to env
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function GatewayCard({ gateway, canEdit }: { gateway: Gateway; canEdit: boolean }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<GatewayTestResult | null>(null);
  const test = useTestGateway();
  const update = useUpdateGateway();

  const dirty = Object.values(drafts).some((v) => v.length > 0);

  const runTest = () => test.mutate(gateway.key, { onSuccess: setResult });

  const save = () =>
    update.mutate(
      { key: gateway.key, fields: drafts },
      { onSuccess: () => setDrafts({}) },
    );

  const pill = result ? STATUS_STYLES[result.status] ?? STATUS_STYLES.unknown : null;

  return (
    <div className="rounded-xl border border-[--theme-border-color] bg-[--theme-card-bg] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{gateway.label}</span>
          {gateway.mode && (
            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {gateway.mode}
            </span>
          )}
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              gateway.configured
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {gateway.configured ? "Configured" : "Incomplete"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {pill && <span className={`rounded px-2 py-0.5 text-[11px] font-semibold ${pill.cls}`}>{pill.label}</span>}
          <ModernButton
            size="xs"
            variant="outline"
            onClick={runTest}
            isDisabled={test.isPending}
            leftIcon={test.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlugZap className="h-3.5 w-3.5" />}
          >
            Test
          </ModernButton>
        </div>
      </div>

      {gateway.base_url && (
        <div className="mt-1 truncate font-mono text-[11px] text-[--theme-muted-color]">{gateway.base_url}</div>
      )}
      {result?.detail && <div className="mt-1 text-[11px] text-[--theme-muted-color]">{result.detail}</div>}

      <div className="mt-2">
        {gateway.fields.map((f) => (
          <FieldRow
            key={f.field}
            gatewayKey={gateway.key}
            field={f}
            canEdit={canEdit && gateway.editable}
            draft={drafts[f.field]}
            onDraft={(v) => setDrafts((d) => ({ ...d, [f.field]: v }))}
          />
        ))}
      </div>

      {canEdit && gateway.editable && (
        <div className="mt-3 flex justify-end">
          <ModernButton size="sm" onClick={save} isDisabled={!dirty || update.isPending}>
            {update.isPending ? "Saving…" : "Save overrides"}
          </ModernButton>
        </div>
      )}
    </div>
  );
}

const GROUPS: { key: Gateway["group"]; title: string; icon: ReactNode }[] = [
  { key: "integration", title: "Integration services", icon: <ShieldCheck className="h-4 w-4" /> },
  { key: "payment", title: "Payment gateways", icon: <CreditCard className="h-4 w-4" /> },
];

export default function AdminGatewayHealth() {
  const { data, isLoading, isFetching, refetch } = useGateways();
  const user = useAuthStore((s) => s.user) as { is_super_admin?: boolean } | null;
  const canEdit = Boolean(user?.is_super_admin);

  const gateways = data?.gateways ?? [];

  return (
    <AdminPageShell
      title="Gateway Health"
      description="Third-party API credentials and connectivity. Values come from the environment; a super-admin can override them here (stored encrypted)."
      actions={
        <ModernButton
          variant="outline"
          onClick={() => refetch()}
          isDisabled={isFetching}
          leftIcon={isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        >
          Refresh
        </ModernButton>
      }
    >
      {!canEdit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
          You can view status and run tests. Editing credentials requires a super-administrator.
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-[--theme-muted-color]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading gateways…
        </div>
      ) : (
        GROUPS.map((group) => {
          const items = gateways.filter((g) => g.group === group.key);
          if (!items.length) return null;
          return (
            <section key={group.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[--theme-muted-color]">
                {group.icon}
                {group.title}
              </div>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {items.map((g) => (
                  <GatewayCard key={g.key} gateway={g} canEdit={canEdit} />
                ))}
              </div>
            </section>
          );
        })
      )}

      {data?.cloud_note && (
        <div className="flex items-center gap-2 rounded-lg border border-[--theme-border-color] px-3 py-2 text-xs text-[--theme-muted-color]">
          <Cloud className="h-4 w-4 shrink-0" />
          {data.cloud_note}
        </div>
      )}
    </AdminPageShell>
  );
}
