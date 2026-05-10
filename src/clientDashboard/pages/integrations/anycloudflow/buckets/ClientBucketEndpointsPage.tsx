import { useQuery } from "@tanstack/react-query";
import ClientPageShell from "../../../../components/ClientPageShell";
import { ResilienceHero } from "@/shared/components/orbit";
import {
  ModernCard,
  ModernTable,
} from "@/shared/components/ui";
import { acfApi } from "../../../../../adminDashboard/pages/integrations/anycloudflow/api";

/**
 * Client-facing (Path C) read-only list of bucket endpoints. The backend
 * middleware binds X-Acf-Client-Id so the list returned here is already
 * narrowed to the client's own subset — no filtering required client-side.
 *
 * Parity with the admin BucketEndpointsPage MINUS the mutation controls
 * (no "+ Register" button, no Validate/Delete/Unlock row actions). Tapping
 * a row in a future iteration can navigate to a detail view; today it's
 * a plain list to ship Phase C minimally.
 */

interface BucketEndpoint {
  identifier: string;
  label: string;
  provider: string;
  bucket_name: string;
  region?: string | null;
  endpoint_url?: string | null;
  preflight_passed_at?: string | null;
  preflight_error?: string | null;
  access_key_masked?: string | null;
  validation_locked_at?: string | null;
  consecutive_validation_failures?: number;
}

export default function ClientBucketEndpointsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["client-acf-bucket-endpoints"],
    queryFn: () => acfApi.listClientBucketEndpoints(),
  });
  const rows: BucketEndpoint[] = (data as { data?: { data?: unknown[] } })?.data?.data ?? (data as { data?: unknown })?.data ?? [];

  const columns = [
    { key: "label", header: "Label", render: (e: BucketEndpoint) => e.label },
    {
      key: "provider",
      header: "Provider",
      render: (e: BucketEndpoint) => (
        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
          {e.provider.toUpperCase()}
        </span>
      ),
    },
    {
      key: "bucket_name",
      header: "Bucket",
      render: (e: BucketEndpoint) => <code className="text-xs">{e.bucket_name}</code>,
    },
    { key: "region", header: "Region", render: (e: BucketEndpoint) => e.region ?? "—" },
    {
      key: "preflight",
      header: "Preflight",
      render: (e: BucketEndpoint) =>
        e.preflight_passed_at ? (
          <span className="text-green-600 text-xs">✓ passed</span>
        ) : e.preflight_error ? (
          <span className="text-red-600 text-xs" title={e.preflight_error}>
            ✗ failed
          </span>
        ) : (
          <span className="text-gray-400 text-xs">not run</span>
        ),
    },
  ];

  return (
    <ClientPageShell title="" description="">
      <div className="space-y-4">
        <ResilienceHero topic="bucket-endpoints" role="client" />
        {rows.length === 0 && !isLoading ? (
          <ModernCard>
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <span aria-hidden="true" className="text-5xl">🪣</span>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-200">
                No buckets shared with you yet
              </p>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
                Your provider registers buckets on your behalf. They'll show up here as soon as one's connected.
              </p>
            </div>
          </ModernCard>
        ) : (
          <ModernTable
            columns={columns}
            data={rows as unknown as Array<{ id?: string | number | null }>}
            loading={isLoading}
          />
        )}
      </div>
    </ClientPageShell>
  );
}
