# `@/shared/components/bucket-replication`

Reusable, accessible UI components for the AnyCloudFlow bucket subsystem — used by the admin dashboard, tenant programmatic API consumers, and the client read-only dashboard.

## Why a dedicated package

Three separate dashboards (admin / tenant / client) consume the same bucket data with mostly the same UX. Without a package, the same `STATUS_COLORS` object, `RpoGauge`, and `FailoverWizard` get re-implemented in each page — 200+ lines per page, mostly duplicated, drifting subtly with each round of edits.

This package extracts the shared semantic components (the ones that "know" what a bucket replication is) without duplicating the framework-level primitives that already live in `@/shared/components/ui`. Every component here is a thin layer of bucket-specific logic over a generic primitive.

## Component matrix

| Component                | Wraps               | Purpose                                              | Where it ships                 |
| ------------------------ | ------------------- | ---------------------------------------------------- | ------------------------------ |
| `BucketStatusBadge`      | `StatusPill`        | Lifecycle-status badge for replications + migrations | every list page, detail header |
| `RpoGauge`               | `Gauge`             | RPO visualisation w/ EC-39 catch-up handling         | replication detail page        |
| `EgressMeter`            | `ProgressBar`       | EC-40 monthly egress kill-switch meter               | replication detail page        |
| `ValidationLockoutBadge` | (raw)               | SEC-AUDIT-BUCKET-5 lockout state                     | endpoint list page             |
| `FailoverWizard`         | `ModernModal`       | EC-38 three-step failover with typed-confirm         | replication detail page        |
| `AccessGrantManager`     | `ModernCard` + form | Path B tenant-admin grant CRUD UI                    | tenant settings                |
| `useBucketHealthPolling` | `useQuery`          | Visibility + status-aware 5s/30s polling             | any health-display surface     |

## Architectural decisions

### Composition over configuration

Where a primitive (`StatusPill`, `Gauge`, `ProgressBar`) already exists, the bucket component **wraps** it rather than reimplementing. Adds bucket-specific logic only.

### Polymorphic by `variant` prop, not by separate components

`BucketStatusBadge` takes a `variant: "replication" | "migration"` to narrow the status union. We considered separate `BucketReplicationBadge` + `BucketMigrationBadge` exports — rejected because the call site that loops a heterogeneous list of "bucket events" wants a single component; making them choose based on the parent record type is a worse API.

### Forward-compat status handling

If AcF adds a new status that this package doesn't know about, the badge renders the raw status string with neutral tone — never throws, never silently relabels. Forward-compat is a reliability property: a UI release lagging an API release should still display gracefully.

### Refusing to programmatically focus buttons

`ModernButton` in this codebase doesn't `forwardRef`. Rather than waste an afternoon plumbing `forwardRef` through the primitive, I rely on natural focus order plus `ModernModal`'s focus-trap. The one place programmatic focus matters — the typed-confirm input in `FailoverWizard` step 3 — uses `autoFocus` on the input, which works through the primitive's natural HTML attribute pass-through.

### Typed-confirm pattern, not `window.confirm`

`FailoverWizard` step 3 requires the user to type the target bucket name verbatim. Reasons:

1. `confirm()` accepts on Enter; a single accidental keystroke triggers irreversible promotion. Bad UX.
2. Typing a real bucket name forces the user to engage their working memory — they can't fly through the dialog by reflex.
3. We can match case-sensitively; bucket names ARE case-sensitive on S3.

`AccessGrantManager`'s revoke uses `window.confirm` because revoke is recoverable (re-grant), so the cost of an accidental click is bounded.

### Accessibility — the actual rules I enforce

- Every component has documented ARIA roles + properties in JSDoc + the body
- Tooltip text is mirrored in `aria-label`/`aria-describedby` for non-mouse users
- Live regions (`role="status"` + `aria-live="polite"`) for state changes that happen WITHOUT focus moving (e.g. polling updates the lockout count)
- Loading states are `aria-busy` with same DOM footprint as the loaded state — prevents layout shift on resolve
- Keyboard-only users can complete every flow without a mouse

### Performance

- Every component is `memo()`'d at the export
- `useBucketHealthPolling` defaults `refetchIntervalInBackground: false` — hidden tabs don't waste battery
- The polling cadence shifts based on `currentStatus`, not just a static interval, because a replication idling at "promoted" doesn't need 5s polling

## Usage

### Status badge (list page)

```tsx
import { BucketStatusBadge } from "@/shared/components/bucket-replication";

<BucketStatusBadge variant="replication" status={r.status} hint={r.last_error ?? undefined} />
<BucketStatusBadge variant="migration"  status={m.status} />
```

### RPO gauge + egress meter (detail page)

```tsx
import {
  RpoGauge,
  EgressMeter,
  useBucketHealthPolling,
} from "@/shared/components/bucket-replication";

const { data: health } = useBucketHealthPolling({
  identifier: r.identifier,
  currentStatus: r.status,
  fetcher: () => acfApi.getBucketReplicationHealth(r.identifier),
});

<RpoGauge health={health} size="md" />
<EgressMeter
  monthToDateUsd={health?.egress_month_to_date_usd}
  capUsd={health?.egress_cap_usd}
/>
```

### Validation lockout (endpoint row)

```tsx
import { ValidationLockoutBadge } from "@/shared/components/bucket-replication";

{
  endpoint.validation_locked_at || endpoint.consecutive_validation_failures ? (
    <ValidationLockoutBadge endpoint={endpoint} />
  ) : null;
}
```

### Failover wizard (replication detail page)

```tsx
import { FailoverWizard } from "@/shared/components/bucket-replication";

<FailoverWizard
  isOpen={failoverOpen}
  state={{
    status: r.status,
    queueDepth: health?.queue_depth ?? 0,
    targetBucketName: r.target_endpoint?.bucket_name ?? "",
  }}
  resourceLabel={r.label}
  onInitiate={() => acfApi.initiateBucketReplicationFailover(r.identifier)}
  onCompleteDrain={(typed) => acfApi.completeBucketReplicationDrain(r.identifier, typed)}
  onCancel={() => acfApi.cancelBucketReplicationFailover(r.identifier)}
  onClose={() => setFailoverOpen(false)}
/>;
```

### Access grant manager (tenant settings)

```tsx
import { AccessGrantManager } from "@/shared/components/bucket-replication";

<AccessGrantManager
  grants={grants}
  clientOptions={tenantClients.map((c) => ({
    id: c.id,
    display_name: `${c.first_name} ${c.last_name}`,
    email: c.email,
  }))}
  onCreate={(input) => api.post("/tenant/v1/admin/anycloudflow/bucket/client-access", input)}
  onRevoke={(id) => api.delete(`/tenant/v1/admin/anycloudflow/bucket/client-access/${id}`)}
/>;
```

## Testing strategy

These components are intentionally thin — most of the logic lives in primitives that have their own tests. We don't unit-test a component that's `<StatusPill {...mappedProps} />` in 6 lines.

Integration tests for the consumer pages (admin/tenant/client detail pages) implicitly exercise these. The headline destructive flow — `FailoverWizard` — should grow a dedicated component test (focus order, queue-depth gating, typed-confirm match) when it next gets touched. Tracked in `09-bucket-replication/short-term.md`.

## Ownership

- Bucket-specific status mappings (`REPLICATION_STATUS_TONE`, `MIGRATION_STATUS_LABEL`) live in `types.ts`. If AcF adds a new status, edit `types.ts` first; consumers don't need to change unless they want to render the new state distinctly.
- Adding a new component to this package: also add to `index.ts` barrel + this README's matrix.
- Removing a component is a breaking change — grep for the import before deleting.
