import React from "react";
import AdminPageShell from "../components/AdminPageShell";
import HypervisorPanel from "@/shared/components/integrations/HypervisorPanel";
import { useFetchExternalEndpoints } from "@/shared/hooks/resources/externalEndpointHooks";
import { Server, Monitor, Cpu, ArrowRightLeft, HardDrive } from "lucide-react";

interface ExternalEndpointItem {
  id: string;
  identifier: string;
  name: string;
  host: string;
  resource_type: string;
}

export default function AdminHypervisor() {
  const { data: externalEndpoints = [], isLoading } = useFetchExternalEndpoints({ extra: { per_page: 100 } });

  return (
    <AdminPageShell
      title="Hypervisor Management"
      description="Detect hypervisors, manage VMs, run live migrations, and track changed blocks"
      contentClassName="space-y-6"
    >
      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-3 h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full rounded bg-gray-100 dark:bg-gray-800" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (externalEndpoints as ExternalEndpointItem[]).length > 0 && (
        <HypervisorPanel endpoints={externalEndpoints as ExternalEndpointItem[]} />
      )}

      {/* Empty state */}
      {!isLoading && (externalEndpoints as ExternalEndpointItem[]).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 py-20 dark:border-gray-800 dark:bg-gray-900">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
              <Monitor size={36} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white dark:bg-gray-800 dark:ring-gray-800">
              <Cpu size={16} className="text-purple-500" />
            </div>
          </div>

          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-50">
            No Hypervisor Endpoints
          </h3>
          <p className="mb-6 max-w-md text-center text-sm text-gray-500 dark:text-gray-400">
            Add VM endpoints under Destinations to detect hypervisors, manage virtual machines, and run live migrations.
          </p>

          <div className="grid max-w-lg grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { icon: <Server size={16} />, label: "Hypervisor detection", desc: "Auto-detect ESXi, Hyper-V, KVM" },
              { icon: <Monitor size={16} />, label: "VM management", desc: "Start, stop, and monitor VMs" },
              { icon: <ArrowRightLeft size={16} />, label: "Live migration", desc: "Move VMs between hosts" },
              { icon: <HardDrive size={16} />, label: "Changed block tracking", desc: "Efficient incremental backups" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30"
              >
                <div className="mt-0.5 text-indigo-500">{f.icon}</div>
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
