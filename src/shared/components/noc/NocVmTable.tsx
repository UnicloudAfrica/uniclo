import React, { useId, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { SurfaceCard, StatusPill, ResourceEmptyState, type StatusTone } from "@/shared/components/ui";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { NocVm } from "@/hooks/adminHooks/nocHooks";

interface Props {
  vms: NocVm[];
}

const STATUS_TONE: Record<string, StatusTone> = {
  active: "success",
  stopped: "neutral",
  error: "danger",
  rebuilding: "warning",
};

const NocVmTable: React.FC<Props> = ({ vms }) => {
  const searchId = useId();
  const [q, setQ] = useState("");

  const debouncedQ = useDebouncedValue(q, 180);
  const filtered = useMemo(() => {
    const needle = debouncedQ.trim().toLowerCase();
    if (!needle) return vms;
    return vms.filter((v) =>
      [v.name, v.id, v.instance_type, v.address, v.project_id]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(needle))
    );
  }, [debouncedQ, vms]);

  if (!vms.length) {
    return (
      <ResourceEmptyState
        title="No VMs in this region"
        message="Once instances are provisioned they'll appear here."
      />
    );
  }

  return (
    <SurfaceCard variant="card" padding="none" radius="lg">
      <div
        className="border-b px-3 py-2"
        style={{
          borderColor: "var(--theme-border-color)",
          background: "var(--theme-surface-alt)",
        }}
      >
        <label htmlFor={searchId} className="sr-only">
          Search virtual machines
        </label>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            placeholder="Search by name, type, address, project..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md bg-white pl-7 pr-3 py-1.5 text-xs"
            style={{
              border: "1px solid rgb(var(--theme-input-border))",
              color: "var(--theme-input-text)",
            }}
          />
        </div>
      </div>
      <div className="max-h-[500px] overflow-auto" role="region" aria-label="Virtual machines table">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10" style={{ background: "var(--theme-surface-alt)" }}>
            <tr
              className="text-left text-[10px] font-semibold uppercase text-gray-500"
              style={{ letterSpacing: "0.18em" }}
            >
              <th scope="col" className="px-3 py-2">Name</th>
              <th scope="col" className="px-3 py-2">Type</th>
              <th scope="col" className="px-3 py-2">vCPU/RAM</th>
              <th scope="col" className="px-3 py-2">Address</th>
              <th scope="col" className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-xs text-gray-500">
                  No VMs match "{q}".
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-800 truncate max-w-[200px]">
                      {v.name || v.id}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                      {v.id}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">{v.instance_type || "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {v.vcpus} vCPU · {Math.round((v.ram_mb || 0) / 1024)} GB
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px]">{v.address || "—"}</td>
                  <td className="px-3 py-2">
                    <StatusPill
                      label={v.status}
                      tone={STATUS_TONE[v.status] ?? "neutral"}
                      showIcon={false}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
};

export default NocVmTable;
