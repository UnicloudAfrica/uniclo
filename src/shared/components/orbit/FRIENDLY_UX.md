# Orbit — friendly UX guide

> The brand promise is: **infrastructure tools that don't make you feel
> stupid for not being a cloud engineer.**

This file documents the copy + design rules every Orbit page follows.

## The rule of "two registers"

Every Orbit page reads at two levels at once:

1. **Plain English** — the headline, the buttons, the success messages.
   Reading age 12. No jargon. The kind of language you'd use to explain
   what's happening to a non-technical co-founder over coffee.

2. **Technical anchor** — a smaller secondary line, a tooltip, or a
   collapsible "advanced" panel that shows the underlying technical fact.
   For tenant ops engineers who DO know the jargon and want to confirm
   the system is doing what they expect.

Both audiences feel respected. Neither feels patronized.

## Copy rules — the do/don't

| Don't                                     | Do                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| "Initiating BMR provisioning saga"        | "Setting up your new server"                                                |
| "RPO breach detected on tenant_id 4f3a"   | "Some changes might not have made it across"                                |
| "Awaiting cutover preflight verification" | "Just running the last checks"                                              |
| "Failed: 503 from upstream"               | "Couldn't reach the resilience service. We're trying again."                |
| "Click Save to persist changes"           | "Save your changes"                                                         |
| "Bidirectional sync configuration"        | "Two-way sync settings"                                                     |
| "Cancel" (alone, on a destructive action) | "No, cancel that" / "Don't do it"                                           |
| "Submit"                                  | The verb of what's happening: "Start recovery", "Save changes", "Run drill" |

## When to use which primitive

| Situation                                 | Use                                                                          |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| First time someone lands on a feature     | `<HeroBanner mode="spotlight">` with illustration + primary CTA              |
| Returning user, has data                  | `<HeroBanner mode="calm">` (smaller, no CTA) at the top of the page          |
| Multi-step form / wizard                  | `<StoryStep>` per step (BMR new, cutover advance, recovery plan builder)     |
| A long-running saga finished successfully | `<SuccessMoment>` with confetti + "do the next thing" CTA                    |
| A technical term appears in copy          | Wrap with `<FriendlyTooltip mode="inline" term="…" definition="…" />`        |
| A label needs an explainer icon           | `<FriendlyTooltip mode="icon" />` next to the label                          |
| Server data view                          | Wrap with `<ResourceShell loading={…} error={…} empty={…}>`                  |
| Destructive action button                 | `<AsyncButton variant="danger">` + `<ConfirmActionDialog severity="danger">` |
| Show resource state                       | `<StatusBadge tone="…">` with a friendly label                               |
| Show overall mood at a glance             | `<MoodIndicator mood="…">` in headers/cards                                  |
| Show progress through a saga              | `<StateMachineProgress phases={…} current={…}>`                              |

## When to NOT use the wow primitives

The friendly mode is great in these places:

- ✅ First-run experiences and onboarding
- ✅ Wizards and guided flows
- ✅ Success / failure moments
- ✅ Empty states
- ✅ Customer-facing dashboards (tenant + client roles)
- ✅ Settings pages with rare-but-important actions

**Do NOT** layer wow primitives onto:

- ❌ Dense data tables (admin reports, billing line items, audit log)
- ❌ Developer pages (API keys, webhooks, usage)
- ❌ Modals that fire 50× per session (e.g., "edit field" inline editor)

The principle: **wow primitives are for moments, not steady-state.** A
celebration after every save is not wow, it's noise.

## Reduced motion — what changes

Every primitive that animates checks `usePrefersReducedMotion()` and
collapses to one of:

- **No animation** (transition: none) — the default fallback
- **Crossfade only** (opacity transition) — for state transitions where
  position would otherwise be jarring
- **Instant** — for confetti and overshoot animations

Test every new component by toggling the OS preference:

- macOS: System Settings → Accessibility → Display → Reduce motion
- Windows: Settings → Accessibility → Visual effects → Animation effects
- Linux: GNOME Tweaks → General → Animations

The component must remain fully functional and visually coherent.

## High-contrast mode

Every Orbit component has been spot-checked for WCAG AA contrast in both
light and dark themes. When adding a new primitive:

1. Verify text contrast ≥ 4.5:1 against background
2. Verify icon-only controls have `aria-label`
3. Verify focus rings are visible on all interactive elements
4. Verify color is never the sole signal for state (always pair with
   icon or text)

## Brand tokens — use the platform theme system, not hardcoded colors

The platform ships a CSS-variable-based theme system that flips brand colors
per tenant (UniCloud blue · Verdant Cloud emerald · Orbit indigo · Sahara
Stack orange). Every Orbit primitive **must** route through it so a tenant
choosing a different theme sees consistent visuals end-to-end.

**Product brand label** comes from `web/src/shared/branding.ts`:

```ts
import { RESILIENCE } from "@/shared/components/orbit";
// RESILIENCE === "Orbit" by default; flips to white-label brand via env var
```

**Color tokens** — use Tailwind's mapped scales (defined in
`web/tailwind.config.js`). Tailwind already remaps `blue`/`emerald`/
`red`/`amber`/`gray` through the platform's CSS variables, so any of
these forms auto-theme:

| Use this                                                 | Resolves to                               | Example                                                                  |
| -------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| `bg-primary-500`, `text-primary-700`, `from-primary-500` | `var(--theme-color-*)` — flips per tenant | Primary buttons, focus rings, hero accents                               |
| `bg-blue-500`                                            | Same as `bg-primary-500` (alias)          | Same                                                                     |
| `bg-success-500`, `text-success-700`                     | `var(--theme-success-*)`                  | Healthy/done states                                                      |
| `bg-emerald-500`                                         | Same as `bg-success-500` (alias)          | Same                                                                     |
| `bg-warning-500`                                         | `var(--theme-warning-*)`                  | Awaiting input, degraded                                                 |
| `bg-amber-500`                                           | Same as `bg-warning-500` (alias)          | Same                                                                     |
| `bg-danger-500`                                          | `var(--theme-danger-*)`                   | Failed, destructive actions                                              |
| `bg-red-500`                                             | Same as `bg-danger-500` (alias)           | Same                                                                     |
| `bg-gray-200`, `text-gray-500`                           | `var(--theme-neutral-*)`                  | All neutrals (slate/zinc/stone aliases too)                              |
| `bg-surface-card`                                        | `var(--surface-card)`                     | Card / dialog backgrounds — auto dark mode                               |
| `bg-surface-page`                                        | `var(--surface-page)`                     | Page background                                                          |
| `bg-surface-alt`                                         | `var(--theme-surface-alt)`                | Subtle alternative surface                                               |
| arbitrary `text-[var(--secondary-color)]`                | The bare secondary accent (no scale)      | Sparkles, eyebrow text on dark hero — only the bare var flips per tenant |

**Convenience tokens for brand-tinted backgrounds** (already defined in
the platform theme):

| Token                       | Use                                               |
| --------------------------- | ------------------------------------------------- |
| `var(--theme-color-10)`     | 12 % brand alpha — hover backgrounds, soft tints  |
| `var(--theme-color-20)`     | 22 % brand alpha — pressed states, badges         |
| `var(--theme-tag-bg)`       | Pre-tinted tag/pill background                    |
| `var(--theme-tag-text)`     | Pre-paired text color for tag-bg                  |
| `var(--theme-focus-ring)`   | Focus-ring color matching the active tenant theme |
| `var(--theme-border-color)` | Subtle brand-tinted border                        |

**Anti-pattern — DO NOT do this:**

```tsx
// ❌ Bypasses theme system. Stays navy when tenant picks Verdant theme.
<div className="bg-[#0A1F44] text-[#F4A261]">…</div>

// ✅ Auto-themes per tenant.
<div className="bg-primary-700 text-secondary-500">…</div>
```

The only exception is `var(--secondary-color)` accessed via Tailwind's
arbitrary-value syntax — `text-[var(--secondary-color)]`. The bare
secondary color is what flips per tenant; its scale is partially defined
only for the default theme.

## How to add a new wow primitive

1. Create `web/src/shared/components/orbit/<Name>.tsx`
2. Import motion tokens from `./motion.ts` (never hardcode durations/easings)
3. Wrap any animation in `usePrefersReducedMotion()` guard
4. Add ARIA: role, aria-label, focus management, keyboard support
5. Use platform theme tokens — `bg-primary-500`, `text-success-700`, `border-warning-200`, or arbitrary `var(--theme-color-rgb)` / `var(--secondary-color)` for the bare brand vars. Never hardcode hex.
6. Export from `./index.ts`
7. Add a `<Name>` row to the "When to use which primitive" table above
8. Add to `code-audit/component-coverage.md` (TBD — gap-tracker entry)

## Common a11y gotchas — pre-flight checklist

Before declaring a wow component done:

- [ ] Tab order makes sense
- [ ] Focus ring visible in all themes
- [ ] Esc dismisses anything dismissible
- [ ] aria-live for state changes screen readers should hear
- [ ] aria-busy while async
- [ ] Reduced-motion path tested
- [ ] High-contrast / dark-mode tested
- [ ] Mobile (iOS Safari) tested — modals, tooltips, focus traps
- [ ] No layout shift between loading → loaded states (`minHeight` on shells)
