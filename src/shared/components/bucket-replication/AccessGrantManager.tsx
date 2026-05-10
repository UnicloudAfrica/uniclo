import { useId, useMemo, useState } from "react";
import {
  ModernButton,
  ModernCard,
  ModernInput,
  ModernSelect,
} from "@/shared/components/ui";
import {
  BUCKET_RESOURCE_PREFIX,
  type BucketResourceType,
  isValidBucketIdentifier,
} from "./types";
import { extractErrorMessage } from "./internal/extractErrorMessage";

export interface AccessGrant {
  id: number;
  client_user_id: number;
  resource_type: BucketResourceType;
  identifier: string;
  granted_at: string;
  notes?: string | null;
  client_user?: { id: number; email?: string; first_name?: string; last_name?: string } | null;
  granted_by?: { id: number; email?: string } | null;
}

export interface ClientOption {
  id: number;
  display_name: string;
  email?: string;
}

export interface AccessGrantManagerProps {
  /** Currently configured grants for this tenant — already paginated by caller. */
  grants: AccessGrant[];
  /** Client users (role=client) belonging to this tenant. */
  clientOptions: ClientOption[];
  /** True while initial grants list is loading. */
  isLoading?: boolean;
  /**
   * N7: Pagination metadata. When provided, the table renders next/prev
   * controls. The component owns no fetching — paging is a controlled
   * prop the consumer wires to its query state.
   */
  pagination?: {
    page: number;
    perPage: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** Async creator. Throws on validation/AcF probe failure — UI surfaces. */
  onCreate: (input: {
    client_user_id: number;
    resource_type: BucketResourceType;
    identifier: string;
    notes?: string;
  }) => Promise<unknown>;
  /** Async revoker. */
  onRevoke: (grantId: number) => Promise<unknown>;
  /**
   * Deep-link prefill — when a user navigates here from a bucket detail
   * page's "Share with client" CTA, the form opens with the resource
   * type + identifier already populated. The client picker stays empty
   * (user must pick who to share with).
   */
  initialResourceType?: BucketResourceType;
  initialIdentifier?: string;
  /** Optional hook after a successful create — used by the consumer to
   *  clear deep-link query params. */
  onAfterCreate?: () => void;
}

/**
 * Path B (BG-15) tenant-admin UI for granting clients explicit read
 * access to specific bucket resource identifiers.
 *
 * UX layout:
 *   - Form on top: pick client user → pick resource type → paste
 *     identifier → optional notes → Grant
 *   - Table of existing grants below with per-row Revoke
 *
 * Accessibility:
 *   - The form has role="form" + aria-labelledby on its heading
 *   - Identifier input shows real-time prefix-mismatch warning via
 *     aria-describedby pointing at the help text
 *   - Live region announces grant created/revoked status to screen
 *     readers
 *   - Empty state has descriptive text not just an icon
 *
 * Edge cases handled:
 *   - clientOptions is empty (tenant has no clients yet) → form is
 *     disabled with explanatory copy
 *   - Backend rejects with structured error_code → caller's onCreate
 *     re-throws and we display the error message
 *   - Identifier doesn't match the chosen resource_type prefix → we
 *     warn inline before submission, but still let the user submit if
 *     they really want — backend has the final word
 *   - Re-granting (same tuple) is upsert on the backend — UI shows a
 *     "renewed" toast via the parent's promise resolution
 */
export default function AccessGrantManager({
  grants,
  clientOptions,
  isLoading = false,
  pagination,
  initialResourceType,
  initialIdentifier,
  onAfterCreate,
  onCreate,
  onRevoke,
}: AccessGrantManagerProps) {
  const formHeadingId = useId();
  const identifierHelpId = useId();
  const liveRegionId = useId();

  const [clientUserId, setClientUserId] = useState<number | "">("");
  const [resourceType, setResourceType] = useState<BucketResourceType>(
    initialResourceType ?? "migration",
  );
  const [identifier, setIdentifier] = useState(initialIdentifier ?? "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState<string>("");
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const expectedPrefix = BUCKET_RESOURCE_PREFIX[resourceType];
  const identifierIssue = useMemo(() => {
    if (!identifier) return null;
    if (!identifier.startsWith(expectedPrefix)) {
      return `Expected prefix "${expectedPrefix}" for ${resourceType}.`;
    }
    if (!isValidBucketIdentifier(identifier, resourceType)) {
      return `Format must be ${expectedPrefix}<20 alphanumeric chars>.`;
    }
    return null;
  }, [identifier, expectedPrefix, resourceType]);

  const canSubmit =
    !submitting &&
    clientOptions.length > 0 &&
    typeof clientUserId === "number" &&
    !identifierIssue &&
    isValidBucketIdentifier(identifier, resourceType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || typeof clientUserId !== "number") return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        client_user_id: clientUserId,
        resource_type: resourceType,
        identifier,
        notes: notes || undefined,
      });
      setLiveMessage(`Granted ${resourceType} ${identifier}`);
      setIdentifier("");
      setNotes("");
      onAfterCreate?.();
    } catch (err) {
      setError(extractErrorMessage(err) ?? "Grant failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (revokingId) return;
    setRevokingId(id);
    setError(null);
    try {
      await onRevoke(id);
      setLiveMessage("Grant revoked.");
    } catch (err) {
      setError(extractErrorMessage(err) ?? "Revoke failed.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <ModernCard>
        <form
          onSubmit={handleSubmit}
          aria-labelledby={formHeadingId}
          className="p-4 space-y-3"
          noValidate
        >
          <h3
            id={formHeadingId}
            className="text-sm font-semibold text-gray-800 dark:text-gray-200"
          >
            Grant client access to a bucket resource
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Tenant admins explicitly grant a client read access to a specific
            endpoint, migration, or replication identifier. Revoking is a hard
            delete — see the Path B audit trail (BG-15).
          </p>

          {clientOptions.length === 0 && (
            <div
              role="status"
              className="p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-xs text-amber-800 dark:text-amber-200"
            >
              No client users exist in this tenant yet. Invite a client user
              with role=client before issuing grants.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <ModernSelect
              label="Client user"
              value={clientUserId === "" ? "" : String(clientUserId)}
              onChange={(e) =>
                setClientUserId(e.target.value === "" ? "" : Number(e.target.value))
              }
              options={[
                { value: "", label: "— Select client —" },
                ...clientOptions.map((c) => ({
                  value: String(c.id),
                  label: c.email ? `${c.display_name} <${c.email}>` : c.display_name,
                })),
              ]}
              disabled={clientOptions.length === 0}
              required
            />
            <ModernSelect
              label="Resource type"
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value as BucketResourceType)}
              options={[
                { value: "endpoint", label: "Endpoint (bke_*)" },
                { value: "migration", label: "Migration (bmig_*)" },
                { value: "replication", label: "Replication (brpl_*)" },
              ]}
              required
            />
            <ModernInput
              label="Identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={`${expectedPrefix}…`}
              aria-describedby={identifierHelpId}
              aria-invalid={Boolean(identifierIssue)}
              required
              autoComplete="off"
              maxLength={64}
            />
          </div>
          <p
            id={identifierHelpId}
            className={`text-xs ${
              identifierIssue
                ? "text-amber-700 dark:text-amber-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {identifierIssue ?? `Format: ${expectedPrefix}XXXXXXXXXXXXXXXXXXXX (20 alphanumeric chars).`}
          </p>

          <ModernInput
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Customer asked to monitor Q2 DR cutover"
            maxLength={500}
          />

          {error && (
            <p
              role="alert"
              className="text-xs text-red-700 dark:text-red-400"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2">
            <ModernButton type="submit" disabled={!canSubmit}>
              {submitting ? "Granting…" : "Grant access"}
            </ModernButton>
          </div>
        </form>
      </ModernCard>

      {/* SR-only live region — toast UI is fine but screen-reader users
          benefit from a polite announcement of state changes. */}
      <span
        id={liveRegionId}
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {liveMessage}
      </span>

      <ModernCard>
        <div className="p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Who has access
          </h3>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span aria-hidden="true">⏳</span> Looking up your grants…
            </div>
          ) : grants.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span aria-hidden="true" className="text-4xl">🔐</span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Nobody else can see this yet
              </p>
              <p className="max-w-sm text-xs text-gray-500 dark:text-gray-400">
                Use the form above to give a specific client read-only access to one bucket resource — without giving them keys to anything else.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th scope="col" className="px-4 py-2 font-medium">Client</th>
                    <th scope="col" className="px-4 py-2 font-medium">Resource</th>
                    <th scope="col" className="px-4 py-2 font-medium">Identifier</th>
                    <th scope="col" className="px-4 py-2 font-medium">Granted</th>
                    <th scope="col" className="px-4 py-2 font-medium">Notes</th>
                    <th scope="col" className="px-4 py-2 font-medium sr-only">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <td className="px-4 py-2">
                        {g.client_user?.email ??
                          ([g.client_user?.first_name, g.client_user?.last_name]
                            .filter(Boolean)
                            .join(" ") ||
                            `User #${g.client_user_id}`)}
                      </td>
                      <td className="px-4 py-2 capitalize">{g.resource_type}</td>
                      <td className="px-4 py-2">
                        <code
                          className="font-mono break-all"
                          aria-label={`Identifier ${g.identifier}`}
                        >
                          {g.identifier}
                        </code>
                      </td>
                      <td className="px-4 py-2">
                        <time dateTime={g.granted_at}>
                          {new Date(g.granted_at).toLocaleDateString()}
                        </time>
                      </td>
                      <td className="px-4 py-2 max-w-[16rem] truncate" title={g.notes ?? undefined}>
                        {g.notes ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <ModernButton
                          variant="danger"
                          size="sm"
                          disabled={revokingId === g.id}
                          onClick={() => {
                            if (
                              confirm(
                                `Revoke ${g.resource_type} access for ${g.identifier}? Hard delete — no audit row.`,
                              )
                            ) {
                              handleRevoke(g.id);
                            }
                          }}
                          aria-label={`Revoke ${g.resource_type} ${g.identifier}`}
                        >
                          {revokingId === g.id ? "Revoking…" : "Revoke"}
                        </ModernButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* N7: pagination controls — only render when caller supplies
              pagination metadata. Controlled component — caller owns
              the page state. */}
          {pagination && pagination.total > pagination.perPage && (
            <PaginationFooter pagination={pagination} />
          )}
        </div>
      </ModernCard>
    </div>
  );
}

function PaginationFooter({
  pagination,
}: {
  pagination: NonNullable<AccessGrantManagerProps["pagination"]>;
}) {
  const { page, perPage, total, onPageChange } = pagination;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  return (
    <nav
      className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 text-xs"
      aria-label="Grant table pagination"
    >
      <span
        aria-live="polite"
        className="text-gray-500 dark:text-gray-400"
      >
        Showing {start}–{end} of {total} grants
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`Go to page ${page - 1}`}
        >
          Previous
        </button>
        <span aria-current="page" className="px-2 text-gray-600 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label={`Go to page ${page + 1}`}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

// extractErrorMessage moved to ./internal/extractErrorMessage.ts
// (shared with FailoverWizard).
