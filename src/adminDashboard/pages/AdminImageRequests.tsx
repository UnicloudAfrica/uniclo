import { useState } from "react";
import { CheckCircle2, Inbox, Layers, Users, Disc } from "lucide-react";
import AdminPageShell from "../components/AdminPageShell";
import {
  ModernTable,
  type Column,
  StatusPill,
  ModernButton,
  KpiTile,
  InfoCallout,
  ConfirmDialog,
} from "@/shared/components/ui";
import {
  useAggregatedImageRequests,
  useApproveImageRequest,
  useBulkApproveImageRequests,
  type AggregatedImageRequest,
} from "@/hooks/adminHooks/adminImageRequestsHooks";

/**
 * Admin aggregated image-request demand view.
 *
 * Groups customer requests by (distro, version, arch, region) so admins
 * can spot recurring demand at a glance. Approving an aggregated row
 * imports the upstream image; every customer who requested it gets
 * notified.
 *
 * The UI deliberately leads with "demand strength" (total requests +
 * unique tenants) rather than recency — a one-off ask shouldn't push a
 * 12-tenant request off the screen.
 */
export default function AdminImageRequests() {
  const requests = useAggregatedImageRequests();
  const approve = useApproveImageRequest();
  const bulkApprove = useBulkApproveImageRequests();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const rows = requests.data ?? [];
  const totalRequests = rows.reduce((sum, r) => sum + r.total_requests, 0);
  const uniqueImages = rows.length;
  const totalTenants = new Set(
    rows.flatMap(() => []) // we don't have tenant ids in aggregated; report request count instead
  );

  const columns: Column<AggregatedImageRequest>[] = [
    {
      key: "image",
      header: "Image",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Disc className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium capitalize">
            {row.distro} {row.version}
          </span>
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
            {row.arch}
          </code>
        </div>
      ),
    },
    {
      key: "region",
      header: "Region",
      render: (_, row) => <span className="text-sm">{row.region}</span>,
    },
    {
      key: "demand",
      header: "Demand",
      render: (_, row) => (
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            <Inbox className="h-3 w-3" />
            {row.total_requests} request{row.total_requests === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Users className="h-3 w-3" />
            {row.unique_tenants} tenant{row.unique_tenants === 1 ? "" : "s"}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (_, row) => <StatusPill status={row.status} />,
    },
    {
      key: "latest_request",
      header: "Most recent",
      render: (_, row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.latest_request).toLocaleString()}
        </span>
      ),
    },
    {
      key: "_actions",
      header: "",
      align: "right",
      render: (_, row) => {
        if (row.status === "available") {
          return <span className="text-xs text-emerald-600">✓ Done</span>;
        }
        return (
          <ModernButton
            size="sm"
            variant="primary"
            disabled={approve.isPending}
            onClick={() => row.identifier && approve.mutate(row.identifier)}
          >
            Cache
          </ModernButton>
        );
      },
    },
  ];

  return (
    <AdminPageShell
      title="Image Requests"
      description="Aggregated customer demand for OS images. Approve to import."
      contentClassName="space-y-6"
    >
      <InfoCallout tone="info" title="How this works">
        Each row is one image (distro + version + arch + region), summed
        across every tenant who asked for it. Sort by demand to see what
        customers want most. Clicking <em>Cache</em> dispatches an
        upstream import job; matched customers are notified once it lands.
      </InfoCallout>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label="Open requests"
          value={String(totalRequests)}
          icon={<Inbox className="h-4 w-4" />}
        />
        <KpiTile
          label="Unique images"
          value={String(uniqueImages)}
          icon={<Layers className="h-4 w-4" />}
        />
        <KpiTile
          label="Approved + ready"
          value={String(rows.filter((r) => r.status === "available").length)}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="success"
        />
      </div>

      <ModernTable<AggregatedImageRequest & { id: string }>
        data={rows.map((r) => ({
          ...r,
          id: `${r.distro}-${r.version}-${r.arch}-${r.region}`,
        }))}
        columns={columns as Column<AggregatedImageRequest & { id: string }>[]}
        loading={requests.isLoading}
        searchable
        searchKeys={["distro", "version", "region"]}
        searchPlaceholder="Search by distro, version, region…"
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkActions={[
          {
            label: `Approve ${selectedIds.length} selected`,
            variant: "primary",
            onClick: () => setConfirmBulk(true),
          },
        ]}
        emptyState={{
          title: "No outstanding image requests",
          description: "Customers are happy. Nice.",
        }}
        paginated
        pageSize={25}
      />

      <ConfirmDialog
        isOpen={confirmBulk}
        title={`Approve ${selectedIds.length} image request${
          selectedIds.length === 1 ? "" : "s"
        }?`}
        message="Each selected image will be queued for import. Customers who requested any of these will be notified once their image lands."
        confirmLabel="Approve all"
        onConfirm={async () => {
          await bulkApprove.mutateAsync(selectedIds);
          setSelectedIds([]);
          setConfirmBulk(false);
        }}
        onCancel={() => setConfirmBulk(false)}
        isLoading={bulkApprove.isPending}
      />
    </AdminPageShell>
  );
}
