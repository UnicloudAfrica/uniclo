import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernTable, ModernModal } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";

interface DlqEntry {
  identifier: string;
  webhook_endpoint?: { url?: string };
  event: string;
  attempts: number;
  last_error?: string;
  first_attempted_at?: string;
  last_attempted_at?: string;
  payload?: Record<string, unknown>;
  last_response_status?: number;
  last_response_body?: string;
}

export default function WebhookDeadLettersPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [detailRow, setDetailRow] = useState<DlqEntry | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-webhook-dlq", page],
    queryFn: () => acfApi.listWebhookDlq({ page }),
  });
  const rows: DlqEntry[] = (data as { data?: unknown })?.data ?? [];

  const replay = useMutation({
    mutationFn: (id: string) => acfApi.replayWebhookDlq(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-webhook-dlq"] });
      ToastUtils.success("Replay queued");
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => acfApi.deleteWebhookDlq(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-webhook-dlq"] });
      ToastUtils.success("Deleted");
    },
  });

  const columns = [
    { key: "endpoint", header: "Endpoint", render: (r: DlqEntry) => (
      <code className="text-xs truncate max-w-xs inline-block">{r.webhook_endpoint?.url ?? "—"}</code>
    )},
    { key: "event", header: "Event", render: (r: DlqEntry) => <code className="text-xs">{r.event}</code> },
    { key: "attempts", header: "Attempts", render: (r: DlqEntry) => r.attempts },
    { key: "last_error", header: "Last error", render: (r: DlqEntry) => (
      <span className="text-xs truncate max-w-xs inline-block text-red-600">{r.last_error ?? "—"}</span>
    )},
    { key: "last", header: "Last attempt", render: (r: DlqEntry) => r.last_attempted_at ?? "—" },
    { key: "actions", header: "", render: (r: DlqEntry) => (
      <div className="flex gap-1">
        <ModernButton size="sm" onClick={() => setDetailRow(r)}>Details</ModernButton>
        <ModernButton size="sm" variant="secondary" onClick={() => replay.mutate(r.identifier)}>Replay</ModernButton>
        <ModernButton size="sm" variant="danger" onClick={() => del.mutate(r.identifier)}>Delete</ModernButton>
      </div>
    )},
  ];

  return (
    <AdminPageShell
      title="Webhook Dead Letters"
      description="Webhooks that exhausted all delivery retries. Replay or delete."
    >
      <div className="space-y-4">
        {rows.length === 0 && !isLoading ? (
          <div className="p-8 text-center bg-green-50 dark:bg-green-900/20 border border-green-200 rounded">
            <p className="font-semibold text-green-900 dark:text-green-200">No failed webhook deliveries</p>
            <p className="text-sm text-green-800 dark:text-green-300">Everything is being delivered successfully.</p>
          </div>
        ) : (
          <ModernTable columns={columns} data={rows as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
        )}

        <div className="flex justify-center gap-2">
          <ModernButton size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</ModernButton>
          <span className="px-3 py-1 text-sm">Page {page}</span>
          <ModernButton size="sm" variant="secondary" disabled={rows.length < 20} onClick={() => setPage(page + 1)}>Next</ModernButton>
        </div>

        {detailRow && (
          <ModernModal isOpen={true} onClose={() => setDetailRow(null)} title="Delivery details">
            <div className="p-4 space-y-3 text-sm">
              <div><strong>Event:</strong> <code>{detailRow.event}</code></div>
              <div><strong>Endpoint:</strong> <code>{detailRow.webhook_endpoint?.url}</code></div>
              <div><strong>Last response:</strong> {detailRow.last_response_status ?? "—"}</div>
              <div>
                <strong>Last response body:</strong>
                <pre className="bg-gray-100 dark:bg-[#15203c] p-2 rounded mt-1 text-xs overflow-x-auto">
                  {detailRow.last_response_body ?? "(empty)"}
                </pre>
              </div>
              <div>
                <strong>Payload:</strong>
                <pre className="bg-gray-100 dark:bg-[#15203c] p-2 rounded mt-1 text-xs overflow-x-auto">
                  {JSON.stringify(detailRow.payload, null, 2)}
                </pre>
              </div>
            </div>
          </ModernModal>
        )}
      </div>
    </AdminPageShell>
  );
}
