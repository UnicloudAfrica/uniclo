import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernTable } from "@/shared/components/ui";
import { acfApi } from "./api";

interface JournalEntry {
  identifier: string;
  sequence_number: number;
  file_path: string;
  change_type: string;
  size_bytes?: number;
  captured_at: string;
  synced_at: string | null;
  backup_path?: string | null;
}

export default function JournalEntriesPage() {
  const { id = "" } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["acf-journal", id, page],
    queryFn: () => acfApi.getJournal(id, { page }),
    enabled: !!id,
  });
  const rows: JournalEntry[] = (data as { data?: unknown })?.data ?? [];

  const columns = [
    { key: "seq", header: "Seq", render: (r: JournalEntry) => r.sequence_number },
    { key: "path", header: "File", render: (r: JournalEntry) => (
      <code className="text-xs">{r.file_path}</code>
    )},
    { key: "change", header: "Change", render: (r: JournalEntry) => (
      <code className="text-xs">{r.change_type}</code>
    )},
    { key: "size", header: "Size", render: (r: JournalEntry) =>
      r.size_bytes !== undefined ? `${(r.size_bytes / 1024).toFixed(1)} KB` : "—"
    },
    { key: "captured", header: "Captured", render: (r: JournalEntry) =>
      new Date(r.captured_at).toLocaleString()
    },
    { key: "synced", header: "Synced", render: (r: JournalEntry) =>
      r.synced_at ? (
        <span className="text-green-600">{new Date(r.synced_at).toLocaleString()}</span>
      ) : (
        <span className="text-yellow-600">pending</span>
      )
    },
    { key: "backup", header: "Backup", render: (r: JournalEntry) =>
      r.backup_path ? <code className="text-xs truncate max-w-xs inline-block">{r.backup_path}</code> : "—"
    },
  ];

  return (
    <AdminPageShell
      title={`Journal · ${id}`}
      description="Continuous capture journal entries. Use Point-in-Time Recovery to roll back to any moment."
    >
      <div className="space-y-4">
        <ModernTable columns={columns} data={rows as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
        <div className="flex justify-center gap-2">
          <ModernButton size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</ModernButton>
          <span className="px-3 py-1 text-sm">Page {page}</span>
          <ModernButton size="sm" variant="secondary" disabled={rows.length < 20} onClick={() => setPage(page + 1)}>Next</ModernButton>
        </div>
      </div>
    </AdminPageShell>
  );
}
