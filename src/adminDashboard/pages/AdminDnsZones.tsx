import { useState } from "react";
import { Plus, Globe2, MapPinned } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  ModernTable,
  type Column,
  StatusPill,
  ModernSelect,
  InfoCallout,
  ModernButton,
} from "@/shared/components/ui";
import { useDnsZones, type DnsZone } from "@/hooks/adminHooks/adminDnsZonesHooks";
import { useRegionOptions } from "@/hooks/useRegionOptions";
import AdminCreateDnsZoneModal from "./AdminCreateDnsZoneModal";

export default function AdminDnsZones() {
  const [region, setRegion] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const { optionsWithAll: regionOptions, isLoading: regionsLoading } =
    useRegionOptions();
  const zones = useDnsZones(region || undefined);

  const columns: Column<DnsZone>[] = [
    {
      key: "name",
      header: "Domain",
      render: (_, row) => (
        <span className="font-mono text-sm">{row.name}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (_, row) => (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] uppercase dark:bg-slate-800">
          {row.type}
        </code>
      ),
    },
    {
      key: "ttl",
      header: "TTL",
      render: (_, row) => (
        <span className="text-sm">{row.ttl ? `${row.ttl}s` : "—"}</span>
      ),
    },
    {
      key: "email",
      header: "Hostmaster",
      render: (_, row) => (
        <span className="text-xs text-slate-500">{row.email ?? "—"}</span>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (_, row) => <span className="text-sm">{row.region}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (_, row) => <StatusPill status={row.status} />,
    },
  ];

  return (
    <AdminPageShell
      title="DNS Zones"
      description="Authoritative DNS for customer domains."
      contentClassName="space-y-6"
      actions={
        <ModernButton
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
        >
          New DNS Zone
        </ModernButton>
      }
    >
      <InfoCallout tone="info" icon={<Globe2 className="h-4 w-4" />} title="What is a DNS Zone?">
        A DNS Zone is the database that turns a domain (example.com) into the
        addresses where the site actually lives. We host these directly so
        customers don't need an external DNS provider.
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

      <ModernTable<DnsZone>
        data={zones.data ?? []}
        columns={columns}
        loading={zones.isLoading}
        searchable
        searchKeys={["name", "email", "region"]}
        emptyState={{
          icon: <MapPinned className="h-8 w-8 text-slate-300" />,
          title: "No DNS zones yet",
          description:
            "When customers point a domain at us, the zone shows up here. The dedicated CRUD admin endpoint is in flight.",
        }}
        paginated
        pageSize={25}
      />

      <AdminCreateDnsZoneModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultRegion={region || undefined}
      />
    </AdminPageShell>
  );
}
