import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminPageShell from "../../../components/AdminPageShell";
import {
  ModernButton,
  ModernInput,
  ModernSelect,
  ModernCard,
  ModernTable,
} from "@/shared/components/ui";
import ConfirmDialog from "@/shared/components/ui/ConfirmDialog";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "./api";

interface Entry {
  identifier: string;
  ip_address: string;
  cidr_prefix: number | null;
  label: string;
  expires_at: string | null;
  created_by?: { name?: string; email?: string };
}

export default function IpAllowlistPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["acf-ip-allowlist"],
    queryFn: () => acfApi.listIpAllowlist(),
  });

  const entries: Entry[] = (data as { data?: unknown })?.data ?? (data as unknown) ?? [];

  const [ip, setIp] = useState("");
  const [cidr, setCidr] = useState<string>("32");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Entry | null>(null);

  const add = useMutation({
    mutationFn: () =>
      acfApi.addIpAllowlistEntry({
        ip_address: ip,
        cidr_prefix: cidr ? parseInt(cidr, 10) : undefined,
        label,
        expires_at: expiresAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-ip-allowlist"] });
      setIp("");
      setLabel("");
      setExpiresAt("");
      ToastUtils.success("IP added to allowlist");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => acfApi.removeIpAllowlistEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-ip-allowlist"] });
      setDeleteTarget(null);
      ToastUtils.success("Entry removed");
    },
  });

  const columns = [
    { key: "address", header: "Address", render: (e: Entry) => (
      <code>{e.ip_address}{e.cidr_prefix ? `/${e.cidr_prefix}` : ""}</code>
    )},
    { key: "label", header: "Label", render: (e: Entry) => e.label },
    { key: "created_by", header: "Added by", render: (e: Entry) => e.created_by?.email ?? "—" },
    { key: "expires_at", header: "Expires", render: (e: Entry) => e.expires_at ?? "Never" },
    {
      key: "actions",
      header: "",
      render: (e: Entry) => (
        <ModernButton size="sm" variant="danger" onClick={() => setDeleteTarget(e)}>
          Delete
        </ModernButton>
      ),
    },
  ];

  return (
    <AdminPageShell
      title="IP Allowlist"
      description="Restrict AnyCloudFlow API access to specific IPs or CIDR ranges."
    >
      <div className="space-y-6">
        {entries.length === 0 && !isLoading && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
            <p className="font-semibold text-yellow-900 dark:text-yellow-200">
              IP allowlisting is disabled
            </p>
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              All IPs can currently access the API. Add at least one entry to enable enforcement.
            </p>
          </div>
        )}

        <ModernCard>
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <ModernInput label="IP address" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.10" />
            <ModernSelect
              label="CIDR"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              options={[
                { value: "32", label: "/32 (single)" },
                { value: "24", label: "/24" },
                { value: "16", label: "/16" },
                { value: "8", label: "/8" },
              ]}
            />
            <ModernInput label="Label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Office VPN" />
            <ModernInput label="Expires (optional)" type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            <div className="md:col-span-4">
              <ModernButton onClick={() => add.mutate()} disabled={!ip || !label || add.isPending}>
                {add.isPending ? "Adding…" : "Add entry"}
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        <ModernTable columns={columns} data={entries as unknown as Array<{ id?: string | number | null }>} loading={isLoading} />

        {deleteTarget && (
          <ConfirmDialog
            isOpen={true}
            title={entries.length === 1 ? "Disable IP allowlisting?" : "Remove entry?"}
            message={
              entries.length === 1
                ? "This is the last entry. Removing it disables IP allowlisting — all IPs will be allowed again."
                : `Remove ${deleteTarget.ip_address}${deleteTarget.cidr_prefix ? `/${deleteTarget.cidr_prefix}` : ""}?`
            }
            confirmLabel="Yes, remove"
            variant="danger"
            onConfirm={() => remove.mutate(deleteTarget.identifier)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </AdminPageShell>
  );
}
