import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import AdminPageShell from "../../../../components/AdminPageShell";
import { ModernCard, ModernSelect } from "@/shared/components/ui";
import ToastUtils from "@/utils/toastUtil";
import { acfApi } from "../api";
import { translateBucketError } from "../bucketErrorTranslator";
import {
  AccessGrantManager,
  BUCKET_RESOURCE_PREFIX,
  type AccessGrant,
  type BucketResourceType,
  type ClientOption,
} from "@/shared/components/bucket-replication";
import { useFetchClients } from "@/hooks/clientHooks";

/**
 * BG-15 Path B — admin page that mounts AccessGrantManager.
 *
 * Tenant admins use this page to grant their clients explicit read
 * access to specific bucket identifiers (endpoint / migration /
 * replication). The component handles all the form + table UX; this
 * page wires it to the API + client list + toast/feedback.
 *
 * Why a dedicated page (not a tab on a settings page):
 *   - The grant table can grow large with multi-client tenants
 *   - The audit context (who granted, when, with what notes) is
 *     load-bearing for compliance reviews — needs a stable URL to
 *     deep-link from incident reports
 *
 * Cross-page links:
 *   - From any bucket detail page: "Share with client" CTA links here
 *     prefilled with the resource id (TODO: add a `?resource_id=X`
 *     query param parser; out of scope for the initial ship)
 */

// Shape returned by useFetchClients — narrowed inline since the hook
// returns `unknown` (the codebase's API envelope is typed loose).
type FetchedClient = {
  id: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
};

const PER_PAGE = 25;

export default function AdminBucketAccessGrantsPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [filterClient, setFilterClient] = useState<number | "">("");
  const [filterResourceType, setFilterResourceType] =
    useState<BucketResourceType | "">("");

  // Deep-link prefill (from bucket detail page "Share with client" CTAs).
  // ?prefill_resource_type=replication&prefill_identifier=brpl_xxx is
  // read once on mount; the manager's create form picks them up via the
  // initialResourceType + initialIdentifier props.
  const prefillResourceType = useMemo(() => {
    const v = searchParams.get("prefill_resource_type");
    return v === "endpoint" || v === "migration" || v === "replication"
      ? (v as BucketResourceType)
      : undefined;
  }, [searchParams]);
  const prefillIdentifier = searchParams.get("prefill_identifier") ?? undefined;

  // Reset page on filter change (don't strand the user on page 4 of an
  // empty filtered set).
  useEffect(() => {
    setPage(1);
  }, [filterClient, filterResourceType]);

  // Paginated + filtered list of grants
  const { data: grantsData, isLoading: grantsLoading } = useQuery({
    queryKey: [
      "acf-bucket-client-access",
      page,
      filterClient,
      filterResourceType,
    ],
    queryFn: () =>
      acfApi.listBucketClientAccessGrants({
        per_page: PER_PAGE,
        page,
        ...(typeof filterClient === "number" ? { client_user_id: filterClient } : {}),
        ...(filterResourceType ? { resource_type: filterResourceType } : {}),
      } as never),
  });
  // The proxy returns { data: { data: AccessGrant[], meta: {...} } } —
  // unwrap the axios envelope first, then the API envelope.
  const envelope = (grantsData as { data?: { data?: AccessGrant[]; meta?: { total?: number; current_page?: number; per_page?: number } } } | undefined)?.data;
  const grants: AccessGrant[] = Array.isArray(envelope)
    ? envelope
    : Array.isArray(envelope?.data)
      ? envelope!.data!
      : [];
  const total = envelope?.meta?.total ?? grants.length;
  const perPageActual = envelope?.meta?.per_page ?? PER_PAGE;

  // List of client users in the current tenant
  const { data: clientsData } = useFetchClients();
  const clientOptions: ClientOption[] = useMemo(() => {
    const list = (clientsData as FetchedClient[] | { data?: FetchedClient[] } | undefined);
    const arr: FetchedClient[] = Array.isArray(list)
      ? list
      : Array.isArray(list?.data)
        ? list!.data!
        : [];
    return arr
      .filter((c) => typeof c?.id === "number")
      .map((c) => ({
        id: c.id,
        display_name:
          c.display_name ??
          [c.first_name, c.last_name].filter(Boolean).join(" ") ??
          c.email ??
          `User #${c.id}`,
        email: c.email,
      }));
  }, [clientsData]);

  const createMut = useMutation({
    mutationFn: (input: {
      client_user_id: number;
      resource_type: "endpoint" | "migration" | "replication";
      identifier: string;
      notes?: string;
    }) => acfApi.createBucketClientAccessGrant(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-client-access"] });
      ToastUtils.success("Grant created.");
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: number) => acfApi.revokeBucketClientAccessGrant(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["acf-bucket-client-access"] });
      ToastUtils.success("Grant revoked.");
    },
  });

  return (
    <AdminPageShell
      title="Bucket Client Access Grants"
      description="Tenant-admin curated read access for client users to specific bucket resources (BG-15 Path B). Grants compose with Path C automatic ownership scoping — see docs/code-audit/09-bucket-replication/integration-gaps.md."
    >
      <div className="space-y-4">
        {/* Brutal-honesty banner */}
        <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 text-xs text-blue-900 dark:text-blue-200">
          <strong>What this is:</strong> a tenant-admin override that gives a
          specific client user read access to a specific bucket identifier
          they wouldn't otherwise see. Path C scoping (AcF&nbsp;
          <code>external_client_id</code>) is the automatic default — clients
          see resources they own. These grants are the &quot;tenant admin
          shares visibility&quot; layer on top.
          <br />
          <strong>Read-only.</strong> Grants don&apos;t let clients write —
          they only see in their dashboard. Revoke is a hard delete (no
          retention) — the audit trail for revocations lives in the activity
          log.
        </div>

        {/* Filter bar */}
        <ModernCard>
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <ModernSelect
              label="Filter by client"
              value={filterClient === "" ? "" : String(filterClient)}
              onChange={(e) =>
                setFilterClient(e.target.value === "" ? "" : Number(e.target.value))
              }
              options={[
                { value: "", label: "All clients" },
                ...clientOptions.map((c) => ({
                  value: String(c.id),
                  label: c.email ? `${c.display_name} <${c.email}>` : c.display_name,
                })),
              ]}
            />
            <ModernSelect
              label="Filter by resource type"
              value={filterResourceType}
              onChange={(e) =>
                setFilterResourceType((e.target.value as BucketResourceType) || "")
              }
              options={[
                { value: "", label: "All resources" },
                {
                  value: "endpoint",
                  label: `Endpoint (${BUCKET_RESOURCE_PREFIX.endpoint}*)`,
                },
                {
                  value: "migration",
                  label: `Migration (${BUCKET_RESOURCE_PREFIX.migration}*)`,
                },
                {
                  value: "replication",
                  label: `Replication (${BUCKET_RESOURCE_PREFIX.replication}*)`,
                },
              ]}
            />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setFilterClient("");
                  setFilterResourceType("");
                }}
                disabled={filterClient === "" && filterResourceType === ""}
                className="px-3 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Clear all filters"
              >
                Clear filters
              </button>
            </div>
          </div>
        </ModernCard>

        <ModernCard>
          <div className="p-4">
            <AccessGrantManager
              grants={grants}
              clientOptions={clientOptions}
              isLoading={grantsLoading}
              initialResourceType={prefillResourceType}
              initialIdentifier={prefillIdentifier}
              onAfterCreate={() => {
                // Clear the deep-link params after successful create —
                // user shouldn't see the prefill on subsequent reloads.
                if (
                  searchParams.has("prefill_resource_type") ||
                  searchParams.has("prefill_identifier")
                ) {
                  const next = new URLSearchParams(searchParams);
                  next.delete("prefill_resource_type");
                  next.delete("prefill_identifier");
                  setSearchParams(next, { replace: true });
                }
              }}
              pagination={{
                page,
                perPage: perPageActual,
                total,
                onPageChange: setPage,
              }}
              onCreate={async (input) => {
                try {
                  await createMut.mutateAsync(input);
                } catch (err) {
                  // Re-throw so AccessGrantManager surfaces the structured
                  // error_code message in its inline error state.
                  throw new Error(
                    translateBucketError(err, "Grant failed.") ?? "Grant failed.",
                  );
                }
              }}
              onRevoke={async (id) => {
                try {
                  await revokeMut.mutateAsync(id);
                } catch (err) {
                  throw new Error(
                    translateBucketError(err, "Revoke failed.") ?? "Revoke failed.",
                  );
                }
              }}
            />
          </div>
        </ModernCard>
      </div>
    </AdminPageShell>
  );
}
