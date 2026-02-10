# Design System Foundation Checklist

This checklist defines the first implementation phase for frontend quality stabilization.
Scope is foundation only: tokens, primitives, and usage guardrails.

## 1) Token Source Of Truth

- [ ] Declare CSS variable tokens as the only runtime source in `src/index.css`.
- [ ] Keep `src/styles/designTokens.ts` as a typed view of those CSS variables (no independent values).
- [ ] Ensure `tailwind.config.js` maps to CSS variables only (no hardcoded fallback palettes).
- [ ] Document the token contract in `src/styles/README.md` with categories:
  - color, typography, spacing, radius, shadow, z-index, motion.

## 2) Primitive Contract

- [ ] Standardize primitives in `src/shared/components/ui`:
  - `ModernButton.tsx`
  - `ModernInput.tsx`
  - `ModernSelect.tsx`
  - `ModernTextarea.tsx`
  - `ModernCard.tsx`
  - `ModernModal.tsx`
  - `ModernTable.tsx`
  - `StatusPill.tsx`
- [ ] Add a consistent prop contract across these primitives:
  - `size`, `variant`, `disabled`, `loading`, `className`, `data-testid`.
- [ ] Remove style drift between inline-style and utility-class approaches where possible.
- [ ] Keep one export surface in `src/shared/components/ui/index.ts`.

## 3) Layout Shell Baseline

- [ ] Define reusable shell classes in `src/index.css` for:
  - page container
  - section spacing
  - card grid
  - action row
- [ ] Use these shell classes in at least one page per area:
  - admin (`src/adminDashboard/pages/AdminDashboard.tsx`)
  - tenant (`src/tenantDashboard/pages/TenantPricingOverrides.tsx`)
  - client (`src/clientDashboard/pages/ClientProjectCreate.tsx`)

## 4) Governance And Drift Control

- [ ] Keep `scripts/theme-audit.mjs` as CI gate for token misuse.
- [ ] Tighten audit to flag non-token RGB/RGBA usage in class strings and inline style objects.
- [ ] Add npm scripts:
  - `theme:audit`
  - `theme:audit:strict`
- [ ] Run strict mode in CI before merge.

## 5) Adoption Targets (Phase-1 Exit Criteria)

- [ ] 100% of new UI work uses primitives from `src/shared/components/ui`.
- [ ] No new direct hardcoded color/font values in `src/**`.
- [ ] At least 3 high-traffic pages migrated to the shell + primitive baseline.
- [ ] Theme audit strict passes in CI.

## First Implementation Slice (Start Here)

- [ ] Normalize `ModernButton`, `ModernInput`, and `ModernCard` contracts first.
- [ ] Update these pages to consume only normalized props:
  - `src/adminDashboard/pages/AdminDashboard.tsx`
  - `src/dashboard/pages/ProjectCreate.tsx`
  - `src/clientDashboard/pages/ClientProjectCreate.tsx`
- [ ] Validate with:
  - `npm run lint`
  - `npm run typecheck`
  - `node scripts/theme-audit.mjs --strict`
