import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import { ModernButton, ModernTable } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";

interface HostKey {
  identifier: string;
  fingerprint: string;
  vm_endpoint?: { label?: string; ip_address?: string };
  status: "pending" | "approved" | "rejected";
  first_seen_at?: string;
  approved_at?: string | null;
  approved_by?: { email?: string };
}

export default function SshHostKeysPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const { data, isLoading } = useQuery({
    queryKey: ["acf-ssh-host-keys", tab],
    queryFn: () => acfApi.listSshHostKeys(tab),
  });

  const keys: HostKey[] = (data as { data?: unknown })?.data ?? (data as unknown) ?? [];
  const pendingCount = tab === "pending" ? keys.length : 0;

  const approve = useMutation({
    mutationFn: (id: string) => acfApi.approveSshHostKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-ssh-host-keys"] });
      ToastUtils.success("Host key approved");
    },
  });
  const reject = useMutation({
    mutationFn: (id: string) => acfApi.rejectSshHostKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-ssh-host-keys"] });
      ToastUtils.success("Host key rejected");
    },
  });

  const columns = [
    { key: "vm", header: "VM", render: (k: HostKey) =>
      `${k.vm_endpoint?.label ?? "—"} (${k.vm_endpoint?.ip_address ?? "—"})` },
    { key: "fp", header: "Fingerprint", render: (k: HostKey) => (
      <code className="text-xs">{k.fingerprint}</code>
    )},
    { key: "seen", header: "First seen", render: (k: HostKey) => k.first_seen_at ?? "—" },
    { key: "actions", header: "", render: (k: HostKey) => (
      k.status === "pending" ? (
        <div className="flex gap-2">
          <ModernButton size="sm" onClick={() => approve.mutate(k.identifier)}>Approve</ModernButton>
          <ModernButton size="sm" variant="danger" onClick={() => reject.mutate(k.identifier)}>Reject</ModernButton>
        </div>
      ) : (
        <span className="text-xs text-gray-500">
          {k.status === "approved" ? `Approved by ${k.approved_by?.email ?? "—"}` : "Rejected"}
        </span>
      )
    )},
  ];

  return (
    <AdminPageShell
      title="SSH Host Keys"
      description="Approve or reject new SSH host keys before AnyCloudFlow trusts them. Required for MITM protection."
    >
      <div className="space-y-4">
        {pendingCount > 0 && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="font-semibold text-yellow-900 dark:text-yellow-200">
              {pendingCount} SSH host {pendingCount === 1 ? "key needs" : "keys need"} approval
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Replication and migration operations are blocked for these endpoints until approved.
            </p>
          </div>
        )}

        <div className="flex gap-2 border-b border-gray-200 dark:border-[#172036]">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm ${
                tab === t
                  ? "border-b-2 border-primary-500 text-primary-500"
                  : "text-gray-500"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <ModernTable columns={columns} data={keys as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />
      </div>
    </AdminPageShell>
  );
}
