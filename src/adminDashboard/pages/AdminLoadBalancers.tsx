import { useState } from "react";
import { Plus, Network, Globe } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  ModernTable,
  type Column,
  StatusPill,
  ModernSelect,
  InfoCallout,
  ModernButton,
} from "@/shared/components/ui";
import {
  useLoadBalancers,
  type LoadBalancer,
} from "@/hooks/adminHooks/adminLoadBalancersHooks";
import { useRegionOptions } from "@/hooks/useRegionOptions";
import AdminCreateLoadBalancerModal from "./AdminCreateLoadBalancerModal";

/**
 * Admin Load Balancer list view.
 *
 * Backed by Octavia's `/v2/lbaas/loadbalancers`. The Driver method exists
 * (Driver::createLoadBalancer + listLoadBalancers + deleteLoadBalancer);
 * REST routes for the admin UI haven't shipped yet — this page renders
 * the empty state cleanly until they do, so we don't ship a broken UI.
 *
 * The "New Load Balancer" action opens an admin-side create modal that
 * routes through the existing project-scoped create endpoint, picking the
 * tenant project on admin's behalf.
 */
export default function AdminLoadBalancers() {
  const [region, setRegion] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { optionsWithAll: regionOptions, isLoading: regionsLoading } =
    useRegionOptions();
  const lbs = useLoadBalancers(region || undefined);

  const columns: Column<LoadBalancer>[] = [
    {
      key: "name",
      header: "Name",
      render: (_, row) => (
        <span className="text-sm font-medium">{row.name}</span>
      ),
    },
    {
      key: "vip_address",
      header: "VIP",
      render: (_, row) => (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
          {row.vip_address ?? "—"}
        </code>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (_, row) => <span className="text-sm">{row.region}</span>,
    },
    {
      key: "provisioning_status",
      header: "Provisioning",
      render: (_, row) => <StatusPill status={row.provisioning_status} />,
    },
    {
      key: "operating_status",
      header: "Operating",
      render: (_, row) => <StatusPill status={row.operating_status} />,
    },
  ];

  return (
    <AdminPageShell
      title="Load Balancers"
      description="HTTP / TCP traffic distribution across customer instances."
      contentClassName="space-y-6"
      actions={
        <ModernButton
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
        >
          New Load Balancer
        </ModernButton>
      }
    >
      <InfoCallout tone="info" icon={<Globe className="h-4 w-4" />} title="What is a Load Balancer?">
        Think of it as a smart receptionist for your application. Customer
        traffic hits a single public IP (the VIP), and the load balancer
        spreads it across all your healthy backend servers. If one backend
        falls over, the receptionist routes traffic to the others — your
        site stays up.
      </InfoCallout>

      <div className="flex items-center justify-between">
        <div className="w-48">
          <ModernSelect
            label="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            options={regionOptions}
            disabled={regionsLoading}
          />
        </div>
      </div>

      <ModernTable<LoadBalancer>
        data={lbs.data ?? []}
        columns={columns}
        loading={lbs.isLoading}
        searchable
        searchKeys={["name", "vip_address", "region"]}
        emptyState={{
          icon: <Network className="h-8 w-8 text-slate-300" />,
          title: "No load balancers in this region",
          description:
            "Customers haven't provisioned any LBs here yet. The full CRUD admin endpoint is coming online — watch this space.",
        }}
        paginated
        pageSize={25}
      />

      <AdminCreateLoadBalancerModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultRegion={region || undefined}
      />
    </AdminPageShell>
  );
}
