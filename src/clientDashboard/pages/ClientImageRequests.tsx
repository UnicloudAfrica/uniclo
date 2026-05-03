import { useEffect, useState } from "react";
import { Disc, Search } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import {
  ModernTable,
  type Column,
  StatusPill,
  ModernButton,
  ModernSelect,
  InfoCallout,
  SurfaceCard,
  SectionHeader,
} from "@/shared/components/ui";
import {
  useAvailableImages,
  useMyImageRequests,
  useSubmitImageRequest,
} from "@/hooks/imageRequestHooks";
import { useRegionOptions } from "@/hooks/useRegionOptions";

interface AvailableImage {
  distro: string;
  version: string;
  arch: string;
  already_available: boolean;
  request_status: string | null;
}

interface MyRequest {
  id: number;
  identifier: string;
  distro: string;
  version: string;
  arch: string;
  region: string;
  status: string;
  created_at: string;
}

/**
 * Customer-facing OS image catalog + request flow.
 *
 * Two sections:
 *   1. Browse — shows the upstream catalog (Ubuntu, Rocky, Debian…) for a
 *      chosen region. Customer can click "Request" on anything not yet
 *      cached locally; we forward the request to the admin team.
 *   2. My requests — track the customer's own outstanding requests with
 *      live status (pending / importing / available / rejected).
 *
 * The "Request" action is intentionally lightweight — no confirmation
 * modal — because all it does is queue admin work; nothing is provisioned
 * yet. Once an admin approves + the import lands, the customer gets a
 * notification + this page reflects status=available.
 */
export default function ClientImageRequests() {
  const {
    options: regionOptions,
    isLoading: regionsLoading,
    isEmpty: regionsEmpty,
    emptyMessage: regionsEmptyMessage,
  } = useRegionOptions();
  const [region, setRegion] = useState("");

  // Default to the first region as soon as the list resolves.
  useEffect(() => {
    if (!region && regionOptions[0]?.value) {
      setRegion(regionOptions[0].value);
    }
  }, [region, regionOptions]);

  const available = useAvailableImages(region);
  const mine = useMyImageRequests();
  const submit = useSubmitImageRequest();

  const availableColumns: Column<AvailableImage>[] = [
    {
      key: "distro",
      header: "Distro",
      render: (_, row) => (
        <span className="inline-flex items-center gap-2 text-sm font-medium capitalize">
          <Disc className="h-4 w-4 text-slate-400" />
          {row.distro}
        </span>
      ),
    },
    {
      key: "version",
      header: "Version",
      render: (_, row) => <span className="text-sm">{row.version}</span>,
    },
    {
      key: "arch",
      header: "Arch",
      render: (_, row) => (
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] dark:bg-slate-800">
          {row.arch}
        </code>
      ),
    },
    {
      key: "already_available",
      header: "Status",
      render: (_, row) => {
        if (row.already_available) {
          return <StatusPill tone="success" label="Ready to use" />;
        }
        if (row.request_status) {
          return <StatusPill status={row.request_status} />;
        }
        return <StatusPill tone="neutral" label="Not in catalog" />;
      },
    },
    {
      key: "_actions",
      header: "",
      align: "right",
      render: (_, row) => {
        if (row.already_available) {
          return (
            <span className="text-xs text-slate-400">Use when launching</span>
          );
        }
        if (row.request_status) {
          return (
            <span className="text-xs text-slate-400">
              {row.request_status === "available" ? "✓ Available" : "Pending"}
            </span>
          );
        }
        return (
          <ModernButton
            size="sm"
            variant="primary"
            disabled={submit.isPending}
            onClick={() =>
              submit.mutate({
                distro: row.distro,
                version: row.version,
                arch: row.arch,
                region,
              })
            }
          >
            Request
          </ModernButton>
        );
      },
    },
  ];

  const myColumns: Column<MyRequest>[] = [
    {
      key: "identifier",
      header: "Request",
      render: (_, row) => (
        <span className="font-mono text-xs">{row.identifier}</span>
      ),
    },
    {
      key: "image",
      header: "Image",
      render: (_, row) => (
        <span className="text-sm capitalize">
          {row.distro} {row.version}
          <span className="ml-1 text-xs text-slate-400">({row.arch})</span>
        </span>
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
    {
      key: "created_at",
      header: "Submitted",
      render: (_, row) => (
        <span className="text-xs text-slate-500">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <ClientPageShell
      title="OS Images"
      description="Browse the catalog or request a new one."
      contentClassName="space-y-6"
    >
      <InfoCallout tone="info" title="Explained simply">
        Pick the operating system you want when launching a new server. If we
        don't have it yet, click <em>Request</em> — we'll cache it for your
        region within a business day and email you when it's ready.
      </InfoCallout>

      {regionsEmpty && (
        <InfoCallout tone="warning" title="No regions available">
          {regionsEmptyMessage}
        </InfoCallout>
      )}

      <SurfaceCard>
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionHeader
              title="Browse images"
              description="What's available in your region right now"
            />
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

          <ModernTable<AvailableImage & { id: string }>
            data={(available.data ?? []).map((r) => ({
              ...r,
              id: `${r.distro}-${r.version}-${r.arch}`,
            }))}
            columns={availableColumns as Column<AvailableImage & { id: string }>[]}
            loading={available.isLoading}
            searchable
            searchKeys={["distro", "version", "arch"]}
            searchPlaceholder="Search distros…"
            emptyState={{
              icon: <Search className="h-8 w-8 text-slate-300" />,
              title: "No images discovered",
              description:
                "We'll populate this list as upstream catalogs sync. Refresh in a minute.",
            }}
            paginated
            pageSize={20}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard>
        <div className="space-y-4 p-5">
          <SectionHeader
            title="My requests"
            description="Track requests you've submitted"
          />
          <ModernTable<MyRequest>
            data={mine.data ?? []}
            columns={myColumns}
            loading={mine.isLoading}
            emptyState={{
              title: "No requests yet",
              description:
                "Spot something missing in the catalog above? Click Request to ask our team to add it.",
            }}
            paginated
            pageSize={10}
          />
        </div>
      </SurfaceCard>
    </ClientPageShell>
  );
}
