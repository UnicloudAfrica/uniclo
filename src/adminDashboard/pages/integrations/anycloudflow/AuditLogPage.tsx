import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernInput, ModernTable, ModernModal } from "@/shared/components/ui";
import { acfApi } from "./api";

interface Entry {
  identifier: string;
  created_at: string;
  user?: { email?: string };
  action: string;
  resource_type?: string;
  resource_id?: string;
  ip_address?: string;
  status_code?: number;
  metadata?: Record<string, unknown>;
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    resource_type: "",
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const [verifyResult, setVerifyResult] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-audit-log", filters, page],
    queryFn: () => acfApi.listAuditLogs({ ...filters, page }),
    staleTime: 15000,
  });
  const items: Entry[] = (data as { data?: unknown })?.data ?? [];

  const exportMut = useMutation({
    mutationFn: (format: "csv" | "json") => acfApi.exportAuditLogs(format, filters as unknown),
    onSuccess: (res: unknown, format: string) => {
      const blob = new Blob([res?.data ?? res?.content ?? ""], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const verify = useMutation({
    mutationFn: () => acfApi.verifyAuditChain(),
    onSuccess: (res: Record<string, unknown>) => setVerifyResult(res),
  });

  const columns = [
    { key: "ts", header: "Time", render: (e: Entry) => new Date(e.created_at).toLocaleString() },
    { key: "user", header: "User", render: (e: Entry) => e.user?.email ?? "system" },
    { key: "action", header: "Action", render: (e: Entry) => (
      <code className="text-xs">{e.action}</code>
    )},
    { key: "resource", header: "Resource", render: (e: Entry) => `${e.resource_type ?? "—"} ${e.resource_id ?? ""}` },
    { key: "ip", header: "IP", render: (e: Entry) => e.ip_address ?? "—" },
    { key: "status", header: "Status", render: (e: Entry) => e.status_code ? (
      <span className={
        e.status_code < 300 ? "text-green-600" :
        e.status_code < 500 ? "text-yellow-600" : "text-red-600"
      }>{e.status_code}</span>
    ) : "—" },
  ];

  return (
    <AdminPageShell title="Audit Log" description="Immutable hash-chained audit trail of all administrative actions.">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <ModernInput label="User ID" value={filters.user_id} onChange={(e) => setFilters({...filters, user_id: e.target.value})} />
          <ModernInput label="Action" value={filters.action} onChange={(e) => setFilters({...filters, action: e.target.value})} placeholder="replications.create" />
          <ModernInput label="Resource" value={filters.resource_type} onChange={(e) => setFilters({...filters, resource_type: e.target.value})} />
          <ModernInput label="From" type="date" value={filters.from} onChange={(e) => setFilters({...filters, from: e.target.value})} />
          <ModernInput label="To" type="date" value={filters.to} onChange={(e) => setFilters({...filters, to: e.target.value})} />
          <div className="flex items-end gap-2">
            <ModernButton variant="secondary" onClick={() => exportMut.mutate("csv")}>Export CSV</ModernButton>
            <ModernButton variant="secondary" onClick={() => exportMut.mutate("json")}>Export JSON</ModernButton>
          </div>
        </div>

        <div className="flex justify-end">
          <ModernButton onClick={() => verify.mutate()} disabled={verify.isPending}>
            {verify.isPending ? "Verifying…" : "Verify Chain Integrity"}
          </ModernButton>
        </div>

        <ModernTable columns={columns} data={items as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />

        <div className="flex justify-center gap-2">
          <ModernButton size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</ModernButton>
          <span className="px-3 py-1 text-sm">Page {page}</span>
          <ModernButton size="sm" variant="secondary" disabled={items.length < 20} onClick={() => setPage(page + 1)}>Next</ModernButton>
        </div>

        {verifyResult && (
          <ModernModal isOpen={true} onClose={() => setVerifyResult(null)} title="Audit Chain Verification">
            <div className="p-4">
              {verifyResult.chain_intact ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded">
                  <p className="font-semibold">✓ Chain intact — {verifyResult.entry_count} entries verified</p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded">
                  <p className="font-semibold">✗ Chain break detected</p>
                  <pre className="text-xs mt-2">{JSON.stringify(verifyResult.breaks, null, 2)}</pre>
                </div>
              )}
            </div>
          </ModernModal>
        )}
      </div>
    </AdminPageShell>
  );
}
