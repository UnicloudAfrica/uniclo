# UniCloud Africa -- Frontend Architecture

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| UI Framework | React | 19.x | Component rendering and lifecycle |
| Build Tool | Vite | latest | Dev server, HMR, production builds |
| Language | TypeScript | strict | Type safety across the codebase |
| State Management | Zustand | 5.x | Lightweight stores with persist middleware |
| Server State | TanStack React Query | 5.x | Data fetching, caching, mutations |
| Styling | Tailwind CSS | utility-first | Layout and component styling |
| Routing | React Router DOM | 6.x | Client-side routing with nested layouts |
| Animation | Framer Motion | 12.x | Page transitions (`AnimatePresence`) |
| Realtime | Laravel Echo + Pusher | 2.x / 8.x | WebSocket broadcasting via Reverb |
| Toast Notifications | Sonner | 2.x | Top-right rich toast notifications |
| Charts | Recharts | 3.x | Dashboard analytics visualisation |
| Icons | Lucide React | 0.576+ | SVG icon library |
| SEO | @dr.pogodin/react-helmet | 3.x | Document head management |
| PDF | jsPDF + jspdf-autotable | 3.x / 5.x | Client-side PDF generation |
| Payments | Paystack (inline-js + react-paystack) | 2.x / 6.x | Payment processing integration |
| Rich Text | TinyMCE React | 6.x | CMS content editing |
| File Handling | react-dropzone | 14.x | Drag-and-drop file uploads |
| Spreadsheets | xlsx (SheetJS) | 0.18 | Import/export spreadsheet data |

## Entry Point

```
src/main.tsx
```

The application boots in `main.tsx` which wraps the `<App />` component with the following provider hierarchy:

```
React.StrictMode
  -> BrowserRouter
    -> HelmetProvider
      -> QueryProvider (TanStack React Query)
        -> Toaster (Sonner, position="top-right")
          -> ContextProvider
            -> App
```

The `QueryProvider` at `src/utils/queryProvider.ts` initialises a shared `QueryClient` instance used by all React Query hooks.

## Application Shell (`src/App.tsx`)

`App.tsx` determines the layout based on the current URL path:

- Paths starting with `/admin-dashboard` activate `AdminShell` (sidebar + header layout for platform admins).
- All routes are rendered inside `<AnimatePresence>` for animated page transitions.
- Subdomain detection via `getSubdomain()` at `src/utils/getSubdomain.ts` determines whether the request is on a tenant subdomain (e.g. `acme.unicloudafrica.com`).

---

## State Management -- Zustand Auth Stores

All three persona-specific auth stores are created using a shared factory function.

### Factory: `src/stores/createAuthStore.ts`

`createAuthStoreFactory(config)` produces a fully-typed Zustand store with:

- **Persist middleware** -- serialises selected fields to `localStorage` under the configured `storageKey`.
- **Hydration tracking** -- `hasHydrated` flag prevents premature route guard evaluation.
- **Tenant context inference** -- `inferTenantContext()` reads `window.location.hostname` to determine whether the user is on the central domain (`unicloudafrica.com` / `localhost`) or a tenant subdomain.
- **Session helpers** -- `setSession()`, `clearSession()`, `resolveAuthFlag()`.
- **Extensible** -- each store can inject role-specific methods via `extraMethods` and persist additional fields via `extraPartializeFields`.

### Store Instances

| Store | File | localStorage Key | Default Role | Tenant Context |
|-------|------|------------------|-------------|----------------|
| `useAdminAuthStore` | `src/stores/adminAuthStore.ts` | `unicloud_admin_auth` | `"admin"` | Yes |
| `useTenantAuthStore` | `src/stores/tenantAuthStore.ts` | `unicloud_tenant_auth` | `"tenant"` | Yes |
| `useClientAuthStore` | `src/stores/clientAuthStore.ts` | `unicloud_client_auth` | `"client"` | No |

#### Admin Store Extras

- `setAvailableTenants(tenants)` -- stores the list of tenants the admin can manage.
- `switchTenant(slug)` -- navigates the browser to `{slug}.unicloudafrica.com`.
- `getEffectiveRole()` -- returns `"admin"` on central domain, `"tenant"` on subdomains.
- `initializeTenantContext()` / `updateContext(context)` -- refreshes hostname-derived context.

#### Tenant Store Extras

- `setDomain(domain)` / `setIsCentralDomain(value)` / `setCurrentDomain(value)`.

#### Client Store

- Minimal configuration; does not use tenant context (`useTenantContext: false`).
- Provides simple static auth headers (no `X-Tenant-Slug` header).

### Session Utilities: `src/stores/sessionUtils.ts`

| Function | Purpose |
|----------|---------|
| `resolveActivePersona()` | Returns the first authenticated store (`admin` > `tenant` > `client`) |
| `clearAuthSessionsExcept(role)` | Clears all stores except the given role |
| `clearAllAuthSessions()` | Resets every auth store |
| `logoutActiveSession()` | Calls the backend logout endpoint, then clears all stores |

---

## API Client Architecture

### Factory: `src/utils/createApiClient.ts`

Three factory functions produce fetch-based API clients:

| Factory | Content Type | Use Case |
|---------|-------------|----------|
| `createApiClient` | `application/json` | Standard JSON requests |
| `createMultipartApiClient` | `multipart/form-data` | File uploads |
| `createFileApiClient` | Binary-aware | Downloading images, PDFs, CSV |

All factories share the same behaviour:

1. Resolve auth headers from the bound Zustand store (`credentials: "include"` for cookie-based auth).
2. On **2FA required** (`403` + `X-Auth-Status: two-factor-required`), redirect to `/verify-mail` or `/verify-admin-mail`.
3. On **401/403**, clear the session and redirect to the configured login path via `handleAuthRedirect()`.
4. Optionally show success/error toast notifications via `ToastUtils`.

### Client Instances

Located under `src/index/`:

| File | Base URL | Auth Store | Toasts | Description |
|------|----------|-----------|--------|-------------|
| `src/index/api.ts` | `config.baseURL` (`/api/v1`) | adminAuthStore | Yes | Shared persona-aware client |
| `src/index/silent.ts` | `config.baseURL` | tenantAuthStore | No | Silent tenant client (no toasts) |
| `src/index/admin/api.ts` | `config.adminURL` (`/admin/v1`) | adminAuthStore | Yes | Admin API (with toast) |
| `src/index/admin/silent.ts` | `config.adminURL` | adminAuthStore | No | Admin API (silent) |
| `src/index/admin/apiAdminforUser.ts` | `config.baseURL` | adminAuthStore | Yes | Admin accessing user-level endpoints |
| `src/index/admin/settingsApi.ts` | `config.baseURL` | adminAuthStore | Yes | Shared settings endpoints |
| `src/index/admin/silentSettingsApi.ts` | `config.baseURL` | adminAuthStore | No | Silent settings client |
| `src/index/admin/multipartApi.ts` | `config.adminURL` | adminAuthStore | Yes | Admin file uploads |
| `src/index/admin/fileapi.ts` | `config.adminURL` | adminAuthStore | -- | Admin binary downloads |
| `src/index/admin/lapapi.ts` | `config.adminURL` | adminAuthStore | -- | Admin legacy API |
| `src/index/tenant/tenantApi.ts` | `config.tenantURL` (`/tenant/v1`) | tenantAuthStore | Yes | Tenant-scoped API |
| `src/index/tenant/silentTenant.ts` | `config.tenantURL` | tenantAuthStore | No | Tenant silent client |
| `src/index/tenant/multipartTenantApi.ts` | `config.tenantURL` | tenantAuthStore | Yes | Tenant file uploads |
| `src/index/tenant/fileapi.ts` | `config.tenantURL` | tenantAuthStore | -- | Tenant binary downloads |
| `src/index/client/api.ts` | `config.baseURL` | clientAuthStore | Yes | Client-scoped API |
| `src/index/client/silent.ts` | `config.baseURL` | clientAuthStore | No | Client silent API |

### Configuration: `src/config.ts`

```typescript
const config = {
  baseURL:   `${VITE_API_USER_BASE_URL}/api/v1`,
  adminURL:  `${VITE_API_USER_BASE_URL}/admin/v1`,
  tenantURL: `${VITE_API_USER_BASE_URL}/tenant/v1`,
};
```

The `VITE_API_USER_BASE_URL` environment variable points to the Laravel API server.

---

## Route Structure

All routes are defined as React Router v6 `<Route>` elements and composed in `App.tsx`.

### Route Files

| File | Prefix | Guard | Layout |
|------|--------|-------|--------|
| `src/routes/PublicRoutes.tsx` | `/`, `/about`, `/sign-in`, `/sign-up`, etc. | None | Public marketing layout |
| `src/routes/AdminRoutes.tsx` | `/admin-dashboard/*`, `/admin-signin` | None (manual check) | `AdminShell` |
| `src/routes/TenantRoutes.tsx` | `/dashboard/*` | `TenantRoute` | `TenantDashboardLayout` |
| `src/routes/ClientRoutes.tsx` | `/client-dashboard/*` | `ClientRoute` | `ClientDashboardLayout` |

### Key Route Paths

**Public**
- `/` -- Landing page
- `/sign-in` -- Tenant/Client login
- `/sign-up` -- Tenant/Client registration
- `/tenant-sign-in` / `/tenant-sign-up` -- Tenant-specific auth pages
- `/forgot-password`, `/reset-password`, `/verify-mail` -- Auth flows

**Admin** (`/admin-dashboard/...`)
- `/admin-signin`, `/verify-admin-mail` -- Admin auth
- `/admin-dashboard` -- Admin home
- `/admin-dashboard/partners`, `/admin-dashboard/clients` -- Tenant and client management
- `/admin-dashboard/regions`, `/admin-dashboard/region-approvals` -- Region management
- `/admin-dashboard/instances`, `/admin-dashboard/create-instance` -- Instance management
- `/admin-dashboard/object-storage` -- Object storage management
- `/admin-dashboard/pricing`, `/admin-dashboard/pricing-calculator` -- Pricing config
- `/admin-dashboard/wallet`, `/admin-dashboard/settlements`, `/admin-dashboard/payouts` -- Billing
- `/admin-dashboard/analytics` -- Analytics dashboard
- `/admin-dashboard/tickets` -- Support tickets
- `/admin-dashboard/infrastructure/*` -- VPC, subnets, security groups, etc.

**Tenant** (`/dashboard/...`)
- `/dashboard` -- Tenant home
- `/dashboard/clients`, `/dashboard/partners` -- Customer management
- `/dashboard/projects`, `/dashboard/instances`, `/dashboard/create-instance` -- Infrastructure
- `/dashboard/object-storage` -- Object storage
- `/dashboard/pricing-overrides`, `/dashboard/pricing-calculator` -- Pricing
- `/dashboard/revenue`, `/dashboard/billing`, `/dashboard/invoices`, `/dashboard/payouts` -- Billing
- `/dashboard/support` -- Support tickets
- `/dashboard/infrastructure/*` -- VPC networking resources
- `/dashboard/onboarding` -- Onboarding wizard (forced when status != "completed")
- `/dashboard/region-requests` -- Region access requests

**Client** (`/client-dashboard/...`)
- `/client-dashboard` -- Client home
- `/client-dashboard/projects`, `/client-dashboard/instances` -- Infrastructure
- `/client-dashboard/object-storage` -- Object storage
- `/client-dashboard/billing`, `/client-dashboard/orders-payments` -- Billing
- `/client-dashboard/support` -- Support tickets
- `/client-dashboard/infrastructure/*` -- VPC networking resources

---

## Hook Patterns

All data fetching and mutations use TanStack React Query hooks. Hooks are organised by domain:

### Shared Hooks (`src/hooks/`)

| File | Domain |
|------|--------|
| `authHooks.ts` | Login, register, verify email, OTP, 2FA setup/enable/disable |
| `onboardingHooks.ts` | Tenant onboarding state and step management |
| `brandingHooks.ts` | White-label branding (logo, colors, name) |
| `regionHooks.ts` | Region listing and management |
| `walletHooks.ts` | Wallet balance and top-up |
| `subscriptionHooks.ts` | Subscription plan management |
| `settingsHooks.ts` | Account settings (profile, password, 2FA) |
| `storageHooks.ts` | Volume and disk hooks |
| `dnsHooks.ts` | DNS record management |
| `useInstanceCreation.ts` | Instance provisioning wizard logic |
| `useInstanceTemplates.ts` | OS/image template selection |
| `useInstanceResources.ts` | vCPU, RAM, storage resource configuration |
| `sharedCalculatorHooks.ts` | Pricing calculator logic |
| `sharedResourceHooks.ts` | Cross-persona resource hooks |
| `networkPresetHooks.ts` | Network preset configurations |
| `useNotifications.ts` | Real-time notification handling |
| `useResponsive.ts` | Responsive breakpoint detection |
| `useBrandingTheme.ts` | Runtime theme application from branding data |

### Admin Hooks (`src/hooks/adminHooks/`)

Over 40 hook files covering: tenants, regions, products, pricing, projects, VMs, providers, credentials, cloud endpoints, policies, payments, tax, onboarding review, provider discovery, Zadara domains, colocation, bandwidth, load balancers, EBS, floating IPs, security groups, and more.

### Tenant Hooks (`src/hooks/tenantHooks/`)

| File | Domain |
|------|--------|
| `partnerHooks.ts` | Partner/sub-tenant management |
| `projectHooks.ts` | Project CRUD |
| `regionHooks.ts` | Region access and requests |
| `tenantPricingHooks.ts` | Pricing override management |
| `leadsHooks.ts` | Lead/prospect tracking |
| `edgeHooks.ts` | Edge location hooks |
| `useTenantCustomerContext.ts` | Customer context resolution |
| `useTenantClientOnboardingState.ts` | Client onboarding status |
| `useTenantSubjectOnboarding.ts` | Subject-based onboarding |

### Client Hooks (`src/hooks/clientHooks/`)

| File | Domain |
|------|--------|
| `instanceHooks.ts` | Client instance CRUD and actions |
| `networkHooks.ts` | VPC, subnets, security groups |
| `productsHooks.ts` | Available product catalogue |
| `projectHooks.tsx` | Client project management |
| `resources.ts` | Resource allocation queries |
| `useClientTheme.ts` | Client-specific theming |

---

## Real-Time Events

The application uses **Laravel Echo** with the **Reverb** broadcaster (WebSocket) for real-time updates. Configuration is in `src/echo.ts`.

Broadcasting hooks:
- `src/hooks/useInstanceBroadcasting.ts` -- Instance status changes
- `src/hooks/useObjectStorageBroadcasting.ts` -- Object storage events
- `src/hooks/useProjectBroadcasting.ts` -- Project provisioning events
- `src/hooks/useTenantBroadcasting.ts` -- Tenant-level events
- `src/hooks/useUserBroadcasting.ts` -- User session events

Authentication for WebSocket channels uses cookie-based auth (`withCredentials: true`) via the `/broadcasting/auth` endpoint.

---

## Directory Structure Overview

```
web/src/
  App.tsx                      # Root component, route composition
  main.tsx                     # Entry point, provider hierarchy
  config.ts                    # API base URLs
  echo.ts                      # Laravel Echo (WebSocket) client
  types/                       # TypeScript interfaces (auth.ts, branding.ts, etc.)
  stores/                      # Zustand auth stores + session utilities
    createAuthStore.ts         # Factory function
    adminAuthStore.ts          # Admin store instance
    tenantAuthStore.ts         # Tenant store instance
    clientAuthStore.ts         # Client store instance
    sessionUtils.ts            # Multi-persona session management
    sidebarStore.ts            # UI sidebar state
  utils/                       # Utility functions
    createApiClient.ts         # API client factories
    authRedirect.ts            # 401/403 redirect handling
    getSubdomain.ts            # Subdomain extraction
    toastUtil.ts               # Toast notification wrapper
    logger.ts                  # Structured logging
    queryProvider.ts           # React Query client setup
  index/                       # API client instances
    api.ts                     # Shared persona-aware client
    silent.ts                  # Silent tenant client
    admin/                     # Admin-scoped clients (9 files)
    tenant/                    # Tenant-scoped clients (4 files)
    client/                    # Client-scoped clients (2 files)
  hooks/                       # React Query hooks
    adminHooks/                # Admin domain hooks (40+ files)
    tenantHooks/               # Tenant domain hooks (9 files)
    clientHooks/               # Client domain hooks (6 files)
    authHooks.ts               # Shared auth hooks
    ...                        # 30+ additional shared hook files
  routes/                      # Route definitions
    PublicRoutes.tsx
    AdminRoutes.tsx
    TenantRoutes.tsx
    ClientRoutes.tsx
    TenantRoute.tsx            # Tenant route guard
    ClientRoute.tsx            # Client route guard
  contexts/                    # React context providers
    ObjectStorageContext.tsx
    StaticMarketingProvider.tsx
    contextprovider.tsx
  adminDashboard/              # Admin UI components and pages
  tenantDashboard/             # Tenant UI components and pages
  clientDashboard/             # Client UI components and pages
  dashboard/                   # Shared dashboard pages (used by tenant)
  pages/                       # Public/marketing pages
  components/                  # Shared UI components
  shared/                      # Shared utilities and components
  services/                    # Service layer integrations
  styles/                      # Global stylesheets
  fonts/                       # Font assets
```
