# UniCloud Web — Frontend Context

React + Vite + TypeScript SPA for the UniCloud Africa platform. Three dashboards (admin / tenant / client) share component primitives and hooks.

## Stack

- **React 18** with hooks
- **Vite** (dev server + bundler) — `vite.config.ts`
- **TypeScript** (strict-ish — large pre-existing error baseline, see below)
- **TanStack React Query** for server state / mutations
- **Zustand** for client state (auth session, branding)
- **react-router-dom** for routing
- **Tailwind CSS v4** (`@import "tailwindcss"`)
- **vitest** + `@testing-library/react` + `jsdom` for tests
- **ESLint** + Prettier (pre-commit via `lint-staged`)

## Commands

```bash
npm run dev           # Vite dev server on :5173
npm run build         # production build
npm test              # vitest run (one-shot)
npm run test:watch    # vitest watch mode
npx vitest run path/to/file.test.tsx   # single file
npm run typecheck     # full TS check (slow, runs in chunks)
npm run lint          # ESLint with cache
```

For typecheck on a single file or focused area, `npx tsc --noEmit` is faster than the chunked typecheck scripts.

## Path aliases

Configured in **both** `vite.config.ts` and `vitest.config.ts` (must be kept in lockstep):

| Alias | Resolves to |
|---|---|
| `@/features` | `src/features` |
| `@/shared` | `src/shared` |
| `@/stores` | `src/stores` |
| `@/hooks` | `src/hooks` |
| `@/utils` | `src/utils` |
| `@/components` | `src/components` |
| `@/styles` | `src/styles` |
| `@/types` | `src/types` |
| `@/services` | `src/services` |
| `@/config` | `src/config` |
| `@/docs` | `src/docs` |
| `@/lib` | `src/lib` |

**Gotcha — there's NO alias for `@/index`.** Files in `src/index/` (e.g. `silent.ts`, `admin/`, `client/`, `tenant/`) must be imported via relative paths. When mocking them in tests via `vi.mock`, use the relative path that matches the SUT's import specifier — `@/index/...` won't resolve.

## Test setup

- Tests live in `**/__tests__/*.{test,spec}.{ts,tsx}` alongside source.
- Setup file: `src/test/setup.ts`. Environment: `jsdom`.
- `vitest.config.ts` mirrors `vite.config.ts` aliases — when adding a new alias, update both.

### Common pattern: rendering a component that uses React Query

Components that internally call `useQuery` / `useMutation` (directly or transitively) need a `QueryClientProvider`. Standard wrapper:

```ts
function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}
```

Use this for any component that bottoms out in `useFormatPrice`, `useFetchList`, `useFetchById`, etc.

### Common pattern: mocking the silent API client

`useFormatPrice` and resource hooks call `silentApi` from `src/index/silent.ts`. To mock:

```ts
vi.mock("@/index/silent", () => ({ default: vi.fn() }));
// AND the relative-path form, because there is no @/index alias:
vi.mock("../../../../index/silent", () => ({ default: vi.fn() }));
```

Adjust the relative-path depth to match the test file's location.

### Mock state lifecycle

When a single test file calls a mocked API (even legitimately) earlier in its execution, later assertions like `expect(mockFn).not.toHaveBeenCalled()` will fail because the mock state persists across tests. Use:

```ts
beforeEach(() => {
  mockSilentApi.mockReset();
});
```

## API client architecture

Three audiences (admin / tenant / client) each have their own URL prefix and HTTP client. The current context is resolved at runtime:

```ts
import { useApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "@/shared/api/apiRegistry";

const { context } = useApiContext();   // "admin" | "tenant" | "client"
const entry = apiRegistry[context];     // { silentApi, toastApi, urlPrefix }

await entry.silentApi.post(`${entry.urlPrefix}/some-resource`, payload);
```

- `silentApi` — silent failures, no toasts (used for queries / mutations that have their own error handling)
- `toastApi` — auto-toasts errors via `ToastUtils`
- `urlPrefix` — `/api/v1/admin` | `/api/v1/tenant` | `/api/v1/business` (yes, "business" for client — historical naming)

Resource hooks built via `createResourceHooks({ resourcePath, queryKeyBase })` automatically scope to the current context and expose `useFetchList`, `useFetchById`, `useCreate`, `useUpdate`, `useDelete`, `queryKeys`.

## Money

- **Source of truth**: backend response carries `amount` + `currency` (ISO 4217). Never assume a currency from the symbol.
- **Rendering**: `useFormatPrice(amount, sourceCurrency)` returns `{ formatted, displayAmount, displayCurrency, isLoading, fallback }`. Reads user preference from `useCurrency()`, fetches published FX rate (cached 1h) for cross-currency, falls back to source currency when no rate is published.
- **Component**: `<PriceLabel amount={...} sourceCurrency={...} />` is the canonical primitive. Use it instead of inline string formatting.
- **Aggregates** (sums across rows): bucket by currency first, render the dominant bucket, flag mixed-currency with a hint. Never sum across currencies blindly.

## Async actions

`useAsyncAction()` wraps async operations with consistent loading / error state + watchdog:

```ts
const action = useAsyncAction();

await action.run(
  async () => { ... },
  {
    successToast: "Saved!",
    fallbackErrorMessage: "Could not save.",
    rethrow: false,
  },
);
// action.isPending / action.status / action.errorMessage
```

The watchdog auto-resets stuck `pending` state after a timeout — protects against abandoned promises freezing the UI. If you find yourself reaching for `isSubmittingRef` to guard against double-submits, also short-circuit on `action.isPending`:

```ts
const handleSubmit = useCallback(async () => {
  if (action.isPending) return;        // React batching can collapse rapid clicks
  await action.run(...);
}, [action]);
```

## Toasts

```ts
import ToastUtils from "@/utils/toastUtil";

ToastUtils.success("Saved");
ToastUtils.error("Failed", { description: "details..." });
```

## Heavy provisioning hooks pattern

Wizards like `useDatabaseProvisioningLogic.ts` are intentionally large (1000+ lines). They centralise:

- Form state (`useState`)
- Server data (`useFetchRegions`, `useFetchAvailableEngines`, etc.)
- Derived values (`useMemo`)
- Submit handlers (`useCallback` + `useAsyncAction`)

**Convention**: pure helper functions that the hook uses internally get **exported** at module scope so they're unit-testable without spinning up the full hook. Examples in `useDatabaseProvisioningLogic.ts`:

- `filterSameProviderReplicaAzs(...)` — legacy filter
- `tagReplicaAzModes(...)` — mode-aware tagger
- `AzOption`, `ReplicaAzOption`, `ReplicaMode` types

When you add logic that's testable in isolation, follow this pattern. Don't make tests fight to instantiate the whole hook.

## Auth store

Zustand store at `src/stores/authStore.ts`. The store holds session data for all three roles; only one is "active" at a time. Switching roles uses `clearAuthSessionsExcept(role)` to wipe the others.

Key fields:
- `userEmail`, `twoFactorRequired`, `isAuthenticated`
- `setSession({ user, role, tenant, token, ... })`
- `setUserEmail`, `clearUserEmail`
- `setTwoFactorRequired`, `clearTwoFactorRequirement`

The API client (`createApiClient.ts`) automatically flips `twoFactorRequired` to `true` when any response carries `two_factor_required: true`.

## Branding theme

White-label per tenant:

```ts
const { data: branding } = usePlatformBrandingTheme();     // logged-in flow
const { data: branding } = usePublicBrandingTheme({ domain, subdomain });  // pre-auth flow

useApplyBrandingTheme(branding, { fallbackLogo, updateFavicon: true });
```

Reads tenant-specific colors, logo, company name. CSS vars (`--theme-color`, `--theme-heading-color`, `--theme-text-color`, etc.) get set on `:root`. Use these vars in components instead of hardcoded colors.

## TypeScript error noise

The codebase has a baseline of **pre-existing TS errors** (mostly `unknown` types from `Record<string, unknown>` API responses that don't narrow cleanly). When you make changes:

1. Run `npx tsc --noEmit` and capture the error list
2. **Don't auto-fix unrelated errors** — they were there before your change
3. Check that your changes didn't add new errors at new line numbers

If you're uncertain whether an error is new or pre-existing, briefly stash your changes (`git stash -- <file>`) and re-run `tsc` to compare. Don't blanket-fix; surgical only.

## Conventions to remember (learned the hard way)

- **OTP / verification inputs** (`VerificationCodeInput`): when the parent clears the `code` prop, the first input gets focus automatically. Auth pages should send the typed code under all field names (`otp`, `code`, `google2fa_code`, `two_factor_code`) so the BE picks the right one regardless of FE flag state. Clear the code in `onError` — don't rely on `useEffect([twoFactorRequired])`, which doesn't fire when the flag was already true.
- **Pricing displays** must source line items + totals from the same snapshot. Never render lines from `quoteResult.lines` and totals from `orderReceipt.pricing_breakdown` — they will desync. Use `pricingSummary.lineItems` (already kept in sync by the hook).
- **Re-entrancy guards**: React event batching can dispatch multiple `onClick` handlers within a single render frame. Disabled-button props update on the next render — too late. Short-circuit at the top of submit handlers on `action.isPending`.

## When you can't see something

If you don't see a frontend change reflected:
- `npm run dev` not running? Start it.
- Vite HMR cache stale? Hard-refresh the browser (`Cmd+Shift+R`).
- New alias added? Restart `npm run dev` — alias config is read on boot.
- Test still failing after edit? `npx vitest run --no-cache <path>` to bust the vitest cache.
