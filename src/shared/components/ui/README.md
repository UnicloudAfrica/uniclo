# UI Primitives — UniCloud Africa Design System

Production-ready, whitelabel-aware components shared across Admin, Tenant,
and Client dashboards. Every primitive flows colour through CSS variables
(`--theme-color`, `--secondary-color`, `--theme-success/warning/danger`,
neutrals) so a tenant override of `[data-tenant="..."]` retints the entire
fleet without touching component code.

```ts
import {
  SurfaceCard,
  Eyebrow,
  SectionHeader,
  Gauge,
  ProgressBar,
  StatTile,
  KpiTile,
  IconTile,
  InfoCallout,
  LoadingState,
  ErrorState,
  StatusPill,
  ResourceEmptyState,
  ModernButton,
  ModernTable,
  ModernModal,
} from "@/shared/components/ui";
```

## Architecture

### Layer 1 — surfaces & layout

| Component     | Purpose                                                                                                                                                             |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SurfaceCard` | One foundational container with six visual variants (`card`, `soft`, `inset`, `hero`, `signal-panel`, `brand-hero`). Polymorphic via `as="div" \| "button" \| "a"`. |

`SurfaceCard` replaces every ad-hoc `<div className="rounded-xl border …">`
in NOC and other dashboards. Hover/focus styles activate automatically when
`as="button"`, `as="a"`, or `onClick` is set — no separate "interactive
card" component is needed.

### Layer 2 — typography & structure

| Component       | Purpose                                                                                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `Eyebrow`       | Uppercase tracking-wide label (matches `--ls-eyebrow` 0.18em). Sizes xs/sm/md, tones muted/strong/onDark.                  |
| `SectionHeader` | Title + optional icon, count badge, description, and trailing actions row. Heading level configurable via `as` (h2/h3/h4). |

### Layer 3 — data display

| Component         | Purpose                                                                    |
| ----------------- | -------------------------------------------------------------------------- |
| `Gauge`           | Radial progress (0–100). Auto-derived semantic tone. `role="meter"`.       |
| `ProgressBar`     | Linear progress (0–100). Auto-derived semantic tone. `role="progressbar"`. |
| `StatTile`        | Compact metric: label + value + optional icon + hint. Light variant.       |
| `KpiTile`         | Dark hero variant for use inside `SurfaceCard variant="signal-panel"`.     |
| `IconTile`        | Small colored container for a Lucide icon. Six tones.                      |
| `StatusPill`      | (Pre-existing) Status badge with auto-tone-from-status.                    |
| `ModernStatsCard` | (Pre-existing) Large hero metric with trend indicator.                     |

### Layer 4 — feedback states

| Component            | Purpose                                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| `InfoCallout`        | Inline banner. Tones info/success/warning/danger. Auto-selects role status vs alert. |
| `LoadingState`       | Section-level loader with optional message. `role="status"`.                         |
| `ErrorState`         | Section-level error with retry CTA. `role="alert"`.                                  |
| `ResourceEmptyState` | (Pre-existing) Empty-state panel.                                                    |
| `Skeleton` family    | (Pre-existing) Layout-aware shimmer placeholders.                                    |

## Props design principles

1. **Tone over color.** Components accept semantic tones (`success`, `warning`,
   `danger`, `primary`, `secondary`, `neutral`) and resolve to CSS variables
   internally. Callers never pass hex codes.
2. **Auto-derivation, opt-out.** `Gauge` and `ProgressBar` derive tone from
   value (≥90 danger, ≥75 warning, else success) by default. Pass `tone="primary"`
   etc. to override.
3. **Polymorphic where useful.** `SurfaceCard` accepts `as`. The default
   element is `div`. Setting `as="button"` activates focus ring + keyboard
   activation automatically.
4. **A11y is built-in, not bolted on.**
   - Progress and gauge components emit valid ARIA progress/meter semantics.
   - InfoCallout and feedback states pick the right role/aria-live for tone.
   - StatTile/KpiTile expose `role="group"` with a labelled label+value pair.
   - Decorative icons are `aria-hidden` by default; pass `decorative={false}` to surface.
5. **Reduced motion respected.** All transitions use Tailwind's `motion-safe:`
   prefix or `prefers-reduced-motion` media query so they no-op for users who
   request it.
6. **Loading states are first-class.** Tiles, gauges, and stats accept a
   `loading` prop and render a contextually-sized skeleton. No external
   `<Skeleton />` boilerplate at the call site.
7. **Whitelabel via CSS vars only.** Tenant theme overrides
   (`[data-tenant="emerald"]` etc.) retint everything without component
   changes.

## Usage examples

### A. Hero KPI strip with map below

```tsx
<SurfaceCard variant="signal-panel" padding="lg" radius="xl">
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
    <KpiTile icon={<Globe />} label="Regions" value={7} tone="primary" />
    <KpiTile icon={<Server />} label="Total VMs" value={342} tone="primary" />
    <KpiTile icon={<Users />} label="Tenants" value={28} tone="secondary" />
    <KpiTile icon={<CheckCircle2 />} label="Healthy" value={5} tone="success" />
    <KpiTile icon={<AlertCircle />} label="Degraded" value={1} tone="warning" />
    <KpiTile icon={<AlertTriangle />} label="Critical" value={1} tone="danger" />
  </div>
  <AfricaMap regions={regions} className="mt-6" />
</SurfaceCard>
```

### B. Region detail capacity row

```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <Gauge label="CPU" value={cpu} icon={<Cpu />} className="db-surface-card rounded-xl p-4" />
  <Gauge
    label="Memory"
    value={memory}
    icon={<MemoryStick />}
    className="db-surface-card rounded-xl p-4"
  />
  <Gauge
    label="Public IPs"
    value={eipPct}
    icon={<HardDrive />}
    className="db-surface-card rounded-xl p-4"
  />
  <div className="grid grid-cols-2 gap-3">
    <StatTile label="Nodes" value="4/4" icon={<Server />} />
    <StatTile label="VMs" value={342} icon={<Server />} />
    <StatTile label="Alarms" value={1} icon={<AlertTriangle />} tone="danger" />
    <StatTile label="Tenants" value={28} icon={<Users />} />
  </div>
</div>
```

### C. List with header + empty/loading/error states

```tsx
<section className="space-y-3">
  <SectionHeader
    title="Hypervisor nodes"
    count={nodes.length}
    icon={<Server />}
    actions={
      <ModernButton variant="ghost" size="sm">
        Configure
      </ModernButton>
    }
  />
  {isLoading ? (
    <LoadingState message="Loading nodes…" />
  ) : isError ? (
    <ErrorState onRetry={refetch} />
  ) : nodes.length === 0 ? (
    <ResourceEmptyState title="No nodes reported" />
  ) : (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {nodes.map((n) => (
        <SurfaceCard key={n.id} variant="card">
          {/* node body */}
        </SurfaceCard>
      ))}
    </div>
  )}
</section>
```

### D. Clickable card (no anchor nesting)

```tsx
<SurfaceCard
  as="button"
  variant="card"
  onClick={() => navigate(`/regions/${region.code}`)}
  aria-label={`Open ${region.name} region detail`}
>
  {/* body */}
</SurfaceCard>
```

### E. Inline banner

```tsx
<InfoCallout tone="warning" title="Heads up">
  Your trial expires in 3 days.
</InfoCallout>

<InfoCallout
  tone="danger"
  title="Provisioning failed"
  actions={<ModernButton variant="outline" size="sm">Retry</ModernButton>}
>
  The provider rejected the request.
</InfoCallout>
```

## Testing

Each primitive ships with a Vitest + RTL test suite under `__tests__/`
covering:

- Default render + class composition
- ARIA attributes (role, aria-live, aria-valuenow/min/max, aria-labelledby)
- Loading/error/empty paths
- Polymorphic rendering (`SurfaceCard as="button" | "a"`)
- Keyboard/click activation

Run with:

```bash
npm run test --workspace=web -- src/shared/components/ui/__tests__
```

## Whitelabel verification

Set `data-tenant` on `<html>` to retint the entire fleet:

```html
<html data-tenant="emerald">
  <!-- or "indigo", "sunset" -->
</html>
```

Every primitive (gauge fills, KPI accents, status pills, info callouts,
surface borders, focus rings) updates without re-rendering React.

## Migration matrix — replace ad-hoc patterns with primitives

When refactoring an existing dashboard page, search for these patterns and
swap them for the listed primitive:

| You have today                                                                                   | Replace with                                                                      |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `<div className="rounded-xl border border-gray-200 bg-white p-4">`                               | `<SurfaceCard variant="card" padding="md">`                                       |
| `<div className="rounded-2xl bg-gradient-to-br from-slate-900 …">` (dark hero)                   | `<SurfaceCard variant="signal-panel" padding="lg" radius="xl">`                   |
| `<Link to="…" className="rounded-xl border …">…</Link>`                                          | `<SurfaceCard as="a" href="…">` or `<SurfaceCard as="button" onClick={navigate}>` |
| `<span className="rounded-full bg-emerald-100 …">active</span>`                                  | `<StatusPill tone="success" label="active" />`                                    |
| Inline progress bar (`<div className="bg-gray-100 h-1.5"><div style={{width: `${pct}%`}} />…`)   | `<ProgressBar value={pct} label="…" />`                                           |
| Hand-rolled radial SVG progress                                                                  | `<Gauge value={pct} label="…" />`                                                 |
| `<div><div className="text-[10px] uppercase">CPU</div><div className="text-2xl">256</div></div>` | `<StatTile label="CPU" value={256} />`                                            |
| Same on a dark hero                                                                              | `<KpiTile label="CPU" value={256} tone="primary" />`                              |
| `<div className="bg-blue-50 border border-blue-200 …">` info banner                              | `<InfoCallout tone="info">…</InfoCallout>`                                        |
| Spinner inside a section while loading                                                           | `<LoadingState message="…" />` (default) or `<LoadingState variant="inline" />`   |
| 500 / "Couldn't load" panel                                                                      | `<ErrorState onRetry={refetch} />`                                                |
| `<dl><dt><dd>…` ad-hoc                                                                           | `<DescriptionList items={[…]} />`                                                 |
| Title row with count + actions                                                                   | `<SectionHeader title="…" count={n} actions={…} />`                               |
| `<span className="text-[10px] uppercase tracking-wider">`                                        | `<Eyebrow>…</Eyebrow>`                                                            |
| Hover-only icon-button hint                                                                      | wrap with `<Tooltip content="…"><IconButton …/></Tooltip>`                        |
| "..." overflow menu                                                                              | `<DropdownMenu trigger={…} items={…} />`                                          |
| Tabs hand-rolled with manual keyboard handling                                                   | `<Tabs items={…} renderPanel={…} />`                                              |
| User avatar with initials fallback inline                                                        | `<Avatar name={user.name} src={user.avatarUrl} />`                                |
| `<nav>` chevron-separated trail                                                                  | `<Breadcrumbs items={…} />`                                                       |
| Filter pill / multi-select chip                                                                  | `<Chip selected={s} onClick={toggle} />` (or with `onDismiss`)                    |
| Coloured icon container `<div className="bg-blue-100 text-blue-600 h-9 w-9 rounded-lg">`         | `<IconTile icon={…} tone="primary" />`                                            |

## Decision tree

**Container?**

- Need a brand-themed surface → `SurfaceCard`. Pick variant: `card` (default), `soft` (muted), `inset` (frosted), `hero` (light gradient), `signal-panel` (dark), `brand-hero` (full bleed).
- Need just an empty container with default border → `ModernCard` (legacy, accept anything you would). Prefer `SurfaceCard` for new code.

**Metric?**

- Big hero metric with trend indicator → `ModernStatsCard` (existing).
- Compact tile in a grid → `StatTile`.
- Compact tile inside a dark hero → `KpiTile`.

**Progress?**

- Linear bar → `ProgressBar`.
- Radial dial → `Gauge`.

**Status / label?**

- "active / pending / failed" status → `StatusPill` (auto-derives tone).
- Filter pill the user toggles → `Chip` (interactive, supports dismiss).
- Uppercase tracking label above a value or input → `Eyebrow`.

**Feedback?**

- Inline informational banner → `InfoCallout` (tone=info/success/warning/danger; supports `onDismiss`).
- Section is loading → `LoadingState` (default surface) or `LoadingState variant="inline"` for cells.
- Section failed to load → `ErrorState` (auto-focuses retry).
- Section is empty → `ResourceEmptyState`.

**Layout?**

- Section title with count + actions → `SectionHeader`.
- Key/value pairs → `DescriptionList`.
- Hierarchical nav → `Breadcrumbs`.

**Overlays?**

- Help text on focus/hover → `Tooltip`.
- Action menu → `DropdownMenu`.
- Tabbed content → `Tabs`.
- User avatar → `Avatar`.

## Adding a new primitive

1. Place under `web/src/shared/components/ui/<Name>.tsx`. Default-export.
2. Wrap in `memo()`.
3. Drive every colour via `rgb(var(--theme-…))` / `var(--theme-…)`. Never hex.
4. Apply `font-outfit` (already global on body, but explicit on cards/heroes).
5. Include `prefers-reduced-motion` handling for any animation.
6. Export the component + its types from `ui/index.ts`.
7. Add a test under `__tests__/<Name>.test.tsx` covering ARIA + render +
   loading paths.
8. Update this README's table.
